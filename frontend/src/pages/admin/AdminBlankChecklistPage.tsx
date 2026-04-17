import { CHECKLIST_CATEGORIES } from '@/config/checklistConfig';

const PRINT_STYLES = `
  @page { size: A4 portrait; margin: 12mm 14mm; }
  @media print {
    .no-print { display: none !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  @media screen {
    body { background: #e5e7eb; }
  }
`;

export function AdminBlankChecklistPage() {
  return (
    <>
      <style>{PRINT_STYLES}</style>

      {/* Screen-only toolbar */}
      <div className="no-print fixed top-0 left-0 right-0 z-50 bg-navy-900 text-white px-6 py-3 flex items-center justify-between shadow-lg">
        <span className="text-sm font-medium">Blanko-Prüfprotokoll — Druckvorschau</span>
        <div className="flex gap-3">
          <button
            onClick={() => window.history.back()}
            className="px-4 py-1.5 text-sm border border-white/30 rounded-lg hover:bg-white/10 transition-colors"
          >
            ← Zurück
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-1.5 text-sm bg-white text-navy-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            🖨 Drucken / Als PDF speichern
          </button>
        </div>
      </div>

      {/* A4 sheet */}
      <div
        className="no-print-bg"
        style={{
          paddingTop: 60, // toolbar height
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '100vh',
          background: '#e5e7eb',
        }}
      >
        <ChecklistSheet />
      </div>
    </>
  );
}

