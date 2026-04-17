-- ============================================================
-- HT-Marineservice Full Schema Migration
-- Project: HT-Marineservice
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- ============================================================
-- 2. PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'seller' CHECK (role IN ('admin', 'seller')),
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. LISTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  boat_type TEXT CHECK (boat_type IN ('motorboat','sailboat','yacht','catamaran','inflatable','jet_ski','houseboat','fishing','other')),
  condition TEXT CHECK (condition IN ('new','like_new','good','fair','needs_work')),
  length_m NUMERIC(6,2),
  width_m NUMERIC(6,2),
  draft_m NUMERIC(6,2),
  weight_kg INTEGER,
  engine_type TEXT,
  engine_power_hp INTEGER,
  engine_count INTEGER,
  engine_hours INTEGER,
  fuel_type TEXT CHECK (fuel_type IN ('petrol','diesel','electric','hybrid','other')),
  displacement_kg INTEGER,
  cabins INTEGER,
  berths INTEGER,
  bathrooms INTEGER,
  max_passengers INTEGER,
  fresh_water_l INTEGER,
  waste_water_l INTEGER,
  ce_category TEXT CHECK (ce_category IN ('A','B','C','D')),
  material TEXT,
  has_trailer BOOLEAN DEFAULT false,
  location_city TEXT,
  location_country TEXT DEFAULT 'Deutschland',
  berth_location TEXT,
  video_url TEXT,
  navigation_equipment TEXT[],
  safety_equipment TEXT[],
  comfort_features TEXT[],
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','checkup_required','checkup_scheduled','checkup_completed','published','rejected','archived','sold')),
  rejection_reason TEXT,
  admin_notes TEXT,
  checkup_date DATE,
  checkup_notes TEXT,
  ka_title TEXT,
  ka_description TEXT,
  submitted_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  sold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. LISTING IMAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.listing_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  is_primary BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. LISTING STATUS HISTORY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.listing_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. CONTACT REQUESTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contact_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 7. SELLER CONTRACTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.seller_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  signed_at TIMESTAMPTZ,
  commission_rate NUMERIC(5,4) DEFAULT 0.074,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 8. HELPER FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_active_seller()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'seller' AND is_active = true
  );
$$;

-- ============================================================
-- 9. HANDLE NEW USER TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, first_name, last_name, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'seller'),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 10. UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_listings_updated_at ON public.listings;
CREATE TRIGGER set_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 11. SLUG TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_listing_slug(
  p_title TEXT,
  p_brand TEXT,
  p_model TEXT,
  p_year INTEGER
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_slug TEXT;
  v_base TEXT;
  v_random TEXT;
  v_counter INTEGER := 0;
BEGIN
  v_base := lower(p_year::TEXT || '-' || p_brand || '-' || p_model || '-' || p_title);
  v_base := regexp_replace(v_base, '[äÄ]', 'ae', 'g');
  v_base := regexp_replace(v_base, '[öÖ]', 'oe', 'g');
  v_base := regexp_replace(v_base, '[üÜ]', 'ue', 'g');
  v_base := regexp_replace(v_base, 'ß', 'ss', 'g');
  v_base := regexp_replace(v_base, '[^a-z0-9]+', '-', 'g');
  v_base := regexp_replace(v_base, '^-+|-+$', '', 'g');
  v_base := substr(v_base, 1, 80);

  LOOP
    v_random := substr(md5(random()::TEXT), 1, 5);
    v_slug := v_base || '-' || v_random;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.listings WHERE slug = v_slug);
    v_counter := v_counter + 1;
    IF v_counter > 10 THEN
      v_slug := v_base || '-' || extract(epoch FROM now())::bigint::TEXT;
      EXIT;
    END IF;
  END LOOP;

  RETURN v_slug;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_listing_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := public.generate_listing_slug(NEW.title, NEW.brand, NEW.model, NEW.year);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_listing_slug ON public.listings;
CREATE TRIGGER trg_listing_slug
  BEFORE INSERT ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.trg_listing_slug();

-- ============================================================
-- 12. STATUS HISTORY TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.trg_listing_status_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.listing_status_history (listing_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_listing_status_history ON public.listings;
CREATE TRIGGER trg_listing_status_history
  AFTER UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.trg_listing_status_history();

-- ============================================================
-- 13. ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_contracts ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 14. RLS POLICIES - PROFILES
-- ============================================================
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR is_admin());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin" ON public.profiles
  FOR DELETE USING (is_admin());

