import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { updateProfileSchema } from '../validators/auth';
import { supabaseAdmin, supabasePublic } from '../lib/supabase';

const router = Router();

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data, error } = await req.db
      .from('profiles').select('*').eq('id', req.user!.id).single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Profil konnte nicht geladen werden' });
  }
});

router.put('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Ungültige Daten', details: parsed.error.flatten() });
      return;
    }
    const { data, error } = await req.db
      .from('profiles')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', req.user!.id)
      .select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Profil konnte nicht aktualisiert werden' });
  }
});

// POST change password (requires current password for verification)
router.post('/change-password', requireAuth, async (req: Request, res: Response) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      res.status(400).json({ error: 'Bitte füllen Sie alle Felder aus' }); return;
    }
    if (new_password.length < 8) {
      res.status(400).json({ error: 'Neues Passwort muss mindestens 8 Zeichen lang sein' }); return;
    }
    // Verify current password
    const { error: signInError } = await supabasePublic.auth.signInWithPassword({
      email: req.user!.email!,
      password: current_password,
    });
    if (signInError) { res.status(400).json({ error: 'Aktuelles Passwort ist falsch' }); return; }
    // Update password
    const { error } = await supabaseAdmin.auth.admin.updateUserById(req.user!.id, { password: new_password });
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Passwort konnte nicht geändert werden' });
  }
});

// POST change email (requires current password for verification)
router.post('/change-email', requireAuth, async (req: Request, res: Response) => {
  try {
    const { new_email, password } = req.body;
    if (!new_email || !password) {
      res.status(400).json({ error: 'Bitte füllen Sie alle Felder aus' }); return;
    }
    // Verify current password
    const { error: signInError } = await supabasePublic.auth.signInWithPassword({
      email: req.user!.email!,
      password,
    });
    if (signInError) { res.status(400).json({ error: 'Passwort ist falsch' }); return; }
    // Update email in Supabase auth
    const { error } = await supabaseAdmin.auth.admin.updateUserById(req.user!.id, { email: new_email });
    if (error) throw error;
    // Update email in profiles table
    await supabaseAdmin.from('profiles').update({ email: new_email }).eq('id', req.user!.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'E-Mail-Adresse konnte nicht geändert werden' });
  }
});

export default router;
