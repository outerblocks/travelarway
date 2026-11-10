import { afterEach, describe, expect, it } from 'vitest';
import { guardMutation, isCrossOrigin } from '@/server/request-guard';

const post = (headers: Record<string, string>) =>
  new Request('https://travelar.co.tz/api/holds', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
  });

afterEach(() => {
  delete process.env.ALLOWED_ORIGINS;
  delete process.env.APP_PUBLIC_ORIGIN;
  delete process.env.APP_ENV;
});

describe('isCrossOrigin', () => {
  it('allows same-origin browser requests', () => {
    expect(isCrossOrigin(post({ origin: 'https://travelar.co.tz', host: 'travelar.co.tz' }))).toBe(false);
  });

  it('does not treat a spoofed X-Forwarded-Host as same-origin', () => {
    expect(
      isCrossOrigin(
        post({
          origin: 'https://evil.example',
          host: 'travelar.co.tz',
          'x-forwarded-host': 'evil.example',
        }),
      ),
    ).toBe(true);
  });

  it('uses APP_PUBLIC_ORIGIN when the process sits behind an internal Host', () => {
    process.env.APP_PUBLIC_ORIGIN = 'https://travelar.co.tz';
    expect(isCrossOrigin(post({ origin: 'https://travelar.co.tz', host: '127.0.0.1:3000' }))).toBe(
      false,
    );
    expect(isCrossOrigin(post({ origin: 'https://evil.example', host: '127.0.0.1:3000' }))).toBe(
      true,
    );
  });

  it('refuses another site', () => {
    expect(isCrossOrigin(post({ origin: 'https://evil.example', host: 'travelar.co.tz' }))).toBe(true);
  });

  it('refuses opaque and malformed origins', () => {
    expect(isCrossOrigin(post({ origin: 'null', host: 'travelar.co.tz' }))).toBe(true);
    expect(isCrossOrigin(post({ origin: 'not a url', host: 'travelar.co.tz' }))).toBe(true);
  });

  it('lets non-browser callers without an Origin through', () => {
    expect(isCrossOrigin(post({ host: 'travelar.co.tz' }))).toBe(false);
  });

  it('accepts explicitly configured origins', () => {
    process.env.ALLOWED_ORIGINS = 'https://staging.travelar.co.tz/';
    expect(isCrossOrigin(post({ origin: 'https://staging.travelar.co.tz', host: 'travelar.co.tz' }))).toBe(false);
  });
});

describe('guardMutation', () => {
  it('answers 403 for a cross-site request before counting it against the rate limit', async () => {
    const refused = await guardMutation(post({ origin: 'https://evil.example', host: 'travelar.co.tz' }), 'holds');
    expect(refused?.status).toBe(403);
    expect(await refused?.json()).toEqual({ error: 'cross_origin_forbidden' });
  });

  it('returns null for an allowed same-origin request', async () => {
    expect(
      await guardMutation(
        post({ origin: 'https://travelar.co.tz', host: 'travelar.co.tz', 'x-forwarded-for': '192.0.2.44' }),
        'holds',
      ),
    ).toBeNull();
  });

  it('refuses a non-JSON body on mutations', async () => {
    const refused = await guardMutation(
      new Request('https://travelar.co.tz/api/holds', {
        method: 'POST',
        headers: { origin: 'https://travelar.co.tz', host: 'travelar.co.tz', 'content-type': 'text/plain' },
      }),
      'holds',
    );
    expect(refused?.status).toBe(415);
    expect(await refused?.json()).toEqual({ error: 'invalid_content_type' });
  });

  it('requires Origin in production', async () => {
    process.env.APP_ENV = 'production';
    process.env.APP_PUBLIC_ORIGIN = 'https://travelar.co.tz';
    const refused = await guardMutation(post({ host: 'travelar.co.tz' }), 'holds');
    expect(refused?.status).toBe(403);
    expect(await refused?.json()).toEqual({ error: 'origin_required' });
  });
});

