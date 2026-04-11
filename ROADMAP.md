# Insomnia Tattoo — Roadmap & Strategie

> Ultima actualizare: 12 Aprilie 2026

---

## JURNAL TEHNIC — Ce s-a implementat

### Sesiunea 7 (11-12 Aprilie 2026) — Deploy live + bugfixuri critice

#### ✅ Deploy pe Vercel (inlocuire cPanel)
- cPanel shared hosting (cloud607.c-f.ro) nu suporta Node.js — doar PHP
- Migrat deploy pe **Vercel** (free tier) cu auto-deploy din GitHub (`lucutflorentin/insomnia`)
- Configurat environment variables pe Vercel (DATABASE_URL, JWT secrets, etc.)

#### ✅ Baza de date Railway MySQL
- MySQL-ul de pe cPanel avea portul 3306 firewalled (nu se putea accesa remote)
- Creat baza de date MySQL pe **Railway** (free tier)
- DATABASE_URL: `mysql://root:...@mainline.proxy.rlwy.net:40798/railway`
- Rulat `prisma migrate` + `db:seed` pe Railway

#### ✅ Conectare domeniu insomniatattoo.ro
- Configurat DNS: A record + CNAME www → Vercel
- SSL auto-generat de Vercel
- Site-ul live pe `https://insomniatattoo.ro`

#### ✅ Izolare admin de componentele publice
- Creat `src/components/layout/PublicOnlyComponents.tsx` — client component wrapper
- Foloseste `usePathname()` pentru a detecta paginile admin
- Wraps: `<CursorGlow />`, `<WhatsAppButton />`, `<CookieConsent />` — nu mai apar pe `/admin/*`

#### ✅ Dashboard admin imbunatatit
- `src/app/[locale]/admin/page.tsx` rescris complet:
  - Header cu salut personalizat ("Bun venit, [Nume]") + data curenta + badge rol
  - 4 stat cards: booking-uri noi, luna aceasta, confirmate, recenzii pending
  - Quick actions: Vezi booking-uri, Galerie, Disponibilitate (cu iconuri + descrieri)
  - Tabel booking-uri recente cu link detalii
  - Panou recenzii recente
- Adaugate ~15 chei i18n noi in `messages/ro.json` si `messages/en.json`

#### ✅ Fix Header auth detection
- `src/components/layout/Header.tsx` — API-ul returna `data.data` (nested), dar Header-ul citea `data.user`
- Fix: `data.user` → `data.data` pentru a detecta corect starea de autentificare

#### ✅ Fix admin redirect dupa login
- `src/app/[locale]/auth/login/page.tsx` — rolul era nested in `data.data.role`, dar login page citea `data.role`
- Fix: `const role = data.data?.role || data.role` — acum admin-ul e redirectionat corect catre `/admin`
- Aplicat fix pe ambele flow-uri: email login si Google OAuth

#### ✅ Fix noise texture z-index
- `src/app/globals.css` — `body::before` (noise texture overlay) avea `z-index: 50`
- Interferea cu overlay-uri si componente interactive
- Fix: `z-index: 50` → `z-index: 1`

#### ✅ Fix dead space sub footer (~3200px spatiu gol)
- **Cauza root:** `<motion.button>` in `ArtistCards.tsx` wrapa un `<Button>` component (care randeaza `<button>`) — HTML invalid (`<button>` in `<button>`)
- Eroarea de hydration facea React sa bail out si sa re-randeze, duplicand 4 sectiuni (GalleryHighlight, SocialProof, CTABanner, MapSection) direct in `<body>` in afara `<main>` wrapper
- **Fix:** `<motion.button>` → `<motion.div>` cu `role="button"`, `tabIndex={0}` si keyboard handler
- **Fix complementar:** Public layout (`src/app/[locale]/(public)/layout.tsx`) restructurat cu `flex min-h-screen flex-col` + `<main className="flex-1">`
- Rezultat: 0 sectiuni orphan, footer e ultimul element vizibil pe pagina

---

### Sesiunea 6 (9 Aprilie 2026) — Analiza post-implementare v2.0 + bugfixuri

#### ✅ Analiza completa pe toate 9 wave-uri — verificare statica wave-by-wave
Verificare sistematica a fiecarui wave din planul v2.0 pentru a identifica bug-uri, type mismatches, logica lipsa si inconsistente intre frontend si API-uri.

#### ✅ Password change API — functionalitate lipsa
- `PUT /api/client/profile` nu gestiona `currentPassword`/`newPassword` — pagina de setari trimitea aceste campuri dar API-ul le ignora
- Adaugat flow dedicat: verifica parola curenta, valideaza min 8 caractere, hash parola noua
- Blocheaza schimbarea parolei pentru conturi Google-only (fara `passwordHash`)

