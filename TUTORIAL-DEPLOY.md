# Insomnia Tattoo v2.0 — Tutorial Deploy (MacBook)

> Acest tutorial te ghideaza pas cu pas de la 0 pana la site-ul live pe cPanel.
> Urmeaza fiecare pas in ordine. Nu sari peste nimic.

---

## Pasul 1: Pregatire MacBook

### 1.1 Instaleaza Node.js (daca nu il ai deja)

Deschide Terminal si ruleaza:

```bash
node --version
```

Daca primesti eroare sau versiunea e sub 18, instaleaza Node.js:

```bash
# Varianta 1: Direct de pe site
# Descarca si instaleaza de la https://nodejs.org (versiunea LTS, minim 18)

# Varianta 2: Cu Homebrew (daca ai Homebrew instalat)
brew install node@20
```

Verifica dupa instalare:

```bash
node --version    # trebuie sa fie v18+ sau v20+
npm --version     # trebuie sa fie v9+
```

### 1.2 Verifica MySQL

Ai nevoie de o baza de date MySQL. Ai doua optiuni:

**Optiunea A — Folosesti MySQL de pe cPanel (recomandat):**
- Intra in cPanel → MySQL Databases
- Creeaza o baza de date noua (ex: `insomnia_db`)
- Creeaza un user MySQL cu parola puternica
- Adauga user-ul la baza de date cu ALL PRIVILEGES
- Noteaza: host, user, parola, numele bazei de date
- Host-ul va fi de obicei `localhost` sau IP-ul serverului cPanel

**Optiunea B — Instalezi MySQL local pe MacBook (pentru test):**

```bash
brew install mysql
brew services start mysql
mysql -u root -e "CREATE DATABASE insomnia_dev;"
```

---

## Pasul 2: Deschide proiectul

```bash
cd ~/Documents/Projects/Insomnia
```

Sau wherever ai proiectul pe MacBook. Daca il transferi de pe Windows:

```bash
# Copiaza folderul proiectului pe MacBook (USB, AirDrop, Git, etc.)
# Apoi:
cd /cale/catre/Insomnia
```

---

## Pasul 3: Instaleaza dependentele

```bash
npm install
```

Asteapta sa se termine. Daca apar erori de tip `sharp` sau `bcryptjs`, ruleaza:

```bash
npm install --force
```

---

## Pasul 4: Configureaza fisierul `.env.local`

Creeaza fisierul `.env.local` in radacina proiectului:

```bash
touch .env.local
open -e .env.local
```

Copiaza TOT textul de mai jos si completeaza valorile reale:

```env
# ============================================
# DATABASE — MySQL
# ============================================
# Daca folosesti MySQL de pe cPanel:
DATABASE_URL="mysql://USER:PAROLA@HOST:3306/NUME_BAZA_DATE"
# Exemplu: DATABASE_URL="mysql://insomnia_user:ParolaMea123@91.99.xx.xx:3306/insomnia_db"
#
# Daca folosesti MySQL local pe MacBook:
# DATABASE_URL="mysql://root:@localhost:3306/insomnia_dev"

# ============================================
# JWT — Secrete pentru autentificare
# ============================================
# IMPORTANT: Genereaza valori random unice! Ruleaza in terminal:
#   openssl rand -base64 48
# si copiaza rezultatul pentru fiecare:
JWT_SECRET="COPIAZA_AICI_VALOAREA_RANDOM_1"
JWT_REFRESH_SECRET="COPIAZA_AICI_VALOAREA_RANDOM_2"

# ============================================
# ADMIN — Contul Super Admin
# ============================================
SEED_ADMIN_PASSWORD="ParolaAdminPuternica123!"
# Asta va fi parola pentru admin@insomniatattoo.ro
# Minim 8 caractere, foloseste litere + cifre + simboluri

# ============================================
# EMAIL — SMTP (cPanel)
# ============================================
SMTP_HOST="mail.insomniatattoo.ro"
SMTP_PORT=465
SMTP_USER="contact@insomniatattoo.ro"
SMTP_PASS="parola_email_cpanel"

# Email-ul admin unde primesti notificari (loyalty P10, etc.)
ADMIN_EMAIL="admin@insomniatattoo.ro"

# ============================================
# GOOGLE OAUTH — Pentru login cu Google
# ============================================
# Vezi Pasul 5 de mai jos pentru cum le obtii
GOOGLE_CLIENT_ID="xxxxxxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxx"

# Fa public client ID-ul (necesar pe frontend):
NEXT_PUBLIC_GOOGLE_CLIENT_ID="xxxxxxxxx.apps.googleusercontent.com"

# ============================================
# GOOGLE MAPS — Harta contact
# ============================================
NEXT_PUBLIC_GOOGLE_MAPS_KEY="cheia_google_maps"
NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL="https://www.google.com/maps/embed?pb=..."

# ============================================
# ANALYTICS (optional, poti adauga mai tarziu)
# ============================================
# NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
# NEXT_PUBLIC_META_PIXEL_ID="XXXXXXXXXXXXXXX"

# ============================================
# APP
# ============================================
NEXT_PUBLIC_BASE_URL="https://insomniatattoo.ro"
NODE_ENV="production"
```

