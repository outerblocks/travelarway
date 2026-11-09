import { describe, expect, it } from 'vitest';
import { parseTerms } from '@/pages/info/parse-terms';
import { COOKIES_BODY } from '@/pages/info/travelar-cookies';
import { PRIVACY_BODY } from '@/pages/info/travelar-privacy';
import { REFUNDS_BODY } from '@/pages/info/travelar-refunds';
import { TERMS_BODY } from '@/pages/info/travelar-terms';

describe('parseTerms', () => {
  it('splits the published terms into 27 numbered sections', () => {
    const nodes = parseTerms(TERMS_BODY);
    const headings = nodes.filter((node) => node.kind === 'h2').map((node) => node.text);
    expect(headings).toHaveLength(27);
    expect(headings[0]).toBe('1. About These Terms');
    expect(headings[26]).toBe('27. Contact Us');
  });

  it('keeps product subheadings and OuterBlocks Limited as operator', () => {
    const nodes = parseTerms(TERMS_BODY);
    expect(nodes.some((node) => node.kind === 'h3' && node.text === '9.1 Flights')).toBe(true);
    expect(nodes.some((node) => node.kind === 'h3' && node.text.startsWith('9.5 Stays'))).toBe(true);
    expect(TERMS_BODY).toContain('OuterBlocks Limited');
    expect(TERMS_BODY).not.toContain('OuterBlocks');
    expect(TERMS_BODY).not.toContain('Compliance Notes');
  });

  it('parses the privacy policy tables and 15 sections', () => {
    const nodes = parseTerms(PRIVACY_BODY);
    const headings = nodes.filter((node) => node.kind === 'h2').map((node) => node.text);
    expect(headings).toHaveLength(15);
    expect(headings[0]).toBe('1. Who We Are');
    expect(headings[14]).toBe('15. Contact Us');
    const tables = nodes.filter((node) => node.kind === 'table');
    expect(tables).toHaveLength(3);
    expect(tables[0].kind === 'table' && tables[0].headers).toEqual([
      'Category',
      'Examples',
      'Where it comes from',
    ]);
    expect(tables[0].kind === 'table' && tables[0].rows).toHaveLength(10);
    expect(PRIVACY_BODY).toContain('OuterBlocks Limited');
    expect(PRIVACY_BODY).not.toContain('Drafting note');
  });

  it('parses the cookie policy table and nine sections', () => {
    const nodes = parseTerms(COOKIES_BODY);
    const headings = nodes.filter((node) => node.kind === 'h2').map((node) => node.text);
    expect(headings).toHaveLength(9);
    expect(headings[0]).toBe('1. About This Policy');
    expect(headings[8]).toBe('9. Contact Us');
    const tables = nodes.filter((node) => node.kind === 'table');
    expect(tables).toHaveLength(1);
    expect(tables[0].kind === 'table' && tables[0].headers).toEqual([
      'Category',
      'What it does',
      'Examples of what is stored',
      'Typical lifetime',
      'Your consent',
    ]);
    expect(tables[0].kind === 'table' && tables[0].rows).toHaveLength(4);
    expect(COOKIES_BODY).toContain('[analytics provider]');
    expect(COOKIES_BODY).not.toContain('Drafting note');
  });

  it('parses the cancellation policy tables, steps and 15 sections', () => {
    const nodes = parseTerms(REFUNDS_BODY);
    const headings = nodes.filter((node) => node.kind === 'h2').map((node) => node.text);
    expect(headings).toHaveLength(15);
    expect(headings[0]).toBe('1. About This Policy');
    expect(headings[14]).toBe('15. Contact Us');
    const tables = nodes.filter((node) => node.kind === 'table');
    expect(tables).toHaveLength(2);
    expect(tables[0].kind === 'table' && tables[0].rows).toHaveLength(6);
    expect(tables[1].kind === 'table' && tables[1].headers).toEqual(['Step', 'Our commitment']);
    const steps = nodes.find((node) => node.kind === 'ol');
    expect(steps?.kind === 'ol' && steps.items).toHaveLength(4);
    expect(REFUNDS_BODY).toContain('OuterBlocks Limited');
    expect(REFUNDS_BODY).not.toContain('Drafting note');
  });
});