#### ✅ Rate limiting — securitate Wave 8
- Creat `src/lib/rate-limit.ts` — rate limiter in-memory cu sliding window si auto-cleanup la 5 minute
- Aplicat pe 4 endpoint-uri:
  - `POST /api/auth/login` — 10 incercari/minut
  - `POST /api/auth/register` — 5 inregistrari/minut
  - `POST /api/auth/google` — 10 incercari/minut
  - `POST /api/bookings` — 10 booking-uri/minut
- Returneaza HTTP 429 cu header `Retry-After`

#### ✅ Type fixes — 4 fisiere cu `id: string` in loc de `id: number`
- `src/app/[locale]/account/settings/page.tsx` — `User.id`
- `src/app/[locale]/admin/loyalty/page.tsx` — `Client.id` + `LoyaltyTransaction.id`
- `src/app/[locale]/admin/artists/page.tsx` — `Artist.id`

#### ✅ SVG-uri gold → silver
- `public/favicon.svg` si `public/og-image.svg` aveau inca `#C9A87C` — inlocuit cu `#B0B0B0`
- Acum 0 aparitii gold in tot proiectul

#### ✅ Email notificare surpriza loyalty (P10)
- Creat `sendSurpriseNotification()` in `src/lib/email.ts` — trimite email la admin cand un client atinge punctul 10/20/30/etc.
- Integrat in `PUT /api/bookings/[id]` — dupa acordarea automata a punctului, verifica `earnCount % 10 === 0`
- Email include: numele clientului, email, nr total puncte, optiuni surpriza

#### ✅ Loyalty type mismatch fix
- Frontend-ul folosea tipul `'surprise'` care nu exista in DB (schema are doar `'earn'/'redeem'/'bonus'/'adjust'`)
- Actualizat interfetele si label-urile in `account/loyalty` si `admin/loyalty` — aliniate cu schema DB

#### ✅ Double-booking prevention cu `$transaction`
- `POST /api/bookings` folosea `findFirst()` + `create()` separat (race condition posibil)
- Migrat la `prisma.$transaction()` serializat — check + create atomic
- Error `SLOT_TAKEN` caught si returnat ca HTTP 409

#### ✅ API response cleanup
- Eliminat camp extra `message` din `POST /api/admin/artists` — acum respecta formatul standard `{ success, data }`

---

### Sesiunea 5 (9 Aprilie 2026) — Implementare v2.0 Wave 4-9

#### ✅ Wave 4: Artisti dinamici — eliminare hardcoding complet
- Sters array-ul `ARTISTS` din `src/lib/constants.ts`
- `src/app/[locale]/page.tsx` rescris ca server component — fetch artisti din DB cu Prisma, include rating mediu si galerie featured
- `ArtistCards.tsx` si `ArtistModal.tsx` primesc artisti ca props (nu importa din constante)
- `BookingModal.tsx` si `BookingWizard.tsx` fetch artisti din `/api/artists`
- API admin artisti:
  - `GET/POST /api/admin/artists` — listare toti (inclusiv inactivi) + creare artist nou cu User + AvailabilityTemplates in transaction
  - `PUT /api/admin/artists/[id]` — update partial (inclusiv reactivare cu `isActive: true`)
  - `DELETE /api/admin/artists/[id]` — soft delete (dezactiveaza artist + user)
- Pagina admin: `src/app/[locale]/admin/artists/page.tsx` — grid artisti, adauga/editeaza/activeaza/dezactiveaza

#### ✅ Wave 5: Portal client complet
- **Pagini auth:**
  - `src/app/[locale]/auth/login/page.tsx` — email+parola + Google OAuth (GIS), redirect pe rol, i18n complet
  - `src/app/[locale]/auth/register/page.tsx` — 1 singur pas, Google OAuth, GDPR checkbox, beneficii marketing, auto-login
- **Account layout:** `src/app/[locale]/account/layout.tsx` — sidebar desktop + bottom nav mobile, 5 items (Dashboard, Programari, Puncte fidelitate, Recenzii, Setari), user header cu avatar
- **Account pages (5):**
  - `/account` — Dashboard: booking-uri viitoare, card loyalty vizual, summary puncte, quick actions
  - `/account/bookings` — Istoric cu status badges (nou/confirmat/completat/anulat), detalii expandabile, CTA "Lasa o recenzie" pe cele completate
  - `/account/loyalty` — Card vizual cu 10 stampile, stampila 10 = icon cadou, balanta puncte + valoare RON, istoric tranzactii
  - `/account/reviews` — Recenziile clientului cu rating stele, status (in asteptare/aprobata), artist name
  - `/account/settings` — Editare profil (nume, telefon), schimbare parola, status cont Google
