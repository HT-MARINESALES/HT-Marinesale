import { config } from '../lib/config';

/** Prevent email header injection by stripping CR/LF from header values. */
function sanitizeHeader(value: string): string {
  return String(value).replace(/[\r\n\t]/g, ' ').substring(0, 200);
}

/** HTML-escape user-supplied data before embedding in email HTML body. */
function esc(value: string | undefined | null): string {
  if (!value) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const emailStyles = `
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
  .header { background: #0f3460; color: white; padding: 30px 40px; text-align: center; }
  .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
  .header p { margin: 8px 0 0; opacity: 0.85; font-size: 14px; }
  .body { padding: 30px 40px; }
  .body h2 { color: #0f3460; margin-top: 0; }
  .info-row { display: flex; gap: 10px; margin-bottom: 12px; border-bottom: 1px solid #eef0f3; padding-bottom: 12px; }
  .info-label { color: #666; font-weight: 600; min-width: 160px; font-size: 14px; }
  .info-value { color: #333; font-size: 14px; }
  .btn { display: inline-block; background: #0f3460; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 20px; }
  .footer { background: #f4f6f9; padding: 20px 40px; text-align: center; color: #888; font-size: 12px; }
  .alert { background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 15px; margin: 20px 0; }
  .success { background: #d4edda; border: 1px solid #28a745; border-radius: 6px; padding: 15px; margin: 20px 0; }
  .danger { background: #f8d7da; border: 1px solid #dc3545; border-radius: 6px; padding: 15px; margin: 20px 0; }
`;

export function contactFormTemplate(data: {
  name: string;
  email: string;
  phone?: string;
  message: string;
  listingTitle?: string;
}): { subject: string; html: string } {
  return {
    subject: sanitizeHeader(`Neue Kontaktanfrage von ${data.name}${data.listingTitle ? ` - ${data.listingTitle}` : ''}`),
    html: `<!DOCTYPE html><html><head><style>${emailStyles}</style></head><body>
      <div class="container">
        <div class="header">
          <h1>HT-Marineservice</h1>
          <p>Neue Kontaktanfrage eingegangen</p>
        </div>
        <div class="body">
          <h2>Neue Kontaktanfrage</h2>
          ${data.listingTitle ? `<div class="info-row"><span class="info-label">Betreff (Inserat):</span><span class="info-value">${esc(data.listingTitle)}</span></div>` : ''}
          <div class="info-row"><span class="info-label">Name:</span><span class="info-value">${esc(data.name)}</span></div>
          <div class="info-row"><span class="info-label">E-Mail:</span><span class="info-value"><a href="mailto:${esc(data.email)}">${esc(data.email)}</a></span></div>
          ${data.phone ? `<div class="info-row"><span class="info-label">Telefon:</span><span class="info-value">${esc(data.phone)}</span></div>` : ''}
          <div style="margin-top: 20px;">
            <div class="info-label" style="margin-bottom: 8px;">Nachricht:</div>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; white-space: pre-wrap; font-size: 14px;">${esc(data.message)}</div>
          </div>
        </div>
        <div class="footer">HT-Marineservice &bull; ${config.contactEmail}</div>
      </div>
    </body></html>`,
  };
}

export function newSellerTemplate(data: {
  firstName: string;
  lastName: string;
  email: string;
}): { subject: string; html: string } {
  return {
    subject: sanitizeHeader(`Neuer Verkäufer registriert: ${data.firstName} ${data.lastName}`),
    html: `<!DOCTYPE html><html><head><style>${emailStyles}</style></head><body>
      <div class="container">
        <div class="header">
          <h1>HT-Marineservice</h1>
          <p>Neuer Verkäufer registriert</p>
        </div>
        <div class="body">
          <h2>Neuer Verkäufer</h2>
          <div class="info-row"><span class="info-label">Name:</span><span class="info-value">${esc(data.firstName)} ${esc(data.lastName)}</span></div>
          <div class="info-row"><span class="info-label">E-Mail:</span><span class="info-value">${esc(data.email)}</span></div>
          <a href="${config.frontendUrl}/admin/verkaeufer" class="btn">Im Admin-Bereich anzeigen</a>
        </div>
        <div class="footer">HT-Marineservice &bull; ${config.contactEmail}</div>
      </div>
    </body></html>`,
  };
}

export function newListingSubmittedTemplate(data: {
  sellerName: string;
  listingTitle: string;
  listingId: string;
  price: number;
}): { subject: string; html: string } {
  return {
    subject: sanitizeHeader(`Neues Inserat eingereicht: ${data.listingTitle}`),
    html: `<!DOCTYPE html><html><head><style>${emailStyles}</style></head><body>
      <div class="container">
        <div class="header">
          <h1>HT-Marineservice</h1>
          <p>Neues Inserat eingereicht</p>
        </div>
        <div class="body">
          <h2>Inserat zur Überprüfung</h2>
          <div class="info-row"><span class="info-label">Titel:</span><span class="info-value">${esc(data.listingTitle)}</span></div>
          <div class="info-row"><span class="info-label">Verkäufer:</span><span class="info-value">${esc(data.sellerName)}</span></div>
          <div class="info-row"><span class="info-label">Preis:</span><span class="info-value">${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(data.price)}</span></div>
          <a href="${config.frontendUrl}/admin/inserate/${esc(data.listingId)}" class="btn">Inserat überprüfen</a>
        </div>
        <div class="footer">HT-Marineservice &bull; ${config.contactEmail}</div>
      </div>
    </body></html>`,
  };
}

export function listingApprovedTemplate(data: {
  sellerName: string;
  listingTitle: string;
  slug: string;
}): { subject: string; html: string } {
  return {
    subject: sanitizeHeader(`Ihr Inserat wurde freigeschalten: ${data.listingTitle}`),
    html: `<!DOCTYPE html><html><head><style>${emailStyles}</style></head><body>
      <div class="container">
        <div class="header">
          <h1>HT-Marineservice</h1>
          <p>Ihr Inserat ist jetzt live!</p>
        </div>
        <div class="body">
          <h2>Herzlichen Glückwunsch, ${esc(data.sellerName)}!</h2>
          <div class="success">
            <strong>Ihr Inserat wurde erfolgreich überprüft und freigeschalten.</strong>
          </div>
          <div class="info-row"><span class="info-label">Inserat:</span><span class="info-value">${esc(data.listingTitle)}</span></div>
          <p>Ihr Boot ist jetzt auf unserer Plattform sichtbar und potenzielle Käufer können es finden.</p>
          <a href="${config.frontendUrl}/boote/${esc(data.slug)}" class="btn">Inserat ansehen</a>
        </div>
        <div class="footer">HT-Marineservice &bull; ${config.contactEmail}</div>
      </div>
    </body></html>`,
  };
}

export function checkupRequestTemplate(data: {
  sellerName: string;
  listingTitle: string;
  message?: string;
}): { subject: string; html: string } {
  return {
    subject: sanitizeHeader(`Check-up Termin für Ihr Inserat: ${data.listingTitle}`),
    html: `<!DOCTYPE html><html><head><style>${emailStyles}</style></head><body>
      <div class="container">
        <div class="header">
          <h1>HT-Marineservice</h1>
          <p>Check-up Terminanfrage</p>
        </div>
        <div class="body">
          <h2>Hallo ${esc(data.sellerName)},</h2>
          <div class="alert">
            <strong>Für Ihr Inserat ist ein technischer Check-up erforderlich.</strong>
          </div>
          <div class="info-row"><span class="info-label">Inserat:</span><span class="info-value">${esc(data.listingTitle)}</span></div>
          <p>Unser HT-Marineservice Check-up ist ein wichtiger Schritt, um das Vertrauen potenzieller Käufer zu stärken und den bestmöglichen Preis für Ihr Boot zu erzielen.</p>
          ${data.message ? `<div style="margin-top: 20px;"><div class="info-label" style="margin-bottom: 8px;">Nachricht vom Admin:</div><div style="background: #f8f9fa; padding: 15px; border-radius: 6px; white-space: pre-wrap; font-size: 14px;">${esc(data.message)}</div></div>` : ''}
          <p>Bitte antworten Sie auf diese E-Mail oder rufen Sie uns an, um einen Termin zu vereinbaren.</p>
          <a href="mailto:${config.contactEmail}?subject=Check-up Termin: ${encodeURIComponent(data.listingTitle)}" class="btn">Termin vereinbaren</a>
        </div>
        <div class="footer">HT-Marineservice &bull; ${config.contactEmail}</div>
      </div>
    </body></html>`,
  };
}

export function listingRejectedTemplate(data: {
  sellerName: string;
  listingTitle: string;
  reason: string;
}): { subject: string; html: string } {
  return {
    subject: sanitizeHeader(`Ihr Inserat wurde abgelehnt: ${data.listingTitle}`),
    html: `<!DOCTYPE html><html><head><style>${emailStyles}</style></head><body>
      <div class="container">
        <div class="header">
          <h1>HT-Marineservice</h1>
          <p>Inserat abgelehnt</p>
        </div>
        <div class="body">
          <h2>Hallo ${esc(data.sellerName)},</h2>
          <div class="danger">
            <strong>Ihr Inserat wurde leider nicht genehmigt.</strong>
          </div>
          <div class="info-row"><span class="info-label">Inserat:</span><span class="info-value">${esc(data.listingTitle)}</span></div>
          <div style="margin-top: 20px;">
            <div class="info-label" style="margin-bottom: 8px;">Ablehnungsgrund:</div>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; white-space: pre-wrap; font-size: 14px;">${esc(data.reason)}</div>
          </div>
          <p>Sie können Ihr Inserat bearbeiten und erneut einreichen. Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
          <a href="${config.frontendUrl}/seller/inserate" class="btn">Zum Verkäufer-Bereich</a>
        </div>
        <div class="footer">HT-Marineservice &bull; ${config.contactEmail}</div>
      </div>
    </body></html>`,
  };
}
