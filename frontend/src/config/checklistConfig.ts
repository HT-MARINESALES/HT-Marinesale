export interface ChecklistField {
  key: string;
  type: 'text' | 'dropdown';
  label: string;
  options?: string[];
  alwaysShow?: boolean; // true = show even when unchecked (optional remark)
}

export interface ChecklistItem {
  id: string;
  label: string;
  fields: ChecklistField[];
  cylGrid?: boolean;
}

export interface ChecklistCategory {
  id: string;
  title: string;
  badge?: string;
  items: ChecklistItem[];
}

export const CHECKLIST_CATEGORIES: ChecklistCategory[] = [
  {
    id: 'rumpf',
    title: 'Rumpf & Struktur',
    badge: 'sehr kritisch',
    items: [
      { id: 'rumpf_sichtpruefung', label: 'Sichtprüfung Rumpf außen (Risse, Osmoseblasen, Reparaturstellen)', fields: [{ key: 'remark', type: 'text', label: 'Bemerkung', alwaysShow: true }] },
      { id: 'rumpf_feuchtigkeit', label: 'Feuchtigkeitsmessung (insb. unter Wasserlinie)', fields: [{ key: 'values', type: 'text', label: 'Messwerte / Ergebnis' }] },
      { id: 'rumpf_heckspiegel', label: 'Heckspiegel prüfen (weich/morsch?)', fields: [{ key: 'result', type: 'dropdown', label: 'Ergebnis', options: ['unauffällig', 'leicht weich', 'kritisch'] }, { key: 'remark', type: 'text', label: 'Bemerkung' }] },
      { id: 'rumpf_delamination', label: 'Klopftest auf Delamination (GFK)', fields: [{ key: 'values', type: 'text', label: 'Ergebnis' }] },
      { id: 'rumpf_stringer', label: 'Stringer / Spanten prüfen (tragende Struktur!)', fields: [{ key: 'remark', type: 'text', label: 'Bemerkung', alwaysShow: true }] },
      { id: 'rumpf_kiel', label: 'Kielbereich / Aufsetzschäden', fields: [{ key: 'values', type: 'text', label: 'Schäden / Details' }] },
      { id: 'rumpf_badeplattform', label: 'Badeplattform & Spiegelaufnahmen', fields: [{ key: 'remark', type: 'text', label: 'Bemerkung', alwaysShow: true }] },
    ],
  },
  {
    id: 'motor',
    title: 'Motor & Antrieb',
    badge: 'teuerste Kategorie',
    items: [
      {
        id: 'motor_kompression',
        label: 'Kompressionstest aller Zylinder',
        fields: [
          { key: 'zyl1', type: 'text', label: 'Zyl. 1 (bar)' },
          { key: 'zyl2', type: 'text', label: 'Zyl. 2 (bar)' },
          { key: 'zyl3', type: 'text', label: 'Zyl. 3 (bar)' },
          { key: 'zyl4', type: 'text', label: 'Zyl. 4 (bar)' },
          { key: 'zyl5', type: 'text', label: 'Zyl. 5 (bar)' },
          { key: 'zyl6', type: 'text', label: 'Zyl. 6 (bar)' },
          { key: 'zyl7', type: 'text', label: 'Zyl. 7 (bar)' },
          { key: 'zyl8', type: 'text', label: 'Zyl. 8 (bar)' },
        ],
        cylGrid: true,
      },
      { id: 'motor_kaltstart', label: 'Kaltstartverhalten', fields: [{ key: 'result', type: 'dropdown', label: 'Bewertung', options: ['gut', 'verzögert', 'problematisch'] }] },
      { id: 'motor_laufgeraeusch', label: 'Laufgeräusch (Klopfen, Tickern)', fields: [{ key: 'values', type: 'text', label: 'Beschreibung' }] },
      { id: 'motor_oel', label: 'Ölzustand (Metallabrieb, Wasseranteil)', fields: [{ key: 'result', type: 'dropdown', label: 'Zustand', options: ['sauber', 'auffällig', 'kritisch'] }, { key: 'remark', type: 'text', label: 'Details' }] },
      { id: 'motor_kruemmer', label: 'Abgaskrümmer & Risers prüfen (Korrosion innen!)', fields: [{ key: 'remark', type: 'text', label: 'Bemerkung', alwaysShow: true }] },
      { id: 'motor_kuehlkreislauf', label: 'Kühlkreislauf (Impeller, Thermostat)', fields: [{ key: 'remark', type: 'text', label: 'Bemerkung', alwaysShow: true }] },
      { id: 'motor_leckagen', label: 'Leckagen (Öl, Wasser, Kraftstoff)', fields: [{ key: 'values', type: 'text', label: 'Art / Ort der Leckage' }] },
      { id: 'motor_lager', label: 'Motorlager & Ausrichtung', fields: [{ key: 'remark', type: 'text', label: 'Bemerkung', alwaysShow: true }] },
      { id: 'motor_betriebsstunden', label: 'Betriebsstunden plausibel?', fields: [{ key: 'values', type: 'text', label: 'Begründung' }] },
    ],
  },
  {
    id: 'antrieb',
    title: 'Z-Antrieb / Außenborder / Welle',
    items: [
      { id: 'antrieb_getriebeoel', label: 'Getriebeöl (Wasseranteil!)', fields: [{ key: 'result', type: 'dropdown', label: 'Zustand', options: ['klar', 'milchig', 'kritisch'] }] },
      { id: 'antrieb_manschetten', label: 'Manschetten (Risse, porös)', fields: [{ key: 'values', type: 'text', label: 'Zustand' }] },
      { id: 'antrieb_spiel', label: 'Spiel im Antrieb', fields: [{ key: 'remark', type: 'text', label: 'Beschreibung', alwaysShow: true }] },
      { id: 'antrieb_propeller', label: 'Propeller (Schäden, Unwucht)', fields: [{ key: 'values', type: 'text', label: 'Schäden' }] },
      { id: 'antrieb_trim', label: 'Trim-Funktion', fields: [{ key: 'remark', type: 'text', label: 'Bemerkung', alwaysShow: true }] },
      { id: 'antrieb_dichtungen', label: 'Dichtungen / Wellendichtringe', fields: [{ key: 'remark', type: 'text', label: 'Bemerkung', alwaysShow: true }] },
      { id: 'antrieb_korrosion', label: 'Korrosion (Alu-Frass!)', fields: [{ key: 'values', type: 'text', label: 'Stellen / Ausmaß' }] },
    ],
  },
  {
    id: 'elektrik',
    title: 'Elektrik & Bordnetz',
    items: [
      { id: 'elektrik_batterien', label: 'Batterien (Alter, Kapazität)', fields: [{ key: 'values', type: 'text', label: 'Alter / Kapazität' }] },
      { id: 'elektrik_ladegeraet', label: 'Ladegerät / Lichtmaschine', fields: [{ key: 'remark', type: 'text', label: 'Bemerkung', alwaysShow: true }] },
      { id: 'elektrik_kabel', label: 'Kabelzustand (Korrosion, Bastelarbeiten)', fields: [{ key: 'values', type: 'text', label: 'Details' }] },
      { id: 'elektrik_sicherungen', label: 'Sicherungen & Verteiler', fields: [{ key: 'remark', type: 'text', label: 'Bemerkung', alwaysShow: true }] },
      { id: 'elektrik_verbraucher', label: 'Verbraucher (Pumpen, Licht, Navi)', fields: [{ key: 'values', type: 'text', label: 'Funktion / Auffälligkeiten' }] },
      { id: 'elektrik_masse', label: 'Masseverbindungen', fields: [{ key: 'remark', type: 'text', label: 'Bemerkung', alwaysShow: true }] },
    ],
  },
  {
    id: 'kraftstoff',
    title: 'Kraftstoffsystem',
    items: [
      { id: 'kraft_tank', label: 'Tank (Korrosion / Verschmutzung)', fields: [{ key: 'values', type: 'text', label: 'Zustand' }] },
      { id: 'kraft_leitungen', label: 'Leitungen (porös / undicht)', fields: [{ key: 'values', type: 'text', label: 'Details' }] },
      { id: 'kraft_filter', label: 'Filterzustand', fields: [{ key: 'remark', type: 'text', label: 'Bemerkung', alwaysShow: true }] },
      { id: 'kraft_einspritzung', label: 'Einspritzung / Vergaser', fields: [{ key: 'remark', type: 'text', label: 'Bemerkung', alwaysShow: true }] },
      { id: 'kraft_geruch', label: 'Geruch nach Benzin/Diesel (Leck!)', fields: [{ key: 'values', type: 'text', label: 'Quelle / Bereich' }] },
    ],
  },
  {
    id: 'wasser',
    title: 'Wasser & Sanitär',
    items: [
      { id: 'wasser_tank', label: 'Frischwassertank', fields: [{ key: 'remark', type: 'text', label: 'Bemerkung', alwaysShow: true }] },
      { id: 'wasser_pumpe', label: 'Pumpenfunktion', fields: [{ key: 'remark', type: 'text', label: 'Bemerkung', alwaysShow: true }] },
      { id: 'wasser_leitungen', label: 'Leitungen dicht?', fields: [{ key: 'remark', type: 'text', label: 'Bemerkung', alwaysShow: true }] },
      { id: 'wasser_wc', label: 'WC / Fäkalientank', fields: [{ key: 'remark', type: 'text', label: 'Bemerkung', alwaysShow: true }] },
      { id: 'wasser_boiler', label: 'Warmwasserboiler', fields: [{ key: 'remark', type: 'text', label: 'Bemerkung', alwaysShow: true }] },
    ],
  },
  {
    id: 'lenkung',
    title: 'Lenkung & Steuerung',
    items: [
      { id: 'lenk_leichtgaengig', label: 'Lenkung leichtgängig?', fields: [{ key: 'remark', type: 'text', label: 'Bewertung', alwaysShow: true }] },
      { id: 'lenk_spiel', label: 'Spiel in der Lenkung', fields: [{ key: 'remark', type: 'text', label: 'Beschreibung', alwaysShow: true }] },
      { id: 'lenk_zuege', label: 'Gas-/Schaltzüge (schwergängig?)', fields: [{ key: 'remark', type: 'text', label: 'Zustand', alwaysShow: true }] },
      { id: 'lenk_hydraulik', label: 'Hydrauliksystem dicht?', fields: [{ key: 'remark', type: 'text', label: 'Bemerkung', alwaysShow: true }] },
    ],
  },
  {
    id: 'innenraum',
    title: 'Innenraum & Deck',
    items: [
      { id: 'innen_polster', label: 'Polster (Feuchtigkeit, Schimmel)', fields: [{ key: 'values', type: 'text', label: 'Zustand' }] },
      { id: 'innen_boden', label: 'Boden weich? (Hinweis auf Fäulnis!)', fields: [{ key: 'values', type: 'text', label: 'Bereich' }] },
      { id: 'innen_luken', label: 'Luken & Fenster dicht?', fields: [{ key: 'remark', type: 'text', label: 'Bemerkung', alwaysShow: true }] },
      { id: 'innen_decksbelag', label: 'Decksbelag (rutschfest, lose Stellen)', fields: [{ key: 'remark', type: 'text', label: 'Zustand', alwaysShow: true }] },
      { id: 'innen_reling', label: 'Reling / Beschläge fest?', fields: [{ key: 'remark', type: 'text', label: 'Bemerkung', alwaysShow: true }] },
    ],
  },
  {
    id: 'dichtigkeit',
    title: 'Dichtigkeit & Wasserschäden',
    items: [
      { id: 'dicht_bilge', label: 'Bilge trocken?', fields: [{ key: 'remark', type: 'text', label: 'Bemerkung', alwaysShow: true }] },
      { id: 'dicht_wasserlinien', label: 'Wasserlinien-Spuren im Innenraum', fields: [{ key: 'values', type: 'text', label: 'Bereich' }] },
      { id: 'dicht_feuchtigkeit', label: 'Feuchtigkeit in Stauräumen', fields: [{ key: 'values', type: 'text', label: 'Ort' }] },
      { id: 'dicht_durchfuehrungen', label: 'Durchführungen dicht?', fields: [{ key: 'remark', type: 'text', label: 'Bemerkung', alwaysShow: true }] },
    ],
  },
  {
    id: 'elektronik',
    title: 'Elektronik & Instrumente',
    items: [
      { id: 'elek_gps', label: 'GPS / Plotter', fields: [{ key: 'remark', type: 'text', label: 'Funktion', alwaysShow: true }] },
      { id: 'elek_echolot', label: 'Echolot', fields: [{ key: 'remark', type: 'text', label: 'Funktion', alwaysShow: true }] },
      { id: 'elek_anzeigen', label: 'Anzeigen (Drehzahl, Temp, Öl)', fields: [{ key: 'remark', type: 'text', label: 'Funktion', alwaysShow: true }] },
      { id: 'elek_verkabelung', label: 'Verkabelung sauber?', fields: [{ key: 'remark', type: 'text', label: 'Bemerkung', alwaysShow: true }] },
    ],
  },
  {
    id: 'sicherheit',
    title: 'Sicherheit',
    items: [
      { id: 'sich_feuerloescher', label: 'Feuerlöscher (Datum!)', fields: [{ key: 'values', type: 'text', label: 'Datum' }] },
      { id: 'sich_bilgenpumpe', label: 'Bilgenpumpe', fields: [{ key: 'remark', type: 'text', label: 'Funktion', alwaysShow: true }] },
      { id: 'sich_rettungsmittel', label: 'Rettungsmittel', fields: [{ key: 'remark', type: 'text', label: 'Details', alwaysShow: true }] },
      { id: 'sich_signalmittel', label: 'Signalmittel', fields: [{ key: 'remark', type: 'text', label: 'Details', alwaysShow: true }] },
    ],
  },
  {
    id: 'dokumentation',
    title: 'Dokumentation & Historie',
    items: [
      { id: 'dok_serviceheft', label: 'Serviceheft / Wartungen', fields: [{ key: 'remark', type: 'text', label: 'Details', alwaysShow: true }] },
      { id: 'dok_rechnungen', label: 'Rechnungen vorhanden?', fields: [{ key: 'remark', type: 'text', label: 'Details', alwaysShow: true }] },
      { id: 'dok_motornummer', label: 'Motornummer / Seriennummer', fields: [{ key: 'values', type: 'text', label: 'Nummer' }] },
      { id: 'dok_ce', label: 'CE-Kennzeichnung', fields: [{ key: 'remark', type: 'text', label: 'Details', alwaysShow: true }] },
      { id: 'dok_vorbesitzer', label: 'Vorbesitzer / Nutzung', fields: [{ key: 'remark', type: 'text', label: 'Angaben', alwaysShow: true }] },
    ],
  },
];

export const RATING_LABELS: Record<number, { label: string; color: string; bg: string; border: string }> = {
  1: { label: 'Ausgezeichnet', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-400' },
  2: { label: 'Gut', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-400' },
  3: { label: 'Befriedigend', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-400' },
  4: { label: 'Mangelhaft', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-400' },
  5: { label: 'Kritisch', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-400' },
};

export type ChecklistItemStatus = 'ok' | 'fault' | undefined;

export type ChecklistData = Record<string, {
  status?: ChecklistItemStatus;
  /** @deprecated use status instead */
  checked?: boolean;
  remark?: string;
  values?: string;
  result?: string;
}>;
