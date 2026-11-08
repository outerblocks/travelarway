import { query } from '@/server/db';
import type { CapabilityStatus } from '@/server/providers/types';

export interface CapabilityRow {
  provider: string;
  product: string;
  apiVersion: string;
  operation: string;
  status: CapabilityStatus;
  evidenceNote: string;
  evidenceDate: string | null;
  environment: string;
  enabled: boolean;
}

/**
 * An operation may run only when the registry row is PROVEN, dated, and enabled.
 * Editing adapter code cannot turn on Sabre, Amadeus, ticketing, or stays v12.
 */
export function isRunnable(row: CapabilityRow | null | undefined): boolean {
  if (!row) return false;
  return row.enabled && row.status === 'PROVEN' && Boolean(row.evidenceDate);
}

export async function loadCapability(input: {
  provider: string;
  product: string;
  operation: string;
  environment?: string;
}): Promise<CapabilityRow | null> {
  const environment = input.environment ?? 'PREPROD';
  const { rows } = await query<{
    provider: string;
    product: string;
    api_version: string;
    operation: string;
    status: CapabilityStatus;
    evidence_note: string;
    evidence_date: string | null;
    environment: string;
    enabled: boolean;
  }>(
    `select provider, product, api_version, operation, status, evidence_note,
            evidence_date::text, environment, enabled
       from app.provider_capabilities
      where provider = $1
        and product = $2
        and operation = $3
        and environment = $4
      limit 1`,
    [input.provider, input.product, input.operation, environment],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    provider: row.provider,
    product: row.product,
    apiVersion: row.api_version,
    operation: row.operation,
    status: row.status,
    evidenceNote: row.evidence_note,
    evidenceDate: row.evidence_date,
    environment: row.environment,
    enabled: row.enabled,
  };
}

export async function assertRunnable(input: {
  provider: string;
  product: string;
  operation: string;
  environment?: string;
}): Promise<CapabilityRow> {
  const row = await loadCapability(input);
  if (!isRunnable(row)) {
    throw new CapabilityRefusedError(input.provider, input.product, input.operation);
  }
  return row;
}

export class CapabilityRefusedError extends Error {
  constructor(
    public readonly provider: string,
    public readonly product: string,
    public readonly operation: string,
  ) {
    super(`capability_refused:${provider}/${product}/${operation}`);
    this.name = 'CapabilityRefusedError';
  }
}
