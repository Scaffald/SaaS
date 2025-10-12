-- Candidate to job relationship tracking
begin;

create table if not exists public.candidate_job_links (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  relationship_type text not null check (
    relationship_type in ('sourced','referral','talent_pool','reengage')
  ),
  source text,
  notes text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, user_id, relationship_type)
);

create index if not exists candidate_job_links_job_type_idx
  on public.candidate_job_links (job_id, relationship_type);

create index if not exists candidate_job_links_user_type_idx
  on public.candidate_job_links (user_id, relationship_type);

alter table public.candidate_job_links enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'candidate_job_links'
      and policyname = 'candidate_job_links_select'
  ) then
    create policy "candidate_job_links_select"
      on public.candidate_job_links
      for select to authenticated
      using (
        user_id = auth.uid()
        or exists (
          select 1
          from public.jobs j
          join public.organizations o on o.id = j.organization_id
          where j.id = public.candidate_job_links.job_id
            and o.owner_user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'candidate_job_links'
      and policyname = 'candidate_job_links_insert'
  ) then
    create policy "candidate_job_links_insert"
      on public.candidate_job_links
      for insert to authenticated
      with check (
        exists (
          select 1
          from public.jobs j
          join public.organizations o on o.id = j.organization_id
          where j.id = public.candidate_job_links.job_id
            and o.owner_user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'candidate_job_links'
      and policyname = 'candidate_job_links_update'
  ) then
    create policy "candidate_job_links_update"
      on public.candidate_job_links
      for update to authenticated
      using (
        user_id = auth.uid()
        or exists (
          select 1
          from public.jobs j
          join public.organizations o on o.id = j.organization_id
          where j.id = public.candidate_job_links.job_id
            and o.owner_user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from public.jobs j
          join public.organizations o on o.id = j.organization_id
          where j.id = public.candidate_job_links.job_id
            and o.owner_user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'candidate_job_links'
      and policyname = 'candidate_job_links_delete'
  ) then
    create policy "candidate_job_links_delete"
      on public.candidate_job_links
      for delete to authenticated
      using (
        exists (
          select 1
          from public.jobs j
          join public.organizations o on o.id = j.organization_id
          where j.id = public.candidate_job_links.job_id
            and o.owner_user_id = auth.uid()
        )
      );
  end if;
end
$$;

commit;
