import { describe, expect, it } from 'vitest';
import { filterHqNav } from '@/domain/hq-nav';

describe('HQ navigation filter', () => {
  it('hides finance and settlements from CX L1', () => {
    const nav = filterHqNav(['hq.cases.view', 'hq.cases.manage', 'hq.operators.view'], ['cx']);
    expect(nav.map((item) => item.to)).toEqual(['/hq/work', '/hq/supply', '/hq/cx']);
    expect(nav.some((item) => item.to === '/hq/finance')).toBe(false);
    expect(nav.some((item) => item.to === '/hq/admin/roles')).toBe(false);
  });

  it('hides operations tower from finance analyst', () => {
    const nav = filterHqNav(
      ['hq.executive.view', 'hq.finance.view', 'hq.finance.propose', 'hq.operators.view', 'hq.cases.view'],
      ['finance'],
    );
    expect(nav.map((item) => item.to)).toEqual(['/hq', '/hq/work', '/hq/finance', '/hq/supply']);
    expect(nav.some((item) => item.to === '/hq/operations')).toBe(false);
    expect(nav.some((item) => item.to === '/hq/cx')).toBe(false);
  });

  it('shows department queues for HQ admin via settings.manage', () => {
    const nav = filterHqNav(['hq.settings.manage', 'hq.executive.view', 'hq.roles.manage'], ['executive']);
    expect(nav.some((item) => item.to === '/hq/product')).toBe(true);
    expect(nav.some((item) => item.to === '/hq/people')).toBe(true);
    expect(nav.some((item) => item.to === '/hq/admin/roles')).toBe(true);
  });
});
