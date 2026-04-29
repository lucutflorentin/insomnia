# Insomnia Tattoo — Roadmap & Strategie

> Ultima actualizare: 29 Aprilie 2026

---

## JURNAL TEHNIC — Ce s-a implementat

### Sesiunea 18 (29 Aprilie 2026) — Audit artisti, reguli legale 18+, profil/portofoliu si push live

Pornita din feedback direct de la artisti dupa testarea site-ului live. Obiectivul a fost tratarea tuturor celor 7 puncte raportate, plus audit strict pe conflictele si bugurile conexe descoperite in timpul lucrului.

#### Puncte raportate de artisti si status

1. Varsta minima:
   - eliminata complet regula veche pentru 16-18 ani cu acord parental;
   - termenii publici mentioneaza acum clar ca Insomnia Tattoo tatueaza doar persoane care au implinit 18 ani;
   - adaugata formulare explicita ca nu se accepta clienti sub 18 ani sub nicio forma.
2. Adresa oficiala:
   - adresa publica actualizata la `Str. D10, Nr. 11 Bis, Ap. 2, Mamaia Nord, Constanta`;
   - actualizata in constante, contact, footer, privacy, emailuri si JSON-LD.
3. Program de lucru:
   - programul public este acum `Luni - Duminica: 12:00 - 20:00`;
   - adaugata mentiunea ca se lucreaza strict in functie de programari in intervalul afisat;
   - actualizate defaults pentru artisti noi, seed, init SQL si date existente prin migration.
4. Regulament de ordine interioara:
   - adaugat in pagina de Termeni si Conditii ca sectiune dedicata;
   - include punctualitate, act de identitate, alcool/substante, igiena/aftercare, insotitori si fotografiere/filmare in studio.
5. Calitate upload si zoom portofoliu:
   - uploadul de galerie proceseaza acum imaginea principala la rezolutie mai buna, pana la 2400px latime, WebP quality 92;
   - thumbnailul a fost crescut la 900px, WebP quality 84;
   - adaugat `sharp().rotate()` pentru orientarea corecta a pozelor facute cu telefonul;
   - portofoliul public foloseste imaginile mari, nu doar thumbnailurile;
   - adaugat lightbox/zoom in profil public artist, Ink Space si galeria artistului.
6. Schimbare poza de profil artist:
   - adaugat preview local imediat dupa selectarea pozei;
   - validare client-side pentru tip si marime;
   - upload prin pipeline-ul existent Vercel Blob + WebP;
   - API-ul artist profile accepta corect imagini absolute sau root-relative.
7. Salvare profil artist:
   - API-ul `/api/artist/profile` a fost intarit cu validare structurata pentru body JSON;
   - URL-urile sociale sunt validate ca HTTP/HTTPS;
   - `profileImage` accepta URL HTTP/HTTPS sau path local `/...`;
   - inputurile invalide returneaza 400 actionabil in loc de Internal Server Error.

#### Audit strict suplimentar efectuat

- Cautare globala pentru texte vechi:
  - `16 si 18`, `16 and 18`, formularea veche cu minor/tutore;
  - `10:00 - 18:00`, `10:00`, `16:00`, `18:00`;
  - `Mamaia Nord, Constanta, Romania`;
  - endpoint-uri inexistente `availability/schedule` si `availability/overrides`.
- Reparat bug descoperit in audit:
  - pagina `/artist/availability` apela rute care nu existau;
  - a fost mutata pe rutele reale `/api/availability/templates` si `/api/availability`;
  - adaugat `DELETE /api/availability?id=X` pentru stergerea exceptiilor de disponibilitate.
- Date si defaults:
  - `prisma/seed.ts` actualizat pentru program 12-20, 7 zile pe saptamana;
  - `prisma/init.sql` actualizat cu aceleasi defaults;
  - adaugata migrare `20260429000000_update_studio_policy` pentru bazele de date existente.
- SEO si date structurate:
  - `TattooParlor` JSON-LD actualizat cu adresa oficiala si program 12-20 L-D.

#### Verificari trecute local

- `git diff --check`
- `npm test`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- verificare HTTP locala pe server production pentru:
  - `/termeni`;
  - `/contact`;
  - `/spatiul-ink`.

#### Git / live

- Commit pe `main`: `6566b9d` — `Fix artist audit issues`
- Push reusit pe `origin/main`.
- Working tree curat dupa push.

#### Note importante pentru productie

- Dupa deploy, trebuie verificat in live cu un cont real de artist:
  - schimbare poza profil;
  - salvare profil;
  - upload poza telefon;
  - click/zoom pe portofoliu;
  - verificare Termeni, Contact si Footer pe mobil.
- Migrarea Prisma trebuie aplicata in mediul de productie ca programul si adresa sa fie actualizate si in tabela `settings` / `availability_templates`.
- `agent-browser` nu a fost disponibil local; verificarea vizuala automata a fost inlocuita cu build complet si verificare HTTP a rutelor randate.

### Sesiunea 16 (28 Aprilie 2026) — Portofoliu artist, upload diagnostics, plan 9+

