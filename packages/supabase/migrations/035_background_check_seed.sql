-- =========================================================
-- 035_background_check_seed.sql
-- Seed NationSearch check types and package catalog
-- =========================================================

BEGIN;

-- =========================================================
-- SECTION 1: CHECK TYPE CATALOG
-- =========================================================

WITH type_payload AS (
  SELECT *
  FROM jsonb_to_recordset('[
    {
      "slug": "ssn-address-trace",
      "display_name": "SSN/Address Trace",
      "description": "Verifies Social Security Number and traces residential history.",
      "category": "identity",
      "provider_check_code": "SSN_TRACE",
      "validity_days": 365,
      "platform_cost_cents": 600,
      "retail_cost_cents": 1500,
      "estimated_completion_days": 1,
      "required_documents": ["government_id"],
      "metadata": {"dataSource": "NationSearch"}
    },
    {
      "slug": "county-criminal-search",
      "display_name": "County Criminal Search",
      "description": "County-level criminal records based on address history.",
      "category": "criminal",
      "provider_check_code": "COUNTY_CRIMINAL",
      "validity_days": 365,
      "platform_cost_cents": 1200,
      "retail_cost_cents": 2500,
      "estimated_completion_days": 3,
      "required_documents": ["government_id", "address_history"],
      "metadata": {"lookbackYears": 7}
    },
    {
      "slug": "multi-jurisdictional-criminal",
      "display_name": "Multi-Jurisdictional Criminal",
      "description": "Nationwide criminal database search.",
      "category": "criminal",
      "provider_check_code": "MULTI_JURISDICTION",
      "validity_days": 365,
      "platform_cost_cents": 900,
      "retail_cost_cents": 2000,
      "estimated_completion_days": 2,
      "required_documents": ["government_id"],
      "metadata": {"coverage": "multi-state"}
    },
    {
      "slug": "national-sex-offender-search",
      "display_name": "National Sex Offender Search",
      "description": "Real-time check of the national sex offender registry.",
      "category": "criminal",
      "provider_check_code": "NSOR",
      "validity_days": 365,
      "platform_cost_cents": 800,
      "retail_cost_cents": 1800,
      "estimated_completion_days": 1,
      "required_documents": ["government_id"],
      "metadata": {"coverage": "national"}
    },
    {
      "slug": "motor-vehicle-records",
      "display_name": "Motor Vehicle Records",
      "description": "Validates license status and driving history.",
      "category": "dmv",
      "provider_check_code": "MVR",
      "validity_days": 180,
      "platform_cost_cents": 1000,
      "retail_cost_cents": 2200,
      "estimated_completion_days": 2,
      "required_documents": ["drivers_license"],
      "metadata": {"requiresConsentForm": true}
    },
    {
      "slug": "employment-verification",
      "display_name": "Employment Verification",
      "description": "Confirms previous employment dates and titles.",
      "category": "employment",
      "provider_check_code": "EMPLOYMENT_VERIFICATION",
      "validity_days": 730,
      "platform_cost_cents": 1600,
      "retail_cost_cents": 3200,
      "estimated_completion_days": 5,
      "required_documents": ["employment_history"],
      "metadata": {"contactAttempts": 3}
    },
    {
      "slug": "education-verification",
      "display_name": "Education Verification",
      "description": "Validates degrees and graduation details.",
      "category": "education",
      "provider_check_code": "EDUCATION_VERIFICATION",
      "validity_days": null,
      "platform_cost_cents": 1400,
      "retail_cost_cents": 2800,
      "estimated_completion_days": 4,
      "required_documents": ["education_history"],
      "metadata": {"requiresTranscript": false}
    },
    {
      "slug": "professional-license-verification",
      "display_name": "Professional License Verification",
      "description": "Ensures professional licenses are active and in good standing.",
      "category": "credential",
      "provider_check_code": "LICENSE_VERIFICATION",
      "validity_days": 180,
      "platform_cost_cents": 1200,
      "retail_cost_cents": 2600,
      "estimated_completion_days": 2,
      "required_documents": ["license_number"],
      "metadata": {"supportsMultipleLicenses": true}
    },
    {
      "slug": "federal-criminal-records",
      "display_name": "Federal Criminal Records",
      "description": "Search of federal court criminal records.",
      "category": "criminal",
      "provider_check_code": "FEDERAL_CRIMINAL",
      "validity_days": 365,
      "platform_cost_cents": 1700,
      "retail_cost_cents": 3500,
      "estimated_completion_days": 3,
      "required_documents": ["government_id"],
      "metadata": {"coverage": "federal"}
    },
    {
      "slug": "credit-history",
      "display_name": "Credit History",
      "description": "Soft credit inquiry for positions handling finances.",
      "category": "financial",
      "provider_check_code": "CREDIT_HISTORY",
      "validity_days": 180,
      "platform_cost_cents": 1500,
      "retail_cost_cents": 3200,
      "estimated_completion_days": 2,
      "required_documents": ["credit_consent"],
      "metadata": {"bureau": "Experian"}
    },
    {
      "slug": "county-civil-search",
      "display_name": "County Civil Search",
      "description": "County-level civil litigation search.",
      "category": "civil",
      "provider_check_code": "COUNTY_CIVIL",
      "validity_days": 365,
      "platform_cost_cents": 1500,
      "retail_cost_cents": 3200,
      "estimated_completion_days": 3,
      "required_documents": ["government_id"],
      "metadata": {"lookbackYears": 7}
    },
    {
      "slug": "federal-civil-records",
      "display_name": "Federal Civil Records",
      "description": "Search of federal civil court filings.",
      "category": "civil",
      "provider_check_code": "FEDERAL_CIVIL",
      "validity_days": 365,
      "platform_cost_cents": 1600,
      "retail_cost_cents": 3300,
      "estimated_completion_days": 3,
      "required_documents": ["government_id"],
      "metadata": {"coverage": "federal"}
    }
  ]'::JSONB) AS t (
    slug TEXT,
    display_name TEXT,
    description TEXT,
    category TEXT,
    provider_check_code TEXT,
    validity_days INTEGER,
    platform_cost_cents INTEGER,
    retail_cost_cents INTEGER,
    estimated_completion_days INTEGER,
    required_documents JSONB,
    metadata JSONB
  )
),
upsert_types AS (
  INSERT INTO core.background_check_types (
    slug,
    display_name,
    description,
    category,
    provider_check_code,
    validity_days,
    platform_cost_cents,
    retail_cost_cents,
    estimated_completion_days,
    required_documents,
    metadata
  )
  SELECT
    slug,
    display_name,
    description,
    category,
    provider_check_code,
    validity_days,
    platform_cost_cents,
    retail_cost_cents,
    estimated_completion_days,
    COALESCE(required_documents, '[]'::JSONB),
    COALESCE(metadata, '{}'::JSONB)
  FROM type_payload
  ON CONFLICT (slug) DO UPDATE
    SET
      display_name = EXCLUDED.display_name,
      description = EXCLUDED.description,
      category = EXCLUDED.category,
      provider_check_code = EXCLUDED.provider_check_code,
      validity_days = EXCLUDED.validity_days,
      platform_cost_cents = EXCLUDED.platform_cost_cents,
      retail_cost_cents = EXCLUDED.retail_cost_cents,
      estimated_completion_days = EXCLUDED.estimated_completion_days,
      required_documents = EXCLUDED.required_documents,
      metadata = EXCLUDED.metadata
  RETURNING id, slug
),
type_map AS (
  SELECT id, slug FROM upsert_types
  UNION
  SELECT id, slug
  FROM core.background_check_types
  WHERE slug IN (SELECT slug FROM type_payload)
)

