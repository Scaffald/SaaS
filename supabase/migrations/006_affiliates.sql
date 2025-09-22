-- =========================================================
-- 006_affiliates.sql — polymorphic affiliate catalog
-- Introduces a single table for affiliate programs that can be
-- filtered by industry and typed via enum for future expansion.
-- =========================================================

begin;

-- Enum to describe the type of affiliate relationship
create type if not exists public.affiliate_type as enum (
  'education',
  'certification',
  'training',
  'resource'
);

create table if not exists public.affiliates (
  id uuid primary key default gen_random_uuid(),
  industry_id uuid references public.industries(id) on delete set null,
  type public.affiliate_type not null default 'education',
  name text not null,
  program_type text,
  description text,
  cta_label text default 'View program',
  affiliate_url text not null,
  affiliate_code text,
  commission_terms text,
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint affiliates_affiliate_url_chk check (affiliate_url ~ '^https?://'),
  unique (name, affiliate_url)
);

create index if not exists affiliates_industry_idx on public.affiliates(industry_id);
create index if not exists affiliates_type_idx on public.affiliates(type);
create index if not exists affiliates_active_idx on public.affiliates(is_active) where is_active;

alter table public.affiliates enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'affiliates'
      and policyname = 'affiliates_public_read'
  ) then
    create policy "affiliates_public_read"
      on public.affiliates for select
      to anon, authenticated
      using (is_active);
  end if;
end
$$;

commit;
