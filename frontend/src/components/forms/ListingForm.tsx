import { useState, useRef, useCallback, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, ChevronRight, Save, Send, Plus, X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { BrandAutocomplete } from '@/components/ui/BrandAutocomplete';
import { Textarea } from '@/components/ui/Textarea';
import { ImageUpload } from '@/components/listings/ImageUpload';
import { BOAT_TYPES, FUEL_TYPES, CONDITIONS, CE_CATEGORIES, getProvisionInfo, formatPrice } from '@/lib/utils';
import type { ListingFormData, ListingImage } from '@/types';
import { useToast } from '@/hooks/useToast';

const listingSchema = z.object({
  title: z.string().min(3, 'Titel zu kurz').max(200),
  brand: z.string().min(1, 'Pflichtfeld').max(100),
  model: z.string().min(1, 'Pflichtfeld').max(100),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
  price: z.coerce.number().positive('Preis muss positiv sein'),
  boat_type: z.string().min(1, 'Pflichtfeld'),
  condition: z.string().optional(),
  length_m: z.coerce.number().positive().optional().or(z.literal('')),
  width_m: z.coerce.number().positive().optional().or(z.literal('')),
  draft_m: z.coerce.number().positive().optional().or(z.literal('')),
  displacement_kg: z.coerce.number().positive().optional().or(z.literal('')),
  engine_type: z.string().max(100).optional(),
  engine_count: z.coerce.number().int().min(0).max(10).optional().or(z.literal('')),
  engine_power_hp: z.coerce.number().positive().optional().or(z.literal('')),
  fuel_type: z.string().optional(),
  engine_hours: z.coerce.number().positive().optional().or(z.literal('')),
  cabins: z.coerce.number().int().min(0).optional().or(z.literal('')),
  berths: z.coerce.number().int().min(0).optional().or(z.literal('')),
  bathrooms: z.coerce.number().int().min(0).optional().or(z.literal('')),
  max_passengers: z.coerce.number().int().min(0).optional().or(z.literal('')),
  fresh_water_l: z.coerce.number().positive().optional().or(z.literal('')),
  waste_water_l: z.coerce.number().positive().optional().or(z.literal('')),
  fuel_capacity_l: z.coerce.number().positive().optional().or(z.literal('')),
  drive_type: z.string().optional(),
  drive_description: z.string().max(200).optional(),
  ce_category: z.string().optional(),
  material: z.string().max(100).optional(),
  location_city: z.string().max(100).optional(),
  location_country: z.string().max(100).optional(),
  berth_location: z.string().max(200).optional(),
  navigation_equipment: z.array(z.string()).optional(),
  safety_equipment: z.array(z.string()).optional(),
  comfort_features: z.array(z.string()).optional(),
  video_url: z.string().optional(),
  description: z.string().max(5000).optional(),
  has_trailer: z.boolean().optional(),
  trailer_year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1).optional().or(z.literal('')),
  trailer_tire_age: z.coerce.number().int().min(0).max(99).optional().or(z.literal('')),
  trailer_total_weight_kg: z.coerce.number().int().min(0).optional().or(z.literal('')),
  trailer_tuev: z.boolean().optional(),
  trailer_tuev_until: z.string().optional(),
  trailer_material: z.enum(['steel', 'aluminum', 'other']).optional().or(z.literal('')),
  trailer_description: z.string().max(2000).optional(),
});

const NAVIGATION_EQUIPMENT = [
  'GPS', 'Chartplotter', 'Kartenplotter', 'Radar', 'Autopilot', 'VHF-Funk',
  'AIS', 'Echolot/Tiefenmesser', 'Logge/Knotenmesser', 'Windmesser', 'Kompass',
  'Navtex', 'EPIRB', 'Sextant',
];

const SAFETY_EQUIPMENT = [
  'Rettungsinsel', 'Rettungswesten', 'Signalmittel', 'Erste-Hilfe-Set', 'Feuerlöscher',
  'Anker + Kette', 'Seenotsignalmittel', 'MOB-System', 'Bilgenpumpe',
  'Navigationsbeleuchtung', 'Ankerlicht',
];

