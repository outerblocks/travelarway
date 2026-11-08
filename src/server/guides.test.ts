import { describe, expect, it } from 'vitest';
import { isGuideLocale, parseGuideSections } from '@/server/guides';

describe('parseGuideSections', () => {
  it('keeps only heading plus non-empty paragraph strings', () => {
    expect(
      parseGuideSections([
        { heading: ' Ports ', paragraphs: ['Board at Sokoine Drive.', '', 12, 'Keep your bags.'] },
        { heading: '', paragraphs: ['ignored'] },
        { html: '<script>' },
      ]),
    ).toEqual([
      { heading: 'Ports', paragraphs: ['Board at Sokoine Drive.', 'Keep your bags.'] },
    ]);
  });

  it('returns an empty list for anything that is not an array of objects', () => {
    expect(parseGuideSections('<p>html</p>')).toEqual([]);
    expect(parseGuideSections(null)).toEqual([]);
  });
});

describe('isGuideLocale', () => {
  it('accepts the three public languages only', () => {
    expect(isGuideLocale('en')).toBe(true);
    expect(isGuideLocale('de')).toBe(false);
    expect(isGuideLocale(undefined)).toBe(false);
  });
});
