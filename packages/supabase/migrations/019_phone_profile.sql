BEGIN;

ALTER TABLE core.profile
ADD COLUMN IF NOT EXISTS phone TEXT;

UPDATE core.profile AS p
SET phone = au.phone
FROM auth.users AS au
WHERE p.user_id = au.id
  AND (p.phone IS NULL OR p.phone = '')
  AND au.phone IS NOT NULL
  AND au.phone <> '';

COMMIT;