- **API-uri client:**
  - `GET/PUT /api/client/profile` — profil + password change
  - `GET /api/client/loyalty` — balanta, tranzactii, eligibilitate surpriza
  - `GET /api/client/bookings` — booking-uri proprii cu status review
- **Auth API-uri noi:**
  - `POST /api/auth/register` — creare cont CLIENT
  - `POST /api/auth/google` — Google OAuth (find or create user)
  - `GET /api/auth/me` — profilul curent din JWT

#### ✅ Wave 6: Sistem review/testimoniale
- `POST /api/reviews` — client submit cu validari: booking exista, e completat, apartine clientului, fara duplicat (`@@unique([userId, bookingId])`)
- `GET /api/reviews` — reviews publice aprobate, filtru per artist, paginare
- `GET /api/admin/reviews` — toate reviews (inclusiv neaprobate), Super Admin only
- `PUT /api/admin/reviews/[id]` — moderare (aproba/ascunde)
- `DELETE /api/admin/reviews/[id]` — stergere permanenta
- Pagina admin: `src/app/[locale]/admin/reviews/page.tsx` — tabel cu filtre (Toate/Pending/Aprobate/Ascunse), actiuni Aproba/Ascunde/Sterge
- Rating mediu per artist afisat pe `ArtistCards.tsx` si `ArtistModal.tsx`

#### ✅ Wave 7: Sistem loyalty card
- Acordare automata puncte: cand booking → `completed`, se creeaza `LoyaltyTransaction(type='earn', points=1, valueRon=50.00)` daca clientul e inregistrat
- Notificare surpriza la fiecare al 10-lea punct → email automat la admin
- Admin management: `GET/POST /api/admin/loyalty` — cautare clienti, acordare/redeem/adjust puncte, P10 surprise cu dropdown tip cadou
- Pagina admin: `src/app/[locale]/admin/loyalty/page.tsx` — cautare client, vizualizare balanta + istoric, actiuni manuale
- Client view: card vizual cu 10 stampile, istoric tranzactii, balanta

#### ✅ Wave 8: Security fixes
- `POST /api/upload` — adaugat `verifyRole(request, ['SUPER_ADMIN', 'ARTIST'])` — guest-ii nu pot uploada
- Rate limiting pe login/register/google/bookings (detalii mai sus)
- Double-booking prevention cu `$transaction` (detalii mai sus)
- Password minimum 8 caractere pe register si password change

#### ✅ Wave 9: WOW factors
- **Cursor Glow:** `src/components/effects/CursorGlow.tsx` — pe desktop, o lumina soft urmareste cursorul (radial-gradient 600px, `rgba(176,176,176,0.06)`). Skip pe touch devices. Importat in `layout.tsx`
- **Artist recommendation:** In BookingWizard, cand clientul alege "nu stiu" la artist si selecteaza un stil, apare recomandare automata: "Bazat pe stilul ales, iti recomandam pe [Artist]" cu buton de selectare

#### ✅ i18n complet — traduceri RO/EN pentru tot v2.0
- `messages/ro.json` si `messages/en.json` — adaugate ~200 chei noi:
  - `auth.login` / `auth.register` — formulare, erori, Google OAuth, GDPR
  - `account.nav` / `account.dashboard` / `account.bookings` / `account.loyalty` / `account.reviews` / `account.settings`
  - `admin.nav` (artists, reviews, loyalty) / `admin.artists` / `admin.reviews` / `admin.loyalty`
  - `common.nav` (account, login, logout)
- `src/i18n/routing.ts` — adaugate rute account cu pathnames RO/EN (`/contul-meu/programari`, `/contul-meu/puncte`, `/contul-meu/recenzii`, `/contul-meu/setari`)

---

### Sesiunea 4 (9 Aprilie 2026) — Implementare v2.0 Wave 1-3

#### ✅ Wave 1: Schema DB — modele noi si relatii
- **User model** (identitate unificata): id, email, passwordHash?, role (SUPER_ADMIN/ARTIST/CLIENT), name, phone?, googleId?, avatarUrl?, isActive, lastLoginAt, timestamps. Relatii: Artist?, Booking[], LoyaltyTransaction[], Review[], Session[]
- **Artist model** rescris: eliminat email/passwordHash, adaugat `userId` (FK → User), `specialtyRo`, `specialtyEn`, `sortOrder`, `tiktokUrl`
- **Booking model**: adaugat `clientId?` (FK → User) pentru clienti inregistrati
- **LoyaltyTransaction model** (NOU): userId, bookingId?, type (earn/redeem/bonus/adjust), points, valueRon, description, createdBy
- **Review model**: adaugat userId?, bookingId?, isApproved, isVisible. Constraint `@@unique([userId, bookingId])`
- **Session model** (NOU): userId, token, expiresAt — pentru refresh token management
- `prisma/seed.ts` rescris: creeaza admin@insomniatattoo.ro (SUPER_ADMIN), migreaza Florentin + Madalina ca ARTIST users

