-- Migration: Add contract tracking fields + reset for V1
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Add missing columns to seller_contracts
ALTER TABLE public.seller_contracts
  ADD COLUMN IF NOT EXISTS contract_version text,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS user_agent text;

-- 2. Clear all existing contract acceptances (reset — everyone must accept V1 fresh)
TRUNCATE public.seller_contracts;

-- 3. Keep only the most recent PDF, rename it to v1
DELETE FROM public.contract_documents
WHERE id NOT IN (
  SELECT id FROM public.contract_documents ORDER BY uploaded_at DESC LIMIT 1
);
UPDATE public.contract_documents SET version = 'v1';

-- 4. RLS: seller can read own contracts
DROP POLICY IF EXISTS "seller_contracts_select" ON public.seller_contracts;
CREATE POLICY "seller_contracts_select" ON public.seller_contracts
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "seller_contracts_insert" ON public.seller_contracts;
CREATE POLICY "seller_contracts_insert" ON public.seller_contracts
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "seller_contracts_all_admin" ON public.seller_contracts;
CREATE POLICY "seller_contracts_all_admin" ON public.seller_contracts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
