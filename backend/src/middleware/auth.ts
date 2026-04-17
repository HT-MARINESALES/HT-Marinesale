import { Request, Response, NextFunction } from 'express';
import { supabasePublic, createUserClient } from '../lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'seller';
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  token: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      // User-scoped Supabase client – RLS evaluates for this user's JWT
      // Admin users pass is_admin() check, sellers pass is_active_seller() check
      db: SupabaseClient;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Nicht autorisiert' });
    return;
  }

  const token = authHeader.substring(7);

  try {
    // Verify JWT via Supabase (works with anon key)
    const { data: { user }, error } = await supabasePublic.auth.getUser(token);
    if (error || !user) {
      res.status(401).json({ error: 'Ungültiges Token' });
      return;
    }

    // Create user-context client (RLS evaluates for this user's role)
    const userClient = createUserClient(token);

    // Fetch profile using user-context client
    const { data: profile, error: profileError } = await userClient
      .from('profiles')
      .select('id, role, first_name, last_name, is_active')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      res.status(401).json({ error: 'Profil nicht gefunden' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email || '',
      role: profile.role as 'admin' | 'seller',
      first_name: profile.first_name,
      last_name: profile.last_name,
      is_active: profile.is_active,
      token,
    };

    // Attach user-scoped DB client to request
    // Routes use req.db for all DB operations → RLS handles authorization
    req.db = userClient;

    next();
  } catch (err) {
    res.status(401).json({ error: 'Authentifizierung fehlgeschlagen' });
  }
};

export const requireSeller = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await requireAuth(req, res, async () => {
    if (!req.user) { res.status(401).json({ error: 'Nicht autorisiert' }); return; }
    // Admins can also access seller routes
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
      res.status(403).json({ error: 'Zugriff verweigert' });
      return;
    }
    if (req.user.role === 'seller' && !req.user.is_active) {
      res.status(403).json({ error: 'Konto deaktiviert. Bitte kontaktieren Sie den Support.' });
      return;
    }
    next();
  });
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await requireAuth(req, res, async () => {
    if (!req.user) { res.status(401).json({ error: 'Nicht autorisiert' }); return; }
    if (req.user.role !== 'admin') {
      res.status(403).json({ error: 'Zugriff verweigert: Nur für Administratoren' });
      return;
    }
    next();
  });
};