#### ✅ Wave 2: Auth multi-rol
- `src/lib/auth.ts` — JWTPayload cu `role` si `artistId?`, functii: signToken (15m), signRefreshToken (7d), verifyRole, verifySuperAdmin, verifyArtistOwnership, verifyClientOwnership, getCurrentUser, verifyGoogleToken (OAuth)
- `src/middleware.ts` — protectie rute: `/admin/*` → SUPER_ADMIN/ARTIST, paths super-admin-only (`/admin/artists`, `/admin/settings`, `/admin/loyalty`, `/admin/reviews`), `/account/*` → orice rol autentificat, redirect logged-in users de pe `/auth/*`
- Login rescris: query User table cu artist relation, JWT cu rol
- Register NOU: creeaza CLIENT user, auto-login
- Google OAuth NOU: verify ID token, find-or-create user
- `/api/auth/me` NOU: returneaza profilul curent
- AdminSidebar actualizat: nav items filtrate pe rol (artists/reviews/loyalty doar SUPER_ADMIN)

#### ✅ Wave 3: Culori gold → silver
- `src/app/globals.css`: `--color-accent: #B0B0B0`, `--color-accent-hover: #8A8A8A`, `--color-accent-light: #D0D0D0`
- `src/lib/email.ts`: 18 aparitii `#C9A87C` → `#B0B0B0`
- `public/favicon.svg` + `public/og-image.svg`: gold → silver
- **Rezultat:** 0 aparitii `#C9A87C` in tot proiectul — toate componentele folosesc variabile Tailwind, deci s-au actualizat automat

---

### Sesiunea 3 (8 Aprilie 2026) — Finalizare tehnica

#### ✅ Email aftercare — trigger automat
- `PUT /api/bookings/[id]` trimite acum automat `sendAftercareReminder()` cand statusul se schimba in `completed`
- Email-ul se trimite async (nu blocheaza raspunsul API)
- Logica idempotenta — trimite o singura data, chiar daca admin salveaza de mai multe ori

#### ✅ Admin panel — 100% theme variables
- Migrate toate hardcoded hex colors (`#F5F5F5`, `#C9A87C`, `#1A1A1A`, `#0A0A0A`, `#A0A0A0`, `#666666`) din toate paginile admin
- Inlocuite cu variabilele de tema (`text-text-primary`, `text-accent`, `bg-bg-secondary`, `bg-bg-primary`, `text-text-secondary`, `text-text-muted`)
- **Rezultat:** 0 hardcoded hex colors in `src/` — verificat cu grep

#### ✅ Admin panel — 100% i18n (toate textele traduse)
- **Bookings:** status filter "Toate/All", loading state, headere tabel (Cod/Client/Artist/Data/Status), labeluri panou detalii (Telefon, Email, Zona, Dimensiune, Descriere, Data consultatie, Sursa), "Note admin"
- **Gallery:** "Se incarca...", "Upload esuat", "FEATURED" badge, labeluri modal editare (Titlu RO, Titlu EN, Stil, Ordine), butoane "Anuleaza"/"Salveaza"
- **Availability:** zile saptamana (`DAY_NAMES[]` → `t('days.monday')` etc.), "Nicio exceptie"
- Adaugate ~30 chei noi in `messages/ro.json` si `messages/en.json`

#### ✅ Analytics — respecta cookie consent
- `Analytics.tsx` incarc scripturile GA4 si Meta Pixel NUMAI daca user-ul a acceptat cookie-urile
- Listeneaza `StorageEvent` pentru schimbari in timp real (accept dupa ce componenta e montata)
- `trackEvent()` verifica si ea consimtamantul inainte de a trimite evenimente

### Sesiunea 2 (8 Aprilie 2026) — Core features

#### ✅ Admin panel complet
- Dashboard cu statistici (bookings noi, luna aceasta, confirmate)
- Pagina bookings cu filtre status + panou detalii + actiuni (contact/confirma/finalizeaza/respinge)
- Pagina galerie cu upload, grid, editare metadate, toggle featured/visible, stergere
- Pagina disponibilitate cu template saptamanal si exceptii pe date specifice
- Sidebar navigare cu logout
- Login page cu JWT auth
- Layout isolation: Header/Footer public ascuns pe paginile admin via CSS (`.public-shell`)

