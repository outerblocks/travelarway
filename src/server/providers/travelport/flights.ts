import { randomUUID } from 'node:crypto';
import { withTransaction } from '@/server/db';
import { CapabilityRefusedError, assertRunnable } from '@/server/providers/registry';
import type {
  AdapterResult,
  AirSearchRequest,
  CanonicalAirOffer,
  CanonicalAirSegment,
  FlightSupplierAdapter,
  ProviderOperationMeta,
} from '@/server/providers/types';
import { travelportConfig, travelportJson } from '@/server/providers/travelport/client';
import { asArray, asRecord } from '@/server/providers/travelport/errors';
import { airlineName, cabinLabel, isKnownAirlineName } from '@/server/reference/iata-display';
import type { TravelportConfig } from '@/server/travelport/config';

const PRODUCT = 'flights-v11';

export const travelportFlightAdapter: FlightSupplierAdapter = {
  providerId: 'travelport',
  productId: PRODUCT,

  async search(request, meta): Promise<AdapterResult<CanonicalAirOffer[]>> {
    const config = travelportConfig();
    if (!config) {
      return { outcome: 'unsupported', meta, errorCode: 'travelport_disabled', safeMessage: 'Flights are not available.' };
    }

    try {
      await assertRunnable({
        provider: 'travelport',
        product: PRODUCT,
        operation: 'search',
        environment: config.environment,
      });
    } catch (error) {
      if (error instanceof CapabilityRefusedError) {
        return { outcome: 'unsupported', meta, errorCode: 'capability_unavailable', safeMessage: 'Flights are not available.' };
      }
      throw error;
    }

    const payload = buildAirCatalogRequest(request, config);

    const result = await travelportJson('air', 'catalog/search/catalogproductofferings', payload);
    if (result.errors.length) {
      return {
        outcome: result.errors.some((item) => item.category === 'TERMINAL') ? 'rejected' : 'retryable_failure',
        meta: { ...meta, providerRequestId: transactionIdOf(result.body) },
        errorCode: result.errors[0]?.sourceCode ?? 'travelport_search_failed',
        safeMessage: 'No flights are available for this search.',
      };
    }
    if (result.httpStatus < 200 || result.httpStatus >= 300) {
      return {
        outcome: 'retryable_failure',
        meta,
        errorCode: `http_${result.httpStatus}`,
        safeMessage: 'No flights are available for this search.',
      };
    }

    const offers = normalizeAirSearch(result.body, meta);
    const persisted = await persistAirSearch(request, config, result.body, offers, transactionIdOf(result.body));
    return {
      outcome: 'success',
      data: persisted,
      meta: { ...meta, providerRequestId: transactionIdOf(result.body) },
    };
  },
};

export function buildAirCatalogRequest(request: AirSearchRequest, config: TravelportConfig) {
  const contentSourceList = request.contentSources?.length ? request.contentSources : config.contentSources;
  const body: Record<string, unknown> = {
    '@type': 'CatalogProductOfferingsQueryRequest',
    CatalogProductOfferingsRequest: {
      '@type': 'CatalogProductOfferingsRequestAir',
      contentSourceList,
      PassengerCriteria: passengerCriteria(request),
      SearchCriteriaFlight: searchLegs(request),
      ...carrierModifiers(config),
    },
  };
  return body;
}

function carrierModifiers(config: TravelportConfig): Record<string, unknown> {
  if (!config.carrierPreferenceType) return {};
  const carriers = [...new Set([
    ...(config.contentSources.includes('GDS') ? config.gdsCarriers : []),
    ...(config.contentSources.includes('NDC') ? config.ndcCarriers : []),
  ])];
  if (!carriers.length) return {};
  return {
    SearchModifiersAir: {
      '@type': 'SearchModifiersAir',
      CarrierPreference: [{
        '@type': 'CarrierPreference',
        preferenceType: config.carrierPreferenceType,
        carriers,
      }],
    },
  };
}

function passengerCriteria(request: AirSearchRequest) {
  const rows: { '@type': string; number: number; passengerTypeCode: string }[] = [];
  if (request.adults > 0) rows.push({ '@type': 'PassengerCriteria', number: request.adults, passengerTypeCode: 'ADT' });
  if (request.children > 0) rows.push({ '@type': 'PassengerCriteria', number: request.children, passengerTypeCode: 'CHD' });
  if (request.infants > 0) rows.push({ '@type': 'PassengerCriteria', number: request.infants, passengerTypeCode: 'INF' });
  return rows.length ? rows : [{ '@type': 'PassengerCriteria', number: 1, passengerTypeCode: 'ADT' }];
}