### 4.1 Genereaza JWT secrets

In Terminal, ruleaza de 2 ori si copiaza fiecare rezultat:

```bash
openssl rand -base64 48
```

Prima valoare → `JWT_SECRET`
A doua valoare → `JWT_REFRESH_SECRET`

**NU folosi aceeasi valoare pentru ambele!**

Salveaza `.env.local` si inchide editorul.

---

## Pasul 5: Configureaza Google OAuth

### 5.1 Creeaza proiect Google Cloud

1. Deschide: https://console.cloud.google.com/
2. Logheaza-te cu contul Google al salonului (sau contul tau personal)
3. Click pe selectorul de proiect (sus-stanga) → **New Project**
4. Nume: `Insomnia Tattoo` → **Create**
5. Selecteaza proiectul nou creat

### 5.2 Configureaza OAuth Consent Screen

1. In meniul din stanga: **APIs & Services** → **OAuth consent screen**
2. User Type: **External** → **Create**
3. Completeaza:
   - App name: `Insomnia Tattoo`
   - User support email: `admin@insomniatattoo.ro` (sau email-ul tau)
   - Developer contact: acelasi email
4. Click **Save and Continue**
5. Scopes → click **Save and Continue** (nu adauga nimic)
6. Test users → click **Save and Continue**
7. Summary → **Back to Dashboard**

### 5.3 Creeaza credentialele OAuth

1. **APIs & Services** → **Credentials**
2. **+ Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `Insomnia Tattoo Web`
5. **Authorized JavaScript origins** — adauga AMBELE:
   - `http://localhost:3000`
   - `https://insomniatattoo.ro`
6. **Authorized redirect URIs** — adauga AMBELE:
   - `http://localhost:3000`
   - `https://insomniatattoo.ro`
7. Click **Create**
8. Copiaza **Client ID** si **Client Secret**

### 5.4 Pune valorile in `.env.local`

```bash
open -e .env.local
```

