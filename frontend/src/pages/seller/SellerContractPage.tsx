import { useQuery } from '@tanstack/react-query';
import { FileText, ExternalLink, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatDateTime } from '@/lib/utils';

interface ContractAcceptance {
  id: string;
  contract_version: string;
  accepted_at: string;
  download_url: string | null;
  file_name: string | null;
}

export function SellerContractPage() {
  const { data, isLoading } = useQuery<ContractAcceptance>({
    queryKey: ['seller-contract'],
    queryFn: () => api.get<ContractAcceptance>('/seller/contract'),
    retry: false,
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Kommissionsvertrag</h1>
      <p className="text-gray-500 text-sm mb-6">Ihre Vertragsvereinbarung mit HT-Marinesales</p>

      {data ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Status header */}
          <div className="bg-green-50 border-b border-green-100 p-5 flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-900">Kommissionsvertrag akzeptiert</p>
              <p className="text-sm text-green-700">Sie haben den Vertrag verbindlich angenommen.</p>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Version</p>
                <p className="font-semibold text-gray-900 text-lg uppercase">{data.contract_version}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Akzeptiert am</p>
                <p className="font-semibold text-gray-900">{formatDateTime(data.accepted_at)}</p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-5 w-5 text-navy-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {data.file_name || `Kommissionsvertrag ${data.contract_version}`}
                  </p>
                  <p className="text-xs text-gray-500">PDF-Dokument</p>
                </div>
              </div>
              {data.download_url ? (
                <a
                  href={data.download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-navy-700 text-white text-sm font-medium rounded-lg hover:bg-navy-800 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  PDF öffnen
                </a>
              ) : (
                <span className="text-xs text-gray-400">PDF nicht verfügbar</span>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Bei Fragen zum Kommissionsvertrag wenden Sie sich bitte direkt an HT-Marinesales.
                Die Provision beträgt max. <strong>8 % des Verkaufspreises</strong> (gestaffelt nach Preis).
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-red-200 p-6 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-900">Kein Vertrag gefunden</p>
            <p className="text-sm text-gray-500 mt-1">
              Es wurde kein akzeptierter Kommissionsvertrag für Ihr Konto gefunden.
              Bitte kontaktieren Sie HT-Marinesales.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