Focus: problema raportata de artist in `/artist/gallery`, unde uploadul afisa doar `"Upload failed. Please try again."` si nu era clar daca eroarea vine din fisier, autentificare, baza de date sau storage.

#### Buguri identificate si rezolvate local

- Endpointul `POST /api/upload` ascundea erorile critice sub un mesaj generic. Acum returneaza coduri si mesaje actionabile:
  - `STORAGE_NOT_CONFIGURED` cand `BLOB_READ_WRITE_TOKEN` lipseste.
  - `STORAGE_UPLOAD_FAILED` cand Vercel Blob refuza uploadul.
  - `UNAUTHORIZED` pentru sesiuni invalide/lipsa.
- In mediul local verificat, `BLOB_READ_WRITE_TOKEN` este gol in `.env.local`, deci uploadul real in local nu poate functiona pana nu se seteaza tokenul Blob. In productie trebuie verificata aceeasi variabila in Vercel.
- Dashboardul artistului folosea un flux prea simplu pentru portofoliu: upload/delete/visibility, fara metadata si fara feedback profesional.

#### Imbunatatiri implementate pentru artist gallery

- Pagina `/artist/gallery` a devenit manager de portofoliu:
  - upload multiplu cu progress per fisier;
  - validare client-side pentru tip fisier si limita de marime;
  - mesaje reale de eroare primite de la API;
  - statistici rapide: total, vizibile, evidentiate, completate cu metadata;
  - editare titlu RO/EN, stil, zona corpului si ordine;
  - toggle pentru vizibilitate si featured;
  - confirmare la stergere;
  - suport mai clar pentru poze facute cu telefonul, optimizate server-side in WebP si thumbnail.

#### Verificari trecute local

