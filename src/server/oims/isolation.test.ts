import { beforeAll, describe, expect, it } from 'vitest';
import { query } from '@/server/db';
import { hasOimsAssignment } from '@/server/identity/sessions';
import { loadWorkspace } from '@/server/oims/repository';
import { loadOperatorDossier } from '@/server/hims/supply';
import { loadOperatorStatement } from '@/server/oims/finance';
import { nextPipelineStatus } from '@/server/hims/permissions';
import { HimsConflictError } from '@/server/hims/http';

const OPERATOR_A = 'a0000000-0000-4000-8000-000000000002';
const OPERATOR_B = 'a0000000-0000-4000-8000-000000000003';
const STRANGER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

let db = false;

beforeAll(async () => {
  if (!process.env.DATABASE_URL) return;
  try {
    await query('select 1 as ok');
    db = true;
  } catch {
    db = false;
  }
});

describe('OIMS tenant isolation (local Postgres)', () => {
  it('keeps operator A workspace and statement free of operator B rows', async () => {
    if (!db) return;
    const [workspaceA, workspaceB, statementA, dossierA] = await Promise.all([
      loadWorkspace(OPERATOR_A, 'bus'),
      loadWorkspace(OPERATOR_B, 'bus'),
      loadOperatorStatement(OPERATOR_A, 'bus'),
      loadOperatorDossier(OPERATOR_A),
    ]);
    const idsA = new Set((workspaceA.routes as { id: string }[]).map((row) => row.id));
    const idsB = new Set((workspaceB.routes as { id: string }[]).map((row) => row.id));
    for (const id of idsA) expect(idsB.has(id)).toBe(false);
    const bookingsA = workspaceA.bookings as { id: string }[];
    const bookingsB = new Set((workspaceB.bookings as { id: string }[]).map((row) => row.id));
    for (const booking of bookingsA) expect(bookingsB.has(booking.id)).toBe(false);
    expect(statementA.mode).toBe('bus');
    expect((dossierA.operator as { id: string }).id).toBe(OPERATOR_A);
    expect(await hasOimsAssignment(STRANGER, OPERATOR_A)).toBe(false);
    const otherStaff = await query(
      `select 1 from app.staff_assignment where operator_id = $1 and kind = 'oims' and user_id = $2`,
      [OPERATOR_B, STRANGER],
    );
    expect(otherStaff.rowCount).toBe(0);
  });

  it('hides operator B oims_audit rows when app.operator_id is A', async () => {
    if (!db) return;
    const { getPool } = await import('@/server/db');
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');
      await client.query(`select set_config('app.operator_id', $1, true)`, [OPERATOR_A]);
      const seen = await client.query(
        `select operator_id from app.oims_audit where operator_id = $1`,
        [OPERATOR_B],
      );
      expect(seen.rowCount).toBe(0);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });

  it('walks pipeline in a rolled-back transaction and never jumps Lead to Active', async () => {
    if (!db) return;
    expect(() => nextPipelineStatus('lead', 'activate')).toThrow(HimsConflictError);
    const { getPool } = await import('@/server/db');
    const client = await getPool().connect();
    const id = 'd0000000-0000-4000-8000-000000000099';
    try {
      await client.query('BEGIN');
      await client.query(
        `insert into app.operator (id, name, mode, country_code, currency, status, pipeline_status, source)
         values ($1, 'Isolation Lead', 'bus', 'TZ', 'TZS', 'pending', 'lead', 'fixture')
         on conflict (id) do update set pipeline_status = 'lead', status = 'pending'`,
        [id],
      );
      let current = 'lead';
      while (current !== 'approved') {
        current = nextPipelineStatus(current, 'advance');
        await client.query(`update app.operator set pipeline_status = $2 where id = $1`, [id, current]);
      }
      current = nextPipelineStatus(current, 'activate');
      expect(current).toBe('active');
      await client.query(`update app.operator set pipeline_status = $2, status = 'active' where id = $1`, [id, current]);
      const found = await client.query<{ pipeline_status: string }>(
        `select pipeline_status from app.operator where id = $1`,
        [id],
      );
      expect(found.rows[0]?.pipeline_status).toBe('active');
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });
});
