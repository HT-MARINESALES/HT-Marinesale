-- Migration: Fix missing seller_contracts entries for existing sellers
-- Run in Supabase Dashboard > SQL Editor
--
-- Background: The registration flow had a bug where contract acceptance was
-- recorded via the frontend Supabase client without an active session (RLS blocked it).
-- This inserts placeholder records for all sellers who are missing a contract entry.

DO $$
DECLARE
  v_current_version text;
BEGIN
  -- Get the current/latest contract version
  SELECT version INTO v_current_version
  FROM public.contract_documents
  ORDER BY uploaded_at DESC
  LIMIT 1;

  IF v_current_version IS NULL THEN
    RAISE NOTICE 'No contract document found — skipping';
    RETURN;
  END IF;

  -- Insert a contract record for every seller without one
  INSERT INTO public.seller_contracts (user_id, contract_version, accepted_at, user_agent)
  SELECT
    p.id,
    v_current_version,
    p.created_at,  -- use account creation date as fallback
    'retroactive-fix'
  FROM public.profiles p
  WHERE p.role = 'seller'
    AND NOT EXISTS (
      SELECT 1 FROM public.seller_contracts sc WHERE sc.user_id = p.id
    );

  RAISE NOTICE 'Done. Version used: %', v_current_version;
END $$;