- `npm run test`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`

#### Nota de lansare estimata dupa aceasta sesiune

- Stabilitate tehnica locala: 8.2/10.
- Experienta artist portofoliu: 7.8/10, crescuta de la aproximativ 6/10.
- Pregatire pentru live premium: 8/10, blocata in continuare de QA real pe productie, imagini reale premium, Sentry live si e2e complet.

#### Plan pentru nota 9+

1. P0 inainte de live:
   - verifica `BLOB_READ_WRITE_TOKEN` in Vercel Production si Preview;
   - test manual cu cont ARTIST real: upload JPG/PNG/WebP de telefon, editare metadata, ascundere, featured, stergere;
   - test manual cu SUPER_ADMIN: upload galerie pentru fiecare artist si editare artist;
   - inlocuire completa placeholder images cu lucrari reale si portrete premium;
   - activare si verificare Sentry production cu o eroare controlata non-publica.

2. Artist dashboard 9+:
   - profil public preview in dashboard, cu status "publicat / incomplet";
   - checklist de profil: poza, bio RO/EN, specialitati, Instagram/TikTok, minimum 12 lucrari vizibile;
   - batch edit pentru stil/zona/vizibilitate/featured;
   - drag-and-drop reorder pentru sortarea portofoliului;
   - filtre in galeria artistului dupa vizibilitate, featured, stil, zona si metadata lipsa;
   - recomandari automate: imagini fara titlu, fara stil, prea putine featured, portofoliu dezechilibrat pe stiluri;
   - import/attach din booking references catre portofoliu dupa finalizarea lucrarii, cu aprobare artist.

3. Admin dashboard 9+:
   - health center: storage configurat, email configurat, Sentry activ, cron activ, ultimele erori;
   - CRM client: timeline client cu programari, note, loyalty, reviews, preferinte, consimtamant GDPR;
   - artist performance: conversie booking, venit estimat, rating, no-show, workload, lucrari publicate;
   - moderation queue pentru imagini/reviews/content inainte de publicare;
   - exporturi si rapoarte pe perioade: clienti, programari, surse, stiluri, artisti;
   - audit log filtrabil si alertare pentru actiuni sensibile;
   - data quality dashboard: artisti incompleti, imagini lipsa metadata, setari SEO lipsa, linkuri sociale invalide.

4. QA si automatizare:
   - Playwright e2e pentru auth, booking complet, artist gallery, admin gallery si profil public artist;
   - teste API pentru upload failure modes si permisiuni artist/admin;
   - smoke production dupa deploy cu conturi de test;
   - checklist vizual mobil/desktop pentru homepage, booking, artist profile, dashboard artist/admin.

#### Extensie 9+ implementata in aceeasi sesiune

- Dashboard artist:
  - adaugat "Portfolio health" cu scor procentual de pregatire publica;
  - checklist actionabil pentru poza profil, bio RO/EN, specialitate RO/EN, social links, minimum 12 lucrari vizibile, minimum 4 featured si metadata completa;
  - statistici clare pentru lucrari vizibile, featured, total si fara metadata.
- Galerie artist:
  - adaugate filtre dupa status: toate, vizibile, ascunse, featured, metadata lipsa;
  - adaugat filtru dupa stil si cautare dupa titlu/stil/zona;
  - adaugate selectare filtrate si bulk actions pentru show/hide/featured/delete;
  - fix defensiv: bulk delete elimina local doar lucrarile sterse cu succes.
- Dashboard admin:
  - adaugat Health Center in dashboardul principal;
  - scor de launch readiness bazat pe storage imagini, SMTP, Sentry, cron, portofoliu public si metadata galerie;
  - metrici data quality: lucrari vizibile, featured, metadata lipsa, utilizatori inactivi;
  - lista artistilor care necesita completari de profil sau portofoliu.

#### Probleme ramase pentru 9+ real, nu doar local

- `BLOB_READ_WRITE_TOKEN` trebuie setat in `.env.local` pentru test local complet si verificat in Vercel Production/Preview.
- `NEXT_PUBLIC_SENTRY_DSN`, `CRON_SECRET` si SMTP trebuie confirmate in Vercel; Health Center le va semnala cand lipsesc.
- Urmatorul salt mare este e2e Playwright pentru upload real, booking complet, dashboard artist/admin si profil public artist.

#### Hardening suplimentar dupa verificarea Vercel env vars

- Dashboard artist mobile:
  - layoutul privat nu mai forteaza sidebar desktop pe telefon;
  - adaugat top bar mobil si bottom navigation cu toate sectiunile artistului;
  - adaugat clopotel notificari in dashboardul artistului, inclusiv pe mobil;
  - dropdown-ul de notificari este limitat la latimea viewportului ca sa nu iasa din ecran.
- Booking notifications:
  - emailurile si notificarile create dupa booking sunt rulate prin `Promise.allSettled`;
  - booking-ul nu pica daca email/push esueaza, dar serverless-ul nu mai abandoneaza prematur taskurile de livrare;
  - notificarea in-app ramane sursa de baza, push-ul depinde de VAPID + subscription activa pe device-ul artistului.
- Upload poze telefon:
  - introdus `GALLERY_UPLOAD_CONFIG`;
  - uploadul de galerie accepta acum imagini pana la 15MB, mai potrivit pentru poze facute direct cu telefonul;
  - uploadul de referinte din booking ramane la 5MB pentru formular public mai usor.

#### Checklist Vercel/live ramas inainte de nota 9+

1. Redeploy dupa orice schimbare de environment variables.
2. Verificare in Vercel Production si Preview:
   - `BLOB_READ_WRITE_TOKEN`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
   - `CRON_SECRET`
   - `NEXT_PUBLIC_SENTRY_DSN`
3. Test live cu artist pe telefon:
   - login artist;
   - enable notifications;
   - upload poza reala de telefon 8-15MB;
   - editare metadata, featured, hide/show, delete;
   - verificare Portfolio Health.
4. Test booking live:
   - booking public pentru artist;
   - apare in `/artist/bookings`;
   - apare in clopotelul artistului;
   - se primeste email client + artist;
   - push notification apare pe device-ul unde artistul a permis notificarile.
5. Curatare continut pentru lansare premium:
   - minimum 12 lucrari vizibile per artist;
   - minimum 4 featured per artist;
   - bio RO/EN si specialitati RO/EN complete;
   - portrete reale premium;
   - Health Center cat mai aproape de 100%.

### Sesiunea 17 (28 Aprilie 2026) — Fixuri public portfolio, profil artist si incredere client

Pornita din QA live dupa ce uploadul Blob a fost reparat/configurat.

#### Probleme identificate

- Artistul putea edita bio/social links, dar nu isi putea schimba poza de profil din dashboard.
- Dashboardul artistului nu avea scurtatura clara inapoi catre site-ul principal.
- Homepage-ul nu afisa lucrarile incarcate deoarece `GalleryHighlight` nu primea date din DB.
- Homepage, Ink Space si profilul public de artist riscau sa ramana cu date prerandate/cache-uite dupa uploaduri noi.
- Taburile de stil din Ink Space erau doar vizuale si nu filtrau lucrarile.
- JSON-LD pentru profil artist putea genera URL invalid cand `profileImage` era deja URL absolut de Vercel Blob.

#### Implementat

- Profil artist:
  - artistul poate incarca/schimba poza de profil din `/artist/profile`;
  - poza este uploadata prin acelasi pipeline securizat Vercel Blob + WebP;
  - API-ul `/api/artist/profile` permite acum update controlat pentru `profileImage`.
- Dashboard artist:
  - adaugata scurtatura catre site-ul principal in sidebar desktop si topbar mobil.
- Homepage `Lucrarile noastre`:
  - conectat la lucrarile reale vizibile din DB;
  - prioritizare lucrari featured, apoi sort order si cele mai noi;
  - UI imbunatatit cu grid responsive, overlay, artist, stil si CTA catre Ink Space;
  - stare goala profesionala cand nu exista lucrari publice.
- Ink Space:
  - taburile de stil functioneaza si filtreaza per artist;
  - headerul artistului foloseste poza de profil cand exista;
  - stare goala pentru filtre fara rezultate.
- Date publice dinamice:
  - homepage, Ink Space si profilul public artist folosesc `noStore()` pentru ca portofoliile urcate din dashboard sa se reflecte live fara rebuild manual.
- SEO/Trust:
  - schema Person pentru profil artist foloseste corect URL absolut pentru imaginile Blob.

#### Ramane de testat live

- Schimbare poza profil artist din dashboard.
- Upload lucrare noua si verificare imediata in homepage, Ink Space si profil public artist.
- Filtrare stiluri in Ink Space pe fiecare artist.
- Click din dashboard artist catre site-ul principal.

### Sesiunea 15 (27-28 Aprilie 2026) — Audit P0/P1 local, stabilizare pre-live

Audit dur al starii reale dupa Sesiunile 13-14. Site-ul este live, dar regula operationala ramane: orice schimbare se valideaza local inainte de update live.

#### P0 rezolvat local

- Booking wizard trimite acum contractul corect catre API: `artistSlug`, nu `artistId: 0`.
- Datele de disponibilitate folosesc calendar local, nu `toISOString().split('T')[0]`, deci nu mai apare drift UTC.
- QuickBook foloseste traducerile corecte si nu mai expune chei brute `nav.booking`.
- Permisiunile ARTIST au fost restranse pe disponibilitate, galerie si statistici admin.
- Placeholder-ele text din `public/images` au fost inlocuite cu fisiere PNG/JPEG valide.
- Middleware-ul nu mai confunda ruta publica `/artists/...` cu dashboard-ul privat `/artist/...`.

#### P1 rezolvat local

- `npm audit --omit=dev` este la 0 vulnerabilitati.
- `nodemailer` actualizat la 8.0.7.
- `postcss` actualizat/fortat la 8.5.12 inclusiv pentru Next.
- Sentry mutat pe `instrumentation.ts` si `instrumentation-client.ts`; warning-urile vechi au disparut.
- Lint-ul este curat: 0 erori, 0 warning-uri.
- Adaugate teste unitare pentru normalizare booking, date locale si rutele public/private.
- Adaugat smoke script local: `npm run smoke`.
- Adaugat preflight local: `npm run prelive`.
- Adaugat baseline Prisma migration in `prisma/migrations/20260428000000_baseline/migration.sql`.
- Adaugat documentatie migrations in `docs/MIGRATIONS.md`.
- Adaugat repo hygiene check: `npm run hygiene`.
- Adaugat audit production check: `npm run audit:prod`.
- Eliminat din working tree artefacte locale trackuite: `deploy.tar.gz` si `.claude/launch.json`.
- Adaugat checklist pre-live in `docs/PRELIVE_CHECKLIST.md`.
- Roadmap actualizat cu statusul P0/P1 si pregatit pentru commit/push GitHub.

#### Verificari trecute local

- `npm run test`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run audit:prod`
- `npm run hygiene`
- Smoke local pe server production la `127.0.0.1:3010`

