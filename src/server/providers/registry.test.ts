import { describe, expect, it } from 'vitest';
import { isRunnable, type CapabilityRow } from '@/server/providers/registry';

function row(overrides: Partial<CapabilityRow>): CapabilityRow {
  return {
    provider: 'travelport',
    product: 'flights-v11',
    apiVersion: '11',
    operation: 'search',
    status: 'PROVEN',
    evidenceNote: 'test',
    evidenceDate: '2026-11-01',
    environment: 'PREPROD',
    enabled: true,
    ...overrides,
  };
}

describe('provider capability registry', () => {
  it('runs only a proven, dated, enabled operation', () => {
    expect(isRunnable(row({}))).toBe(true);
  });

  it('refuses blocked, read-only, undated, or disabled rows', () => {
    expect(isRunnable(row({ status: 'BLOCKED' }))).toBe(false);
    expect(isRunnable(row({ status: 'READ_ONLY' }))).toBe(false);
    expect(isRunnable(row({ enabled: false }))).toBe(false);
    expect(isRunnable(row({ evidenceDate: null }))).toBe(false);
    expect(isRunnable(null)).toBe(false);
  });
});
