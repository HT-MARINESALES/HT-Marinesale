import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { requireAdmin } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';
import { adminUpdateListingSchema, changeStatusSchema } from '../validators/listings';
import { listingService } from '../services/listingService';
import { emailService } from '../services/emailService';
import { config } from '../lib/config';

const contractUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

function isPdf(buf: Buffer): boolean {
  return buf.length >= 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46; // %PDF
}

const router = Router();
router.use(requireAdmin);

// ============================================================
// LISTINGS
// ============================================================

router.get('/listings', async (req: Request, res: Response) => {
  try {
    const { status, search, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const offset = (pageNum - 1) * limitNum;

    let query = req.db
      .from('listings')
      .select(`
        id, title, slug, brand, model, year, price, boat_type, status,
        created_at, submitted_at, published_at, sold_at, admin_notes,
        profiles!listings_seller_id_fkey(first_name, last_name, id),
        listing_images(storage_path, is_primary, sort_order)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status && status !== 'all') query = query.eq('status', status as string);
    if (search) {
      const safeSearch = String(search).replace(/[,'"()\[\]{}\\]/g, '').substring(0, 100).trim();
      if (safeSearch) query = query.or(`title.ilike.%${safeSearch}%,brand.ilike.%${safeSearch}%`);
    }
    query = query.range(offset, offset + limitNum - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    res.json({
      data: data || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil((count || 0) / limitNum),
    });
  } catch (err) {
    res.status(500).json({ error: 'Inserate konnten nicht geladen werden' });
  }
});

router.get('/listings/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await req.db
      .from('listings')
      .select(`
        *,
        profiles!listings_seller_id_fkey(id, first_name, last_name, email, phone),
        listing_images(id, storage_path, file_name, file_size, mime_type, is_primary, sort_order, created_at),
        listing_status_history(id, from_status, to_status, notes, created_at,
          profiles!listing_status_history_changed_by_fkey(first_name, last_name))
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !data) { res.status(404).json({ error: 'Inserat nicht gefunden' }); return; }

    // Fetch change history separately (table may not exist yet)
    let listing_changes: unknown[] = [];
    try {
      const { data: changes } = await supabaseAdmin
        .from('listing_changes')
        .select('id, changed_at, changes, profiles!listing_changes_changed_by_fkey(first_name, last_name)')
        .eq('listing_id', req.params.id)
        .order('changed_at', { ascending: false });
      listing_changes = changes || [];
    } catch { /* listing_changes table may not exist yet */ }

    res.json({ ...data, listing_changes });
  } catch (err) {
    res.status(500).json({ error: 'Inserat konnte nicht geladen werden' });
  }
});

router.put('/listings/:id', async (req: Request, res: Response) => {
  try {
    const parsed = adminUpdateListingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Ungültige Daten', details: parsed.error.flatten() });
      return;
    }
    const { data, error } = await req.db
      .from('listings')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Inserat konnte nicht aktualisiert werden' });
  }
});

router.put('/listings/:id/status', async (req: Request, res: Response) => {
  try {
    const parsed = changeStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Ungültiger Status', details: parsed.error.flatten() });
      return;
    }

    const { data: existing, error: fetchError } = await req.db
      .from('listings')
      .select(`*, profiles!listings_seller_id_fkey(id, first_name, last_name, email)`)
      .eq('id', req.params.id)
      .single();

    if (fetchError || !existing) { res.status(404).json({ error: 'Inserat nicht gefunden' }); return; }

    const updates: Record<string, unknown> = {
      status: parsed.data.status,
      updated_at: new Date().toISOString(),
    };
    if (parsed.data.rejection_reason) updates.rejection_reason = parsed.data.rejection_reason;
    if (parsed.data.checkup_date) updates.checkup_date = parsed.data.checkup_date;
    if (parsed.data.status === 'published') updates.published_at = new Date().toISOString();
    if (parsed.data.status === 'sold') updates.sold_at = new Date().toISOString();

    const { data, error } = await req.db
      .from('listings')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    await req.db.from('listing_status_history').insert({
      listing_id: req.params.id,
      from_status: existing.status,
      to_status: parsed.data.status,
      changed_by: req.user!.id,
      notes: parsed.data.notes || null,
    });

    // Email notifications using email stored in profiles
    const seller = existing.profiles as { id: string; first_name: string; last_name: string; email?: string } | null;
    const sellerEmail = seller?.email;

    if (sellerEmail && parsed.data.status === 'published') {
      emailService.sendListingApproved({
        sellerEmail,
        sellerName: `${seller!.first_name} ${seller!.last_name}`,
        listingTitle: existing.title,
        slug: existing.slug,
      }).catch(console.error);
    }
    if (sellerEmail && parsed.data.status === 'rejected' && parsed.data.rejection_reason) {
      emailService.sendListingRejected({
        sellerEmail,
        sellerName: `${seller!.first_name} ${seller!.last_name}`,
        listingTitle: existing.title,
        reason: parsed.data.rejection_reason,
      }).catch(console.error);
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Status konnte nicht geändert werden' });
  }
});

