-- =========================================================
-- 046_create_soft_skills_system.sql
-- Create soft skills reference system and enhance review workflow
-- =========================================================

begin;

-- =========================
-- Soft Skills Reference Table
-- =========================
create table if not exists public.soft_skills (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('reliability', 'collaboration', 'professionalism', 'technical')),
  name text not null,
  description text,
  order_index int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category, name)
);

create index if not exists soft_skills_category_idx on public.soft_skills(category, order_index);
create index if not exists soft_skills_active_idx on public.soft_skills(is_active) where is_active = true;

-- =========================
-- Enhance review_soft_skill_votes
-- =========================
alter table public.review_soft_skill_votes
  add column if not exists rating smallint check (rating is null or (rating between 1 and 5)),
  add column if not exists is_strength boolean,
  add column if not exists notes text;

-- Update existing records to have is_strength = true by default
update public.review_soft_skill_votes
set is_strength = true
where is_strength is null;

-- Create composite index for better query performance
create index if not exists review_soft_skill_votes_review_strength_idx
  on public.review_soft_skill_votes(review_id, is_strength);

-- =========================
-- Review Progress Tracking
-- =========================
create table if not exists public.review_progress (
  review_id uuid primary key references public.reviews(id) on delete cascade,
  steps_completed jsonb not null default '{}'::jsonb,
  last_step_completed text,
  current_step int not null default 1,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists review_progress_review_idx on public.review_progress(review_id);

-- =========================
-- Review Category Ratings
-- Track aggregate ratings per category (skills, reliability, collaboration)
-- =========================
create table if not exists public.review_category_ratings (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  category text not null check (category in ('skills', 'reliability', 'collaboration', 'professionalism', 'technical')),
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (review_id, category)
);

create index if not exists review_category_ratings_review_idx on public.review_category_ratings(review_id);
create index if not exists review_category_ratings_category_idx on public.review_category_ratings(category);

-- =========================
-- RLS Policies for new tables
-- =========================

-- Soft skills are publicly readable
alter table public.soft_skills enable row level security;

create policy "soft_skills_read"
  on public.soft_skills for select
  to anon, authenticated
  using (is_active = true);

-- Review progress follows same pattern as reviews
alter table public.review_progress enable row level security;

create policy "review_progress_read"
  on public.review_progress for select
  to authenticated
  using (
    exists (
      select 1 from public.reviews r
      where r.id = review_id
        and (
          r.status = 'released'
          or r.author_user_id = auth.uid()
        )
    )
  );

create policy "review_progress_insert"
  on public.review_progress for insert
  to authenticated
  with check (
    exists (
      select 1 from public.reviews r
      where r.id = review_id
        and r.author_user_id = auth.uid()
    )
  );

create policy "review_progress_update"
  on public.review_progress for update
  to authenticated
  using (
    exists (
      select 1 from public.reviews r
      where r.id = review_id
        and r.author_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.reviews r
      where r.id = review_id
        and r.author_user_id = auth.uid()
    )
  );

-- Review category ratings follow review permissions
alter table public.review_category_ratings enable row level security;

create policy "review_category_ratings_read"
  on public.review_category_ratings for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.reviews r
      where r.id = review_id
        and (
          r.status = 'released'
          or r.author_user_id = auth.uid()
        )
    )
  );

create policy "review_category_ratings_insert"
  on public.review_category_ratings for insert
  to authenticated
  with check (
    exists (
      select 1 from public.reviews r
      where r.id = review_id
        and r.author_user_id = auth.uid()
    )
  );

create policy "review_category_ratings_update"
  on public.review_category_ratings for update
  to authenticated
  using (
    exists (
      select 1 from public.reviews r
      where r.id = review_id
        and r.author_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.reviews r
      where r.id = review_id
        and r.author_user_id = auth.uid()
    )
  );

-- =========================
-- Helper Functions
-- =========================

-- Function to get review progress percentage
create or replace function public.get_review_progress_percentage(p_review_id uuid)
returns numeric
language plpgsql stable
as $$
declare
  v_total_steps int := 8; -- Total steps in review process
  v_completed_steps int := 0;
  v_steps jsonb;
begin
  select steps_completed into v_steps
  from public.review_progress
  where review_id = p_review_id;

  if v_steps is null then
    return 0;
  end if;

  -- Count completed steps
  select count(*)::int into v_completed_steps
  from jsonb_each(v_steps)
  where value::boolean = true;

  return round((v_completed_steps::numeric / v_total_steps) * 100, 2);
end;
$$;

comment on function public.get_review_progress_percentage(uuid) is
  'Calculate review completion percentage based on steps completed';

-- Function to update review progress
create or replace function public.update_review_progress(
  p_review_id uuid,
  p_step text,
  p_completed boolean default true
)
returns void
language plpgsql
as $$
begin
  insert into public.review_progress (review_id, steps_completed, last_step_completed, updated_at)
  values (
    p_review_id,
    jsonb_build_object(p_step, p_completed),
    case when p_completed then p_step else null end,
    now()
  )
  on conflict (review_id) do update
  set steps_completed = review_progress.steps_completed || jsonb_build_object(p_step, p_completed),
      last_step_completed = case when p_completed then p_step else review_progress.last_step_completed end,
      updated_at = now();
end;
$$;

comment on function public.update_review_progress(uuid, text, boolean) is
  'Update progress tracking for a review, marking specific steps as complete or incomplete';

-- Grant necessary permissions
grant select on public.soft_skills to anon, authenticated;
grant select on public.review_progress to authenticated;
grant select on public.review_category_ratings to anon, authenticated;

grant all on public.soft_skills to service_role;
grant all on public.review_progress to service_role;
grant all on public.review_category_ratings to service_role;

commit;
