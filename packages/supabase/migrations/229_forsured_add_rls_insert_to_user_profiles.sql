-- Migration: 030_add_rls_insert_to_user_profiles.sql
CREATE POLICY "Users can create their own profile"
  ON forsured.user_profiles FOR INSERT
  WITH CHECK (scaffald_user_id = auth.uid());
