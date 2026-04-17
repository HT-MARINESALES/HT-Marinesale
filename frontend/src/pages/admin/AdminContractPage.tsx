import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Upload, ExternalLink, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { useToast } from '@/hooks/useToast';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface ContractDoc {
  id: string;
  version: string;
  file_name: string;
  file_size: number;
  uploaded_at: string;
  download_url: string;
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export function AdminContractPage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: contracts, isLoading } = useQuery<ContractDoc[]>({
    queryKey: ['admin-contract'],
    queryFn: () => api.get('/admin/contract'),
  });

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => api.upload<ContractDoc>('/admin/contract', formData),
    onSuccess: () => {
      success('Vertrag hochgeladen');
      queryClient.invalidateQueries({ queryKey: ['admin-contract'] });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (err: Error) => {
      error('Fehler beim Hochladen', err.message);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('contract', selectedFile);
    uploadMutation.mutate(formData);
  };

  if (isLoading) return <PageSpinner />;

  const current = contracts?.[0];
  const previous = contracts?.slice(1) ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kommissionsvertrag</h1>
        <p className="text-sm text-gray-500 mt-1">Verwalten Sie den aktuellen Kommissionsvertrag (PDF).</p>
      </div>

      {/* Current contract */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-600" />
          Aktueller Vertrag
        </h2>

        {current ? (
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="font-medium text-gray-900">{current.file_name}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium text-xs">
                  {current.version}
                </span>
                <span>{formatFileSize(current.file_size)}</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDate(current.uploaded_at)}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(current.download_url, '_blank')}
              className="flex items-center gap-2 shrink-0"
            >
              <ExternalLink className="h-4 w-4" />
              Vertrag öffnen
            </Button>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Noch kein Vertrag hochgeladen.</p>
        )}
      </div>

      {/* Upload new contract */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Upload className="h-5 w-5 text-purple-600" />
          Neuen Vertrag hochladen
        </h2>

        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-purple-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            {selectedFile ? (
              <p className="text-sm font-medium text-gray-700">{selectedFile.name}</p>
            ) : (
              <p className="text-sm text-gray-500">PDF-Datei auswählen (max. 20 MB)</p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadMutation.isPending}
            loading={uploadMutation.isPending}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Hochladen
          </Button>
        </div>
      </div>

      {/* Previous versions */}
      {previous.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Frühere Versionen</h2>
          <div className="divide-y divide-gray-100">
            {previous.map(doc => (
              <div key={doc.id} className="flex items-center justify-between py-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-gray-700">{doc.file_name}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                      {doc.version}
                    </span>
                    <span>{formatFileSize(doc.file_size)}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(doc.uploaded_at)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => window.open(doc.download_url, '_blank')}
                  className="text-gray-400 hover:text-purple-600 transition-colors ml-4"
                  title="Öffnen"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
