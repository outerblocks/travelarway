import { describe, expect, it } from 'vitest';
import { safePaymentRedirectUrl } from './payment-redirect';

describe('safePaymentRedirectUrl', () => {
  it('accepts ClickPesa https hosts used in the adapter tests', () => {
    expect(safePaymentRedirectUrl('https://pay.clickpesa.com/abc')).toBe(
      'https://pay.clickpesa.com/abc',
    );
  });

  it('refuses a foreign https host', () => {
    expect(safePaymentRedirectUrl('https://evil.example/pay')).toBeNull();
  });

  it('refuses javascript and http schemes', () => {
    expect(safePaymentRedirectUrl('javascript:alert(1)')).toBeNull();
    expect(safePaymentRedirectUrl('http://pay.clickpesa.com/abc')).toBeNull();
  });
});
