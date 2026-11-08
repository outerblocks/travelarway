import { describe, expect, it, vi } from 'vitest';
import { verifyChecksum } from './checksum';
import {
  ClickPesaProvider,
  getPaymentProvider,
  PaymentNotEnabledError,
  UnsupportedCurrencyError,
} from './clickpesa';

/**
 * Wire-format tests.
 *
 * These pin the requests against ClickPesa's published OpenAPI: endpoint path, the fields
 * each endpoint requires, and the checksum. A stub fetch means no call leaves the process
 * and no money moves — which is the only way to test a provider with no sandbox.
 */
const CHECKSUM_SECRET = 'test-checksum-secret';

type Call = { url: string; body: Record<string, unknown> | null; headers: Record<string, string> };

function makeProvider(responder: (call: Call) => { status: number; body: unknown }) {
  const calls: Call[] = [];

  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const body =
      typeof init?.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : null;
    const call: Call = { url, body, headers: (init?.headers ?? {}) as Record<string, string> };
    calls.push(call);

    // Every instance mints one token first; keep that out of the assertions.
    if (url.endsWith('/generate-token')) {
      return { ok: true, status: 200, json: async () => ({ success: true, token: 'Bearer test' }) };
    }

    const { status, body: payload } = responder(call);
    return { ok: status < 400, status, json: async () => payload };
  }) as unknown as typeof fetch;

  const provider = new ClickPesaProvider({
    clientId: 'client',
    apiKey: 'key',
    checksumSecret: CHECKSUM_SECRET,
    live: true,
    fetchImpl,
  });

  return { provider, calls };
}

const businessCalls = (calls: Call[]) => calls.filter((call) => !call.url.endsWith('/generate-token'));

