-- HT-Marineservice Seed SQL
-- Run this AFTER creating the admin user in Supabase Auth Dashboard

-- Step 1: Create admin user in Supabase Dashboard
--   Auth > Users > Add user
--   Email: admin@ht-marineservice.de
--   Password: (set a secure password)
--   Auto Confirm User: Yes

-- Step 2: Get the user ID from the created user in Supabase Dashboard
--   Auth > Users > click on the admin user > copy the UUID

-- Step 3: Replace 'YOUR_ADMIN_USER_UUID' below with the actual UUID and run this SQL

-- Update the auto-created profile to be admin
UPDATE profiles
SET
  role = 'admin',
  first_name = 'Admin',
  last_name = 'HT-Marineservice',
  is_active = true,
  updated_at = NOW()
WHERE id = 'YOUR_ADMIN_USER_UUID';

-- Verify
SELECT id, role, first_name, last_name, is_active FROM profiles WHERE id = 'YOUR_ADMIN_USER_UUID';

-- Note: The profiles table should be auto-populated by a trigger on auth.users
-- If no trigger exists, run this INSERT instead:
/*
INSERT INTO profiles (id, role, first_name, last_name, is_active, created_at, updated_at)
VALUES (
  'YOUR_ADMIN_USER_UUID',
  'admin',
  'Admin',
  'HT-Marineservice',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  first_name = 'Admin',
  last_name = 'HT-Marineservice',
  is_active = true,
  updated_at = NOW();
*/

-- Create trigger to auto-create profiles for new users (run once)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, first_name, last_name, is_active, created_at, updated_at)
  VALUES (
    NEW.id,
    'seller',
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
