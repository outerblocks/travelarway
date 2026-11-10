import { query } from '@/server/db';
import { permissionsForLegacyDesk, type HqPermission } from '@/server/hims/permissions';

export interface HqProfile {
  userId: string;
  marketId: string | null;
  roles: { id: string; code: string; name: string }[];
  departments: { id: string; code: string; name: string }[];
  permissions: HqPermission[];
  desks: Array<'finance' | 'admin'>;
}

export async function loadHqProfile(userId: string): Promise<HqProfile | null> {
  const assignments = await query<{
    role_id: string | null;
    role_code: string | null;
    role_name: string | null;
    department_id: string | null;
    department_code: string | null;
    department_name: string | null;
    market_id: string | null;
    hims_desk: 'finance' | 'admin' | null;
  }>(
    `select a.role_id, r.code as role_code, r.name as role_name,
            a.department_id, d.code as department_code, d.name as department_name,
            a.market_id, a.hims_desk
       from app.staff_assignment a
       left join app.role r on r.id = a.role_id
       left join app.department d on d.id = a.department_id
      where a.user_id = $1 and a.kind = 'hims' and a.status = 'active'`,
    [userId],
  );
  if (!assignments.rowCount) return null;

  const permissionRows = await query<{ code: HqPermission }>(
    `select distinct rp.permission_code as code
       from app.staff_assignment a
       join app.role_permission rp on rp.role_id = a.role_id
      where a.user_id = $1 and a.kind = 'hims' and a.status = 'active'`,
    [userId],
  );

  const desks = [...new Set(assignments.rows.map((row) => row.hims_desk).filter((desk): desk is 'finance' | 'admin' => desk === 'finance' || desk === 'admin'))];
  const fromRoles = permissionRows.rows.map((row) => row.code);
  const fromDesks = desks.flatMap((desk) => [...permissionsForLegacyDesk(desk)]);
  const permissions = [...new Set([...fromRoles, ...fromDesks])] as HqPermission[];

  return {
    userId,
    marketId: assignments.rows[0]?.market_id ?? null,
    roles: assignments.rows
      .filter((row) => row.role_id)
      .map((row) => ({ id: row.role_id!, code: row.role_code ?? '', name: row.role_name ?? '' })),
    departments: assignments.rows
      .filter((row) => row.department_id)
      .map((row) => ({ id: row.department_id!, code: row.department_code ?? '', name: row.department_name ?? '' })),
    permissions,
    desks,
  };
}

export async function hasHqPermission(userId: string, permission: HqPermission): Promise<boolean> {
  const profile = await loadHqProfile(userId);
  return Boolean(profile?.permissions.includes(permission));
}

export async function listRoles() {
  const { rows } = await query(
    `select r.id, r.code, r.name, d.code as "departmentCode", d.name as "departmentName",
            coalesce(json_agg(rp.permission_code order by rp.permission_code) filter (where rp.permission_code is not null), '[]') as permissions
       from app.role r
       left join app.department d on d.id = r.department_id
       left join app.role_permission rp on rp.role_id = r.id
      group by r.id, r.code, r.name, d.code, d.name
      order by r.name`,
  );
  return { data: rows };
}

export async function listDepartments() {
  const { rows } = await query(
    `select id, code, name, sort_order as "sortOrder" from app.department order by sort_order`,
  );
  return { data: rows };
}

export async function listDecisions() {
  const { rows } = await query(
    `select code, title, why, owner, status from app.decision_register order by code`,
  );
  return { data: rows };
}
