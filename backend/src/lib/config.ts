import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const configSchema = z.object({
  PORT: z.string().default('3001').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  // Optional – if missing, backend uses anon key with RLS (admin JWT still works via is_admin() function)
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),
  SMTP_HOST: z.string().default('smtp-mail.outlook.com'),
  SMTP_PORT: z.string().default('587').transform(Number),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default('noreply@ht-marineservice.de'),
  CONTACT_EMAIL: z.string().default('kontakt@ht-marineservice.de'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
});

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not set. Using anon key (RLS enforced). Image uploads require service role key.');
}

export const config = {
  port: Number(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@ht-marineservice.de',
  },
  contactEmail: process.env.CONTACT_EMAIL || 'kontakt@ht-marineservice.de',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};