#### ✅ API routes complete
- `POST/GET /api/bookings` — creare publica + listare admin paginata
- `GET/PUT /api/bookings/[id]` — detalii + update status cu trigger email
- `POST /api/auth/login`, `/logout`, `/refresh` — JWT auth flow
- `GET /api/artists` — artisti activi (public)
- `GET /api/artists/[slug]/availability` — sloturi disponibile per luna
- `GET/POST /api/availability` — exceptii de disponibilitate (admin)
- `GET/POST /api/availability/templates` — template saptamanal (admin)
- `POST /api/upload` — upload imagine cu procesare sharp (WebP, thumbnail)
- `GET/POST /api/gallery` — galerie (public + admin)
- `PUT/DELETE /api/gallery/[id]` — editare/stergere imagine (admin)

#### ✅ Email flows
- Confirmare booking (catre client + artist)
- Aftercare reminder (la 1 saptamana dupa sesiune completata) — template bilingual RO/EN
- Review request (la 1 luna) — template bilingual cu CTA Google review + rebooking

#### ✅ SEO complet
- `src/app/sitemap.ts` — sitemap dinamic bilingv cu hreflang
- `src/app/robots.ts` — disallow /admin/ si /api/
- `src/components/seo/JsonLd.tsx` — LocalBusiness schema + FAQPage schema
- Meta tags + OG tags pe toate paginile

#### ✅ Analytics + GDPR
- `Analytics.tsx` — GA4 + Meta Pixel cu incarcare conditionata
- `CookieConsent.tsx` — banner animat, accept/decline, localStorage

#### ✅ Date artisti centralizate (inlocuit in v2.0 cu DB-driven)
- ~~`ARTISTS` array in `src/lib/constants.ts`~~ → **Eliminat in Sesiunea 5** — artisti acum 100% din baza de date
- Homepage, BookingModal, BookingWizard, ArtistCards, ArtistModal — toate fetched din DB/API

#### ✅ Booking calendar real
- BookingWizard fetches disponibilitate din `/api/artists/[slug]/availability`
- Calendar lunar cu navigare, zile disponibile/indisponibile, selectie slot orar

---

## PARTEA 1: Ce mai ramane de facut

### 🔴 CRITICE (blocheaza lansarea)

#### 1. Imagini reale
**Lipsa complet — placeholder-ele trebuie inlocuite:**
- `/public/images/artist-madalina.png` — portret Madalina (recomandat: 800x1000px, PNG/WebP)
- `/public/images/artist-florentin.png` — portret Florentin
- `/public/images/gallery/madalina-1.jpg` → `madalina-6.jpg` — 6 lucrari best-of
- `/public/images/gallery/florentin-1.jpg` → `florentin-6.jpg` — 6 lucrari best-of
- `/public/og-image.jpg` — Open Graph image (1200x630px) cu logo + branding
- `/public/favicon.ico` + `/public/apple-touch-icon.png`

#### 2. Configurare environment production
**`.env.local` de completat cu valori reale:**
```env
SMTP_PASS=parola_cpanel_email
NEXT_PUBLIC_GOOGLE_MAPS_KEY=cheia_google_maps
NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL=url_embed_harta
SEED_ADMIN_PASSWORD=parola_admin_reala
JWT_SECRET=secret_random_256bit
JWT_REFRESH_SECRET=alt_secret_random_256bit
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_META_PIXEL_ID=XXXXXXXXXXXXXXX
GOOGLE_CLIENT_ID=id_google_oauth
GOOGLE_CLIENT_SECRET=secret_google_oauth
ADMIN_EMAIL=admin@insomniatattoo.ro
```

#### ~~3. Rulare database setup + migrare v2.0~~ ✅ Rezolvat
- Baza de date pe Railway MySQL (cloud)
- Schema migrata si seed-ul rulat cu succes

#### ~~4. Build verification~~ ✅ Rezolvat
- Build ruleaza fara erori pe Vercel

#### ~~5. Deploy~~ ✅ Rezolvat
- Site-ul e live pe Vercel la `https://insomniatattoo.ro`
- Auto-deploy din GitHub la fiecare `git push origin main`

---

### 🟡 IMPORTANTE (inainte de lansare publica)

#### 6. Galerie initiala
Dupa configurarea bazei de date, incarca minimum 10-15 lucrari per artist prin admin panel → `/admin/gallery`. Fara imagini reale, galeria apare goala.

