-- 011_job_sources.sql
-- Adds shared job provider metadata, source records, and ingest logging.

begin;

-- Shared enum for external job provider identifiers.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'job_provider') then
    create type public.job_provider as enum (
      'manual',
      'indeed',
      'ziprecruiter',
      'linkedin',
      'greenhouse',
      'workday',
      'other'
    );
  end if;
end
$$;

-- Extend jobs with source metadata useful for external adapters.
alter table public.jobs
  add column if not exists source_provider public.job_provider not null default 'manual',
  add column if not exists external_id text,
  add column if not exists external_url text,
  add column if not exists source_posted_at timestamptz,
  add column if not exists source_updated_at timestamptz,
  add column if not exists last_seen_at timestamptz default now(),
  add column if not exists raw_payload jsonb default '{}'::jsonb;

alter table public.jobs
  drop constraint if exists jobs_source_provider_external_unique;

alter table public.jobs
  add constraint jobs_source_provider_external_unique unique (source_provider, external_id);

create index if not exists jobs_source_provider_idx
  on public.jobs(source_provider);

create index if not exists jobs_source_last_seen_idx
  on public.jobs(last_seen_at desc);

create index if not exists jobs_source_provider_last_seen_idx
  on public.jobs(source_provider, last_seen_at desc);

-- Track canonical employer IDs for each integration provider.
create table if not exists public.organization_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider public.job_provider not null,
  external_organization_id text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, external_organization_id)
);

create index if not exists organization_sources_org_provider_idx
  on public.organization_sources (organization_id, provider);

-- Store raw adapter fetches to dedupe across runs and providers.
create table if not exists public.job_source_records (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  provider public.job_provider not null,
  external_id text not null,
  content_hash text,
  payload_hash text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, external_id)
);

create index if not exists job_source_records_job_idx
  on public.job_source_records (job_id);

create index if not exists job_source_records_provider_idx
  on public.job_source_records (provider, last_seen_at desc);

