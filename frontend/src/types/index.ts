export type UserRole = 'admin' | 'seller';

export interface Profile {
  id: string;
  role: UserRole;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  birth_date: string | null;
  street: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  email?: string;
}

export type ListingStatus =
  | 'draft'
  | 'submitted'
  | 'checkup_required'
  | 'checkup_scheduled'
  | 'checkup_completed'
  | 'published'
  | 'rejected'
  | 'archived'
  | 'sold';

export type BoatType =
  | 'motorboat'
  | 'sailboat'
  | 'yacht'
  | 'catamaran'
  | 'inflatable'
  | 'jet_ski'
  | 'houseboat'
  | 'fishing'
  | 'other';

export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'other';
export type Condition = 'new' | 'like_new' | 'good' | 'fair' | 'needs_work';
export type CECategory = 'A' | 'B' | 'C' | 'D';

export interface ListingImage {
  id: string;
  listing_id: string;
  storage_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
  url?: string;
}

export interface Listing {
  id: string;
  seller_id: string;
  title: string;
  slug: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  boat_type: BoatType;
  condition: Condition | null;
  length_m: number | null;
  width_m: number | null;
  draft_m: number | null;
  displacement_kg: number | null;
  engine_type: string | null;
  engine_count: number | null;
  engine_power_hp: number | null;
  fuel_type: FuelType | null;
  engine_hours: number | null;
  cabins: number | null;
  berths: number | null;
  bathrooms: number | null;
  max_passengers: number | null;
  fresh_water_l: number | null;
  waste_water_l: number | null;
  fuel_capacity_l: number | null;
  drive_type: string | null;
  drive_description: string | null;
  ce_category: CECategory | null;
  material: string | null;
  location_city: string | null;
  location_country: string | null;
  berth_location: string | null;
  navigation_equipment: string[] | null;
  safety_equipment: string[] | null;
  comfort_features: string[] | null;
  video_url: string | null;
  description: string | null;
  status: ListingStatus;
  admin_notes: string | null;
  rejection_reason: string | null;
  checkup_date: string | null;
  checkup_notes: string | null;
  ka_title: string | null;
  ka_description: string | null;
  has_trailer: boolean;
  trailer_year: number | null;
  trailer_tire_age: number | null;
  trailer_total_weight_kg: number | null;
  trailer_tuev: boolean | null;
  trailer_tuev_until: string | null;
  trailer_material: string | null;
  trailer_description: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  published_at: string | null;
  sold_at: string | null;
  listing_images?: ListingImage[];
  listing_status_history?: ListingStatusHistory[];
  primary_image?: string | null;
  seller_display?: string;
  profiles?: {
    id: string;
    first_name: string;
    last_name: string;
    phone?: string;
    email?: string;
  };
}

export interface ListingStatusHistory {
  id: string;
  listing_id: string;
  from_status: ListingStatus | null;
  to_status: ListingStatus;
  notes: string | null;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

export interface ContactRequest {
  id: string;
  listing_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  listings?: {
    title: string;
    slug: string;
  };
}

export interface SellerContract {
  id: string;
  user_id: string;
  contract_url: string | null;
  contract_version: string;
  accepted_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ListingFormData {
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  boat_type: BoatType;
  condition?: Condition;
  length_m?: number | null;
  width_m?: number | null;
  draft_m?: number | null;
  displacement_kg?: number | null;
  engine_type?: string | null;
  engine_count?: number | null;
  engine_power_hp?: number | null;
  fuel_type?: FuelType | null;
  engine_hours?: number | null;
  cabins?: number | null;
  berths?: number | null;
  bathrooms?: number | null;
  max_passengers?: number | null;
  fresh_water_l?: number | null;
  waste_water_l?: number | null;
  fuel_capacity_l?: number | null;
  drive_type?: string | null;
  drive_description?: string | null;
  ce_category?: CECategory | null;
  material?: string | null;
  location_city?: string | null;
  location_country?: string | null;
  berth_location?: string | null;
  navigation_equipment?: string[];
  safety_equipment?: string[];
  comfort_features?: string[];
  video_url?: string | null;
  description?: string | null;
  has_trailer?: boolean;
  trailer_year?: number | null;
  trailer_tire_age?: number | null;
  trailer_total_weight_kg?: number | null;
  trailer_tuev?: boolean | null;
  trailer_tuev_until?: string | null;
  trailer_material?: string | null;
  trailer_description?: string | null;
}
