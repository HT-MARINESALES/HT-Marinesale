import { randomBytes } from 'crypto';
import { supabasePublic } from '../lib/supabase';
import { config } from '../lib/config';

function generateSlug(title: string, brand: string, model: string, year: number): string {
  const base = `${year}-${brand}-${model}-${title}`
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }[c] || c))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
  // Use cryptographically secure randomness (Math.random is predictable)
  const random = randomBytes(5).toString('hex'); // 10 hex chars, 40 bits of entropy
  return `${base}-${random}`;
}

export const listingService = {
  async createSlug(title: string, brand: string, model: string, year: number): Promise<string> {
    let slug = generateSlug(title, brand, model, year);
    let attempts = 0;
    while (attempts < 5) {
      const { data } = await supabasePublic
        .from('listings')
        .select('id')
        .eq('slug', slug)
        .single();
      if (!data) break;
      slug = generateSlug(title, brand, model, year);
      attempts++;
    }
    return slug;
  },

  generateKATitle(listing: {
    year: number;
    brand: string;
    model: string;
    length_m?: number | null;
    engine_power_hp?: number | null;
    boat_type?: string | null;
    condition?: string | null;
  }): string {
    const conditionShort: Record<string, string> = {
      new: 'Neuboot',
      like_new: 'wie neu',
      good: 'top gepflegt',
      fair: 'solider Zustand',
      needs_work: 'Bastlerprojekt',
    };

    const base = `${listing.brand} ${listing.model} ${listing.year}`;
    const extras: string[] = [];
    if (listing.length_m) extras.push(`${listing.length_m} m`);
    if (listing.engine_power_hp) extras.push(`${listing.engine_power_hp} PS`);
    const cond = listing.condition ? conditionShort[listing.condition] : null;

    // Fit as many extras as possible within 50 chars
    let title = base;
    const suffix = [...extras, ...(cond ? [cond] : [])];
    if (suffix.length > 0) {
      const candidate = `${base} – ${suffix.join(', ')}`;
      title = candidate.length <= 50 ? candidate : (base + ` – ${suffix[0]}`).substring(0, 50);
    }

    return title.substring(0, 50);
  },

  generateKADescription(listing: {
    year: number;
    brand: string;
    model: string;
    slug?: string | null;
    boat_type?: string | null;
    condition?: string | null;
    length_m?: number | null;
    width_m?: number | null;
    draft_m?: number | null;
    displacement_kg?: number | null;
    engine_type?: string | null;
    engine_count?: number | null;
    engine_power_hp?: number | null;
    fuel_type?: string | null;
    engine_hours?: number | null;
    cabins?: number | null;
    berths?: number | null;
    bathrooms?: number | null;
    max_passengers?: number | null;
    fresh_water_l?: number | null;
    waste_water_l?: number | null;
    location_city?: string | null;
    location_country?: string | null;
    material?: string | null;
    ce_category?: string | null;
    has_trailer?: boolean | null;
    trailer_year?: number | null;
    trailer_tuev?: boolean | null;
    trailer_tuev_until?: string | null;
    trailer_material?: string | null;
    description?: string | null;
    navigation_equipment?: string[] | null;
    safety_equipment?: string[] | null;
    comfort_features?: string[] | null;
  }): string {
    const conditionIntro: Record<string, string> = {
      new: 'brandneues',
      like_new: 'neuwertig gepflegtes',
      good: 'top gepflegtes',
      fair: 'solides',
      needs_work: 'restaurierungsbedürftiges',
    };
    const conditionTag: Record<string, string> = {
      new: 'Neuboot',
      like_new: 'wie neu',
      good: 'sehr guter Zustand',
      fair: 'guter Gebrauchtzustand',
      needs_work: 'Bastlerprojekt',
    };
    const fuelDE: Record<string, string> = {
      petrol: 'Benzin',
      diesel: 'Diesel',
      electric: 'Elektro',
      hybrid: 'Hybrid',
      other: 'Sonstiger Antrieb',
    };
    const boatTypeDE: Record<string, string> = {
      motorboat: 'Motorboot',
      sailboat: 'Segelboot',
      yacht: 'Yacht',
      catamaran: 'Katamaran',
      inflatable: 'Schlauchboot',
      jet_ski: 'Jetski',
      houseboat: 'Hausboot',
      fishing: 'Fischerboot',
      other: 'Boot',
    };
    const trailerMaterialDE: Record<string, string> = {
      steel: 'Stahl',
      aluminum: 'Aluminium',
      other: 'Sonstiges',
    };

    const typeDE = listing.boat_type ? (boatTypeDE[listing.boat_type] || 'Boot') : 'Boot';
    const condAdj = listing.condition ? (conditionIntro[listing.condition] || '') : '';
    const condTag = listing.condition ? (conditionTag[listing.condition] || '') : '';

    const lines: string[] = [];

    // ── 1. Opener ─────────────────────────────────────────────
    const loc = listing.location_city
      ? listing.location_city + (listing.location_country && listing.location_country !== 'Deutschland' ? `, ${listing.location_country}` : '')
      : null;

    let intro = `Wir bieten ein ${condAdj} ${listing.year}er ${listing.brand} ${listing.model} an`;
    if (loc) intro += ` – aktuell in ${loc} verfügbar`;
    intro += '.';
    lines.push(intro);

    if (condTag) lines.push(`Zustand: ${condTag}`);
    if (listing.material) lines.push(`Rumpfmaterial: ${listing.material}`);
    if (listing.has_trailer) {
      const trailerDetails: string[] = [];
      if (listing.trailer_year) trailerDetails.push(`Bj. ${listing.trailer_year}`);
      if (listing.trailer_material && listing.trailer_material !== 'other') trailerDetails.push(trailerMaterialDE[listing.trailer_material]);
      if (listing.trailer_tuev === true) trailerDetails.push(listing.trailer_tuev_until ? `TÜV bis ${listing.trailer_tuev_until}` : 'TÜV vorhanden');
      else if (listing.trailer_tuev === false) trailerDetails.push('kein TÜV');
      lines.push(`Trailer inklusive${trailerDetails.length > 0 ? ` (${trailerDetails.join(', ')})` : ''}`);
    }
    lines.push('');

    // ── 2. Geprüft-Badge ──────────────────────────────────────
    lines.push('✅ Von HT-Marineservice persönlich geprüft & freigegeben');
    lines.push('Jedes Boot bei uns wird vor der Veröffentlichung besichtigt und technisch bewertet – kein Kauf im Dunkeln.');
    lines.push('');

    // ── 3. Verkäuferbeschreibung ──────────────────────────────
    if (listing.description?.trim()) {
      lines.push('📝 Mehr dazu:');
      lines.push(listing.description.trim());
      lines.push('');
    }

    // ── 4. Maße & Motor ───────────────────────────────────────
    const tech: string[] = [];
    if (listing.length_m)        tech.push(`• Länge: ${listing.length_m} m`);
    if (listing.width_m)         tech.push(`• Breite: ${listing.width_m} m`);
    if (listing.draft_m)         tech.push(`• Tiefgang: ${listing.draft_m} m`);
    if (listing.displacement_kg) tech.push(`• Verdrängung: ${listing.displacement_kg} kg`);
    const motorParts: string[] = [];
    if (listing.engine_count && listing.engine_count > 1) motorParts.push(`${listing.engine_count}×`);
    if (listing.engine_type)     motorParts.push(listing.engine_type);
    if (listing.engine_power_hp) motorParts.push(`${listing.engine_power_hp} PS`);
    if (listing.fuel_type)       motorParts.push(fuelDE[listing.fuel_type] || listing.fuel_type);
    if (motorParts.length > 0)   tech.push(`• Motor: ${motorParts.join(', ')}`);
    if (listing.engine_hours != null) tech.push(`• Betriebsstunden: ${listing.engine_hours} h`);
    if (listing.fresh_water_l)   tech.push(`• Frischwasser: ${listing.fresh_water_l} L`);
    if (tech.length > 0) {
      lines.push('⚙️ Technische Daten:');
      tech.forEach(t => lines.push(t));
      lines.push('');
    }

    // ── 5. Unterkunft ─────────────────────────────────────────
    const accom: string[] = [];
    if (listing.cabins != null && listing.cabins > 0)
      accom.push(`• ${listing.cabins} Kabine${listing.cabins !== 1 ? 'n' : ''}`);
    if (listing.berths != null && listing.berths > 0)
      accom.push(`• ${listing.berths} Schlafplatz${listing.berths !== 1 ? '/-plätze' : ''}`);
    if (listing.bathrooms != null && listing.bathrooms > 0)
      accom.push(`• ${listing.bathrooms} Bad${listing.bathrooms !== 1 ? '/Heads' : ''}`);
    if (listing.max_passengers != null && listing.max_passengers > 0)
      accom.push(`• Platz für bis zu ${listing.max_passengers} Personen`);
    if (accom.length > 0) {
      lines.push('🛏️ Unterkunft & Platz:');
      accom.forEach(a => lines.push(a));
      lines.push('');
    }

    // ── 6. Ausstattung ────────────────────────────────────────
    const hasEquip = (listing.navigation_equipment?.length || 0) +
                     (listing.safety_equipment?.length || 0) +
                     (listing.comfort_features?.length || 0);
    if (hasEquip > 0) {
      lines.push('🔧 Ausstattung an Bord:');
      if (listing.navigation_equipment?.length) lines.push(`• Navigation: ${listing.navigation_equipment.join(', ')}`);
      if (listing.safety_equipment?.length)     lines.push(`• Sicherheit: ${listing.safety_equipment.join(', ')}`);
      if (listing.comfort_features?.length)     lines.push(`• Komfort: ${listing.comfort_features.join(', ')}`);
      lines.push('');
    }

    // ── 7. Kontakt ────────────────────────────────────────────
    lines.push('💬 Interesse oder Fragen?');
    lines.push('Einfach Nachricht schicken oder anrufen – wir melden uns schnell und vereinbaren gerne einen Besichtigungstermin.');

    // ── 8. Link ───────────────────────────────────────────────
    if (listing.slug) {
      lines.push('');
      lines.push(`📸 Alle Fotos & vollständige Infos:`);
      lines.push(`${config.frontendUrl}/boote/${listing.slug}`);
    }

    return lines.join('\n').substring(0, 1500);
  },
};
