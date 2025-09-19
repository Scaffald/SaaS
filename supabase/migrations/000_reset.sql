-- =========================================================
-- 000_reset.sql
-- Nukes existing public schema objects from Tamagui starter
-- so we can start with a clean Supabase schema.
-- =========================================================

-- Safety: wrap in transaction
begin;

-- 1. Drop everything in public schema
-- (tables, views, functions, types, triggers, sequences, etc.)
drop schema if exists public cascade;

-- 2. Recreate public schema
create schema public;

-- 3. Ensure extensions are available
-- (safe to rerun; no-ops if already installed)
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists postgis;
create extension if not exists pg_trgm;

-- 4. Reset ownership & grants (so Supabase service role is owner)
alter schema public owner to postgres;
grant usage on schema public to public;
grant all on schema public to postgres;
grant all on schema public to anon, authenticated, service_role;

commit;