const COMFORT_FEATURES = [
  'Klimaanlage', 'Heizung', 'Kühlschrank', 'Mikrowelle/Herd',
  'Dusche (Innen)', 'Dusche (Außen)', 'Toilette (Chemisch)', 'Toilette (Elektrisch)',
  'Toilette (Seetoilette)',
  'Bimini', 'Persenning', 'Bimini-Top', 'Camperverdeck',
  'Bugstrahlruder', 'Heckstrahlruder', 'Elektrische Ankerwinsch',
  'Badeplattform', 'Generator', 'Solaranlage', 'Windgenerator', 'Frischwasseranlage',
  'Stereoanlage', 'TV', 'WLAN/Internet', 'Sprayhood',
  'Boiler', 'Landstrom', 'Ladegerät',
  'Polster', 'Bugpolster', 'Sonnenbeschattung',
  'Beiboot (Dingy)', 'Ambientebeleuchtung', 'Unterwasserbeleuchtung', 'Kamera',
];

interface ListingFormProps {
  initialData?: Partial<ListingFormData>;
  initialStep?: number;
  listingId?: string;
  existingImages?: ListingImage[];
  onSave: (data: ListingFormData, silent?: boolean) => Promise<{ id?: string }>;
  onSubmit?: (id: string) => Promise<void>;
  isEdit?: boolean;
  isPublished?: boolean;
}

const STEP_TITLES = [
  'Grunddaten',
  'Bilder',
  'Technische Details',
  'Ausstattung',
  'Standort & Beschreibung',
];