#### Ramane critic inainte de nota 9/10

- Inlocuire placeholder images cu portofoliu si portrete reale premium.
- Prisma baseline este versionat local; in productie trebuie aplicat/rezolvat controlat conform `docs/MIGRATIONS.md`, apoi toate deploy-urile trebuie sa ruleze strict prin migrations.
- Teste e2e reale pe booking complet, auth, admin gallery si artist dashboard.
- QA vizual pe mobil/desktop in browser inainte de orice push live.
- Conectare Sentry production si verificare alerte reale dupa deploy.

### Sesiunea 12 (12 Aprilie 2026) — Deploy & Configurare Productie

Configurarea completa a serviciilor externe necesare functionarii platformei in productie pe Vercel.

#### Vercel Environment Variables Configurate

- **`BLOB_READ_WRITE_TOKEN`** — Vercel Blob Store creat si conectat pentru stocarea imaginilor in cloud
- **`NEXT_PUBLIC_GOOGLE_CLIENT_ID`** — Variabila lipsa care bloca autentificarea Google pe client-side (Next.js necesita prefix `NEXT_PUBLIC_` pentru browser)
- **`GOOGLE_CLIENT_ID`** + **`GOOGLE_CLIENT_SECRET`** — Credentiale Google OAuth verificate si functionale
- **`JWT_SECRET`** + **`JWT_REFRESH_SECRET`** — Secrete de securitate generate cu `openssl rand -base64 48`

#### Google OAuth Fix Complet

- **Problema 1**: Lipsea `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in Vercel — butonul Google nu se incarca fara ea
- **Problema 2**: `origin_mismatch` — domeniul `https://www.insomniatattoo.ro` nu era in Authorized JavaScript Origins (doar varianta fara `www` era configurata)
- **Rezolvare**: Adaugat ambele variante (`www` si non-`www`) in Google Cloud Console — Authorized JavaScript Origins si Authorized Redirect URIs

#### Status Final

- ✅ Build production fara erori
- ✅ Google Auth functional (cu www si fara www)
- ✅ Upload imagini functional via Vercel Blob Storage
- ✅ Toate variabilele de mediu configurate corect

---

### Sesiunea 11 (12 Aprilie 2026) — Audit Complet, Bug Fixes & Security Hardening

Audit complet al platformei cu 18 probleme identificate si rezolvate: buguri critice de functionalitate, vulnerabilitati de securitate, si imbunatatiri UX in admin dashboard.

#### Buguri Critice Rezolvate

