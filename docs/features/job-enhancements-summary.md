# Job Schema Enhancements Summary

## Overview
This document summarizes the comprehensive enhancements made to the jobs table to support robust internal/external job postings with advanced ATS features.

## Database Migrations

### Migration 067: Application Screening & Team Management
**File:** `packages/supabase/migrations/067_application_screening_team_management.sql`

Added fields for:
- Application screening requirements (current location, relocation willingness, years of experience, work authorization, start date)
- Auto-rejection configuration with flexible JSON criteria
- Team assignment and visibility controls
- Generic score integration (0-100 scale)

**Key Fields:**
- `require_current_location`, `require_relocation_willingness`, `minimum_years_experience`
- `require_work_authorization`, `require_earliest_start_date`
- `enable_auto_reject`, `auto_reject_criteria` (jsonb)
- `assigned_team_id`, `team_visibility`, `show_team_on_posting`
- `minimum_score` (0-100)

### Migration 068: Job Metadata & Management
**File:** `packages/supabase/migrations/068_job_metadata_management.sql`

Added internal management and tracking fields:
- Internal reference codes and organizational tracking
- Hiring team assignments
- Priority levels and openings tracking
- Important date tracking

**Key Fields:**
- `internal_job_code`, `department`, `cost_center`
- `hiring_manager_id`, `recruiter_id`
- `number_of_openings`, `priority_level`, `requisition_number`
- `job_category`, `is_confidential`
- `application_deadline`, `target_start_date`, `estimated_hire_date`

### Migration 069: Enhanced Requirements
**File:** `packages/supabase/migrations/069_enhanced_requirements.sql`

Added comprehensive job requirements:
- Education and background requirements
- Security and licensing requirements
- Language and physical requirements (JSON)
- Travel and shift requirements

**Key Fields:**
- `minimum_education_level`, `require_background_check`, `background_check_type`
- `require_drug_test`, `require_drivers_license`, `drivers_license_type`
- `security_clearance_required`
- `language_requirements` (jsonb), `physical_requirements` (jsonb)
- `travel_percentage`, `shift_requirements`

### Migration 070: Compensation & Benefits
**File:** `packages/supabase/migrations/070_compensation_benefits.sql`

Added detailed compensation information:
- Benefits and bonus structures
- Equity and sign-on bonuses
- Relocation packages
- Pay structure details

**Key Fields:**
- `benefits_summary`, `has_bonus_structure`, `bonus_details`
- `has_equity`, `equity_details`
- `sign_on_bonus_cents`, `has_relocation_package`, `relocation_package_details`
- `overtime_eligible`, `pay_frequency`

### Migration 071: Application Process Configuration
**File:** `packages/supabase/migrations/071_application_process_configuration.sql`

Added application process customization:
- Custom application questions (JSON)
- Required attachments configuration (JSON)
- Assessment and video interview requirements
- Application timing settings

**Key Fields:**
- `custom_application_questions` (jsonb)
- `required_attachments` (jsonb)
- `requires_assessment`, `assessment_details`
- `requires_video_interview`
- `estimated_application_time_minutes`, `application_expiry_days`

### Migration 072: Multi-Location & Scheduling
**File:** `packages/supabase/migrations/072_multi_location_scheduling.sql`

Added location and scheduling details:
- Multiple work locations support (JSON)
- Relocation assistance
- Work schedule details
- Timezone support

**Key Fields:**
- `work_locations` (jsonb)
- `relocation_assistance_offered`, `relocation_assistance_details`
- `work_schedule_details`, `timezone`

### Migration 073: Distribution & Visibility
**File:** `packages/supabase/migrations/073_distribution_visibility.sql`

Added job distribution and visibility controls:
- Posting channels configuration (JSON)
- Featured job settings
- SEO keywords
- External ATS integration

**Key Fields:**
- `posting_channels` (jsonb)
- `is_featured`, `featured_until`
- `seo_keywords` (array)
- `external_application_url`

### Migration 074: Compliance & Analytics
**File:** `packages/supabase/migrations/074_compliance_analytics.sql`

Added compliance and analytics tracking:
- EEO/EEOC compliance fields
- Veteran and disability-friendly flags
- Source tracking
- UTM parameters (JSON)

**Key Fields:**
- `eeo_job_category`, `is_veteran_friendly`, `is_disability_friendly`
- `affirmative_action_plan`
- `source_tracking_enabled`, `utm_parameters` (jsonb)

