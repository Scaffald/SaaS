-- Create pipeline core tables for ATS
begin;

create table if not exists public.pipelines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists pipelines_org_name_idx
  on public.pipelines (organization_id, lower(name));

create index if not exists pipelines_org_default_idx
  on public.pipelines (organization_id, is_default);

alter table public.pipelines enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pipelines'
      and policyname = 'pipelines_select'
  ) then
    create policy "pipelines_select"
      on public.pipelines
      for select to authenticated
      using (
        exists (
          select 1
          from public.organizations o
          where o.id = public.pipelines.organization_id
            and o.owner_user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pipelines'
      and policyname = 'pipelines_insert'
  ) then
    create policy "pipelines_insert"
      on public.pipelines
      for insert to authenticated
      with check (
        exists (
          select 1
          from public.organizations o
          where o.id = public.pipelines.organization_id
            and o.owner_user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pipelines'
      and policyname = 'pipelines_update'
  ) then
    create policy "pipelines_update"
      on public.pipelines
      for update to authenticated
      using (
        exists (
          select 1
          from public.organizations o
          where o.id = public.pipelines.organization_id
            and o.owner_user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from public.organizations o
          where o.id = public.pipelines.organization_id
            and o.owner_user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pipelines'
      and policyname = 'pipelines_delete'
  ) then
    create policy "pipelines_delete"
      on public.pipelines
      for delete to authenticated
      using (
        exists (
          select 1
          from public.organizations o
          where o.id = public.pipelines.organization_id
            and o.owner_user_id = auth.uid()
        )
      );
  end if;
end
$$;

create table if not exists public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.pipelines(id) on delete cascade,
  name text not null,
  description text,
  stage_order integer not null check (stage_order > 0),
  color text default '#3B82F6',
  sla_days integer check (sla_days >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists pipeline_stages_unique_order_idx
  on public.pipeline_stages (pipeline_id, stage_order);

create unique index if not exists pipeline_stages_unique_name_idx
  on public.pipeline_stages (pipeline_id, lower(name));

create index if not exists pipeline_stages_pipeline_idx
  on public.pipeline_stages (pipeline_id);

alter table public.pipeline_stages enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pipeline_stages'
      and policyname = 'pipeline_stages_select'
  ) then
    create policy "pipeline_stages_select"
      on public.pipeline_stages
      for select to authenticated
      using (
        exists (
          select 1
          from public.pipelines p
          join public.organizations o on o.id = p.organization_id
          where p.id = public.pipeline_stages.pipeline_id
            and o.owner_user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pipeline_stages'
      and policyname = 'pipeline_stages_insert'
  ) then
    create policy "pipeline_stages_insert"
      on public.pipeline_stages
      for insert to authenticated
      with check (
        exists (
          select 1
          from public.pipelines p
          join public.organizations o on o.id = p.organization_id
          where p.id = public.pipeline_stages.pipeline_id
            and o.owner_user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pipeline_stages'
      and policyname = 'pipeline_stages_update'
  ) then
    create policy "pipeline_stages_update"
      on public.pipeline_stages
      for update to authenticated
      using (
        exists (
          select 1
          from public.pipelines p
          join public.organizations o on o.id = p.organization_id
          where p.id = public.pipeline_stages.pipeline_id
            and o.owner_user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from public.pipelines p
          join public.organizations o on o.id = p.organization_id
          where p.id = public.pipeline_stages.pipeline_id
            and o.owner_user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pipeline_stages'
      and policyname = 'pipeline_stages_delete'
  ) then
    create policy "pipeline_stages_delete"
      on public.pipeline_stages
      for delete to authenticated
      using (
        exists (
          select 1
          from public.pipelines p
          join public.organizations o on o.id = p.organization_id
          where p.id = public.pipeline_stages.pipeline_id
            and o.owner_user_id = auth.uid()
        )
      );
  end if;
end
$$;

create table if not exists public.job_pipelines (
  job_id uuid not null references public.jobs(id) on delete cascade,
  pipeline_id uuid not null references public.pipelines(id) on delete cascade,
  assigned_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (job_id, pipeline_id)
);

create index if not exists job_pipelines_pipeline_idx
  on public.job_pipelines (pipeline_id, job_id);

alter table public.job_pipelines enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'job_pipelines'
      and policyname = 'job_pipelines_select'
  ) then
    create policy "job_pipelines_select"
      on public.job_pipelines
      for select to authenticated
      using (
        exists (
          select 1
          from public.jobs j
          join public.organizations o on o.id = j.organization_id
          where j.id = public.job_pipelines.job_id
            and o.owner_user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'job_pipelines'
      and policyname = 'job_pipelines_insert'
  ) then
    create policy "job_pipelines_insert"
      on public.job_pipelines
      for insert to authenticated
      with check (
        exists (
          select 1
          from public.jobs j
          join public.organizations o on o.id = j.organization_id
          where j.id = public.job_pipelines.job_id
            and o.owner_user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'job_pipelines'
      and policyname = 'job_pipelines_delete'
  ) then
    create policy "job_pipelines_delete"
      on public.job_pipelines
      for delete to authenticated
      using (
        exists (
          select 1
          from public.jobs j
          join public.organizations o on o.id = j.organization_id
          where j.id = public.job_pipelines.job_id
            and o.owner_user_id = auth.uid()
        )
      );
  end if;
end
$$;

commit;
