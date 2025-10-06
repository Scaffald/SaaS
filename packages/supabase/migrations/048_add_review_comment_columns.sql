-- =========================================================
-- 048_add_review_comment_columns.sql
-- Add missing comment columns to reviews table
-- =========================================================

begin;

-- Add comment and is_comment_public columns to reviews table
alter table public.reviews
  add column if not exists comment text,
  add column if not exists is_comment_public boolean default false;

-- Add index for filtering by comment existence
create index if not exists reviews_has_comment_idx 
  on public.reviews(id) 
  where comment is not null;

-- Update RLS policies to include comment in accessible columns
-- (The existing policies already cover this, but documenting for clarity)
comment on column public.reviews.comment is 
  'Optional text comment/summary provided by the reviewer';

comment on column public.reviews.is_comment_public is 
  'Whether the comment should be visible to other users (defaults to private)';

commit;
