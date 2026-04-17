import { Link } from 'react-router-dom';
import { List, Users, MessageSquare, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { useAdminListings } from '@/hooks/useListings';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/listings/StatusBadge';
import { formatPrice, formatDate, getProvisionInfo } from '@/lib/utils';
import { PageSpinner } from '@/components/ui/Spinner';
import type { PaginatedResponse, Listing, ContactRequest } from '@/types';

export function AdminDashboard() {
  const { data: listings, isLoading } = useAdminListings({ limit: 100 });
  const { data: contacts } = useQuery({
    queryKey: ['admin-contacts', { unread: true }],
    queryFn: () => api.get<PaginatedResponse<ContactRequest>>('/admin/contacts?unread=true&limit=5'),
    staleTime: 0,
    refetchOnMount: 'always',
  });
  const { data: recentSubmissions } = useAdminListings({ status: 'submitted', limit: 5 });

  if (isLoading) return <PageSpinner />;

  const statusCounts = (listings?.data || []).reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalProvision = (listings?.data || [])
    .filter(l => l.status === 'published')
    .reduce((sum, l) => sum + getProvisionInfo(l.price).amount, 0);

  const stats = [
    { label: 'Gesamt Inserate', value: listings?.total || 0, icon: List, color: 'text-navy-600 bg-navy-50' },
    { label: 'Zur Prüfung', value: (statusCounts.submitted || 0), icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Veröffentlicht', value: statusCounts.published || 0, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    { label: 'Ungelesene Nachrichten', value: contacts?.total || 0, icon: MessageSquare, color: 'text-red-600 bg-red-50' },
    { label: 'Pot. Provision (aktiv)', value: formatPrice(totalProvision), icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Übersicht aller Aktivitäten</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3 ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Status-Übersicht</h2>
          <div className="space-y-3">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <StatusBadge status={status as any} />
                <span className="font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Unread contacts */}
        {contacts && contacts.total > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Ungelesene Nachrichten</h2>
              <Link to="/admin/kontakte" className="text-sm text-navy-600 hover:underline">Alle anzeigen</Link>
            </div>
            <div className="space-y-3">
              {(contacts.data || []).slice(0, 4).map(contact => (
                <div key={contact.id} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-900">{contact.name}</p>
                    <p className="text-xs text-gray-500 truncate">{contact.message.substring(0, 60)}...</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent submissions */}
      {recentSubmissions && recentSubmissions.total > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Neue Einreichungen</h2>
            <Link to="/admin/inserate?status=submitted" className="text-sm text-navy-600 hover:underline">Alle anzeigen</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {(recentSubmissions.data || []).map(listing => (
              <Link
                key={listing.id}
                to={`/admin/inserate/${listing.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">{listing.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-gray-500">{formatPrice(listing.price)}</span>
                    <span className="text-xs text-gray-400">
                      {listing.submitted_at ? formatDate(listing.submitted_at) : ''}
                    </span>
                  </div>
                </div>
                <StatusBadge status={listing.status} className="ml-4 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
