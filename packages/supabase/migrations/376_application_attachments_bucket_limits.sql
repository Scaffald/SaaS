-- =========================================================
-- 376_application_attachments_bucket_limits.sql
--
-- The application-attachments bucket had a different limit on every project
-- (#1229): prod 500 MB with zip/mp4/quicktime allowed, dev and preview the
-- 10 MB from migration 150 with image/* and video/*. Clay's call (2026-10-16):
-- one limit everywhere, 10-20 MB.
--
-- 20 MB, and migration 150's MIME list. The only uploader in the app
-- (AttachmentsStep.tsx) takes PDF/DOC/DOCX up to 5 MB; the API also allows
-- portfolio, assessment and video_interview attachments, which keeps image/*
-- and video/* (short clips). application/zip is dropped: nothing sends it.
-- The bucket held 0 objects on every project when this was written, so no
-- existing file is stranded by the new limit.
-- =========================================================

BEGIN;

UPDATE storage.buckets
   SET file_size_limit = 20 * 1024 * 1024,
       allowed_mime_types = ARRAY[
         'application/pdf',
         'application/msword',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'image/*',
         'video/*'
       ]
 WHERE id = 'application-attachments';

COMMIT;
