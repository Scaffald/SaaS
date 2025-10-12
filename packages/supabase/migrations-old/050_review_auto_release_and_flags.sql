-- =========================================================
-- 050_review_auto_release_and_flags.sql
-- Enables auto-release of reviews and adds review flagging system
-- =========================================================

BEGIN;

-- =========================
-- Review Flags Table
-- =========================
CREATE TABLE IF NOT EXISTS public.review_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  flagged_by_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('inappropriate', 'false_information', 'spam', 'harassment', 'other')),
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'removed')),
  reviewed_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (review_id, flagged_by_user_id)
);

CREATE INDEX IF NOT EXISTS review_flags_review_idx ON public.review_flags(review_id);
CREATE INDEX IF NOT EXISTS review_flags_status_idx ON public.review_flags(status, created_at DESC);
CREATE INDEX IF NOT EXISTS review_flags_flagged_by_idx ON public.review_flags(flagged_by_user_id);

-- =========================
-- RLS Policies for Review Flags
-- =========================
ALTER TABLE public.review_flags ENABLE ROW LEVEL SECURITY;

-- Users can view flags on reviews where they are the subject
CREATE POLICY "review_flags_read_own_profile"
  ON public.review_flags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = review_id
        AND r.subject_type = 'user'
        AND r.subject_id = auth.uid()
    )
    OR flagged_by_user_id = auth.uid()
  );

-- Users can flag reviews on their own profile only
CREATE POLICY "review_flags_insert_own_profile"
  ON public.review_flags FOR INSERT
  TO authenticated
  WITH CHECK (
    flagged_by_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = review_id
        AND r.subject_type = 'user'
        AND r.subject_id = auth.uid()
        AND r.status = 'released'
    )
  );

-- Users can update their own flags (e.g., add notes)
CREATE POLICY "review_flags_update_own"
  ON public.review_flags FOR UPDATE
  TO authenticated
  USING (flagged_by_user_id = auth.uid())
  WITH CHECK (flagged_by_user_id = auth.uid());

-- =========================
-- Grant Service Role Access
-- =========================
GRANT ALL ON public.review_flags TO service_role;

-- =========================
-- Update existing submitted reviews to released
-- (One-time migration for existing data)
-- =========================
UPDATE public.reviews
SET 
  status = 'released',
  revealed_at = COALESCE(revealed_at, submitted_at, updated_at)
WHERE status = 'submitted';

COMMIT;
