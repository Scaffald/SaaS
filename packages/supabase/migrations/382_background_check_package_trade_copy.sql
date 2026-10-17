-- =========================================================
-- 382_background_check_package_trade_copy.sql
--
-- The worker's package step (/profile/background-check/initiate) shows each
-- package's description as the card body. 035 seeded them for an office
-- audience: "high-trust finance and supervisory roles", "executive and
-- corporate leadership hires" (#1191, 2026-10-16 UI audit).
--
-- Rewritten for trades: who each package is for on a site, then what it
-- checks. The "what it checks" half follows each package's check_types in
-- 035 exactly; the listPackages endpoint returns no component list, so the
-- description is the only place a worker can read it.
--
-- Copy only. 035 is applied everywhere and is not edited; names, prices and
-- check types are unchanged. A slug that does not exist updates nothing.
-- =========================================================

BEGIN;

UPDATE core.background_check_packages AS p
SET description = v.description
FROM (
  VALUES
    (
      'entry-level',
      'For new starts and general site work. An SSN and address trace, county criminal records (7 years), a multi-state criminal database search and the national sex-offender registry.'
    ),
    (
      'experience-level',
      'For operators, drivers and licensed trades. Everything in Entry Level, plus your driving record, past employers, education and trade licences.'
    ),
    (
      'professional-level',
      'For foremen and supervisors who handle site cash, tools or purchasing. Everything in Experience Level, plus federal criminal records and a soft credit check.'
    ),
    (
      'executive-level',
      'For superintendents, project managers and owner''s reps. Everything in Professional Level, plus county and federal civil court searches.'
    )
) AS v(slug, description)
WHERE p.slug = v.slug;

COMMIT;
