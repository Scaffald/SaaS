# ATS Schema Design Document

## Overview

This document outlines the comprehensive database schema design for Scaffald's Applicant Tracking System (ATS) functionality. The design builds upon the existing schema foundation while adding advanced ATS features to support the complete hiring workflow.

## Current Schema Analysis

### ✅ Existing ATS-Ready Tables

Our current database schema provides a solid foundation for ATS functionality:

**Core Tables:**
- `jobs` - Job postings with status, compensation, location, and skills requirements
- `applications` - Basic application tracking with status pipeline
- `organizations` - Company/employer management with proper RLS
- `users` + `profiles` - Candidate profiles with comprehensive data
- `skills` + `job_skills` - Skills matching system with proficiency levels
- `user_skills` - Candidate skill proficiency tracking
- `user_certifications`, `user_education`, `user_experience` - Rich candidate profiles

**Existing Pipeline Stages:**
```sql
status in ('new','screen','interview','offer','hired','rejected','withdrawn')
```

**Existing Features:**
- Geographic support with PostGIS
- Skills-based matching system
- Application workflow with basic status tracking
- RLS policies and proper indexing
- Review and rating system
- Organization and team management

### ❌ Missing ATS Components

**Pipeline Management:**
- Custom pipeline stages per organization
- Pipeline templates for different job types
- Stage transition tracking and history

**Communication System:**
- Enhanced messaging between employers and candidates
- Message templates for different stages
- Email fallback and notification system

**Scheduling System:**
- Interview scheduling with calendar integration
- Self-scheduling for candidates
- Meeting management and feedback

**Document Management:**
- Document uploads for applications
- Document verification and storage
- Template management

**Analytics & Reporting:**
- Application funnel analytics
- Source-of-hire tracking
- Time-to-hire reporting
- EEO/OFCCP compliance reporting

## Required Schema Enhancements

### 1. Pipeline Management System

#### Custom Pipeline Stages
```sql
-- Custom pipeline stages per organization
CREATE TABLE public.pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  stage_order integer NOT NULL,
  is_default boolean DEFAULT false,
  color text DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, stage_order)
);

-- Pipeline templates for different job types
CREATE TABLE public.pipeline_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  job_type text, -- 'construction', 'office', 'management', etc.
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Template stages mapping
CREATE TABLE public.pipeline_template_stages (
  template_id uuid NOT NULL REFERENCES public.pipeline_templates(id) ON DELETE CASCADE,
  stage_name text NOT NULL,
  stage_order integer NOT NULL,
  description text,
  PRIMARY KEY (template_id, stage_order)
);
```

#### Application Stage History
```sql
-- Application stage history tracking
CREATE TABLE public.application_stage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  from_stage text,
  to_stage text NOT NULL,
  changed_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reason text,
  notes text,
  created_at timestamptz DEFAULT now()
);
```

### 2. Enhanced Application Management

#### Application Notes and Ratings
```sql
-- Application notes and ratings
CREATE TABLE public.application_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  note_type text DEFAULT 'note' CHECK (note_type IN ('note', 'rating', 'feedback')),
  content text NOT NULL,
  rating smallint CHECK (rating BETWEEN 1 AND 5),
  is_private boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Application tags for organization
CREATE TABLE public.application_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#6B7280',
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, name)
);

CREATE TABLE public.application_tag_assignments (
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.application_tags(id) ON DELETE CASCADE,
  assigned_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (application_id, tag_id)
);
```

### 3. Communication System

#### Enhanced Messaging
```sql
-- Enhanced messaging system
CREATE TABLE public.application_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  message_type text DEFAULT 'message' CHECK (message_type IN ('message', 'template', 'system')),
  subject text,
  body text NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  template_id uuid, -- Reference to message templates
  created_at timestamptz DEFAULT now()
);

-- Message templates for different stages
CREATE TABLE public.message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  stage text, -- Optional: specific to pipeline stage
  subject text NOT NULL,
  body text NOT NULL,
  variables jsonb DEFAULT '{}', -- Available template variables
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 4. Scheduling System

#### Interview Management
```sql
-- Interview scheduling
CREATE TABLE public.interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  interview_type text DEFAULT 'phone' CHECK (interview_type IN ('phone', 'video', 'in_person', 'panel')),
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  location text,
  meeting_url text,
  interviewer_user_ids uuid[] DEFAULT '{}',
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  notes text,
  feedback jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Calendar integration
