/**
 * Shared fixed-window counters for rate limits.
 *
 * One connection, commands run one at a time. Each hit is a MULTI/EXEC
 * transaction: INCR plus EXPIRE, written in one round trip. EXPIRE runs on
 * every hit, so a key that missed its TTL (the process died between the two
 * commands) is repaired by the next increment in that window.
 *
 * Connect and command waits are bounded. A Redis that never accepts does not
 * hold a checkout request until the operating system gives up on TCP.
 * `rediss://` and the username/password in REDIS_URL are honored.
 */
import net from 'node:net';
import tls from 'node:tls';
import { log } from '@/server/log';
import type { RateLimitDecision, RateLimitRule } from '@/server/rate-limit';

const CONNECT_TIMEOUT_MS = 400;
const COMMAND_TIMEOUT_MS = 400;

export interface RedisEndpoint {
  host: string;
  port: number;
  tls: boolean;
  database: number;
  username?: string;
  password?: string;
}

export function redisEndpoint(url: string): RedisEndpoint {
  const parsed = new URL(url);
  if (parsed.protocol !== 'redis:' && parsed.protocol !== 'rediss:') {
    throw new Error('redis_url');
  }
  const database = parsed.pathname.length > 1 ? Number(parsed.pathname.slice(1)) : 0;
  if (!Number.isInteger(database) || database < 0) throw new Error('redis_url');
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 6379),
    tls: parsed.protocol === 'rediss:',
    database,
    username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
  };
}

/** Key shape: travelar:rl:{bucket}:{client}:{window}. One key, so no hash tag. */
export function rateLimitKey(bucketKey: string, windowId: number): string {
  return `travelar:rl:${bucketKey}:${windowId}`;
}

/** INCR and EXPIRE commit together. A lone INCR would leave a key with no TTL. */
export function rateLimitCommands(key: string, ttlSec: number): string[][] {
  return [['MULTI'], ['INCR', key], ['EXPIRE', key, String(ttlSec)], ['EXEC']];
}

/**
 * EXEC replies with the INCR integer and the EXPIRE integer.
 * Lines before the array header are +OK and +QUEUED.
 */
export function countFromTransaction(lines: string[]): number {
  const marker = lines.indexOf('*2');
  const countLine = lines[marker + 1];
  const expireLine = lines[marker + 2];
  if (marker < 0 || !countLine?.startsWith(':') || !expireLine?.startsWith(':')) {
    throw new Error('redis_unexpected');
  }
  return Number(countLine.slice(1));
}

type Waiter = {
  onLine: (line: string) => void;
  onError: (error: Error) => void;
};

export class RedisWindowStore {
  private readonly endpoint: RedisEndpoint;
  private socket: net.Socket | null = null;
  private connecting: Promise<net.Socket> | null = null;
  private buffer = Buffer.alloc(0);
  private waiters: Waiter[] = [];
  private pending: Promise<void> = Promise.resolve();

  constructor(url: string) {
    this.endpoint = redisEndpoint(url);
    warnIfInsecure(this.endpoint);
  }

  async check(key: string, rule: RateLimitRule): Promise<RateLimitDecision> {
    const windowMs = rule.windowMs;
    const windowId = Math.floor(Date.now() / windowMs);
    const redisKey = rateLimitKey(key, windowId);
    const ttlSec = Math.max(1, Math.ceil(windowMs / 1000) + 1);
    const count = await this.incrExpire(redisKey, ttlSec);
    const allowed = count <= rule.limit;
    return {
      allowed,
      limit: rule.limit,
      remaining: Math.max(0, rule.limit - count),
      retryAfterSeconds: allowed ? 0 : ttlSec,
    };
  }

  private incrExpire(key: string, ttlSec: number): Promise<number> {
    return this.exclusive(async () => {
      const socket = await this.connect();
      const lines = await this.readLines(socket, rateLimitCommands(key, ttlSec), 6);
      return countFromTransaction(lines);
    });
  }