-- ============================================================
-- 15. RLS POLICIES - LISTINGS
-- ============================================================
DROP POLICY IF EXISTS "listings_select_public" ON public.listings;
CREATE POLICY "listings_select_public" ON public.listings
  FOR SELECT USING (status = 'published' OR auth.uid() = seller_id OR is_admin());

DROP POLICY IF EXISTS "listings_insert_seller" ON public.listings;
CREATE POLICY "listings_insert_seller" ON public.listings
  FOR INSERT WITH CHECK (auth.uid() = seller_id AND (is_active_seller() OR is_admin()));

DROP POLICY IF EXISTS "listings_update_seller" ON public.listings;
CREATE POLICY "listings_update_seller" ON public.listings
  FOR UPDATE USING (auth.uid() = seller_id OR is_admin());

DROP POLICY IF EXISTS "listings_delete_seller" ON public.listings;
CREATE POLICY "listings_delete_seller" ON public.listings
  FOR DELETE USING (auth.uid() = seller_id OR is_admin());

-- ============================================================
-- 16. RLS POLICIES - LISTING IMAGES
-- ============================================================
DROP POLICY IF EXISTS "listing_images_select" ON public.listing_images;
CREATE POLICY "listing_images_select" ON public.listing_images
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (l.status = 'published' OR l.seller_id = auth.uid() OR is_admin()))
  );

DROP POLICY IF EXISTS "listing_images_insert" ON public.listing_images;
CREATE POLICY "listing_images_insert" ON public.listing_images
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (l.seller_id = auth.uid() OR is_admin()))
  );

DROP POLICY IF EXISTS "listing_images_update" ON public.listing_images;
CREATE POLICY "listing_images_update" ON public.listing_images
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (l.seller_id = auth.uid() OR is_admin()))
  );

DROP POLICY IF EXISTS "listing_images_delete" ON public.listing_images;
CREATE POLICY "listing_images_delete" ON public.listing_images
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (l.seller_id = auth.uid() OR is_admin()))
  );

-- ============================================================
-- 17. RLS POLICIES - LISTING STATUS HISTORY
-- ============================================================
DROP POLICY IF EXISTS "status_history_select" ON public.listing_status_history;
CREATE POLICY "status_history_select" ON public.listing_status_history
  FOR SELECT USING (
    is_admin() OR
    EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.seller_id = auth.uid())
  );

DROP POLICY IF EXISTS "status_history_insert" ON public.listing_status_history;
CREATE POLICY "status_history_insert" ON public.listing_status_history
  FOR INSERT WITH CHECK (
    is_admin() OR
    EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.seller_id = auth.uid())
  );

-- ============================================================
-- 18. RLS POLICIES - CONTACT REQUESTS
-- ============================================================
DROP POLICY IF EXISTS "contact_requests_insert_anon" ON public.contact_requests;
CREATE POLICY "contact_requests_insert_anon" ON public.contact_requests
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "contact_requests_select_admin" ON public.contact_requests;
CREATE POLICY "contact_requests_select_admin" ON public.contact_requests
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "contact_requests_update_admin" ON public.contact_requests;
CREATE POLICY "contact_requests_update_admin" ON public.contact_requests
  FOR UPDATE USING (is_admin());

-- ============================================================
-- 19. RLS POLICIES - SELLER CONTRACTS
-- ============================================================
DROP POLICY IF EXISTS "seller_contracts_select" ON public.seller_contracts;
CREATE POLICY "seller_contracts_select" ON public.seller_contracts
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "seller_contracts_all_admin" ON public.seller_contracts;
CREATE POLICY "seller_contracts_all_admin" ON public.seller_contracts
  FOR ALL USING (is_admin());

-- ============================================================
-- 20. STORAGE: BOAT IMAGES BUCKET
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'boat-images',
  'boat-images',
  true,
  10485760,
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "boat_images_public_read" ON storage.objects;
CREATE POLICY "boat_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'boat-images');

