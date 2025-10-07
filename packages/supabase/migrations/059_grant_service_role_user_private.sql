-- Grant service_role and authenticated access to user_private and related tables
-- Service role and authenticated will still respect RLS policies but need table grants

BEGIN;

-- Grant service_role access to user_private table
GRANT ALL ON public.user_private TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_private TO authenticated;

-- Grant service_role and authenticated access to related profile tables
GRANT ALL ON public.users TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;

GRANT ALL ON public.user_skills TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_skills TO authenticated;

GRANT ALL ON public.user_certifications TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_certifications TO authenticated;

GRANT ALL ON public.user_education TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_education TO authenticated;

GRANT ALL ON public.user_experience TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_experience TO authenticated;

-- Grant access to profile-related tables if they exist
DO $$ 
BEGIN
    -- Check and grant for profiles table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        GRANT ALL ON public.profiles TO service_role;
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
    END IF;
END $$;

COMMIT;
