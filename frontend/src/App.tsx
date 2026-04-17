import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { supabase } from './lib/supabase';
import { api } from './lib/api';
import { useAuth, useAuthInit } from './hooks/useAuth';
import { useAuthStore } from './stores/authStore';
import { ToastContainer } from './components/ui/Toast';
import { PageSpinner } from './components/ui/Spinner';
import type { Profile } from './types';
import type { Session } from '@supabase/supabase-js';

// Layouts
import { PublicLayout } from './components/layout/PublicLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Public pages
import { HomePage } from './pages/public/HomePage';
import { ListingsPage } from './pages/public/ListingsPage';
import { BoatDetailPage } from './pages/public/BoatDetailPage';
import { ContactPage } from './pages/public/ContactPage';
import { CheckupInfoPage } from './pages/public/CheckupInfoPage';
import { BoatBrandsPage } from './pages/public/BoatBrandsPage';
import { PrintListingPage } from './pages/public/PrintListingPage';

// Auth pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Seller pages
import { SellerDashboard } from './pages/seller/SellerDashboard';
import { SellerListings } from './pages/seller/SellerListings';
import { CreateListingPage } from './pages/seller/CreateListingPage';
import { EditListingPage } from './pages/seller/EditListingPage';
import { SellerProfilePage } from './pages/seller/SellerProfilePage';
import { SellerContractPage } from './pages/seller/SellerContractPage';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminListings } from './pages/admin/AdminListings';
import { AdminListingDetail } from './pages/admin/AdminListingDetail';
import { AdminEditListingPage } from './pages/admin/AdminEditListingPage';
import { AdminSellers } from './pages/admin/AdminSellers';
import { AdminSellerDetail } from './pages/admin/AdminSellerDetail';
import { AdminContacts } from './pages/admin/AdminContacts';
import { AdminContractPage } from './pages/admin/AdminContractPage';
import { AdminPrintPage } from './pages/admin/AdminPrintPage';
import { AdminBlankChecklistPage } from './pages/admin/AdminBlankChecklistPage';

/**
 * Manages the Supabase auth subscription for the entire app lifetime.
 *
 * Key design decisions:
 * - Uses a React effect (not a module-level IIFE) so the subscription is properly
 *   cleaned up on unmount and is never duplicated by Vite HMR.
 * - Only uses onAuthStateChange (not getSession) — Supabase fires INITIAL_SESSION
 *   immediately, which is equivalent and avoids a double loadProfile race.
 * - Uses a version counter to correctly cancel stale profile responses. Each call
 *   to handleSession gets a unique version; only the latest version's results are
 *   applied. This handles Supabase firing both INITIAL_SESSION + TOKEN_REFRESHED
 *   in rapid succession when a new tab opens.
 * - Does NOT clear the existing profile during a token refresh of the same user —
 *   only clears it when the user actually changes, preventing the "U" avatar flash.
 * - Sets loading=true + user BEFORE the async profile fetch so ProtectedRoute
 *   always shows a spinner and never a wrong-role redirect.
 */
