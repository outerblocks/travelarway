export interface HqNavItem {
  to: string;
  label: string;
  permission?: string;
  anyOf?: string[];
  department?: string;
}

export const HQ_NAV: HqNavItem[] = [
  { to: '/hq', label: 'Executive', permission: 'hq.executive.view' },
  { to: '/hq/work', label: 'My work', anyOf: ['hq.approvals.decide', 'hq.cases.view'] },
  { to: '/hq/finance', label: 'Finance', permission: 'hq.finance.view' },
  { to: '/hq/supply', label: 'Supply', permission: 'hq.operators.view' },
  { to: '/hq/operations', label: 'Operations', permission: 'hq.ops.tower' },
  { to: '/hq/cx', label: 'CX', permission: 'hq.cases.manage' },
  { to: '/hq/compliance', label: 'Compliance', permission: 'hq.compliance.view' },
  { to: '/hq/product', label: 'Product', department: 'product' },
  { to: '/hq/commercial', label: 'Commercial', department: 'commercial' },
  { to: '/hq/revenue', label: 'Revenue', department: 'revenue' },
  { to: '/hq/risk', label: 'Risk', department: 'risk' },
  { to: '/hq/people', label: 'People', department: 'people' },
  { to: '/hq/admin/roles', label: 'Roles', permission: 'hq.roles.manage' },
];

export function filterHqNav(permissions: readonly string[], departmentCodes: readonly string[]): HqNavItem[] {
  return HQ_NAV.filter((item) => {
    if (item.permission) return permissions.includes(item.permission);
    if (item.anyOf) return item.anyOf.some((permission) => permissions.includes(permission));
    if (item.department) {
      return departmentCodes.includes(item.department) || permissions.includes('hq.settings.manage');
    }
    return false;
  });
}