DROP POLICY IF EXISTS "boat_images_auth_upload" ON storage.objects;
CREATE POLICY "boat_images_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'boat-images'
    AND auth.role() = 'authenticated'
    -- Enforce that the folder matches a listing owned by the uploading user
    AND (storage.foldername(name))[1] = 'listings'
    AND (storage.foldername(name))[2]::uuid IN (
      SELECT id FROM public.listings WHERE seller_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "boat_images_owner_update" ON storage.objects;
CREATE POLICY "boat_images_owner_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'boat-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "boat_images_owner_delete" ON storage.objects;
CREATE POLICY "boat_images_owner_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'boat-images' AND auth.role() = 'authenticated');

-- ============================================================
-- 21. ADMIN USER SETUP
-- ============================================================
DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Only insert if admin doesn't exist yet
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@ht-marineservice.de') THEN
    v_admin_id := uuid_generate_v4();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data,
      raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_admin_id,
      'authenticated',
      'authenticated',
      'admin@ht-marineservice.de',
      crypt('HT-Admin-2024!', gen_salt('bf')),
      NOW(), NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"first_name":"Admin","last_name":"HT-Marineservice","role":"admin"}',
      NOW(), NOW(),
      '', '', '', ''
    );
  END IF;
END $$;

-- Ensure admin profile has correct role (trigger may have already created it)
UPDATE public.profiles
SET role = 'admin', first_name = 'Admin', last_name = 'HT-Marineservice', is_active = true, updated_at = NOW()
WHERE email = 'admin@ht-marineservice.de';

-- Fix any NULL string columns in auth.users (prevents login issues)
UPDATE auth.users SET
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  recovery_token = COALESCE(recovery_token, '')
WHERE email = 'admin@ht-marineservice.de';

-- ============================================================
-- MIGRATION: listing_changes table (seller edit history)
-- Run this in Supabase SQL Editor if not yet applied
-- ============================================================
CREATE TABLE IF NOT EXISTS public.listing_changes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  changed_by uuid NOT NULL REFERENCES public.profiles(id),
  changed_at timestamptz NOT NULL DEFAULT now(),
  changes jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS listing_changes_listing_id_idx ON public.listing_changes(listing_id);
CREATE INDEX IF NOT EXISTS listing_changes_changed_at_idx ON public.listing_changes(changed_at DESC);

ALTER TABLE public.listing_changes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_read_listing_changes" ON public.listing_changes;
CREATE POLICY "admins_read_listing_changes"
  ON public.listing_changes FOR SELECT
  TO authenticated
  USING (is_admin());

-- ============================================================
-- MIGRATION: Performance indices on frequently queried columns
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_listings_status       ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_seller_id    ON public.listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_published_at ON public.listings(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_price        ON public.listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_boat_type    ON public.listings(boat_type);
CREATE INDEX IF NOT EXISTS idx_contact_is_read       ON public.contact_requests(is_read);

-- ============================================================
-- MIGRATION: Tighter storage upload policy
-- Ensures a seller can only upload to their own listing folders.
-- Apply this to replace the previous too-permissive policy.
-- ============================================================
DROP POLICY IF EXISTS "boat_images_auth_upload" ON storage.objects;
CREATE POLICY "boat_images_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'boat-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'listings'
    AND (storage.foldername(name))[2]::uuid IN (
      SELECT id FROM public.listings WHERE seller_id = auth.uid()
    )
  );

-- ============================================================
-- Kommissionsvertrag / Contract Documents
-- ============================================================

-- Create contracts storage bucket (public read for PDF download)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('contracts', 'contracts', true, 20971520, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- contract_documents table
CREATE TABLE IF NOT EXISTS public.contract_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  file_name text NOT NULL,
  storage_path text NOT NULL,
  file_size integer,
  uploaded_at timestamptz DEFAULT now(),
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.contract_documents ENABLE ROW LEVEL SECURITY;

-- Anyone can read contracts (needed for registration page)
DROP POLICY IF EXISTS "Anyone can read contracts" ON public.contract_documents;
CREATE POLICY "Anyone can read contracts" ON public.contract_documents
  FOR SELECT USING (true);

-- Only admins can insert/update/delete
DROP POLICY IF EXISTS "Admins can manage contracts" ON public.contract_documents;
CREATE POLICY "Admins can manage contracts" ON public.contract_documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Storage: public read for contracts bucket
DROP POLICY IF EXISTS "Contracts public read" ON storage.objects;
CREATE POLICY "Contracts public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'contracts');

DROP POLICY IF EXISTS "Admins can upload contracts" ON storage.objects;
CREATE POLICY "Admins can upload contracts" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'contracts' AND
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Migration: add fuel_capacity_l, drive_type, drive_description to listings
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS fuel_capacity_l INTEGER,
  ADD COLUMN IF NOT EXISTS drive_type TEXT CHECK (drive_type IN ('z_antrieb','wellenantrieb','jetantrieb','saildrive','aussenborder','other')),
  ADD COLUMN IF NOT EXISTS drive_description TEXT;
