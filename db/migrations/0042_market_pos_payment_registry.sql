-- 0042 — Point of sale, mode catalogue and payment merchants
--
-- Country is not a URL folder. Markets, sellable modes and PSP accounts are rows.
-- Search still uses geography. Collection and payout wait until the merchant is
-- licensed. Flip status to licensed; do not rebuild adapters or routes.

do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
     where conrelid = 'app.market'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table app.market drop constraint %I', c);
  end loop;
end $$;

alter table app.market
  add constraint market_status_chk
  check (status in ('active', 'planned', 'licensed', 'suspended'));

alter table app.market
  add column if not exists licensed_at timestamptz,
  add column if not exists data_plane_code text references app.data_plane(code);

update app.market
   set status = 'licensed',
       licensed_at = coalesce(licensed_at, now()),
       data_plane_code = coalesce(data_plane_code, 'local_pii')
 where country_code = 'TZ' and status = 'active';

insert into app.market (id, code, name, country_code, currency, timezone, status, data_plane_code)
values
  ('a0000000-0000-4000-8000-000000000002', 'KE', 'Kenya', 'KE', 'KES', 'Africa/Nairobi', 'planned', 'local_pii'),
  ('a0000000-0000-4000-8000-000000000003', 'UG', 'Uganda', 'UG', 'UGX', 'Africa/Kampala', 'planned', 'local_pii'),
  ('a0000000-0000-4000-8000-000000000004', 'RW', 'Rwanda', 'RW', 'RWF', 'Africa/Kigali', 'planned', 'local_pii'),
  ('a0000000-0000-4000-8000-000000000005', 'ZA', 'South Africa', 'ZA', 'ZAR', 'Africa/Johannesburg', 'planned', 'local_pii')
on conflict (code) do nothing;

insert into app.legal_entity (id, market_id, name, status)
select 'a0000000-0000-4000-8000-000000000012', id, 'OuterBlocks Destinations Limited (Kenya, planned)', 'planned'
  from app.market where code = 'KE'
on conflict (id) do nothing;

insert into app.legal_entity (id, market_id, name, status)
select 'a0000000-0000-4000-8000-000000000013', id, 'OuterBlocks Destinations Limited (Uganda, planned)', 'planned'
  from app.market where code = 'UG'
on conflict (id) do nothing;

insert into app.legal_entity (id, market_id, name, status)
select 'a0000000-0000-4000-8000-000000000014', id, 'OuterBlocks Destinations Limited (Rwanda, planned)', 'planned'
  from app.market where code = 'RW'
on conflict (id) do nothing;

insert into app.legal_entity (id, market_id, name, status)
select 'a0000000-0000-4000-8000-000000000015', id, 'OuterBlocks Destinations Limited (South Africa, planned)', 'planned'
  from app.market where code = 'ZA'
on conflict (id) do nothing;

create table if not exists app.market_mode (
  market_id uuid not null references app.market(id) on delete cascade,
  mode      text not null check (mode in ('bus', 'ferry', 'flights', 'train', 'stays', 'experiences')),
  status    text not null check (status in ('planned', 'licensed', 'suspended')),
  note      text,
  primary key (market_id, mode)
);

comment on table app.market_mode is
  'Whether Travelar may sell this mode from this point of sale. Search can still list a journey in another country. licensed is a commercial switch, not a URL.';

insert into app.market_mode (market_id, mode, status, note)
select m.id, x.mode, x.status, x.note
  from app.market m
  cross join (
    values
      ('bus'::text, 'licensed'::text, 'TZ launch inventory'),
      ('ferry', 'licensed', 'TZ launch inventory'),
      ('flights', 'licensed', 'GDS search still needs a proven+enabled profile'),
      ('train', 'licensed', 'TRC/SGR Travelar-managed; GDS rail separate rights'),
      ('stays', 'licensed', 'GDS search still needs a proven+enabled profile'),
      ('experiences', 'licensed', 'Local inventory only when operators are contracted')
  ) as x(mode, status, note)
 where m.country_code = 'TZ'
on conflict (market_id, mode) do nothing;

insert into app.market_mode (market_id, mode, status, note)
select m.id, x.mode, 'planned', x.note
  from app.market m
  cross join (
    values
      ('bus'::text, 'Requires local operator licences and inventory'),
      ('ferry', 'Only if this POS sells ferry; Kenya may never license it'),
      ('flights', 'Same GDS adapters; activate when the KE/ZA/UG/RW entity may collect'),
      ('train', 'Madaraka/GDS/TRC rights are separate from this POS flag'),
      ('stays', 'Same GDS adapters; activate with the local merchant of record'),
      ('experiences', 'Local suppliers under the local entity')
  ) as x(mode, note)
 where m.country_code in ('KE', 'UG', 'RW', 'ZA')
on conflict (market_id, mode) do nothing;

create table if not exists app.payment_merchant (
  id                   uuid primary key default gen_random_uuid(),
  legal_entity_id      uuid not null references app.legal_entity(id),
  market_id            uuid not null references app.market(id),
  provider_code        text not null,
  country_code         char(2) not null,
  currency             char(3) not null,
  methods              text[] not null,
  status               text not null check (status in ('planned', 'licensed', 'suspended')),
  collection_enabled   boolean not null default false,
  payout_enabled       boolean not null default false,
  merchant_account_ref text,
  note                 text not null,
  created_at           timestamptz not null default now(),
  unique (market_id, provider_code, currency)
);

