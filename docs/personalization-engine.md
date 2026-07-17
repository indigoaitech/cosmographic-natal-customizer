# Personalized Storefront Engine

End-to-end flow for Cosmographic.store natal POD personalization.

```text
Birth form → Swiss Ephemeris → Front SVG (wheel) + Back SVG (table+logo)
     → POST /api/session → session_id UUID
     → Redirect Shopify /collections/personalized?session_id=…
     → Theme script injects mockups + line-item properties
     → Cart / Checkout
     → orders/create webhook → Printify stub (front+back URLs)
```

## Design rules

| Side | Asset | Component |
|------|--------|-----------|
| Front | Natal chart wheel | `ClassicPrintNatalChart` (`PRINT_SVG_ID`) |
| Back | Cosmographic logo + planet positions + aspect grid | `BackPlacementPrint` (`BACK_PRINT_SVG_ID`) |

## APIs

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/session` | Save front+back SVGs, return `sessionId` + `catalogUrl` |
| GET | `/api/session/:id` | Theme / fulfillment fetch (`?format=preview`) |
| GET | `/api/design/:visualId?format=svg` | Print-ready SVG |
| POST | `/api/cart` | Shopify cart with `_session_id`, `_print_front_url`, `_print_back_url` |

## Env

```bash
NEXT_PUBLIC_APP_URL=https://www.cosmographic.store
SHOPIFY_PERSONALIZED_COLLECTION_HANDLE=personalized
# or full URL:
# SHOPIFY_PERSONALIZED_COLLECTION_URL=https://www.cosmographic.store/collections/personalized

# Optional cloud + Printify (stubs until wired)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
PRINTIFY_API_TOKEN=
PRINTIFY_SHOP_ID=
```

## Shopify theme

Install `docs/shopify-session-personalization.liquid` as a Custom Liquid block on the personalized collection (and product forms). Set `cosmographic_customizer_origin` if the customizer is on a different host than the storefront.

## Still to wire (production POD)

- Cloudinary/S3 upload adapter (`lib/storage/cloud.ts`)
- Printify order create HTTP (`lib/printify/client.ts`)
- True displacement maps / Printify Mockup Generator API
- SVG→PNG @ 300 DPI via resvg for DTG vendors that reject SVG
- Google Places (Nominatim `/geocode/search` provides candidates today)

## Compliance notes (master spec)

- Birth validation + recovery: `lib/validation/birth.ts`, `/api/chart`
- 300 DPI artboard metadata: `lib/print/artboard.ts` (applied on session create)
- Multi-SKU catalog: `lib/catalog/products.ts`, `GET /api/catalog`
- GDPR: `/privacy`, `DELETE /api/session/:id`, CORS allowlist, no chart snapshot by default
- Logging / analytics: `lib/logging/logger.ts`, `lib/analytics/track.ts`
- Canonical commerce path: Create My Personalized Products (advanced cart is secondary)
