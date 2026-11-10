import {
  PaymentNotEnabledError,
  type PaymentProvider,
} from '@/server/payments/clickpesa';

/**
 * DPO adapter placeholder.
 *
 * Kenya card and South Africa card merchant rows exist as `planned`. No DPO request
 * leaves this process until the merchant is licensed and a live adapter is proven.
 */
class DpoNotLicensedProvider implements PaymentProvider {
  readonly name = 'dpo';
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

const dpo = new DpoNotLicensedProvider();

export function getDpoProvider(): PaymentProvider {
  return dpo;
}
