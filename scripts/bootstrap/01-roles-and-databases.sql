-- Travelar role and database bootstrap
--
-- Run this **as an administrator** in your IDE database client (not through the app).
-- This is a privilege change, so it is deliberately a manual, reviewed step.
--
-- Before running: replace CHANGE_ME below with the password you already put into .env.
-- Use the same password in all three roles if that is what you configured, and never
-- commit the resulting .env file.
--
-- Least privilege on purpose:
--   travelar_migrator  owns the schema, runs migrations. Not a superuser.
--   travelar_app       runtime role: DML only. Cannot create or drop objects.
--   travelar_test      isolated test role/database. Never point this at development.
--
-- "already exists" errors are harmless if you re-run this file.

-- ── 1. Roles (run on the default/admin database, e.g. postgres) ──────────────────
CREATE ROLE travelar_migrator LOGIN PASSWORD 'OuterBlocks2026!';
CREATE ROLE travelar_app      LOGIN PASSWORD 'OuterBlocks2026!';
CREATE ROLE travelar_test     LOGIN PASSWORD 'OuterBlocks2026!';

-- No CREATEDB, no CREATEROLE, no SUPERUSER for any of them.

-- ── 2. Databases ─────────────────────────────────────────────────────────────────
CREATE DATABASE travelar_dev  OWNER travelar_migrator;
CREATE DATABASE travelar_test OWNER travelar_migrator;

GRANT CONNECT ON DATABASE travelar_dev  TO travelar_app, travelar_test, travelar_migrator;
GRANT CONNECT ON DATABASE travelar_test TO travelar_test, travelar_migrator;

-- ── 3. In travelar_dev (connect to it before running this section) ───────────────
-- Revoke accidental public write access, then scope privileges to the app schema.
REVOKE ALL ON SCHEMA public FROM PUBLIC;

CREATE SCHEMA IF NOT EXISTS app AUTHORIZATION travelar_migrator;
GRANT USAGE ON SCHEMA app TO travelar_app;

-- The runtime role may read and write rows, but not change structure.
ALTER DEFAULT PRIVILEGES FOR ROLE travelar_migrator IN SCHEMA app
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO travelar_app;
ALTER DEFAULT PRIVILEGES FOR ROLE travelar_migrator IN SCHEMA app
  GRANT USAGE, SELECT ON SEQUENCES TO travelar_app;

-- Migrations are versioned by the migrator, so it needs DDL in its own schema.
GRANT ALL ON SCHEMA app TO travelar_migrator;

-- ── 4. Verify (expected: travelar_app can SELECT but not CREATE in app) ──────────
-- SELECT current_database(), current_user, has_schema_privilege(current_user,'app','CREATE');
-- SELECT rolname, rolsuper, rolcreatedb, rolcreaterole FROM pg_roles
--   WHERE rolname LIKE 'travelar%';
