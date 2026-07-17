# Production operations — Cosmographic Personalized POD

## Architecture overview

See [`architecture.md`](./architecture.md) and [`personalization-engine.md`](./personalization-engine.md).

**Runtime pieces**

| Piece | Host | Notes |
|-------|------|--------|
| Next.js portal + BFF | Vercel (or Node) | `apps/web` |
| Swiss Ephemeris API | Fly / Railway / Render | `services/ephemeris` + `.se1` files |
| Shopify Online Store | Shopify | personalized collection + liquid |
| Printify | Printify | dry-run until blueprint mapped |
| Asset storage | Local FS (default) or Cloudinary/S3 | durable storage required for multi-instance |

## Environment variables

Copy `apps/web/.env.example`. Critical production keys:

| Variable | Required | Purpose |
|----------|----------|---------|
| `EPHEMERIS_API_URL` | yes | Ephemeris base URL |
| `NEXT_PUBLIC_APP_URL` | yes | Absolute print asset URLs |
| `SHOPIFY_SHOP_DOMAIN` | yes | `*.myshopify.com` |
| `SHOPIFY_PRODUCT_VARIANT_ID` or `SHOPIFY_VARIANT_*` | yes | Cart / SKU mapping |
| `SHOPIFY_STOREFRONT_TOKEN` | recommended | Headless cart |
| `SHOPIFY_WEBHOOK_SECRET` | yes (orders) | HMAC |
| `CORS_ALLOWED_ORIGINS` | yes | Session API origins |
| `SESSION_API_TOKEN` | yes (ops) | Full session + purge |
| `PRINTIFY_API_TOKEN` / `SHOP_ID` | for fulfillment | Live POD |
| `PRINTIFY_DRY_RUN` | `true` until live | Safety |
| `PRINTIFY_BLUEPRINT_ID` | for live orders | Product mapping |
| `RESEND_API_KEY` | optional | Transactional mail |

## Deployment

### Web (Vercel)

```bash
cd apps/web
npx vercel --prod
```

Set all env vars in the Vercel project. Point `www.cosmographic.store` DNS to Vercel (see [`deploy-www.md`](./deploy-www.md)).

### Ephemeris

```bash
cd services/ephemeris
./scripts/download_ephe.sh
# Deploy Dockerfile; mount/include ephe/; set EPHE_PATH
```

Health: `GET /v1/health` must report Swiss Ephemeris version.

### Shopify theme

1. Create collection handle `personalized` (or set `SHOPIFY_PERSONALIZED_COLLECTION_HANDLE`).
2. Install [`shopify-session-personalization.liquid`](./shopify-session-personalization.liquid).
3. Register webhook `orders/create` → `https://<app>/api/webhooks/shopify/orders-create`.

### Verify

```bash
curl -s https://<app>/api/health | jq
# ok:true when ephemeris reachable and a variant ID is configured
```

Main journey: birth form → chart → Create My Personalized Products → Shopify `?session_id=` → cart → checkout.

## Monitoring hooks

| Endpoint | Use |
|----------|-----|
| `GET /api/health` | Uptime / dependency probe (503 if degraded) |
| Structured JSON logs | `lib/logging/logger.ts` (PII redacted) |
| `NEXT_PUBLIC_ANALYTICS_ENDPOINT` | Optional event beacon |
| `POST /api/ops/purge-sessions` | Cron: Bearer `SESSION_API_TOKEN` |

Recommended: ping `/api/health` every 1–5 minutes; alert on 503.

## Recovery procedures

| Failure | Recovery |
|---------|----------|
| Ephemeris down | Restart service; confirm `/v1/health`; chart API returns `EPHEMERIS_UNAVAILABLE` + retry hint |
| Geocode miss | User retries with clearer city/country; use `/v1/geocode/search` candidates |
| Session expired (410) | User regenerates chart + Create My Personalized Products |
| Shopify cart fail | Check variant IDs / Storefront token; permalink fallback if token missing |
| Printify fail | Webhook logs `printify.ok=false`; fulfill manually via `_print_*_url` line props |
| Accidental live Printify | Keep `PRINTIFY_DRY_RUN=true` until blueprint mapping verified |

## Backup strategy

| Data | Location | Backup |
|------|----------|--------|
| Design SVGs | `apps/web/data/designs` (or `DESIGN_STORAGE_PATH`) | Daily volume snapshot / sync to S3 |
| Sessions | `apps/web/data/sessions` | Short TTL (72h); purge via ops endpoint; optional S3 |
| CRM SQLite | `apps/web/data/crm.sqlite` | Daily copy off-instance; prefer managed DB in scale-out |
| Ephemeris `.se1` | `services/ephemeris/ephe` | Rebuild via `download_ephe.sh` |
| Shopify / Printify | Vendor SaaS | Vendor retention |

**Serverless note:** local FS is **not** durable across Vercel instances. Production must set Cloudinary/S3 before multi-region scale.

## Security checklist

- [ ] `CORS_ALLOWED_ORIGINS` does not include `*`
- [ ] `SESSION_API_TOKEN` set; full session format gated
- [ ] Webhook HMAC secret set
- [ ] `PRINTIFY_DRY_RUN=true` until go-live
- [ ] No birth PII in analytics payloads
- [ ] Privacy page linked (`/privacy`)

## Tests

```bash
cd apps/web && npm test
cd services/ephemeris && .venv/bin/pytest tests/ -q
```