Inlocuieste:
- `GOOGLE_CLIENT_ID` cu Client ID-ul copiat
- `GOOGLE_CLIENT_SECRET` cu Client Secret-ul copiat
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` cu acelasi Client ID

Salveaza.

---

## Pasul 6: Migrare baza de date

### 6.1 Genereaza clientul Prisma

```bash
npx prisma generate
```

### 6.2 Aplica schema pe baza de date

**Daca baza de date e goala (prima instalare):**

```bash
npx prisma db push
```

**Daca baza de date exista deja (upgrade de la v1):**

```bash
npx prisma migrate dev --name v2-users-loyalty-reviews
```

Daca primesti eroare de conexiune:
- Verifica `DATABASE_URL` din `.env.local`
- Verifica ca MySQL ruleaza
- Daca folosesti cPanel remote, verifica ca IP-ul MacBook-ului tau e whitelisted in cPanel → Remote MySQL

### 6.3 Populeaza datele initiale

```bash
npm run db:seed
```

Asta creeaza:
- Contul admin: `admin@insomniatattoo.ro` (cu parola din `SEED_ADMIN_PASSWORD`)
- Florentin — cont ARTIST
- Madalina — cont ARTIST
- Template-uri disponibilitate default pentru ambii artisti

**Daca primesti eroare "Unique constraint failed"** — inseamna ca seed-ul a mai rulat o data. E OK, datele exista deja.

---

## Pasul 7: Build

```bash
npx next build
```

**Asta e pasul cel mai important.** Verifica ca tot codul compileaza corect.

- Daca totul e OK: vei vedea `✓ Compiled successfully` si o lista de pagini generate
- Daca apar erori: **copiaza TOATA eroarea** si trimite-mi-o — o fixez instant

Erori comune si solutii rapide:

| Eroare | Cauza | Solutie |
|--------|-------|---------|
| `Module not found: '@/...'` | Import lipsa | Trimite-mi eroarea |
| `Type error: ...` | TypeScript | Trimite-mi eroarea |
| `PrismaClientInitializationError` | DB nu e conectata | Verifica `DATABASE_URL` |
| `sharp` erori | Dependenta nativa | `npm install sharp --force` |

---

## Pasul 8: Test local

```bash
npm run dev
```

Deschide in browser: http://localhost:3000

### 8.1 Teste rapide (fa-le pe toate)

**Test 1 — Homepage:**
- [ ] Site-ul se incarca
- [ ] Culorile sunt silver/gri (NU auriu)
- [ ] Artistii apar (Florentin, Madalina)
- [ ] Pe desktop, o lumina subtila urmareste cursorul

**Test 2 — Register client:**
- [ ] Deschide: http://localhost:3000/auth/register
- [ ] Completeaza: Nume Test, email@test.com, parola 12345678, bifa GDPR
- [ ] Apasa "Creeaza cont"
- [ ] Esti redirectat la `/account` (dashboard client)

**Test 3 — Portal client:**
- [ ] Vezi dashboard-ul cu card loyalty
- [ ] Click pe "Programari" — pagina se incarca
- [ ] Click pe "Puncte fidelitate" — pagina se incarca cu card vizual
- [ ] Click pe "Recenzii" — pagina se incarca
- [ ] Click pe "Setari" — vezi formularul cu numele si emailul tau

**Test 4 — Logout si login:**
- [ ] Click "Deconectare" in sidebar
- [ ] Deschide: http://localhost:3000/auth/login
- [ ] Logheaza-te cu email@test.com / 12345678
- [ ] Esti redirectat la `/account`

**Test 5 — Admin login:**
- [ ] Deschide: http://localhost:3000/admin/login
- [ ] Logheaza-te cu `admin@insomniatattoo.ro` / parola din `SEED_ADMIN_PASSWORD`
- [ ] Esti redirectat la `/admin`
- [ ] In sidebar vezi: Dashboard, Bookings, Disponibilitate, Galerie, **Artisti**, **Recenzii**, **Loyalty**

**Test 6 — Booking:**
- [ ] Du-te pe homepage → click "Programeaza"
- [ ] Completeaza wizard-ul → trimite
- [ ] Verifica in admin → Bookings → apare booking-ul nou

**Test 7 — Google login (optional acum):**
- [ ] Daca ai configurat Google OAuth, testeaza butonul "Continua cu Google" pe login/register

### 8.2 Daca totul functioneaza

Opreste serverul local cu `Ctrl+C` in Terminal.

Mergi la pasul urmator.

### 8.3 Daca ceva nu functioneaza

- Fa screenshot sau copiaza eroarea din browser/terminal
- Trimite-mi-o si o rezolv

---

## Pasul 9: Pregatire pentru cPanel

### 9.1 Build production

```bash
npx next build
```

### 9.2 Verifica structura output

Dupa build, ar trebui sa ai:

```
.next/
  standalone/         ← TOT serverul (server.js + node_modules minimale)
  static/             ← CSS, JS, imagini optimize
public/               ← Favicon, og-image, uploads
.env.local            ← Variabilele de environment
prisma/
  schema.prisma       ← Schema DB
```

---

## Pasul 10: Upload pe cPanel

### 10.1 Conecteaza-te la cPanel

Deschide cPanel-ul hosting-ului tau (ex: `https://insomniatattoo.ro:2083`)

### 10.2 Creeaza aplicatia Node.js

1. **cPanel** → **Setup Node.js App** (sau "Node.js Selector")
2. Click **Create Application**
3. Configureaza:
   - Node.js version: `18` sau `20` (cea mai recenta disponibila)
   - Application mode: `Production`
   - Application root: `insomniatattoo.ro` (sau folderul site-ului)
   - Application URL: `insomniatattoo.ro`
   - Application startup file: `server.js`
4. Click **Create**
5. Noteaza comanda de activare a environment-ului (ceva de genul):
   ```bash
   source /home/USER/nodevenv/insomniatattoo.ro/20/bin/activate
   ```

### 10.3 Urca fisierele

Foloseste **File Manager** din cPanel sau **SFTP** (cu FileZilla/Cyberduck).

Urca aceste fisiere/foldere in directorul aplicatiei:

```
Urca:
├── .next/standalone/     → copiaza CONTINUTUL in radacina app (inclusiv server.js)
├── .next/static/         → copiaza in .next/static/ (creeaza folderul .next daca nu exista)
├── public/               → copiaza tot folderul
├── .env.local            → copiaza in radacina app
├── prisma/schema.prisma  → copiaza in prisma/
└── node_modules/.prisma/ → copiaza in node_modules/.prisma/
```

**Structura finala pe server:**