#### 7. Test flow complet end-to-end v2.0
Inainte de lansare, testeaza manual toate scenariile (10 teste):
1. **Auth client:** Register → Login → Verifica portal → Logout → Login cu Google
2. **Auth admin:** Login admin → Verifica nav pe rol (SUPER_ADMIN vede tot, ARTIST vede doar proprii)
3. **Admin artisti:** Super Admin → Adauga artist nou → Verifica apare pe homepage + booking + galerie
4. **Booking client logat:** Client logat → BookingWizard → Verifica pre-fill date → Booking creat cu clientId
5. **Booking guest:** Guest → Booking → Succes → Verifica email confirmare
6. **Reviews:** Client → Account → Bookings → "Lasa o recenzie" (pe booking completat) → Admin aproba → Apare pe homepage
7. **Loyalty:** Admin completeaza booking → Punct automat acordat → Client vede in portal → Admin redeem
8. **Loyalty P10:** La al 10-lea punct → Verifica email notificare la admin
9. **Permisiuni:** Artist logat → Verifica NU poate accesa `/admin/artists` sau `/admin/loyalty`
10. **Upload:** Guest → Incearca upload → 401. Artist → Upload → OK doar propria galerie

#### ~~8. Header auth state~~ ✅ Rezolvat
- Header-ul detecteaza corect starea de autentificare (fix `data.user` → `data.data`)
- Arata "Contul meu" / "Sign In" in functie de JWT cookie

---

### 🟢 NICE TO HAVE (post-lansare)

#### 9. PWA / Offline support
- `manifest.json` + service worker pentru experienta mobile-first
- Permite "Add to Home Screen" pe iOS/Android

#### 10. Notificari admin push
- Push notifications sau email/SMS catre admin cand vine un booking nou
- Alternativa simpla: integrare Telegram bot cu `node-telegram-bot-api`

#### 11. Blog / Jurnal de tatuaje
- Pagini cu articole SEO long-tail: "aftercare tatuaj", "cat costa un tatuaj realism", etc.
- CMS simplu (MDX files in repo) sau admin panel extins

#### 12. Performance optimization
- Image CDN (Cloudflare R2/Images) in loc de servire din `/public/uploads/`
- `next/image` pentru optimizare automata pe imaginile din galerie
- Lazy loading mai agresiv + blur placeholder pe galerie

#### 13. Loyalty card shareable
- Design-ul cardului de fidelitate genereaza imagine PNG cu numele clientului, nr sedinte, branding Insomnia
- Buton share → Instagram Stories

#### 14. Availability heatmap
- Calendar cu intensitate vizuala (mai luminos = mai multe sloturi libere)
- Clientul vede instant cand artistul e cel mai disponibil

#### 15. Tattoo progress tracker
- Timeline vizual: Booking → Consultatie → Design → Sedinta → Vindecare → Vindecat
- Faza "Vindecare" arata countdown cu tips care se schimba zilnic

---

## PARTEA 2: Plan de Extindere

### Faza A: Pre-Launch (1-2 saptamani)
1. ~~Deploy pe hosting~~ ✅ Live pe Vercel + Railway MySQL
2. ~~SSL~~ ✅ Auto-generat de Vercel
3. ~~Database migration~~ ✅ Schema v2.0 pe Railway
4. Incarca imagini reale (portrete artisti + 10-15 lucrari per artist)
5. Completeaza `.env` production: SMTP_PASS, Google Maps key, GA ID, Meta Pixel
6. Configureaza Google OAuth (creaza proiect in Google Cloud Console)
7. Testeaza toate 10 scenariile end-to-end (vezi sectiunea 🟡 mai sus)
8. Testeaza pe mobile (70%+ din trafic va fi mobil)

### Faza B: Soft Launch (saptamana 1-2)
1. Anunta pe Instagram Stories (@insomniatattoo, @madalina.insomnia, @florentin.insomnia)
2. Adauga link in bio pe toate conturile Instagram
3. Pune link pe Google Business Profile
4. Trimite link pe WhatsApp la clientii existenti
5. Testeaza booking-uri reale cu 3-5 clienti de incredere

### Faza C: Public Launch (luna 1-2)
1. Post de lansare pe Instagram (Reel + Carousel)
2. Activeaza Google Business Profile complet (poze, ore, categorie)
3. Cere review-uri Google de la primii clienti
4. Incepe content plan regulat (vezi strategia de mai jos)

### Faza D: Crestere (luna 3-6)
1. Instagram ads targetate local (Constanta + turisti Mamaia)
2. Google Ads pe cautari locale ("tatuaje mamaia", "tattoo constanta")
3. Parteneriate locale (hoteluri Mamaia Nord, influenceri locali)
4. TikTok content cu behind-the-scenes

