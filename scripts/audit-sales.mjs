/**
 * Sales audit — the invariants that decide whether our books can be trusted, plus the two
 * queues that represent money owed to somebody.
 *
 * Run against any environment: `node scripts/audit-sales.mjs`
 *
 * Exit code 1 when an invariant is broken, so it can run unattended.
 */
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

loadEnv();

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const invariants = await client.query(`
  select
    (select count(*)::int from app.booking b
      where b.status = 'issued'
        and not exists (select 1 from app.payment p
                         where p.booking_id = b.id and p.status = 'paid'))
      as issued_without_payment,
    (select count(*)::int from app.payment p
      where p.status = 'paid'
        and not exists (select 1 from app.ledger_entry l
                         where l.booking_id = p.booking_id and l.reverses is null))
      as paid_without_ledger,
    (select count(*)::int from app.booking b
      where b.status = 'refunded'
        and not exists (select 1 from app.ledger_entry l
                         where l.booking_id = b.id and l.reverses is not null))
      as refunded_without_reversal,
    (select count(*)::int from app.ledger_entry l
      where l.reverses is not null
        and not exists (select 1 from app.ledger_entry o where o.id = l.reverses))
      as orphan_reversals,
    (select count(*)::int from app.booking b
      where b.status in ('issued', 'refunded')
        and exists (select 1 from app.booking_passenger bp
                     where bp.booking_id = b.id and bp.status = 'active') = (b.status = 'refunded'))
      as seat_state_wrong
`);

// Money we hold but never sold. A row is only a refund obligation once the provider has
// acknowledged the collection; without that reference the "payment" is our own record of a
// confirmation we cannot prove, and paying it back would be refunding money we never took.
const owedToCustomer = await client.query(`
  select b.pnr, p.amount_minor::text as amount_minor, p.currency::text as currency,
         p.order_reference, p.provider_reference is not null as provider_acknowledged,
         p.created_at
    from app.payment p join app.booking b on b.id = p.booking_id
   where p.status = 'unallocated'
     and p.provider_reference is not null
   order by p.created_at
`);

const unverified = await client.query(`
  select b.pnr, p.amount_minor::text as amount_minor, p.order_reference, p.failure_code,
         p.created_at
    from app.payment p join app.booking b on b.id = p.booking_id
   where p.status = 'unallocated'
     and p.provider_reference is null
   order by p.created_at
`);

// Attempts the provider has acknowledged and never resolved. Calling these expired would be
// a guess; the sweeper keeps asking until the provider answers.
const inFlight = await client.query(`
  select b.pnr, p.amount_minor::text as amount_minor, p.order_reference, p.status::text,
         p.created_at, b.status::text as booking_status
    from app.payment p join app.booking b on b.id = p.booking_id
   where p.status in ('initiated', 'pending')
     and p.provider_reference is not null
   order by p.created_at
`);

await client.end();

const row = invariants.rows[0];
const broken = Object.values(row).some((value) => value !== 0);

console.log(
  JSON.stringify(
    {
      ok: !broken,
      invariants: row,
      owedToCustomer: owedToCustomer.rows,
      unverifiedPayments: unverified.rows,
      inFlight: inFlight.rows,
    },
    null,
    2,
  ),
);

if (broken) process.exitCode = 1;
