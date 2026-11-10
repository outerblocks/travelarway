import { describe, expect, it } from 'vitest';
import { HimsConflictError } from '@/server/hims/http';
import { assertMakerChecker, HQ_PERMISSIONS, nextPipelineStatus } from '@/server/hims/permissions';
import { OIMS_PERMISSIONS } from '@/server/oims/permissions';

describe('HQ maker-checker', () => {
  it('refuses the same human as maker and checker', () => {
    expect(() => assertMakerChecker('user:1', 'user:1')).toThrow(HimsConflictError);
    expect(() => assertMakerChecker('user:1', 'user:2')).not.toThrow();
  });
});

describe('supplier pipeline', () => {
  it('refuses Lead to Active', () => {
    expect(() => nextPipelineStatus('lead', 'activate')).toThrow(HimsConflictError);
    expect(nextPipelineStatus('lead', 'advance')).toBe('qualified');
  });

  it('activates only from approved or pilot', () => {
    expect(nextPipelineStatus('approved', 'activate')).toBe('active');
    expect(nextPipelineStatus('pilot', 'activate')).toBe('active');
    expect(() => nextPipelineStatus('qualified', 'activate')).toThrow(HimsConflictError);
  });

  it('suspends only live operators', () => {
    expect(nextPipelineStatus('active', 'suspend')).toBe('suspended');
    expect(() => nextPipelineStatus('lead', 'suspend')).toThrow(HimsConflictError);
    expect(nextPipelineStatus('suspended', 'reinstate')).toBe('active');
  });
});

describe('HQ vs OIMS layout writes', () => {
  it('does not grant OIMS fleet layout permission through HQ roles', () => {
    expect((HQ_PERMISSIONS as readonly string[]).includes('oims.fleet.manage')).toBe(false);
    expect((OIMS_PERMISSIONS as readonly string[]).includes('oims.fleet.manage')).toBe(true);
  });
});
