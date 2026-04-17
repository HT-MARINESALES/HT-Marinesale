import { Router, Request, Response } from 'express';
import multer from 'multer';
import { requireSeller } from '../middleware/auth';
import { imageService } from '../services/imageService';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
});

router.use(requireSeller);

// POST /:listingId – upload image
router.post('/:listingId', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { listingId } = req.params;

    // Verify ownership via user-context client (RLS enforced)
    const { data: listing, error: listingError } = await req.db
      .from('listings').select('id, seller_id').eq('id', listingId).eq('seller_id', req.user!.id).single();

    if (listingError || !listing) { res.status(404).json({ error: 'Inserat nicht gefunden' }); return; }
    if (!req.file) { res.status(400).json({ error: 'Keine Datei hochgeladen' }); return; }

    const validationError = imageService.validateFile(req.file);
    if (validationError) { res.status(400).json({ error: validationError }); return; }

    const { count } = await req.db
      .from('listing_images').select('id', { count: 'exact' }).eq('listing_id', listingId);

    if ((count || 0) >= 10) {
      res.status(400).json({ error: 'Maximal 10 Bilder pro Inserat erlaubt' });
      return;
    }

    const { path: storagePath } = await imageService.uploadImage(listingId, req.file, req.db);

    const { data: existingImages } = await req.db
      .from('listing_images').select('sort_order, is_primary')
      .eq('listing_id', listingId).order('sort_order', { ascending: false }).limit(1);

    const maxSortOrder = existingImages && existingImages.length > 0 ? existingImages[0].sort_order : -1;
    const isPrimary = !existingImages || existingImages.length === 0;

    const { data: imageRecord, error: insertError } = await req.db
      .from('listing_images')
      .insert({
        listing_id: listingId,
        storage_path: storagePath,
        file_name: req.file.originalname,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        is_primary: isPrimary,
        sort_order: maxSortOrder + 1,
      })
      .select().single();

    if (insertError) throw insertError;

    res.status(201).json({ ...imageRecord, url: imageService.getPublicUrl(storagePath) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Bild konnte nicht hochgeladen werden' });
  }
});

// DELETE /:imageId
router.delete('/:imageId', async (req: Request, res: Response) => {
  try {
    const { data: image, error: fetchError } = await req.db
      .from('listing_images').select(`*, listings!inner(seller_id)`).eq('id', req.params.imageId).single();

    if (fetchError || !image) { res.status(404).json({ error: 'Bild nicht gefunden' }); return; }

    const listing = image.listings as { seller_id: string } | null;
    if (!listing || listing.seller_id !== req.user!.id) {
      res.status(403).json({ error: 'Zugriff verweigert' }); return;
    }

    await imageService.deleteImage(image.storage_path, req.db);

    const { error } = await req.db.from('listing_images').delete().eq('id', req.params.imageId);
    if (error) throw error;

    // If deleted was primary, set first remaining as primary
    if (image.is_primary) {
      const { data: remaining } = await req.db
        .from('listing_images').select('id').eq('listing_id', image.listing_id)
        .order('sort_order', { ascending: true }).limit(1);

      if (remaining && remaining.length > 0) {
        await req.db.from('listing_images').update({ is_primary: true }).eq('id', remaining[0].id);
      }
    }

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Bild konnte nicht gelöscht werden' });
  }
});

// PUT /:imageId/primary
router.put('/:imageId/primary', async (req: Request, res: Response) => {
  try {
    const { data: image, error: fetchError } = await req.db
      .from('listing_images').select(`*, listings!inner(seller_id)`).eq('id', req.params.imageId).single();

    if (fetchError || !image) { res.status(404).json({ error: 'Bild nicht gefunden' }); return; }

    const listing = image.listings as { seller_id: string } | null;
    if (!listing || listing.seller_id !== req.user!.id) {
      res.status(403).json({ error: 'Zugriff verweigert' }); return;
    }

    await req.db.from('listing_images').update({ is_primary: false }).eq('listing_id', image.listing_id);
    const { error } = await req.db.from('listing_images').update({ is_primary: true }).eq('id', req.params.imageId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Primärbild konnte nicht gesetzt werden' });
  }
});

// PUT /reorder
router.put('/reorder', async (req: Request, res: Response) => {
  try {
    const { order } = req.body as { order: Array<{ id: string; sort_order: number }> };
    if (!Array.isArray(order) || order.length === 0) {
      res.status(400).json({ error: 'Ungültige Reihenfolge' }); return;
    }
    if (order.length > 10) {
      res.status(400).json({ error: 'Maximal 10 Bilder erlaubt' }); return;
    }
    // Validate input types
    if (!order.every(o => typeof o.id === 'string' && typeof o.sort_order === 'number' && o.sort_order >= 0)) {
      res.status(400).json({ error: 'Ungültige Eingabedaten' }); return;
    }

    const imageIds = order.map(o => o.id);

    // OWNERSHIP CHECK: verify every image belongs to a listing owned by the current user
    const { data: images, error: fetchError } = await req.db
      .from('listing_images')
      .select('id, listings!inner(seller_id)')
      .in('id', imageIds);

    if (fetchError || !images || images.length !== imageIds.length) {
      res.status(403).json({ error: 'Zugriff verweigert' }); return;
    }

    const hasUnauthorized = (images as Array<{ id: string; listings: Array<{ seller_id: string }> }>).some(
      img => !img.listings?.[0] || img.listings[0].seller_id !== req.user!.id
    );
    if (hasUnauthorized) {
      res.status(403).json({ error: 'Zugriff verweigert' }); return;
    }

    await Promise.all(
      order.map(({ id, sort_order }) =>
        req.db.from('listing_images').update({ sort_order }).eq('id', id)
      )
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Reihenfolge konnte nicht geändert werden' });
  }
});

export default router;
