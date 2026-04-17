import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAdminListing } from '@/hooks/useListings';
import { api } from '@/lib/api';
import { CHECKLIST_CATEGORIES, RATING_LABELS, type ChecklistData } from '@/config/checklistConfig';
import { BOAT_TYPES, FUEL_TYPES, CONDITIONS, CE_CATEGORIES, formatPrice, getImageUrl, getProvisionInfo } from '@/lib/utils';

const DRIVE_TYPE_LABELS: Record<string, string> = {
  z_antrieb: 'Z-Antrieb', wellenantrieb: 'Wellenantrieb', jetantrieb: 'Jetantrieb',
  saildrive: 'Saildrive', aussenborder: 'Außenborder', other: 'Sonstiges',
};

function resolveStatus(d: ChecklistData[string]) {
  if (d?.status) return d.status;
  if (d?.checked) return 'ok';
  return undefined;
}

function isChecklistEmpty(checklist: any): boolean {
  if (!checklist?.data) return true;
  return !Object.values(checklist.data as ChecklistData).some(d => resolveStatus(d));
}

// ─── Paper checklist (empty — to fill on paper) ────────────────────────────

function PaperChecklist({ listing, adminUrl }: { listing: any; adminUrl: string }) {
  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(adminUrl)}&color=1e3a5f&bgcolor=ffffff`;
  const { rate, amount } = getProvisionInfo(listing.price);

  return (
    <div style={{ padding: '12mm 12mm 10mm', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '3px solid #1e3a5f', paddingBottom: 10, marginBottom: 14 }}>
        <img src="/logo.png" alt="HT-Marineservice" style={{ height: 38, objectFit: 'contain' }} />
        <div style={{ flex: 1, padding: '0 16px' }}>
          <h1 style={{ fontSize: '15pt', fontWeight: 900, color: '#1e3a5f', lineHeight: 1.2, marginBottom: 3 }}>Prüfprotokoll</h1>
          <div style={{ fontSize: '10pt', fontWeight: 700, color: '#111827' }}>{listing.title}</div>
          <div style={{ fontSize: '8pt', color: '#6b7280', marginTop: 2 }}>
            {listing.brand} {listing.model} · Bj. {listing.year}
            {listing.location_city ? ` · ${listing.location_city}` : ''}
            {' · '}Preis: {formatPrice(listing.price)} · Provision {rate.toString().replace('.', ',')}% = {formatPrice(amount)}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right', fontSize: '8pt', color: '#374151', lineHeight: 2 }}>
            <div>Datum: <span style={{ display: 'inline-block', borderBottom: '1px solid #6b7280', minWidth: 80 }}>&nbsp;</span></div>
            <div>Prüfer: <span style={{ display: 'inline-block', borderBottom: '1px solid #6b7280', minWidth: 80 }}>&nbsp;</span></div>
            <div style={{ color: '#9ca3af', fontSize: '7pt' }}>Erstellt: {today}</div>
          </div>
          <img src={qrUrl} alt="QR Admin" style={{ width: 56, height: 56, display: 'block' }} />
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 24, padding: '6px 12px', background: '#f0f4ff', border: '1px solid #c7d2fe', borderRadius: 6, marginBottom: 14, fontSize: '8pt' }}>
        <span><strong style={{ color: '#16a34a' }}>✓ OK</strong> = In Ordnung</span>
        <span><strong style={{ color: '#dc2626' }}>✗ M</strong> = Mangel (Bemerkung ausfüllen)</span>
        <span><strong style={{ color: '#6b7280' }}>– N/A</strong> = Nicht geprüft / nicht zutreffend</span>
      </div>

      {/* Category tables — each category starts a new block, rows never break mid-item */}
      {CHECKLIST_CATEGORIES.map((cat, catIdx) => (
        <div key={cat.id} style={{ marginBottom: 16, breakBefore: catIdx > 0 ? 'auto' : 'avoid' }}>
          {/* Category header sticks with first row */}
          <div style={{ background: '#1e3a5f', color: 'white', padding: '6px 10px', fontSize: '9pt', fontWeight: 700, borderRadius: '4px 4px 0 0', breakAfter: 'avoid' }}>
            {catIdx + 1}. {cat.title}
            {cat.badge && <span style={{ marginLeft: 8, fontSize: '7pt', background: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: 99 }}>{cat.badge}</span>}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
            <thead>
              <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #d1d5db' }}>
                <th style={{ textAlign: 'left', padding: '5px 10px', fontWeight: 600, color: '#374151', width: '38%' }}>Prüfpunkt</th>
                <th style={{ textAlign: 'center', width: 42, padding: '5px 4px', fontWeight: 700, color: '#16a34a' }}>✓ OK</th>
                <th style={{ textAlign: 'center', width: 50, padding: '5px 4px', fontWeight: 700, color: '#dc2626' }}>✗ Mangel</th>
                <th style={{ textAlign: 'center', width: 42, padding: '5px 4px', fontWeight: 700, color: '#9ca3af' }}>– N/A</th>
                <th style={{ textAlign: 'left', padding: '5px 10px', fontWeight: 600, color: '#374151' }}>Bemerkung / Messwert</th>
              </tr>
            </thead>
            <tbody>
              {cat.items.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #d1d5db', background: idx % 2 === 0 ? 'white' : '#f9fafb', breakInside: 'avoid' }}>
                  <td style={{ padding: '9px 10px', lineHeight: 1.4, color: '#111827', fontSize: '8pt', verticalAlign: 'middle' }}>{item.label}</td>
                  {/* OK */}
                  <td style={{ textAlign: 'center', padding: '9px 4px', verticalAlign: 'middle' }}>
                    <div style={{ width: 18, height: 18, border: '2px solid #16a34a', borderRadius: 3, margin: '0 auto' }} />
                  </td>
                  {/* Mangel */}
                  <td style={{ textAlign: 'center', padding: '9px 4px', verticalAlign: 'middle' }}>
                    <div style={{ width: 18, height: 18, border: '2px solid #dc2626', borderRadius: 3, margin: '0 auto' }} />
                  </td>
                  {/* N/A */}
                  <td style={{ textAlign: 'center', padding: '9px 4px', verticalAlign: 'middle' }}>
                    <div style={{ width: 18, height: 18, border: '2px solid #9ca3af', borderRadius: 3, margin: '0 auto' }} />
                  </td>
                  {/* Remark / cylinder grid */}
                  <td style={{ padding: '9px 10px', verticalAlign: 'middle' }}>
                    {item.cylGrid ? (
                      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(item.fields.length, 4)}, 1fr)`, gap: 6 }}>
                        {item.fields.map(f => (
                          <div key={f.key}>
                            <div style={{ fontSize: '7pt', color: '#6b7280', marginBottom: 2 }}>{f.label.replace(' (bar)', '')}</div>
                            <div style={{ borderBottom: '1.5px solid #9ca3af', height: 22 }} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Two writing lines for notes */
                      <div>
                        <div style={{ borderBottom: '1px solid #d1d5db', height: 16, width: '100%' }} />
                        <div style={{ borderBottom: '1px solid #d1d5db', height: 16, width: '100%', marginTop: 4 }} />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Overall rating */}
      <div style={{ border: '2px solid #1e3a5f', borderRadius: 8, padding: 12, marginTop: 14, breakInside: 'avoid' }}>
        <div style={{ fontSize: '9.5pt', fontWeight: 700, color: '#1e3a5f', marginBottom: 10 }}>Gesamtbewertung</div>
        <div style={{ display: 'flex', gap: 20, marginBottom: 10 }}>
          {[
            [1, 'sehr gut'], [2, 'gut'], [3, 'befriedigend'], [4, 'ausreichend'], [5, 'mangelhaft'],
          ].map(([n, label]) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 22, height: 22, border: '2px solid #1e3a5f', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11pt', fontWeight: 900, color: '#1e3a5f' }}>
                {n}
              </div>
              <span style={{ fontSize: '7.5pt', color: '#6b7280' }}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: '8pt' }}>
          <div style={{ flex: 1 }}>
            Anmerkungen:{' '}
            <span style={{ display: 'inline-block', borderBottom: '1px solid #9ca3af', width: '70%' }}>&nbsp;</span>
          </div>
          <div>
            Unterschrift: <span style={{ display: 'inline-block', borderBottom: '1px solid #9ca3af', minWidth: 120 }}>&nbsp;</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: '7pt', color: '#9ca3af' }}>
        HT-Marineservice · Professionelle Bootsinspektion & -vermittlung · info@marine-service-sales.de
      </div>
    </div>
  );
}

