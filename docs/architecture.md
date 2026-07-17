# Architecture — Cosmographic Natal Customizer

## System overview

```text
┌─────────────────┐     BFF      ┌──────────────────────┐
│  Next.js Web    │─────────────▶│  /api/chart          │
│  (customizer)   │              │  /api/crm/leads      │
│                 │              │  /api/webhooks/…     │
└────────┬────────┘              └──────────┬───────────┘
         │                                  │
         │ Shopify Storefront               │ HTTP
         ▼                                  ▼
┌─────────────────┐              ┌──────────────────────┐
│ cosmographic    │              │ Ephemeris Service    │
│ .store checkout │              │ FastAPI + pyswisseph │
└────────┬────────┘              └──────────┬───────────┘
         │ orders/create webhook            │
         ▼                                  ▼
┌─────────────────┐              Interpretations dictionary
│ SQLite CRM      │              + Swiss Ephemeris positions
│ + Resend mail   │
│ info@cosmo…     │
└─────────────────┘
```

## Natal chart computation pipeline

1. **Validate** birth date, local time, location (city/country).
2. **Geocode** → latitude / longitude (Nominatim, cached).
3. **Resolve timezone** from lat/lon (`timezonefinder`) → IANA zone.
4. **Convert** local civil time → UTC using zone rules (DST-aware via `zoneinfo`).
5. **Julian Day** (UT) for Swiss Ephemeris.
6. **Compute** planets, houses, angles, aspects.
7. **Enrich** with static dictionary interpretations (planet×sign, planet×house, house×sign).
8. **Return** `ChartPayload` for Option A SVG + purchase-page summary table.

## API surface (ephemeris)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v1/health` | Liveness + sweph version |
| POST | `/v1/geocode` | Place → coordinates |
| POST | `/v1/timezone` | Lat/lon + local DT → IANA TZ + UTC offset |
| POST | `/v1/natal-chart` | Full natal computation + interpretation rows |

## Placement dictionary

`services/ephemeris/app/interpretations/dictionary.py` — O(1) lookup maps with curated overrides.
Rendered on the customizer as **Placement highlights**.

## Cosmographic print engine (apps/web)

| Spec | Value |
|------|-------|
| Artboard | 15″ × 19″ @ 300 DPI (4500 × 5700 px) |
| Chart diameter | 85% of canvas height |
| Camera | Fixed tilt (pitch/yaw/roll) — structural shell locked |
| Strokes | DTG minimum weights in `lib/chart/pod.ts` |
| FX | Organic neon tubes + `feGaussianBlur` / `feMerge` filters |

Components: `GalacticNatalChart`, `GalacticStructuralShell`, `GalacticFilters`.
Ephemeris positions map into the tilted disc without moving the outer matrix.

## Shopify handoff

Line-item properties for checkout + CRM:

- `_design_option`, `_print_side`, `_visual_id`, `_chart_summary`
- `_date_of_birth`, `_time_of_birth`, `_birth_city`, `_birth_country`

## CRM + post-purchase email

| Piece | Location |
|-------|----------|
| Lead capture | `POST /api/crm/leads` (requires marketing opt-in) |
| Order webhook | `POST /api/webhooks/shopify/orders-create` |
| SQLite CRM | `apps/web/data/crm.sqlite` |
| Mail from | **info@cosmographic.store** via Resend |

Webhook: verify HMAC → upsert name/email/DOB → send confirmation from the store domain.

## Security notes

- Shopify tokens and ephemeris URL stay server-side.
- Marketing storage requires explicit opt-in (or Shopify `accepts_marketing`).
- Never send store mail from personal Gmail — only `info@cosmographic.store`.
