/**
 * Collection adapter registry.
 *
 * Merchant rows decide which vendor a market uses. Adapters for planned markets exist so
 * licensing is a status flip, not a new build. Unlicensed adapters refuse collection.
 */
import {
  getPaymentProvider,
  PaymentNotEnabledError,
  type PaymentProvider,
} from '@/server/payments/clickpesa';
import { getPesapalProvider } from '@/server/payments/pesapal';
import { getDpoProvider } from '@/server/payments/dpo';

export function getCollectionAdapter(providerCode: string, fetchImpl?: typeof fetch): PaymentProvider {
  const code = providerCode.trim().toLowerCase();
  if (code === 'clickpesa') return getPaymentProvider(fetchImpl);
  if (code === 'pesapal') return getPesapalProvider();
  if (code === 'dpo') return getDpoProvider();
  throw new PaymentNotEnabledError('unknown_provider');
}
