-- =========================================================
-- 004_missing_domain.sql
-- Creates remaining domain tables using `public.users` as the user principal.
-- Idempotent (CREATE IF NOT EXISTS) and self-contained RLS.
-- =========================================================

begin;

-- ---------- Safety: extensions you likely already installed ----------
create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists postgis;
create extension if not exists pg_trgm;

-- =========================================================
-- Organizations & Teams
-- =========================================================
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.users(id) on delete set null,
  name text not null,
  slug citext unique not null,
  industry_id uuid references public.industries(id) on delete set null,
  logo_url text,                 -- swap to media id later if desired
  address jsonb,
  geo geography(Point,4326),
  visibility text default 'public' check (visibility in ('public','private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists organizations_geo_idx on public.organizations using gist (geo);
create index if not exists organizations_owner_idx on public.organizations(owner_user_id);

alter table public.organizations enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='organizations' and policyname='orgs_read') then
    create policy "orgs_read"   on public.organizations for select to anon, authenticated using (true);
    create policy "orgs_insert" on public.organizations for insert to authenticated with check (auth.uid() = owner_user_id);
    create policy "orgs_update" on public.organizations for update to authenticated using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
  end if;
end $$;

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug citext unique,
  image_url text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists teams_org_idx on public.teams(organization_id);

alter table public.teams enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='teams' and policyname='teams_read') then
    create policy "teams_read" on public.teams for select to anon, authenticated using (true);
    create policy "teams_insert" on public.teams for insert to authenticated
      with check (
        created_by = auth.uid()
        and exists (select 1 from public.organizations o where o.id = organization_id and (o.owner_user_id = auth.uid()))
      );
    create policy "teams_update" on public.teams for update to authenticated
      using ( created_by = auth.uid()
              or exists (select 1 from public.organizations o where o.id = public.teams.organization_id and o.owner_user_id = auth.uid()) )
      with check ( created_by = auth.uid()
              or exists (select 1 from public.organizations o where o.id = public.teams.organization_id and o.owner_user_id = auth.uid()) );
  end if;
end $$;

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (team_id, user_id)
);
create index if not exists team_members_team_idx on public.team_members(team_id);
create index if not exists team_members_user_idx on public.team_members(user_id);

alter table public.team_members enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='team_members' and policyname='team_members_read') then
    create policy "team_members_read" on public.team_members for select to authenticated using (true);
    create policy "team_members_self_add" on public.team_members for insert to authenticated
      with check (
        user_id = auth.uid() and exists (
          select 1 from public.teams t
          join public.organizations o on o.id = t.organization_id
          where t.id = team_id and o.owner_user_id = auth.uid()
        )
      );
    create policy "team_members_manage" on public.team_members for delete to authenticated
      using (
        user_id = auth.uid()
        or exists (
          select 1 from public.teams t
          join public.organizations o on o.id = t.organization_id
          where t.id = team_id and o.owner_user_id = auth.uid()
        )
      );
  end if;
end $$;

-- =========================================================
-- Skills taxonomy & junctions
-- =========================================================
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry_id uuid references public.industries(id) on delete set null,
  parent_id uuid references public.skills(id) on delete set null,
  active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name)
);
create index if not exists skills_name_trgm_idx on public.skills using gin (name gin_trgm_ops);
create index if not exists skills_industry_idx on public.skills(industry_id);
create index if not exists skills_parent_idx on public.skills(parent_id);

create table if not exists public.user_skills (
  user_id uuid not null references public.users(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  proficiency smallint default 0 check (proficiency between 0 and 5),
  source text default 'self' check (source in ('self','assessed','verified')),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, skill_id)
);
create index if not exists user_skills_skill_idx on public.user_skills(skill_id, user_id);
create index if not exists user_skills_user_idx on public.user_skills(user_id);

create table if not exists public.organization_skills (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  required_level smallint check (required_level between 0 and 5),
  priority smallint,
  created_at timestamptz not null default now(),
  primary key (organization_id, skill_id)
);
create index if not exists org_skills_org_idx on public.organization_skills(organization_id);

