import { formatCurrency } from '@/utils/format';

// One place that maps a currency code to the symbol Travelar prints.
// Codes listed here are rendered as "<symbol> <grouped amount>"; every other
// code goes through Intl.NumberFormat (see utils/format.ts).
const PREFIX_SYMBOLS: Record<string, string> = {
  TZS: 'TSh',
  KES: 'KSh',
  UGX: 'USh',
  RWF: 'RF',
};

export function symbolFor(currency: string): string | undefined {
  return PREFIX_SYMBOLS[currency];
}

/**
 * Amount stored in booking/payment/ledger columns named `*_minor`.
 * Those columns hold **major** currency units (58000 TZS, not cents).
 * Never multiply by 100 when sending an amount to a provider.
 */
export type AmountMajorUnits = number;

/** Formats an amount using the single money convention of the booking funnel. */
export function formatMoney(amount: number, currency: string): string {
  return formatCurrency(amount, currency, symbolFor(currency));
}
