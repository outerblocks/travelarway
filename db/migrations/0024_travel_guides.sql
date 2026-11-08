-- 0024 — Travelar-authored travel guides
--
-- Editorial, not inventory. Travellers do not post. Staff posting waits on identity
-- (staff-authz fail-closed). Until then, research is loaded as reference seed.
-- Body is JSON sections (heading + paragraphs), never HTML.

do $$ begin
  create type app.travel_guide_status as enum ('draft', 'published');
exception when duplicate_object then null; end $$;

create table if not exists app.travel_guide (
  id             uuid primary key,
  slug           text not null unique,
  topic          text not null,
  related_mode   text not null,
  cover_path     text not null,
  status         app.travel_guide_status not null default 'draft',
  sort_order     integer not null,
  published_at   timestamptz,
  researched_at  date not null,
  source_notes   text not null,
  source         app.data_source not null default 'reference',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  check (topic in ('ferry', 'stays', 'experiences', 'east_africa', 'international')),
  check (related_mode in ('ferry', 'stays', 'flights', 'experiences', 'bus', 'train')),
  check (cover_path ~ '^/guides/[a-z0-9._-]+\.(webp|jpg|png)$'),
  check (sort_order >= 0),
  check (status <> 'published' or published_at is not null)
);

create table if not exists app.travel_guide_locale (
  guide_id   uuid not null references app.travel_guide(id) on delete cascade,
  locale     text not null,
  title      text not null,
  excerpt    text not null,
  cover_alt  text not null,
  sections   jsonb not null,
  primary key (guide_id, locale),
  check (locale in ('en', 'sw', 'fr')),
  check (char_length(title) between 1 and 200),
  check (char_length(excerpt) between 1 and 500),
  check (jsonb_typeof(sections) = 'array')
);

create index if not exists travel_guide_published_idx
  on app.travel_guide (sort_order, published_at desc)
  where status = 'published';

comment on table app.travel_guide is
  'Travelar-owned guides and tips. Not user-generated. Not bookable inventory.';

grant select on app.travel_guide to travelar_app;
grant select on app.travel_guide_locale to travelar_app;
