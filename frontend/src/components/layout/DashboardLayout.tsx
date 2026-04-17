import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, List, Plus, User, LogOut, Menu, X, FileText } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/seller', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/seller/inserate', icon: List, label: 'Meine Inserate' },
  { to: '/seller/inserate/neu', icon: Plus, label: 'Neues Inserat' },
  { to: '/seller/profil', icon: User, label: 'Mein Profil' },
  { to: '/seller/vertrag', icon: FileText, label: 'Kommissionsvertrag' },
];

export function DashboardLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn(mobile ? '' : 'flex flex-col h-full')}>
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-800">
        <NavLink to="/">
          <img src="/logo.png" alt="HT-Marinesales" className="h-[50px] w-auto" />
        </NavLink>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="text-white font-semibold">
              {profile?.first_name?.charAt(0) || 'V'}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-xs text-gray-400">Verkäufer</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            )}
            onClick={() => setSidebarOpen(false)}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-gray-800">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-300 hover:bg-red-900/30 hover:text-red-200 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Abmelden
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Desktop sidebar – fixed height, internal scroll if needed */}
      <div className="hidden md:flex flex-col w-64 bg-black flex-shrink-0 h-full overflow-y-auto">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-black flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <span className="text-white font-semibold">Menü</span>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile topbar */}
        <div className="md:hidden bg-black px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-300">
            <Menu className="h-6 w-6" />
          </button>
          <span className="text-white font-semibold">HT-Marinesales</span>
        </div>

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
