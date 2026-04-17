import { createClient } from '@supabase/supabase-js';
import { config } from './config';

// Public client (anon key) – used for JWT verification
export const supabasePublic = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Admin client – requires service role key; bypasses RLS for admin operations.
if (!config.supabaseServiceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required. Set it in your environment variables.');
}

export const supabaseAdmin = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * Create a Supabase client that acts as the authenticated user.
 * This allows RLS policies to evaluate correctly for that user.
 * All admin RLS policies use is_admin() which checks profiles.role,
 * so an admin user's JWT will correctly pass admin-only policies.
 */
export const createUserClient = (userJwt: string) => {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: { Authorization: `Bearer ${userJwt}` },
    },
  });
};
