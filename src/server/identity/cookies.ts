import { createHmac, timingSafeEqual } from 'node:crypto';
import { identityConfig } from '@/server/identity/live';

export const SESSION_COOKIE = 'travelar_session';
export const OIDC_STATE_COOKIE = 'travelar_oidc_state';

function sign(name: string, payload: string): string {
  const { sessionSecret } = identityConfig();
  const mac = createHmac('sha256', sessionSecret).update(`${name}:${payload}`).digest('hex');
  return `${payload}.${mac}`;
}

export function signedCookieValue(name: string, payload: string): string {
  return sign(name, payload);
}

export function readSignedCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie') ?? '';
  const match = header.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  if (!match) return null;
  const value = decodeURIComponent(match.slice(name.length + 1));
  const dot = value.lastIndexOf('.');
  if (dot < 1) return null;
  const payload = value.slice(0, dot);
  const mac = value.slice(dot + 1);
  let expected: string;
  try {
    expected = sign(name, payload);
  } catch {
    return null;
  }
  const presented = Buffer.from(`${payload}.${mac}`);
  const wanted = Buffer.from(expected);
  if (presented.length !== wanted.length || !timingSafeEqual(presented, wanted)) return null;
  return payload;
}

export function cookieHeader(name: string, payload: string, maxAge: number): string {
  const { appEnv } = identityConfig();
  const secure = appEnv === 'production' ? '; Secure' : '';
  const encoded = encodeURIComponent(sign(name, payload));
  return `${name}=${encoded}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function clearCookieHeader(name: string): string {
  const env = (process.env.APP_ENV ?? 'development').toLowerCase();
  const secure = env === 'production' ? '; Secure' : '';
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
