import { beforeAll, describe, expect, it } from 'vitest';
import { oimsCookieHeader, operatorIdFromRequest } from '@/server/oims/session';
import { requireOperator } from '@/server/oims/http';
import { OimsForbiddenError } from '@/server/oims/repository';

const OPERATOR = 'a0000000-0000-4000-8000-000000000001';

beforeAll(() => {
  process.env.APP_ENV = 'test';
});

describe('OIMS operator cookie', () => {
  it('accepts a signed cookie and rejects a forged MAC', () => {
    const header = oimsCookieHeader(OPERATOR);
    const cookie = header.split(';')[0] ?? '';
    const request = new Request('http://localhost/api/oims/workspace', { headers: { cookie } });
    expect(operatorIdFromRequest(request)).toBe(OPERATOR);

    const tampered = cookie.replace(/[0-9a-f]{8}$/, 'aaaaaaaa');
    const forged = new Request('http://localhost/api/oims/workspace', { headers: { cookie: tampered } });
    expect(operatorIdFromRequest(forged)).toBeNull();
  });

  it('refuses a request with no operator cookie', () => {
    expect(() => requireOperator(new Request('http://localhost/api/oims/workspace'))).toThrow(OimsForbiddenError);
  });

  it('refuses a claimed operator that does not match the cookie', () => {
    const header = oimsCookieHeader(OPERATOR);
    const cookie = header.split(';')[0] ?? '';
    const request = new Request('http://localhost/api/oims/workspace', { headers: { cookie } });
    expect(() => requireOperator(request, 'b0000000-0000-4000-8000-000000000001')).toThrow(OimsForbiddenError);
  });
});
