# Deploy Swiss Ephemeris API on Railway

Preferred path for Cosmographic. Goal: public HTTPS URL → Vercel `EPHEMERIS_API_URL`.

Service root: `services/ephemeris` (Python FastAPI + Docker). `.se1` files are gitignored; the **Dockerfile downloads them at build time**.

---

## Prerequisites

- Railway account: https://railway.app
- This repo pushed to GitHub **or** Railway CLI with local deploy
- Node.js (for `npx @railway/cli`)

```bash
# Install CLI (once)
npm i -g @railway/cli
# or use npx without global install
```

---

## CLI — deploy `services/ephemeris` as service root

```bash
# 1) Auth (opens browser)
npx @railway/cli login

# 2) From monorepo root OR from the service dir
cd /path/to/cosmographic-natal-customizer/services/ephemeris

# 3) Create / link a project + service
npx @railway/cli init
# Follow prompts: create new project, e.g. "cosmographic-ephemeris"

# 4) Ensure Docker build (railway.json already points at Dockerfile)
# Optional: set variables explicitly
npx @railway/cli variables set \
  EPHE_PATH=/app/ephe \
  CORS_ORIGINS="https://www.cosmographic.store,https://shop.cosmographic.store,http://localhost:3000" \
  NOMINATIM_USER_AGENT="CosmographicNatalCustomizer/0.1 (cosmographicstore@gmail.com)" \
  NOMINATIM_BASE_URL="https://nominatim.openstreetmap.org"

# 5) Deploy from this subdirectory (current dir = service root)
npx @railway/cli up --detach

# 6) Attach a public HTTPS domain
npx @railway/cli domain

# 7) Copy the URL printed (e.g. https://cosmographic-ephemeris-production.up.railway.app)
npx @railway/cli status
```

### Monorepo alternative (GitHub connected)

If the service is linked to a GitHub repo instead of `railway up`:

1. Railway Dashboard → Project → Service → **Settings**
2. **Root Directory** = `services/ephemeris`
3. **Builder** = Dockerfile (`Dockerfile` in that root)
4. Health check path = `/v1/health`
5. Redeploy

Same env vars as above. Railway injects `PORT` automatically; the Dockerfile already uses `${PORT:-8000}`.

---

## Verify

```bash
HOST=https://<your-railway-host>

curl -s "$HOST/v1/health"
# {"status":"ok","service":"cosmographic-ephemeris","swissEphemeris":"..."}

curl -s -X POST "$HOST/v1/natal-chart" \
  -H 'Content-Type: application/json' \
  -d '{
    "dateOfBirth":"1990-07-12",
    "timeOfBirth":"14:32",
    "location":{"city":"Athens","country":"Greece"},
    "houseSystem":"P"
  }'
```

---

## Wire Vercel

```bash
cd apps/web
npx vercel env add EPHEMERIS_API_URL production --value 'https://<your-railway-host>' --yes --force
npx vercel --prod --yes
curl -s https://www.cosmographic.store/api/health
# checks.ephemeris.ok === true
```

Paste the Railway HTTPS URL back into Cursor when ready — we will set the Vercel env and re-smoke chart → session → Shopify.