- **Upload galerie reparat** — Migrare de la filesystem local (read-only pe Vercel) la **Vercel Blob Storage** (`@vercel/blob`). Upload imagini, thumbnails si iconite PWA toate stocate in cloud
- **Google Auth reparat** — Adaugat variabila `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (Next.js nu expune env vars fara prefix `NEXT_PUBLIC_` catre browser)
- **PWA Preview Manifest** — Inlocuit `window.open()` JSON brut cu modal formatat in-page

#### Buguri Functionale Admin

- **Filtru artist galerie** — API accepta acum parametru `artist=slug` (anterior doar `artistId` integer)
- **Admin vede toate imaginile** — Eliminat filtru `isVisible: true` hardcodat pentru admin; public vede doar vizibile
- **Editare artist se salveaza** — Adaugat `artistId` in PUT `/api/gallery/[id]`
- **Upload artist selector** — Dropdown in header galerie pentru selectia artistului la upload (anterior hardcodat primul artist)
- **bodyArea in edit modal** — Camp nou dropdown cu zonele corpului in editarea imaginilor
- **Mesaje eroare contextuale** — Inlocuit `uploadFailed` generic cu `saveFailed`, `deleteFailed`, `featureFailed`, `visibilityFailed`
- **Bulk delete raport** — Toast afiseaza `"X sterse, Y esuate"` in loc de mesaj generic
- **Login redirect** — Respecta parametrul `?redirect=` dupa autentificare (anterior hardcodat `/admin`)

#### Securitate

- **Open redirect fix** — Functie `sanitizeRedirect()` in middleware valideaza ca redirect-ul e path intern
- **Email HTML injection fix** — `escapeHtml()` aplicat pe toate variabilele user-supplied din 8 template-uri email
- **Rate limiting GET publice** — 60 req/min pe `/api/gallery`, `/api/artists`, `/api/reviews` (anti-scraping)
- **Password reset token hashing** — SHA-256 hash inainte de stocare in DB; comparare prin hash
- **CSP hardening** — Eliminat `'unsafe-eval'` din `script-src`
- **Vercel Blob in CSP** — Adaugat hostname in `img-src` si Next.js `remotePatterns`

#### Config & Documentatie

- **`.env.example` actualizat** — Toate variabilele documentate cu instructiuni de generare
- **Traduceri noi** — 11 chei noi in `ro.json` si `en.json` pentru mesaje contextuale
- **Dependinta noua**: `@vercel/blob` pentru cloud storage

#### Fisiere modificate (15)

`src/app/api/upload/route.ts`, `src/app/api/admin/pwa-settings/upload-icon/route.ts`, `src/app/api/gallery/[id]/route.ts`, `src/app/api/gallery/route.ts`, `src/app/api/artists/route.ts`, `src/app/api/reviews/route.ts`, `src/app/api/auth/forgot-password/route.ts`, `src/app/api/auth/reset-password/route.ts`, `src/app/[locale]/admin/gallery/page.tsx`, `src/app/[locale]/admin/pwa-settings/page.tsx`, `src/app/[locale]/auth/login/page.tsx`, `src/middleware.ts`, `src/lib/email.ts`, `src/lib/rate-limit.ts`, `next.config.ts`

---

### Sesiunea 10 (12 Aprilie 2026) — Admin Dashboard Redesign Complet

Redesign total al admin panel-ului: iconite profesionale, statistici avansate, grafice, calendar vizual, galerie cu bulk actions, si functionalitate 100%.

#### Fundatie

- **lucide-react + recharts** instalate — inlocuite TOATE cele 21 emoji-uri cu iconite profesionale SVG
- **Toast feedback global** — toate actiunile async au feedback vizual (success/error) via `useToast()`
- **ConfirmDialog pe actiuni distructive** — stergere reviews, gallery items, dezactivare artisti
- **Loading states** pe toate butoanele de actiune — disabled + spinner in timpul procesarii

#### Dashboard cu Analytics

- **8 stat cards** (vs 4 anterior): programari noi, luna aceasta, confirmate, rata conversie, rating mediu, total reviews, clienti noi, pending reviews
- **Trend indicator** — procentaj vs luna trecuta (+12% / -5%) cu sageata verde/rosie
- **3 grafice recharts**: LineChart (trend 6 luni), BarChart (bookings per artist), PieChart (distributie stiluri)
- **API stats dedicat** — `src/app/api/admin/stats/route.ts` cu Prisma aggregations server-side
- **Refresh button** — actualizeaza datele fara reload pagina

#### Gallery Redesign

- **Filtre per artist** — tab-uri pentru fiecare artist + "All"
- **Selectie multipla** — checkbox pe fiecare imagine, "Select All", bulk action bar
- **Upload multiplu** — drag & drop mai multe imagini, progress indicator
- **Lightbox** — click pe imagine deschide yet-another-react-lightbox fullscreen
- **Edit modal imbunatatit** — include selector artist, preview imagine

#### Availability Calendar

- **Calendar vizual lunar** — grila 7 coloane cu zilele lunii
- **Status vizual per zi** — verde (disponibil), rosu (indisponibil), galben (override)
- **Booking count** — numar programari pe fiecare zi in calendar
- **Click-to-edit** — click pe zi deschide modal rapid de editare disponibilitate
- **Status artist** — dot colorat (verde/galben/rosu) langa numele artistului
- **Block week** — buton rapid pentru blocarea intregii saptamani
- **Template collapsibil** — editorul saptamanal intr-o sectiune pliabila

#### Reviews cu Statistici

- **Statistics bar** — rating mediu, total reviews, distributie stele (5★: 80%, 4★: 15%...)
- **Filtru per artist** — dropdown pentru filtrare
- **Sort** — dupa data (newest/oldest) sau rating (highest/lowest)

#### Loyalty Management

- **Tabel toti clientii** — lista completa cu balance, tier, ultima tranzactie
- **Tier badges** — Bronze (0-99), Silver (100-499), Gold (500+)
- **Sort coloane** — click pe header pentru sortare ascendenta/descendenta
- **Filtru search** — cauta dupa nume sau email in tabel
- **Detail panel** — click pe rand deschide panoul de gestiune puncte

#### Artists Fix

- **FIX upload imagine** — formImage se uploadeaza acum via POST /api/upload
- **ConfirmDialog** pe dezactivare artist
- **i18n complet** — toate string-urile hardcoded inlocuite cu chei traducere

#### Settings Consolidat

- **Sectiune SEO** — meta_title, meta_description cu contor caractere
- **Sectiune Notificari** — toggle email pe booking nou, review nou
- **Validare input** — email format, URL format, red border + error text

#### PWA Fix

- **Emoji inlocuit** — 📱 → Smartphone icon lucide-react

#### Fisiere create/modificate

| Fisier | Actiune |
|--------|---------|
| `src/app/api/admin/stats/route.ts` | NOU — endpoint statistici dashboard |
| `src/app/[locale]/admin/page.tsx` | Rescris — dashboard cu grafice |
| `src/app/[locale]/admin/gallery/page.tsx` | Rescris — bulk actions, lightbox |
| `src/app/[locale]/admin/availability/page.tsx` | Rescris — calendar vizual |
| `src/app/[locale]/admin/reviews/page.tsx` | Imbunatatit — statistici, sort, filtru |
| `src/app/[locale]/admin/loyalty/page.tsx` | Rescris — tabel clienti, tiers |
| `src/app/[locale]/admin/artists/page.tsx` | Fix upload + ConfirmDialog + i18n |
| `src/app/[locale]/admin/bookings/page.tsx` | Icons + toast + locale dinamic |
| `src/app/[locale]/admin/settings/page.tsx` | SEO + notificari + validare |
| `src/app/[locale]/admin/pwa-settings/page.tsx` | Emoji → icon |
| `src/components/admin/AdminSidebar.tsx` | Emoji → lucide-react icons |
| `src/app/api/admin/settings/route.ts` | Adaugat chei SEO + notificari |
| `src/app/api/admin/loyalty/route.ts` | Adaugat ?all=1 pentru lista completa |
| `messages/ro.json` | ~60 chei traducere noi |
| `messages/en.json` | ~60 chei traducere noi |
| `package.json` | Adaugat lucide-react, recharts |

---

### Sesiunea 9 (12 Aprilie 2026) — PWA Admin Dashboard Management

Adaugare pagina completa de administrare PWA in admin dashboard. Toate setarile PWA sunt acum configurabile din interfata admin, fara a edita manual fisiere.

#### ✅ Manifest dinamic

- **`src/app/manifest.ts`** — manifest generat dinamic din baza de date (inlocuieste `public/manifest.json` static)
- Citeste setarile `pwa_*` din tabelul `settings` cu fallback la valori default
- Next.js serveste automat la `/manifest.webmanifest`
- Layout actualizat cu referinta corecta: `<link rel="manifest" href="/manifest.webmanifest" />`

#### ✅ API Routes PWA Settings

- **`src/app/api/admin/pwa-settings/route.ts`** — GET/PUT pentru setari PWA (pwa_name, pwa_short_name, pwa_description, pwa_theme_color, pwa_background_color, pwa_display, pwa_start_url, pwa_icon_192, pwa_icon_512)
- **`src/app/api/admin/pwa-settings/upload-icon/route.ts`** — Upload iconite PWA cu:
  - Validare MIME type + magic bytes (securitate)
  - Rate limiting (10 uploads/minut)
  - Resize automat cu Sharp la dimensiunea exacta (192x192 sau 512x512)
  - Output PNG (cerinta PWA), nu WebP
  - Salvare in `/public/icons/` + actualizare automata setting in DB
- Ambele protejate cu `verifyRole(request, ['SUPER_ADMIN'])`

#### ✅ Pagina Admin PWA Settings

- **`src/app/[locale]/admin/pwa-settings/page.tsx`** — Pagina completa cu 4 sectiuni:
  - **App Info:** nume, nume scurt, descriere
  - **Display:** mod afisare (standalone/fullscreen/minimal-ui/browser), URL start
  - **Colors:** culoare tema + culoare fundal cu color picker nativ + input hex
  - **Icons:** upload 192x192 si 512x512 cu preview, drag & click
- Buton "Preview Manifest" pentru verificare rapida
- Urmeaza exact pattern-ul din pagina Settings existenta

#### ✅ Integrare navigatie + i18n

- **`AdminSidebar.tsx`** — adaugat nav item PWA (📱) cu `superAdminOnly: true`
- **`messages/ro.json`** + **`messages/en.json`** — 17 chei de traducere noi (`admin.pwaSettings.*` si `admin.nav.pwa`)

#### Fisiere modificate/create

| Fisier | Actiune |
|--------|---------|
| `src/app/manifest.ts` | NOU — manifest dinamic din DB |
| `src/app/api/admin/pwa-settings/route.ts` | NOU — GET/PUT settings PWA |
| `src/app/api/admin/pwa-settings/upload-icon/route.ts` | NOU — upload iconite PNG |
| `src/app/[locale]/admin/pwa-settings/page.tsx` | NOU — pagina admin PWA |
| `src/components/admin/AdminSidebar.tsx` | Adaugat nav item PWA |
| `messages/ro.json` | Adaugat traduceri PWA |
| `messages/en.json` | Adaugat traduceri PWA |
| `src/app/[locale]/layout.tsx` | Actualizat link manifest |
| `public/manifest.json` | STERS — inlocuit de manifest.ts |

---

### Sesiunea 8 (12 Aprilie 2026) — Audit complet, securitate, bugfix-uri, performanta, PWA

Audit complet al intregului proiect: cod, securitate, performanta, UX. Identificate si rezolvate 35+ probleme in 5 faze.

#### ✅ FAZA 1: Securitate (8 vulnerabilitati fixate)

**1.1 Google OAuth token — validare audience obligatorie**
- `src/lib/auth.ts:200-203` — `if (clientId && data.aud !== clientId)` era bypass-abil cand `GOOGLE_CLIENT_ID` lipsea din env
- Fix: throw error daca `GOOGLE_CLIENT_ID` nu e setat; validare mereu obligatorie
- Impact: prevenire autentificare cu token-uri Google de la alte aplicatii

**1.2 JWT secret strength enforcement**
- `src/lib/auth.ts:6-9` — fara verificare la runtime daca secretele sunt suficient de puternice
- Fix: validare la startup — minim 32 caractere, crash explicit cu mesaj descriptiv
- Impact: previne deploy cu secrete slabe/predictibile

**1.3 Content-Security-Policy header**
- `next.config.ts` — lipsea CSP complet; orice XSS era exploatabil fara protectie
- Fix: CSP header cu whitelist: Google OAuth, GA4, Meta Pixel, Sentry, fonts
- Include: `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`

**1.4 Rate limit pe password change**
- `src/app/api/client/profile/route.ts` — zero rate limiting pe schimbare parola
- Fix: 5 incercari / 15 minute, cheie pe userId + IP
- Adaugat `PASSWORD_CHANGE_LIMIT` in `src/lib/rate-limit.ts`

**1.5 Sanitizare input in API routes**
- `sanitizeText()` exista in `src/lib/validations.ts` dar NU era importata nicaieri
- Fix: aplicat pe 3 API routes:
  - `POST /api/bookings` — clientName, description, stylePreference
  - `PUT /api/client/profile` — name
  - `POST /api/auth/register` — name

**1.6 IP detection fix in rate limiter**
- `src/lib/rate-limit.ts` — `x-forwarded-for` era prioritizat (spoofabil)
- Fix: `x-real-ip` prioritizat (Vercel il seteaza autoritativ)

**1.7 Body size limits**
- `next.config.ts` — fara limita pe body size, potential DoS
- Fix: `experimental.serverActions.bodySizeLimit: '2mb'`

**1.8 innerHTML eliminat din auth pages**
- `src/app/[locale]/auth/login/page.tsx` si `register/page.tsx` — `innerHTML = ''` pt Google button
- Fix: `while (container.firstChild) container.removeChild(container.firstChild)`

#### ✅ FAZA 2: Buguri confirmate (7 fix-uri)

**2.1 Admin dashboard JWT payload mismatch (BUG CRITIC)**
- `src/app/[locale]/admin/page.tsx:16` — folosea `payload.userId` care NU exista in JWT
- JWT-ul are `payload.sub` (string cu user ID)
- Fix: `payload.userId as number` → `Number(payload.sub)`
- Impact: Dashboard-ul afiseaza acum corect "Bun venit, [Nume]"

**2.2 Silent error swallowing**
- 4 fisiere aveau `.catch(() => {})` — erori inghitite complet
- Fix: `console.error()` adaugat in Header.tsx, AdminSidebar.tsx, BookingWizard.tsx

**2.3 AuthContext — eliminare fetch /api/auth/me pe fiecare navigare**
- `src/components/layout/Header.tsx` — `useEffect` cu `pathname` in deps → fetch la fiecare navigare
- Fix: creat `src/contexts/AuthContext.tsx` — fetch o singura data la mount, partajat global
- Integrat in layout.tsx ca `<AuthProvider>`
- Header.tsx si AdminSidebar.tsx refactorizate sa foloseasca `useAuth()`
- Impact: API calls reduse de la N (cate pagini vizitezi) la 1

**2.4 Serializable isolation level pt bookings**
- `src/app/api/bookings/route.ts` — `$transaction` fara isolation level explicit
- Fix: `isolationLevel: 'Serializable'` adaugat — previne phantom reads in double-booking check

**2.5 Index DB pe Booking.createdAt**
- `prisma/schema.prisma` — admin-ul sorteaza/filtreaza dupa `createdAt` fara index
- Fix: `@@index([createdAt])` pe Booking model
- Necesita migration: `npx prisma migrate dev`

**2.6 OG Image SVG → PNG dinamic**
- `public/og-image.svg` — Facebook/Twitter/LinkedIn/WhatsApp NU randeaza SVG ca OG image
- Fix: creat `src/app/[locale]/opengraph-image.tsx` — genereaza PNG 1200x630 cu `next/og`
- Layout.tsx actualizat sa nu mai referentieze `/og-image.svg` manual

**2.7 String-uri hardcoded in romana**
- `BookingWizard.tsx:316` — "Se incarca..." → `t('step3.loading')`
- `BookingWizard.tsx:252` — "Recomandam pe" → `t('step2.recommendation')`
- `error.tsx` — 4 string-uri hardcoded → `t('common.error.*')`
- `loading.tsx` — eliminat text, pastrat doar spinner
- Adaugate chei noi in `messages/ro.json` si `messages/en.json`:
  - `common.error.title/description/retry/home`
  - `booking.step3.loading`, `booking.step2.recommendation`

#### ✅ FAZA 3: Performanta

**3.1 Next.js Image in ArtistCards**
- `src/components/sections/ArtistCards.tsx` — `<img>` raw inlocuit cu `<Image>` Next.js
- Adaugat: `fill`, `sizes`, `priority` pe primele 2 carduri
- CSS transition `hover:scale-[1.02]` in loc de `framer-motion` `whileHover`
- `aria-label` adaugat pe artist cards

**3.2 Image optimization config**
- `next.config.ts` — adaugat `deviceSizes`, `imageSizes`, `*.googleusercontent.com` in `remotePatterns`

#### ✅ FAZA 4: UX & Imbunatatiri

**4.1 Toast integrat in BookingWizard**
- Toast system exista (`src/components/ui/Toast.tsx`) dar NU era folosit nicaieri
- Fix: `useToast()` integrat in BookingWizard — erori si non-success responses afisate ca toast

**4.2 ConfirmDialog component**
- Creat `src/components/ui/ConfirmDialog.tsx` — dialog reutilizabil cu variant `danger/warning`
- Bazeaza pe Modal.tsx existent, adauga icon, mesaj, butoane confirmare/anulare

**4.3 Error boundary cu Sentry**
- `src/app/[locale]/error.tsx` — rescris cu i18n + `Sentry.captureException(error)`
- Captureaza automat erorile de pagina in Sentry

**4.4 Sentry integration**
- Instalat `@sentry/nextjs`
- Creat: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- `next.config.ts` — wrapat cu `withSentryConfig()`
- CSP actualizat cu `https://*.ingest.sentry.io`
- Conditional pe `NEXT_PUBLIC_SENTRY_DSN` — nu face nimic daca nu e setat

