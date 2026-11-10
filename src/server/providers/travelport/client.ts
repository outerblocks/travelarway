import { circuitFor } from '@/server/circuit-breaker';
import { assertRequestReady, readTravelportConfig, type TravelportConfig } from '@/server/travelport/config';
import { getTravelportToken } from '@/server/providers/travelport/auth';
import { errorsFromBody, type TravelportError } from '@/server/providers/travelport/errors';

const TRAVELPORT_TIMEOUT_MS = 12_000;
const TRAVELPORT_CIRCUIT = 'travelport';

export type TravelportProduct = 'air' | 'hotel';

export interface TravelportHttpResult {
  httpStatus: number;
  body: unknown;
  errors: TravelportError[];
}

export async function travelportJson(
  product: TravelportProduct,
  path: string,
  body: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<TravelportHttpResult> {
  return travelportRequest(product, path, {
    method: 'POST',
    body: JSON.stringify(body),
  }, fetchImpl);
}

export async function travelportGet(
  product: TravelportProduct,
  path: string,
  fetchImpl: typeof fetch = fetch,
): Promise<TravelportHttpResult> {
  return travelportRequest(product, path, { method: 'GET' }, fetchImpl);
}

async function travelportRequest(
  product: TravelportProduct,
  path: string,
  init: { method: 'GET' | 'POST'; body?: string },
  fetchImpl: typeof fetch,
): Promise<TravelportHttpResult> {
  const config = readTravelportConfig();
  if (!config) throw new Error('travelport_disabled');
  assertRequestReady(config);

  const circuit = circuitFor(TRAVELPORT_CIRCUIT);
  if (!circuit.allow()) {
    return {
      httpStatus: 503,
      body: null,
      errors: [{ message: 'circuit_open', sourceCode: 'circuit_open', category: 'TERMINAL' }],
    };
  }

  const base = product === 'air' ? config.flightsBaseUrl : config.staysV11BaseUrl;
  const url = `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  const accessGroup = config.accessGroup || config.pcc || '';

  let response: Response;
  try {
    const token = await getTravelportToken(config, fetchImpl);
    response = await fetchImpl(url, {
      method: init.method,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'cache-control': 'no-cache',
        authorization: `Bearer ${token}`,
        'Accept-Version': '11',
        'Content-Version': '11',
        Accept: 'application/json',
        XAUTH_TRAVELPORT_ACCESSGROUP: accessGroup,
      },
      body: init.body,
      cache: 'no-store',
      signal: AbortSignal.timeout(TRAVELPORT_TIMEOUT_MS),
    });
  } catch {
    circuit.failure();
    return {
      httpStatus: 504,
      body: null,
      errors: [{ message: 'timeout', sourceCode: 'timeout', category: 'TERMINAL' }],
    };
  }

  if (response.status >= 500) circuit.failure();
  else circuit.success();

  const text = await response.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { unparsed: true };
  }

  return {
    httpStatus: response.status,
    body: parsed,
    errors: errorsFromBody(parsed),
  };
}

export function travelportConfig(): TravelportConfig | null {
  return readTravelportConfig();
}
