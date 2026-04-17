import { v4 as uuidv4 } from 'uuid';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabasePublic } from '../lib/supabase';

const BUCKET = 'boat-images';
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Verify the actual file signature (magic bytes) rather than trusting the
 * client-supplied MIME type, which can be trivially spoofed.
 */
function checkMagicBytes(buf: Buffer): boolean {
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true;
  // WebP: RIFF????WEBP  (bytes 0-3 = "RIFF", bytes 8-11 = "WEBP")
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return true;
  return false;
}

export const imageService = {
  validateFile(file: Express.Multer.File): string | null {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return 'Nur JPEG, PNG und WebP Dateien sind erlaubt.';
    }
    if (file.size > MAX_SIZE) {
      return 'Datei zu groß. Maximal 10MB erlaubt.';
    }
    // Verify actual file content, not just the client-supplied MIME header
    if (file.buffer.length < 12 || !checkMagicBytes(file.buffer)) {
      return 'Ungültige Datei: Kein gültiges Bild-Format erkannt.';
    }
    return null;
  },

  async uploadImage(
    listingId: string,
    file: Express.Multer.File,
    userClient?: SupabaseClient
  ): Promise<{ path: string; publicUrl: string }> {
    const ext = file.mimetype.split('/')[1].replace('jpeg', 'jpg');
    const fileName = `${uuidv4()}.${ext}`;
    const storagePath = `listings/${listingId}/${fileName}`;

    // Use user client if provided (works with storage RLS), fall back to admin
    const storageClient = userClient || supabasePublic;

    const { error } = await storageClient.storage
      .from(BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload fehlgeschlagen: ${error.message}`);
    }

    const { data: urlData } = supabasePublic.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    return {
      path: storagePath,
      publicUrl: urlData.publicUrl,
    };
  },

  async deleteImage(storagePath: string, userClient?: SupabaseClient): Promise<void> {
    const storageClient = userClient || supabasePublic;
    const { error } = await storageClient.storage
      .from(BUCKET)
      .remove([storagePath]);

    if (error) {
      // Throw so callers know the storage file was not removed
      throw new Error(`Storage delete failed: ${error.message}`);
    }
  },

  getPublicUrl(storagePath: string): string {
    const { data } = supabasePublic.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);
    return data.publicUrl;
  },
};