router.delete('/listings/:id', async (req: Request, res: Response) => {
  try {
    const { error } = await req.db.from('listings').delete().eq('id', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Inserat konnte nicht gelöscht werden' });
  }
});

// POST /admin/listings/:id/contact-checkup – Email seller about checkup
router.post('/listings/:id/contact-checkup', async (req: Request, res: Response) => {
  try {
    const parsed = z.object({ message: z.string().max(1000).optional() }).safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: 'Ungültige Eingabe' }); return; }
    const { message } = parsed.data;
    const { data: listing, error } = await req.db
      .from('listings')
      .select(`*, profiles!listings_seller_id_fkey(id, first_name, last_name, email)`)
      .eq('id', req.params.id)
      .single();

    if (error || !listing) { res.status(404).json({ error: 'Inserat nicht gefunden' }); return; }

    const seller = listing.profiles as { id: string; first_name: string; last_name: string; email?: string } | null;
    if (!seller?.email) { res.status(400).json({ error: 'Verkäufer hat keine E-Mail-Adresse' }); return; }

    // Change status to checkup_required
    await req.db.from('listings')
      .update({ status: 'checkup_required', updated_at: new Date().toISOString() })
      .eq('id', req.params.id);

    await req.db.from('listing_status_history').insert({
      listing_id: req.params.id,
      from_status: listing.status,
      to_status: 'checkup_required',
      changed_by: req.user!.id,
      notes: message || 'Check-up Kontaktanfrage gesendet',
    });

    await emailService.sendCheckupRequest({
      sellerEmail: seller.email,
      sellerName: `${seller.first_name} ${seller.last_name}`,
      listingTitle: listing.title,
      message: message || undefined,
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kontaktanfrage konnte nicht gesendet werden' });
  }
});

router.put('/listings/:id/ka', async (req: Request, res: Response) => {
  try {
    const parsed = z.object({
      ka_title: z.string().max(50).optional().nullable(),
      ka_description: z.string().max(1500).optional().nullable(),
    }).safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: 'Ungültige Eingabe' }); return; }
    const { ka_title, ka_description } = parsed.data;
    const { data, error } = await req.db
      .from('listings')
      .update({ ka_title: ka_title || null, ka_description: ka_description || null, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'KA-Inhalt konnte nicht gespeichert werden' });
  }
});

router.get('/listings/:id/ka/generate', async (req: Request, res: Response) => {
  try {
    const { data: listing, error } = await req.db.from('listings').select('*').eq('id', req.params.id).single();
    if (error || !listing) { res.status(404).json({ error: 'Inserat nicht gefunden' }); return; }
    res.json({
      ka_title: listingService.generateKATitle(listing),
      ka_description: listingService.generateKADescription(listing),
    });
  } catch (err) {
    res.status(500).json({ error: 'KA-Inhalt konnte nicht generiert werden' });
  }
});

// ============================================================
// SELLERS
// ============================================================

