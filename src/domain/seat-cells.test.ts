import { describe, expect, it } from 'vitest';
import { FACILITY_CAPTION, isCellType, LAYOUT_PATTERNS } from '@/domain/seat-cells';

describe('seat cell vocabulary', () => {
  it('allow-lists galley and captions facilities in English', () => {
    expect(isCellType('galley')).toBe(true);
    expect(isCellType('vip')).toBe(false);
    expect(FACILITY_CAPTION.galley).toBe('Galley');
    expect(FACILITY_CAPTION.toilet).toBe('Toilet');
    expect(FACILITY_CAPTION.door_mid).toBe('Door');
  });

  it('encodes 2+2, 2+1, 3+2 and double-deck pattern sizes', () => {
    expect(LAYOUT_PATTERNS['2+2']).toMatchObject({ rows: 11, cols: 5, aisleCol: 3, decks: 1 });
    expect(LAYOUT_PATTERNS['2+1']).toMatchObject({ rows: 11, cols: 4, aisleCol: 2, decks: 1 });
    expect(LAYOUT_PATTERNS['3+2']).toMatchObject({ rows: 12, cols: 6, aisleCol: 4, decks: 1 });
    expect(LAYOUT_PATTERNS['double-deck']).toMatchObject({ rows: 9, cols: 5, aisleCol: 3, decks: 2 });
  });
});
