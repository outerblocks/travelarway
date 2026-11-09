import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE = 'travelar_hims_desk';
export type HimsDesk = 'finance' | 'admin';

export class HimsSessionUnavailableError extends Error {
  constructor() {
    super('hims_session_unavailable');
  }
}

function appEnv(): string {
  return (process.env.APP_ENV ?? 'development').toLowerCase();
}

function signingKey(): string | null {
  const env = appEnv();
  const secret = process.env.HIMS_SESSION_SECRET?.trim();
  if (env === 'production') return secret && secret.length >= 32 ? secret : null;
  if (secret && secret.length >= 16) return secret;
  return env === 'development' || env === 'test' ? 'travelar-hims-dev-only' : null;
}

function sign(desk: HimsDesk): string {
  const key = signingKey();
  if (!key) throw new HimsSessionUnavailableError();
  const mac = createHmac('sha256', key).update(desk).digest('hex');
  return `${desk}.${mac}`;
}

export function himsCookieHeader(desk: HimsDesk): string {
  const value = sign(desk);
  const secure = appEnv() === 'production' ? '; Secure' : '';
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200${secure}`;
}

export function himsDeskFromRequest(request: Request): HimsDesk | null {
  const cookie = request.headers.get('cookie') ?? '';
  const match = cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`));
  if (!match) return null;
  const value = match.slice(COOKIE.length + 1);
  const desk = value.split('.')[0];
  if (desk !== 'finance' && desk !== 'admin') return null;
  let expected: string;
  try {
    expected = sign(desk);
  } catch {
    return null;
  }
  const presented = Buffer.from(value);
  const wanted = Buffer.from(expected);
  if (presented.length !== wanted.length || !timingSafeEqual(presented, wanted)) return null;
  return desk;
}