#### ✅ FAZA 5: Inovatii

**5.1 PWA Support**
- Creat `public/manifest.json` — name, short_name, theme_color #0A0A0A, icon sizes
- Layout.tsx — adaugat `<link rel="manifest">`, `<meta name="theme-color">`, Apple PWA meta tags
- Pregatit pentru service worker si offline draft saving (viitor)

**5.2 Before/After Gallery Slider**
- Creat `src/components/features/gallery/BeforeAfterSlider.tsx`
- Slider comparatie imagini cu suport: mouse drag, touch, keyboard (arrows), click
- ARIA `role="slider"` cu `aria-valuenow/min/max`
- Labels configurabile (Fresh/Healed)
- `prisma/schema.prisma` — adaugat campuri pe GalleryItem: `beforeImagePath`, `isBeforeAfter`

#### Fisiere noi create
- `src/contexts/AuthContext.tsx` — auth state management global
- `src/app/[locale]/opengraph-image.tsx` — OG image PNG dinamic
- `src/components/ui/ConfirmDialog.tsx` — dialog confirmare actiuni destructive
- `src/components/features/gallery/BeforeAfterSlider.tsx` — slider before/after
- `public/manifest.json` — PWA manifest
- `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` — Sentry config

#### Fisiere modificate (20+)
- `src/lib/auth.ts`, `src/lib/rate-limit.ts`, `src/lib/validations.ts`
- `next.config.ts`, `prisma/schema.prisma`
- `src/middleware.ts` (nu, dar verificat)
- `src/app/[locale]/layout.tsx`, `src/app/[locale]/error.tsx`, `src/app/[locale]/loading.tsx`
- `src/app/[locale]/admin/page.tsx`
- `src/app/[locale]/auth/login/page.tsx`, `src/app/[locale]/auth/register/page.tsx`
- `src/app/api/bookings/route.ts`, `src/app/api/client/profile/route.ts`, `src/app/api/auth/register/route.ts`
- `src/components/layout/Header.tsx`, `src/components/admin/AdminSidebar.tsx`
- `src/components/sections/ArtistCards.tsx`
- `src/components/features/booking/BookingWizard.tsx`
- `messages/ro.json`, `messages/en.json`

---

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
