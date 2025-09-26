-- =========================================================
-- 019_update_reviews_workflow.sql
-- Adds workflow fields for reviews, soft skill votes, and suggestions
-- Tightens RLS so reviews remain private until released
-- =========================================================

begin;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'review_status') then
    create type public.review_status as enum ('draft', 'submitted', 'released');
  end if;
end
$$;

alter table public.reviews
  add column if not exists reaction smallint,
  add column if not exists status public.review_status not null default 'draft',
  add column if not exists is_comment_public boolean not null default false,
  add column if not exists submitted_at timestamptz,
  add column if not exists revealed_at timestamptz;

create index if not exists reviews_released_subject_idx
  on public.reviews(subject_type, subject_id)
  where status = 'released';

create table if not exists public.review_soft_skill_votes (
  review_id uuid not null references public.reviews(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, skill_id)
);

create index if not exists review_soft_skill_votes_review_idx
  on public.review_soft_skill_votes(review_id);
create index if not exists review_soft_skill_votes_skill_idx
  on public.review_soft_skill_votes(skill_id);

create table if not exists public.review_skill_suggestions (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  suggested_skill_id uuid references public.skills(id) on delete set null,
  suggested_label text,
  created_at timestamptz not null default now(),
  constraint review_skill_suggestions_label_or_skill
    check (suggested_skill_id is not null or coalesce(trim(suggested_label), '') <> '')
);

create index if not exists review_skill_suggestions_review_idx
  on public.review_skill_suggestions(review_id);
create index if not exists review_skill_suggestions_skill_idx
  on public.review_skill_suggestions(suggested_skill_id);

alter table public.review_soft_skill_votes enable row level security;
alter table public.review_skill_suggestions enable row level security;

-- Refresh review policies to respect release workflow
alter table public.reviews enable row level security;

drop policy if exists "reviews_read" on public.reviews;
drop policy if exists "reviews_insert" on public.reviews;
drop policy if exists "reviews_update" on public.reviews;
drop policy if exists "reviews_delete" on public.reviews;

create policy "reviews_read"
  on public.reviews for select
  to anon, authenticated
  using (
    status = 'released'
    or author_user_id = auth.uid()
  );

create policy "reviews_insert"
  on public.reviews for insert
  to authenticated
  with check (author_user_id = auth.uid());

create policy "reviews_update"
  on public.reviews for update
  to authenticated
  using (author_user_id = auth.uid())
  with check (author_user_id = auth.uid());

create policy "reviews_delete"
  on public.reviews for delete
  to authenticated
  using (author_user_id = auth.uid());

-- Update review skill rating policies for release workflow
alter table public.review_skill_ratings enable row level security;

drop policy if exists "rsr_read" on public.review_skill_ratings;
drop policy if exists "rsr_insert" on public.review_skill_ratings;

create policy "rsr_read"
  on public.review_skill_ratings for select
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

create policy "rsr_insert"
  on public.review_skill_ratings for insert
  to authenticated
  with check (
    exists (
      select 1 from public.reviews r
      where r.id = review_id
        and r.author_user_id = auth.uid()
    )
  );

-- Update review aspect policies for release workflow
alter table public.review_aspects enable row level security;

drop policy if exists "ra_read" on public.review_aspects;
drop policy if exists "ra_insert" on public.review_aspects;

create policy "ra_read"
  on public.review_aspects for select
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

create policy "ra_insert"
  on public.review_aspects for insert
  to authenticated
  with check (
    exists (
      select 1 from public.reviews r
      where r.id = review_id
        and r.author_user_id = auth.uid()
    )
  );

-- Policies for soft skill votes
create policy "rssv_read"
  on public.review_soft_skill_votes for select
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

create policy "rssv_insert"
  on public.review_soft_skill_votes for insert
  to authenticated
  with check (
    exists (
      select 1 from public.reviews r
      where r.id = review_id
        and r.author_user_id = auth.uid()
    )
  );

create policy "rssv_delete"
  on public.review_soft_skill_votes for delete
  to authenticated
  using (
    exists (
      select 1 from public.reviews r
      where r.id = review_id
        and r.author_user_id = auth.uid()
    )
  );

-- Policies for skill suggestions
create policy "rss_read"
  on public.review_skill_suggestions for select
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

create policy "rss_insert"
  on public.review_skill_suggestions for insert
  to authenticated
  with check (
    exists (
      select 1 from public.reviews r
      where r.id = review_id
        and r.author_user_id = auth.uid()
    )
  );

create policy "rss_update"
  on public.review_skill_suggestions for update
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

create policy "rss_delete"
  on public.review_skill_suggestions for delete
  to authenticated
  using (
    exists (
      select 1 from public.reviews r
      where r.id = review_id
        and r.author_user_id = auth.uid()
    )
  );

commit;
