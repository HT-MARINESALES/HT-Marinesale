import { Link } from 'react-router-dom';
import { Plus, List, FileText, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/listings/StatusBadge';
import { useSellerListings } from '@/hooks/useListings';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice, formatDate } from '@/lib/utils';
import { PageSpinner } from '@/components/ui/Spinner';
import type { ListingStatus } from '@/types';

export function SellerDashboard() {
  const { profile } = useAuth();
  const { data: listings, isLoading } = useSellerListings();

  if (isLoading) return <PageSpinner />;

  const statusCounts = (listings || []).reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const stats = [
    { label: 'Alle Inserate', value: listings?.length || 0, icon: List, color: 'text-navy-600 bg-navy-50' },
    { label: 'In Bearbeitung', value: (statusCounts.submitted || 0) + (statusCounts.checkup_required || 0) + (statusCounts.checkup_scheduled || 0), icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Veröffentlicht', value: statusCounts.published || 0, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    { label: 'Verkauft', value: statusCounts.sold || 0, icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <div>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Guten Tag, {profile?.first_name}!
        </h1>
        <p className="text-gray-500 mt-1">Hier ist eine Übersicht Ihrer Inserate</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">Schnellaktionen</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/seller/inserate/neu">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Neues Inserat erstellen
            </Button>
          </Link>
          <Link to="/seller/inserate">
            <Button variant="outline" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Alle Inserate anzeigen
            </Button>
          </Link>
        </div>
      </div>

      {/* Process info */}
      {(listings?.length || 0) === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-navy-900 mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            So funktioniert es
          </h3>
          <ol className="space-y-2 text-sm text-navy-800">
            <li className="flex items-start gap-2"><span className="font-bold">1.</span> Erstellen Sie Ihr erstes Inserat mit allen Boot-Details</li>
            <li className="flex items-start gap-2"><span className="font-bold">2.</span> Reichen Sie es zur Prüfung ein</li>
            <li className="flex items-start gap-2"><span className="font-bold">3.</span> Unser Experte führt den Check-up durch</li>
            <li className="flex items-start gap-2"><span className="font-bold">4.</span> Nach Freigabe wird Ihr Inserat veröffentlicht</li>
            <li className="flex items-start gap-2"><span className="font-bold">5.</span> Bei Verkauf: max. 8 % Provision (gestaffelt nach Preis)</li>
          </ol>
          <Link to="/seller/inserate/neu" className="mt-4 inline-block">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Erstes Inserat erstellen
            </Button>
          </Link>
        </div>
      )}

      {/* Recent listings */}
      {listings && listings.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Aktuelle Inserate</h2>
            <Link to="/seller/inserate" className="text-sm text-navy-600 hover:underline">
              Alle anzeigen
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {listings.slice(0, 5).map(listing => (
              <div key={listing.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="min-w-0 flex-1">
                  <Link to={`/seller/inserate/${listing.id}`} className="font-medium text-gray-900 hover:text-navy-700 truncate block">
                    {listing.title}
                  </Link>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-gray-500">{formatPrice(listing.price)}</span>
                    <span className="text-xs text-gray-400">
                      {formatDate(listing.created_at)}
                    </span>
                  </div>
                </div>
                <StatusBadge status={listing.status as ListingStatus} className="ml-4 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