function searchLegs(request: AirSearchRequest) {
  const outbound = {
    '@type': 'SearchCriteriaFlight',
    departureDate: request.departureDate,
    From: { value: request.originCode },
    To: { value: request.destinationCode },
  };
  if (!request.returnDate) return [outbound];
  return [
    outbound,
    {
      '@type': 'SearchCriteriaFlight',
      departureDate: request.returnDate,
      From: { value: request.destinationCode },
      To: { value: request.originCode },
    },
  ];
}

export function normalizeAirSearch(body: unknown, meta: ProviderOperationMeta): CanonicalAirOffer[] {
  const root = asRecord(body) ?? {};
  const response = asRecord(root.CatalogProductOfferingsResponse) ?? root;
  const offeringsWrap = asRecord(response.CatalogProductOfferings) ?? response;
  const offerings = asArray(offeringsWrap.CatalogProductOffering);
  const lists = asArray(response.ReferenceList);
  const flights = indexById(collectTyped(lists, 'ReferenceListFlight', 'Flight'));
  const products = indexById(collectTyped(lists, 'ReferenceListProduct', 'Product'));
  const brands = indexById(collectTyped(lists, 'ReferenceListBrand', 'Brand'));
  const terms = indexById(collectTyped(lists, 'ReferenceListTermsAndConditions', 'TermsAndConditions'));

  return offerings.flatMap((raw, sequence) => {
    const offering = asRecord(raw);
    if (!offering) return [];
    const offerRef = String(offering.id ?? offering.Identifier ?? `offering_${sequence}`);
    const brandOptions = asArray(offering.ProductBrandOptions);
    if (brandOptions.length) {
      return brandOptions.flatMap((optionRaw, optionIndex) => {
        const option = asRecord(optionRaw) ?? {};
        const optionFlightRefs = asArray(option.flightRefs).map(String).filter(Boolean);
        return asArray(option.ProductBrandOffering).flatMap((fareRaw, fareIndex) => {
          const fare = asRecord(fareRaw);
          if (!fare) return [];
          const productRefs = collectRefs(fare.Product ?? fare.productRef ?? fare.ProductRef, 'productRef');
          const firstProduct = products.get(productRefs[0] ?? '');
          const flightRefs = optionFlightRefs.length
            ? optionFlightRefs
            : productFlightRefs(firstProduct);
          const itinerary = flightRefs
            .map((ref) => segmentFromFlight(flights.get(ref)))
            .filter((item): item is CanonicalAirSegment => Boolean(item));
          if (!itinerary.length) return [];

          const brandRef = collectRefs(fare.Brand ?? offering.Brand ?? fare.BrandRef, 'BrandRef')[0] ?? '';
          const termsRef = collectRefs(fare.TermsAndConditions ?? fare.termsAndConditionsRef, 'termsAndConditionsRef')[0] ?? '';
          const brand = brands.get(brandRef);
          const term = terms.get(termsRef);
          const price = priceOf(fare) ?? priceOf(offering) ?? priceOf(firstProduct);

          return [{
            travelarOfferId: '',
            sourceProviderId: meta.providerId,
            sourceProductId: meta.productId,
            providerOfferReference: `${offerRef}:${optionIndex}:${fareIndex}`,
            contentSource: String(fare.ContentSource ?? fare.contentSource ?? offering.contentSource ?? 'GDS'),
            currency: price.currency,
            totalAmount: price.total,
            baseAmount: price.base,
            taxAmount: price.tax,
            cabinClass: cabinOf(firstProduct),
            fareBrand: fareBrandOf(brand, cabinOf(firstProduct)),
            ...termsOf(term),
            itinerary,
          }];
        });
      });
    }

    const productRefs = collectRefs(offering.ProductRef ?? offering.productRef, 'productRef');
    const firstProduct = products.get(productRefs[0] ?? '') ?? asRecord(products.values().next().value);
    const flightRefs = productFlightRefs(firstProduct).length
      ? productFlightRefs(firstProduct)
      : asArray(offering.flightRefs).map(String);
    const itinerary = flightRefs
      .map((ref) => segmentFromFlight(flights.get(ref)))
      .filter((item): item is CanonicalAirSegment => Boolean(item));
    if (!itinerary.length) return [];

    const price = priceOf(offering) ?? priceOf(firstProduct);
    const brandRef = collectRefs(offering.BrandRef ?? offering.Brand, 'BrandRef')[0] ?? '';
    const termsRef = collectRefs(offering.termsAndConditionsRef, 'termsAndConditionsRef')[0] ?? '';
    const brand = brands.get(brandRef);
    const term = terms.get(termsRef);

    return [{
      travelarOfferId: '',
      sourceProviderId: meta.providerId,
      sourceProductId: meta.productId,
      providerOfferReference: offerRef,
      contentSource: String(offering.contentSource ?? firstProduct?.contentSource ?? 'GDS'),
      currency: price.currency,
      totalAmount: price.total,
      baseAmount: price.base,
      taxAmount: price.tax,
      cabinClass: cabinOf(firstProduct),
      fareBrand: fareBrandOf(brand, cabinOf(firstProduct)),
      ...termsOf(term),
      itinerary,
    }];
  });
}