// ─── Filled PDF (standard layout with admin QR code) ───────────────────────

function FilledPDF({ listing, checklist, adminUrl }: { listing: any; checklist: any; adminUrl: string }) {
  const settledRef = useRef(0);
  const [printReady, setPrintReady] = useState(false);
  const images = listing.listing_images ?? [];
  const renderedImages = [
    images[0]?.storage_path ? images[0] : null,
    ...images.slice(1, 5).filter((img: any) => img?.storage_path),
  ].filter(Boolean);
  const imageCount = renderedImages.length;

  const onImageSettle = () => {
    settledRef.current += 1;
    if (settledRef.current >= imageCount) setPrintReady(true);
  };

  useEffect(() => {
    if (imageCount === 0) setPrintReady(true);
  }, [imageCount]);

  useEffect(() => {
    if (!printReady) return;
    let t: ReturnType<typeof setTimeout>;
    requestAnimationFrame(() => { requestAnimationFrame(() => { t = setTimeout(() => window.print(), 800); }); });
    return () => clearTimeout(t);
  }, [printReady]);

  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(adminUrl)}&color=1e3a5f&bgcolor=ffffff`;
  const { rate, amount } = getProvisionInfo(listing.price);
  const checklistData: ChecklistData = checklist?.data || {};
  const totalItems = CHECKLIST_CATEGORIES.reduce((s, c) => s + c.items.length, 0);
  const okCount = Object.values(checklistData).filter(v => resolveStatus(v) === 'ok').length;
  const faultCount = Object.values(checklistData).filter(v => resolveStatus(v) === 'fault').length;
  const ratingInfo = checklist?.overall_rating ? RATING_LABELS[checklist.overall_rating] : null;

  return (
    <div className="print-page">
      {/* PAGE 1: Listing */}
      <div style={{ padding: '12mm 12mm 10mm' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #1e3a5f', paddingBottom: 10, marginBottom: 14 }}>
          <img src="/logo.png" alt="HT-Marineservice" style={{ height: 38, objectFit: 'contain' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right', fontSize: '8pt', color: '#6b7280', lineHeight: 1.6 }}>
              <div style={{ fontWeight: 700, color: '#1e3a5f', fontSize: '9pt' }}>Admin-Exposé</div>
              <div>Erstellt: {today}</div>
              <div>info@marine-service-sales.de</div>
            </div>
            <img src={qrUrl} alt="QR Admin" style={{ width: 52, height: 52, display: 'block' }} />
          </div>
        </div>

        {/* Title + Price + Provision */}
        <div style={{ marginBottom: 12 }}>
          <h1 style={{ fontSize: '17pt', color: '#1e3a5f', lineHeight: 1.2, marginBottom: 4 }}>{listing.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '8.5pt', color: '#6b7280', marginBottom: 8 }}>
            {listing.boat_type && <span>{BOAT_TYPES[listing.boat_type] || listing.boat_type}</span>}
            {listing.condition && <><span>·</span><span>{CONDITIONS[listing.condition] || listing.condition}</span></>}
            {listing.year && <><span>·</span><span>Bj. {listing.year}</span></>}
            {listing.location_city && <><span>·</span><span>{listing.location_city}</span></>}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontSize: '22pt', fontWeight: 900, color: '#1e3a5f' }}>{formatPrice(listing.price)}</span>
            <span style={{ fontSize: '9pt', color: '#6b7280', background: '#f0f4ff', padding: '2px 8px', borderRadius: 4, border: '1px solid #c7d2fe' }}>
              Provision {rate.toString().replace('.', ',')} % = {formatPrice(amount)}
            </span>
          </div>
        </div>

        {/* Main photo + Grunddaten */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
          <div style={{ flex: '0 0 60%' }}>
            {images[0]?.storage_path ? (
              <img src={getImageUrl(images[0].storage_path)} alt={listing.title} onLoad={onImageSettle} onError={onImageSettle} style={{ width: '100%', height: 185, objectFit: 'cover', borderRadius: 6 }} />
            ) : (
              <div style={{ width: '100%', height: 185, background: '#f3f4f6', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '8pt' }}>Kein Bild</div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', marginBottom: 6 }}>Grunddaten</div>
            <table>
              <tbody>
                {([
                  ['Marke', listing.brand], ['Modell', listing.model], ['Baujahr', listing.year],
                  ['Bootstyp', BOAT_TYPES[listing.boat_type] || listing.boat_type],
                  ['Zustand', listing.condition ? (CONDITIONS[listing.condition] || listing.condition) : null],
                  ['CE-Kategorie', listing.ce_category ? (CE_CATEGORIES[listing.ce_category] || listing.ce_category) : null],
                  ['Material', listing.material],
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

        {/* Gallery */}
        {images.length > 1 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
              {images.slice(1, 5).map((img: any, i: number) => img?.storage_path && (
                <img key={i} src={getImageUrl(img.storage_path)} alt="" onLoad={onImageSettle} onError={onImageSettle} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 4 }} />
              ))}
            </div>
          </div>
        )}

        {/* Technische Daten */}
        {(() => {
          const specs = ([
            ['Länge', listing.length_m ? `${listing.length_m} m` : null],
            ['Breite', listing.width_m ? `${listing.width_m} m` : null],
            ['Tiefgang', listing.draft_m ? `${listing.draft_m} m` : null],
            ['Verdrängung', listing.displacement_kg ? `${listing.displacement_kg} kg` : null],
            ['Motor', listing.engine_type],
            ['Leistung', listing.engine_power_hp ? `${listing.engine_power_hp} PS` : null],
            ['Betriebsstd.', listing.engine_hours ? `${listing.engine_hours} h` : null],
            ['Kraftstoff', listing.fuel_type ? (FUEL_TYPES[listing.fuel_type] || listing.fuel_type) : null],
            ['Antrieb', listing.drive_type ? (DRIVE_TYPE_LABELS[listing.drive_type] || listing.drive_type) : null],
            ['Kabinen', listing.cabins], ['Schlafplätze', listing.berths], ['Passagiere', listing.max_passengers],
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

        {/* Description */}
        {listing.description && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', borderBottom: '1px solid #e5e7eb', paddingBottom: 3, marginBottom: 7 }}>Fahrzeugbeschreibung</div>
            <p style={{ fontSize: '8pt', color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{listing.description}</p>
          </div>
        )}

        {/* Footer page 1 */}
        <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
          <div style={{ fontSize: '8pt', color: '#1e3a5f', fontWeight: 600 }}>{adminUrl}</div>
        </div>
      </div>

      {/* PAGE 2: Filled checklist */}
      <div className="page-break" style={{ padding: '12mm 12mm 10mm', borderTop: '3px solid #1e3a5f' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1e3a5f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: '16pt', lineHeight: 1 }}>✓</span>
            </div>
            <div>
              <h2 style={{ fontSize: '14pt', color: '#1e3a5f', fontWeight: 900 }}>HT-Marineservice Prüfprotokoll</h2>
              <div style={{ fontSize: '8pt', color: '#6b7280' }}>Professionelle Bootsinspektion · {today}</div>
            </div>
          </div>
          {checklist?.overall_rating && ratingInfo && (
            <div style={{ textAlign: 'center', padding: '8px 16px', borderRadius: 10, border: '2px solid #1e3a5f', background: '#f0f4ff' }}>
              <div style={{ fontSize: '22pt', fontWeight: 900, color: '#1e3a5f', lineHeight: 1 }}>{checklist.overall_rating}</div>
              <div style={{ fontSize: '7pt', fontWeight: 700, color: '#1e3a5f' }}>von 5</div>
              <div style={{ fontSize: '8pt', color: '#374151', marginTop: 2 }}>{ratingInfo.label}</div>
            </div>
          )}
        </div>

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
                    {catFault > 0 && <span style={{ fontSize: '7pt', fontWeight: 700, padding: '1px 5px', background: '#fee2e2', color: '#b91c1c', borderRadius: 99 }}>{catFault} Mangel</span>}
                    <span style={{ fontSize: '7pt', fontWeight: 600, padding: '1px 5px', background: catDone === cat.items.length ? '#dcfce7' : '#f3f4f6', color: catDone === cat.items.length ? '#166534' : '#6b7280', borderRadius: 99 }}>
                      {catDone}/{cat.items.length}
                    </span>
                  </div>
                </div>
                <div style={{ padding: '4px 0' }}>
                  {cat.items.map(item => {
                    const d = checklistData[item.id];
                    const status = resolveStatus(d);
                    if (!status) return (
                      <div key={item.id} style={{ display: 'flex', gap: 6, padding: '2px 10px', opacity: 0.4 }}>
                        <span style={{ fontSize: '9pt', color: '#9ca3af', flexShrink: 0, lineHeight: 1.4 }}>○</span>
                        <span style={{ fontSize: '7.5pt', color: '#6b7280', lineHeight: 1.4 }}>{item.label}</span>
                      </div>
                    );
                    const isOk = status === 'ok';
                    const isFault = status === 'fault';
                    const rd = d as Record<string, string>;
                    const comment = rd['fault_remark'] || (item.fields.find(f => f.alwaysShow && rd[f.key]) ? rd[item.fields.find(f => f.alwaysShow && rd[f.key])!.key] : null);
                    const cylValues = item.cylGrid ? item.fields.filter(f => rd[f.key]).map(f => `${f.label.replace(' (bar)', '')}: ${rd[f.key]}`).join('  ') : null;
                    return (
                      <div key={item.id} style={{ padding: '2px 10px', background: isFault ? '#fff7f7' : 'transparent', borderBottom: '1px solid #f9fafb' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span style={{ fontSize: '9pt', color: isOk ? '#16a34a' : '#dc2626', flexShrink: 0, lineHeight: 1.4, fontWeight: 700 }}>{isOk ? '✓' : '✗'}</span>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: '7.5pt', color: isFault ? '#111827' : '#374151', fontWeight: isFault ? 700 : 400, lineHeight: 1.4 }}>{item.label}</span>
                            {cylValues && <div style={{ fontSize: '7pt', color: '#6b7280', marginTop: 1 }}>{cylValues}</div>}
                            {comment && <div style={{ fontSize: '7pt', color: isFault ? '#b91c1c' : '#6b7280', fontStyle: 'italic', marginTop: 1 }}>{isFault ? '→ ' : ''}{comment}</div>}
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

        <div style={{ marginTop: 16, paddingTop: 10, borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
          <div style={{ fontSize: '8pt', color: '#1e3a5f', fontWeight: 600 }}>{adminUrl}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function AdminPrintPage() {
  const { id } = useParams<{ id: string }>();
  const { data: listing, isLoading } = useAdminListing(id || '');
  const { data: checklist, isLoading: checklistLoading } = useQuery({
    queryKey: ['admin-checklist-print', id],
    queryFn: () => api.get<any>(`/listings/${id}/checklist`),
    enabled: !!id,
  });

  const adminUrl = `${window.location.origin}/admin/inserate/${id}`;
  const empty = isChecklistEmpty(checklist);

  // For paper checklist (empty), auto-trigger print after a brief settle
  const [paperPrintReady, setPaperPrintReady] = useState(false);
  useEffect(() => {
    if (isLoading || checklistLoading || !listing) return;
    if (!empty) return; // FilledPDF handles its own print trigger
    const t = setTimeout(() => setPaperPrintReady(true), 800);
    return () => clearTimeout(t);
  }, [isLoading, checklistLoading, listing, empty]);

  useEffect(() => {
    if (!paperPrintReady) return;
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [paperPrintReady]);

  if (isLoading || checklistLoading) return (
    <div style={{ fontFamily: 'system-ui,sans-serif', padding: 48, textAlign: 'center', color: '#666' }}>Lade Inserat…</div>
  );
  if (!listing) return (
    <div style={{ fontFamily: 'system-ui,sans-serif', padding: 48, textAlign: 'center', color: '#666' }}>Inserat nicht gefunden.</div>
  );

  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 0; }
        @media print {
          html, body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .page-break { break-before: page; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
        @media screen {
          body { background: #e5e7eb; }
          .print-page { background: white; max-width: 210mm; margin: 0 auto; box-shadow: 0 4px 24px rgba(0,0,0,.15); }
          .print-paper { background: white; max-width: 210mm; margin: 0 auto; box-shadow: 0 4px 24px rgba(0,0,0,.15); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 9.5pt; color: #1a1a2e; line-height: 1.45; }
        h1, h2, h3 { font-weight: 700; }
        table { border-collapse: collapse; width: 100%; }
        td, th { vertical-align: top; }
        img { display: block; max-width: 100%; }
      `}</style>

      <div className="no-print" style={{ position: 'fixed', top: 16, right: 16, zIndex: 999, display: 'flex', gap: 10 }}>
        <button onClick={() => window.print()} style={{ padding: '10px 20px', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.2)' }}>
          🖨 Drucken / Als PDF speichern
        </button>
        <button onClick={() => window.close()} style={{ padding: '10px 16px', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>✕</button>
      </div>

      {empty ? (
        <div className="print-paper">
          <PaperChecklist listing={listing} adminUrl={adminUrl} />
        </div>
      ) : (
        <FilledPDF listing={listing} checklist={checklist} adminUrl={adminUrl} />
      )}
    </>
  );
}
