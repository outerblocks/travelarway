import {
  PaymentNotEnabledError,
  type PaymentProvider,
} from '@/server/payments/clickpesa';

/**
 * Pesapal adapter placeholder.
 *
 * A Kenya / Uganda / Rwanda merchant row already exists as `planned`. This class is the
 * collection surface those rows will call once the account is contracted, tested, and
 * licensed. It must not contact Pesapal until then.
 */
class PesapalNotLicensedProvider implements PaymentProvider {
  readonly name = 'pesapal';
  readonly live = false;

  async previewCollection(): Promise<never> {
    throw new PaymentNotEnabledError('merchant_not_licensed');
  }
  async initiateCollection(): Promise<never> {
    throw new PaymentNotEnabledError('merchant_not_licensed');
  }
  async initiateCardPayment(): Promise<never> {
    throw new PaymentNotEnabledError('merchant_not_licensed');
  }
  async getCollectionStatus(): Promise<never> {
    throw new PaymentNotEnabledError('merchant_not_licensed');
  }
  async initiatePayout(): Promise<never> {
    throw new PaymentNotEnabledError('merchant_not_licensed');
  }
}

const pesapal = new PesapalNotLicensedProvider();

export function getPesapalProvider(): PaymentProvider {
  return pesapal;
}