function ChecklistSheet() {
  return (
    <div
      style={{
        width: '210mm',
        minHeight: '297mm',
        background: 'white',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        fontSize: '8.5pt',
        color: '#111827',
        padding: '14mm 14mm 12mm',
        boxSizing: 'border-box',
        // screen only shadow
        boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
        marginBottom: 40,
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: '3px solid #1e3a5f', paddingBottom: 12, marginBottom: 12, gap: 16 }}>
        {/* Logo */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="HT-Marinesales" style={{ height: 44, objectFit: 'contain', display: 'block' }} />
        </div>

        {/* Title */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: '3px solid #1e3a5f', paddingLeft: 14 }}>
          <div style={{ fontSize: '16pt', fontWeight: 900, color: '#1e3a5f', letterSpacing: '-0.3px', lineHeight: 1.1 }}>Prüfprotokoll</div>
          <div style={{ fontSize: '8.5pt', color: '#6b7280', marginTop: 3 }}>HT-Marinesales · Professionelle Bootsinspektion</div>
        </div>

        {/* Info fields — right side */}
        <div style={{ flexShrink: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', alignContent: 'center' }}>
          {[
            { label: 'Datum', wide: false },
            { label: 'Prüfer', wide: false },
            { label: 'Boot (Marke / Modell / Bj.)', wide: true },
            { label: 'Kundenname', wide: true },
          ].map(({ label, wide }) => (
            <div key={label} style={wide ? { gridColumn: '1 / -1' } : {}}>
              <div style={{ fontSize: '7pt', color: '#6b7280', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</div>
              <div style={{ borderBottom: '1.5px solid #374151', minWidth: wide ? 220 : 100, height: 20 }} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Legend ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 28, padding: '5px 14px',
        background: '#f0f4ff', border: '1px solid #c7d2fe',
        borderRadius: 5, marginBottom: 12, fontSize: '7.5pt', alignItems: 'center',
      }}>
        <LegendItem color="#16a34a" symbol="✓" text="OK — In Ordnung" />
        <LegendItem color="#dc2626" symbol="✗" text="Mangel (Bemerkung ausfüllen)" />
        <LegendItem color="#9ca3af" symbol="–" text="N/A — nicht zutreffend / nicht geprüft" />
        <div style={{ marginLeft: 'auto', fontSize: '7pt', color: '#9ca3af' }}>Blanko-Vorlage</div>
      </div>

      {/* ── Checklist categories ────────────────────────────────────────── */}
      {CHECKLIST_CATEGORIES.map((cat, catIdx) => (
        <div key={cat.id} style={{ marginBottom: 14 }}>
          {/* Category header — break-after: avoid keeps it with first row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#1e3a5f', color: 'white',
            padding: '6px 10px', borderRadius: '5px 5px 0 0',
            breakAfter: 'avoid',
          }}>
            <span style={{ fontSize: '9pt', fontWeight: 800 }}>
              {catIdx + 1}. {cat.title}
            </span>
            {cat.badge && (
              <span style={{
                fontSize: '7pt', background: 'rgba(255,255,255,0.18)',
                padding: '1px 7px', borderRadius: 99, fontWeight: 600,
              }}>
                {cat.badge}
              </span>
            )}
          </div>

          {/* Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
            <colgroup>
              <col style={{ width: '36%' }} />
              <col style={{ width: 38 }} />
              <col style={{ width: 46 }} />
              <col style={{ width: 38 }} />
              <col /> {/* notes — takes remaining space */}
            </colgroup>
            <thead>
              <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #d1d5db' }}>
                <th style={{ textAlign: 'left', padding: '5px 10px', fontWeight: 700, color: '#374151' }}>Prüfpunkt</th>
                <th style={{ textAlign: 'center', padding: '5px 3px', fontWeight: 800, color: '#16a34a' }}>✓ OK</th>
                <th style={{ textAlign: 'center', padding: '5px 3px', fontWeight: 800, color: '#dc2626' }}>✗ Mangel</th>
                <th style={{ textAlign: 'center', padding: '5px 3px', fontWeight: 700, color: '#9ca3af' }}>N/A</th>
                <th style={{ textAlign: 'left', padding: '5px 10px', fontWeight: 700, color: '#374151' }}>Bemerkungen / Messwerte</th>
              </tr>
            </thead>
            <tbody>
              {cat.items.map((item, idx) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: '1px solid #e5e7eb',
                    background: idx % 2 === 0 ? 'white' : '#f9fafb',
                    breakInside: 'avoid',
                  }}
                >
                  {/* Label */}
                  <td style={{ padding: '8px 10px', lineHeight: 1.45, color: '#111827', verticalAlign: 'top' }}>
                    {item.label}
                  </td>

                  {/* OK checkbox */}
                  <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '8px 3px' }}>
                    <div style={{
                      width: 19, height: 19, border: '2px solid #16a34a',
                      borderRadius: 3, margin: '0 auto',
                    }} />
                  </td>

                  {/* Mangel checkbox */}
                  <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '8px 3px' }}>
                    <div style={{
                      width: 19, height: 19, border: '2px solid #dc2626',
                      borderRadius: 3, margin: '0 auto',
                    }} />
                  </td>

                  {/* N/A checkbox */}
                  <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '8px 3px' }}>
                    <div style={{
                      width: 19, height: 19, border: '2px solid #d1d5db',
                      borderRadius: 3, margin: '0 auto',
                    }} />
                  </td>

                  {/* Notes */}
                  <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                    {item.cylGrid ? (
                      /* Cylinder grid for compression test */
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px 10px' }}>
                        {item.fields.map(f => (
                          <div key={f.key}>
                            <div style={{ fontSize: '6.5pt', color: '#6b7280', marginBottom: 2 }}>
                              {f.label.replace(' (bar)', '')}
                            </div>
                            <div style={{ borderBottom: '1.5px solid #9ca3af', height: 18 }} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Three writing lines */
                      <div>
                        <div style={{ borderBottom: '1px solid #d1d5db', height: 18 }} />
                        <div style={{ borderBottom: '1px solid #d1d5db', height: 18, marginTop: 5 }} />
                        <div style={{ borderBottom: '1px solid #d1d5db', height: 18, marginTop: 5 }} />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* ── Overall rating ─────────────────────────────────────────────── */}
      <div style={{
        border: '2.5px solid #1e3a5f', borderRadius: 8,
        padding: '12px 14px', marginTop: 10, breakInside: 'avoid',
      }}>
        <div style={{ fontSize: '10pt', fontWeight: 800, color: '#1e3a5f', marginBottom: 10 }}>
          Gesamtbewertung
        </div>
        <div style={{ display: 'flex', gap: 18, marginBottom: 12, flexWrap: 'wrap' }}>
          {[
            { n: 1, label: 'sehr gut', color: '#16a34a' },
            { n: 2, label: 'gut', color: '#4ade80' },
            { n: 3, label: 'befriedigend', color: '#f59e0b' },
            { n: 4, label: 'ausreichend', color: '#f97316' },
            { n: 5, label: 'mangelhaft', color: '#dc2626' },
          ].map(({ n, label, color }) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 24, height: 24, border: `2.5px solid ${color}`,
                borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12pt', fontWeight: 900, color,
              }}>
                {n}
              </div>
              <span style={{ fontSize: '7.5pt', color: '#6b7280' }}>{label}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
          <div>
            <div style={{ fontSize: '7pt', color: '#6b7280', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Zusammenfassung / Empfehlung</div>
            <div style={{ borderBottom: '1px solid #9ca3af', height: 18, marginBottom: 6 }} />
            <div style={{ borderBottom: '1px solid #9ca3af', height: 18, marginBottom: 6 }} />
            <div style={{ borderBottom: '1px solid #9ca3af', height: 18 }} />
          </div>
          <div>
            <div style={{ fontSize: '7pt', color: '#6b7280', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Unterschrift Prüfer</div>
            <div style={{ borderBottom: '1.5px solid #374151', height: 18, marginBottom: 6, width: '80%' }} />
            <div style={{ fontSize: '7pt', color: '#6b7280', marginTop: 16, marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Unterschrift Kunde</div>
            <div style={{ borderBottom: '1.5px solid #374151', height: 18, width: '80%' }} />
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div style={{
        marginTop: 14, paddingTop: 8, borderTop: '1px solid #e5e7eb',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: '6.5pt', color: '#9ca3af',
      }}>
        <span>HT-Marinesales · Professionelle Bootsinspektion & -vermittlung</span>
        <span>info@ht-marinesales.de</span>
      </div>
    </div>
  );
}

function LegendItem({ color, symbol, text }: { color: string; symbol: string; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontWeight: 800, color, fontSize: '9pt', width: 14, textAlign: 'center' }}>{symbol}</span>
      <span style={{ color: '#374151' }}>{text}</span>
    </div>
  );
}
