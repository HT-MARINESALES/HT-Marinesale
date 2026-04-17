import { useState } from 'react';
import { Shield, CheckCircle2, XCircle, Circle, X, ChevronRight } from 'lucide-react';
import { CHECKLIST_CATEGORIES, RATING_LABELS, type ChecklistData } from '@/config/checklistConfig';

interface ChecklistRecord {
  data: ChecklistData;
  overall_rating: number | null;
}

interface Props {
  checklist: ChecklistRecord | null;
}

export function ChecklistDisplay({ checklist }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!checklist) return null;

  const rating = checklist.overall_rating;
  const ratingInfo = rating ? RATING_LABELS[rating] : null;
  const totalItems = CHECKLIST_CATEGORIES.reduce((sum, cat) => sum + cat.items.length, 0);
  const resolveStatus = (itemData: ChecklistData[string]) => {
    if (itemData?.status) return itemData.status;
    if (itemData?.checked) return 'ok';
    return undefined;
  };
  const checkedCount = Object.values(checklist.data).filter(v => resolveStatus(v) !== undefined).length;
  const faultCount = Object.values(checklist.data).filter(v => resolveStatus(v) === 'fault').length;

  return (
    <>
      {/* Main badge – replaces the old green trust bar */}
      <div className={`mt-5 rounded-xl border-2 overflow-hidden ${ratingInfo ? `${ratingInfo.border} ${ratingInfo.bg}` : 'border-green-300 bg-green-50'}`}>
        {/* Top row: shield + title + rating */}
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${ratingInfo ? ratingInfo.bg : 'bg-green-100'}`}>
              <Shield className={`h-5 w-5 ${ratingInfo ? ratingInfo.color : 'text-green-600'}`} />
            </div>
            <div>
              <p className={`font-bold text-sm ${ratingInfo ? ratingInfo.color : 'text-green-800'}`}>HT-Marinesales geprüft</p>
              <p className={`text-xs ${ratingInfo ? ratingInfo.color : 'text-green-600'} opacity-80`}>
                {checkedCount} von {totalItems} Punkten geprüft{faultCount > 0 ? ` · ${faultCount} Mängel` : ''}
              </p>
            </div>
          </div>
          {rating && ratingInfo && (
            <div className={`flex flex-col items-center px-4 py-2 rounded-xl ${ratingInfo.bg} border ${ratingInfo.border}`}>
              <span className={`text-3xl font-black ${ratingInfo.color}`}>{rating}</span>
              <span className={`text-xs font-semibold ${ratingInfo.color}`}>{ratingInfo.label}</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={() => setModalOpen(true)}
          className={`w-full flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-t border-current border-opacity-20 hover:bg-black hover:bg-opacity-5 transition-colors ${ratingInfo ? ratingInfo.color : 'text-green-700'}`}
        >
          Vollständige Prüfliste ansehen
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Detail modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-600" />
                <div>
                  <h2 className="font-bold text-gray-900 text-base">HT-Marinesales Prüfprotokoll</h2>
                  {rating && ratingInfo && (
                    <p className={`text-xs ${ratingInfo.color} font-medium`}>Gesamtzustand: {rating}/5 – {ratingInfo.label}</p>
                  )}
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Modal content */}
            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              {CHECKLIST_CATEGORIES.map(cat => {
                const catOk = cat.items.filter(item => resolveStatus(checklist.data[item.id]) === 'ok').length;
                const catFault = cat.items.filter(item => resolveStatus(checklist.data[item.id]) === 'fault').length;
                const catDone = catOk + catFault;
                if (catDone === 0) return null; // Skip empty categories
                return (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm">{cat.title}</h3>
                      <div className="flex items-center gap-1.5">
                        {catFault > 0 && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                            {catFault} Mangel
                          </span>
                        )}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catDone === cat.items.length ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {catDone}/{cat.items.length}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {cat.items.map(item => {
                        const itemData = checklist.data[item.id];
                        const status = resolveStatus(itemData);
                        if (!status) return null;
                        const isOk = status === 'ok';
                        const isFault = status === 'fault';
                        const d = itemData as Record<string, string>;
                        // For faults: show fault_remark first, then alwaysShow remark, then other fields
                        const faultRemark = d['fault_remark'];
                        const remarkField = item.fields.find(f => f.alwaysShow && d[f.key]);
                        const extraFields = item.fields.filter(f => !f.alwaysShow && d[f.key]);
                        return (
                          <div key={item.id} className={`flex items-start gap-2.5 text-sm rounded-lg px-2 py-1.5 ${isFault ? 'bg-red-50' : ''}`}>
                            {isOk
                              ? <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                              : <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                            }
                            <div className="flex-1 min-w-0">
                              <p className={isFault ? 'text-gray-900 font-medium' : 'text-gray-800'}>{item.label}</p>
                              {isFault && faultRemark && (
                                <p className="text-xs text-red-700 mt-0.5 font-medium">{faultRemark}</p>
                              )}
                              {isFault && remarkField && !faultRemark && (
                                <p className="text-xs text-red-700 mt-0.5 font-medium">{d[remarkField.key]}</p>
                              )}
                              {isOk && remarkField && (
                                <p className="text-xs text-gray-500 mt-0.5 italic">{d[remarkField.key]}</p>
                              )}
                              {extraFields.map(f => (
                                <p key={f.key} className="text-xs text-gray-500 mt-0.5">
                                  <span className="font-medium">{f.label}:</span> {d[f.key]}
                                </p>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      {/* Show unchecked items more subtly */}
                      {cat.items.filter(item => !resolveStatus(checklist.data[item.id])).map(item => (
                        <div key={item.id} className="flex items-start gap-2.5 text-sm opacity-40">
                          <Circle className="h-4 w-4 text-gray-300 flex-shrink-0 mt-0.5" />
                          <p className="text-gray-500">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">Geprüft durch HT-Marinesales · Professionelle Bootsinspektion</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