-- =========================================================
-- SECTION 2: PACKAGE CATALOG
-- =========================================================
, package_payload AS (
  SELECT *
  FROM jsonb_to_recordset('[
    {
      "slug": "entry-level",
      "display_name": "Entry Level Package",
      "description": "Foundational screenings for new trade workers.",
      "provider_package_code": "ENTRY_LEVEL",
      "check_types": [
        "ssn-address-trace",
        "county-criminal-search",
        "multi-jurisdictional-criminal",
        "national-sex-offender-search"
      ],
      "platform_cost_cents": 5000,
      "retail_cost_cents": 7500,
      "estimated_completion_days": 5,
      "metadata": {"tier": "entry"}
    },
    {
      "slug": "experience-level",
      "display_name": "Experience Level Package",
      "description": "Deeper validations for experienced workers and CDL roles.",
      "provider_package_code": "EXPERIENCE_LEVEL",
      "check_types": [
        "ssn-address-trace",
        "county-criminal-search",
        "multi-jurisdictional-criminal",
        "national-sex-offender-search",
        "motor-vehicle-records",
        "employment-verification",
        "education-verification",
        "professional-license-verification"
      ],
      "platform_cost_cents": 10500,
      "retail_cost_cents": 14000,
      "estimated_completion_days": 7,
      "metadata": {"tier": "experience"}
    },
    {
      "slug": "professional-level",
      "display_name": "Professional Level Package",
      "description": "Expanded coverage for high-trust finance and supervisory roles.",
      "provider_package_code": "PROFESSIONAL_LEVEL",
      "check_types": [
        "ssn-address-trace",
        "county-criminal-search",
        "multi-jurisdictional-criminal",
        "national-sex-offender-search",
        "motor-vehicle-records",
        "employment-verification",
        "education-verification",
        "professional-license-verification",
        "federal-criminal-records",
        "credit-history"
      ],
      "platform_cost_cents": 14500,
      "retail_cost_cents": 18500,
      "estimated_completion_days": 7,
      "metadata": {"tier": "professional"}
    },
    {
      "slug": "executive-level",
      "display_name": "Executive Level Package",
      "description": "Comprehensive due diligence for executive and corporate leadership hires.",
      "provider_package_code": "EXECUTIVE_LEVEL",
      "check_types": [
        "ssn-address-trace",
        "county-criminal-search",
        "multi-jurisdictional-criminal",
        "national-sex-offender-search",
        "motor-vehicle-records",
        "employment-verification",
        "education-verification",
        "professional-license-verification",
        "federal-criminal-records",
        "credit-history",
        "county-civil-search",
        "federal-civil-records"
      ],
      "platform_cost_cents": 18500,
      "retail_cost_cents": 23500,
      "estimated_completion_days": 8,
      "metadata": {"tier": "executive"}
    }
  ]'::JSONB) AS p (
    slug TEXT,
    display_name TEXT,
    description TEXT,
    provider_package_code TEXT,
    check_types JSONB,
    platform_cost_cents INTEGER,
    retail_cost_cents INTEGER,
    estimated_completion_days INTEGER,
    metadata JSONB
  )
),
resolved_packages AS (
  SELECT
    slug,
    display_name,
    description,
    provider_package_code,
    (SELECT array_agg(tm.id ORDER BY tm.slug)
     FROM jsonb_array_elements_text(check_types) AS type_slug(value)
     LEFT JOIN type_map tm ON tm.slug = type_slug.value
     WHERE tm.id IS NOT NULL) AS check_type_ids,
    platform_cost_cents,
    retail_cost_cents,
    estimated_completion_days,
    COALESCE(metadata, '{}'::JSONB) AS metadata
  FROM package_payload
)
INSERT INTO core.background_check_packages (
  slug,
  display_name,
  description,
  provider_package_code,
  check_type_ids,
  platform_cost_cents,
  retail_cost_cents,
  estimated_completion_days,
  metadata
)
SELECT
  slug,
  display_name,
  description,
  provider_package_code,
  COALESCE(check_type_ids, '{}'::UUID[]),
  platform_cost_cents,
  retail_cost_cents,
  estimated_completion_days,
  metadata
FROM resolved_packages
ON CONFLICT (slug) DO UPDATE
  SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    provider_package_code = EXCLUDED.provider_package_code,
    check_type_ids = EXCLUDED.check_type_ids,
    platform_cost_cents = EXCLUDED.platform_cost_cents,
    retail_cost_cents = EXCLUDED.retail_cost_cents,
    estimated_completion_days = EXCLUDED.estimated_completion_days,
    metadata = EXCLUDED.metadata,
    is_active = TRUE;

COMMIT;