CREATE TABLE public.calendar_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google', 'outlook', 'apple')),
  external_calendar_id text NOT NULL,
  access_token_encrypted text NOT NULL,
  refresh_token_encrypted text,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);
```

### 5. Document Management

#### Document Uploads
```sql
-- Document uploads for applications
CREATE TABLE public.application_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('resume', 'cover_letter', 'certificate', 'license', 'id', 'other')),
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size_bytes bigint,
  mime_type text,
  uploaded_by_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_verified boolean DEFAULT false,
  verification_notes text,
  created_at timestamptz DEFAULT now()
);

-- Document templates for different job types
CREATE TABLE public.document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  job_type text,
  document_type text NOT NULL,
  template_name text NOT NULL,
  template_content text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

### 6. Analytics & Reporting

#### Application Analytics
```sql
-- Application analytics events
CREATE TABLE public.application_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('viewed', 'applied', 'stage_changed', 'interview_scheduled', 'offer_made', 'hired', 'rejected')),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Job posting analytics
CREATE TABLE public.job_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('viewed', 'applied', 'shared', 'bookmarked')),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  source text, -- 'scaffald', 'google_jobs', 'referral', 'external'
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
```

### 7. Compliance & Security

#### Data Privacy
```sql
-- GDPR/CCPA compliance tracking
CREATE TABLE public.data_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  request_type text NOT NULL CHECK (request_type IN ('full_deletion', 'data_export', 'data_correction')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  requested_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  processed_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- EEO/OFCCP reporting
CREATE TABLE public.eeo_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  report_type text NOT NULL CHECK (report_type IN ('applicant_flow', 'hiring_summary', 'demographics')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  data jsonb NOT NULL,
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

## Table Visibility Strategy

### Public Tables (Visible to all authenticated users)
```sql
-- These should remain PUBLIC for discoverability and transparency
public.jobs                    -- Job postings (already public)
public.organizations          -- Company profiles (already public)
public.pipeline_templates     -- Template sharing across orgs
public.message_templates      -- Template sharing (if desired)
public.document_templates     -- Template sharing
```

### Private Tables (Organization-scoped access only)
```sql
-- These contain sensitive ATS data and should be PRIVATE
public.pipeline_stages        -- Org-specific pipeline config
public.application_stage_history -- Sensitive candidate data
public.application_notes      -- Private recruiter notes
public.application_tags       -- Internal organization tags
public.application_tag_assignments -- Internal tagging
public.application_messages   -- Private communications
public.interviews            -- Sensitive scheduling data
public.calendar_integrations -- Personal calendar data
public.application_documents  -- Personal documents
public.application_events    -- Internal analytics
public.job_analytics         -- Internal job metrics
public.data_deletion_requests -- Compliance data
public.eeo_reports          -- Sensitive compliance data
```

## Row Level Security (RLS) Implementation

### Standard RLS Pattern for ATS Tables
```sql
-- Enable RLS on all private ATS tables
ALTER TABLE public.application_notes ENABLE ROW LEVEL SECURITY;

-- Standard pattern for ATS private tables
CREATE POLICY "ats_table_access"
  ON public.application_notes FOR ALL
  TO authenticated
  USING (
    -- Organization owner
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      JOIN public.organizations o ON o.id = j.organization_id
      WHERE a.id = application_id AND o.owner_user_id = auth.uid()
    )
    -- Organization admin/manager
    OR EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      JOIN public.organizations o ON o.id = j.organization_id
      JOIN public.role_assignments ra ON ra.scope_org_id = o.id
      JOIN public.roles r ON r.id = ra.role_id
      WHERE a.id = application_id
        AND ra.user_id = auth.uid()
        AND r.scope = 'organization'
        AND r.name IN ('admin', 'manager')
    )
    -- Author of the note
    OR author_user_id = auth.uid()
  );
