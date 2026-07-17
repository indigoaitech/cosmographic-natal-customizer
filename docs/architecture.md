# Architecture — Cosmographic Personalized POD Engine

Master spec compliance map for Cosmographic.store.

## System overview

```text
┌──────────────────────┐   validate    ┌─────────────────────┐
│  Next.js Portal      │──────────────▶│  /api/chart (BFF)   │
│  Birth form + UX     │               └──────────┬──────────┘
└──────────┬───────────┘                          │
           │                                      ▼
           │                           ┌─────────────────────┐
           │                           │ Ephemeris Service   │
           │                           │ Swiss Ephemeris +   │
           │                           │ Nominatim + TZ      │
           │                           └──────────┬──────────┘
           │                                      │ ChartPayload
           ▼                                      ▼
┌──────────────────────┐   SVG serialize  ┌─────────────────────┐
│ SVG Render Engine    │─────────────────▶│ Asset / Session     │
│ Front wheel          │  300 DPI meta    │ /api/session        │
│ Back table + logo    │                  │ design storage      │
└──────────────────────┘                  └──────────┬──────────┘
                                                     │ session_id
                                                     ▼
                                          ┌─────────────────────┐
                                          │ Shopify personalized│
                                          │ collection + theme  │
                                          │ line-item props     │
                                          └──────────┬──────────┘
                                                     │ orders/create
                                                     ▼
                                          ┌─────────────────────┐
                                          │ Printify client     │
                                          │ (wire API token)    │
                                          └─────────────────────┘
```

## Module map (apps/web/src/lib)

| Spec module | Path |
|-------------|------|
| Validation | `validation/birth.ts` |
| Errors + recovery | `errors/appError.ts` |
| Logging | `logging/logger.ts` |
| Analytics | `analytics/track.ts` |
| Catalog / SKUs | `catalog/products.ts` |
| Print artboards @ 300 DPI | `print/artboard.ts` |
| Session | `session/*` |
| Privacy / GDPR erase | `session/privacy.ts` |
| CORS | `security/cors.ts` |
| Shopify | `shopify/*` |
| Print provider | `printify/client.ts` |
| Cloud storage | `storage/cloud.ts` |
| Chart geometry/themes | `chart/*` |

## Ephemeris (services/ephemeris)

- `/v1/natal-chart` — Swiss Ephemeris only (`FLG_SWIEPH`)
- `/v1/geocode` — primary hit
- `/v1/geocode/search` — candidate list for disambiguation
- `/v1/timezone` — DST-aware civil time → UTC

## Commerce path (canonical)

1. Generate chart
2. Preview front/back + product catalog
3. **Create My Personalized Products** → `POST /api/session`
4. Redirect `?session_id=` to Shopify collection
5. Theme liquid injects mockups + line props
6. Checkout → webhook → Printify stub / CRM / email

Advanced single-variant `/api/cart` remains behind a disclosure on the portal.

## Privacy

- `/privacy` policy page
- `DELETE /api/session/:id` erasure
- CORS allowlist (no `*` in production path)
- Chart snapshot omitted from disk unless `SESSION_STORE_CHART_SNAPSHOT=1`
- Structured logs redact birth PII fields

## Still wiring for full production POD

- Cloudinary/S3 upload adapter body
- Printify V1 order create HTTP calls
- True fabric displacement / Printify Mockup Generator
- SVG→PNG @ 300 DPI (resvg) for vendors rejecting SVG
- Google Places (Nominatim search covers disambiguation today)
