BEGIN;

CREATE OR REPLACE FUNCTION forsured.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO forsured.users (
    id,
    email,
    name,
    display_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'user'),
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fire AFTER the core trigger (Postgres fires same-event triggers alphabetically)
-- Name starts with 'f' which comes after core's 'on_auth_user_created' ('o')
CREATE TRIGGER forsured_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION forsured.handle_new_user();

COMMIT;
