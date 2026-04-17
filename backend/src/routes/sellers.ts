import { Router, Request, Response } from 'express';
import { requireSeller } from '../middleware/auth';
import { createListingSchema, updateListingSchema } from '../validators/listings';
import { listingService } from '../services/listingService';
import { emailService } from '../services/emailService';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();
router.use(requireSeller);

// GET /seller/contract — seller's own contract acceptance info + PDF download URL
router.get('/contract', async (req: Request, res: Response) => {
  try {
    const { data: acceptance } = await req.db
      .from('seller_contracts')
      .select('id, contract_version, accepted_at, created_at')
      .eq('user_id', req.user!.id)
      .order('accepted_at', { ascending: false })
      .limit(1)
      .single();

    if (!acceptance) {
      res.status(404).json({ error: 'Kein Kommissionsvertrag gefunden' });
      return;
    }

    // Get the matching contract document for download URL
    const { data: doc } = await supabaseAdmin
      .from('contract_documents')
      .select('id, version, file_name, storage_path, uploaded_at')
      .eq('version', acceptance.contract_version)
      .single();

    let download_url: string | null = null;
    if (doc?.storage_path) {
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('contracts')
        .getPublicUrl(doc.storage_path);
      download_url = publicUrl;
    }

    res.json({
      ...acceptance,
      download_url,
      file_name: doc?.file_name || null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Vertrag konnte nicht geladen werden' });
  }
});

// GET seller's own listings
router.get('/listings', async (req: Request, res: Response) => {
  try {
    const { data, error } = await req.db
      .from('listings')
      .select(`*, listing_images(id, storage_path, is_primary, sort_order)`)
      .eq('seller_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Inserate konnten nicht geladen werden' });
  }
});

// GET single listing
router.get('/listings/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await req.db
      .from('listings')
      .select(`*, listing_images(id, storage_path, file_name, is_primary, sort_order)`)
      .eq('id', req.params.id)
      .eq('seller_id', req.user!.id)
      .single();

    if (error || !data) { res.status(404).json({ error: 'Inserat nicht gefunden' }); return; }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Inserat konnte nicht geladen werden' });
  }
});

// POST create listing
router.post('/listings', async (req: Request, res: Response) => {
  try {
    const parsed = createListingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Ungültige Daten', details: parsed.error.flatten() });
      return;
    }

    const slug = await listingService.createSlug(parsed.data.title, parsed.data.brand, parsed.data.model, parsed.data.year);

    const { data, error } = await req.db
      .from('listings')
      .insert({ ...parsed.data, seller_id: req.user!.id, slug, status: 'draft', video_url: parsed.data.video_url || null })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Inserat konnte nicht erstellt werden' });
  }
});

// PUT update listing (only draft/rejected)
router.put('/listings/:id', async (req: Request, res: Response) => {
  try {
    const { data: existing, error: fetchError } = await req.db
      .from('listings').select('*').eq('id', req.params.id).eq('seller_id', req.user!.id).single();

    if (fetchError || !existing) { res.status(404).json({ error: 'Inserat nicht gefunden' }); return; }
    if (!['draft', 'rejected', 'submitted', 'published'].includes(existing.status)) {
      res.status(400).json({ error: 'Nur Entwürfe, eingereichte, abgelehnte und veröffentlichte Inserate können bearbeitet werden' });
      return;
    }

    const parsed = updateListingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Ungültige Daten', details: parsed.error.flatten() });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('listings')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', req.params.id).eq('seller_id', req.user!.id)
      .select().single();

    if (error) { console.error('Listing update error:', error); throw error; }

    // Log field-level changes for published listings so admin can review them
    if (existing.status === 'published') {
      const TRACKED_FIELDS = [
        'title', 'brand', 'model', 'year', 'price', 'boat_type', 'condition',
        'length_m', 'width_m', 'draft_m', 'displacement_kg',
        'engine_type', 'engine_count', 'engine_power_hp', 'fuel_type', 'engine_hours',
        'cabins', 'berths', 'bathrooms', 'max_passengers', 'fresh_water_l', 'waste_water_l', 'fuel_capacity_l',
        'drive_type', 'drive_description',
        'ce_category', 'material', 'location_city', 'location_country', 'berth_location',
        'navigation_equipment', 'safety_equipment', 'comfort_features',
        'video_url', 'description', 'has_trailer',
      ];
      const changes: Record<string, { old: unknown; new: unknown }> = {};
      for (const field of TRACKED_FIELDS) {
        const oldVal = (existing as Record<string, unknown>)[field];
        const newVal = (parsed.data as Record<string, unknown>)[field];
        const oldStr = JSON.stringify(oldVal ?? null);
        const newStr = JSON.stringify(newVal ?? null);
        if (oldStr !== newStr) {
          changes[field] = { old: oldVal ?? null, new: newVal ?? null };
        }
      }
      if (Object.keys(changes).length > 0) {
        supabaseAdmin.from('listing_changes').insert({
          listing_id: req.params.id,
          changed_by: req.user!.id,
          changes,
        }).then(({ error: e }) => { if (e) console.error('listing_changes insert error:', e); });
      }
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Inserat konnte nicht aktualisiert werden' });
  }
});