describe('ClickPesa USSD push', () => {
  it('posts the documented body and signs it', async () => {
    const { provider, calls } = makeProvider(() => ({
      status: 200,
      body: { id: 'ORD1', status: 'PROCESSING', orderReference: 'TRVABC12301' },
    }));

    const result = await provider.initiateCollection({
      orderReference: 'TRVABC12301',
      amountMinor: 58000,
      currency: 'TZS',
      phoneNumber: '+255712345678',
    });

    const [call] = businessCalls(calls);
    expect(call.url).toContain('/payments/initiate-ussd-push-request');
    expect(call.body).toMatchObject({
      amount: '58000',
      currency: 'TZS',
      orderReference: 'TRVABC12301',
      // Their docs: country code, no plus sign.
      phoneNumber: '255712345678',
    });
    // The checksum is computed over the body without the checksum field itself.
    expect(verifyChecksum(CHECKSUM_SECRET, call.body as Record<string, unknown>)).toBe(true);
    expect(typeof call.body?.checksum).toBe('string');

    expect(result.providerReference).toBe('ORD1');
    expect(result.status).toBe('processing');
  });

  it('maps SUCCESS to paid, not settled', async () => {
    const { provider } = makeProvider(() => ({ status: 200, body: { id: 'ORD2', status: 'SUCCESS' } }));
    const result = await provider.initiateCollection({
      orderReference: 'TRVABC12301',
      amountMinor: 1000,
      currency: 'TZS',
      phoneNumber: '255712345678',
    });
    expect(result.status).toBe('paid');
  });

  it('refuses to call anything when live is off', async () => {
    const fetchImpl = vi.fn();
    const provider = new ClickPesaProvider({
      clientId: 'client',
      apiKey: 'key',
      live: false,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await expect(
      provider.initiateCollection({
        orderReference: 'X1',
        amountMinor: 1,
        currency: 'TZS',
        phoneNumber: '255712345678',
      }),
    ).rejects.toBeInstanceOf(PaymentNotEnabledError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('ClickPesa preview', () => {
  it('asks the preview endpoint and reports fees and availability', async () => {
    const { provider, calls } = makeProvider(() => ({
      status: 200,
      body: {
        activeMethods: [
          { name: 'M-PESA', status: 'AVAILABLE', fee: 1200 },
          { name: 'TIGO-PESA', status: 'UNAVAILABLE', message: 'channel down' },
        ],
        sender: { accountName: 'Jane Doe', accountNumber: '255712345678', accountProvider: 'M-PESA' },
      },
    }));

    const preview = await provider.previewCollection({
      orderReference: 'TRVABC12301',
      amountMinor: 58000,
      currency: 'TZS',
      phoneNumber: '255712345678',
    });

    const [call] = businessCalls(calls);
    expect(call.url).toContain('/payments/preview-ussd-push-request');
    expect(verifyChecksum(CHECKSUM_SECRET, call.body as Record<string, unknown>)).toBe(true);

    expect(preview.methods).toEqual([
      { name: 'M-PESA', available: true, fee: 1200, message: null },
      { name: 'TIGO-PESA', available: false, fee: null, message: 'channel down' },
    ]);
    expect(preview.sender).toEqual({
      name: 'Jane Doe',
      number: '255712345678',
      provider: 'M-PESA',
    });
  });
});

describe('ClickPesa card', () => {
  it('returns the hosted link for a USD payment', async () => {
    const { provider, calls } = makeProvider(() => ({
      status: 200,
      body: { cardPaymentLink: 'https://pay.clickpesa.com/abc' },
    }));

    const result = await provider.initiateCardPayment({
      orderReference: 'TRVABC12301',
      amountMinor: 120,
      currency: 'USD',
      customer: { fullName: 'Jane Doe', email: 'jane@example.com', phoneNumber: '+255712345678' },
    });

    const [call] = businessCalls(calls);
    expect(call.url).toContain('/payments/initiate-card-payment');
    expect(call.body).toMatchObject({
      amount: '120',
      currency: 'USD',
      orderReference: 'TRVABC12301',
      customer: {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        phoneNumber: '255712345678',
      },
    });
    expect(verifyChecksum(CHECKSUM_SECRET, call.body as Record<string, unknown>)).toBe(true);
    expect(result.redirectUrl).toBe('https://pay.clickpesa.com/abc');
  });

  it('refuses a non-USD fare without calling the provider', async () => {
    const { provider, calls } = makeProvider(() => ({ status: 200, body: {} }));

    await expect(
      provider.initiateCardPayment({
        orderReference: 'TRVABC12301',
        amountMinor: 58000,
        currency: 'TZS',
        customer: { fullName: 'Jane Doe', email: 'j@e.com', phoneNumber: '255712345678' },
      }),
    ).rejects.toBeInstanceOf(UnsupportedCurrencyError);

    expect(businessCalls(calls)).toHaveLength(0);
  });
});

describe('ClickPesa provider lifecycle', () => {
  it('is one instance per process, so the hour-long token is not re-minted per request', () => {
    // Minting a token per request produced `429 Too many token requests` under real
    // traffic: the cache lived on an object that was thrown away each time.
    expect(getPaymentProvider()).toBe(getPaymentProvider());
    // Tests still get an isolated instance when they inject a fetch.
    const injected = getPaymentProvider((async () => ({}) as Response) as typeof fetch);
    expect(injected).not.toBe(getPaymentProvider());
  });

  it('reports a throttled token as rate-limited, not as a provider fault', async () => {
    const fetchImpl = (async () => ({
      ok: false,
      status: 429,
      json: async () => ({ message: 'Too many token requests. Try again in 66 seconds.' }),
    })) as unknown as typeof fetch;

    const provider = new ClickPesaProvider({ clientId: 'c', apiKey: 'k', live: true, fetchImpl });

    await expect(
      provider.initiateCollection({
        orderReference: 'X1',
        amountMinor: 1000,
        currency: 'TZS',
        phoneNumber: '255712345678',
      }),
    ).rejects.toMatchObject({ name: 'Error', retryAfterSeconds: 66 });
  });
});

describe('ClickPesa status query', () => {
  it('uses the documented path and takes the latest row from the array', async () => {
    const { provider, calls } = makeProvider(() => ({
      status: 200,
      body: [
        { status: 'PENDING', id: 'first' },
        { status: 'SUCCESS', paymentReference: 'LATEST' },
      ],
    }));

    const result = await provider.getCollectionStatus('TRVABC12301');

    const [call] = businessCalls(calls);
    expect(call.url).toMatch(/\/payments\/TRVABC12301$/);
    expect(result.status).toBe('paid');
    expect(result.providerReference).toBe('LATEST');
  });

  it('treats their 400 as "not seen yet", not as a failure', async () => {
    const { provider } = makeProvider(() => ({
      status: 400,
      body: { message: 'Invalid or missing payment:  TRVABC12301' },
    }));

    const result = await provider.getCollectionStatus('TRVABC12301');
    expect(result.status).toBe('pending');
    expect(result.providerReference).toBeNull();
  });
});
