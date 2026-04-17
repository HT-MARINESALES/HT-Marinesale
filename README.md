# HT-Marineservice – Bootsmarktplatz

Professionelle Vermittlungsplattform für Boote mit Check-up-Service. Nur geprüfte Boote werden veröffentlicht.

---

## Inhaltsverzeichnis

1. [Schnellstart](#schnellstart)
2. [Projektstruktur](#projektstruktur)
3. [Architektur](#architektur)
4. [Rollenmodell](#rollenmodell)
5. [Status-Workflow (Inserate)](#status-workflow-inserate)
6. [Kleinanzeigen-Helfer](#kleinanzeigen-helfer)
7. [Sicherheitskonzept](#sicherheitskonzept)
8. [Umgebungsvariablen](#umgebungsvariablen)
9. [Datenbank-Setup](#datenbank-setup)
10. [Admin-Benutzer anlegen](#admin-benutzer-anlegen)
11. [E-Mail-Konfiguration](#e-mail-konfiguration)
12. [Deployment](#deployment)
13. [Secrets-Rotation (Wichtig!)](#secrets-rotation-wichtig)
14. [Erweiterungsmöglichkeiten](#erweiterungsmöglichkeiten)

---

## Schnellstart

### 1. Voraussetzungen

- Node.js 20+
- npm 10+
- Supabase-Projekt (bereits eingerichtet)

### 2. Repository klonen und Dependencies installieren

```bash
cd ht-marineservice
npm install
```

### 3. Umgebungsvariablen konfigurieren

**Backend** – `backend/.env`:
```bash
cp backend/.env.example backend/.env
```
Dann folgende Werte eintragen (Details siehe [Umgebungsvariablen](#umgebungsvariablen)):
- `SUPABASE_SERVICE_ROLE_KEY` – aus Supabase Dashboard > Project Settings > API
- `JWT_SECRET` – aus Supabase Dashboard > Project Settings > API > JWT Secret
- SMTP-Zugangsdaten für E-Mail-Versand

**Frontend** – `frontend/.env`:
```bash
cp frontend/.env.example frontend/.env
```
Die Datei ist bereits mit den korrekten Supabase-Werten vorkonfiguriert.

### 4. Admin-Benutzer anlegen

Siehe [Admin-Benutzer anlegen](#admin-benutzer-anlegen).

### 5. Anwendung starten

```bash
npm run dev
```

Startet:
- **Backend** auf http://localhost:3001
- **Frontend** auf http://localhost:5173

---

## Projektstruktur

```
ht-marineservice/
├── package.json              # Root-Workspace (npm workspaces)
├── .gitignore                # .env-Dateien sind ausgeschlossen
├── README.md
│
├── frontend/                 # React 18 + TypeScript + Vite
│   ├── src/
│   │   ├── pages/
│   │   │   ├── public/       # Startseite, Bootsliste, Detailseite, Kontakt
│   │   │   ├── auth/         # Login, Registrierung, Passwort vergessen
│   │   │   ├── seller/       # Verkäufer-Dashboard, Inserate, Formular
│   │   │   └── admin/        # Admin-Dashboard, Verwaltung
│   │   ├── components/
│   │   │   ├── ui/           # Button, Input, Badge, Modal, Toast, etc.
│   │   │   ├── layout/       # PublicLayout, DashboardLayout, AdminLayout
│   │   │   ├── listings/     # ListingCard, ImageGallery, Filters, Upload
│   │   │   └── forms/        # ListingForm (5-Schritte-Wizard), ContactForm
│   │   ├── hooks/            # useAuth, useListings, useToast
│   │   ├── lib/              # supabase.ts, api.ts, utils.ts
│   │   ├── stores/           # Zustand Auth-Store
│   │   └── types/            # TypeScript-Typen
│   └── .env.example
│
├── backend/                  # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── routes/           # auth, listings, seller, admin, contact, images
│   │   ├── services/         # listingService, userService, emailService, imageService
│   │   ├── middleware/       # requireAuth, requireSeller, requireAdmin, rateLimiter
│   │   ├── validators/       # Zod-Schemas für alle Eingaben
│   │   ├── email/            # HTML-E-Mail-Templates (Deutsch)
│   │   └── lib/              # supabase.ts (Admin-Client), config.ts
│   └── .env.example
│
└── supabase/
    ├── migrations/           # Dokumentation der angewendeten Migrationen
    └── seed.sql              # Admin-Setup-SQL
```

---

## Architektur

```
Browser → React SPA (Vite)
               │
               ├──► Supabase Auth  (Login, Session-Verwaltung)
               │
               └──► Express API (localhost:3001)
                         │
                         ├──► Supabase DB (PostgreSQL + RLS)
                         ├──► Supabase Storage (Bilder)
                         └──► NodeMailer (SMTP)
```

**Sicherheitsschichten:**
1. **Frontend:** Supabase-Auth + geschützte Routen (React Router)
2. **Backend:** JWT-Verifizierung + Rollenprüfung (Middleware)
3. **Datenbank:** Row Level Security (RLS) als letzte Verteidigung

---

## Rollenmodell

| Aktion | Besucher | Verkäufer | Admin |
|--------|----------|-----------|-------|
| Inserate ansehen (veröffentlicht) | ✓ | ✓ | ✓ |
| Inserate durchsuchen/filtern | ✓ | ✓ | ✓ |
| Kontaktformular | ✓ | ✓ | ✓ |
| Eigene Inserate anlegen | – | ✓ | ✓ |
| Eigene Inserate bearbeiten | – | ✓ (Entwurf) | ✓ |
| Bilder hochladen | – | ✓ | ✓ |
| Inserate einreichen | – | ✓ | ✓ |
| Inserate freischalten | – | – | ✓ |
| Alle Inserate verwalten | – | – | ✓ |
| Verkäufer verwalten | – | – | ✓ |
| Kontaktanfragen einsehen | – | – | ✓ |

**Wichtig:** Admins können sich nicht öffentlich registrieren. Admin-Konten werden manuell über das Supabase Dashboard + Seed-SQL angelegt.

---

## Status-Workflow (Inserate)

```
Verkäufer              Admin
    │                    │
    ▼                    │
[draft]                  │  ← Verkäufer legt Entwurf an
    │                    │
    ▼ (einreichen)       │
[submitted]              │  ← Admin sieht neues Inserat
    │                    ▼
    │          [checkup_required]  ← Admin: Check-up erforderlich
    │                    │
    │                    ▼
    │          [checkup_scheduled] ← Admin: Termin vereinbart
    │                    │
    │                    ▼
    │          [checkup_completed] ← Admin: Check-up abgeschlossen
    │                    │
    │            ┌───────┴────────┐
    │            ▼                ▼
    │       [published]       [rejected]  ← Admin: Ablehnung mit Begründung
    │            │
    │      ┌─────┴──────┐
    │      ▼            ▼
    │  [archived]     [sold]
    │
    └──► Verkäufer kann zurück zu [draft] bei [rejected]
```

**Status-Labels (Deutsch):**
| Status | Anzeige | Farbe |
|--------|---------|-------|
| draft | Entwurf | Grau |
| submitted | Eingereicht | Blau |
| checkup_required | Check-up Erforderlich | Amber |
| checkup_scheduled | Check-up Geplant | Orange |
| checkup_completed | Check-up Abgeschlossen | Teal |
| published | Veröffentlicht | Grün |
| rejected | Abgelehnt | Rot |
| archived | Archiviert | Grau |
| sold | Verkauft | Lila |

---

## Kleinanzeigen-Helfer

Für jedes Inserat gibt es im Admin-Bereich einen **"Kleinanzeigen Helfer"**:

- **Auto-Titel** (max. 50 Zeichen): `{Jahr} {Marke} {Modell} {Länge}m {PS}PS {Typ}`
- **Auto-Beschreibung** (~1.500 Zeichen): Strukturierte Bootsdaten auf Deutsch
- **Copy-Buttons** für Titel und Beschreibung
- **Bilddownload**: Links zu allen Bildern des Inserats
- **Tipps**: Hinweise zu Kleinanzeigen-Anforderungen

**Wichtig:** Nur Copy-Paste-Vorbereitung, keine automatische Veröffentlichung.

---

## Sicherheitskonzept

### Authentifizierung & Autorisierung
- Supabase Auth für JWT-Ausstellung und Session-Verwaltung
- Backend verifiziert JWT bei jedem Aufruf via `supabaseAdmin.auth.getUser(token)`
- Rollenprüfung auf Backend-Ebene (nicht nur Frontend)
- RLS in Supabase als zusätzliche Datenbank-Schutzebene

### Datenschutz
- Verkäuferdaten werden im öffentlichen Bereich anonymisiert (nur Vorname + Nachnamen-Kürzel)
- Keine direkten Kontaktdaten in der öffentlichen API
- DSGVO-konforme Zustimmung bei Registrierung (mit Timestamp + Version gespeichert)

### Rate Limiting
- Allgemein: 100 Anfragen / 15 Minuten pro IP
- Kontaktformular: 5 Anfragen / Stunde pro IP

### Uploads
- Nur JPEG, PNG, WebP erlaubt
- Max. 10 MB pro Bild
- Max. 10 Bilder pro Inserat
- UUID-basierte Dateinamen (kein Originalname)
- Speicherung in Supabase Storage mit öffentlichen URLs

### Input-Validierung
- Zod-Schemas auf Backend und Frontend
- Keine SQL-Injection möglich (Supabase-Client)
- Keine XSS-Risiken (React escapet standardmäßig)

### Secrets
- Alle Secrets ausschließlich über `.env`-Dateien
- `.env`-Dateien im `.gitignore` (niemals ins Repository)
- Service Role Key nur im Backend (nie im Frontend)
- Anon Key nur im Frontend

---

## Umgebungsvariablen

### Backend (`backend/.env`)

```env
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=https://DEIN-PROJEKT-REF.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...  # Supabase Dashboard > API > anon key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...  # Supabase Dashboard > API > service_role

# JWT-Verifizierung
JWT_SECRET=...  # Supabase Dashboard > Project Settings > API > JWT Secret

# SMTP für E-Mail-Versand
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=dein@email.de
SMTP_PASS=dein-smtp-passwort
SMTP_FROM=noreply@ht-marineservice.de

# Benachrichtigungs-Empfänger
CONTACT_EMAIL=deine@email.de

# Frontend-URL (für CORS)
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)

```env
VITE_SUPABASE_URL=https://DEIN-PROJEKT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...  # anon key (kein secret!)
VITE_API_URL=http://localhost:3001
```

### Wo findet man die Supabase-Keys?

1. **Supabase Dashboard** öffnen: https://supabase.com/dashboard
2. Projekt auswählen
3. **Project Settings** > **API**:
   - `anon public` → `VITE_SUPABASE_ANON_KEY` und `SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (**geheim, nur Backend!**)
   - `JWT Secret` → `JWT_SECRET` (**geheim, nur Backend!**)

---

## Datenbank-Setup

Die Migrationen wurden bereits über Supabase MCP angewendet. Die folgenden Tabellen existieren:

| Tabelle | Beschreibung |
|---------|-------------|
| `profiles` | Benutzerprofil (Admin & Verkäufer) |
| `seller_contracts` | Zustimmungsnachweis Kommissionsvertrag |
| `listings` | Bootsinserate |
| `listing_images` | Bilder pro Inserat |
| `listing_status_history` | Audit-Trail für Statusänderungen |
| `contact_requests` | Kontaktanfragen |

**Storage-Bucket:** `boat-images` (bereits erstellt, öffentlich lesbar)

### Falls Neukonfiguration nötig ist

Migrationen befinden sich als Dokumentation in `supabase/migrations/`. Die SQL-Skripte können bei Bedarf in einer neuen Supabase-Umgebung ausgeführt werden.

---

## Admin-Benutzer anlegen

**Schritt 1:** Supabase Dashboard > Authentication > Users > **Add user**
- Email: `admin@ht-marineservice.de`
- Password: sicheres Passwort setzen
- **Auto Confirm User**: aktivieren

**Schritt 2:** Die UUID des erstellten Benutzers kopieren

**Schritt 3:** In `supabase/seed.sql` die UUID eintragen und SQL ausführen:
```sql
UPDATE profiles
SET role = 'admin', first_name = 'Admin', last_name = 'HT-Marineservice', is_active = true
WHERE id = 'DEINE-UUID-HIER';
```

Dies kann über **Supabase Dashboard > SQL Editor** ausgeführt werden.

---

## E-Mail-Konfiguration

E-Mails werden über **NodeMailer** versendet. Ohne SMTP-Konfiguration werden E-Mails nur in der Konsole geloggt.

### Gmail-Konfiguration (empfohlen für Development)
1. Google-Konto > Sicherheit > 2FA aktivieren
2. App-Passwörter > neues App-Passwort für "Mail" erstellen
3. In `backend/.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=deine@gmail.com
   SMTP_PASS=xxxx-xxxx-xxxx-xxxx  # App-Passwort
   ```

### Automatische E-Mail-Benachrichtigungen
- Neue Kontaktanfrage → Admin-E-Mail (aus `CONTACT_EMAIL`)
- Neuer Verkäufer registriert → Admin
- Neues Inserat eingereicht → Admin
- Inserat freigegeben → Verkäufer
- Inserat abgelehnt (mit Begründung) → Verkäufer

---

## Deployment

### Production-Checkliste

- [ ] `NODE_ENV=production` im Backend setzen
- [ ] `FRONTEND_URL` auf die echte Domain setzen
- [ ] Alle Secrets rotieren (siehe [Secrets-Rotation](#secrets-rotation-wichtig))
- [ ] SMTP-Konfiguration testen
- [ ] Supabase RLS-Policies überprüfen
- [ ] HTTPS erzwingen
- [ ] Storage-Bucket korrekt konfiguriert

### Frontend-Deployment (z.B. Vercel/Netlify)
```bash
cd frontend
npm run build
# dist/ Verzeichnis deployen
```
Umgebungsvariablen im Hosting-Dashboard setzen.

### Backend-Deployment (z.B. Railway/Render)
```bash
cd backend
npm run build
npm start
```
Umgebungsvariablen in der Hosting-Plattform setzen.

---

## Secrets-Rotation (Wichtig!)

> ⚠️ **ACHTUNG:** Die Supabase-Zugangsdaten wurden während der Entwicklung im Chat sichtbar geteilt. Vor dem Go-Live müssen alle Secrets rotiert werden!

### So werden Keys rotiert:

1. **Supabase Anon Key & Service Role Key:**
   - Supabase Dashboard > Project Settings > API
   - "Regenerate" für den jeweiligen Key
   - Neue Keys in alle `.env`-Dateien eintragen

2. **JWT Secret:**
   - Supabase Dashboard > Project Settings > API > "Generate new JWT Secret"
   - Achtung: Alle bestehenden Sessions werden damit ungültig

3. **SMTP-Passwörter:**
   - Im E-Mail-Anbieter neues App-Passwort erstellen
   - Altes Passwort löschen

### Nach der Rotation
- Alle laufenden Instanzen neu starten
- Bestehende Benutzersessions werden bei JWT-Rotation ungültig (Benutzer müssen sich neu einloggen)

---

## Erweiterungsmöglichkeiten

### Kurzfristig (empfohlen)
- **Passwort-Änderung** für Verkäufer im Profil
- **Bildkompression** (z.B. mit `sharp`) vor dem Upload
- **Favoriten** für Besucher (lokaler Speicher)
- **Detailliertere Suchfilter** (Längenbereich, PS-Bereich)

### Mittelfristig
- **Automatisches Kleinanzeigen-Posting** via API (z.B. über eBay Kleinanzeigen API)
- **Push-Benachrichtigungen** für Statusänderungen
- **Mehrsprachigkeit** (DE/EN)
- **SEO-Optimierung**: SSR mit Next.js migrieren
- **Statistiken/Analytics** für Admin

### Langfristig
- **Direkte Zahlungsabwicklung** (Stripe/PayPal)
- **Live-Chat** für Interessent-zu-Admin-Kommunikation
- **Mobile App** (React Native)
- **Automatische Preisbewertung** basierend auf Marktdaten

---

## Tech Stack

| Bereich | Technologie |
|---------|-------------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS |
| Routing | React Router v6 |
| Server State | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Auth State | Zustand |
| Backend | Node.js, Express, TypeScript |
| Validierung | Zod |
| E-Mail | NodeMailer |
| Datenbank | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| RLS | Supabase Row Level Security |

---

## Lizenz

Proprietär – HT-Marineservice. Alle Rechte vorbehalten.
