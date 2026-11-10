export interface OimsNavItem {
  id: 'overview' | 'routes' | 'schedules' | 'fleet' | 'manifest' | 'otc' | 'bookings' | 'finance' | 'staff';
  label: string;
  permission?: string;
  anyOf?: string[];
}

export const OIMS_NAV: OimsNavItem[] = [
  { id: 'overview', label: 'Overview', anyOf: ['oims.bookings.view', 'oims.manifest.view', 'oims.finance.view'] },
  { id: 'routes', label: 'Routes & fares', permission: 'oims.routes.manage' },
  { id: 'schedules', label: 'Schedules', permission: 'oims.schedules.manage' },
  { id: 'fleet', label: 'Fleet', anyOf: ['oims.fleet.manage', 'oims.vessels.manage'] },
  { id: 'manifest', label: 'Manifest', permission: 'oims.manifest.view' },
  { id: 'otc', label: 'Walk-in sales', permission: 'oims.otc.sell' },
  { id: 'bookings', label: 'Bookings', permission: 'oims.bookings.view' },
  { id: 'finance', label: 'Finance', permission: 'oims.finance.view' },
  { id: 'staff', label: 'Staff', permission: 'oims.users.manage' },
];

export function filterOimsNav(permissions: readonly string[]): OimsNavItem[] {
  return OIMS_NAV.filter((item) => {
    if (item.permission) return permissions.includes(item.permission);
    if (item.anyOf) return item.anyOf.some((permission) => permissions.includes(permission));
    return false;
  });
}
