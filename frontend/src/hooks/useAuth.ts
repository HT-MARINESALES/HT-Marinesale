import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

/** No-op kept for backward compatibility. */
export function useAuthInit() {}

export function useAuth() {
  const { user, session, profile, loading, initialized, reset } = useAuthStore();

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, last_name: lastName } },
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    // Reset store immediately for instant UI feedback, then tell Supabase.
    // onAuthStateChange(SIGNED_OUT) will also fire and be a safe no-op.
    reset();
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
  };

  return {
    user,
    session,
    profile,
    loading,
    initialized,
    signIn,
    signUp,
    signOut,
    resetPassword,
    isAdmin: profile?.role === 'admin',
    isSeller: profile?.role === 'seller',
    isAuthenticated: !!user,
  };
}
