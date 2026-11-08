/**
 * Travelport application errors often arrive as HTTP 200 with Result.Error populated.
 * HTTP status is therefore not a success signal.
 */

export interface TravelportError {
  sourceCode?: string;
  message: string;
  category?: string;
}

export function errorsFromBody(body: unknown): TravelportError[] {
  if (!body || typeof body !== 'object') return [];
  const root = body as Record<string, unknown>;
  const result = asRecord(root.Result)
    ?? asRecord(asRecord(root.CatalogProductOfferingsResponse)?.Result)
    ?? asRecord(asRecord(root.PropertiesResponse)?.Result)
    ?? asRecord(asRecord(root.PropertiesSearchResponse)?.Result)
    ?? asRecord(asRecord(root.ErrorResponse)?.Result)
    ?? asRecord(asRecord(root.CatalogOfferingsResponse)?.Result)
    ?? asRecord(asRecord(root.CatalogOfferingsHospitalityResponse)?.Result);
  if (!result) return [];
  const raw = result.Error ?? result.Errors;
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return list
    .map((item) => {
      const row = asRecord(item);
      if (!row) return null;
      const message = String(row.Message ?? row.message ?? row.Description ?? 'provider_error');
      return {
        sourceCode: row.SourceCode != null ? String(row.SourceCode) : undefined,
        message,
        category: row.category != null ? String(row.category) : undefined,
      };
    })
    .filter((item): item is TravelportError => Boolean(item));
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function asArray<T = unknown>(value: unknown): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? (value as T[]) : [value as T];
}
