import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

// POST /api/contract/accept — records seller's contract acceptance during registration
// Called from the registration page (no auth required — user may not have a session yet)
router.post('/accept', async (req: Request, res: Response) => {
  try {
    const { user_id, contract_version, user_agent } = req.body;

    if (!user_id || !contract_version) {
      res.status(400).json({ error: 'user_id und contract_version sind erforderlich' });
      return;
    }

    // Verify the user exists in profiles (prevents phantom insertions)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      res.status(404).json({ error: 'Benutzer nicht gefunden' });
      return;
    }

    // Verify the contract version exists
    const { data: doc } = await supabaseAdmin
      .from('contract_documents')
      .select('id')
      .eq('version', contract_version)
      .single();

    if (!doc) {
      res.status(404).json({ error: 'Vertragsversion nicht gefunden' });
      return;
    }

    // Insert contract acceptance record
    const { error: insertError } = await supabaseAdmin
      .from('seller_contracts')
      .insert({
        user_id,
        contract_version,
        accepted_at: new Date().toISOString(),
        user_agent: user_agent || null,
      });

    if (insertError) {
      console.error('Contract accept error:', insertError);
      res.status(500).json({ error: 'Vertrag konnte nicht gespeichert werden' });
      return;
    }

    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Vertrag konnte nicht gespeichert werden' });
  }
});

// GET /api/contract/current — returns current contract info or 404
router.get('/current', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('contract_documents')
      .select('id, version, file_name, file_size, uploaded_at, storage_path')
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Kein Vertrag gefunden' });
      return;
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('contracts')
      .getPublicUrl(data.storage_path);

    res.json({
      id: data.id,
      version: data.version,
      file_name: data.file_name,
      file_size: data.file_size,
      uploaded_at: data.uploaded_at,
      download_url: publicUrl,
    });
  } catch (err) {
    res.status(500).json({ error: 'Vertrag konnte nicht geladen werden' });
  }
});

export default router;
