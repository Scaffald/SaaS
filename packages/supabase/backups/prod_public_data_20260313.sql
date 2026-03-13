
> scaffald@ supa:prod /Users/clay/Development/UNI-Construct
> pnpm env-prod pnpx supabase --workdir packages db dump --linked --data-only --schema public


> scaffald@ env-prod /Users/clay/Development/UNI-Construct
> cross-env NODE_ENV=production APP_ENV=production dotenv -e .env.production -- pnpx supabase --workdir packages db dump --linked --data-only --schema public

Using workdir packages
Initialising login role...
Dumping data from remote database...
SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict tjbFtuLcL0Z7dD54HkgHPfASxq0JN65uFTon0cwRYapCkdP5ufNUsgOrJXkR814

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: breach_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: consent_records; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: data_processing_agreements; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."data_processing_agreements" ("id", "created_at", "updated_at", "vendor_name", "vendor_contact_email", "vendor_contact_phone", "vendor_type", "dpa_status", "dpa_signed_date", "dpa_expiration_date", "dpa_document_url", "data_types_processed", "processing_purposes", "data_retention_period", "data_location_countries", "ccpa_compliant", "gdpr_compliant", "soc2_certified", "iso27001_certified", "hipaa_compliant", "breach_notification_sla_hours", "subprocessors", "last_review_date", "next_review_date", "audit_rights", "last_audit_date", "risk_level", "risk_notes", "metadata", "created_by_user_id", "last_modified_by_user_id") VALUES
	('532b8747-4b1f-4146-8fc2-d406fb8d40f8', '2026-02-13 01:13:46.064203+00', '2026-02-13 01:13:46.064203+00', 'Example Cloud Provider', 'privacy@example.com', NULL, 'hosting', 'pending', NULL, NULL, NULL, '{user_profiles,project_data,policy_documents}', '{hosting,infrastructure}', NULL, NULL, false, NULL, NULL, NULL, NULL, 72, '[]', NULL, NULL, true, NULL, 'high', NULL, '{}', '4c649400-6cac-4072-be61-93a3cb38a4e5', NULL);


--
-- Data for Name: privacy_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: supabase_admin
--



--
-- Name: breach_number_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."breach_number_seq"', 1, false);


--
-- Name: privacy_request_number_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."privacy_request_number_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict tjbFtuLcL0Z7dD54HkgHPfASxq0JN65uFTon0cwRYapCkdP5ufNUsgOrJXkR814

RESET ALL;
