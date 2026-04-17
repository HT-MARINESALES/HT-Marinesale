import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usePublicListing } from '@/hooks/useListings';
import { api } from '@/lib/api';
import { CHECKLIST_CATEGORIES, RATING_LABELS, type ChecklistData } from '@/config/checklistConfig';
import { BOAT_TYPES, FUEL_TYPES, CONDITIONS, CE_CATEGORIES, formatPrice, getImageUrl } from '@/lib/utils';

const DRIVE_TYPE_LABELS: Record<string, string> = {
  z_antrieb: 'Z-Antrieb', wellenantrieb: 'Wellenantrieb', jetantrieb: 'Jetantrieb',
  saildrive: 'Saildrive', aussenborder: 'Außenborder', other: 'Sonstiges',
};

export function PrintListingPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: listing, isLoading } = usePublicListing(slug || '');
  const { data: checklist } = useQuery({
    queryKey: ['public-checklist-print', listing?.id],
    queryFn: () => api.get<any>(`/listings/${listing!.id}/checklist`),
    enabled: !!listing?.id,
  });

  // Track how many images have settled (loaded or errored)
  const settledRef = useRef(0);
  const [printReady, setPrintReady] = useState(false);

  const images = listing?.listing_images ?? [];
  // Only count the images we actually render: 1 main + up to 4 gallery
  const renderedImages = [
    images[0]?.storage_path ? images[0] : null,
    ...images.slice(1, 5).filter((img: any) => img?.storage_path),
  ].filter(Boolean);
  const imageCount = renderedImages.length;

  // Called by every <img> onLoad / onError — fires window.print() once all settled
  const onImageSettle = () => {
    settledRef.current += 1;
    if (settledRef.current >= imageCount) {
      setPrintReady(true);
    }
  };

  // If there are no images, mark ready as soon as listing arrives
  useEffect(() => {
    if (!listing || imageCount > 0) return;
    setPrintReady(true);
  }, [listing, imageCount]);

  // Trigger print after images settle — use rAF to ensure browser has composited
  useEffect(() => {
    if (!printReady) return;
    let t: ReturnType<typeof setTimeout>;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        t = setTimeout(() => window.print(), 800);
      });
    });
    return () => clearTimeout(t);
  }, [printReady]);

  if (isLoading) return (
    <div style={{ fontFamily: 'system-ui,sans-serif', padding: 48, textAlign: 'center', color: '#666' }}>
      Lade Inserat…
    </div>
  );
  if (!listing) return (
    <div style={{ fontFamily: 'system-ui,sans-serif', padding: 48, textAlign: 'center', color: '#666' }}>
      Inserat nicht gefunden.
    </div>
  );

  const listingUrl = `${window.location.origin}/boote/${listing.slug}`;
  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const resolveStatus = (d: ChecklistData[string]) => {
    if (d?.status) return d.status;
    if (d?.checked) return 'ok';
    return undefined;
  };

  const checklistData: ChecklistData = checklist?.data || {};
  const totalItems = CHECKLIST_CATEGORIES.reduce((s, c) => s + c.items.length, 0);
  const okCount = Object.values(checklistData).filter(v => resolveStatus(v) === 'ok').length;
  const faultCount = Object.values(checklistData).filter(v => resolveStatus(v) === 'fault').length;
  const ratingInfo = checklist?.overall_rating ? RATING_LABELS[checklist.overall_rating] : null;

  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 12mm 12mm 14mm 12mm; }
        @media print {
          html, body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .page-break { break-before: page; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
        @media screen {
          body { background: #e5e7eb; }
          .print-page { background: white; max-width: 210mm; margin: 0 auto; box-shadow: 0 4px 24px rgba(0,0,0,.15); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 9.5pt; color: #1a1a2e; line-height: 1.45; }
        h1, h2, h3 { font-weight: 700; }
        table { border-collapse: collapse; width: 100%; }
        td, th { vertical-align: top; }
        img { display: block; max-width: 100%; }
      `}</style>

      {/* Screen-only controls */}
      <div className="no-print" style={{ position: 'fixed', top: 16, right: 16, zIndex: 999, display: 'flex', gap: 10 }}>
        <button
          onClick={() => window.print()}
          style={{ padding: '10px 20px', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.2)' }}
        >
          🖨 Drucken / Als PDF speichern
        </button>
        <button
          onClick={() => window.close()}
          style={{ padding: '10px 16px', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>

      <div className="print-page">
        {/* ═══════════════════════════════════════ PAGE 1 */}
        <div style={{ padding: '12mm 12mm 10mm' }}>

          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #1e3a5f', paddingBottom: 10, marginBottom: 14 }}>
            <img src="/logo.png" alt="HT-Marinesales" style={{ height: 38, objectFit: 'contain' }} />
            <div style={{ textAlign: 'right', fontSize: '8pt', color: '#6b7280', lineHeight: 1.6 }}>
              <div style={{ fontWeight: 700, color: '#1e3a5f', fontSize: '9pt' }}>Fahrzeug-Exposé</div>
              <div>Erstellt: {today}</div>
              <div>info@ht-marinesales.de</div>
            </div>
          </div>

          {/* ── Title + Price ── */}
          <div style={{ marginBottom: 12 }}>
            <h1 style={{ fontSize: '17pt', color: '#1e3a5f', lineHeight: 1.2, marginBottom: 4 }}>{listing.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '8.5pt', color: '#6b7280', marginBottom: 8 }}>
              {listing.boat_type && <span>{BOAT_TYPES[listing.boat_type] || listing.boat_type}</span>}
              {listing.condition && <><span>·</span><span>{CONDITIONS[listing.condition] || listing.condition}</span></>}
              {listing.year && <><span>·</span><span>Bj. {listing.year}</span></>}
              {listing.location_city && <><span>·</span><span>{listing.location_city}{listing.location_country ? `, ${listing.location_country}` : ''}</span></>}
            </div>
            <span style={{ fontSize: '22pt', fontWeight: 900, color: '#1e3a5f' }}>{formatPrice(listing.price)}</span>
          </div>

          {/* ── Main photo + Grunddaten ── */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
            <div style={{ flex: '0 0 60%' }}>
              {images[0]?.storage_path ? (
                <img
                  src={getImageUrl(images[0].storage_path)}
                  alt={listing.title}
                  onLoad={onImageSettle}
                  onError={onImageSettle}
                  style={{ width: '100%', height: 185, objectFit: 'cover', borderRadius: 6 }}
                />
              ) : (
                <div style={{ width: '100%', height: 185, background: '#f3f4f6', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '8pt' }}>Kein Bild</div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', marginBottom: 6 }}>Grunddaten</div>
              <table>
                <tbody>
                  {([
                    ['Marke', listing.brand],
                    ['Modell', listing.model],
                    ['Baujahr', listing.year],
                    ['Bootstyp', BOAT_TYPES[listing.boat_type] || listing.boat_type],
                    ['Zustand', listing.condition ? (CONDITIONS[listing.condition] || listing.condition) : null],
                    ['CE-Kategorie', listing.ce_category ? (CE_CATEGORIES[listing.ce_category] || listing.ce_category) : null],
                    ['Material', listing.material],
                    ['Liegeplatz', listing.berth_location],
                    ['Standort', [listing.location_city, listing.location_country].filter(Boolean).join(', ')],
                  ] as [string, any][]).filter(([, v]) => v).map(([k, v]) => (
                    <tr key={k} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '3px 8px 3px 0', fontWeight: 600, color: '#6b7280', fontSize: '7.5pt', whiteSpace: 'nowrap', width: '40%' }}>{k}</td>
                      <td style={{ padding: '3px 0', color: '#111827', fontSize: '8pt' }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Weitere Bilder ── */}
          {images.length > 1 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
                {images.slice(1, 5).map((img: any, i: number) => img?.storage_path && (
                  <img
                    key={i}
                    src={getImageUrl(img.storage_path)}
                    alt=""
                    onLoad={onImageSettle}
                    onError={onImageSettle}
                    style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 4 }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Technische Daten ── */}
          {(() => {
            const specs = ([
              ['Länge', listing.length_m ? `${listing.length_m} m` : null],
              ['Breite', listing.width_m ? `${listing.width_m} m` : null],
              ['Tiefgang', listing.draft_m ? `${listing.draft_m} m` : null],
              ['Verdrängung', listing.displacement_kg ? `${listing.displacement_kg} kg` : null],
              ['Motor', listing.engine_type],
              ['Anz. Motoren', listing.engine_count ? `${listing.engine_count}×` : null],
              ['Leistung', listing.engine_power_hp ? `${listing.engine_power_hp} PS` : null],
              ['Betriebsstunden', listing.engine_hours ? `${listing.engine_hours} h` : null],
              ['Kraftstoff', listing.fuel_type ? (FUEL_TYPES[listing.fuel_type] || listing.fuel_type) : null],
              ['Treibstofftank', listing.fuel_capacity_l ? `${listing.fuel_capacity_l} L` : null],
              ['Antriebsart', listing.drive_type ? (DRIVE_TYPE_LABELS[listing.drive_type] || listing.drive_type) : null],
              ['Antrieb', listing.drive_description],
              ['Kabinen', listing.cabins],
              ['Schlafplätze', listing.berths],
              ['Badezimmer', listing.bathrooms],
              ['Max. Passagiere', listing.max_passengers],
              ['Frischwasser', listing.fresh_water_l ? `${listing.fresh_water_l} L` : null],
              ['Abwasser', listing.waste_water_l ? `${listing.waste_water_l} L` : null],
            ] as [string, any][]).filter(([, v]) => v);
            if (!specs.length) return null;
            return (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', borderBottom: '1px solid #e5e7eb', paddingBottom: 3, marginBottom: 7 }}>Technische Daten</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                  {specs.map(([k, v]) => (
                    <div key={k} style={{ background: '#f9fafb', borderRadius: 4, padding: '4px 7px' }}>
                      <div style={{ fontSize: '6.5pt', color: '#9ca3af', marginBottom: 1 }}>{k}</div>
                      <div style={{ fontSize: '8pt', fontWeight: 700, color: '#111827' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ── Ausstattung ── */}
          {((listing.navigation_equipment ?? []).length > 0 || (listing.safety_equipment ?? []).length > 0 || (listing.comfort_features ?? []).length > 0) && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', borderBottom: '1px solid #e5e7eb', paddingBottom: 3, marginBottom: 7 }}>Ausstattung & Ausrüstung</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {(listing.navigation_equipment ?? []).length > 0 && (
                  <div>
                    <div style={{ fontSize: '7.5pt', fontWeight: 700, color: '#374151', marginBottom: 2 }}>Navigation</div>
                    <div style={{ fontSize: '7.5pt', color: '#4b5563', lineHeight: 1.6 }}>{(listing.navigation_equipment ?? []).join(' · ')}</div>
                  </div>
                )}
                {(listing.safety_equipment ?? []).length > 0 && (
                  <div>
                    <div style={{ fontSize: '7.5pt', fontWeight: 700, color: '#374151', marginBottom: 2 }}>Sicherheit</div>
                    <div style={{ fontSize: '7.5pt', color: '#4b5563', lineHeight: 1.6 }}>{(listing.safety_equipment ?? []).join(' · ')}</div>
                  </div>
                )}
                {(listing.comfort_features ?? []).length > 0 && (
                  <div>
                    <div style={{ fontSize: '7.5pt', fontWeight: 700, color: '#374151', marginBottom: 2 }}>Komfort & Extras</div>
                    <div style={{ fontSize: '7.5pt', color: '#4b5563', lineHeight: 1.6 }}>{(listing.comfort_features ?? []).join(' · ')}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Beschreibung ── */}
          {listing.description && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', borderBottom: '1px solid #e5e7eb', paddingBottom: 3, marginBottom: 7 }}>Fahrzeugbeschreibung</div>
              <p style={{ fontSize: '8pt', color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{listing.description}</p>
            </div>
          )}

          {/* ── Trailer ── */}
          {listing.has_trailer && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', borderBottom: '1px solid #e5e7eb', paddingBottom: 3, marginBottom: 7 }}>
                Trailer <span style={{ fontWeight: 400 }}>(im Preis inbegriffen)</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                {([
                  ['Baujahr', listing.trailer_year],
                  ['Material', listing.trailer_material === 'steel' ? 'Stahl' : listing.trailer_material === 'aluminum' ? 'Aluminium' : listing.trailer_material],
                  ['Gesamtgewicht', listing.trailer_total_weight_kg ? `${listing.trailer_total_weight_kg} kg` : null],
                  ['Reifenalter', listing.trailer_tire_age ? `${listing.trailer_tire_age} Jahre` : null],
                  ['TÜV', listing.trailer_tuev ? (listing.trailer_tuev_until ? `bis ${listing.trailer_tuev_until}` : 'vorhanden') : null],
                ] as [string, any][]).filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} style={{ background: '#f9fafb', borderRadius: 4, padding: '4px 7px' }}>
                    <div style={{ fontSize: '6.5pt', color: '#9ca3af', marginBottom: 1 }}>{k}</div>
                    <div style={{ fontSize: '8pt', fontWeight: 700, color: '#111827' }}>{v}</div>
                  </div>
                ))}
              </div>
              {listing.trailer_description && (
                <p style={{ fontSize: '8pt', color: '#4b5563', marginTop: 5 }}>{listing.trailer_description}</p>
              )}
            </div>
          )}

          {/* ── Footer Seite 1 ── */}
          <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
            <div style={{ fontSize: '8pt', color: '#1e3a5f', fontWeight: 600 }}>{listingUrl}</div>
          </div>

        </div>{/* end page 1 */}

        {/* ═══════════════════════════════════════ PAGE 2: Checklist */}
        {checklist && (
          <div className="page-break" style={{ padding: '12mm 12mm 10mm', borderTop: '3px solid #1e3a5f' }}>

            {/* Checklist header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1e3a5f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'white', fontSize: '16pt', lineHeight: 1 }}>✓</span>
                </div>
                <div>
                  <h2 style={{ fontSize: '14pt', color: '#1e3a5f', fontWeight: 900 }}>HT-Marinesales Prüfprotokoll</h2>
                  <div style={{ fontSize: '8pt', color: '#6b7280' }}>Professionelle Bootsinspektion · {today}</div>
                </div>
              </div>
              {checklist.overall_rating && ratingInfo && (
                <div style={{ textAlign: 'center', padding: '8px 16px', borderRadius: 10, border: '2px solid #1e3a5f', background: '#f0f4ff' }}>
                  <div style={{ fontSize: '22pt', fontWeight: 900, color: '#1e3a5f', lineHeight: 1 }}>{checklist.overall_rating}</div>
                  <div style={{ fontSize: '7pt', fontWeight: 700, color: '#1e3a5f' }}>von 5</div>
                  <div style={{ fontSize: '8pt', color: '#374151', marginTop: 2 }}>{ratingInfo.label}</div>
                </div>
              )}
            </div>

            {/* Summary bar */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, padding: '8px 12px', background: '#f9fafb', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '8.5pt' }}>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ {okCount}</span>
                <span style={{ color: '#6b7280' }}>In Ordnung</span>
              </div>
              <div style={{ width: 1, background: '#e5e7eb' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '8.5pt' }}>
                <span style={{ color: '#dc2626', fontWeight: 700 }}>✗ {faultCount}</span>
                <span style={{ color: '#6b7280' }}>Mängel</span>
              </div>
              <div style={{ width: 1, background: '#e5e7eb' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '8.5pt' }}>
                <span style={{ color: '#9ca3af', fontWeight: 700 }}>○ {totalItems - okCount - faultCount}</span>
                <span style={{ color: '#6b7280' }}>Nicht geprüft</span>
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ fontSize: '8pt', color: '#6b7280' }}>{okCount + faultCount} von {totalItems} Punkten geprüft</div>
            </div>

            {/* Categories grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {CHECKLIST_CATEGORIES.map(cat => {
                const catOk = cat.items.filter(i => resolveStatus(checklistData[i.id]) === 'ok').length;
                const catFault = cat.items.filter(i => resolveStatus(checklistData[i.id]) === 'fault').length;
                const catDone = catOk + catFault;
                return (
                  <div key={cat.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: catFault > 0 ? '#fef2f2' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <span style={{ fontSize: '8pt', fontWeight: 700, color: catFault > 0 ? '#991b1b' : '#111827' }}>{cat.title}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {catFault > 0 && (
                          <span style={{ fontSize: '7pt', fontWeight: 700, padding: '1px 5px', background: '#fee2e2', color: '#b91c1c', borderRadius: 99 }}>{catFault} Mangel</span>
                        )}
                        <span style={{ fontSize: '7pt', fontWeight: 600, padding: '1px 5px', background: catDone === cat.items.length ? '#dcfce7' : '#f3f4f6', color: catDone === cat.items.length ? '#166534' : '#6b7280', borderRadius: 99 }}>
                          {catDone}/{cat.items.length}
                        </span>
                      </div>
                    </div>
                    <div style={{ padding: '4px 0' }}>
                      {cat.items.map(item => {
                        const d = checklistData[item.id];
                        const status = resolveStatus(d);
                        if (!status) {
                          return (
                            <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '2px 10px', opacity: 0.4 }}>
                              <span style={{ fontSize: '9pt', color: '#9ca3af', flexShrink: 0, lineHeight: 1.4 }}>○</span>
                              <span style={{ fontSize: '7.5pt', color: '#6b7280', lineHeight: 1.4 }}>{item.label}</span>
                            </div>
                          );
                        }
                        const isOk = status === 'ok';
                        const isFault = status === 'fault';
                        const rd = d as Record<string, string>;
                        const faultRemark = rd['fault_remark'];
                        const remarkField = item.fields.find(f => f.alwaysShow && rd[f.key]);
                        const comment = faultRemark || (remarkField ? rd[remarkField.key] : null);
                        const cylValues = item.cylGrid
                          ? item.fields.filter(f => rd[f.key]).map(f => `${f.label.replace(' (bar)', '')}: ${rd[f.key]}`).join('  ')
                          : null;
                        return (
                          <div key={item.id} style={{ padding: '2px 10px', background: isFault ? '#fff7f7' : 'transparent', borderBottom: '1px solid #f9fafb' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                              <span style={{ fontSize: '9pt', color: isOk ? '#16a34a' : '#dc2626', flexShrink: 0, lineHeight: 1.4, fontWeight: 700 }}>
                                {isOk ? '✓' : '✗'}
                              </span>
                              <div style={{ flex: 1 }}>
                                <span style={{ fontSize: '7.5pt', color: isFault ? '#111827' : '#374151', fontWeight: isFault ? 700 : 400, lineHeight: 1.4 }}>{item.label}</span>
                                {cylValues && (
                                  <div style={{ fontSize: '7pt', color: '#6b7280', marginTop: 1 }}>{cylValues}</div>
                                )}
                                {comment && (
                                  <div style={{ fontSize: '7pt', color: isFault ? '#b91c1c' : '#6b7280', fontStyle: 'italic', marginTop: 1 }}>
                                    {isFault ? '→ ' : ''}{comment}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Seite 2 */}
            <div style={{ marginTop: 16, paddingTop: 10, borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
              <div style={{ fontSize: '8pt', color: '#1e3a5f', fontWeight: 600 }}>{listingUrl}</div>
            </div>

          </div>
        )}

      </div>{/* end print-page */}
    </>
  );
}
