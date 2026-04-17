import rateLimit from 'express-rate-limit';

// General API – covers all routes as a baseline
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Contact form – strict to prevent spam
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Zu viele Kontaktanfragen. Bitte versuchen Sie es in einer Stunde erneut.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth endpoints (login, register, password reset) – prevents brute force
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Zu viele Login-Versuche. Bitte warten Sie 15 Minuten.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Image uploads – prevents storage exhaustion (per IP, 60 uploads per 15 min)
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { error: 'Zu viele Bild-Uploads. Bitte warten Sie kurz.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Contract / PDF uploads – admin only, still limit to 10/hour to prevent abuse
export const contractUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Zu viele Datei-Uploads. Bitte versuchen Sie es in einer Stunde erneut.' },
  standardHeaders: true,
  legacyHeaders: false,
});
