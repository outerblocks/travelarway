const LETTER = /[A-Za-z]/;
const DIGIT = /\d/;

export function assertPasswordPolicy(password: string, kind: 'passenger' | 'staff'): void {
  if (typeof password !== 'string') throw new Error('invalid_password');
  const min = kind === 'staff' ? 10 : 8;
  if (password.length < min || password.length > 128) throw new Error('invalid_password');
  if (password !== password.trim()) throw new Error('invalid_password');
  if (kind === 'staff' && (!LETTER.test(password) || !DIGIT.test(password))) {
    throw new Error('invalid_password');
  }
}
