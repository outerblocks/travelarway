import { describe, expect, it } from 'vitest';
import { assertPasswordPolicy } from '@/server/identity/passwords';

describe('password policy', () => {
  it('rejects short staff passwords and accepts a mixed secret', () => {
    expect(() => assertPasswordPolicy('short', 'staff')).toThrow('invalid_password');
    expect(() => assertPasswordPolicy('abcdefghij', 'staff')).toThrow('invalid_password');
    expect(() => assertPasswordPolicy('Operator12', 'staff')).not.toThrow();
    expect(() => assertPasswordPolicy('abcdefgh', 'passenger')).not.toThrow();
  });
});