-- =========================================================
-- Connections (user<->user) & Follows (polymorphic)
-- =========================================================
create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid not null references public.users(id) on delete cascade,
  addressee_user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','blocked')),
  requester_type text default 'peer' check (requester_type in ('peer','boss','report','mentor','mentee','client','contractor','other')),
  addressee_type text default 'peer' check (addressee_type in ('peer','boss','report','mentor','mentee','client','contractor','other')),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  unique (requester_user_id, addressee_user_id),
  check (requester_user_id <> addressee_user_id)
);
create index if not exists connections_users_idx on public.connections(requester_user_id, addressee_user_id);
create index if not exists connections_status_idx on public.connections(status);

alter table public.connections enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='connections' and policyname='connections_read') then
    create policy "connections_read" on public.connections for select to authenticated
      using ( requester_user_id = auth.uid() or addressee_user_id = auth.uid() );
    create policy "connections_write" on public.connections for insert to authenticated
      with check ( requester_user_id = auth.uid() );
    create policy "connections_update" on public.connections for update to authenticated
      using ( requester_user_id = auth.uid() or addressee_user_id = auth.uid() )
      with check ( requester_user_id = auth.uid() or addressee_user_id = auth.uid() );
    create policy "connections_delete" on public.connections for delete to authenticated
      using ( requester_user_id = auth.uid() or addressee_user_id = auth.uid() );
  end if;
end $$;

create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_type text not null check (follower_type in ('user','organization','team')),
  follower_id uuid not null,
  followee_type text not null check (followee_type in ('user','organization','team','job')),
  followee_id uuid not null,
  created_at timestamptz not null default now(),
  unique (follower_type, follower_id, followee_type, followee_id)
);
create index if not exists follows_follower_idx on public.follows(follower_type, follower_id);
create index if not exists follows_followee_idx on public.follows(followee_type, followee_id);

alter table public.follows enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='follows' and policyname='follows_read') then
    create policy "follows_read" on public.follows for select to authenticated using (true);
    create policy "follows_write" on public.follows for insert to authenticated
      with check ( (follower_type = 'user' and follower_id = auth.uid()) or (follower_type <> 'user') );
    create policy "follows_delete" on public.follows for delete to authenticated
      using ( (follower_type = 'user' and follower_id = auth.uid()) or (follower_type <> 'user') );
  end if;
end $$;

-- =========================================================
-- Jobs, Job Skills, Applications (+ messages & inquiries)
-- =========================================================
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft','open','paused','closed')),
  employment_type text check (employment_type in ('full_time','part_time','contract','temp','intern')),
  remote_option text check (remote_option in ('on_site','hybrid','remote')),
  location text,
  address jsonb,
  geo geography(Point,4326),
  compensation jsonb,
  visibility text default 'public' check (visibility in ('public','members')),
  slug citext unique,
  posted_at timestamptz,
  closes_at timestamptz,
  position_level text,
  min_reputation numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists jobs_geo_idx on public.jobs using gist (geo);
create index if not exists jobs_status_posted_idx on public.jobs(status, posted_at desc);
create index if not exists jobs_org_idx on public.jobs(organization_id);
create index if not exists jobs_team_idx on public.jobs(team_id);

alter table public.jobs enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='jobs' and policyname='jobs_read') then
    create policy "jobs_read" on public.jobs for select to anon, authenticated using (true);
    create policy "jobs_insert" on public.jobs for insert to authenticated
      with check ( exists (select 1 from public.organizations o where o.id = organization_id and o.owner_user_id = auth.uid()) );
    create policy "jobs_update" on public.jobs for update to authenticated
      using ( exists (select 1 from public.organizations o where o.id = public.jobs.organization_id and o.owner_user_id = auth.uid()) )
      with check ( exists (select 1 from public.organizations o where o.id = public.jobs.organization_id and o.owner_user_id = auth.uid()) );
  end if;
end $$;