-- Basic audit trail for adapter executions.
create table if not exists public.job_ingest_runs (
  id uuid primary key default gen_random_uuid(),
  adapter text not null,
  provider public.job_provider,
  parameters jsonb not null default '{}'::jsonb,
  total_jobs int not null default 0,
  created_jobs int not null default 0,
  updated_jobs int not null default 0,
  deleted_jobs int not null default 0,
  status text not null default 'pending' check (status in ('pending','running','succeeded','failed','partial')),
  error_payload jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists job_ingest_runs_adapter_idx
  on public.job_ingest_runs(adapter, started_at desc);

create index if not exists job_ingest_runs_status_idx
  on public.job_ingest_runs(status, started_at desc);

create index if not exists job_ingest_runs_provider_idx
  on public.job_ingest_runs(provider, started_at desc);

-- Refresh search helper to account for provider metadata.
create or replace function public.jobs_tsv_update() returns trigger
language plpgsql as $$
begin
  new.search_tsv :=
    setweight(to_tsvector('simple', coalesce(new.title,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.description,'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.position_level,'')), 'C') ||
    setweight(to_tsvector('simple', coalesce(new.location,'')), 'C') ||
    setweight(to_tsvector('simple', coalesce(new.source_provider::text,'')), 'D') ||
    setweight(to_tsvector('simple', coalesce(new.external_id,'')), 'D') ||
    setweight(to_tsvector('simple', coalesce(new.external_url,'')), 'D');
  return new;
end;
$$;

drop trigger if exists trg_jobs_tsv on public.jobs;
create trigger trg_jobs_tsv
before insert or update of title, description, position_level, location, source_provider, external_id, external_url
on public.jobs
for each row execute procedure public.jobs_tsv_update();

-- Enrich job search with normalized provider metadata.
create or replace view public.v_job_search as
select
  j.id,
  j.title,
  j.description,
  j.status,
  j.employment_type,
  j.remote_option,
  j.location,
  j.address,
  j.geo,
  j.compensation,
  j.visibility,
  j.slug,
  j.posted_at,
  j.closes_at,
  j.position_level,
  j.min_reputation,
  j.organization_id,
  o.name as organization_name,
  o.slug as organization_slug,
  j.team_id,
  t.name as team_name,
  j.source_provider,
  j.external_id,
  j.external_url,
  j.source_posted_at,
  j.source_updated_at,
  j.last_seen_at,
  j.raw_payload,
  os.external_organization_id as organization_external_id,
  os.metadata as organization_source_metadata,
  jsr.content_hash as source_content_hash,
  jsr.payload_hash as source_payload_hash,
  jsr.first_seen_at as source_first_seen_at,
  jsr.last_seen_at as source_last_seen_at,
  array_remove(array_agg(distinct s.name) filter (where s.name is not null), null) as skills,
  j.search_tsv
from public.jobs j
left join public.organizations o on o.id = j.organization_id
left join public.teams t on t.id = j.team_id
left join public.job_skills js on js.job_id = j.id
left join public.skills s on s.id = js.skill_id
left join lateral (
  select os.*
  from public.organization_sources os
  where os.organization_id = j.organization_id
    and os.provider = j.source_provider
  order by os.updated_at desc, os.created_at desc
  limit 1
) os on true
left join lateral (
  select jsr.*
  from public.job_source_records jsr
  where jsr.job_id = j.id
    and jsr.provider = j.source_provider
    and jsr.external_id is not distinct from j.external_id
  order by jsr.updated_at desc, jsr.last_seen_at desc
  limit 1
) jsr on true
group by
  j.id, o.name, o.slug, t.name,
  os.external_organization_id, os.metadata,
  jsr.content_hash, jsr.payload_hash, jsr.first_seen_at, jsr.last_seen_at;

grant select on public.v_job_search to anon, authenticated;

-- Backfill existing seed data with provider metadata artifacts.
update public.jobs j
set
  source_provider = coalesce(j.source_provider, 'manual'::public.job_provider),
  external_id = coalesce(j.external_id, 'seed-' || md5(coalesce(j.slug, j.id::text))),
  external_url = coalesce(j.external_url, 'https://jobs.seed.local/' || o.slug || '/' || coalesce(j.slug, j.id::text)),
  source_posted_at = coalesce(j.source_posted_at, j.posted_at, now()),
  source_updated_at = coalesce(
    j.source_updated_at,
    greatest(
      coalesce(j.posted_at, '-infinity'::timestamptz),
      coalesce(j.updated_at, '-infinity'::timestamptz),
      now()
    )
  ),
  last_seen_at = coalesce(j.last_seen_at, now()),
  raw_payload = case
    when j.raw_payload is null or j.raw_payload = '{}'::jsonb then
      jsonb_build_object(
        'seed_source', 'domain_seed',
        'template_title', j.title,
        'organization_slug', o.slug
      )
    else
      j.raw_payload
  end
from public.organizations o
where o.id = j.organization_id
  and (
    j.external_id is null
    or j.external_url is null
    or j.source_posted_at is null
    or j.source_updated_at is null
    or j.last_seen_at is null
    or j.raw_payload is null
    or j.raw_payload = '{}'::jsonb
  );

insert into public.organization_sources (organization_id, provider, external_organization_id, metadata)
select distinct
  o.id,
  'manual'::public.job_provider,
  'org-' || o.slug,
  jsonb_build_object('seed_source', 'domain_seed')
from public.organizations o
on conflict (provider, external_organization_id) do update
  set
    organization_id = excluded.organization_id,
    metadata = coalesce(public.organization_sources.metadata, '{}'::jsonb) || excluded.metadata,
    updated_at = now();

insert into public.job_source_records (job_id, provider, external_id, content_hash, payload_hash, first_seen_at, last_seen_at)
select
  j.id,
  j.source_provider,
  j.external_id,
  md5(coalesce(j.title,'') || '|' || coalesce(j.description,'')),
  md5(coalesce((j.raw_payload)::text,'')),
  coalesce(j.source_posted_at, j.posted_at, now()),
  coalesce(j.last_seen_at, now())
from public.jobs j
where j.external_id is not null
on conflict (provider, external_id) do update
  set
    job_id = excluded.job_id,
    content_hash = excluded.content_hash,
    payload_hash = excluded.payload_hash,
    first_seen_at = least(public.job_source_records.first_seen_at, excluded.first_seen_at),
    last_seen_at = excluded.last_seen_at,
    updated_at = now();

commit;
