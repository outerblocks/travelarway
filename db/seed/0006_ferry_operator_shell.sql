-- Ferry operator shell for OIMS. No sailings, vessels, or fares: public ferry search
-- stays empty until an operator publishes a route that actually exists.
-- Fixture identity only; TASAC/Ferries Act licence fields stay null until the operator enters them.

insert into app.operator (id, name, mode, country_code, currency, status, is_hq_approved, source)
values (
  'a0000000-0000-4000-8000-000000000010',
  'Travelar Ferry Console',
  'ferry',
  'TZ',
  'USD',
  'active',
  true,
  'fixture'
)
on conflict (id) do nothing;
