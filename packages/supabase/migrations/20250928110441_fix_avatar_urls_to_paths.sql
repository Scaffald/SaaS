-- Fix avatar URLs to store only file paths instead of full URLs
-- This migration converts existing full URLs to just the file path portion

-- Update avatar_url to extract just the file path from full URLs
UPDATE profiles 
SET avatar_url = CASE 
  -- Handle kong:8000 URLs
  WHEN avatar_url LIKE 'http://kong:8000/storage/v1/object/public/avatars/%' THEN
    SUBSTRING(avatar_url FROM 'http://kong:8000/storage/v1/object/public/avatars/(.+)')
  -- Handle 127.0.0.1:54321 URLs  
  WHEN avatar_url LIKE 'http://127.0.0.1:54321/storage/v1/object/public/avatars/%' THEN
    SUBSTRING(avatar_url FROM 'http://127.0.0.1:54321/storage/v1/object/public/avatars/(.+)')
  -- Handle localhost:54321 URLs
  WHEN avatar_url LIKE 'http://localhost:54321/storage/v1/object/public/avatars/%' THEN
    SUBSTRING(avatar_url FROM 'http://localhost:54321/storage/v1/object/public/avatars/(.+)')
  -- Keep existing file paths unchanged
  ELSE avatar_url
END
WHERE avatar_url IS NOT NULL 
  AND avatar_url != ''
  AND (
    avatar_url LIKE 'http://kong:8000/storage/v1/object/public/avatars/%' OR
    avatar_url LIKE 'http://127.0.0.1:54321/storage/v1/object/public/avatars/%' OR
    avatar_url LIKE 'http://localhost:54321/storage/v1/object/public/avatars/%'
  );