function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setSession, setProfile, setLoading, setInitialized, reset } = useAuthStore();
  // Monotonically increasing counter — each handleSession call captures its own
  // version and only applies results if it is still the latest call.
  const versionRef = useRef(0);

  useEffect(() => {
    const handleSession = async (session: Session | null) => {
      const myVersion = ++versionRef.current;
      const isCurrent = () => versionRef.current === myVersion;

      if (!session?.user) {
        // Atomically clear everything — no intermediate render with user≠null.
        reset();
        return;
      }

      // Set loading=true + user BEFORE the async profile fetch so ProtectedRoute
      // always shows a spinner and never a wrong-role redirect.
      // Preserve the existing profile during a token refresh (same user) to avoid
      // a flash of the "U" fallback avatar.
      const existingUser = useAuthStore.getState().user;
      const isSameUser = existingUser?.id === session.user.id;

      if (isSameUser && useAuthStore.getState().initialized) {
        // Token refresh for the same user during normal operation: silently update
        // session without touching loading state so ProtectedRoute never unmounts
        // its children. This prevents form state from being lost when the browser
        // fires TOKEN_REFRESHED on tab return or focus.
        // Only take this shortcut if already initialized — otherwise fall through
        // to the full loading flow to avoid getting stuck on initial page load when
        // Supabase fires INITIAL_SESSION + TOKEN_REFRESHED in rapid succession.
        setSession(session);
        setUser(session.user);
        // Refresh profile silently in the background — don't affect loading.
        api.get<Profile>('/auth/me').then(profile => {
          if (isCurrent()) setProfile(profile);
        }).catch(() => {}); // Keep existing profile on transient failure
        return;
      }

      // New user login or initial session: go through full loading flow.
      setLoading(true);
      setSession(session);
      setUser(session.user);
      setProfile(null);

      try {
        const profile = await api.get<Profile>('/auth/me');
        if (isCurrent()) {
          setProfile(profile);
          setLoading(false);
          setInitialized(true);
        }
      } catch {
        if (isCurrent()) {
          setProfile(null);
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => {
      // Invalidate any in-flight profile fetches so they don't write to the store
      // after unmount (relevant for HMR / StrictMode double-invoke).
      versionRef.current = Number.MAX_SAFE_INTEGER;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}

/**
 * Wraps auth-only pages (login, register, etc.).
 * Once the user is authenticated and the profile is loaded, redirects to their dashboard.
 * Shows a spinner while the initial session check is pending.
 */
function PublicOnlyRoute({ children }: { children: JSX.Element }) {
  const { user, profile, loading, initialized } = useAuth();

  // Still waiting for the initial Supabase session check.
  if (!initialized) return <PageSpinner />;
  // Session found, but profile is still loading — don't flash the login form.
  if (user && loading) return <PageSpinner />;

  if (user && profile) {
    if (profile.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/seller" replace />;
  }

  return children;
}

/**
 * Wraps protected pages.
 * Shows a spinner until auth is fully initialized, then enforces authentication and role.
 */
function ProtectedRoute({
  children,
  requiredRole,
  allowedRoles,
}: {
  children: JSX.Element;
  requiredRole?: 'admin' | 'seller';
  allowedRoles?: Array<'admin' | 'seller'>;
}) {
  const { isAuthenticated, profile, loading, initialized } = useAuth();

  // Show spinner until we know the auth state.
  if (!initialized || loading) return <PageSpinner />;

  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;

  const roles = allowedRoles ?? (requiredRole ? [requiredRole] : []);
  if (roles.length > 0 && !roles.includes(profile?.role as 'admin' | 'seller')) {
    return <Navigate to="/" replace />;
  }

  if (profile?.role === 'seller' && profile?.is_active === false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Konto deaktiviert</h2>
          <p className="text-gray-500">Bitte kontaktieren Sie den Support.</p>
        </div>
      </div>
    );
  }

  return children;
}

function AppRoutes() {
  useAuthInit(); // no-op, kept for backward compatibility

  return (
    <Routes>
      {/* Print routes – no layout wrapper */}
      <Route path="/boote/:slug/drucken" element={<PrintListingPage />} />
      <Route path="/admin/inserate/:id/drucken" element={
        <ProtectedRoute requiredRole="admin"><AdminPrintPage /></ProtectedRoute>
      } />
      <Route path="/admin/checkliste/blanko" element={
        <ProtectedRoute requiredRole="admin"><AdminBlankChecklistPage /></ProtectedRoute>
      } />

      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/boote" element={<ListingsPage />} />
        <Route path="/boote/:slug" element={<BoatDetailPage />} />
        <Route path="/kontakt" element={<ContactPage />} />
        <Route path="/checkup" element={<CheckupInfoPage />} />
        <Route path="/bootsmarken" element={<BoatBrandsPage />} />
      </Route>

      {/* Auth routes — redirect to dashboard if already logged in */}
      <Route path="/auth/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/auth/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
      <Route path="/auth/passwort-vergessen" element={<ForgotPasswordPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

      {/* Seller routes – accessible by sellers AND admins */}
      <Route
        path="/seller"
        element={
          <ProtectedRoute allowedRoles={['seller', 'admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<SellerDashboard />} />
        <Route path="inserate" element={<SellerListings />} />
        <Route path="inserate/neu" element={<CreateListingPage />} />
        <Route path="inserate/:id" element={<EditListingPage />} />
        <Route path="profil" element={<SellerProfilePage />} />
        <Route path="vertrag" element={<SellerContractPage />} />
      </Route>

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="inserate" element={<AdminListings />} />
        <Route path="inserate/:id" element={<AdminListingDetail />} />
        <Route path="inserate/:id/bearbeiten" element={<AdminEditListingPage />} />
        <Route path="verkaeufer" element={<AdminSellers />} />
        <Route path="verkaeufer/:id" element={<AdminSellerDetail />} />
        <Route path="kontakte" element={<AdminContacts />} />
        <Route path="vertrag" element={<AdminContractPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <ToastContainer />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