function collectTyped(lists: unknown[], typeName: string, childKey: string): Record<string, unknown>[] {
  const matched = lists.filter((item) => {
    const row = asRecord(item);
    return row && String(row['@type'] ?? row.type ?? '') === typeName;
  });
  return matched.flatMap((item) => asArray(asRecord(item)?.[childKey]).map((row) => asRecord(row) ?? {}));
}

function indexById(rows: Record<string, unknown>[]): Map<string, Record<string, unknown>> {
  const map = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    const id = String(row.id ?? row.Identifier ?? '');
    if (id) map.set(id, row);
  }
  return map;
}

function collectRefs(node: unknown, key: string): string[] {
  return asArray(node).flatMap((item) => {
    if (item == null || item === '') return [];
    if (typeof item === 'string' || typeof item === 'number') return [String(item)];
    const row = asRecord(item);
    if (!row) return [];
    const nested = row[key] ?? row.value ?? row.id;
    if (nested != null && nested !== '' && typeof nested !== 'object') return [String(nested)];
    const nestedRow = asRecord(nested);
    if (nestedRow) {
      const value = nestedRow.value ?? nestedRow.id ?? nestedRow[key];
      return value != null && value !== '' ? [String(value)] : [];
    }
    return [];
  });
}

function productFlightRefs(product: Record<string, unknown> | undefined): string[] {
  if (!product) return [];
  const direct = collectRefs(product.flightRefs ?? product.FlightRef ?? asRecord(product.Flight)?.id, 'FlightRef');
  if (direct.length) return direct;
  return asArray(product.FlightSegment).flatMap((segment) => {
    const row = asRecord(segment);
    const flight = asRecord(row?.Flight) ?? row;
    return collectRefs(flight?.FlightRef ?? flight?.id, 'FlightRef');
  });
}

function segmentFromFlight(flight: Record<string, unknown> | undefined): CanonicalAirSegment | null {
  if (!flight) return null;
  const marketing = carrierOf(flight.carrier ?? flight.MarketingAirline ?? flight.marketingCarrier);
  const operating = carrierOf(flight.OperatingAirline ?? flight.operatingCarrier);
  const number = String(flight.number ?? flight.flightNumber ?? asRecord(flight.number)?.value ?? '');
  const origin = codeOf(flight.Departure ?? flight.departure) || String(flight.origin ?? '');
  const destination = codeOf(flight.Arrival ?? flight.arrival) || String(flight.destination ?? '');
  if (!origin || !destination) return null;
  const departure = asRecord(flight.Departure ?? flight.departure);
  const arrival = asRecord(flight.Arrival ?? flight.arrival);
  const equipment = String(flight.equipment ?? flight.Equipment ?? asRecord(flight.equipment)?.value ?? '').trim();
  const originTerminal = String(departure?.terminal ?? departure?.Terminal ?? '').trim();
  const destinationTerminal = String(arrival?.terminal ?? arrival?.Terminal ?? '').trim();
  return {
    marketingCarrier: marketing.code,
    marketingCarrierName: marketing.name,
    operatingCarrier: operating.code || undefined,
    operatingCarrierName: operating.name || undefined,
    flightNumber: number,
    originCode: origin,
    originTerminal: originTerminal || undefined,
    destinationCode: destination,
    destinationTerminal: destinationTerminal || undefined,
    departureAt: datetimeOf(flight.Departure ?? flight.departure),
    arrivalAt: datetimeOf(flight.Arrival ?? flight.arrival),
    duration: flight.duration != null ? String(flight.duration) : undefined,
    equipment: equipment || undefined,
  };
}