### Faza E: Scalare (luna 6-12)
1. Analiza metrici: conversion rate booking, surse trafic, bounce rate
2. A/B testing pe pagina booking (simplificare flow daca conversion e mica)
3. Email marketing catre baza de clienti existenti
4. Blog/Journal pe site (SEO long-tail: "aftercare tatuaj", "cat costa un tatuaj", etc.)
5. Eventual: artist guest spots (artisti invitati), cu pagini separate

---

## PARTEA 3: Strategie de Marketing

### 3.1. SEO Local (gratuit, high impact)

**Google Business Profile — PRIORITATE #1**
- Creaza/revendica profil Google Business pentru "Insomnia Tattoo"
- Adauga: adresa exacta Mamaia Nord, ore, nr telefon, link site, categorie "Tattoo Shop"
- Upload 20+ poze de calitate (studio, lucrari, artisti)
- Cere review-uri de la FIECARE client dupa sesiune
- Target: 20+ review-uri cu 5 stele in primele 3 luni
- **De ce:** 90%+ din cautarile "tattoo near me" duc la Google Maps. Review-urile sunt factorul #1

**SEO On-Page (deja partial implementat)**
- Sitemap + robots.txt ✅
- JSON-LD LocalBusiness ✅
- Meta titles/descriptions bilingve ✅
- **De adaugat:** Blog cu articole targetate pe keyword-uri:
  - "tatuaje mamaia nord" / "tattoo mamaia"
  - "cat costa un tatuaj constanta"
  - "studio tatuaje constanta recenzii"
  - "aftercare tatuaj"
  - "tatuaj realism romania"
  - "tatuaj geometric constanta"
  - "tatuaj portret pret"

### 3.2. Instagram (canal principal)

**Strategie Content — 4-5 posturi/saptamana:**

| Zi | Tip | Exemplu |
|---|---|---|
| Luni | Lucrare finalizata (Carousel) | Before/after sau close-up detalii |
| Marti | Reel 15-30s | Timelapse sesiune / linework in actiune |
| Miercuri | Story-uri | Behind the scenes, setup studio, muzica zilei |
| Joi | Lucrare finalizata (Single) | Focus pe stil specific (realism/graphic) |
| Vineri | Reel educational | "3 lucruri de stiut inainte de primul tatuaj" |
| Weekend | Stories | Viata de zi cu zi, Q&A, poll-uri |

**Hashtag-uri strategice:**
- Locale: `#tatuajemamaia #tattooconstanta #tatuajeconstanta #insomniatattoo #mamaiamord`
- Stil: `#realismtattoo #graphictattoo #lineworktattoo #geometrictattoo #minimalisttattoo`
- Generale: `#tattooart #tattooideas #tattoodesign #inked #tattooinspiration`

**Bio Instagram:**
```
🖤 Insomnia Tattoo | Mamaia Nord
✨ Realism & Graphic — Custom Only
📅 Booking: insomniatattoo.ro/booking
📍 Mamaia Nord, Constanta
```

**CTA pe fiecare post:** "Link in bio pentru programare" / "Booking open — link in bio"

### 3.3. TikTok (crestere organica)

**Content plan — 3 clipuri/saptamana:**
- Timelapse sesiuni (10-15 sec, muzica trending)
- "POV: primul tatuaj" style content
- Before/after transformari
- "Ce inseamna tatuajul meu" (storytelling client)
- "Un tatuaj in 60 secunde" (time-compressed)
- Raspunsuri la intrebari frecvente (text overlay)

**De ce TikTok:** Reach organic imens, targetare varsta 18-35 (publicul principal tatuaje). Un clip viral = 100k+ views = sute de vizite pe site.

### 3.4. Google Ads (platit, ROI masurabil)

**Campanie 1: Search Ads — cautari locale**
- Keywords: "tatuaje constanta", "tattoo mamaia", "studio tatuaje constanta", "tatuaj realism constanta"
- Budget: 300-500 RON/luna
- Landing page: `/booking` cu parametru `?source=google_ads`
- Target ROI: 1 booking la fiecare 50-100 RON cheltuiti

**Campanie 2: Display/Discovery — turisti vara**
- Targeting: Persoane in zona Mamaia/Constanta (geo-targeting)
- Perioada: Mai - Septembrie (sezon turistic)
- Creative: Imagini portfolio + "Booking la cel mai premium studio din Mamaia Nord"

### 3.5. Instagram/Facebook Ads (platit)

