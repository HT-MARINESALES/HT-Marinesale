import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Copy, RefreshCw, ChevronLeft, Check, Archive, Pencil, ArchiveRestore, FileDown, Trash2 } from 'lucide-react';
import { BoatChecklist } from '@/components/admin/BoatChecklist';
import JSZip from 'jszip';
import { useAdminListing, useAdminChangeStatus, useAdminUpdateListing, useAdminDeleteListing } from '@/hooks/useListings';
import { StatusBadge } from '@/components/listings/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { ImageGallery } from '@/components/listings/ImageGallery';
import { getImageUrl, formatPrice, formatDate, formatDateTime, STATUS_LABELS, getProvisionInfo } from '@/lib/utils';
import { PageSpinner } from '@/components/ui/Spinner';
import { useToast } from '@/hooks/useToast';
import { api } from '@/lib/api';
import type { ListingStatus } from '@/types';

export function AdminListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: listing, isLoading, refetch } = useAdminListing(id || '');
  const changeStatus = useAdminChangeStatus();
  const updateListing = useAdminUpdateListing();
  const deleteListing = useAdminDeleteListing();
  const { success, error } = useToast();
  const [rejectModal, setRejectModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [checkupContactModal, setCheckupContactModal] = useState(false);
  const [checkupMessage, setCheckupMessage] = useState('');
  const [sendingCheckup, setSendingCheckup] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [kaTitle, setKaTitle] = useState('');
  const [kaDescription, setKaDescription] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);

  if (isLoading) return <PageSpinner />;
  if (!listing) return <div className="p-8 text-gray-500">Inserat nicht gefunden</div>;

  const images = listing.listing_images || [];
  const statusHistory = listing.listing_status_history || [];
  const changeHistory = (listing as any).listing_changes
    ? [...((listing as any).listing_changes as any[])].sort(
        (a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
      )
    : [];
  const seller = listing.profiles as { id: string; first_name: string; last_name: string; phone?: string; email?: string } | null;

  const handleStatusChange = async (status: string, opts: { notes?: string; rejection_reason?: string; checkup_date?: string } = {}) => {
    try {
      await changeStatus.mutateAsync({ id: id!, status, ...opts });
      success(`Status geändert zu: ${STATUS_LABELS[status]}`);
      refetch();
    } catch (err) {
      error('Fehler', err instanceof Error ? err.message : 'Status konnte nicht geändert werden');
    }
  };

  const handleContactCheckup = async () => {
    setSendingCheckup(true);
    try {
      await api.post(`/admin/listings/${id}/contact-checkup`, { message: checkupMessage || undefined });
      success('E-Mail gesendet & Status auf "Check-up erforderlich" gesetzt');
      setCheckupContactModal(false);
      setCheckupMessage('');
      refetch();
    } catch (err) {
      error('Fehler beim Senden');
    }
    setSendingCheckup(false);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      error('Bitte geben Sie einen Ablehnungsgrund an');
      return;
    }
    await handleStatusChange('rejected', { rejection_reason: rejectionReason });
    setRejectModal(false);
    setRejectionReason('');
  };

  const handleSaveAdminNotes = async () => {
    try {
      await updateListing.mutateAsync({ id: id!, data: { admin_notes: adminNotes } });
      success('Notizen gespeichert');
    } catch (err) {
      error('Fehler beim Speichern');
    }
  };

  const generateKA = async () => {
    setGenerating(true);
    try {
      const data = await api.get<{ ka_title: string; ka_description: string }>(`/admin/listings/${id}/ka/generate`);
      setKaTitle(data.ka_title);
      setKaDescription(data.ka_description);
    } catch (err) {
      error('Generierung fehlgeschlagen');
    }
    setGenerating(false);
  };

  const saveKA = async () => {
    try {
      await api.put(`/admin/listings/${id}/ka`, { ka_title: kaTitle, ka_description: kaDescription });
      success('KA-Inhalt gespeichert');
    } catch (err) {
      error('Fehler beim Speichern');
    }
  };

  const downloadImagesZip = async () => {
    if (!images.length) return;
    setDownloading(true);
    try {
      const zip = new JSZip();
      await Promise.all(images.map(async (img: any, idx: number) => {
        const url = getImageUrl(img.storage_path);
        const resp = await fetch(url);
        const blob = await resp.blob();
        const ext = img.file_name?.split('.').pop() || 'jpg';
        const isPrimary = img.is_primary ? '_titelbild' : '';
        zip.file(`bild_${String(idx + 1).padStart(2, '0')}${isPrimary}.${ext}`, blob);
      }));
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${listing.brand}-${listing.model}-${listing.year}-bilder.zip`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      error('Download fehlgeschlagen');
    }
    setDownloading(false);
  };

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = async () => {
    try {
      await deleteListing.mutateAsync(id!);
      success('Inserat gelöscht');
      navigate('/admin/inserate');
    } catch (err) {
      error('Fehler beim Löschen');
    }
    setDeleteModal(false);
  };

  // Status action buttons — all size="sm" for visual consistency
  const statusActions: Record<string, JSX.Element[]> = {
    submitted: [
      <Button key="approve" size="sm" variant="success" onClick={() => handleStatusChange('published')}>Freischalten</Button>,
      <Button key="checkup" size="sm" variant="warning" onClick={() => setCheckupContactModal(true)}>Check-up anfordern</Button>,
      <Button key="reject" size="sm" variant="destructive" onClick={() => setRejectModal(true)}>Ablehnen</Button>,
    ],
    checkup_required: [
      <Button key="approve" size="sm" variant="success" onClick={() => handleStatusChange('published')}>Freischalten</Button>,
      <Button key="reject" size="sm" variant="destructive" onClick={() => setRejectModal(true)}>Ablehnen</Button>,
    ],
    checkup_scheduled: [
      <Button key="approve" size="sm" variant="success" onClick={() => handleStatusChange('published')}>Freischalten</Button>,
      <Button key="reject" size="sm" variant="destructive" onClick={() => setRejectModal(true)}>Ablehnen</Button>,
    ],
    checkup_completed: [
      <Button key="approve" size="sm" variant="success" onClick={() => handleStatusChange('published')}>Freischalten</Button>,
      <Button key="reject" size="sm" variant="destructive" onClick={() => setRejectModal(true)}>Ablehnen</Button>,
    ],
    published: [
      <Button key="sold" size="sm" variant="success" onClick={() => handleStatusChange('sold')}>Als Verkauft markieren</Button>,
      <Button key="archive" size="sm" variant="secondary" onClick={() => handleStatusChange('archived')}>
        <Archive className="h-3.5 w-3.5" /> Archivieren
      </Button>,
    ],
    archived: [
      <Button key="republish" size="sm" variant="success" onClick={() => handleStatusChange('published')}>
        <ArchiveRestore className="h-3.5 w-3.5" /> Wieder veröffentlichen
      </Button>,
      <Button key="draft" size="sm" variant="outline" onClick={() => handleStatusChange('draft')}>Als Entwurf</Button>,
    ],
    sold: [
      <Button key="republish" size="sm" variant="outline" onClick={() => handleStatusChange('published')}>
        <ArchiveRestore className="h-3.5 w-3.5" /> Wieder veröffentlichen
      </Button>,
    ],
  };

  const currentActions = statusActions[listing.status] || [];

  return (
    <div className="max-w-5xl">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <Link
          to="/admin/inserate"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-navy-700 mb-3 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Alle Inserate
        </Link>

        <div className="flex items-start gap-4">
          {/* Left: title + meta */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 leading-snug">{listing.title}</h1>
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1.5 mt-2">
              <StatusBadge status={listing.status as ListingStatus} />
              <span className="text-sm font-semibold text-gray-900">{formatPrice(listing.price)}</span>
              {(() => {
                const { rate, amount } = getProvisionInfo(listing.price);
                return (
                  <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded px-2 py-0.5 font-medium">
                    {rate.toString().replace('.', ',')}% Provision = {formatPrice(amount)}
                  </span>
                );
              })()}
              <span className="text-xs text-gray-300 select-all font-mono">#{listing.id.substring(0, 8)}</span>
            </div>
          </div>

          {/* Right: action bar — all buttons same height */}
          <div className="flex-shrink-0 flex items-center gap-1.5">
            {/* Utility: PDF + Edit */}
            <button
              onClick={() => window.open(`/admin/inserate/${id}/drucken`, '_blank')}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:border-navy-400 hover:text-navy-700 hover:bg-navy-50 transition-colors whitespace-nowrap"
            >
              <FileDown className="h-3.5 w-3.5" />
              PDF
            </button>
            <Link
              to={`/admin/inserate/${id}/bearbeiten`}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:border-navy-400 hover:text-navy-700 hover:bg-navy-50 transition-colors whitespace-nowrap"
            >
              <Pencil className="h-3.5 w-3.5" />
              Bearbeiten
            </Link>
            <button
              onClick={() => setDeleteModal(true)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:border-red-400 hover:bg-red-50 transition-colors whitespace-nowrap"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Löschen
            </button>

            {/* Divider */}
            {currentActions.length > 0 && (
              <div className="h-6 w-px bg-gray-200 mx-0.5" />
            )}

            {/* Status-specific actions */}
            {currentActions}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          {images.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Bilder ({images.length})</h2>
                <Button size="sm" variant="secondary" onClick={downloadImagesZip} loading={downloading}>
                  <Archive className="h-4 w-4" />
                  Als ZIP herunterladen
                </Button>
              </div>
              <ImageGallery images={images} title={listing.title} />
            </div>
          )}

          {/* Listing details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Inserat-Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Marke', listing.brand],
                ['Modell', listing.model],
                ['Baujahr', listing.year],
                ['Preis', (() => { const { rate, amount } = getProvisionInfo(listing.price); return `${formatPrice(listing.price)} · Provision ${rate.toString().replace('.', ',')} % = ${formatPrice(amount)}`; })()],
                ['Bootstyp', listing.boat_type],
                ['Länge', listing.length_m ? `${listing.length_m} m` : null],
                ['Motor', listing.engine_type],
                ['Leistung', listing.engine_power_hp ? `${listing.engine_power_hp} PS` : null],
                ['Kraftstoff', listing.fuel_type],
                ['Standort', listing.location_city],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={String(label)}>
                  <span className="text-gray-500">{label}: </span>
                  <span className="font-medium">{String(value)}</span>
                </div>
              ))}
            </div>
            {listing.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-2">Beschreibung</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{listing.description}</p>
              </div>
            )}
          </div>

          {/* Rejection reason */}
          {listing.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h2 className="font-semibold text-red-800 mb-2">Ablehnungsgrund</h2>
              <p className="text-sm text-red-700">{listing.rejection_reason}</p>
            </div>
          )}

          {/* Admin notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Admin-Notizen</h2>
            <Textarea
              rows={4}
              value={adminNotes || listing.admin_notes || ''}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Interne Notizen (nur für Admins sichtbar)..."
            />
            <Button size="sm" className="mt-3" onClick={handleSaveAdminNotes} loading={updateListing.isPending}>
              Notizen speichern
            </Button>
          </div>

          {/* Boat Checklist */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-6">
              <h2 className="font-semibold text-gray-900">Boots-Checkliste</h2>
              <button
                type="button"
                onClick={() => setChecklistOpen(p => !p)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checklistOpen ? 'bg-navy-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checklistOpen ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            {checklistOpen && (
              <div className="border-t border-gray-100 p-6">
                <BoatChecklist listingId={id!} ceCategoryValue={listing.ce_category ?? undefined} />
              </div>
            )}
          </div>

          {/* Kleinanzeigen Helper */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Kleinanzeigen Helfer</h2>
              <Button size="sm" variant="secondary" onClick={generateKA} loading={generating}>
                <RefreshCw className="h-4 w-4" />
                Automatisch generieren
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700">KA-Titel (max. 50 Zeichen)</label>
                  <button
                    onClick={() => copyToClipboard(kaTitle || listing.ka_title || '', 'title')}
                    className="flex items-center gap-1 text-xs text-navy-600 hover:underline"
                  >
                    {copied === 'title' ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                    {copied === 'title' ? 'Kopiert!' : 'Kopieren'}
                  </button>
                </div>
                <input
                  type="text"
                  value={kaTitle || listing.ka_title || ''}
                  onChange={(e) => setKaTitle(e.target.value)}
                  maxLength={50}
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                />
                <p className="text-xs text-gray-400 mt-1">{(kaTitle || listing.ka_title || '').length}/50 Zeichen</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700">KA-Beschreibung</label>
                  <button
                    onClick={() => copyToClipboard(kaDescription || listing.ka_description || '', 'desc')}
                    className="flex items-center gap-1 text-xs text-navy-600 hover:underline"
                  >
                    {copied === 'desc' ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                    {copied === 'desc' ? 'Kopiert!' : 'Kopieren'}
                  </button>
                </div>
                <textarea
                  value={kaDescription || listing.ka_description || ''}
                  onChange={(e) => setKaDescription(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 font-mono"
                />
                <p className="text-xs text-gray-400 mt-1">{(kaDescription || listing.ka_description || '').length} Zeichen</p>
              </div>

              <Button size="sm" onClick={saveKA}>KA-Inhalt speichern</Button>

              <div className="bg-blue-50 rounded-lg p-4 text-xs text-blue-700 space-y-1">
                <p className="font-semibold">Kleinanzeigen Tipps:</p>
                <p>• Titel max. 50 Zeichen (wird automatisch gekürzt)</p>
                <p>• Bilder in guter Qualität hochladen (JPEG, max. 10MB)</p>
                <p>• Preis realistisch setzen und VB-Preis angeben</p>
                <p>• Standort korrekt angeben</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Seller info */}
          {seller && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Verkäufer</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Name: </span>
                  <span className="font-medium">{seller.first_name} {seller.last_name}</span>
                </div>
                {seller.email && (
                  <div>
                    <span className="text-gray-500">E-Mail: </span>
                    <a href={`mailto:${seller.email}`} className="text-navy-600 hover:underline">{seller.email}</a>
                  </div>
                )}
                {seller.phone && (
                  <div>
                    <span className="text-gray-500">Telefon: </span>
                    <span>{seller.phone}</span>
                  </div>
                )}
              </div>
              <Link to={`/admin/verkaeufer/${seller.id}`} className="mt-3 text-xs text-navy-600 hover:underline block">
                Verkäuferprofil anzeigen →
              </Link>
            </div>
          )}

          {/* Dates */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Zeitstempel</h3>
            <div className="space-y-2 text-sm">
              {listing.created_at && (
                <div><span className="text-gray-500">Erstellt: </span>{formatDate(listing.created_at)}</div>
              )}
              {listing.submitted_at && (
                <div><span className="text-gray-500">Eingereicht: </span>{formatDate(listing.submitted_at)}</div>
              )}
              {listing.checkup_date && (
                <div><span className="text-gray-500">Check-up: </span>{formatDate(listing.checkup_date)}</div>
              )}
              {listing.published_at && (
                <div><span className="text-gray-500">Veröffentlicht: </span>{formatDate(listing.published_at)}</div>
              )}
              {listing.sold_at && (
                <div><span className="text-gray-500">Verkauft: </span>{formatDate(listing.sold_at)}</div>
              )}
            </div>
          </div>

          {/* Status history */}
          {statusHistory.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Status-Verlauf</h3>
              <div className="space-y-3">
                {statusHistory.map((h: any) => (
                  <div key={h.id} className="relative pl-4 border-l-2 border-gray-200 pb-3 last:pb-0">
                    <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-navy-600" />
                    <div className="flex items-start gap-2">
                      <StatusBadge status={h.to_status as ListingStatus} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDateTime(h.created_at)}
                      {h.profiles && ` • ${h.profiles.first_name}`}
                    </p>
                    {h.notes && <p className="text-xs text-gray-600 mt-1 italic">{h.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Change history (edits to published listings) */}
          {changeHistory.length > 0 && (
            <div className="bg-white rounded-xl border border-amber-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                Änderungshistorie
                <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                  {changeHistory.length}
                </span>
              </h3>
              <div className="space-y-4">
                {changeHistory.map((c: any) => {
                  const fields = Object.entries(c.changes as Record<string, { old: unknown; new: unknown }>);
                  const FIELD_LABELS: Record<string, string> = {
                    title: 'Titel', brand: 'Marke', model: 'Modell', year: 'Baujahr', price: 'Preis',
                    boat_type: 'Bootstyp', condition: 'Zustand', length_m: 'Länge (m)', width_m: 'Breite (m)',
                    draft_m: 'Tiefgang (m)', displacement_kg: 'Verdrängung (kg)', engine_type: 'Motortyp',
                    engine_count: 'Anzahl Motoren', engine_power_hp: 'Motorleistung (PS)', fuel_type: 'Kraftstoff',
                    engine_hours: 'Betriebsstunden', cabins: 'Kabinen', berths: 'Schlafplätze',
                    bathrooms: 'Badezimmer', max_passengers: 'Max. Passagiere', fresh_water_l: 'Frischwasser (L)',
                    waste_water_l: 'Abwasser (L)', ce_category: 'CE-Kategorie', material: 'Material',
                    location_city: 'Standort Stadt', location_country: 'Standort Land',
                    berth_location: 'Liegeplatz', navigation_equipment: 'Navigationsausstattung',
                    safety_equipment: 'Sicherheitsausstattung', comfort_features: 'Komfort & Extras',
                    video_url: 'Video-URL', description: 'Beschreibung', has_trailer: 'Trailer',
                  };
                  return (
                    <div key={c.id} className="border-l-2 border-amber-300 pl-3">
                      <p className="text-xs text-gray-400 mb-2">
                        {formatDateTime(c.changed_at)}
                        {c.profiles && ` • ${c.profiles.first_name} ${c.profiles.last_name}`}
                        <span className="ml-1 text-amber-600 font-medium">({fields.length} Feld{fields.length !== 1 ? 'er' : ''} geändert)</span>
                      </p>
                      <div className="space-y-1.5">
                        {fields.map(([field, diff]) => (
                          <div key={field} className="text-xs">
                            <span className="font-medium text-gray-700">{FIELD_LABELS[field] || field}:</span>
                            <span className="ml-1 text-red-600 line-through opacity-70">
                              {Array.isArray(diff.old) ? (diff.old as string[]).join(', ') || '–' : String(diff.old ?? '–')}
                            </span>
                            <span className="mx-1 text-gray-400">→</span>
                            <span className="text-green-700">
                              {Array.isArray(diff.new) ? (diff.new as string[]).join(', ') || '–' : String(diff.new ?? '–')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject modal */}
      <Modal
        open={rejectModal}
        onClose={() => setRejectModal(false)}
        title="Inserat ablehnen"
        description="Bitte geben Sie einen Ablehnungsgrund an, der an den Verkäufer gesendet wird."
      >
        <div className="space-y-4">
          <Textarea
            label="Ablehnungsgrund"
            required
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Beschreiben Sie, warum das Inserat abgelehnt wird..."
          />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setRejectModal(false)}>Abbrechen</Button>
            <Button variant="destructive" onClick={handleReject} loading={changeStatus.isPending}>
              Ablehnen & Benachrichtigen
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Inserat löschen"
        description="Sind Sie sicher? Diese Aktion kann nicht rückgängig gemacht werden. Das Inserat und alle zugehörigen Daten werden dauerhaft gelöscht."
      >
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setDeleteModal(false)}>Abbrechen</Button>
          <Button variant="destructive" onClick={handleDelete} loading={deleteListing.isPending}>
            Endgültig löschen
          </Button>
        </div>
      </Modal>

      {/* Checkup contact modal */}
      <Modal
        open={checkupContactModal}
        onClose={() => setCheckupContactModal(false)}
        title="Check-up beim Verkäufer anfragen"
        description="Der Verkäufer erhält eine E-Mail mit der Bitte, einen Check-up Termin zu vereinbaren. Der Status wird auf 'Check-up erforderlich' gesetzt."
      >
        <div className="space-y-4">
          <Textarea
            label="Optionale Nachricht an den Verkäufer"
            rows={4}
            value={checkupMessage}
            onChange={(e) => setCheckupMessage(e.target.value)}
            placeholder="z.B. Bitte melden Sie sich bis Freitag für einen Terminvorschlag..."
          />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setCheckupContactModal(false)}>Abbrechen</Button>
            <Button variant="warning" onClick={handleContactCheckup} loading={sendingCheckup}>
              E-Mail senden & Status setzen
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
