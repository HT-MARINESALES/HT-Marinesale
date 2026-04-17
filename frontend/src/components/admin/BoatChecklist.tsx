import { useState, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, Circle, Save } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { CHECKLIST_CATEGORIES, RATING_LABELS, type ChecklistData, type ChecklistItemStatus } from '@/config/checklistConfig';

interface Props {
  listingId: string;
  ceCategoryValue?: string;
}

export function BoatChecklist({ listingId, ceCategoryValue }: Props) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [localData, setLocalData] = useState<ChecklistData>({});
  const [localRating, setLocalRating] = useState<number | null>(null);
  const [localPublished, setLocalPublished] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const { data: existing, isLoading } = useQuery({
    queryKey: ['checklist', listingId],
    queryFn: () => api.get<{ data: ChecklistData; overall_rating: number | null; is_published: boolean } | null>(`/admin/listings/${listingId}/checklist`),
    enabled: !!listingId,
  });

  useEffect(() => {
    if (existing !== undefined && !initialized) {
      const data = existing?.data || {};
      // Auto-fill CE-Kennzeichnung remark from listing ce_category if not already set
      if (ceCategoryValue && !data['dok_ce']?.remark) {
        data['dok_ce'] = { ...data['dok_ce'], remark: ceCategoryValue };
      }
      setLocalData(data);
      setLocalRating(existing?.overall_rating || null);
      setLocalPublished(existing?.is_published ?? false);
      setInitialized(true);
    }
  }, [existing, initialized, ceCategoryValue]);

  const saveMutation = useMutation({
    mutationFn: () => api.put(`/admin/listings/${listingId}/checklist`, { data: localData, overall_rating: localRating, is_published: localPublished }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist', listingId] });
      success('Checkliste gespeichert');
    },
    onError: () => error('Fehler beim Speichern'),
  });

  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const setItemField = useCallback((itemId: string, field: string, value: string | boolean) => {
    setLocalData(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));
  }, []);

  const setItemStatus = useCallback((itemId: string, newStatus: ChecklistItemStatus) => {
    setLocalData(prev => {
      const current = prev[itemId]?.status ?? (prev[itemId]?.checked ? 'ok' : undefined);
      // cycle: undefined → ok → fault → undefined; or set directly
      const next = current === newStatus ? undefined : newStatus;
      return { ...prev, [itemId]: { ...prev[itemId], status: next, checked: next === 'ok' } };
    });
  }, []);

  // Resolve status (migrate legacy checked boolean)
  const resolveStatus = (itemData: ChecklistData[string]): ChecklistItemStatus => {
    if (itemData?.status) return itemData.status;
    if (itemData?.checked) return 'ok';
    return undefined;
  };

  // Count totals
  const totalItems = CHECKLIST_CATEGORIES.reduce((sum, cat) => sum + cat.items.length, 0);
  const checkedItems = Object.values(localData).filter(v => resolveStatus(v) !== undefined).length;
  const okItems = Object.values(localData).filter(v => resolveStatus(v) === 'ok').length;
  const faultItems = Object.values(localData).filter(v => resolveStatus(v) === 'fault').length;

  if (isLoading && !initialized) return <div className="p-6 text-center text-gray-400 text-sm">Checkliste wird geladen...</div>;

  return (
    <div className="space-y-4">
      {/* Overall rating */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Gesamtzustand Boot</h3>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map(rating => {
            const r = RATING_LABELS[rating];
            const isSelected = localRating === rating;
            return (
              <button
                key={rating}
                onClick={() => setLocalRating(isSelected ? null : rating)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                  isSelected ? `${r.bg} ${r.border} ${r.color}` : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl font-bold">{rating}</span>
                <span className="text-xs font-medium leading-tight">{r.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-2">1 = sehr guter Zustand · 5 = sehr schlechter Zustand</p>
      </div>

      {/* Published toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900 text-sm">Checkliste veröffentlichen</p>
          <p className="text-xs text-gray-500 mt-0.5">Wenn aktiv, wird die Checkliste im öffentlichen Inserat angezeigt</p>
        </div>
        <button
          type="button"
          onClick={() => setLocalPublished(p => !p)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${localPublished ? 'bg-green-500' : 'bg-gray-300'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${localPublished ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* Progress */}
      <div className="flex flex-wrap items-center gap-4 px-1">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="font-semibold text-green-700">{okItems}</span>
          <span className="text-gray-500">in Ordnung</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <XCircle className="h-4 w-4 text-red-500" />
          <span className="font-semibold text-red-700">{faultItems}</span>
          <span className="text-gray-500">Mängel</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Circle className="h-4 w-4" />
          <span>{totalItems - checkedItems} offen</span>
        </div>
        <div className="flex-1 min-w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full flex">
            <div className="bg-green-500 transition-all" style={{ width: `${(okItems / totalItems) * 100}%` }} />
            <div className="bg-red-400 transition-all" style={{ width: `${(faultItems / totalItems) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Categories */}
      {CHECKLIST_CATEGORIES.map(category => {
        const catOk = category.items.filter(item => resolveStatus(localData[item.id]) === 'ok').length;
        const catFault = category.items.filter(item => resolveStatus(localData[item.id]) === 'fault').length;
        const catDone = catOk + catFault;
        const isOpen = openSections.has(category.id);
        return (
          <div key={category.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection(category.id)}
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900 text-sm text-left">{category.title}</span>
                {category.badge && (
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-medium">{category.badge}</span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {catFault > 0 && (
                  <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    <XCircle className="h-3 w-3" />{catFault}
                  </span>
                )}
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catDone === category.items.length ? 'bg-green-100 text-green-700' : catDone > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                  {catDone}/{category.items.length}
                </span>
                {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {category.items.map(item => {
                  const itemData = localData[item.id] || {};
                  const status = resolveStatus(itemData);
                  const isOk = status === 'ok';
                  const isFault = status === 'fault';
                  const hasStatus = isOk || isFault;
                  return (
                    <div key={item.id} className={`p-4 transition-colors ${isFault ? 'bg-red-50/40' : isOk ? 'bg-green-50/30' : ''}`}>
                      <div className="flex items-start gap-3">
                        {/* Label */}
                        <span className={`flex-1 text-sm leading-snug pt-0.5 ${hasStatus ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                          {item.label}
                        </span>
                        {/* Status buttons */}
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => setItemStatus(item.id, 'ok')}
                            title="In Ordnung"
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                              isOk
                                ? 'bg-green-500 text-white border-green-500 shadow-sm'
                                : 'border-gray-200 text-gray-400 hover:border-green-400 hover:text-green-600 hover:bg-green-50'
                            }`}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="hidden sm:inline">OK</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemStatus(item.id, 'fault')}
                            title="Mangel / nicht in Ordnung"
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                              isFault
                                ? 'bg-red-500 text-white border-red-500 shadow-sm'
                                : 'border-gray-200 text-gray-400 hover:border-red-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                          >
                            <XCircle className="h-4 w-4" />
                            <span className="hidden sm:inline">Mangel</span>
                          </button>
                        </div>
                      </div>

                      {/* Fault remark: always show a free-text comment field for fault items */}
                      {isFault && (
                        <div className="mt-3" onClick={e => e.stopPropagation()}>
                          <label className="block text-xs text-red-600 mb-1 font-medium">Mangel beschreiben *</label>
                          <input
                            type="text"
                            value={(itemData as Record<string, string>)['fault_remark'] || ''}
                            onChange={e => setItemField(item.id, 'fault_remark', e.target.value)}
                            placeholder="Mangel beschreiben..."
                            className="w-full h-8 px-3 rounded-lg border border-red-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-red-50"
                          />
                        </div>
                      )}

                      {/* Fields – always show comment when status is set */}
                      {hasStatus && item.cylGrid ? (
                        <div className="mt-3 grid grid-cols-4 gap-2" onClick={e => e.stopPropagation()}>
                          {item.fields.map(field => (
                            <div key={field.key}>
                              <label className="block text-xs text-gray-500 mb-0.5">{field.label}</label>
                              <input
                                type="text"
                                value={(itemData as Record<string, string>)[field.key] || ''}
                                onChange={e => setItemField(item.id, field.key, e.target.value)}
                                placeholder="–"
                                className={`w-full h-8 px-2 rounded-lg border text-sm text-center focus:outline-none focus:ring-2 ${
                                  isFault ? 'border-red-300 focus:ring-red-400 bg-red-50' : 'border-gray-300 focus:ring-navy-400'
                                }`}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        item.fields.map(field => {
                          if (!field.alwaysShow && !hasStatus) return null;
                          return (
                            <div key={field.key} className="mt-3 ml-0" onClick={e => e.stopPropagation()}>
                              <label className="block text-xs text-gray-500 mb-1">{field.label}</label>
                              {field.type === 'dropdown' ? (
                                <select
                                  value={(itemData as Record<string, string>)[field.key] || ''}
                                  onChange={e => setItemField(item.id, field.key, e.target.value)}
                                  className="w-full sm:w-48 h-8 px-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white"
                                >
                                  <option value="">– bitte wählen –</option>
                                  {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={(itemData as Record<string, string>)[field.key] || ''}
                                  onChange={e => setItemField(item.id, field.key, e.target.value)}
                                  placeholder={isFault ? 'Mangel beschreiben...' : 'Optional...'}
                                  className={`w-full h-8 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 ${
                                    isFault ? 'border-red-300 focus:ring-red-400 bg-red-50' : 'border-gray-300 focus:ring-navy-400'
                                  }`}
                                />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Save button */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-0 rounded-b-xl">
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          className="w-full sm:w-auto"
        >
          <Save className="h-4 w-4" />
          Checkliste speichern
        </Button>
      </div>
    </div>
  );
}