create table if not exists public.job_skills (
  job_id uuid not null references public.jobs(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  required_level smallint check (required_level between 0 and 5),
  created_at timestamptz not null default now(),
  primary key (job_id, skill_id)
);
create index if not exists job_skills_skill_idx on public.job_skills(skill_id, job_id);
create index if not exists job_skills_job_idx on public.job_skills(job_id);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'new' check (status in ('new','screen','interview','offer','hired','rejected','withdrawn')),
  resume_url text,
  cover_letter_url text,
  answers jsonb,
  is_shortlisted boolean default false,
  archived_at timestamptz,
  rejected_at timestamptz,
  reject_reasons text[],
  reject_meta jsonb,
  stage_changed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (job_id, user_id)
);
create index if not exists applications_job_status_idx on public.applications(job_id, status, created_at desc);
create index if not exists applications_user_idx on public.applications(user_id, created_at desc);

alter table public.applications enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='applications' and policyname='apps_read') then
    create policy "apps_read" on public.applications for select to authenticated
      using (
        user_id = auth.uid()
        or exists (
          select 1 from public.jobs j
          join public.organizations o on o.id = j.organization_id
          where j.id = public.applications.job_id and o.owner_user_id = auth.uid()
        )
      );
    create policy "apps_insert" on public.applications for insert to authenticated
      with check ( user_id = auth.uid() );
    create policy "apps_update" on public.applications for update to authenticated
      using (
        user_id = auth.uid()
        or exists (
          select 1 from public.jobs j
          join public.organizations o on o.id = j.organization_id
          where j.id = public.applications.job_id and o.owner_user_id = auth.uid()
        )
      )
      with check (
        user_id = auth.uid()
        or exists (
          select 1 from public.jobs j
          join public.organizations o on o.id = j.organization_id
          where j.id = public.applications.job_id and o.owner_user_id = auth.uid()
        )
      );
  end if;
end $$;

create table if not exists public.application_messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  author_user_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists app_messages_app_idx on public.application_messages(application_id);

alter table public.application_messages enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='application_messages' and policyname='app_msgs_read') then
    create policy "app_msgs_read" on public.application_messages for select to authenticated
      using (
        exists (
          select 1 from public.applications a
          where a.id = public.application_messages.application_id
            and (
              a.user_id = auth.uid()
              or exists (
                select 1 from public.jobs j
                join public.organizations o on o.id = j.organization_id
                where j.id = a.job_id and o.owner_user_id = auth.uid()
              )
            )
        )
      );
    create policy "app_msgs_insert" on public.application_messages for insert to authenticated
      with check (
        author_user_id = auth.uid()
        and exists (
          select 1 from public.applications a
          where a.id = public.application_messages.application_id
            and (
              a.user_id = auth.uid()
              or exists (
                select 1 from public.jobs j
                join public.organizations o on o.id = j.organization_id
                where j.id = a.job_id and o.owner_user_id = auth.uid()
              )
            )
        )
      );
  end if;
end $$;

create table if not exists public.application_inquiries (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  status text default 'open' check (status in ('open','accepted','declined','expired','replaced')),
  terms jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists app_inquiries_app_idx on public.application_inquiries(application_id);

alter table public.application_inquiries enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='application_inquiries' and policyname='app_inquiries_read') then
    create policy "app_inquiries_read" on public.application_inquiries for select to authenticated
      using (
        exists (
          select 1 from public.applications a
          where a.id = public.application_inquiries.application_id
            and (
              a.user_id = auth.uid()
              or exists (
                select 1 from public.jobs j
                join public.organizations o on o.id = j.organization_id
                where j.id = a.job_id and o.owner_user_id = auth.uid()
              )
            )
        )
      );
    create policy "app_inquiries_write" on public.application_inquiries for insert to authenticated
      with check (
        exists (
          select 1 from public.applications a
          where a.id = public.application_inquiries.application_id
            and (
              a.user_id = auth.uid()
              or exists (
                select 1 from public.jobs j
                join public.organizations o on o.id = j.organization_id
                where j.id = a.job_id and o.owner_user_id = auth.uid()
              )
            )
        )
      );
    create policy "app_inquiries_update" on public.application_inquiries for update to authenticated
      using (
        exists (
          select 1 from public.applications a
          where a.id = public.application_inquiries.application_id
            and (
              a.user_id = auth.uid()
              or exists (
                select 1 from public.jobs j
                join public.organizations o on o.id = j.organization_id
                where j.id = a.job_id and o.owner_user_id = auth.uid()
              )
            )
        )
      )
      with check (
        exists (
          select 1 from public.applications a
          where a.id = public.application_inquiries.application_id
            and (
              a.user_id = auth.uid()
              or exists (
                select 1 from public.jobs j
                join public.organizations o on o.id = j.organization_id
                where j.id = a.job_id and o.owner_user_id = auth.uid()
              )
            )
        )
      );
  end if;