**Campanie 1: Awareness local**
- Targeting: 18-40 ani, Constanta + 50km raza, interes: tattoos, body art
- Format: Carousel cu lucrari (5-10 imagini)
- CTA: "Programeaza consultatie" → link direct `/booking`
- Budget: 200-400 RON/luna

**Campanie 2: Remarketing**
- Pixel pe site (vizitatori care n-au facut booking)
- Creative: "Ai idee de tatuaj? Hai sa o transformam in arta" + portfolio
- Budget: 100-200 RON/luna
- **Necesita:** Meta Pixel instalat pe site

**Campanie 3: Sezoniera (vara)**
- Target turisti Mamaia (geo + interese travel + tattoo)
- "Vacation tattoo — ia-ti amintirea cu tine"
- Mai-Septembrie, budget crescut

### 3.6. Parteneriate & Offline

**Parteneriate locale:**
- Hoteluri/hosteluri Mamaia Nord — flyere la receptie sau QR code in camera
- Saloane de coafura/beauty — cross-promo
- Baruri/cluburi locale — postere sau stickere cu QR
- Influenceri locali din Constanta — tatuaj gratuit in schimbul unui post/reel

**Evenimente:**
- Flash day lunar — tatuaje mici la pret fix, creeaza FOMO si aduce clienti noi
- Guest artist events — invita artisti din alte orase, atrage audienta lor
- Prezenta la conventii de tatuaje (Bucharest Tattoo Convention etc.)

**Referral program:**
- Client recomanda un prieten → discount la urmatoarea sedinta
- Poate fi tracking prin campul "Sursa" din formularul de booking (`referral`)

### 3.7. Email Marketing (post-lansare)

**Baza de date:** Toti clientii care fac booking (au deja email + consimtamant GDPR)

**Flow automat:**
1. Dupa booking: email confirmare ✅ (deja implementat)
2. Dupa 1 saptamana: email aftercare reminder
3. Dupa 1 luna: "Cum arata tatuajul tau?" + CTA review Google
4. Dupa 6 luni: "E timpul pentru urmatorul?" + link booking
5. Flash day/promoții: newsletter la toti clientii

**Tool recomandat:** Mailchimp (free pana la 500 contacte) sau direct Nodemailer cu template-uri custom

### 3.8. Metrici de Succes (KPIs)

| Metric | Target Luna 1 | Target Luna 3 | Target Luna 6 |
|---|---|---|---|
| Vizite site/luna | 500 | 2000 | 5000 |
| Booking-uri/luna | 10-15 | 30-40 | 60-80 |
| Conversion rate (vizita→booking) | 3% | 4% | 5% |
| Review-uri Google | 5 | 20 | 50+ |
| Followers Instagram | +100 | +500 | +1500 |
| Email list | 30 | 100 | 300 |
| Revenue din ads | - | 2x ROAS | 3x ROAS |

### 3.9. Calendar Marketing (primele 3 luni)

**Luna 1 — Lansare:**
- Saptamana 1: Deploy site, soft launch pe Instagram
- Saptamana 2: Google Business Profile complet, primele booking-uri test
- Saptamana 3: Public launch post, link in bio pe toate platformele
- Saptamana 4: Primele review-uri Google, start content regulat

**Luna 2 — Crestere:**
- Start Google Ads (search local)
- Start Instagram ads (awareness)
- Flash day #1 — atrage clienti noi
- 4-5 posturi/saptamana pe Instagram, 3 pe TikTok
- Parteneriate cu 2-3 business-uri locale

**Luna 3 — Optimizare:**
- Analiza metrici: ce canale aduc booking-uri?
- Dubla budget pe canalele care functioneaza
- Start remarketing (Meta Pixel)
- Email la toti clientii cu oferta/update
- Guest artist event (daca posibil)

---

## PARTEA 4: Budget Estimat Marketing (lunar)

| Canal | Budget lunar | Prioritate |
|---|---|---|
| Google Business Profile | 0 RON | 🔴 Maxima |
| Content Instagram/TikTok | 0 RON (timp) | 🔴 Maxima |
| SEO (blog posts) | 0 RON (timp) | 🟡 Mare |
| Google Ads | 300-500 RON | 🟡 Mare |
| Instagram/FB Ads | 300-600 RON | 🟡 Mare |
| Flyere/Stickere | 100-200 RON | 🟢 Medie |
| **TOTAL** | **700-1300 RON/luna** | |

**Nota:** Primele 2-3 luni, focusul trebuie sa fie pe canalele GRATUITE (Google Business, Instagram organic, TikTok). Ads-urile incep doar dupa ce ai content de calitate si review-uri.
