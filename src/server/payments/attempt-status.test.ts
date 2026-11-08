import { describe, expect, it } from 'vitest';
import { attemptStatusFor } from './attempt-status';
import { CONFIRMING_COLLECTION_STATUSES } from './clickpesa';

describe('what an attempt may record', () => {
  it('never records `paid` before a confirmation has arrived', () => {
    // The initiate call can return SUCCESS the moment it is accepted. If that became
    // `paid`, the later webhook would look like a replay and no ticket would ever issue.
    for (const status of ['pending', 'processing', 'paid', 'held'] as const) {
      expect(attemptStatusFor(status)).toBe('pending');
    }
    expect(attemptStatusFor('paid')).not.toBe('paid');
  });

  it('records a rejection as failed', () => {
    for (const status of ['failed', 'voided', 'refunded'] as const) {
      expect(attemptStatusFor(status)).toBe('failed');
    }
  });
});

describe('confirmation gate', () => {
  it('accepts only the statuses that mean money was collected', () => {
    expect(CONFIRMING_COLLECTION_STATUSES.has('SUCCESS')).toBe(true);
    expect(CONFIRMING_COLLECTION_STATUSES.has('SETTLED')).toBe(true);
  });

  it('refuses everything that is merely in progress', () => {
    for (const status of ['PENDING', 'PROCESSING', 'ON-HOLD', 'FAILED', 'REVERSED', '']) {
      expect(CONFIRMING_COLLECTION_STATUSES.has(status)).toBe(false);
    }
  });
});
