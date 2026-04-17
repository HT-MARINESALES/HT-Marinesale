import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '../types';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  /** True while fetching the profile from the backend. */
  loading: boolean;
  /** True once the initial Supabase session check has completed. */
  initialized: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (v: boolean) => void;
  /** Full reset used on sign-out. */
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  initialized: false,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
  reset: () => set({ user: null, session: null, profile: null, loading: false, initialized: true }),
}));
