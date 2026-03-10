-- Issue #91: Source-of-Hire Tracking
-- Add source tracking field to applications table
-- Issue #89: Stage-Specific Message Templates
-- Create message_templates table for recruiter communication templates

-- ─── Source of Hire ───────────────────────────────────────────────

DO $$
BEGIN
  -- Add source column to applications if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'applications'
    AND column_name = 'source'
  ) THEN
    ALTER TABLE public.applications
      ADD COLUMN source TEXT DEFAULT 'scaffald'
      CHECK (source IN ('scaffald', 'referral', 'external_board', 'social_media', 'company_website', 'other'));

    COMMENT ON COLUMN public.applications.source IS 'How the candidate found/applied for this job (Issue #91)';
  END IF;

  -- Add UTM tracking fields for more granular source attribution
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'applications'
    AND column_name = 'utm_source'
  ) THEN
    ALTER TABLE public.applications
      ADD COLUMN utm_source TEXT,
      ADD COLUMN utm_medium TEXT,
      ADD COLUMN utm_campaign TEXT;
  END IF;
END $$;

-- ─── Message Templates ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  name TEXT NOT NULL,
  body TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'all'
    CHECK (stage IN ('all', 'new', 'screen', 'inquired', 'interview', 'offer', 'hired', 'rejected')),

  variables TEXT[] DEFAULT '{}',
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient lookups by org + stage
CREATE INDEX IF NOT EXISTS idx_message_templates_org_stage
  ON public.message_templates (organization_id, stage)
  WHERE is_active = TRUE;

-- RLS policies
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- Org members can view templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'message_templates' AND policyname = 'message_templates_select'
  ) THEN
    CREATE POLICY message_templates_select ON public.message_templates
      FOR SELECT
      USING (
        organization_id IN (
          SELECT organization_id FROM public.team_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Org members can insert templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'message_templates' AND policyname = 'message_templates_insert'
  ) THEN
    CREATE POLICY message_templates_insert ON public.message_templates
      FOR INSERT
      WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM public.team_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Org members can update their own templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'message_templates' AND policyname = 'message_templates_update'
  ) THEN
    CREATE POLICY message_templates_update ON public.message_templates
      FOR UPDATE
      USING (
        organization_id IN (
          SELECT organization_id FROM public.team_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Only template creator can delete (non-default templates)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'message_templates' AND policyname = 'message_templates_delete'
  ) THEN
    CREATE POLICY message_templates_delete ON public.message_templates
      FOR DELETE
      USING (
        created_by = auth.uid() AND is_default = FALSE
      );
  END IF;
END $$;

COMMENT ON TABLE public.message_templates IS 'Stage-specific message templates for recruiter communication (Issue #89)';
