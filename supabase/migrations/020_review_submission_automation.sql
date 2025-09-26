-- =========================================================
-- 020_review_submission_automation.sql
-- Automate review submission processing, skill aggregation, and release workflow
-- =========================================================

begin;

-- Table to log proficiency adjustments derived from reviews
create table if not exists public.review_skill_proficiency_logs (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  subject_user_id uuid not null references public.users(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  rating_score smallint not null check (rating_score between 1 and 5),
  aggregated_score numeric(5,2) not null,
  previous_proficiency smallint,
  new_proficiency smallint not null check (new_proficiency between 0 and 5),
  delta smallint not null,
  created_at timestamptz not null default now()
);

create index if not exists review_skill_proficiency_logs_review_idx
  on public.review_skill_proficiency_logs(review_id);
create index if not exists review_skill_proficiency_logs_subject_skill_idx
  on public.review_skill_proficiency_logs(subject_user_id, skill_id);

alter table public.review_skill_proficiency_logs enable row level security;

create policy "rspl_read"
  on public.review_skill_proficiency_logs for select
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

create policy "rspl_insert"
  on public.review_skill_proficiency_logs for insert
  to authenticated
  with check (
    exists (
      select 1 from public.reviews r
      where r.id = review_id
        and r.author_user_id = auth.uid()
    )
  );

-- Columns to coordinate reciprocal releases and automatic reveal windows
alter table public.reviews
  add column if not exists paired_review_id uuid references public.reviews(id) on delete set null,
  add column if not exists release_after interval default interval '3 days';

create index if not exists reviews_paired_review_idx on public.reviews(paired_review_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'reviews_pair_not_self'
      and conrelid = 'public.reviews'::regclass
  ) then
    alter table public.reviews
      add constraint reviews_pair_not_self
        check (paired_review_id is null or paired_review_id <> id);
  end if;
end;
$$;

-- Procedure to recalculate skill proficiency adjustments when a review is submitted
create or replace function public.process_review_submission(p_review_id uuid)
returns void
language plpgsql
as $$
declare
  v_subject_id uuid;
  v_subject_type text;
  v_skill_id uuid;
  v_rating smallint;
  v_avg numeric;
  v_old smallint;
  v_new smallint;
begin
  select subject_id, subject_type
  into v_subject_id, v_subject_type
  from public.reviews
  where id = p_review_id;

  if v_subject_id is null or v_subject_type <> 'user' then
    return;
  end if;

  for v_skill_id, v_rating in
    select skill_id, score
    from public.review_skill_ratings
    where review_id = p_review_id
  loop
    select avg(rsr.score)::numeric
    into v_avg
    from public.review_skill_ratings rsr
    join public.reviews r on r.id = rsr.review_id
    where r.subject_type = 'user'
      and r.subject_id = v_subject_id
      and r.status in ('submitted','released')
      and rsr.skill_id = v_skill_id;

    v_avg := coalesce(v_avg, v_rating::numeric);

    select proficiency
    into v_old
    from public.user_skills
    where user_id = v_subject_id
      and skill_id = v_skill_id;

    v_new := greatest(0, least(5, round(v_avg)::int));

    if v_old is null then
      insert into public.user_skills(user_id, skill_id, proficiency, source, last_verified_at)
      values (v_subject_id, v_skill_id, v_new, 'assessed', now())
      on conflict (user_id, skill_id) do update
      set proficiency = excluded.proficiency,
          last_verified_at = excluded.last_verified_at,
          source = case
            when public.user_skills.source = 'self' and excluded.proficiency >= public.user_skills.proficiency then 'assessed'
            else public.user_skills.source
          end
      where public.user_skills.proficiency is distinct from excluded.proficiency;
    else
      update public.user_skills
      set proficiency = v_new,
          last_verified_at = now(),
          source = case
            when source = 'self' and v_new >= proficiency then 'assessed'
            else source
          end
      where user_id = v_subject_id
        and skill_id = v_skill_id
        and proficiency is distinct from v_new;
    end if;

    insert into public.review_skill_proficiency_logs(
      review_id,
      subject_user_id,
      skill_id,
      rating_score,
      aggregated_score,
      previous_proficiency,
      new_proficiency,
      delta
    )
    values (
      p_review_id,
      v_subject_id,
      v_skill_id,
      v_rating,
      v_avg,
      v_old,
      v_new,
      v_new - coalesce(v_old, 0)
    );
  end loop;
end;
$$;

comment on function public.process_review_submission(uuid) is
  'Recalculate user skill proficiencies using review skill ratings when a review is submitted.';

-- Trigger helpers for review submission workflow
create or replace function public.tg_reviews_set_submitted_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'submitted' and new.submitted_at is null then
    new.submitted_at := now();
  end if;
  return new;
end;
$$;

create or replace function public.tg_reviews_after_submission()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'submitted' then
    perform public.process_review_submission(new.id);
  end if;
  return new;
end;
$$;

-- Refresh triggers to ensure submission automation runs
drop trigger if exists trg_reviews_set_submitted_at on public.reviews;
create trigger trg_reviews_set_submitted_at
  before insert or update of status on public.reviews
  for each row
  execute function public.tg_reviews_set_submitted_at();

drop trigger if exists trg_reviews_process_submission on public.reviews;
create trigger trg_reviews_process_submission
  after insert or update of status on public.reviews
  for each row
  when (new.status = 'submitted' and (tg_op = 'INSERT' or old.status is distinct from new.status))
  execute function public.tg_reviews_after_submission();

-- View summarizing review highlights per user
create or replace view public.v_user_review_summary as
with submitted_reviews as (
  select
    r.subject_id as user_id,
    r.metadata,
    r.submitted_at,
    r.revealed_at
  from public.reviews r
  where r.subject_type = 'user'
    and r.status in ('submitted','released')
),
strengths as (
  select user_id, array_agg(distinct value) filter (where trim(value) <> '') as strengths
  from (
    select user_id, jsonb_array_elements_text(coalesce(metadata->'strengths', '[]'::jsonb)) as value
    from submitted_reviews
  ) s
  group by user_id
),
improvements as (
  select user_id, array_agg(distinct value) filter (where trim(value) <> '') as areas_to_improve
  from (
    select user_id, jsonb_array_elements_text(coalesce(metadata->'areasToImprove', '[]'::jsonb)) as value
    from submitted_reviews
  ) i
  group by user_id
),
soft_skills as (
  select user_id, array_agg(distinct value) filter (where trim(value) <> '') as soft_skills
  from (
    select user_id, jsonb_array_elements_text(coalesce(metadata->'softSkills', '[]'::jsonb)) as value
    from submitted_reviews
  ) s
  group by user_id
),
recommended as (
  select user_id, array_agg(distinct value) filter (where trim(value) <> '') as recommended_skills
  from (
    select user_id, jsonb_array_elements_text(coalesce(metadata->'recommendedSkills', '[]'::jsonb)) as value
    from submitted_reviews
  ) r
  group by user_id
),
timestamps as (
  select
    user_id,
    max(submitted_at) as last_submitted_at,
    max(revealed_at) as last_revealed_at
  from submitted_reviews
  group by user_id
)
select
  t.user_id,
  coalesce(strengths.strengths, '{}'::text[]) as strengths,
  coalesce(improvements.areas_to_improve, '{}'::text[]) as areas_to_improve,
  coalesce(soft_skills.soft_skills, '{}'::text[]) as soft_skills,
  coalesce(recommended.recommended_skills, '{}'::text[]) as recommended_skills,
  t.last_submitted_at,
  t.last_revealed_at
from timestamps t
left join strengths on strengths.user_id = t.user_id
left join improvements on improvements.user_id = t.user_id
left join soft_skills on soft_skills.user_id = t.user_id
left join recommended on recommended.user_id = t.user_id;

grant select on public.v_user_review_summary to anon, authenticated;

-- Function invoked by scheduled tasks to release pending reviews
create or replace function public.release_pending_reviews()
returns integer
language plpgsql
as $$
declare
  v_released_count integer := 0;
begin
  with pair_ready as (
    select distinct r.id as review_id
    from public.reviews r
    join public.reviews p on p.id = r.paired_review_id
    where r.status = 'submitted'
      and p.status = 'submitted'
      and r.submitted_at is not null
      and p.submitted_at is not null
  ),
  pair_union as (
    select review_id from pair_ready
    union
    select r.paired_review_id as review_id
    from public.reviews r
    join pair_ready pr on pr.review_id = r.id
    where r.paired_review_id is not null
  ),
  released_partner as (
    select r.id as review_id
    from public.reviews r
    join public.reviews p on p.id = r.paired_review_id
    where r.status = 'submitted'
      and p.status = 'released'
  ),
  timed_ready as (
    select r.id as review_id
    from public.reviews r
    where r.status = 'submitted'
      and r.submitted_at is not null
      and now() >= r.submitted_at + coalesce(r.release_after, interval '3 days')
  ),
  to_release as (
    select review_id from pair_union
    union
    select review_id from timed_ready
    union
    select review_id from released_partner
  ),
  updated as (
    update public.reviews r
    set status = 'released',
        revealed_at = coalesce(r.revealed_at, now()),
        updated_at = greatest(r.updated_at, now())
    from to_release tr
    where r.id = tr.review_id
      and r.status = 'submitted'
    returning r.id
  )
  select count(*) into v_released_count from updated;

  return coalesce(v_released_count, 0);
end;
$$;

comment on function public.release_pending_reviews() is
  'Cron-invoked helper that releases submitted reviews once peers complete feedback or the release window expires.';

-- Schedule the release job to run every 15 minutes when pg_cron is available
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron with schema cron;

    if not exists (
      select 1 from cron.job
      where jobname = 'release_pending_reviews'
    ) then
      perform cron.schedule('release_pending_reviews', '*/15 * * * *', $$select public.release_pending_reviews();$$);
    end if;
  end if;
end;
$$;

commit;