router.get('/sellers', async (req: Request, res: Response) => {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, parseInt(limit as string) || 20);
    const offset = (pageNum - 1) * limitNum;

    let query = req.db
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('role', 'seller')
      .order('created_at', { ascending: false });

    if (search) {
      const safeSearch = String(search).replace(/[,'"()\[\]{}\\]/g, '').substring(0, 100).trim();
      if (safeSearch) query = query.or(`first_name.ilike.%${safeSearch}%,last_name.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%`);
    }
    query = query.range(offset, offset + limitNum - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    const sellerIds = (data || []).map(s => s.id);
    const { data: listingCounts } = await req.db.from('listings').select('seller_id').in('seller_id', sellerIds);
    const countMap: Record<string, number> = {};
    (listingCounts || []).forEach(l => { countMap[l.seller_id] = (countMap[l.seller_id] || 0) + 1; });

    const { data: contractData } = await req.db
      .from('seller_contracts')
      .select('user_id, contract_version, accepted_at')
      .in('user_id', sellerIds)
      .order('accepted_at', { ascending: false });
    const contractMap: Record<string, { contract_version: string; accepted_at: string }> = {};
    (contractData || []).forEach((c: any) => {
      if (!contractMap[c.user_id]) contractMap[c.user_id] = { contract_version: c.contract_version, accepted_at: c.accepted_at };
    });

    res.json({
      data: (data || []).map(s => ({ ...s, listing_count: countMap[s.id] || 0, contract: contractMap[s.id] || null })),
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil((count || 0) / limitNum),
    });
  } catch (err) {
    res.status(500).json({ error: 'Verkäufer konnten nicht geladen werden' });
  }
});

router.get('/sellers/:id', async (req: Request, res: Response) => {
  try {
    const { data: profile, error: profileError } = await req.db
      .from('profiles').select('*').eq('id', req.params.id).single();

    if (profileError || !profile) { res.status(404).json({ error: 'Verkäufer nicht gefunden' }); return; }

    const { data: listings } = await req.db
      .from('listings')
      .select('id, title, slug, status, price, created_at, published_at')
      .eq('seller_id', req.params.id)
      .order('created_at', { ascending: false });

    const { data: contracts } = await req.db
      .from('seller_contracts').select('*').eq('user_id', req.params.id)
      .order('accepted_at', { ascending: false });

    // Enrich contracts with download URLs
    const contractsWithUrls = await Promise.all((contracts || []).map(async (c: any) => {
      if (!c.contract_version) return c;
      const { data: doc } = await supabaseAdmin
        .from('contract_documents')
        .select('storage_path, file_name')
        .eq('version', c.contract_version)
        .single();
      if (!doc?.storage_path) return c;
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('contracts')
        .getPublicUrl(doc.storage_path);
      return { ...c, download_url: publicUrl, file_name: doc.file_name };
    }));

    res.json({ ...profile, listings: listings || [], contracts: contractsWithUrls });
  } catch (err) {
    res.status(500).json({ error: 'Verkäufer konnte nicht geladen werden' });
  }
});

router.put('/sellers/:id', async (req: Request, res: Response) => {
  try {
    const { is_active, first_name, last_name, phone } = req.body;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof is_active === 'boolean') updates.is_active = is_active;
    if (first_name) updates.first_name = first_name;
    if (last_name) updates.last_name = last_name;
    if (phone !== undefined) updates.phone = phone;

    const { data, error } = await req.db
      .from('profiles').update(updates).eq('id', req.params.id).select().single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Verkäufer konnte nicht aktualisiert werden' });
  }
});

router.delete('/sellers/:id', async (req: Request, res: Response) => {
  try {
    if (config.supabaseServiceRoleKey) {
      // Full delete via auth admin API (requires service role)
      const { error } = await supabaseAdmin.auth.admin.deleteUser(req.params.id);
      if (error) throw error;
    } else {
      // Fallback: deactivate instead of delete
      await req.db.from('profiles')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', req.params.id);
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Verkäufer konnte nicht gelöscht/deaktiviert werden' });
  }
});

// ============================================================
// CONTACTS
// ============================================================

router.get('/contacts', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', unread } = req.query;
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, parseInt(limit as string) || 20);
    const offset = (pageNum - 1) * limitNum;

    // Use supabaseAdmin to bypass RLS — this is an admin-only endpoint
    let query = supabaseAdmin
      .from('contact_requests')
      .select('*, listings(title, slug)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (unread === 'true') query = query.eq('is_read', false);
    query = query.range(offset, offset + limitNum - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    res.setHeader('Cache-Control', 'no-store');
    res.json({ data: data || [], total: count || 0, page: pageNum, limit: limitNum, pages: Math.ceil((count || 0) / limitNum) });
  } catch (err) {
    console.error('Contacts error:', err);
    res.status(500).json({ error: 'Kontaktanfragen konnten nicht geladen werden' });
  }
});

router.put('/contacts/:id/read', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('contact_requests').update({ is_read: true }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Status konnte nicht aktualisiert werden' });
  }
});

router.delete('/contacts/:id', async (req: Request, res: Response) => {
  try {
    const { error } = await supabaseAdmin
      .from('contact_requests')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Nachricht konnte nicht gelöscht werden' });
  }
});

