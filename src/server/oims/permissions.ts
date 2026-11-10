export const OIMS_PERMISSIONS = [
  'oims.routes.manage',
  'oims.schedules.manage',
  'oims.fleet.manage',
  'oims.vessels.manage',
  'oims.manifest.view',
  'oims.otc.sell',
  'oims.finance.view',
  'oims.users.manage',
  'oims.bookings.view',
] as const;

export type OimsPermission = (typeof OIMS_PERMISSIONS)[number];

export const OIMS_ROLE_IDS = {
  oims_admin: 'c0000000-0000-4000-8000-000000000011',
  oims_finance: 'c0000000-0000-4000-8000-000000000012',
  oims_ops: 'c0000000-0000-4000-8000-000000000013',
  oims_sales: 'c0000000-0000-4000-8000-000000000014',
} as const;

export function isOimsRoleId(id: string): boolean {
  return Object.values(OIMS_ROLE_IDS).includes(id as (typeof OIMS_ROLE_IDS)[keyof typeof OIMS_ROLE_IDS]);
}

export function assertTripTenant(tripOperatorId: string, sessionOperatorId: string): void {
  if (tripOperatorId !== sessionOperatorId) {
    throw new Error('forbidden');
  }
}

export function assertModeMatch(tripMode: string, consoleMode: 'bus' | 'ferry'): void {
  if (tripMode !== consoleMode) throw new Error('invalid_mode');
}

export function rejectClientTotal(body: Record<string, unknown>): void {
  if ('totalMinor' in body || 'amount' in body || 'total' in body) {
    throw new Error('invalid_client_total');
  }
}

export function assertOperatorActiveForInvite(pipelineStatus: string): void {
  if (pipelineStatus !== 'active') throw new Error('invalid_operator_not_active');
}
