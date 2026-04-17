import { z } from 'zod';

export const createListingSchema = z.object({
  title: z.string().min(3).max(200),
  brand: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  price: z.number().positive(),
  boat_type: z.enum(['motorboat', 'sailboat', 'yacht', 'catamaran', 'inflatable', 'jet_ski', 'houseboat', 'fishing', 'other']),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'needs_work']).optional(),
  length_m: z.number().positive().optional().nullable(),
  width_m: z.number().positive().optional().nullable(),
  draft_m: z.number().positive().optional().nullable(),
  displacement_kg: z.number().positive().optional().nullable(),
  engine_type: z.string().max(100).optional().nullable(),
  engine_count: z.number().int().min(0).max(10).optional().nullable(),
  engine_power_hp: z.number().positive().optional().nullable(),
  fuel_type: z.enum(['petrol', 'diesel', 'electric', 'hybrid', 'other']).optional().nullable(),
  engine_hours: z.number().positive().optional().nullable(),
  cabins: z.number().int().min(0).optional().nullable(),
  berths: z.number().int().min(0).optional().nullable(),
  bathrooms: z.number().int().min(0).optional().nullable(),
  max_passengers: z.number().int().min(0).optional().nullable(),
  fresh_water_l: z.number().positive().optional().nullable(),
  waste_water_l: z.number().positive().optional().nullable(),
  fuel_capacity_l: z.number().positive().optional().nullable(),
  drive_type: z.enum(['z_antrieb', 'wellenantrieb', 'jetantrieb', 'saildrive', 'aussenborder', 'other']).optional().nullable(),
  drive_description: z.string().max(200).optional().nullable(),
  ce_category: z.enum(['A', 'B', 'C', 'D']).optional().nullable(),
  material: z.string().max(100).optional().nullable(),
  location_city: z.string().max(100).optional().nullable(),
  location_country: z.string().max(100).optional().nullable(),
  berth_location: z.string().max(200).optional().nullable(),
  navigation_equipment: z.array(z.string()).optional().nullable(),
  safety_equipment: z.array(z.string()).optional().nullable(),
  comfort_features: z.array(z.string()).optional().nullable(),
  video_url: z.string().url().refine(
    url => /^https:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\//.test(url),
    { message: 'Nur YouTube oder Vimeo Links erlaubt' }
  ).optional().nullable().or(z.literal('')),
  description: z.string().max(5000).optional().nullable(),
  has_trailer: z.boolean().optional(),
  trailer_year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional().nullable(),
  trailer_tire_age: z.number().int().min(0).max(99).optional().nullable(),
  trailer_total_weight_kg: z.number().int().min(0).optional().nullable(),
  trailer_tuev: z.boolean().optional().nullable(),
  trailer_tuev_until: z.string().max(20).optional().nullable(),
  trailer_material: z.enum(['steel', 'aluminum', 'other']).optional().nullable(),
  trailer_description: z.string().max(2000).optional().nullable(),
});

export const updateListingSchema = createListingSchema.partial();

export const adminUpdateListingSchema = updateListingSchema.extend({
  admin_notes: z.string().optional().nullable(),
  rejection_reason: z.string().optional().nullable(),
  checkup_date: z.string().optional().nullable(),
  checkup_notes: z.string().optional().nullable(),
  ka_title: z.string().max(50).optional().nullable(),
  ka_description: z.string().max(1500).optional().nullable(),
});

export const changeStatusSchema = z.object({
  status: z.enum(['draft', 'submitted', 'checkup_required', 'checkup_scheduled', 'checkup_completed', 'published', 'rejected', 'archived', 'sold']),
  notes: z.string().optional(),
  rejection_reason: z.string().optional(),
  checkup_date: z.string().optional(),
});