```

## Migration Strategy

### Phase 1: Foundation (MVP)
**Priority: High**
- Pipeline stages and templates
- Enhanced application management
- Basic messaging system
- Application notes and ratings

**Migration Files:**
- `029_create_ats_pipeline_system.sql`
- `030_enhance_application_management.sql`
- `031_add_application_messaging.sql`

### Phase 2: Communication & Scheduling
**Priority: Medium**
- Advanced messaging with templates
- Interview scheduling system
- Calendar integration
- Document management

**Migration Files:**
- `032_add_interview_scheduling.sql`
- `033_add_calendar_integration.sql`
- `034_add_document_management.sql`

### Phase 3: Analytics & Compliance
**Priority: Medium**
- Application analytics
- Job posting analytics
- EEO/OFCCP reporting
- Data privacy compliance

**Migration Files:**
- `035_add_ats_analytics.sql`
- `036_add_compliance_features.sql`

### Phase 4: Advanced Features
**Priority: Low**
- Advanced integrations
- Background check APIs
- HRIS integration
- Union-aware hiring

**Migration Files:**
- `037_add_advanced_integrations.sql`

## Key Design Decisions

### 1. Build on Existing Schema
- Leverage current `jobs`, `applications`, and `organizations` tables
- Maintain consistency with existing RLS patterns
- Use established naming conventions

### 2. Flexible Pipeline System
- Support custom stages per organization
- Maintain default pipeline templates
- Enable easy customization for different job types

### 3. Comprehensive Audit Trail
- Track all application changes and interactions
- Maintain complete history for compliance
- Enable rollback and data recovery

### 4. Multi-tenant Architecture
- All new tables include `organization_id` for proper data isolation
- Strict RLS policies prevent cross-organization data access
- Scalable design for multiple organizations

### 5. Compliance First
- Built-in support for GDPR, CCPA, and EEO reporting
- Data retention and deletion policies
- Audit logging for sensitive operations

## Performance Considerations

### Indexing Strategy
```sql
-- Key indexes for performance
CREATE INDEX idx_application_stage_history_app_id ON public.application_stage_history(application_id);
CREATE INDEX idx_application_notes_app_id ON public.application_notes(application_id);
CREATE INDEX idx_application_messages_app_id ON public.application_messages(application_id);
CREATE INDEX idx_interviews_app_id ON public.interviews(application_id);
CREATE INDEX idx_application_events_app_id ON public.application_events(application_id);

-- Composite indexes for common queries
CREATE INDEX idx_applications_org_status ON public.applications(organization_id, status);
CREATE INDEX idx_job_analytics_job_event ON public.job_analytics(job_id, event_type);
```

### Query Optimization
- Use materialized views for complex analytics queries
- Implement proper pagination for large result sets
- Cache frequently accessed pipeline configurations
- Optimize RLS policies for performance

## Security Considerations

### Data Encryption
- Encrypt sensitive calendar integration tokens
- Hash personal document references
- Secure file storage with proper access controls

### Access Controls
- Role-based access control (RBAC) for all ATS features
- Principle of least privilege for data access
- Regular audit of access patterns and permissions

### Compliance Monitoring
- Automated compliance reporting
- Data retention policy enforcement
- Regular security assessments

## Next Steps

1. **Review and Approve Schema Design**
   - Technical review of proposed schema
   - Security assessment of RLS policies
   - Performance impact analysis

2. **Create Migration Files**
   - Implement Phase 1 migrations
   - Add comprehensive RLS policies
   - Include proper indexing strategy

3. **Update TypeScript Types**
   - Generate new types from schema
   - Update existing type definitions
   - Ensure type safety across application

4. **Implement Frontend Components**
   - Pipeline management UI
   - Application management interface
   - Messaging and communication features

5. **Testing and Validation**
   - Unit tests for new schema
   - Integration tests for ATS workflow
   - Performance testing with large datasets

---

**Document Version:** 1.0  
**Last Updated:** October 2, 2025  
**Author:** AI Assistant  
**Status:** Draft - Pending Review
