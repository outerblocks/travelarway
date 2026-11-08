import { describe, expect, it } from 'vitest';
import { InvalidPhoneError, normaliseMsisdn } from './phone';

describe('normaliseMsisdn', () => {
  it('accepts the national part the form actually holds', () => {
    // This is what the checkout field contains: +255 is a fixed prefix beside it.
    expect(normaliseMsisdn('712345678', 'TZ')).toBe('255712345678');
  });

  it('tolerates spacing, punctuation and a trunk zero', () => {
    expect(normaliseMsisdn('712 345 678', 'TZ')).toBe('255712345678');
    expect(normaliseMsisdn('0712-345-678', 'TZ')).toBe('255712345678');
    expect(normaliseMsisdn('(0712) 345 678', 'TZ')).toBe('255712345678');
  });

  it('leaves an already-international number alone', () => {
    expect(normaliseMsisdn('+255 712 345 678', 'TZ')).toBe('255712345678');
    expect(normaliseMsisdn('255712345678', 'TZ')).toBe('255712345678');
    expect(normaliseMsisdn('00255712345678', 'TZ')).toBe('255712345678');
  });

  it('uses the operator country, not a hardcoded one', () => {
    expect(normaliseMsisdn('0712345678', 'KE')).toBe('254712345678');
    expect(normaliseMsisdn('712345678', 'UG')).toBe('256712345678');
  });

  it('refuses what cannot be a subscriber number instead of guessing', () => {
    expect(() => normaliseMsisdn('12345', 'TZ')).toThrow(InvalidPhoneError);
    expect(() => normaliseMsisdn('', 'TZ')).toThrow(InvalidPhoneError);
    expect(() => normaliseMsisdn('712345678', 'XX')).toThrow(InvalidPhoneError);
  });
});
