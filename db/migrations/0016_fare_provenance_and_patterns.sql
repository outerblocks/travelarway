-- 0016 — Fare provenance and service patterns
--
-- Two things the layout layer left unresolved.
--
-- 1. **Provenance.** `approval_ref` being null told us a fare had no LATRA reference, but not
--    whether one was simply not recorded yet or whether the number is a stand-in we put there
--    to make a flow completable. Those need different answers when TRC's feed arrives: an
--    approved fare is left alone, a stand-in is replaced. `fare_source` says which, on every
--    row, so no provisional price can be mistaken for an official one.
--
-- 2. **Pattern.** TRC prices the same corridor differently by service: Dar es Salaam → Dodoma
--    is 50,500 on the EXPRESS and 31,500 on the ORDINARY LINE. A fare keyed only by station
--    pair and class could hold one of those two numbers, so whichever the operator ran would
--    be quoted at the other's price. `service_pattern` makes the price follow the train.

-- ── Fare provenance ─────────────────────────────────────────────────────────────
alter table app.sgr_fares
  add column if not exists fare_source text not null default 'PROVISIONAL',
  add column if not exists notes       text;

comment on column app.sgr_fares.fare_source is
  'LATRA_APPROVED: published and referenced. TRC_SYNC: came from the operator feed. PROVISIONAL: a stand-in seeded to complete a flow, never to be invoiced against.';

alter table app.sgr_fares drop constraint if exists sgr_fares_source_check;
alter table app.sgr_fares
  add constraint sgr_fares_source_check
  check (fare_source in ('LATRA_APPROVED', 'TRC_SYNC', 'PROVISIONAL'));

-- An approved price without a reference is a contradiction: if it is approved, the reference
-- exists. Enforcing the pair stops PROVISIONAL rows quietly being relabelled as approved.
alter table app.sgr_fares drop constraint if exists sgr_fares_approval_coherence;
alter table app.sgr_fares
  add constraint sgr_fares_approval_coherence
  check (fare_source <> 'LATRA_APPROVED' or approval_ref is not null);

-- ── Which train the fare belongs to ─────────────────────────────────────────────
-- A lookup table rather than a native enum: the operator may add a pattern, and a new value
-- should be an insert, not a migration.
create table if not exists app.sgr_service_patterns (
  code     text primary key,
  name     text not null,
  is_active boolean not null default true
);

insert into app.sgr_service_patterns (code, name) values
  ('EXPRESS', 'Express'),
  ('ROYAL_EXPRESS', 'Royal Express'),
  ('ORDINARY_LINE', 'Ordinary Line')
on conflict (code) do update set name = excluded.name;

alter table app.sgr_fares drop constraint if exists sgr_fares_pattern_fkey;
alter table app.sgr_fares drop column if exists service_pattern;
alter table app.sgr_fares
  add column service_pattern text
  references app.sgr_service_patterns(code);

comment on column app.sgr_fares.service_pattern is
  'NULL means the fare applies to any pattern on that corridor; a value narrows it to that train.';

alter table app.sgr_trips drop column if exists service_pattern;
alter table app.sgr_trips add column service_pattern text references app.sgr_service_patterns(code);

-- One live fare per corridor, class, passenger type and pattern. Without this, two rows could
-- price the same seat and the quote would depend on which one Postgres happened to read first.
create unique index if not exists uq_sgr_fares_live_lookup
  on app.sgr_fares (
    origin_station_id,
    destination_station_id,
    seat_class_id,
    passenger_type,
    coalesce(service_pattern, ''),
    coalesce(valid_to, 'infinity'::timestamptz)
  );

-- Trips are searched by date within a corridor, which is the query the results page makes.
create index if not exists ix_sgr_trips_date_pattern
  on app.sgr_trips (departs_at, service_pattern);
