-- 344_drop_vestigial_application_status_enum.sql
--
-- Drop core.application_status. It has never been used and its vocabulary is
-- not the one the application actually has (#536).
--
-- Declared in 001_schema.sql, the type reads:
--
--   draft, submitted, under_review, interviewing, offer_extended, hired,
--   rejected, withdrawn
--
-- The real vocabulary is the CHECK constraint on core.applications.status,
-- which is TEXT:
--
--   new, screen, inquired, interview, offer, hired, rejected, withdrawn
--
-- Only three labels overlap. Anyone reading the schema for the canonical
-- status list — which is a reasonable thing to do, since an ENUM looks
-- authoritative — finds `draft` and `under_review` and `offer_extended`, none
-- of which any code has ever written or read. That is worse than no type at
-- all, and this is the second status vocabulary confusion in this area: the
-- API separately maps a DB vocabulary onto an API one (`new`→`pending`,
-- `screen`→`reviewing`), which is documented in routes/applications.ts.
--
-- Verified against the local database before writing:
--
--   columns using the type    none
--   functions using the type  none
--   applications.status       text, with the CHECK above
--
-- DROP TYPE without CASCADE on purpose. If some object does depend on it, this
-- migration must fail loudly rather than quietly removing that object too.

BEGIN;

DROP TYPE IF EXISTS core.application_status;

COMMIT;
