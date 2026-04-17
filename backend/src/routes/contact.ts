import { Router, Request, Response } from 'express';
import { supabasePublic } from '../lib/supabase';
import { contactSchema } from '../validators/contact';
import { emailService } from '../services/emailService';
import { contactLimiter } from '../middleware/rateLimiter';

const router = Router();

// Email-based rate limit: max 3 submissions per email address per 24h.
// This prevents IP-rotation spam that bypasses the IP-based limiter.
const emailSubmissions = new Map<string, { count: number; firstAt: number }>();
const EMAIL_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const EMAIL_MAX = 3;

function checkEmailRateLimit(email: string): boolean {
  const now = Date.now();
  const key = email.toLowerCase();
  const entry = emailSubmissions.get(key);
  if (!entry || now - entry.firstAt > EMAIL_WINDOW_MS) {
    emailSubmissions.set(key, { count: 1, firstAt: now });
    return true;
  }
  if (entry.count >= EMAIL_MAX) return false;
  entry.count++;
  return true;
}

// Clean up old entries every hour to prevent memory growth
setInterval(() => {
  const now = Date.now();
  emailSubmissions.forEach((v, k) => {
    if (now - v.firstAt > EMAIL_WINDOW_MS) emailSubmissions.delete(k);
  });
}, 60 * 60 * 1000);

router.post('/', contactLimiter, async (req: Request, res: Response) => {
  try {
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Ungültige Daten', details: parsed.error.flatten() });
      return;
    }

    // Honeypot check: bots fill in the hidden "website" field, humans don't
    if (parsed.data.website) {
      // Return 201 so bots think they succeeded, but don't store anything
      res.status(201).json({ success: true });
      return;
    }

    // Email-based rate limit (IP rotation bypass protection)
    if (!checkEmailRateLimit(parsed.data.email)) {
      res.status(429).json({ error: 'Zu viele Anfragen von dieser E-Mail-Adresse. Bitte versuchen Sie es morgen erneut.' });
      return;
    }

    let listingTitle: string | undefined;
    if (parsed.data.listing_id) {
      const { data: listing } = await supabasePublic
        .from('listings')
        .select('title')
        .eq('id', parsed.data.listing_id)
        .single();
      listingTitle = listing?.title;
    }

    await supabasePublic.from('contact_requests').insert({
      listing_id: parsed.data.listing_id || null,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      message: parsed.data.message,
      is_read: false,
    });

    emailService.sendContactForm({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      message: parsed.data.message,
      listingTitle,
    }).catch(console.error);

    res.status(201).json({ success: true, message: 'Ihre Anfrage wurde erfolgreich gesendet.' });
  } catch (err) {
    res.status(500).json({ error: 'Anfrage konnte nicht gesendet werden' });
  }
});

export default router;
