import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  message: z.string().min(10).max(2000),
  listing_id: z.string().uuid().optional(),
  // Honeypot: bots fill this in, humans leave it empty
  website: z.string().max(0, 'Spam detected').optional(),
});
