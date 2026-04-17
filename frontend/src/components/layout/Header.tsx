import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, User, LogOut, LayoutDashboard, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export function Header() {
  const { isAuthenticated, profile, signOut, isAdmin, isSeller, loading, initialized } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setUserMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-black shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="HT-Marineservice" className="h-[70px] w-auto" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink
              to="/boote"
              className={({ isActive }) => cn(
                'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive ? 'text-white bg-white/15' : 'text-gray-300 hover:text-white hover:bg-white/10'
              )}
            >
              Boote kaufen
            </NavLink>
            <NavLink
              to="/checkup"
              className={({ isActive }) => cn(
                'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive ? 'text-white bg-white/15' : 'text-gray-300 hover:text-white hover:bg-white/10'
              )}
            >
              Check-up Service
            </NavLink>
            <NavLink
              to="/bootsmarken"
              className={({ isActive }) => cn(
                'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive ? 'text-white bg-white/15' : 'text-gray-300 hover:text-white hover:bg-white/10'
              )}
            >
              Bootsmarken
            </NavLink>
            <NavLink
              to="/kontakt"
              className={({ isActive }) => cn(
                'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive ? 'text-white bg-white/15' : 'text-gray-300 hover:text-white hover:bg-white/10'
              )}
            >
              Kontakt
            </NavLink>
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && (!initialized || (loading && !profile)) ? (
              // Profile still loading — show neutral placeholder to avoid "U" flash
              <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse" />
            ) : isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-md hover:bg-white/10"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                    <span className="text-sm font-semibold text-white">
                      {profile?.first_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{profile?.first_name}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20">
                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Shield className="h-4 w-4 text-purple-600" />
                          Admin-Bereich
                        </Link>
                      )}
                      {(isSeller || isAdmin) && (
                        <Link
                          to="/seller"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <LayoutDashboard className="h-4 w-4 text-navy-600" />
                          Inserate verwalten
                        </Link>
                      )}
                      {isSeller && (
                        <Link
                          to="/seller/profil"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <User className="h-4 w-4 text-gray-500" />
                          Mein Profil
                        </Link>
                      )}
                      <hr className="my-1 border-gray-100" />
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Abmelden
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link to="/auth/login">
                  <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-white/10">
                    Anmelden
                  </Button>
                </Link>
                <Link to="/auth/register">
                  <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white border-0">
                    Boot verkaufen
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-300 hover:text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-800 px-4 py-3 space-y-1">
          <NavLink to="/boote" className="block px-3 py-2 text-gray-300 hover:text-white rounded-md" onClick={() => setMobileOpen(false)}>
            Boote kaufen
          </NavLink>
          <NavLink to="/checkup" className="block px-3 py-2 text-gray-300 hover:text-white rounded-md" onClick={() => setMobileOpen(false)}>
            Check-up Service
          </NavLink>
          <NavLink to="/bootsmarken" className="block px-3 py-2 text-gray-300 hover:text-white rounded-md" onClick={() => setMobileOpen(false)}>
            Bootsmarken
          </NavLink>
          <NavLink to="/kontakt" className="block px-3 py-2 text-gray-300 hover:text-white rounded-md" onClick={() => setMobileOpen(false)}>
            Kontakt
          </NavLink>
          {isAuthenticated ? (
            <>
              {(isSeller || isAdmin) && (
                <NavLink to="/seller" className="block px-3 py-2 text-gray-300 hover:text-white rounded-md" onClick={() => setMobileOpen(false)}>
                  Inserate verwalten
                </NavLink>
              )}
              {isAdmin && (
                <NavLink to="/admin" className="block px-3 py-2 text-gray-300 hover:text-white rounded-md" onClick={() => setMobileOpen(false)}>
                  Admin-Bereich
                </NavLink>
              )}
              <button
                onClick={() => { handleSignOut(); setMobileOpen(false); }}
                className="block w-full text-left px-3 py-2 text-red-400 hover:text-red-300 rounded-md"
              >
                Abmelden
              </button>
            </>
          ) : (
            <>
              <Link to="/auth/login" className="block px-3 py-2 text-gray-300 hover:text-white rounded-md" onClick={() => setMobileOpen(false)}>
                Anmelden
              </Link>
              <Link to="/auth/register" className="block px-3 py-2 text-gray-300 hover:text-white rounded-md font-medium" onClick={() => setMobileOpen(false)}>
                Boot verkaufen
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
