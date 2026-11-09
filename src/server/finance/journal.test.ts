import { describe, expect, it } from 'vitest';
import { commercialSaleBlocked, isFinanceMode, isOperatorCommissionMode } from '@/domain/finance-modes';

describe('finance mode isolation', () => {
  it('treats bus and ferry as independent commission modes', () => {
    expect(isOperatorCommissionMode('bus')).toBe(true);
    expect(isOperatorCommissionMode('ferry')).toBe(true);
    expect(isOperatorCommissionMode('flights')).toBe(false);
  });

  it('does not authorise train or GDS markup without a contract', () => {
    expect(commercialSaleBlocked('train')).toBe('train_commission_not_authorised');
    expect(commercialSaleBlocked('flights')).toBe('markup_requires_supplier_net');
    expect(commercialSaleBlocked('bus')).toBeNull();
    expect(commercialSaleBlocked('ferry')).toBeNull();
  });

  it('keeps all six modes first-class and separately named', () => {
    expect(isFinanceMode('bus')).toBe(true);
    expect(isFinanceMode('all')).toBe(false);
  });
});
