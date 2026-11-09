import { beforeAll, describe, expect, it } from 'vitest';
import { himsCookieHeader, himsDeskFromRequest } from '@/server/hims/session';
import { requireHq, HimsForbiddenError } from '@/server/hims/http';

beforeAll(() => {
  process.env.APP_ENV = 'test';
});

describe('HIMS desk cookie', () => {
  it('binds finance and admin desks separately', () => {
    const finance = himsCookieHeader('finance').split(';')[0] ?? '';
    const admin = himsCookieHeader('admin').split(';')[0] ?? '';
    expect(himsDeskFromRequest(new Request('http://localhost/hq', { headers: { cookie: finance } }))).toBe('finance');
    expect(himsDeskFromRequest(new Request('http://localhost/hq', { headers: { cookie: admin } }))).toBe('admin');
    expect(() => requireHq(new Request('http://localhost/hq', { headers: { cookie: finance } }), 'admin')).toThrow(HimsForbiddenError);
  });

  it('rejects a forged desk MAC', () => {
    const cookie = (himsCookieHeader('admin').split(';')[0] ?? '').replace(/[0-9a-f]{8}$/, 'aaaaaaaa');
    expect(himsDeskFromRequest(new Request('http://localhost/hq', { headers: { cookie } }))).toBeNull();
  });
});
