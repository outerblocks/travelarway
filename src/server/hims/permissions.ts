import { HimsConflictError } from '@/server/hims/http';

export const HQ_PERMISSIONS = [
  'hq.executive.view',
  'hq.finance.view',
  'hq.finance.propose',
  'hq.finance.settle',
  'hq.approvals.decide',
  'hq.operators.view',
  'hq.operators.manage',
  'hq.operators.invite',
  'hq.supply.decide',
  'hq.users.manage',
  'hq.roles.manage',
  'hq.audit.view',
  'hq.cases.view',
  'hq.cases.manage',
  'hq.cases.escalate',
  'hq.ops.tower',
  'hq.compliance.view',
  'hq.settings.manage',
] as const;

export type HqPermission = (typeof HQ_PERMISSIONS)[number];

export const ROLE_IDS = {
  hq_admin: 'c0000000-0000-4000-8000-000000000001',
  hq_finance_analyst: 'c0000000-0000-4000-8000-000000000002',
  hq_finance_controller: 'c0000000-0000-4000-8000-000000000003',
} as const;

/** Cutover: finance desk proposes; admin desk checks. */
export function permissionsForLegacyDesk(desk: 'finance' | 'admin'): readonly HqPermission[] {
  if (desk === 'finance') {
    return [
      'hq.executive.view',
      'hq.finance.view',
      'hq.finance.propose',
      'hq.operators.view',
      'hq.cases.view',
    ];
  }
  return HQ_PERMISSIONS;
}

export function legacyDeskForPermission(permission: HqPermission): 'finance' | 'admin' | null {
  const financeOnly: HqPermission[] = ['hq.finance.propose'];
  const checker: HqPermission[] = ['hq.approvals.decide', 'hq.finance.settle', 'hq.users.manage', 'hq.operators.invite', 'hq.supply.decide', 'hq.roles.manage'];
  if (financeOnly.includes(permission)) return 'finance';
  if (checker.includes(permission)) return 'admin';
  return null;
}

export function assertMakerChecker(maker: string | null | undefined, checker: string): void {
  if (maker && maker === checker) throw new HimsConflictError('maker_checker_required');
}

export const PIPELINE_ORDER = [
  'lead',
  'qualified',
  'due_diligence',
  'compliance_review',
  'commercial',
  'contracted',
  'technical_setup',
  'training',
  'pilot',
  'approved',
  'active',
] as const;

export type PipelineStatus = (typeof PIPELINE_ORDER)[number] | 'suspended' | 'terminated';

export function nextPipelineStatus(current: string, action: 'advance' | 'activate' | 'suspend' | 'reinstate' | 'terminate'): PipelineStatus {
  if (action === 'terminate') return 'terminated';
  if (action === 'suspend') {
    if (current !== 'active' && current !== 'approved') throw new HimsConflictError('invalid_pipeline');
    return 'suspended';
  }
  if (action === 'reinstate') {
    if (current !== 'suspended') throw new HimsConflictError('invalid_pipeline');
    return 'active';
  }
  if (action === 'activate') {
    if (current !== 'approved' && current !== 'pilot') throw new HimsConflictError('invalid_pipeline');
    return 'active';
  }
  const index = PIPELINE_ORDER.indexOf(current as (typeof PIPELINE_ORDER)[number]);
  if (index < 0 || index >= PIPELINE_ORDER.length - 1) throw new HimsConflictError('invalid_pipeline');
  if (PIPELINE_ORDER[index] === 'lead' && PIPELINE_ORDER[index + 1] === 'active') {
    throw new HimsConflictError('invalid_pipeline');
  }
  return PIPELINE_ORDER[index + 1];
}

export function slaDueAt(priority: 'p1' | 'p2' | 'p3' | 'p4', from = new Date()): Date {
  const due = new Date(from);
  if (priority === 'p1') due.setMinutes(due.getMinutes() + 15);
  else if (priority === 'p2') due.setHours(due.getHours() + 1);
  else if (priority === 'p3') due.setHours(due.getHours() + 4);
  else due.setDate(due.getDate() + 1);
  return due;
}
