# Casa de Rin digitalni meni (Netlify)

## Lokalni zagon
1. `npm install`
2. Nastavi env v `.env`:
   - `ADMIN_PASSWORD=močno_geslo`
   - `SESSION_SECRET=dolg_naključen_niz`
3. `npm run dev`
4. Odpri:
   - `http://localhost:8888/menu`
   - `http://localhost:8888/admin`

## Deploy na Netlify
1. Push na Git.
2. Netlify: **Add new site > Import from Git**.
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `public`
   - Functions directory: `netlify/functions`
4. Environment variables v Netlify:
   - `ADMIN_PASSWORD`
   - `SESSION_SECRET`
5. Deploy.

## Potrebne Netlify nastavitve
- Functions morajo biti omogočene (free plan podpira).
- Blobs: omogoči Netlify Blobs za projekt (uporablja se store `menu`).

## Ali free plan zadostuje?
Da, za mini meni aplikacijo z normalnim prometom. Netlify Free vključuje statične strani, functions in blobs kvote.

## Omejitve
- Avtentikacija je enostavna (geslo + podpisan token), brez role-based uporabnikov.
- Če želiš več uporabnikov/admin računov, uporabi Netlify Identity ali zunanji auth.
- Brez `SESSION_SECRET` ni varne seje.
- Če želiš urejanje tudi ob izpadu Netlify Functions, potrebuješ zunanji backend (npr. Google Sheets + Apps Script).