// GET /admin/dashboard/stats
router.get('/dashboard/stats', async (req: Request, res: Response) => {
  try {
    const [listingsResult, contactsResult] = await Promise.all([
      req.db.from('listings').select('status'),
      req.db.from('contact_requests').select('is_read').eq('is_read', false),
    ]);

    const listings = listingsResult.data || [];
    const statusCounts: Record<string, number> = {};
    listings.forEach(l => { statusCounts[l.status] = (statusCounts[l.status] || 0) + 1; });

    res.json({
      listings: {
        total: listings.length,
        byStatus: statusCounts,
        pending: (statusCounts['submitted'] || 0) + (statusCounts['checkup_required'] || 0) + (statusCounts['checkup_scheduled'] || 0) + (statusCounts['checkup_completed'] || 0),
      },
      unreadContacts: contactsResult.data?.length || 0,
    });
  } catch (err) {
    res.status(500).json({ error: 'Statistiken konnten nicht geladen werden' });
  }
});

// ============================================================
// CONTRACT DOCUMENTS
// ============================================================

// GET /admin/contract — list all contract versions
router.get('/contract', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('contract_documents')
      .select('id, version, file_name, file_size, uploaded_at, storage_path')
      .order('uploaded_at', { ascending: false });

    if (error) throw error;

    const docs = (data || []).map(doc => {
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('contracts')
        .getPublicUrl(doc.storage_path);
      return { ...doc, download_url: publicUrl };
    });

    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: 'Verträge konnten nicht geladen werden' });
  }
});

// POST /admin/contract — upload new PDF
router.post('/contract', contractUpload.single('contract'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Keine Datei hochgeladen' });
      return;
    }

    if (req.file.mimetype !== 'application/pdf') {
      res.status(400).json({ error: 'Nur PDF-Dateien sind erlaubt' });
      return;
    }

    if (!isPdf(req.file.buffer)) {
      res.status(400).json({ error: 'Ungültiges PDF-Format' });
      return;
    }

    if (req.file.size > 20 * 1024 * 1024) {
      res.status(400).json({ error: 'Datei zu groß (max. 20 MB)' });
      return;
    }

    const { count } = await supabaseAdmin
      .from('contract_documents')
      .select('id', { count: 'exact', head: true });

    const version = `v${(count || 0) + 1}`;
    const storagePath = `kommissionsvertrag-${version}.pdf`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('contracts')
      .upload(storagePath, req.file.buffer, { contentType: 'application/pdf', upsert: false });

    if (uploadError) throw uploadError;

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('contract_documents')
      .insert({
        version,
        file_name: req.file.originalname,
        storage_path: storagePath,
        file_size: req.file.size,
        uploaded_by: req.user!.id,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('contracts')
      .getPublicUrl(storagePath);

    res.status(201).json({ ...inserted, download_url: publicUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Vertrag konnte nicht hochgeladen werden' });
  }
});

// GET /admin/listings/:id/checklist
router.get('/listings/:id/checklist', async (req: Request, res: Response) => {
  try {
    const { data, error } = await req.db
      .from('boat_checklists').select('*').eq('listing_id', req.params.id).maybeSingle();
    if (error) throw error;
    res.json(data || null);
  } catch (err) {
    res.status(500).json({ error: 'Checkliste konnte nicht geladen werden' });
  }
});

// PUT /admin/listings/:id/checklist
router.put('/listings/:id/checklist', async (req: Request, res: Response) => {
  try {
    const parsed = z.object({
      data: z.record(z.any()),
      overall_rating: z.number().int().min(1).max(5).nullable().optional(),
      is_published: z.boolean().optional(),
    }).safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: 'Ungültige Daten' }); return; }

    const { data: existing } = await req.db
      .from('boat_checklists').select('id').eq('listing_id', req.params.id).maybeSingle();

    if (existing) {
      const { data, error } = await req.db
        .from('boat_checklists')
        .update({ data: parsed.data.data, overall_rating: parsed.data.overall_rating ?? null, is_published: parsed.data.is_published ?? false, updated_at: new Date().toISOString() })
        .eq('listing_id', req.params.id)
        .select().single();
      if (error) throw error;
      res.json(data);
    } else {
      const { data, error } = await req.db
        .from('boat_checklists')
        .insert({ listing_id: req.params.id, data: parsed.data.data, overall_rating: parsed.data.overall_rating ?? null, is_published: parsed.data.is_published ?? false, created_by: req.user!.id })
        .select().single();
      if (error) throw error;
      res.status(201).json(data);
    }
  } catch (err) {
    res.status(500).json({ error: 'Checkliste konnte nicht gespeichert werden' });
  }
});

export default router;
