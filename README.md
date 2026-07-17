# Cosmographic Natal Chart T-Shirt Customizer

Interactive natal-chart customizer for [www.cosmographic.store](https://www.cosmographic.store).  
Contact: cosmographicstore@gmail.com

## Stack

| Layer | Tech |
|-------|------|
| Web customizer | Next.js (App Router) + TypeScript |
| Chart engine | Python FastAPI + Swiss Ephemeris (`pyswisseph`) |
| Geocode / TZ | OpenStreetMap Nominatim + `timezonefinder` |
| Commerce | Shopify Storefront API (line-item properties → checkout) |

## Monorepo layout

```text
apps/web                 Next.js customizer + BFF routes
services/ephemeris       Swiss Ephemeris microservice
packages/shared          Shared TypeScript chart contracts
docs/                    Architecture notes
```

## Quick start

### 1. Ephemeris API

```bash
cd services/ephemeris
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
./scripts/download_ephe.sh   # Swiss Ephemeris .se1 data files
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Health: `GET http://localhost:8000/v1/health`  
Docs: `http://localhost:8000/docs`

### 2. Web app

```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

See `services/ephemeris/.env.example` and `apps/web/.env.example`.

Key production settings for the web app:

- `RESEND_API_KEY` — transactional mail from **info@cosmographic.store**
- `SHOPIFY_WEBHOOK_SECRET` — HMAC for `orders/create` CRM ingestion
- `EMAIL_DRY_RUN=true` — safe local mode (no outbound mail)

### Shopify

Setup guide: [`docs/shopify-setup.md`](docs/shopify-setup.md)

- Cart / checkout: `POST /api/cart`
- Design asset: `POST /api/design` · `GET /api/design/{visualId}?format=svg`
- Webhook: `https://<your-host>/api/webhooks/shopify/orders-create`
