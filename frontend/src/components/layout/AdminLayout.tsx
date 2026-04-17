import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, List, Users, MessageSquare, LogOut, Menu, X, Shield, FileText, ClipboardList } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { PaginatedResponse, ContactRequest } from '@/types';

export function AdminLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: unreadContacts } = useQuery({
    queryKey: ['admin-contacts', { unread: true }],
    queryFn: () => api.get<PaginatedResponse<ContactRequest>>('/admin/contacts?unread=true&limit=1'),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 60000,
  });
  const unreadCount = unreadContacts?.total || 0;

  const { data: pendingListings } = useQuery({
    queryKey: ['admin-listings-pending-count'],
    queryFn: () => api.get<PaginatedResponse<unknown>>('/admin/listings?status=submitted&limit=1'),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 60000,
  });
  const pendingCount = pendingListings?.total || 0;

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { to: '/admin/inserate', icon: List, label: 'Inserate', badge: pendingCount },
    { to: '/admin/verkaeufer', icon: Users, label: 'Verkäufer' },
    { to: '/admin/kontakte', icon: MessageSquare, label: 'Kontaktanfragen', badge: unreadCount },
    { to: '/admin/vertrag', icon: FileText, label: 'Kommissionsvertrag' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn(mobile ? '' : 'flex flex-col h-full')}>
      <div className="p-6 border-b border-purple-900">
        <NavLink to="/">
          <img src="/logo.png" alt="HT-Marineservice" className="h-[50px] w-auto" />
        </NavLink>
        <div className="flex items-center gap-1.5 mt-2">
          <Shield className="h-3.5 w-3.5 text-purple-300" />
          <span className="text-xs text-purple-300 font-medium">Admin-Bereich</span>
        </div>
      </div>

      <div className="px-4 py-4 border-b border-purple-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center">
            <span className="text-white font-semibold">
              {profile?.first_name?.charAt(0) || 'A'}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-xs text-purple-300">Administrator</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-purple-800 text-white'
                : 'text-purple-200 hover:bg-purple-800 hover:text-white'
            )}
            onClick={() => setSidebarOpen(false)}
          >
            <item.icon className="h-5 w-5" />
            <span className="flex-1">{item.label}</span>
            {item.badge ? (
              <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-bold bg-red-500 text-white">
                {item.badge}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-purple-900 space-y-1">
        <Link
          to="/admin/checkliste/blanko"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-purple-200 hover:bg-purple-800 hover:text-white transition-colors"
        >
          <ClipboardList className="h-5 w-5" />
          Blanko-Checkliste
        </Link>
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
      <div className="hidden md:flex flex-col w-64 bg-purple-950 flex-shrink-0 h-full overflow-y-auto">
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-purple-950 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-purple-900">
              <span className="text-white font-semibold">Admin-Menü</span>
              <button onClick={() => setSidebarOpen(false)} className="text-purple-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar mobile />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <div className="md:hidden bg-purple-950 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-purple-200">
            <Menu className="h-6 w-6" />
          </button>
          <span className="text-white font-semibold">Admin-Bereich</span>
        </div>
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