## Schema Updates

### TypeScript Types
**File:** `packages/schemas/src/jobs/types.ts`

Added comprehensive TypeScript types:
- Enums for all new field types (PriorityLevel, TeamVisibility, EducationLevel, PayFrequency)
- Interfaces for complex JSON structures (AutoRejectCriteria, CustomApplicationQuestion, etc.)
- Full type safety for all new fields

### Zod Schemas
**File:** `packages/schemas/src/jobs/job-create.schema.ts`

Updated schemas with:
- All new fields with proper validation
- Optional fields with appropriate constraints
- Enum validations for standardized values
- Complex object validations for JSON fields

## Testing Results

✅ **Database Migrations:** All 8 migrations applied successfully
✅ **Type Generation:** Supabase types regenerated successfully  
✅ **Type Safety:** TypeScript compilation passed with no errors
✅ **Code Quality:** All linting and formatting checks passed

## JSON Field Examples

### Auto-Rejection Criteria
```json
{
  "score_minimum": 50,
  "require_work_authorization": true,
  "require_all_skills": true,
  "require_all_certifications": false
}
```

### Custom Application Questions
```json
[
  {
    "id": "q1",
    "question": "Why do you want to work in construction?",
    "type": "long_text",
    "required": true
  },
  {
    "id": "q2",
    "question": "Do you have reliable transportation?",
    "type": "yes_no",
    "required": true
  }
]
```

### Required Attachments
```json
{
  "resume": { "required": true, "max_size_mb": 5 },
  "cover_letter": { "required": false, "max_size_mb": 2 },
  "portfolio": { "required": false, "max_size_mb": 10 }
}
```

### Language Requirements
```json
[
  {
    "language": "Spanish",
    "proficiency": "conversational"
  },
  {
    "language": "English",
    "proficiency": "fluent"
  }
]
```

### Work Locations
```json
[
  {
    "address": {
      "street": "123 Main St",
      "city": "Austin",
      "state": "TX",
      "zip": "78701",
      "latitude": 30.2672,
      "longitude": -97.7431
    },
    "is_primary": true,
    "percentage_time": 80
  }
]
```

### Posting Channels
```json
{
  "internal_only": false,
  "external_boards": ["indeed", "linkedin", "scaffald_network"],
  "referral_bonus_enabled": true,
  "referral_bonus_cents": 100000
}
```

### UTM Parameters
```json
{
  "utm_source": "linkedin",
  "utm_medium": "job_board",
  "utm_campaign": "q4_hiring_2025"
}
```

## Next Steps

### Backend Implementation
1. Update tRPC routers to accept new fields in create/update mutations
2. Add validation middleware for complex JSON fields
3. Implement auto-rejection logic based on criteria

### Frontend Implementation
1. **Job Creation/Edit Forms:** Add UI controls for all new fields
2. **Application Screening Section:** Toggle switches and configuration
3. **Auto-Rejection Settings:** Criteria builder interface
4. **Team Management:** Team selection and visibility controls
5. **Requirements Builder:** Dynamic forms for skills, certs, languages
6. **Compensation Details:** Comprehensive benefits and pay info
7. **Custom Questions Builder:** Drag-and-drop question builder
8. **Location Manager:** Multi-location selector with maps
9. **Distribution Settings:** Channel selection and SEO configuration
10. **Compliance Tracking:** EEO categories and tracking toggles

### Testing
- Unit tests for validation logic
- Integration tests for job creation flow
- E2E tests for applicant screening
- Test auto-rejection workflows

## Benefits

1. **Comprehensive Job Postings:** Support for all aspects of job requirements
2. **Automated Screening:** Reduce manual review with configurable auto-rejection
3. **Flexible Configuration:** JSON fields allow custom requirements per job
4. **Compliance Ready:** Built-in EEO/EEOC tracking
5. **Multi-Channel Distribution:** Control where jobs are posted
6. **Analytics Ready:** UTM tracking and source attribution
7. **Type Safe:** Full TypeScript support across the stack
8. **Scalable:** Indexed appropriately for performance

## Database Performance

All migrations include appropriate indexes:
- GIN indexes for JSONB columns
- Partial indexes for boolean flags
- Composite indexes for common query patterns
- Full-text search support maintained

## Backwards Compatibility

All new fields are optional (nullable) to maintain backwards compatibility with existing job records. Existing functionality remains unchanged.
