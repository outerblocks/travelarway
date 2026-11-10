import { query } from '@/server/db';
import type { OimsPermission } from '@/server/oims/permissions';
import { OIMS_PERMISSIONS } from '@/server/oims/permissions';

export interface OimsProfile {
  userId: string;
  operatorId: string;
  mode: 'bus' | 'ferry';
  pipelineStatus: string;
  roles: { id: string; code: string; name: string }[];
  permissions: OimsPermission[];
}

export async function loadOimsProfile(userId: string, operatorId: string): Promise<OimsProfile | null> {
  const assignment = await query<{
    role_id: string | null;
    role_code: string | null;
    role_name: string | null;
    mode: 'bus' | 'ferry';
    pipeline_status: string;
  }>(
    `select a.role_id, r.code as role_code, r.name as role_name, o.mode, o.pipeline_status
       from app.staff_assignment a
       join app.operator o on o.id = a.operator_id
       left join app.role r on r.id = a.role_id
      where a.user_id = $1 and a.kind = 'oims' and a.status = 'active'
        and a.operator_id = $2
        and o.pipeline_status = 'active'
        and o.mode in ('bus', 'ferry')`,
    [userId, operatorId],
  );
  const row = assignment.rows[0];
  if (!row) return null;

  const permissionRows = await query<{ code: OimsPermission }>(
    `select distinct rp.permission_code as code
       from app.staff_assignment a
       join app.role_permission rp on rp.role_id = a.role_id
      where a.user_id = $1 and a.kind = 'oims' and a.status = 'active' and a.operator_id = $2`,
    [userId, operatorId],
  );
  const permissions = permissionRows.rows
    .map((item) => item.code)
    .filter((code) => (OIMS_PERMISSIONS as readonly string[]).includes(code));

  return {
    userId,
    operatorId,
    mode: row.mode,
    pipelineStatus: row.pipeline_status,
    roles: row.role_id ? [{ id: row.role_id, code: row.role_code ?? '', name: row.role_name ?? '' }] : [],
    permissions,
  };
}