// DELETE listing — allowed for draft, rejected, submitted, published, sold
// Not allowed once archived (terminal state managed by admin)
const DELETABLE_STATUSES = ['draft', 'rejected', 'submitted', 'published', 'sold'];

router.delete('/listings/:id', async (req: Request, res: Response) => {
  try {
    const { data: existing, error: fetchError } = await req.db
      .from('listings').select('status').eq('id', req.params.id).eq('seller_id', req.user!.id).single();

    if (fetchError || !existing) { res.status(404).json({ error: 'Inserat nicht gefunden' }); return; }
    if (!DELETABLE_STATUSES.includes(existing.status)) {
      res.status(400).json({ error: 'Dieses Inserat kann nicht mehr gelöscht werden' });
      return;
    }

    const { error } = await req.db.from('listings').delete().eq('id', req.params.id).eq('seller_id', req.user!.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Inserat konnte nicht gelöscht werden' });
  }
});

// POST restore archived listing to draft
router.post('/listings/:id/restore', async (req: Request, res: Response) => {
  try {
    const { data: existing, error: fetchError } = await req.db
      .from('listings').select('status').eq('id', req.params.id).eq('seller_id', req.user!.id).single();

    if (fetchError || !existing) { res.status(404).json({ error: 'Inserat nicht gefunden' }); return; }
    if (existing.status !== 'archived') {
      res.status(400).json({ error: 'Nur archivierte Inserate können wiederhergestellt werden' });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('listings')
      .update({ status: 'draft', updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('seller_id', req.user!.id)   // re-verify ownership even with admin client
      .select().single();

    if (error) throw error;

    await req.db.from('listing_status_history').insert({
      listing_id: req.params.id,
      from_status: 'archived',
      to_status: 'draft',
      changed_by: req.user!.id,
      notes: 'Durch Verkäufer als Entwurf wiederhergestellt',
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Inserat konnte nicht wiederhergestellt werden' });
  }
});

// POST submit for review
router.post('/listings/:id/submit', async (req: Request, res: Response) => {
  try {
    const { data: existing, error: fetchError } = await req.db
      .from('listings')
      .select(`*, profiles!listings_seller_id_fkey(first_name, last_name)`)
      .eq('id', req.params.id).eq('seller_id', req.user!.id).single();

    if (fetchError || !existing) { res.status(404).json({ error: 'Inserat nicht gefunden' }); return; }
    if (!['draft', 'rejected'].includes(existing.status)) {
      res.status(400).json({ error: 'Dieses Inserat kann nicht mehr eingereicht werden' });
      return;
    }

    const { data, error } = await req.db
      .from('listings')
      .update({ status: 'submitted', submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select().single();

    if (error) throw error;

    await req.db.from('listing_status_history').insert({
      listing_id: req.params.id,
      from_status: existing.status,
      to_status: 'submitted',
      changed_by: req.user!.id,
    });

    const profile = existing.profiles as { first_name: string; last_name: string } | null;
    emailService.sendListingSubmitted({
      sellerName: profile ? `${profile.first_name} ${profile.last_name}` : req.user!.email,
      listingTitle: existing.title,
      listingId: existing.id,
      price: existing.price,
    }).catch(console.error);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Inserat konnte nicht eingereicht werden' });
  }
});

export default router;