comment on table app.payment_merchant is
  'One contracted PSP product/account per market. Two countries sharing a vendor still need two rows. Collection stays off until status=licensed and the adapter live flag.';

create index if not exists ix_payment_merchant_country
  on app.payment_merchant (country_code, currency, status);

insert into app.payment_merchant (
  id, legal_entity_id, market_id, provider_code, country_code, currency, methods, status,
  collection_enabled, payout_enabled, merchant_account_ref, note
)
select
  'a0000000-0000-4000-8000-000000000021',
  le.id,
  m.id,
  'clickpesa',
  'TZ',
  'TZS',
  array['mobile_money', 'card']::text[],
  'licensed',
  false,
  false,
  'CLICKPESA_TZ_TZS',
  'TZ merchant of record. CLICKPESA_LIVE is still required to move funds. No sandbox.'
from app.market m
join app.legal_entity le on le.market_id = m.id
where m.country_code = 'TZ'
limit 1
on conflict (market_id, provider_code, currency) do nothing;

insert into app.payment_merchant (
  id, legal_entity_id, market_id, provider_code, country_code, currency, methods, status,
  collection_enabled, payout_enabled, merchant_account_ref, note
)
select
  'a0000000-0000-4000-8000-000000000022',
  le.id, m.id, 'pesapal', 'KE', 'KES',
  array['mobile_money', 'card']::text[], 'planned', false, false, 'PESAPAL_KE_KES',
  'Placeholder merchant. No Pesapal calls until contract, adapter tests and licensed status.'
from app.market m
join app.legal_entity le on le.market_id = m.id
where m.country_code = 'KE'
limit 1
on conflict (market_id, provider_code, currency) do nothing;

insert into app.payment_merchant (
  id, legal_entity_id, market_id, provider_code, country_code, currency, methods, status,
  collection_enabled, payout_enabled, merchant_account_ref, note
)
select
  'a0000000-0000-4000-8000-000000000023',
  le.id, m.id, 'dpo', 'KE', 'KES',
  array['card']::text[], 'planned', false, false, 'DPO_KE_KES',
  'Second KE card option. Separate account from Pesapal. Do not share merchant IDs.'
from app.market m
join app.legal_entity le on le.market_id = m.id
where m.country_code = 'KE'
limit 1
on conflict (market_id, provider_code, currency) do nothing;

insert into app.payment_merchant (
  id, legal_entity_id, market_id, provider_code, country_code, currency, methods, status,
  collection_enabled, payout_enabled, merchant_account_ref, note
)
select
  'a0000000-0000-4000-8000-000000000024',
  le.id, m.id, 'pesapal', 'UG', 'UGX',
  array['mobile_money', 'card']::text[], 'planned', false, false, 'PESAPAL_UG_UGX',
  'Placeholder. Activate with a Uganda merchant account, not the Kenya one.'
from app.market m
join app.legal_entity le on le.market_id = m.id
where m.country_code = 'UG'
limit 1
on conflict (market_id, provider_code, currency) do nothing;

insert into app.payment_merchant (
  id, legal_entity_id, market_id, provider_code, country_code, currency, methods, status,
  collection_enabled, payout_enabled, merchant_account_ref, note
)
select
  'a0000000-0000-4000-8000-000000000025',
  le.id, m.id, 'pesapal', 'RW', 'RWF',
  array['mobile_money', 'card']::text[], 'planned', false, false, 'PESAPAL_RW_RWF',
  'Placeholder. Rwanda merchant of record when licensed.'
from app.market m
join app.legal_entity le on le.market_id = m.id
where m.country_code = 'RW'
limit 1
on conflict (market_id, provider_code, currency) do nothing;

insert into app.payment_merchant (
  id, legal_entity_id, market_id, provider_code, country_code, currency, methods, status,
  collection_enabled, payout_enabled, merchant_account_ref, note
)
select
  'a0000000-0000-4000-8000-000000000026',
  le.id, m.id, 'dpo', 'ZA', 'ZAR',
  array['card']::text[], 'planned', false, false, 'DPO_ZA_ZAR',
  'Placeholder. South Africa card collection when the ZA entity is licensed.'
from app.market m
join app.legal_entity le on le.market_id = m.id
where m.country_code = 'ZA'
limit 1
on conflict (market_id, provider_code, currency) do nothing;

alter table app.booking
  add column if not exists pos_country char(2),
  add column if not exists market_id uuid references app.market(id),
  add column if not exists payment_merchant_id uuid references app.payment_merchant(id);

update app.booking b
   set pos_country = o.country_code
  from app.operator o
 where o.id = b.operator_id
   and b.pos_country is null;

update app.booking b
   set market_id = m.id
  from app.market m
 where m.country_code = b.pos_country
   and b.market_id is null;

alter table app.payment
  add column if not exists payment_merchant_id uuid references app.payment_merchant(id);

grant select on app.market, app.market_mode, app.payment_merchant, app.legal_entity to travelar_app;
grant select, insert, update on app.booking to travelar_app;
grant select, insert, update on app.payment to travelar_app;
