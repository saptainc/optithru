-- 02-auth-reset.sql
-- Runs AFTER 00-schema.sql and 01-app-schema.sql, on first container start only.
--
-- Why: the supabase/postgres image may pre-populate the `auth` schema with
-- tables, types, and a populated `schema_migrations` table that does NOT match
-- the migration set shipped in the supabase/gotrue version we use. When that
-- happens, GoTrue's migration tracker thinks earlier migrations are already
-- applied, skips them, and then fails on later ones with errors like:
--
--   ERROR: type "auth.factor_type" does not exist
--
-- We force the auth schema to be completely empty so GoTrue runs ALL of its
-- migrations from scratch on first start.

DROP SCHEMA IF EXISTS auth CASCADE;
CREATE SCHEMA auth AUTHORIZATION supabase_auth_admin;
GRANT ALL    ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL    ON SCHEMA auth TO service_role;
GRANT USAGE  ON SCHEMA auth TO anon, authenticated, service_role;
