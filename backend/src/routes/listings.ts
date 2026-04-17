import { Router, Request, Response } from 'express';
import { supabasePublic, supabaseAdmin } from '../lib/supabase';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      search, brand, boat_type, min_price, max_price,
      min_year, max_year, fuel_type, condition,
      sort = 'newest', page = '1', limit = '12'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 12));
    const offset = (pageNum - 1) * limitNum;

    let query = supabasePublic
      .from('listings')
      .select(`
        id, title, slug, brand, model, year, price, boat_type, condition,
        length_m, engine_power_hp, fuel_type, location_city, location_country,
        status, published_at,
        listing_images(storage_path, is_primary, sort_order)
      `, { count: 'exact' })
      .eq('status', 'published');

    if (search) {
      // Strip PostgREST operator characters (comma, parentheses, quotes) to prevent filter injection
      const safeSearch = String(search).replace(/[,'"()\[\]{}\\]/g, '').substring(0, 100).trim();
      if (safeSearch) {
        query = query.or(`title.ilike.%${safeSearch}%,brand.ilike.%${safeSearch}%,model.ilike.%${safeSearch}%,location_city.ilike.%${safeSearch}%`);
      }
    }
    if (brand) query = query.ilike('brand', `%${brand}%`);
    if (boat_type) query = query.eq('boat_type', boat_type as string);
    if (min_price) query = query.gte('price', Number(min_price));
    if (max_price) query = query.lte('price', Number(max_price));
    if (min_year) query = query.gte('year', Number(min_year));
    if (max_year) query = query.lte('year', Number(max_year));
    if (fuel_type) query = query.eq('fuel_type', fuel_type as string);
    if (condition) query = query.eq('condition', condition as string);

    switch (sort) {
      case 'price_asc': query = query.order('price', { ascending: true }); break;
      case 'price_desc': query = query.order('price', { ascending: false }); break;
      case 'year_desc': query = query.order('year', { ascending: false }); break;
      default: query = query.order('published_at', { ascending: false });
    }

    query = query.range(offset, offset + limitNum - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    // Get primary images separately for listings without images
    const listingsWithImages = data?.map(listing => {
      const images = (listing.listing_images as Array<{storage_path: string; is_primary: boolean; sort_order: number}>) || [];
      const primaryImage = images.find(img => img.is_primary) || images.sort((a, b) => a.sort_order - b.sort_order)[0];
      return {
        ...listing,
        listing_images: undefined,
        primary_image: primaryImage ? primaryImage.storage_path : null,
      };
    });

    res.json({
      data: listingsWithImages || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil((count || 0) / limitNum),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Inserate konnten nicht geladen werden' });
  }
});

router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { data: listing, error } = await supabasePublic
      .from('listings')
      .select(`
        *,
        listing_images(id, storage_path, file_name, is_primary, sort_order)
      `)
      .eq('slug', req.params.slug)
      .eq('status', 'published')
      .single();

    if (error || !listing) {
      res.status(404).json({ error: 'Inserat nicht gefunden' });
      return;
    }

    // Fetch seller profile via admin client to bypass RLS (profiles are not public)
    const { data: sellerProfile } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', listing.seller_id)
      .single();
    const sellerDisplay = sellerProfile?.first_name
      ? `${sellerProfile.first_name}${sellerProfile.last_name ? ' ' + sellerProfile.last_name.charAt(0) + '.' : ''}`
      : 'Verkäufer';

    const images = ((listing.listing_images as Array<{id: string; storage_path: string; file_name: string; is_primary: boolean; sort_order: number}>) || [])
      .sort((a, b) => a.sort_order - b.sort_order);

    res.json({
      ...listing,
      profiles: undefined,
      seller_display: sellerDisplay,
      listing_images: images,
    });
  } catch (err) {
    res.status(500).json({ error: 'Inserat konnte nicht geladen werden' });
  }
});

// GET /listings/:id/checklist (public - only for published listings)
router.get('/:id/checklist', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabasePublic
      .from('boat_checklists').select('*').eq('listing_id', req.params.id).eq('is_published', true).maybeSingle();
    if (error) throw error;
    res.json(data || null);
  } catch (err) {
    res.status(500).json({ error: 'Checkliste konnte nicht geladen werden' });
  }
});

export default router;
