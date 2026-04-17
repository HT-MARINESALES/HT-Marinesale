import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function getImageUrl(storagePath: string | null | undefined): string {
  if (!storagePath) return '/placeholder-boat.jpg';
  if (storagePath.startsWith('http')) return storagePath;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/boat-images/${storagePath}`;
}

export const BOAT_TYPES: Record<string, string> = {
  motorboat: 'Motorboot',
  sailboat: 'Segelboot',
  yacht: 'Yacht',
  catamaran: 'Katamaran',
  inflatable: 'Schlauchboot',
  jet_ski: 'Jetski',
  houseboat: 'Hausboot',
  fishing: 'Fischerboot',
  other: 'Sonstiges',
};

export const FUEL_TYPES: Record<string, string> = {
  petrol: 'Benzin',
  diesel: 'Diesel',
  electric: 'Elektrisch',
  hybrid: 'Hybrid',
  other: 'Sonstige',
};

export const CONDITIONS: Record<string, string> = {
  new: 'Neu',
  like_new: 'Wie neu',
  good: 'Gut',
  fair: 'Befriedigend',
  needs_work: 'Renovierungsbedarf',
};

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Entwurf',
  submitted: 'Eingereicht',
  checkup_required: 'Check-up Erforderlich',
  checkup_scheduled: 'Check-up Geplant',
  checkup_completed: 'Check-up Abgeschlossen',
  published: 'Veröffentlicht',
  rejected: 'Abgelehnt',
  archived: 'Archiviert',
  sold: 'Verkauft',
};

/** Berechnet die Provisions-Rate (%) basierend auf dem Verkaufspreis */
export function getProvisionRate(price: number): number {
  if (price <= 50000) return 8;
  if (price <= 150000) return 5;
  if (price <= 400000) return 3.5;
  return 2.5;
}

/** Gibt Provisions-Rate und -Betrag zurück */
export function getProvisionInfo(price: number): { rate: number; amount: number } {
  const rate = getProvisionRate(price);
  return { rate, amount: Math.round(price * rate) / 100 };
}

export const CE_CATEGORIES: Record<string, string> = {
  A: 'A - Hochsee',
  B: 'B - Offshore',
  C: 'C - Küstengewässer',
  D: 'D - Binnengewässer',
};
