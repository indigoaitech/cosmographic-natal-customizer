# Cosmographi · Birth Map Generator

Minimal natal-chart app for [www.cosmographic.store](https://www.cosmographic.store).  
Enter birth date, time (HH:MM), and place → one classic print-ready Swiss Ephemeris chart + a brief reading.

Contact: cosmographicstore@gmail.com

## Stack

| Layer | Tech |
|-------|------|
| Web | Next.js (App Router) + TypeScript |
| Chart engine | Python FastAPI + Swiss Ephemeris (`pyswisseph`) |
| Geocode / TZ | OpenStreetMap Nominatim + `timezonefinder` |
| Hosting | Vercel (web) · Railway / Render (ephemeris) |

## Layout

```text
apps/web                 Birth map UI + /api/chart · /api/health
services/ephemeris       Swiss Ephemeris microservice
packages/shared          Shared TypeScript chart contracts
```

## Quick start

### 1. Ephemeris API

```bash
cd services/ephemeris
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
./scripts/download_ephe.sh
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Health: `GET http://localhost:8000/v1/health`

### 2. Web app

```bash
cp apps/web/.env.example apps/web/.env.local
# set EPHEMERIS_API_URL=http://localhost:8000
npm install
npm run dev:web
```

Open [http://localhost:3000](http://localhost:3000).

## Env

| Variable | Where | Purpose |
|----------|--------|---------|
| `EPHEMERIS_API_URL` | `apps/web/.env.local` / Vercel | Chart calculation service |
| `NEXT_PUBLIC_APP_URL` | optional | Public site origin |

## Deploy

- **Web:** `vercel.json` → `npm install` + `npm run build --workspace=web` → output `apps/web/.next`
- **Ephemeris:** `render.yaml` Blueprint, or your Railway service URL in `EPHEMERIS_API_URL`
