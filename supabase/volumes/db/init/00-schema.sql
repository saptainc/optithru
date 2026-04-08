-- 00-schema.sql
-- Sets up PostgreSQL roles and extensions required by Supabase services.
-- Runs once on first container start via docker-entrypoint-initdb.d

-- Create a postgres superuser role (GoTrue migrations reference it)
CREATE ROLE postgres SUPERUSER LOGIN PASSWORD 'optithru-super-secret-postgres-password-2025';

-- Roles
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'optithru-super-secret-postgres-password-2025';
CREATE ROLE supabase_auth_admin NOINHERIT CREATEROLE LOGIN PASSWORD 'optithru-super-secret-postgres-password-2025';
CREATE ROLE supabase_storage_admin NOINHERIT CREATEROLE LOGIN PASSWORD 'optithru-super-secret-postgres-password-2025';

-- CRITICAL: GoTrue uses pop ORM which reads `schema_migrations` unqualified.
-- Without this search_path, it resolves to public.schema_migrations (which is
-- empty on a fresh deploy) and GoTrue re-runs all migrations from scratch
-- against the pre-populated auth schema, failing on type/column mismatches.
--
-- NOTE: use `TO auth, public` (no quotes) — `= 'auth, public'` (with quotes)
-- stores it as a single identifier "auth, public" that doesn't resolve.
ALTER ROLE supabase_auth_admin SET search_path TO auth, public;
ALTER ROLE supabase_storage_admin SET search_path TO storage, public;

-- Role grants
GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
GRANT service_role TO authenticator;
GRANT supabase_auth_admin TO supabase_admin;
GRANT supabase_storage_admin TO supabase_admin;
GRANT supabase_auth_admin TO postgres;
GRANT supabase_storage_admin TO postgres;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pgjwt SCHEMA public;

-- Required schemas
-- NOTE: the `auth` schema is created by 01-auth-baseline.sql (which also drops
-- and recreates it from a known-good baseline). Do NOT create it here, or the
-- pg_dump in 01-auth-baseline.sql will conflict on `CREATE SCHEMA auth`.
CREATE SCHEMA IF NOT EXISTS storage AUTHORIZATION supabase_storage_admin;

-- Permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT CREATE ON SCHEMA public TO supabase_auth_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
