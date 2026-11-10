const ALLOWED = new Set([
  '/',
  '/operator/bus',
  '/operator/ferry',
  '/hq',
  '/account',
]);

export type AuthIntent = 'passenger' | 'oims' | 'hims';

export function sanitizeReturnTo(raw: string | null, intent: AuthIntent): string {
  const fallback = intent === 'hims' ? '/hq' : intent === 'oims' ? '/operator/bus' : '/';
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\') || raw.includes('://')) {
    return fallback;
  }
  const path = raw.split('?')[0] ?? fallback;
  if (path.startsWith('/hq')) return intent === 'hims' && (ALLOWED.has(path) || path === '/hq') ? path : fallback;
  if (path.startsWith('/operator/bus') || path.startsWith('/operator/ferry')) {
    return intent === 'oims' ? (ALLOWED.has(path) ? path : '/operator/bus') : fallback;
  }
  if (ALLOWED.has(path)) return path;
  return fallback;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function sanitizeLoginHint(raw: string | null): string | undefined {
  const email = raw?.trim().slice(0, 254) ?? '';
  if (!email || !EMAIL.test(email) || email.includes('\n') || email.includes('\r')) return undefined;
  return email;
}

export function parseIntent(raw: string | null): AuthIntent {
  if (raw === 'oims' || raw === 'hims' || raw === 'passenger') return raw;
  return 'passenger';
}
