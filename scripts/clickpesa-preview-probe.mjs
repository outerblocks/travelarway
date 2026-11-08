/**
 * Asks ClickPesa what it thinks of our collection request — without collecting.
 *
 *   node scripts/clickpesa-preview-probe.mjs [phone] [amount]
 *
 * `preview-ussd-push-request` validates the amount, the order reference, the phone number
 * and the account's collection methods. It sends no push and moves no money, which makes it
 * the right tool for "the provider keeps rejecting us" — the response says whether it is
 * the phone number, the checksum, the app's COLLECTION feature, or the token.
 *
 * Costs two API calls (token + preview) out of the 100/day pre-KYC budget. Prints the
 * provider's own message; never prints the token or the checksum secret.
 */
import { createHmac } from 'node:crypto';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: ['.env.local', '.env'], quiet: true });

const BASE = 'https://api.clickpesa.com/third-parties';
const phone = process.argv[2] ?? '255712345678';
const amount = process.argv[3] ?? '1000';

const clientId = process.env.CLICKPESA_CLIENT_ID ?? '';
const apiKey = process.env.CLICKPESA_API_KEY ?? '';
const checksumSecret = process.env.CLICKPESA_CHECKSUM_SECRET ?? '';

if (!clientId || !apiKey) {
  console.log(JSON.stringify({ ok: false, reason: 'credentials_missing' }));
  process.exit(1);
}

// Same canonicalisation as the application, written out again on purpose: if the two ever
// disagree, this probe is how we find out.
function canonical(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(canonical);
  return Object.keys(value)
    .sort()
    .reduce((acc, key) => {
      acc[key] = canonical(value[key]);
      return acc;
    }, {});
}

const sign = (payload) => {
  const { checksum, checksumMethod, ...rest } = payload;
  return createHmac('sha256', checksumSecret).update(JSON.stringify(canonical(rest))).digest('hex');
};

const tokenResponse = await fetch(`${BASE}/generate-token`, {
  method: 'POST',
  headers: { 'client-id': clientId, 'api-key': apiKey },
});
const tokenBody = await tokenResponse.json().catch(() => null);
const token = typeof tokenBody?.token === 'string' ? tokenBody.token : '';

if (!tokenResponse.ok || !token) {
  console.log(
    JSON.stringify(
      { ok: false, stage: 'generate-token', status: tokenResponse.status, message: tokenBody?.message ?? null },
      null,
      2,
    ),
  );
  process.exit(1);
}

// A reference that cannot collide with a real attempt.
const orderReference = `PROBE${Date.now()}`.slice(0, 20);
const payload = { amount, currency: 'TZS', orderReference, phoneNumber: phone };
const body = checksumSecret ? { ...payload, checksum: sign(payload) } : payload;

const previewResponse = await fetch(`${BASE}/payments/preview-ussd-push-request`, {
  method: 'POST',
  headers: { authorization: token, 'content-type': 'application/json' },
  body: JSON.stringify(body),
});
const preview = await previewResponse.json().catch(() => null);

const ok = previewResponse.status === 200;

console.log(
  JSON.stringify(
    {
      ok,
      request: { ...payload, checksumSent: Boolean(checksumSecret) },
      response: { status: previewResponse.status, body: preview },
      interpretation: !ok
        ? preview?.message === 'Application has no access to COLLECTION API feature. Enable it on your application.'
          ? 'The ClickPesa application needs the COLLECTION API feature enabled in the dashboard.'
          : previewResponse.status === 401
            ? 'Token rejected. If checksum settings changed recently, tokens minted before the change are invalid — mint a new one.'
            : preview?.message ?? 'See the provider message above.'
        : 'The account can collect: phone, amount and reference were accepted.',
    },
    null,
    2,
  ),
);
if (!ok) process.exitCode = 1;