end $$;

-- =========================================================
-- Reviews (unified) + per-skill ratings & free-form aspects
-- =========================================================
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'review' check (kind in ('review','recommendation','endorsement','rating')),
  subject_type text not null, -- 'user' | 'organization' | 'project' | ...
  subject_id uuid not null,
  author_user_id uuid not null references public.users(id) on delete cascade,
  rating smallint,
  headline text,
  body text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind, subject_type, subject_id, author_user_id)
);
create index if not exists reviews_subject_idx on public.reviews(subject_type, subject_id);
create index if not exists reviews_author_idx on public.reviews(author_user_id);

create table if not exists public.review_skill_ratings (
  review_id uuid not null references public.reviews(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  score smallint not null check (score between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (review_id, skill_id)
);

create table if not exists public.review_aspects (
  review_id uuid not null references public.reviews(id) on delete cascade,
  key text not null,
  score smallint not null check (score between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (review_id, key)
);

alter table public.reviews enable row level security;
alter table public.review_skill_ratings enable row level security;
alter table public.review_aspects enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='reviews' and policyname='reviews_read') then
    create policy "reviews_read" on public.reviews for select to anon, authenticated using (true);
    create policy "reviews_insert" on public.reviews for insert to authenticated with check (author_user_id = auth.uid());
    create policy "reviews_update" on public.reviews for update to authenticated using (author_user_id = auth.uid()) with check (author_user_id = auth.uid());
    create policy "reviews_delete" on public.reviews for delete to authenticated using (author_user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where tablename='review_skill_ratings' and policyname='rsr_read') then
    create policy "rsr_read" on public.review_skill_ratings for select to anon, authenticated using (true);
    create policy "rsr_insert" on public.review_skill_ratings for insert to authenticated
      with check ( exists (select 1 from public.reviews r where r.id = review_id and r.author_user_id = auth.uid()) );
  end if;

  if not exists (select 1 from pg_policies where tablename='review_aspects' and policyname='ra_read') then
    create policy "ra_read" on public.review_aspects for select to anon, authenticated using (true);
    create policy "ra_insert" on public.review_aspects for insert to authenticated
      with check ( exists (select 1 from public.reviews r where r.id = review_id and r.author_user_id = auth.uid()) );
  end if;
end $$;

-- =========================================================
-- Invites (generic: organization/team)
-- =========================================================
create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  issuer_user_id uuid not null references public.users(id) on delete cascade,
  target_type text not null check (target_type in ('organization','team')),
  target_id uuid not null,
  invitee_email citext not null,
  role_name text,             -- free-text for now; map to roles later if you add them
  token text unique not null,
  status text not null default 'pending' check (status in ('pending','accepted','declined','expired','canceled')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  consumed_at timestamptz
);
create index if not exists invites_token_idx on public.invites(token);
create index if not exists invites_target_idx on public.invites(target_type, target_id);

alter table public.invites enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='invites' and policyname='invites_read') then
    create policy "invites_read" on public.invites for select to authenticated
      using ( issuer_user_id = auth.uid() );
    create policy "invites_insert" on public.invites for insert to authenticated
      with check ( issuer_user_id = auth.uid() );
    create policy "invites_update" on public.invites for update to authenticated
      using ( issuer_user_id = auth.uid() )
      with check ( issuer_user_id = auth.uid() );
  end if;
end $$;

-- =========================================================
-- Projects: contributors (Note: projects table doesn't exist yet)
-- =========================================================
-- Note: The original migration referenced public.projects which doesn't exist
-- in your current schema. This table is commented out until projects are created.
-- 
-- create table if not exists public.project_contributors (
--   project_id uuid not null references public.projects(id) on delete cascade,
--   user_id uuid not null references public.users(id) on delete cascade,
--   role text,
--   created_at timestamptz not null default now(),
--   primary key (project_id, user_id)
-- );
-- 
-- alter table public.project_contributors enable row level security;
-- do $$ begin
--   if not exists (select 1 from pg_policies where tablename='project_contributors' and policyname='pc_read') then
--     create policy "pc_read" on public.project_contributors for select to anon, authenticated using (true);
--     create policy "pc_insert_self" on public.project_contributors for insert to authenticated with check (user_id = auth.uid());
--     create policy "pc_delete_self" on public.project_contributors for delete to authenticated using (user_id = auth.uid());
--   end if;
-- end $$;

-- =========================================================
-- Helpful compound indexes
-- =========================================================
create index if not exists applications_created_idx on public.applications(created_at desc);

-- =========================================================
-- Add search_tsv to organizations and jobs tables
-- =========================================================

-- Add search_tsv to organizations and jobs tables
alter table public.organizations
  add column if not exists search_tsv tsvector;

alter table public.jobs
  add column if not exists search_tsv tsvector;

-- Create search triggers for new tables
create or replace function public.organizations_tsv_update() returns trigger
language plpgsql as $$
begin
  new.search_tsv :=
    setweight(to_tsvector('simple', coalesce(new.name,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.slug::text,'')), 'C');
  return new;
end;
$$;

create or replace function public.jobs_tsv_update() returns trigger
language plpgsql as $$
begin
  new.search_tsv :=
    setweight(to_tsvector('simple', coalesce(new.title,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.description,'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.position_level,'')), 'C') ||
    setweight(to_tsvector('simple', coalesce(new.location,'')), 'C');
  return new;
end;
$$;

drop trigger if exists trg_orgs_tsv on public.organizations;
create trigger trg_orgs_tsv
before insert or update of name, slug
on public.organizations
for each row execute procedure public.organizations_tsv_update();

drop trigger if exists trg_jobs_tsv on public.jobs;
create trigger trg_jobs_tsv
before insert or update of title, description, position_level, location
on public.jobs
for each row execute procedure public.jobs_tsv_update();

-- Add search indexes
create index if not exists orgs_tsv_idx on public.organizations using gin (search_tsv);
create index if not exists jobs_tsv_idx on public.jobs using gin (search_tsv);

-- =========================================================
-- Update existing search views to include new tables
-- =========================================================

-- Update job search view to work with new jobs table
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
  array_remove(array_agg(distinct s.name) filter (where s.name is not null), null) as skills,
  j.search_tsv
from public.jobs j
left join public.organizations o on o.id = j.organization_id
left join public.teams t on t.id = j.team_id
left join public.job_skills js on js.job_id = j.id
left join public.skills s on s.id = js.skill_id
group by
  j.id, o.name, o.slug, t.name;

grant select on public.v_job_search to anon, authenticated;

-- Update org directory view
create or replace view public.v_org_directory as
select
  o.id,
  o.name,
  o.slug,
  o.industry_id,
  i.name as industry_name,
  o.address,
  o.geo,
  o.visibility,
  o.created_at,
  count(distinct t.id) as team_count,
  count(distinct j.id) filter (where j.status = 'open') as open_jobs,
  o.search_tsv
from public.organizations o
left join public.industries i on i.id = o.industry_id
left join public.teams t on t.organization_id = o.id
left join public.jobs j on j.organization_id = o.id
group by o.id, i.name;

grant select on public.v_org_directory to anon, authenticated;

commit;
