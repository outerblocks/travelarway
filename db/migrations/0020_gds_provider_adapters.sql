-- 0020 — GDS adapter registry and search provenance
--
-- Travelar talks to Travelport, Sabre and Amadeus through adapters. The domain never
-- stores a provider's short-lived reference ids as if they were stable, and an operation
-- cannot be switched on in code alone: it needs a PROVEN row with a date and enabled=true.

do $$ begin
  create type app.provider_capability_status as enum ('PROVEN', 'READ_ONLY', 'BLOCKED', 'DISABLED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type app.integration_operation_status as enum ('INTENDED', 'SENT', 'CONFIRMED', 'FAILED', 'UNKNOWN');
exception when duplicate_object then null; end $$;

create table if not exists app.provider_capabilities (
  id              uuid primary key default gen_random_uuid(),
  provider        text not null,
  product         text not null,
  api_version     text not null,
  operation       text not null,
  status          app.provider_capability_status not null,
  evidence_note   text not null default '',
  evidence_date   date,
  environment     text not null check (environment in ('PREPROD', 'PRODUCTION')),
  enabled         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (provider, product, api_version, operation, environment),
  constraint provider_capabilities_enable_proven
    check (not enabled or (status = 'PROVEN' and evidence_date is not null))
);

create table if not exists app.air_search_sessions (
  id               uuid primary key default gen_random_uuid(),
  provider         text not null,
  product          text not null,
  transaction_id   text,
  point_of_sale    char(2),
  currency         char(3),
  request_summary  jsonb not null default '{}'::jsonb,
  raw_response     jsonb,
  offered_at       timestamptz not null default now(),
  expires_at       timestamptz,
  created_at       timestamptz not null default now()
);

create index if not exists air_search_sessions_offered_at_idx
  on app.air_search_sessions (offered_at desc);

create table if not exists app.air_offers (
  id                   uuid primary key default gen_random_uuid(),
  session_id           uuid not null references app.air_search_sessions (id) on delete cascade,
  provider_offer_ref   text not null,
  sequence             integer not null default 0,
  content_source       text,
  price_provider       numeric,
  currency_provider    char(3),
  price_breakdown      jsonb not null default '{}'::jsonb,
  itinerary            jsonb not null default '[]'::jsonb,
  product_refs         jsonb not null default '[]'::jsonb,
  terms_ref            text,
  brand_ref            text,
  unique (session_id, provider_offer_ref)
);

create index if not exists air_offers_session_idx on app.air_offers (session_id);

create table if not exists app.stay_search_sessions (
  id               uuid primary key default gen_random_uuid(),
  provider         text not null,
  product          text not null,
  transaction_id   text,
  point_of_sale    char(2),
  currency         char(3),
  request_summary  jsonb not null default '{}'::jsonb,
  raw_response     jsonb,
  offered_at       timestamptz not null default now(),
  expires_at       timestamptz,
  created_at       timestamptz not null default now()
);

create index if not exists stay_search_sessions_offered_at_idx
  on app.stay_search_sessions (offered_at desc);

create table if not exists app.stay_offers (
  id                         uuid primary key default gen_random_uuid(),
  session_id                 uuid not null references app.stay_search_sessions (id) on delete cascade,
  provider_property_ref      text not null,
  provider_rate_ref          text,
  property_name              text not null,
  location_label             text,
  currency_provider          char(3),
  price_provider             numeric,
  product_refs               jsonb not null default '{}'::jsonb,
  unique (session_id, provider_property_ref)
);

create index if not exists stay_offers_session_idx on app.stay_offers (session_id);

create table if not exists app.integration_operations (
  id                   uuid primary key default gen_random_uuid(),
  provider             text not null,
  product              text not null,
  operation            text not null,
  idempotency_key      text not null,
  status               app.integration_operation_status not null,
  request_summary      jsonb not null default '{}'::jsonb,
  provider_reference   text,
  error_code           text,
  error_message        text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create unique index if not exists integration_operations_open_idempotency_idx
  on app.integration_operations (idempotency_key)
  where status in ('INTENDED', 'SENT', 'UNKNOWN');

-- Travelport flights search is the only GDS operation proven against pre-production.
insert into app.provider_capabilities
  (provider, product, api_version, operation, status, evidence_note, evidence_date, environment, enabled)
values
  (
    'travelport', 'flights-v11', '11', 'search', 'PROVEN',
    'POST air/catalog/search/catalogproductofferings against api.pp.travelport.net returned offerings. Application errors arrive as HTTP 200 + Result.Error.',
    '2026-11-01', 'PREPROD', true
  ),
  (
    'travelport', 'flights-v11', '11', 'offerValidation', 'READ_ONLY',
    'price/offers/buildfromproducts reached the API; SpecificFlightCriteria was rejected (SourceCode 3460). Request shape unproven.',
    '2026-11-01', 'PREPROD', false
  ),
  (
    'travelport', 'flights-v11', '11', 'booking', 'BLOCKED',
    'Workbench create was observed; add traveller / add offer / commit never exercised. Ticketing has no form of payment.',
    '2026-11-01', 'PREPROD', false
  ),
  (
    'travelport', 'flights-v11', '11', 'ticketing', 'BLOCKED',
    'air/payment formofpayment has never been called. No FAP is configured for this account.',
    '2026-11-01', 'PREPROD', false
  ),
  (
    'travelport', 'stays-v11', '11', 'search', 'READ_ONLY',
    'Adapter implements POST hotel/search/properties/search from the v11 DevKit. Not live-proven for this access group.',
    null, 'PREPROD', false
  ),
  (
    'travelport', 'stays-v12-searchcomplete', '12', 'search', 'BLOCKED',
    'ADR-GDS-003: SearchComplete v12 is a separate product. Do not mix with v11 payloads until entitlement is confirmed.',
    '2026-10-28', 'PREPROD', false
  ),
  (
    'sabre', 'mosaic-air', 'current', 'search', 'BLOCKED',
    'Sabre Mosaic and legacy versioned APIs are separate profiles. No Travelar entitlement or contract test yet.',
    '2026-10-28', 'PREPROD', false
  ),
  (
    'sabre', 'hotel', 'current', 'search', 'BLOCKED',
    'Sabre hotel adapter is a sibling contract only. No account entitlement recorded.',
    '2026-10-28', 'PREPROD', false
  ),
  (
    'amadeus', 'enterprise-air', 'enterprise', 'search', 'BLOCKED',
    'Amadeus Self-Service was decommissioned 17 July 2026. Enterprise access is required and has not been granted.',
    '2026-10-28', 'PREPROD', false
  ),
  (
    'amadeus', 'enterprise-hotel', 'enterprise', 'search', 'BLOCKED',
    'Amadeus Enterprise Hotel access requested; not granted. Adapter is a sibling contract only.',
    '2026-10-28', 'PREPROD', false
  )
on conflict (provider, product, api_version, operation, environment) do nothing;

grant select, insert, update, delete on app.provider_capabilities to travelar_app;
grant select, insert, update, delete on app.air_search_sessions to travelar_app;
grant select, insert, update, delete on app.air_offers to travelar_app;
grant select, insert, update, delete on app.stay_search_sessions to travelar_app;
grant select, insert, update, delete on app.stay_offers to travelar_app;
grant select, insert, update, delete on app.integration_operations to travelar_app;
