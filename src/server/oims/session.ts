import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE = 'travelar_oims_operator';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class OimsSessionUnavailableError extends Error {
  constructor() {
    super('oims_session_unavailable');
  }
}

function appEnv(): string {
  return (process.env.APP_ENV ?? 'development').toLowerCase();
}

function signingKey(): string | null {
  const env = appEnv();
  const secret = process.env.OIMS_SESSION_SECRET?.trim();
  if (env === 'production') return secret && secret.length >= 32 ? secret : null;
  if (secret && secret.length >= 16) return secret;
  return env === 'development' || env === 'test' ? 'travelar-oims-dev-only' : null;
}

function sign(operatorId: string): string {
  const key = signingKey();
  if (!key) throw new OimsSessionUnavailableError();
  const mac = createHmac('sha256', key).update(operatorId).digest('hex');
  return `${operatorId}.${mac}`;
}

export function oimsCookieHeader(operatorId: string): string {
  if (!UUID.test(operatorId)) throw new Error('invalid_operator');
  const value = sign(operatorId);
  const secure = appEnv() === 'production' ? '; Secure' : '';
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200${secure}`;
}

export function operatorIdFromRequest(request: Request): string | null {
  const cookie = request.headers.get('cookie') ?? '';
  const match = cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`));
  if (!match) return null;
  const value = match.slice(COOKIE.length + 1);
  const dot = value.indexOf('.');
  if (dot < 1) return null;
  const operatorId = value.slice(0, dot);
  const mac = value.slice(dot + 1);
  if (!UUID.test(operatorId) || !mac) return null;
  let expected: string;
  try {
    expected = sign(operatorId);
  } catch {
    return null;
  }
  const presented = Buffer.from(`${operatorId}.${mac}`);
  const wanted = Buffer.from(expected);
  if (presented.length !== wanted.length || !timingSafeEqual(presented, wanted)) return null;
  return operatorId;
}
