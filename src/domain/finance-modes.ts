export const FINANCE_MODES = ['bus', 'ferry', 'flights', 'stays', 'train', 'experiences'] as const;
export type FinanceMode = (typeof FINANCE_MODES)[number];

export const OPERATOR_COMMISSION_MODES = ['bus', 'ferry'] as const;
export type OperatorCommissionMode = (typeof OPERATOR_COMMISSION_MODES)[number];

export function isFinanceMode(value: string): value is FinanceMode {
  return (FINANCE_MODES as readonly string[]).includes(value);
}

export function isOperatorCommissionMode(value: string): value is OperatorCommissionMode {
  return (OPERATOR_COMMISSION_MODES as readonly string[]).includes(value);
}

/** Train markup/commission stays closed until a railway reseller contract exists (ADR-FIN-002). */
export function commercialSaleBlocked(mode: string): string | null {
  if (mode === 'train') return 'train_commission_not_authorised';
  if (mode === 'flights' || mode === 'stays' || mode === 'experiences') {
    return 'markup_requires_supplier_net';
  }
  return null;
}