function EquipmentSection({
  label,
  presets,
  value,
  onChange,
}: { label: string; presets: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const [customInput, setCustomInput] = useState('');

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setCustomInput('');
  };

  const remove = (item: string) => {
    onChange(value.filter(i => i !== item));
  };

  return (
    <div>
      <h4 className="font-medium text-gray-700 mb-3">{label}</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 mb-3">
        {presets.map(item => (
          <label key={item} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded">
            <input
              type="checkbox"
              checked={value.includes(item)}
              onChange={(e) => {
                if (e.target.checked) onChange([...value, item]);
                else onChange(value.filter(i => i !== item));
              }}
              className="rounded border-gray-300 text-navy-600 focus:ring-navy-500"
            />
            <span className="text-sm text-gray-700">{item}</span>
          </label>
        ))}
      </div>
      {value.filter(v => !presets.includes(v)).map(item => (
        <span key={item} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-navy-100 text-navy-800 mr-1 mb-1">
          {item}
          <button type="button" onClick={() => remove(item)} className="hover:text-red-600">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <div className="flex gap-2 mt-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
          placeholder="Eigene Ergänzung..."
          className="flex-1 h-9 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!customInput.trim()}
          className="h-9 px-3 rounded-lg bg-navy-100 text-navy-700 text-sm font-medium hover:bg-navy-200 disabled:opacity-40 flex items-center gap-1"
        >
          <Plus className="h-3.5 w-3.5" />
          Hinzufügen
        </button>
      </div>
    </div>
  );
}

const DRAFT_KEY = 'ht-new-listing-draft';

export function ListingForm({ initialData, initialStep, listingId, existingImages = [], onSave, onSubmit, isEdit = false, isPublished = false }: ListingFormProps) {
  const [step, setStep] = useState(initialStep ?? 0);
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [savedId, setSavedId] = useState<string | undefined>(listingId);
  const [images, setImages] = useState<ListingImage[]>(existingImages);
  const { success: toastSuccess, error: toastError } = useToast();
  const savedSuccessfully = useRef(false);

  const { register, handleSubmit, control, setValue, formState: { errors }, getValues, watch } = useForm({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: initialData?.title || '',
      brand: initialData?.brand || '',
      model: initialData?.model || '',
      year: initialData?.year || new Date().getFullYear(),
      price: initialData?.price || 0,
      boat_type: initialData?.boat_type || '',
      condition: initialData?.condition || '',
      length_m: initialData?.length_m || '',
      width_m: initialData?.width_m || '',
      draft_m: initialData?.draft_m || '',
      displacement_kg: initialData?.displacement_kg || '',
      engine_type: initialData?.engine_type || '',
      engine_count: initialData?.engine_count || '',
      engine_power_hp: initialData?.engine_power_hp || '',
      fuel_type: initialData?.fuel_type || '',
      engine_hours: initialData?.engine_hours || '',
      cabins: initialData?.cabins || '',
      berths: initialData?.berths || '',
      bathrooms: initialData?.bathrooms || '',
      max_passengers: initialData?.max_passengers || '',
      fresh_water_l: initialData?.fresh_water_l || '',
      waste_water_l: initialData?.waste_water_l || '',
      fuel_capacity_l: initialData?.fuel_capacity_l || '',
      drive_type: initialData?.drive_type || '',
      drive_description: initialData?.drive_description || '',
      ce_category: initialData?.ce_category || '',
      material: initialData?.material || '',
      location_city: initialData?.location_city || '',
      location_country: initialData?.location_country || 'Deutschland',
      berth_location: initialData?.berth_location || '',
      navigation_equipment: initialData?.navigation_equipment || [],
      safety_equipment: initialData?.safety_equipment || [],
      comfort_features: initialData?.comfort_features || [],
      video_url: initialData?.video_url || '',
      description: initialData?.description || '',
      has_trailer: initialData?.has_trailer || false,
      trailer_year: initialData?.trailer_year || '',
      trailer_tire_age: initialData?.trailer_tire_age || '',
      trailer_total_weight_kg: initialData?.trailer_total_weight_kg || '',
      trailer_tuev: initialData?.trailer_tuev || false,
      trailer_tuev_until: initialData?.trailer_tuev_until || '',
      trailer_material: (initialData?.trailer_material as 'steel' | 'aluminum' | 'other' | undefined) || '',
      trailer_description: initialData?.trailer_description || '',
    },
  });

  // Persist draft to sessionStorage on unmount for new (unsaved) listings
  useEffect(() => {
    if (isEdit || listingId) return;
    return () => {
      if (savedSuccessfully.current) {
        sessionStorage.removeItem(DRAFT_KEY);
      } else {
        try {
          const values = getValues();
          if (values.title || values.brand || values.model) {
            sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values));
          }
        } catch { /* ignore */ }
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const buildCleanData = () => {
    const data = getValues();
    return {
      ...data,
      year: Number(data.year),
      price: Number(data.price),
      length_m: data.length_m ? Number(data.length_m) : null,
      width_m: data.width_m ? Number(data.width_m) : null,
      draft_m: data.draft_m ? Number(data.draft_m) : null,
      displacement_kg: data.displacement_kg ? Number(data.displacement_kg) : null,
      engine_count: data.engine_count ? Number(data.engine_count) : null,
      engine_power_hp: data.engine_power_hp ? Number(data.engine_power_hp) : null,
      engine_hours: data.engine_hours ? Number(data.engine_hours) : null,
      cabins: data.cabins ? Number(data.cabins) : null,
      berths: data.berths ? Number(data.berths) : null,
      bathrooms: data.bathrooms ? Number(data.bathrooms) : null,
      max_passengers: data.max_passengers ? Number(data.max_passengers) : null,
      fresh_water_l: data.fresh_water_l ? Number(data.fresh_water_l) : null,
      waste_water_l: data.waste_water_l ? Number(data.waste_water_l) : null,
      fuel_capacity_l: data.fuel_capacity_l ? Number(data.fuel_capacity_l) : null,
      drive_type: data.drive_type || null,
      drive_description: data.drive_description || null,
      condition: data.condition || undefined,
      fuel_type: data.fuel_type || undefined,
      ce_category: data.ce_category || undefined,
      video_url: data.video_url || null,
      trailer_year: data.trailer_year ? Number(data.trailer_year) : null,
      trailer_tire_age: data.trailer_tire_age ? Number(data.trailer_tire_age) : null,
      trailer_total_weight_kg: data.trailer_total_weight_kg ? Number(data.trailer_total_weight_kg) : null,
      trailer_tuev: data.trailer_tuev ?? null,
      trailer_tuev_until: data.trailer_tuev_until || null,
      trailer_material: (data.trailer_material as 'steel' | 'aluminum' | 'other' | null) || null,
      trailer_description: data.trailer_description || null,
    } as ListingFormData;
  };

  const validateBasic = () => {
    const data = getValues();
    if (!data.title || data.title.length < 3) {
      toastError('Pflichtfeld fehlt', 'Bitte geben Sie einen Titel (mind. 3 Zeichen) ein.');
      setStep(0); return false;
    }
    if (!data.brand) {
      toastError('Pflichtfeld fehlt', 'Bitte geben Sie eine Marke ein.');
      setStep(0); return false;
    }
    if (!data.model) {
      toastError('Pflichtfeld fehlt', 'Bitte geben Sie ein Modell ein.');
      setStep(0); return false;
    }
    if (!data.price || Number(data.price) <= 0) {
      toastError('Pflichtfeld fehlt', 'Bitte geben Sie einen gültigen Preis ein.');
      setStep(0); return false;
    }
    if (!data.boat_type) {
      toastError('Pflichtfeld fehlt', 'Bitte wählen Sie einen Bootstyp aus.');
      setStep(0); return false;
    }
    return true;
  };

  const handleSave = async (andSubmit = false, silent = false): Promise<boolean> => {
    if (!validateBasic()) return false;
    setSaving(true);
    if (silent) setAutoSaveStatus('saving');
    try {
      const result = await onSave(buildCleanData(), silent);
      if (result?.id) {
        setSavedId(result.id);
        savedSuccessfully.current = true;
      }
      if (!silent) toastSuccess('Inserat gespeichert');
      if (silent) setAutoSaveStatus('saved');

      if (andSubmit && onSubmit) {
        const id = result?.id || savedId;
        if (id) {
          setSubmitting(true);
          await onSubmit(id);
          setSubmitting(false);
        }
      }
      return true;
    } catch (err: unknown) {
      if (!silent) {
        toastError(
          'Speichern fehlgeschlagen',
          err instanceof Error ? err.message : 'Bitte überprüfen Sie Ihre Eingaben.'
        );
      }
      if (silent) setAutoSaveStatus(null);
      return false;
    } finally {
      setSaving(false);
      setSubmitting(false);
      if (silent) setTimeout(() => setAutoSaveStatus(null), 3000);
    }
  };

  // Auto-save on every "Weiter" click before advancing
  const handleNext = async () => {
    if (!validateBasic()) return;
    const saved = await handleSave(false, true);
    if (saved) setStep(s => Math.min(s + 1, STEP_TITLES.length - 1));
  };

  // Tab click: auto-save first if navigating to images tab without a saved listing ID
  const handleTabClick = async (i: number) => {
    if (i === 1 && !savedId && !listingId) {
      if (!validateBasic()) return;
      const saved = await handleSave(false, true);
      if (!saved) return;
    }
    setStep(i);
  };

  const currentListingId = savedId || listingId;
  const hasTrailer = watch('has_trailer');
  const trailerTuev = watch('trailer_tuev');
  const watchedPrice = watch('price');
  const watchedBrand = watch('brand');

  return (
    <div className="max-w-3xl">
      {/* Tab Navigation — always shown */}
      <div className="mb-8">
        <div className="flex gap-1 flex-wrap items-center">
          {STEP_TITLES.map((title, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleTabClick(i)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                i === step
                  ? 'bg-navy-600 text-white border-navy-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-navy-400 hover:text-navy-700'
              }`}
            >
              <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-xs ${
                i === step ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
              }`}>{i + 1}</span>
              {title}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            {autoSaveStatus === 'saving' && <span className="text-xs text-gray-400 animate-pulse">Wird gespeichert…</span>}
            {autoSaveStatus === 'saved' && <span className="text-xs text-green-600">✓ Gespeichert</span>}
          </div>
        </div>
      </div>

      <form>
        {/* Step 0: Basic Info */}
        {step === 0 && (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-navy-900 pb-2 border-b border-gray-200">Grunddaten</h3>
            <Input label="Titel des Inserats" required {...register('title')} error={errors.title?.message} placeholder="z.B. Bayliner 185 Bowrider – gepflegtes Motorboot" />
            <div className="grid grid-cols-2 gap-4">
              <BrandAutocomplete
                label="Marke"
                required
                value={watchedBrand}
                onChange={(v) => setValue('brand', v, { shouldValidate: true, shouldDirty: true })}
                error={errors.brand?.message}
                placeholder="z.B. Bayliner"
              />
              <Input label="Modell" required {...register('model')} error={errors.model?.message} placeholder="z.B. 185 Bowrider" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Baujahr" type="number" required min={1900} max={new Date().getFullYear() + 1} {...register('year')} error={errors.year?.message} />
              <div>
                <Input label="Preis (€)" type="number" required min={0} {...register('price')} error={errors.price?.message} placeholder="z.B. 25000" />
                {watchedPrice > 0 && (() => {
                  const { rate, amount } = getProvisionInfo(Number(watchedPrice));
                  return (
                    <div className="mt-1.5 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
                      <span className="font-semibold">Provision: {rate.toString().replace('.', ',')} %</span>
                      <span className="text-blue-600">= {formatPrice(amount)}</span>
                    </div>
                  );
                })()}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Bootstyp"
                required
                options={Object.entries(BOAT_TYPES).map(([v, l]) => ({ value: v, label: l }))}
                placeholder="Bitte wählen"
                {...register('boat_type')}
                error={errors.boat_type?.message}
              />
              <Select
                label="Zustand"
                options={Object.entries(CONDITIONS).map(([v, l]) => ({ value: v, label: l }))}
                placeholder="Bitte wählen"
                {...register('condition')}
              />
            </div>
          </div>
        )}

        {/* Step 1: Images */}
        {step === 1 && (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-navy-900 pb-2 border-b border-gray-200">Bilder</h3>
            {currentListingId ? (
              <ImageUpload
                listingId={currentListingId}
                images={images}
                onImagesChange={setImages}
              />
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                Grunddaten werden automatisch gespeichert, bevor Sie Bilder hochladen können. Klicken Sie auf "Grunddaten" und dann auf "Weiter".
              </div>
            )}
          </div>
        )}

        {/* Step 2: Technical */}
        {step === 2 && (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-navy-900 pb-2 border-b border-gray-200">Technische Details</h3>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Länge (m)" type="number" step="0.1" {...register('length_m')} error={errors.length_m?.message} />
              <Input label="Breite (m)" type="number" step="0.1" {...register('width_m')} />
              <Input label="Tiefgang (m)" type="number" step="0.1" {...register('draft_m')} />
            </div>
            <Input label="Verdrängung (kg)" type="number" {...register('displacement_kg')} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Motortyp" {...register('engine_type')} placeholder="z.B. Mercruiser 4.3L" />
              <Input label="Anzahl Motoren" type="number" min={0} max={10} {...register('engine_count')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Motorleistung (PS)" type="number" {...register('engine_power_hp')} />
              <Input label="Betriebsstunden (h)" type="number" {...register('engine_hours')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Kraftstoff"
                options={Object.entries(FUEL_TYPES).map(([v, l]) => ({ value: v, label: l }))}
                placeholder="Bitte wählen"
                {...register('fuel_type')}
              />
              <Select
                label="CE-Kategorie"
                options={Object.entries(CE_CATEGORIES).map(([v, l]) => ({ value: v, label: l }))}
                placeholder="Bitte wählen"
                {...register('ce_category')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Kabinen" type="number" min={0} {...register('cabins')} />
              <Input label="Schlafplätze" type="number" min={0} {...register('berths')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Badezimmer" type="number" min={0} {...register('bathrooms')} />
              <Input label="Max. Passagiere" type="number" min={0} {...register('max_passengers')} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Frischwasser (L)" type="number" {...register('fresh_water_l')} />
              <Input label="Abwasser (L)" type="number" {...register('waste_water_l')} />
              <Input label="Treibstofftank (L)" type="number" {...register('fuel_capacity_l')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Antriebsart"
                options={[
                  { value: 'z_antrieb', label: 'Z-Antrieb' },
                  { value: 'wellenantrieb', label: 'Wellenantrieb' },
                  { value: 'jetantrieb', label: 'Jetantrieb' },
                  { value: 'saildrive', label: 'Saildrive' },
                  { value: 'aussenborder', label: 'Außenborder' },
                  { value: 'other', label: 'Sonstiges' },
                ]}
                placeholder="Bitte wählen"
                {...register('drive_type')}
              />
              <Input label="Antrieb Typ / Bezeichnung" {...register('drive_description')} placeholder="z.B. Bravo 3, DPS-A, ..." />
            </div>
          </div>
        )}

        {/* Step 3: Equipment */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-navy-900 pb-2 border-b border-gray-200">Ausstattung & Ausrüstung</h3>
            <Controller
              name="navigation_equipment"
              control={control}
              render={({ field }) => (
                <EquipmentSection
                  label="Navigationsausstattung"
                  presets={NAVIGATION_EQUIPMENT}
                  value={field.value || []}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              name="safety_equipment"
              control={control}
              render={({ field }) => (
                <EquipmentSection
                  label="Sicherheitsausstattung"
                  presets={SAFETY_EQUIPMENT}
                  value={field.value || []}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              name="comfort_features"
              control={control}
              render={({ field }) => (
                <EquipmentSection
                  label="Komfort & Extras"
                  presets={COMFORT_FEATURES}
                  value={field.value || []}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        )}

        {/* Step 4: Location + Description */}
        {step === 4 && (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-navy-900 pb-2 border-b border-gray-200">Standort & Beschreibung</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Standort Stadt" {...register('location_city')} placeholder="z.B. Hamburg" />
              <Input label="Standort Land" {...register('location_country')} placeholder="Deutschland" />
            </div>
            <Input label="Liegeplatz" {...register('berth_location')} placeholder="z.B. Marina Hamm, Box 42" />
            <Input label="Material" {...register('material')} placeholder="z.B. GFK, Aluminium, Holz" />
            <Input
              label="Video-URL (optional)"
              {...register('video_url')}
              placeholder="https://youtube.com/..."
              hint="YouTube oder Vimeo Link"
            />
            {/* Trailer */}
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-3 p-4 bg-gray-50">
                <input
                  type="checkbox"
                  id="has_trailer"
                  {...register('has_trailer')}
                  className="rounded border-gray-300 text-navy-600 focus:ring-navy-500 h-4 w-4"
                />
                <label htmlFor="has_trailer" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                  Trailer ist im Preis inbegriffen
                </label>
              </div>
              {hasTrailer && (
                <div className="p-4 space-y-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Trailer-Details (optional)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Baujahr Trailer" type="number" min={1900} max={new Date().getFullYear() + 1} {...register('trailer_year')} placeholder="z.B. 2015" />
                    <Input label="Reifenalter (Jahre)" type="number" min={0} max={99} {...register('trailer_tire_age')} placeholder="z.B. 3" />
                  </div>
                  <Input label="Gesamtgewicht (kg)" type="number" min={0} {...register('trailer_total_weight_kg')} placeholder="z.B. 1500" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Material</label>
                    <select
                      {...register('trailer_material')}
                      className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white"
                    >
                      <option value="">– bitte wählen –</option>
                      <option value="steel">Stahl</option>
                      <option value="aluminum">Aluminium</option>
                      <option value="other">Sonstiges</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="trailer_tuev"
                      {...register('trailer_tuev')}
                      className="rounded border-gray-300 text-navy-600 focus:ring-navy-500 h-4 w-4"
                    />
                    <label htmlFor="trailer_tuev" className="text-sm font-medium text-gray-700 cursor-pointer">
                      TÜV vorhanden
                    </label>
                  </div>
                  {trailerTuev && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">TÜV gültig bis</label>
                      <input
                        type="month"
                        {...register('trailer_tuev_until')}
                        className="h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                      />
                    </div>
                  )}
                  <Textarea
                    label="Beschreibung Trailer (optional)"
                    rows={3}
                    {...register('trailer_description')}
                    placeholder="Zustand, Besonderheiten, Zubehör..."
                  />
                </div>
              )}
            </div>
            <Textarea
              label="Fahrzeugbeschreibung"
              rows={8}
              {...register('description')}
              placeholder="Beschreiben Sie Ihr Boot detailliert. Zustand, Geschichte, besondere Merkmale, Stärken, bekannte Mängel..."
              hint="Maximale Zeichenanzahl: 5.000"
            />
          </div>
        )}
      </form>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep(s => Math.max(s - 1, 0))}
          disabled={step === 0}
        >
          <ChevronLeft className="h-4 w-4" />
          Zurück
        </Button>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleSave(false)}
            loading={saving && !submitting}
          >
            <Save className="h-4 w-4" />
            Speichern
          </Button>

          {step < STEP_TITLES.length - 1 ? (
            <Button type="button" onClick={handleNext} loading={saving}>
              Weiter
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            onSubmit && (
              <Button
                type="button"
                variant="success"
                onClick={() => handleSubmit(() => handleSave(true))()}
                loading={submitting}
              >
                <Send className="h-4 w-4" />
                Zur Prüfung einreichen
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
