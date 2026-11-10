-- 0032 — Hosting planes, per-country operator licences, EAC/SADC border posts
--
-- AWS control plane is Europe (Ireland) eu-west-1. That is not in-country storage.
-- operator_licence holds NTSA/TLB/RURA/DRTSS (and LATRA) evidence; a route that
-- visits two countries cannot publish on a single home-country licence.
-- Border posts are statutory/reference geography, not sellable trips.

create table if not exists app.data_plane (
  code                    text primary key,
  kind                    text not null check (kind in ('local_vps', 'aws_region', 'cloudflare_edge')),
  aws_region              text,
  allows_personal_data    boolean not null default false,
  transfer_instrument_ref text,
  note                    text not null
);

insert into app.data_plane (code, kind, aws_region, allows_personal_data, note) values
  (
    'local_pii',
    'local_vps',
    null,
    true,
    'Passenger identity, bookings and Keycloak. Tanzanian (then per-market) facility after RFI. NIDC/Wingu shortlisted, not selected.'
  ),
  (
    'aws_ireland',
    'aws_region',
    'eu-west-1',
    false,
    'Chosen AWS control plane. Destination Ireland. Not Cape Town. PII only after a recorded transfer instrument names Ireland.'
  ),
  (
    'cloudflare_edge',
    'cloudflare_edge',
    null,
    false,
    'Public Worker. Must not bind DATABASE_URL until Hyperdrive/origin plus transfer files exist.'
  )
on conflict (code) do update
  set kind = excluded.kind,
      aws_region = excluded.aws_region,
      allows_personal_data = excluded.allows_personal_data,
      note = excluded.note;

create table if not exists app.operator_licence (
  id              uuid primary key default gen_random_uuid(),
  operator_id     uuid not null references app.operator(id) on delete cascade,
  country_code    char(2) not null,
  regulator_code  text not null check (regulator_code in ('LATRA', 'NTSA', 'UG_TLB', 'RURA', 'DRTSS')),
  licence_number  text not null,
  valid_from      date,
  valid_to        date,
  source          app.data_source not null default 'operator_contract',
  created_at      timestamptz not null default now(),
  unique (operator_id, country_code, regulator_code)
);

create index if not exists ix_operator_licence_operator on app.operator_licence (operator_id);
create index if not exists ix_operator_licence_country on app.operator_licence (country_code, regulator_code);

comment on table app.operator_licence is
  'PSV/operator authorisation per country. Cross-border coaches need a row for every country the vehicle occupies. Numbers are operator-supplied evidence, never invented.';

create table if not exists app.border_post (
  id                 uuid primary key default gen_random_uuid(),
  code               text not null unique,
  name               text not null,
  country_a          char(2) not null,
  country_b          char(2) not null,
  counterpart_name   text,
  instrument         text not null,
  source_name        text not null,
  source_url         text,
  is_osbp            boolean not null default false,
  created_at         timestamptz not null default now(),
  check (country_a < country_b)
);

comment on table app.border_post is
  'Land border geography from published instruments (EAC OSBP Act 2016 schedule; LogCluster Songwe/Kasumulu). Not a timetable and not inventory.';

alter table app.route_corridor
  add column if not exists origin_country_code char(2),
  add column if not exists destination_country_code char(2),
  add column if not exists border_post_id uuid references app.border_post(id);

create index if not exists ix_route_corridor_border on app.route_corridor (border_post_id)
  where border_post_id is not null;

grant select on app.data_plane, app.border_post, app.operator_licence to travelar_app;
grant select, insert, update, delete on app.operator_licence to travelar_app;
grant select on app.route_corridor to travelar_app;
