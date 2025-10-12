-- Extend applications with pipeline references and history
begin;

alter table if exists public.applications
  add column if not exists pipeline_id uuid references public.pipelines(id) on delete set null;

alter table if exists public.applications
  add column if not exists pipeline_stage_id uuid references public.pipeline_stages(id) on delete set null;

alter table if exists public.applications
  add column if not exists stage_entered_at timestamptz not null default now();

create index if not exists applications_pipeline_id_idx
  on public.applications (pipeline_id);

create index if not exists applications_pipeline_stage_idx
  on public.applications (pipeline_stage_id);

create table if not exists public.application_stage_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  from_stage_id uuid references public.pipeline_stages(id) on delete set null,
  to_stage_id uuid not null references public.pipeline_stages(id) on delete set null,
  changed_by uuid references public.users(id) on delete set null,
  reason text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists application_stage_history_app_idx
  on public.application_stage_history (application_id, created_at desc);

alter table public.application_stage_history enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'application_stage_history'
      and policyname = 'application_stage_history_select'
  ) then
    create policy "application_stage_history_select"
      on public.application_stage_history
      for select to authenticated
      using (
        exists (
          select 1
          from public.applications a
          join public.jobs j on j.id = a.job_id
          join public.organizations o on o.id = j.organization_id
          where a.id = public.application_stage_history.application_id
            and (
              a.user_id = auth.uid()
              or o.owner_user_id = auth.uid()
            )
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'application_stage_history'
      and policyname = 'application_stage_history_insert'
  ) then
    create policy "application_stage_history_insert"
      on public.application_stage_history
      for insert to authenticated
      with check (
        exists (
          select 1
          from public.applications a
          join public.jobs j on j.id = a.job_id
          join public.organizations o on o.id = j.organization_id
          where a.id = public.application_stage_history.application_id
            and o.owner_user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'application_stage_history'
      and policyname = 'application_stage_history_delete'
  ) then
    create policy "application_stage_history_delete"
      on public.application_stage_history
      for delete to authenticated
      using (
        exists (
          select 1
          from public.applications a
          join public.jobs j on j.id = a.job_id
          join public.organizations o on o.id = j.organization_id
          where a.id = public.application_stage_history.application_id
            and o.owner_user_id = auth.uid()
        )
      );
  end if;
end
$$;

commit;
