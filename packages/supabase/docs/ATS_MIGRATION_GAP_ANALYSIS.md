# ATS Migration Gap Analysis

## Current Database State

### Jobs Table (from types.ts)
Existing columns:
- address, closes_at, compensation, created_at, created_by_user_id, description, employment_type, geo, id, inquiry_capability_questions, location, min_reputation, organization_id, pay_range_max_cents, pay_range_min_cents, pay_range_type, position_level, posted_at, remote_option, required_soft_skills, scheduled_publish_at, search_tsv, slug, status, team_id, title, updated_at, visibility

### Applications Table (from types.ts)
Existing columns:
- answers, archived_at, assigned_at, assigned_by, assigned_to, cover_letter_url, created_at, id, is_shortlisted, job_id, reject_meta, reject_reasons, rejected_at, resume_url, stage_changed_at, status, updated_at, user_id

## Missing Fields from Zod Schemas

### Jobs Table - Missing Fields

#### Application Screening & Team Management
- `require_current_location` (BOOLEAN)
- `require_relocation_willingness` (BOOLEAN)
- `minimum_years_experience` (INTEGER)
- `require_work_authorization` (BOOLEAN)
- `require_earliest_start_date` (BOOLEAN)
- `enable_auto_reject` (BOOLEAN)
- `auto_reject_criteria` (JSONB)
- `assigned_team_id` (UUID) - Note: team_id exists, but assigned_team_id may be different
- `team_ids` (UUID[]) - Array of team IDs
- `team_visibility` (TEXT) - Enum: 'internal_only', 'external_only', 'both'
- `show_team_on_posting` (BOOLEAN)
- `minimum_score` (INTEGER)

#### Job Metadata & Management
- `internal_job_code` (TEXT)
- `department` (TEXT)
- `cost_center` (TEXT)
- `hiring_manager_id` (UUID)
- `recruiter_id` (UUID)
- `number_of_openings` (INTEGER)
- `priority_level` (TEXT) - Enum: 'urgent', 'high', 'normal', 'low'
- `requisition_number` (TEXT)
- `job_category` (TEXT)
- `is_confidential` (BOOLEAN)
- `application_deadline` (TIMESTAMPTZ)
- `target_start_date` (DATE)
- `estimated_hire_date` (DATE)

#### Enhanced Requirements
- `minimum_education_level` (TEXT) - Enum: 'none', 'high_school', 'associate', 'bachelor', 'master', 'phd'
- `require_background_check` (BOOLEAN)
- `background_check_type` (TEXT)
- `require_drug_test` (BOOLEAN)
- `require_drivers_license` (BOOLEAN)
- `drivers_license_type` (TEXT)
- `security_clearance_required` (TEXT)
- `language_requirements` (JSONB)
- `physical_requirements` (JSONB)
- `travel_percentage` (INTEGER)
- `shift_requirements` (TEXT)

#### Compensation & Benefits
- `benefits_summary` (TEXT)
- `has_bonus_structure` (BOOLEAN)
- `bonus_details` (TEXT)
- `has_equity` (BOOLEAN)
- `equity_details` (TEXT)
- `sign_on_bonus_cents` (INTEGER)
- `has_relocation_package` (BOOLEAN)
- `relocation_package_details` (TEXT)
- `overtime_eligible` (BOOLEAN)
- `pay_frequency` (TEXT) - Enum: 'hourly', 'weekly', 'biweekly', 'semimonthly', 'monthly'

#### Application Process Configuration
- `custom_application_questions` (JSONB)
- `required_attachments` (JSONB)
- `requires_assessment` (BOOLEAN)
- `assessment_details` (TEXT)
- `requires_video_interview` (BOOLEAN)
- `estimated_application_time_minutes` (INTEGER)
- `application_expiry_days` (INTEGER)

#### Multi-Location & Scheduling
- `work_locations` (JSONB)
- `relocation_assistance_offered` (BOOLEAN)
- `relocation_assistance_details` (TEXT)
- `work_schedule_details` (TEXT)
- `timezone` (TEXT)

#### Distribution & Visibility
- `posting_channels` (JSONB)
- `is_featured` (BOOLEAN)
- `featured_until` (TIMESTAMPTZ)
- `seo_keywords` (TEXT[])
- `external_application_url` (TEXT)

#### Compliance & Analytics
- `eeo_job_category` (TEXT)
- `is_veteran_friendly` (BOOLEAN)
- `is_disability_friendly` (BOOLEAN)
- `affirmative_action_plan` (BOOLEAN)
- `source_tracking_enabled` (BOOLEAN)
- `utm_parameters` (JSONB)

### Applications Table - Missing Fields

#### Scoring & Progress Tracking
- `score_total` (INTEGER)
- `score_breakdown` (JSONB)
- `score_calculated_at` (TIMESTAMPTZ)
- `current_step` (TEXT) - Enum: 'screening', 'custom_questions', 'attachments', 'assessment', 'video_interview', 'review'
- `completed_steps` (JSONB or TEXT[])
- `screening_answers` (JSONB)
- `attachment_metadata` (JSONB)

## Migration Plan

Migrations will be created in the 141-199 range:
- 141: Application Screening & Team Management
- 142: Job Metadata & Management
- 143: Enhanced Requirements
- 144: Compensation & Benefits
- 145: Application Process Configuration
- 146: Multi-Location & Scheduling
- 147: Distribution & Visibility
- 148: Compliance & Analytics
- 149: Enhanced Applications Table
- 150: Application Attachments Storage
- 151: Application Scoring Function
- 152: Auto-Rejection Function

