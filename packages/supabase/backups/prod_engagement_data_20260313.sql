
> scaffald@ supa:prod /Users/clay/Development/UNI-Construct
> pnpm env-prod pnpx supabase --workdir packages db dump --linked --data-only --schema engagement


> scaffald@ env-prod /Users/clay/Development/UNI-Construct
> cross-env NODE_ENV=production APP_ENV=production dotenv -e .env.production -- pnpx supabase --workdir packages db dump --linked --data-only --schema engagement

Using workdir packages
Initialising login role...
Dumping data from remote database...
SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict rRj6gqV66x6946bYh73oL67TQKVIfofp8xk6mbf1T2NgiNU706GFf9FBNG46Uy3

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
-- Data for Name: activity_events; Type: TABLE DATA; Schema: engagement; Owner: postgres
--

INSERT INTO "engagement"."activity_events" ("id", "user_id", "event_type", "target_type", "target_id", "event_metadata", "occurred_at", "created_at") VALUES
	('d768c11d-d8fe-4bba-923d-9a5a3644a61b', 'bc59ceaa-de94-4ed5-a8d1-38a59a88f82d', 'user.followed', 'user', '11111111-1111-1111-1111-111111111112', '{"follow_id": "aa29aa0e-84b7-4d20-89fd-7d08d9661810", "target_user_id": "11111111-1111-1111-1111-111111111112"}', '2025-12-02 19:46:56.871+00', '2025-12-02 19:46:56.913846+00'),
	('53ee682c-b1c2-47bd-b326-fd990f66c592', 'bc59ceaa-de94-4ed5-a8d1-38a59a88f82d', 'connection.requested', 'user', '11111111-1111-1111-1111-111111111112', '{"connection_id": "f1a3e424-0dde-44d8-a45c-f78bc93212a9", "target_user_id": "11111111-1111-1111-1111-111111111112"}', '2025-12-02 19:47:07.418+00', '2025-12-02 19:47:07.453038+00'),
	('15716e41-c5f5-485a-af99-ad10262140a2', '00000000-0000-0000-0000-000000000002', 'skill.searched', NULL, NULL, '{"query": "cont", "taxonomy": "csi", "industry_id": "d26dc7ef-c5a7-4c0c-8713-70296c0d94a9", "results_count": 20}', '2025-12-03 16:13:59.345+00', '2025-12-03 16:13:59.386845+00'),
	('4bce0f1e-c2a5-4fe6-9dae-ce1268b24f04', '00000000-0000-0000-0000-000000000002', 'skill.searched', NULL, NULL, '{"query": "concrete", "taxonomy": "csi", "industry_id": "d26dc7ef-c5a7-4c0c-8713-70296c0d94a9", "results_count": 20}', '2025-12-03 16:13:59.553+00', '2025-12-03 16:13:59.594294+00'),
	('d9365bf7-9779-44f5-a14a-d7ce13db207e', '00000000-0000-0000-0000-000000000002', 'skill.searched', NULL, NULL, '{"query": "concr", "taxonomy": "csi", "industry_id": "d26dc7ef-c5a7-4c0c-8713-70296c0d94a9", "results_count": 20}', '2025-12-03 16:14:00.05+00', '2025-12-03 16:14:00.090641+00'),
	('51b2dc08-7796-4e93-98d5-3d37d5fcd883', '00000000-0000-0000-0000-000000000002', 'skill.searched', NULL, NULL, '{"query": "pl", "taxonomy": "csi", "industry_id": "d26dc7ef-c5a7-4c0c-8713-70296c0d94a9", "results_count": 20}', '2025-12-03 16:14:14.61+00', '2025-12-03 16:14:14.650318+00'),
	('f77e919e-3fff-4ac5-8881-3ff279c135fd', '00000000-0000-0000-0000-000000000002', 'skill.searched', NULL, NULL, '{"query": "plu", "taxonomy": "csi", "industry_id": "d26dc7ef-c5a7-4c0c-8713-70296c0d94a9", "results_count": 20}', '2025-12-03 16:14:15.476+00', '2025-12-03 16:14:15.513462+00'),
	('7902cef7-b42c-41fe-913a-94ea1817fbb9', '00000000-0000-0000-0000-000000000002', 'skill.searched', NULL, NULL, '{"query": "plumbing", "taxonomy": "csi", "industry_id": "d26dc7ef-c5a7-4c0c-8713-70296c0d94a9", "results_count": 20}', '2025-12-03 16:14:21.315+00', '2025-12-03 16:14:21.348319+00'),
	('013d8173-ff9d-4066-a5fb-9b6a5ed28ba0', '00000000-0000-0000-0000-000000000002', 'skill.searched', NULL, NULL, '{"query": "concrete", "taxonomy": "csi", "industry_id": "d26dc7ef-c5a7-4c0c-8713-70296c0d94a9", "results_count": 20}', '2025-12-04 18:10:16.042+00', '2025-12-04 18:10:16.061766+00'),
	('3241d9c0-162d-4715-b70f-8297c6a5029a', '00000000-0000-0000-0000-000000000002', 'skill.searched', NULL, NULL, '{"query": "concrete", "taxonomy": "csi", "industry_id": "d26dc7ef-c5a7-4c0c-8713-70296c0d94a9", "results_count": 20}', '2025-12-04 18:10:31.046+00', '2025-12-04 18:10:31.066517+00'),
	('31909fff-9993-481f-b7d6-b969eff73867', '00000000-0000-0000-0000-000000000002', 'connection.requested', 'user', '11111111-1111-1111-1111-111111111112', '{"connection_id": "6eb2905a-0cc3-415d-8cae-a8363940f9c5", "target_user_id": "11111111-1111-1111-1111-111111111112"}', '2026-01-06 23:25:47.29+00', '2026-01-06 23:25:47.301435+00'),
	('9ea3cbdc-020d-495b-880e-b7173809c2c7', '00000000-0000-0000-0000-000000000002', 'skill.searched', NULL, NULL, '{"query": "ind", "taxonomy": "csi", "industry_id": "d26dc7ef-c5a7-4c0c-8713-70296c0d94a9", "results_count": 20}', '2026-01-15 17:56:21.585+00', '2026-01-15 17:56:21.607117+00'),
	('88b49c46-16a6-41b3-bcce-a516ef9843f7', '00000000-0000-0000-0000-000000000002', 'skill.searched', NULL, NULL, '{"query": "indu", "taxonomy": "csi", "industry_id": "d26dc7ef-c5a7-4c0c-8713-70296c0d94a9", "results_count": 20}', '2026-01-15 17:56:21.759+00', '2026-01-15 17:56:21.78745+00'),
	('041ddb8d-3cd4-48f7-92ee-4e975be03448', '00000000-0000-0000-0000-000000000002', 'skill.searched', NULL, NULL, '{"query": "industr", "taxonomy": "csi", "industry_id": "d26dc7ef-c5a7-4c0c-8713-70296c0d94a9", "results_count": 20}', '2026-01-15 17:56:21.79+00', '2026-01-15 17:56:21.80983+00'),
	('4497f54b-c4ff-4d5f-9839-f1bc71cb246a', '00000000-0000-0000-0000-000000000002', 'skill.searched', NULL, NULL, '{"query": "electr", "taxonomy": "csi", "industry_id": "d26dc7ef-c5a7-4c0c-8713-70296c0d94a9", "results_count": 20}', '2026-01-15 17:56:22.66+00', '2026-01-15 17:56:22.683726+00'),
	('6c1ebd41-31be-4287-8858-760d0d3a877b', '00000000-0000-0000-0000-000000000002', 'skill.searched', NULL, NULL, '{"query": "electri", "taxonomy": "csi", "industry_id": "d26dc7ef-c5a7-4c0c-8713-70296c0d94a9", "results_count": 20}', '2026-01-15 17:56:24.396+00', '2026-01-15 17:56:24.418559+00'),
	('d9829659-2eb7-4010-a415-78ba3e2df68d', '00000000-0000-0000-0000-000000000002', 'skill.searched', NULL, NULL, '{"query": "ele", "taxonomy": "csi", "industry_id": "d26dc7ef-c5a7-4c0c-8713-70296c0d94a9", "results_count": 20}', '2026-01-15 17:56:37.984+00', '2026-01-15 17:56:38.003101+00'),
	('2e06228d-b28e-42f8-84d0-e04842767d2e', '00000000-0000-0000-0000-000000000002', 'skill.searched', NULL, NULL, '{"query": "electric", "taxonomy": "csi", "industry_id": "d26dc7ef-c5a7-4c0c-8713-70296c0d94a9", "results_count": 20}', '2026-01-15 17:56:40.005+00', '2026-01-15 17:56:40.034573+00'),
	('9eec497f-5fe7-4ae6-abf6-c997522437b3', '00000000-0000-0000-0000-000000000002', 'skill.searched', NULL, NULL, '{"query": "plumb", "taxonomy": "csi", "industry_id": "d26dc7ef-c5a7-4c0c-8713-70296c0d94a9", "results_count": 20}', '2026-02-04 18:09:02.485+00', '2026-02-04 18:09:02.514853+00'),
	('c5e08efd-6731-4cdd-92ce-89df7d179a61', '00000000-0000-0000-0000-000000000002', 'skill.searched', NULL, NULL, '{"query": "plumbing", "taxonomy": "csi", "industry_id": "d26dc7ef-c5a7-4c0c-8713-70296c0d94a9", "results_count": 20}', '2026-02-04 18:09:02.579+00', '2026-02-04 18:09:02.597827+00'),
	('de2f48cd-b50f-44fc-9c8f-9c65fa817265', '00000000-0000-0000-0000-000000000002', 'review.submitted', 'user', '11111111-1111-1111-1111-111111111112', '{"review_id": "28cd0991-75d9-4272-b789-d6ede0c0ebe8", "recommendation": 1}', '2026-02-04 19:18:02.211+00', '2026-02-04 19:18:02.230281+00'),
	('5c55a8fc-8c8d-42f4-9d1b-be36bcf99fdc', '67b824f2-8da0-4fea-91f7-a31cb2c77b9b', 'connection.requested', 'user', '11111111-1111-1111-1111-111111111125', '{"connection_id": "e3db249a-e4fa-458d-8bdf-4dad043ec9db", "target_user_id": "11111111-1111-1111-1111-111111111125"}', '2026-02-09 18:39:56.437+00', '2026-02-09 18:39:56.498266+00');


--
-- Data for Name: connection_analytics; Type: TABLE DATA; Schema: engagement; Owner: postgres
--



--
-- Data for Name: profile_views; Type: TABLE DATA; Schema: engagement; Owner: postgres
--



--
-- PostgreSQL database dump complete
--

-- \unrestrict rRj6gqV66x6946bYh73oL67TQKVIfofp8xk6mbf1T2NgiNU706GFf9FBNG46Uy3

RESET ALL;