function carrierOf(node: unknown): { code: string; name?: string } {
  if (typeof node === 'string') return { code: node.trim() };
  const row = asRecord(node);
  if (!row) return { code: '' };
  const code = String(row.value ?? row.code ?? row.carrier ?? '').trim();
  const name = String(row.name ?? row.Name ?? row.longName ?? '').trim();
  return { code, name: name || undefined };
}

function codeOf(node: unknown): string {
  const row = asRecord(node);
  if (!row) return '';
  return String(asRecord(row.location)?.value ?? row.location ?? row.value ?? row.airport ?? '');
}

function datetimeOf(node: unknown): string {
  const row = asRecord(node);
  if (!row) return '';
  const date = String(row.date ?? row.departureDate ?? '');
  const time = String(row.time ?? row.departureTime ?? '');
  return [date, time].filter(Boolean).join('T');
}

function priceOf(node: Record<string, unknown> | undefined): { total: number; base?: number; tax?: number; currency: string } {
  const empty = { total: 0, currency: 'USD' };
  if (!node) return empty;
  const price = asRecord(node.BestCombinablePrice)
    ?? asRecord(node.Price)
    ?? asRecord(asRecord(node.TotalPrice))
    ?? node;
  const currency = String(
    asRecord(price.CurrencyCode)?.value
    ?? asRecord(price.currencyCode)?.value
    ?? price.CurrencyCode
    ?? price.currency
    ?? 'USD',
  );
  return {
    total: numberOf(price.TotalPrice ?? price.totalPrice ?? price.value),
    base: optionalNumber(price.Base ?? price.base),
    tax: optionalNumber(price.TotalTaxes ?? price.totalTaxes),
    currency: currency.slice(0, 3).toUpperCase(),
  };
}

