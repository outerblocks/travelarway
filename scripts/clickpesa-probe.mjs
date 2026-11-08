/**
 * ClickPesa connectivity probe.
 *
 *   node scripts/clickpesa-probe.mjs
 *
 * Proves the credentials in .env are live without moving money:
 *
 *   1. POST /generate-token with client-id and api-key — 1 API call.
 *   2. GET /payments/<reference we never issued> — 1 API call, expect 404.
 *
 * Two calls, not a collection. Pre-KYC accounts are limited to 100 calls a day including
 * token generation, so this script deliberately does nothing else and prints no token.
 *
 * A 200 on step 2 would be alarming: it would mean a reference we never created exists.
 * Their OpenAPI documents 404 for an unknown reference, but the live API answers 400 with
 * "Invalid or missing payment" — that is the not-found case, and the adapter treats it as
 * "still pending" rather than an error. A 401 on either step means the credentials are
 * wrong, or a token was minted while checksum settings changed.
 */
import { config as loadEnv } from 'dotenv';

loadEnv({ path: ['.env.local', '.env'], quiet: true });

const BASE = 'https://api.clickpesa.com/third-parties';

const clientId = process.env.CLICKPESA_CLIENT_ID ?? '';
const apiKey = process.env.CLICKPESA_API_KEY ?? '';

if (!clientId || !apiKey) {
  console.log(JSON.stringify({ ok: false, reason: 'credentials_missing' }));
  process.exit(1);
}

const tokenResponse = await fetch(`${BASE}/generate-token`, {
  method: 'POST',
  headers: { 'client-id': clientId, 'api-key': apiKey },
});

const tokenBody = await tokenResponse.json().catch(() => null);
const token = typeof tokenBody?.token === 'string' ? tokenBody.token : '';

if (!tokenResponse.ok || !token) {
  console.log(
    JSON.stringify(
      {
        ok: false,
        stage: 'generate-token',
        status: tokenResponse.status,
        // The message only; never the body, which may echo credentials.
        message: tokenBody?.message ?? null,
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

// A reference that cannot exist: timestamp-based, alphanumeric, within their 20-char limit.
const probeReference = `PROBE${Date.now()}`.slice(0, 20);
const statusResponse = await fetch(`${BASE}/payments/${probeReference}`, {
  headers: { authorization: token },
});
const statusBody = await statusResponse.json().catch(() => null);

// 404 is what their spec says; 400 "Invalid or missing payment" is what the live API does.
const notFound =
  statusResponse.status === 404 ||
  (statusResponse.status === 400 &&
    typeof statusBody?.message === 'string' &&
    statusBody.message.toLowerCase().includes('invalid or missing payment'));

const ok = tokenResponse.status === 200 && notFound;

console.log(
  JSON.stringify(
    {
      ok,
      stage: 'authenticated',
      token: {
        received: true,
        // Length only: the token is a bearer credential and must never be echoed.
        length: token.length,
        hasBearerPrefix: token.startsWith('Bearer '),
      },
      statusQuery: {
        reference: probeReference,
        status: statusResponse.status,
        message: statusBody?.message ?? null,
        interpretedAs: notFound ? 'unknown_reference' : 'unexpected',
      },
      expectation: '200 for the token, 404 or 400-not-found for an unknown reference',
    },
    null,
    2,
  ),
);
if (!ok) process.exitCode = 1;
