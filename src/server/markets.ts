/**
 * Point of sale catalogue: markets, sellable modes, payment merchants.
 *
 * Country is not a URL folder. Search uses geography. Collection waits until the
 * merchant row is licensed. Flip `status` to licensed; do not add adapters again.
 */
import type pg from 'pg';
import { query } from '@/server/db';
import { MARKETS } from '@/data/locations';
import type { BookingMode, PaymentMethod } from '@/types';

export type MarketStatus = 'active' | 'planned' | 'licensed' | 'suspended';
export type ModeStatus = 'planned' | 'licensed' | 'suspended';
export type MerchantStatus = 'planned' | 'licensed' | 'suspended';

export interface PaymentMerchantRow {
  id: string;
  providerCode: string;
  countryCode: string;
  currency: string;
  methods: string[];
  status: MerchantStatus;
}

export interface PublicMarket {
  countryCode: string;
  countryName: string;
  currency: string;
  currencySymbol: string;
  status: MarketStatus;
  posLicensed: boolean;
  modes: { mode: BookingMode; status: ModeStatus }[];
  paymentMethods: PaymentMethod[];
  mobileMoneyProviders: string[];
}

const MODE_ORDER: BookingMode[] = ['bus', 'ferry', 'flights', 'train', 'stays', 'experiences'];

export function marketIsCollecting(status: string): boolean {
  return status === 'licensed' || status === 'active';
}

export async function stampBookingPos(
  client: pg.PoolClient,
  bookingId: string,
  operatorId: string,
): Promise<void> {
  await client.query(
    `update app.booking b
        set pos_country = o.country_code,
            market_id = m.id
       from app.operator o
       left join app.market m on m.country_code = o.country_code
      where b.id = $1 and o.id = $2`,
    [bookingId, operatorId],
  );
}

export async function marketIdForCountry(countryCode: string): Promise<string | null> {
  const found = await query<{ id: string }>(
    `select id from app.market where country_code = $1 order by created_at asc limit 1`,
    [countryCode],
  );
  return found.rows[0]?.id ?? null;
}

type Queryable = {
  query: <T extends pg.QueryResultRow = pg.QueryResultRow>(
    text: string,
    values?: unknown[],
  ) => Promise<pg.QueryResult<T>>;
};

export async function resolvePaymentMerchant(
  db: Queryable,
  input: { countryCode: string; currency: string; method: string },
): Promise<PaymentMerchantRow | null> {
  const found = await db.query<{
    id: string;
    provider_code: string;
    country_code: string;
    currency: string;
    methods: string[];
    status: string;
  }>(
    `select id, provider_code, country_code, currency, methods, status
       from app.payment_merchant
      where country_code = $1
        and currency = $2
        and $3 = any(methods)
      order by case status when 'licensed' then 0 when 'planned' then 1 else 2 end,
               provider_code
      limit 1`,
    [input.countryCode.toUpperCase(), input.currency.toUpperCase(), input.method],
  );
  const row = found.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    providerCode: row.provider_code,
    countryCode: row.country_code,
    currency: row.currency,
    methods: row.methods,
    status: row.status as MerchantStatus,
  };
}

export function pickMerchant<T extends { status: string; methods: string[]; providerCode: string }>(
  rows: T[],
  method: string,
): T | null {
  const matches = rows.filter((row) => row.methods.includes(method));
  const licensed = matches.find((row) => row.status === 'licensed');
  if (licensed) return licensed;
  return matches[0] ?? null;
}

export async function listPublicMarkets(): Promise<PublicMarket[]> {
  const markets = await query<{
    country_code: string;
    name: string;
    currency: string;
    status: string;
  }>(
    `select country_code, name, currency, status
       from app.market
      order by country_code`,
  );
  const modes = await query<{ country_code: string; mode: string; status: string }>(
    `select m.country_code, mm.mode, mm.status
       from app.market_mode mm
       join app.market m on m.id = mm.market_id`,
  );
  const merchants = await query<{
    country_code: string;
    currency: string;
    methods: string[];
    status: string;
  }>(
    `select country_code, currency, methods, status from app.payment_merchant`,
  );

  const modesByCountry = new Map<string, { mode: BookingMode; status: ModeStatus }[]>();
  for (const row of modes.rows) {
    const list = modesByCountry.get(row.country_code) ?? [];
    list.push({ mode: row.mode as BookingMode, status: row.status as ModeStatus });
    modesByCountry.set(row.country_code, list);
  }

  return markets.rows.map((market) => {
    const staticMarket = MARKETS[market.country_code];
    const collecting = marketIsCollecting(market.status);
    const licensedMethods = new Set<PaymentMethod>();
    for (const merchant of merchants.rows) {
      if (merchant.country_code !== market.country_code) continue;
      if (merchant.status !== 'licensed') continue;
      for (const method of merchant.methods) {
        if (method === 'mobile_money' || method === 'card' || method === 'coupon') {
          licensedMethods.add(method);
        }
      }
    }
    const modeRows = (modesByCountry.get(market.country_code) ?? []).sort(
      (a, b) => MODE_ORDER.indexOf(a.mode) - MODE_ORDER.indexOf(b.mode),
    );
    return {
      countryCode: market.country_code,
      countryName: staticMarket?.countryName ?? market.name,
      currency: market.currency,
      currencySymbol: staticMarket?.currencySymbol ?? market.currency,
      status: market.status as MarketStatus,
      posLicensed: collecting,
      modes: modeRows,
      paymentMethods: collecting ? [...licensedMethods] : [],
      mobileMoneyProviders: staticMarket?.mobileMoneyProviders ?? [],
    };
  });
}

export async function listPosRegistry() {
  const markets = await query(
    `select m.id, m.code, m.name, m.country_code as "countryCode", m.currency, m.status,
            m.timezone, m.data_plane_code as "dataPlaneCode", m.licensed_at as "licensedAt"
       from app.market m
      order by m.country_code`,
  );
  const modes = await query(
    `select m.country_code as "countryCode", mm.mode, mm.status, mm.note
       from app.market_mode mm
       join app.market m on m.id = mm.market_id
      order by m.country_code, mm.mode`,
  );
  const merchants = await query(
    `select pm.id, m.country_code as "countryCode", pm.provider_code as "providerCode",
            pm.currency, pm.methods, pm.status, pm.collection_enabled as "collectionEnabled",
            pm.payout_enabled as "payoutEnabled", pm.merchant_account_ref as "merchantAccountRef",
            pm.note
       from app.payment_merchant pm
       join app.market m on m.id = pm.market_id
      order by m.country_code, pm.provider_code`,
  );
  return { markets: markets.rows, modes: modes.rows, merchants: merchants.rows };
}