  /** One multi-reply command at a time, so reply lines cannot cross commands. */
  private exclusive<T>(work: () => Promise<T>): Promise<T> {
    const run = this.pending.then(work, work);
    this.pending = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private async connect(): Promise<net.Socket> {
    if (this.socket && !this.socket.destroyed) return this.socket;
    if (this.connecting) return this.connecting;

    const endpoint = this.endpoint;
    const self = this;
    this.connecting = new Promise<net.Socket>((resolve, reject) => {
      let settled = false;
      const socket = openSocket(endpoint);
      const timer = setTimeout(() => fail(new Error('redis_timeout')), CONNECT_TIMEOUT_MS);

      function fail(error: Error) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        self.socket = null;
        self.connecting = null;
        self.failWaiters(error);
        socket.destroy();
        reject(error);
      }

      const ready = () => {
        void this.handshake(socket, endpoint).then(
          () => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            this.socket = socket;
            this.connecting = null;
            resolve(socket);
          },
          fail,
        );
      };

      socket.setEncoding('utf8');
      socket.on('data', (chunk: string) => {
        this.buffer = Buffer.concat([this.buffer, Buffer.from(chunk)]);
        this.drain();
      });
      const abandoned = () => settled && self.socket !== socket;

      socket.on('error', (error) => {
        if (abandoned()) return;
        log('warn', 'redis_error', { message: error.message });
        if (self.socket === socket) self.socket = null;
        self.failWaiters(error);
        if (!settled) fail(error);
      });
      socket.on('close', () => {
        if (abandoned()) return;
        if (self.socket === socket) self.socket = null;
        self.failWaiters(new Error('redis_closed'));
        if (!settled) fail(new Error('redis_closed'));
      });
      socket.once(endpoint.tls ? 'secureConnect' : 'connect', ready);
    });

    return this.connecting;
  }

  private async handshake(socket: net.Socket, endpoint: RedisEndpoint): Promise<void> {
    if (endpoint.password) {
      const args = endpoint.username
        ? ['AUTH', endpoint.username, endpoint.password]
        : ['AUTH', endpoint.password];
      const line = (await this.readLines(socket, [args], 1))[0];
      if (!line?.startsWith('+OK')) throw new Error('redis_auth_failed');
    }
    if (endpoint.database > 0) {
      const line = (await this.readLines(socket, [['SELECT', String(endpoint.database)]], 1))[0];
      if (!line?.startsWith('+OK')) throw new Error('redis_select_failed');
    }
  }

  private readLines(socket: net.Socket, commands: string[][], expected: number): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const lines: string[] = [];
      let done = false;
      const finish = (error?: Error) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        if (error) reject(error);
        else resolve(lines);
      };
      const waiter: Waiter = {
        onLine: (line) => {
          lines.push(line);
          if (lines.length < expected) {
            this.waiters.push(waiter);
            return;
          }
          finish();
        },
        onError: (error) => finish(error),
      };
      const timer = setTimeout(() => {
        this.waiters = this.waiters.filter((item) => item !== waiter);
        this.socket = null;
        socket.destroy();
        finish(new Error('redis_timeout'));
      }, COMMAND_TIMEOUT_MS);

      this.waiters.push(waiter);
      try {
        socket.write(Buffer.concat(commands.map((args) => encodeResp(args))));
      } catch (error) {
        this.waiters = this.waiters.filter((item) => item !== waiter);
        finish(error as Error);
      }
    });
  }

  private failWaiters(error: Error): void {
    const pending = this.waiters;
    this.waiters = [];
    for (const waiter of pending) waiter.onError(error);
  }

  private drain(): void {
    const text = this.buffer.toString('utf8');
    const parts = text.split('\r\n');
    this.buffer = Buffer.from(parts.pop() ?? '', 'utf8');
    for (const line of parts) {
      if (!line) continue;
      const waiter = this.waiters.shift();
      waiter?.onLine(line);
    }
  }
}

function openSocket(endpoint: RedisEndpoint): net.Socket {
  const socket = endpoint.tls
    ? tls.connect({
        host: endpoint.host,
        port: endpoint.port,
        servername: endpoint.host,
      })
    : net.connect({ host: endpoint.host, port: endpoint.port });
  socket.unref();
  return socket;
}

function warnIfInsecure(endpoint: RedisEndpoint): void {
  if (process.env.NODE_ENV !== 'production') return;
  const loopback = endpoint.host === 'localhost' || endpoint.host === '127.0.0.1' || endpoint.host === '::1';
  if (endpoint.password && (endpoint.tls || loopback)) return;
  log('warn', 'redis_insecure', {
    tls: endpoint.tls,
    authenticated: Boolean(endpoint.password),
  });
}

function encodeResp(args: string[]): Buffer {
  let out = `*${args.length}\r\n`;
  for (const arg of args) {
    const buf = Buffer.from(arg, 'utf8');
    out += `$${buf.length}\r\n${arg}\r\n`;
  }
  return Buffer.from(out, 'utf8');
}

let redisStore: RedisWindowStore | null = null;

export function getRedisWindowStore(url: string): RedisWindowStore {
  redisStore ??= new RedisWindowStore(url);
  return redisStore;
}
