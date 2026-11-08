import { describe, expect, it } from 'vitest';
import {
  isUuid,
  parseEmail,
  parseIsoDate,
  parsePersonName,
  parseSeatCode,
} from '@/domain/input-validation';

describe('input validation', () => {
  it('accepts a UUID and refuses a PNR-shaped guess', () => {
    expect(isUuid('459f1a44-fdc2-4e92-8215-f34953ed1c1f')).toBe(true);
    expect(isUuid('TRV-ABC123')).toBe(false);
  });

  it('accepts ordinary traveller names and refuses markup', () => {
    expect(parsePersonName('Amina J. Mwinyi')).toBe('Amina J. Mwinyi');
    expect(parsePersonName('<script>')).toBeNull();
    expect(parsePersonName('A')).toBeNull();
  });

  it('normalises email case and refuses spaces', () => {
    expect(parseEmail('Amina@Travelar.co.tz')).toBe('amina@travelar.co.tz');
    expect(parseEmail('not-an-email')).toBeNull();
  });

  it('uppercases seat codes and refuses punctuation', () => {
    expect(parseSeatCode('12a')).toBe('12A');
    expect(parseSeatCode('12-A')).toBeNull();
  });

  it('accepts calendar dates only', () => {
    expect(parseIsoDate('2026-12-08')).toBe('2026-12-08');
    expect(parseIsoDate('2026-13-08')).toBeNull();
  });
});