```
/home/USER/insomniatattoo.ro/
├── server.js                    ← din .next/standalone/
├── .env.local                   ← variabilele tale
├── .next/
│   └── static/                  ← din .next/static/
├── public/
│   ├── favicon.svg
│   ├── og-image.svg
│   ├── images/
│   └── uploads/
├── prisma/
│   └── schema.prisma
├── node_modules/
│   ├── .prisma/                 ← clientul Prisma generat
│   └── ... (restul din standalone)
└── package.json
```

### 10.4 Configureaza environment variables pe cPanel

**Metoda 1 — Fisier `.env.local`** (deja urcat la 10.3)

**Metoda 2 — Din interfata Node.js App** (mai sigur):
1. Du-te la Setup Node.js App → aplicatia ta → Edit
2. Sectiunea "Environment variables"
3. Adauga fiecare variabila din `.env.local` ca key-value pair
4. Save

### 10.5 Initializeaza baza de date pe server

Conecteaza-te prin SSH la cPanel (sau foloseste Terminal din cPanel):

```bash
# Activeaza environment-ul Node.js (comanda de la pasul 10.2)
source /home/USER/nodevenv/insomniatattoo.ro/20/bin/activate

# Genereaza clientul Prisma
npx prisma generate

# Aplica schema
npx prisma db push

# Populeaza datele initiale
node prisma/seed.js
```

**Nota:** Daca `prisma/seed.js` nu exista in standalone, ruleaza seed-ul de pe MacBook (cu DATABASE_URL catre MySQL-ul de pe cPanel).

### 10.6 Porneste aplicatia

In cPanel → Setup Node.js App → click **Restart** pe aplicatia ta.

---

## Pasul 11: Verificare site live

### 11.1 Deschide site-ul

Deschide: `https://insomniatattoo.ro`

### 11.2 Checklist final

- [ ] Homepage se incarca cu culori silver
- [ ] Artistii apar din baza de date
- [ ] Booking wizard functioneaza
- [ ] `/auth/register` — register functioneaza
- [ ] `/auth/login` — login functioneaza
- [ ] `/account` — portal client se incarca
- [ ] `/admin/login` — admin login functioneaza
- [ ] `/admin` — dashboard admin cu toate sectiunile
- [ ] Google login functioneaza (butonul "Continua cu Google")
- [ ] Email-urile se trimit (fa un booking test si verifica inbox-ul)
- [ ] HTTPS functioneaza (lacat verde in browser)
- [ ] Site-ul se incarca pe telefon (responsive)

### 11.3 Daca ceva nu merge

**Site-ul nu se incarca:**
- Verifica in cPanel ca aplicatia Node.js e pornita
- Verifica logs: cPanel → Errors sau Node.js App → View Logs

**Eroare 500:**
- Verifica `.env.local` e in folderul corect
- Verifica `DATABASE_URL` e corect
- Verifica `node_modules/.prisma/` exista pe server

**Email-urile nu se trimit:**
- Verifica `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`
- Testeaza in cPanel ca email-ul exista si functioneaza

**Google login nu merge:**
- Verifica ca `https://insomniatattoo.ro` e in "Authorized JavaScript origins" in Google Cloud Console
- Verifica `NEXT_PUBLIC_GOOGLE_CLIENT_ID` e setat corect

---

## Pasul 12: Dupa lansare

### 12.1 Imagini reale (IMPORTANT)
Logheaza-te ca admin si urca imaginile reale:
1. `/admin/gallery` — minim 10-15 lucrari per artist
2. Portretele artistilor — prin `/admin/artists` → Edit → Upload foto profil

### 12.2 Securitate finala
- [ ] Schimba parola admin daca ai folosit una simpla pentru test
- [ ] Verifica ca `/admin` nu e accesibil fara login
- [ ] Verifica ca `/api/upload` returneaza 401 fara autentificare

### 12.3 Google Business Profile
- Adauga link-ul site-ului pe Google Business
- Cere review-uri de la primii clienti

---

## Troubleshooting Rapid

| Problema | Comanda/Solutie |
|----------|----------------|
| `npm install` esueaza | `npm install --force` |
| Eroare Prisma conexiune | Verifica `DATABASE_URL` si ca MySQL ruleaza |
| Eroare build TypeScript | Copiaza eroarea si trimite-mi-o |
| `sharp` nu se instaleaza | `npm install sharp --platform=linux --arch=x64` (pentru cPanel Linux) |
| Port 3000 ocupat | `npx kill-port 3000` sau `lsof -ti:3000 \| xargs kill` |
| Seed da eroare "unique" | Normal daca a mai rulat — datele exista deja |
| cPanel nu gaseste server.js | Verifica ca ai copiat CONTINUTUL din `.next/standalone/`, nu folderul in sine |

---

**Intrebari? Probleme?** Trimite-mi screenshot-ul sau eroarea completa si o rezolv.