function numberOf(value: unknown): number {
  const row = asRecord(value);
  const raw = row?.value ?? value;
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function optionalNumber(value: unknown): number | undefined {
  if (value == null) return undefined;
  return numberOf(value);
}

function cabinOf(product: Record<string, unknown> | undefined): string | undefined {
  const fromProduct = product && String(product.cabin ?? asRecord(product.Cabin)?.value ?? '');
  const passenger = asRecord(asArray(product?.PassengerFlight)[0]);
  const flightProduct = asRecord(asArray(passenger?.FlightProduct)[0]);
  const fromPassenger = flightProduct ? String(flightProduct.cabin ?? asRecord(flightProduct.Cabin)?.value ?? '') : '';
  return cabinLabel(fromProduct || fromPassenger || undefined);
}

function fareBrandOf(brand: Record<string, unknown> | undefined, cabin?: string): string | undefined {
  if (!brand) return undefined;
  const name = String(brand.name ?? brand.BrandName ?? brand.id ?? '').trim();
  if (!name || (cabin && name.toLowerCase() === cabin.toLowerCase())) return undefined;
  if (isKnownAirlineName(name) || airlineName(name)) return undefined;
  return name;
}

function termsOf(terms: Record<string, unknown> | undefined): {
  baggageSummary?: string;
  refundSummary?: string;
  changeSummary?: string;
} {
  if (!terms) return {};
  const penalties = asRecord(terms.Penalties) ?? asRecord(terms.penalties) ?? {};
  const baggage = baggageSummaryOf(terms.BaggageAllowance ?? terms.baggage ?? terms.Baggage);
  const refund = textOf(terms.Refund ?? terms.refund ?? penalties.Cancel ?? penalties.Refund ?? terms.Refundability);
  const change = textOf(penalties.Change ?? terms.Change ?? terms.change ?? terms.Modifications);
  return {
    baggageSummary: baggage,
    refundSummary: refund,
    changeSummary: change,
  };
}

function baggageSummaryOf(node: unknown): string | undefined {
  const labelled = textOf(node);
  if (labelled) return labelled;
  const row = asRecord(node);
  if (!row) return undefined;
  const items = asArray(row.BaggageItem ?? row.baggageItem ?? row.BaggageAllowance ?? row.Allowance);
  const sources = items.length ? items : [row];
  const parts = sources.flatMap((item) => {
    const rec = asRecord(item);
    if (!rec) {
      const text = textOf(item);
      return text ? [text] : [];
    }
    const quantity = rec.Quantity ?? rec.quantity ?? rec.PieceCount ?? rec.pieceCount;
    const type = String(rec.BaggageType ?? rec.baggageType ?? rec.Type ?? rec.type ?? '').trim();
    const measurements = asArray(rec.Measurement ?? rec.measurement ?? rec.Weight ?? rec.weight);
    const weights = measurements.map((entry) => {
      if (typeof entry === 'string' || typeof entry === 'number') return String(entry).trim();
      const measure = asRecord(entry);
      if (!measure) return '';
      const value = measure.value ?? measure.Value ?? measure.weight ?? measure.Weight;
      const unit = measure.unit ?? measure.Unit ?? measure.uom ?? '';
      if (value == null || value === '') return '';
      return `${value}${unit ? String(unit) : ''}`.trim();
    }).filter(Boolean);
    const bits = [
      quantity != null && String(quantity) !== '' ? `${quantity} pc` : '',
      weights.join(' '),
      type,
      textOf(item) ?? '',
    ].filter(Boolean);
    return bits.length ? [bits.join(' · ')] : [];
  });
  const unique = [...new Set(parts.map((part) => part.trim()).filter(Boolean))];
  return unique.length ? unique.join('; ') : undefined;
}

function textOf(node: unknown): string | undefined {
  if (node == null) return undefined;
  if (typeof node === 'string') {
    const text = node.trim();
    return text || undefined;
  }
  const row = asRecord(node);
  if (!row) return undefined;
  const text = String(
    row.Description ?? row.description ?? row.text ?? row.value ?? row.Indicator ?? row.indicator ?? '',
  ).trim();
  return text || undefined;
}

function transactionIdOf(body: unknown): string | undefined {
  const root = asRecord(body) ?? {};
  const response = asRecord(root.CatalogProductOfferingsResponse) ?? root;
  const id = response.transactionId ?? response.TransactionId;
  return id != null ? String(id) : undefined;
}

async function persistAirSearch(
  request: AirSearchRequest,
  config: TravelportConfig,
  raw: unknown,
  offers: CanonicalAirOffer[],
  transactionId?: string,
): Promise<CanonicalAirOffer[]> {
  return withTransaction(async (client) => {
    const sessionId = randomUUID();
    await client.query(
      `insert into app.air_search_sessions
         (id, provider, product, transaction_id, point_of_sale, currency, request_summary, raw_response)
       values ($1, 'travelport', $2, $3, $4, $5, $6::jsonb, $7::jsonb)`,
      [
        sessionId,
        PRODUCT,
        transactionId ?? null,
        config.pointOfSale ?? request.pointOfSaleCountry ?? null,
        config.currency ?? request.currency ?? offers[0]?.currency ?? null,
        JSON.stringify({
          origin: request.originCode,
          destination: request.destinationCode,
          date: request.departureDate,
          returnDate: request.returnDate ?? null,
          region: config.region ?? null,
          pointOfSale: config.pointOfSale ?? request.pointOfSaleCountry ?? null,
          currency: config.currency ?? request.currency ?? null,
          contentSources: request.contentSources?.length ? request.contentSources : config.contentSources,
          gdsCarrierCount: config.gdsCarriers.length,
          ndcCarrierCount: config.ndcCarriers.length,
        }),
        JSON.stringify(raw ?? {}),
      ],
    );

    const stamped: CanonicalAirOffer[] = [];
    for (const [index, offer] of offers.entries()) {
      const id = randomUUID();
      await client.query(
        `insert into app.air_offers
           (id, session_id, provider_offer_ref, sequence, content_source, price_provider,
            currency_provider, price_breakdown, itinerary, product_refs)
         values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb)`,
        [
          id,
          sessionId,
          `${offer.providerOfferReference}#${index}`,
          index,
          offer.contentSource,
          offer.totalAmount,
          offer.currency,
          JSON.stringify({ base: offer.baseAmount, tax: offer.taxAmount }),
          JSON.stringify(offer.itinerary),
            JSON.stringify({
            cabinClass: offer.cabinClass ?? null,
            fareBrand: offer.fareBrand ?? null,
            baggageSummary: offer.baggageSummary ?? null,
            refundSummary: offer.refundSummary ?? null,
            changeSummary: offer.changeSummary ?? null,
          }),
        ],
      );
      stamped.push({ ...offer, travelarOfferId: id });
    }
    return stamped;
  });
}
