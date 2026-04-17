import { useParams, Link } from 'react-router-dom';
import { FileDown } from 'lucide-react';
import {
  Shield, MapPin, Calendar, Ruler, Zap, Users, BedDouble, Anchor,
  ChevronRight, Gauge, Droplets, Navigation, LifeBuoy, Sparkles,
  Waves, Wind, Box, Hash, Clock, ChevronsUpDown, Weight,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { usePublicListing, usePublicListings } from '@/hooks/useListings';
import { ImageGallery } from '@/components/listings/ImageGallery';
import { ContactForm } from '@/components/forms/ContactForm';
import { ListingCard } from '@/components/listings/ListingCard';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatPrice, formatDate, BOAT_TYPES, FUEL_TYPES, CONDITIONS, CE_CATEGORIES } from '@/lib/utils';
import { api } from '@/lib/api';
import { ChecklistDisplay } from '@/components/listings/ChecklistDisplay';

export function BoatDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: listing, isLoading, error } = usePublicListing(slug || '');
  const { data: similar } = usePublicListings({ boat_type: listing?.boat_type, limit: 5 });
  const { data: checklist } = useQuery({
    queryKey: ['public-checklist', listing?.id],
    queryFn: () => api.get<any>(`/listings/${listing!.id}/checklist`),
    enabled: !!listing?.id,
  });

  if (isLoading) return <PageSpinner />;
  if (error || !listing) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Anchor className="h-16 w-16 text-gray-300 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Inserat nicht gefunden</h1>
        <p className="text-gray-500 mb-6">Dieses Inserat existiert nicht oder ist nicht mehr verfügbar.</p>
        <Link to="/boote" className="text-navy-600 hover:underline">Zurück zur Übersicht</Link>
      </div>
    );
  }

  const images = listing.listing_images || [];

  // ── helper: one spec row ─────────────────────────────────────────────
  const Spec = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: React.ElementType;
    label: string;
    value: string | number | null | undefined;
  }) => {
    if (!value && value !== 0) return null;
    return (
      <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
        <Icon className="h-4 w-4 text-navy-500 flex-shrink-0" />
        <span className="text-sm text-gray-500 flex-1">{label}</span>
        <span className="text-sm font-semibold text-gray-900">{value}</span>
      </div>
    );
  };

  // ── helper: equipment chip ────────────────────────────────────────────
  const Chip = ({ label, color }: { label: string; color: string }) => (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );

  const similarListings = similar?.data.filter(l => l.id !== listing.id).slice(0, 4) ?? [];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-5">
          <Link to="/" className="hover:text-navy-700 transition-colors">Start</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/boote" className="hover:text-navy-700 transition-colors">Boote</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-600 truncate max-w-xs">{listing.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT / MAIN ─────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Gallery */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
              <ImageGallery images={images} title={listing.title} />
            </div>

            {/* Title + badges */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl md:text-3xl font-bold text-navy-900 leading-tight">
                    {listing.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-navy-50 text-navy-700 text-xs font-medium">
                      <Calendar className="h-3 w-3" /> {listing.year}
                    </span>
                    {listing.boat_type && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                        <Waves className="h-3 w-3" /> {BOAT_TYPES[listing.boat_type]}
                      </span>
                    )}
                    {listing.condition && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                        {CONDITIONS[listing.condition]}
                      </span>
                    )}
                    {listing.location_city && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                        <MapPin className="h-3 w-3" /> {listing.location_city}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-3xl font-bold text-navy-900">{formatPrice(listing.price)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">inkl. MwSt.</p>
                  </div>
                  <button
                    onClick={() => window.open(`/boote/${listing.slug}/drucken`, '_blank')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 text-xs font-medium hover:border-navy-400 hover:text-navy-700 hover:bg-navy-50 transition-colors"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    PDF / Drucken
                  </button>
                </div>
              </div>

              {/* Trust badge / Checklist display */}
              {checklist ? (
                <ChecklistDisplay checklist={checklist} />
              ) : (
                <div className="mt-5 flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <Shield className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-green-800 text-sm">HT-Marinesales geprüft</p>
                    <p className="text-xs text-green-600">Dieses Boot wurde von unseren Experten begutachtet und freigegeben</p>
                  </div>
                </div>
              )}

              {/* Quick-stat pills */}
              {(listing.length_m || listing.engine_power_hp || listing.max_passengers || listing.berths || listing.engine_hours || listing.fuel_type) && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-5">
                  {listing.length_m && (
                    <div className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2.5">
                      <Ruler className="h-5 w-5 text-navy-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">Länge</p>
                        <p className="font-bold text-gray-900 text-sm">{listing.length_m} m</p>
                      </div>
                    </div>
                  )}
                  {listing.engine_power_hp && (
                    <div className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2.5">
                      <Zap className="h-5 w-5 text-amber-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">Leistung</p>
                        <p className="font-bold text-gray-900 text-sm">{listing.engine_power_hp} PS</p>
                      </div>
                    </div>
                  )}
                  {listing.engine_hours != null && (
                    <div className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2.5">
                      <Clock className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">Betriebsstd.</p>
                        <p className="font-bold text-gray-900 text-sm">{listing.engine_hours} h</p>
                      </div>
                    </div>
                  )}
                  {listing.max_passengers && (
                    <div className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2.5">
                      <Users className="h-5 w-5 text-purple-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">Passagiere</p>
                        <p className="font-bold text-gray-900 text-sm">{listing.max_passengers}</p>
                      </div>
                    </div>
                  )}
                  {listing.berths && (
                    <div className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2.5">
                      <BedDouble className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">Schlafplätze</p>
                        <p className="font-bold text-gray-900 text-sm">{listing.berths}</p>
                      </div>
                    </div>
                  )}
                  {listing.fuel_type && (
                    <div className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2.5">
                      <Droplets className="h-5 w-5 text-orange-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">Antrieb</p>
                        <p className="font-bold text-gray-900 text-sm">{FUEL_TYPES[listing.fuel_type]}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            {listing.description && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-base font-bold text-navy-900 mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 rounded-full bg-navy-600 inline-block" />
                  Beschreibung
                </h2>
                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed text-sm">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Specs grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              {/* Grunddaten */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-sm font-bold text-navy-900 mb-3 flex items-center gap-2">
                  <Anchor className="h-4 w-4 text-navy-500" /> Grunddaten
                </h3>
                <Spec icon={Hash}        label="Marke"        value={listing.brand} />
                <Spec icon={Hash}        label="Modell"       value={listing.model} />
                <Spec icon={Calendar}    label="Baujahr"      value={listing.year} />
                <Spec icon={Waves}       label="Bootstyp"     value={listing.boat_type ? BOAT_TYPES[listing.boat_type] : null} />
                <Spec icon={Box}         label="Material"     value={listing.material} />
                <Spec icon={Shield}      label="CE-Kategorie" value={listing.ce_category ? CE_CATEGORIES[listing.ce_category] : null} />
                <Spec icon={Gauge}       label="Zustand"      value={listing.condition ? CONDITIONS[listing.condition] : null} />
                <Spec icon={Droplets}   label="Treibstofftank" value={listing.fuel_capacity_l ? `${listing.fuel_capacity_l} L` : null} />
                <Spec icon={Droplets}   label="Frischwasser"   value={listing.fresh_water_l ? `${listing.fresh_water_l} L` : null} />
                <Spec icon={Droplets}   label="Abwasser"       value={listing.waste_water_l ? `${listing.waste_water_l} L` : null} />
              </div>

              {/* Maße & Motor */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-sm font-bold text-navy-900 mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" /> Maße & Motor
                </h3>
                <Spec icon={Ruler}           label="Länge"          value={listing.length_m ? `${listing.length_m} m` : null} />
                <Spec icon={ChevronsUpDown}  label="Breite"         value={listing.width_m ? `${listing.width_m} m` : null} />
                <Spec icon={ChevronsUpDown}  label="Tiefgang"       value={listing.draft_m ? `${listing.draft_m} m` : null} />
                <Spec icon={Weight}          label="Verdrängung"    value={listing.displacement_kg ? `${listing.displacement_kg} kg` : null} />
                <Spec icon={Wind}            label="Motor"          value={listing.engine_type} />
                <Spec icon={Zap}             label="Leistung"       value={listing.engine_power_hp ? `${listing.engine_power_hp} PS` : null} />
                <Spec icon={Droplets}        label="Kraftstoff"     value={listing.fuel_type ? FUEL_TYPES[listing.fuel_type] : null} />
                <Spec icon={Clock}           label="Betriebsstunden" value={listing.engine_hours ? `${listing.engine_hours} h` : null} />
              </div>

              {/* Unterkunft */}
              {(listing.cabins || listing.berths || listing.bathrooms || listing.max_passengers) && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <h3 className="text-sm font-bold text-navy-900 mb-3 flex items-center gap-2">
                    <BedDouble className="h-4 w-4 text-indigo-500" /> Unterkunft
                  </h3>
                  <Spec icon={Box}      label="Kabinen"         value={listing.cabins} />
                  <Spec icon={BedDouble} label="Schlafplätze"   value={listing.berths} />
                  <Spec icon={Droplets} label="Badezimmer"      value={listing.bathrooms} />
                  <Spec icon={Users}    label="Max. Passagiere" value={listing.max_passengers} />
                </div>
              )}

              {/* Standort */}
              {(listing.location_city || listing.berth_location) && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <h3 className="text-sm font-bold text-navy-900 mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-rose-500" /> Standort
                  </h3>
                  <Spec icon={MapPin} label="Stadt"      value={listing.location_city} />
                  <Spec icon={MapPin} label="Land"       value={listing.location_country !== 'Deutschland' ? listing.location_country : null} />
                  <Spec icon={Anchor} label="Liegeplatz" value={listing.berth_location} />
                </div>
              )}
            </div>

            {/* Equipment */}
            {(listing.navigation_equipment?.length || listing.safety_equipment?.length || listing.comfort_features?.length) ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-base font-bold text-navy-900 mb-5 flex items-center gap-2">
                  <span className="w-1 h-5 rounded-full bg-navy-600 inline-block" />
                  Ausstattung
                </h2>
                <div className="space-y-5">
                  {listing.navigation_equipment && listing.navigation_equipment.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2.5">
                        <Navigation className="h-4 w-4 text-navy-500" />
                        <h4 className="text-sm font-semibold text-gray-700">Navigation</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {listing.navigation_equipment.map(item => (
                          <Chip key={item} label={item} color="bg-navy-50 text-navy-700" />
                        ))}
                      </div>
                    </div>
                  )}
                  {listing.safety_equipment && listing.safety_equipment.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2.5">
                        <LifeBuoy className="h-4 w-4 text-green-600" />
                        <h4 className="text-sm font-semibold text-gray-700">Sicherheit</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {listing.safety_equipment.map(item => (
                          <Chip key={item} label={item} color="bg-green-50 text-green-700" />
                        ))}
                      </div>
                    </div>
                  )}
                  {listing.comfort_features && listing.comfort_features.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2.5">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        <h4 className="text-sm font-semibold text-gray-700">Komfort & Extras</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {listing.comfort_features.map(item => (
                          <Chip key={item} label={item} color="bg-amber-50 text-amber-700" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Trailer */}
            {listing.has_trailer && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-base font-bold text-navy-900 mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 rounded-full bg-navy-600 inline-block" />
                  Trailer (im Preis inbegriffen)
                </h2>
                <div className="space-y-0">
                  <Spec icon={Calendar} label="Baujahr Trailer"    value={listing.trailer_year} />
                  <Spec icon={Clock}    label="Reifenalter"         value={listing.trailer_tire_age != null ? `${listing.trailer_tire_age} Jahre` : null} />
                  <Spec icon={Weight}   label="Gesamtgewicht"       value={listing.trailer_total_weight_kg != null ? `${listing.trailer_total_weight_kg} kg` : null} />
                  <Spec icon={Box}      label="Material"            value={listing.trailer_material === 'steel' ? 'Stahl' : listing.trailer_material === 'aluminum' ? 'Aluminium' : listing.trailer_material === 'other' ? 'Sonstiges' : null} />
                  <Spec icon={Shield}   label="TÜV"                 value={listing.trailer_tuev === true ? (listing.trailer_tuev_until ? `vorhanden bis ${listing.trailer_tuev_until}` : 'vorhanden') : listing.trailer_tuev === false ? 'nicht vorhanden' : null} />
                </div>
                {listing.trailer_description && (
                  <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100 leading-relaxed">{listing.trailer_description}</p>
                )}
              </div>
            )}

            {/* Video */}
            {listing.video_url && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-base font-bold text-navy-900 mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 rounded-full bg-navy-600 inline-block" />
                  Video
                </h2>
                <a
                  href={listing.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-navy-600 hover:text-navy-800 font-medium text-sm hover:underline transition-colors"
                >
                  Video ansehen →
                </a>
              </div>
            )}
          </div>

          {/* ── SIDEBAR ──────────────────────────────────────────────── */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sticky top-24">

              {/* Price */}
              <div className="mb-5 pb-5 border-b border-gray-100">
                <p className="text-3xl font-bold text-navy-900">{formatPrice(listing.price)}</p>
                <p className="text-xs text-gray-400 mt-0.5">Kaufpreis inkl. MwSt.</p>
              </div>

              {/* Meta info */}
              <div className="space-y-2 mb-5">
                {listing.location_city && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span>{listing.location_city}{listing.location_country && listing.location_country !== 'Deutschland' ? `, ${listing.location_country}` : ''}</span>
                  </div>
                )}
                {listing.published_at && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span>Inseriert am {formatDate(listing.published_at)}</span>
                  </div>
                )}
                {listing.seller_display && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Shield className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span>Angeboten von <span className="font-semibold text-gray-900">{listing.seller_display}</span></span>
                  </div>
                )}
              </div>

              {/* Contact form */}
              <div className="pt-5 border-t border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4 text-sm">Interesse? Jetzt anfragen</h3>
                <ContactForm listingId={listing.id} />
              </div>
            </div>
          </div>
        </div>

        {/* Similar listings */}
        {similarListings.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-navy-900 mb-6">Ähnliche Boote</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {similarListings.map(l => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
