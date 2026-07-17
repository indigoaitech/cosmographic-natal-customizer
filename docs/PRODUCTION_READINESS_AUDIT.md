# Final Production Readiness Audit — Cosmographic.store

**Date:** 2026-07-17  
**Branch:** `cursor/cosmographic-birth-map-app`  
**Scope:** Full monorepo audit against Master Technical Specification (no greenfield rewrite).  
**Verification method:** Code review of `apps/web` + `services/ephemeris`, TypeScript check, Vitest (14) + Pytest (3), health/session/print module inspection.

---

## 1. Completed items (verified in codebase)

### Core journey
- [x] Birth date / time / city / country collection with client + BFF validation (`lib/validation/birth.ts`, `/api/chart`)
- [x] Geocoding via Nominatim + candidate search (`/v1/geocode`, `/v1/geocode/search`)
- [x] Timezone resolution (timezonefinder) exposed in UI meta
- [x] Natal calculation exclusively via Swiss Ephemeris (`FLG_SWIEPH`)
- [x] Front natal wheel SVG (`ClassicPrintNatalChart`)
- [x] Back planet table + aspect grid + brand logo (`BackPlacementPrint`)
- [x] Session UUID handoff (`POST /api/session` → Shopify `?session_id=`)
- [x] Line-item properties: `_session_id`, `_print_front_url`, `_print_back_url`, birth fields
- [x] Canonical CTA: **Create My Personalized Products**; single-variant cart demoted to advanced
- [x] Multi-SKU catalog model (`lib/catalog/products.ts`, `GET /api/catalog`)
- [x] Garment preview front/back with blend/fold CSS (`GarmentPreview`)
- [x] Theme liquid for session overlays (`docs/shopify-session-personalization.liquid`)

### Print pipeline
- [x] Print artboards @ **300 DPI** with physical pixel sizes on session persist (`lib/print/artboard.ts`)
- [x] Front 10×10in (3000×3000px), back 10×14in (3000×4200px)
- [x] PNG rasterization **contract** documented/tested (`lib/print/raster.ts` + unit tests)
- [x] Unit guards for aspect angular distance (JS + Python)

### Platform / ops
- [x] Structured errors with recovery (`lib/errors/appError.ts`) — including `SESSION_EXPIRED` 410
- [x] Structured logging with PII redaction (`lib/logging/logger.ts`)
- [x] Analytics hooks (`lib/analytics/track.ts`)
- [x] HTTP timeouts + retries (`lib/http/fetchWithTimeout.ts`) on ephemeris + Shopify Storefront
- [x] `GET /api/health` dependency probe
- [x] `POST /api/ops/purge-sessions` (token-gated)
- [x] GDPR: `/privacy`, `DELETE /api/session/:id`, CORS allowlist, snapshot opt-in
- [x] SEO metadata + skip link (`layout.tsx`)
- [x] Printify client with **dry-run** safety + optional live order attempt
- [x] Docs: `docs/PRODUCTION.md`, updated architecture / personalization docs
- [x] Automated tests: Vitest 14 passed, Pytest 3 passed

### Audit hardening applied this pass
- External fetch timeouts/retries
- Session expired vs missing distinction
- Health + session purge ops endpoints
- Printify dry-run / blueprint gate
- Production ops documentation
- Unit/integration-lite tests for validation, print DPI, errors, aspects

---

## 2. Remaining limitations

| Area | Limitation |
|------|------------|
| **Storage** | Default local FS — **not durable on multi-instance Vercel** without Cloudinary/S3 |
| **Printify** | Live order create needs shop-specific blueprint/variant image upload mapping; dry-run is safe default |
| **PNG/PDF** | Physical SVG ready; actual resvg/sharp raster + PDF not installed |
| **Mockups** | CSS photorealism — not Printify Mockup Generator / displacement maps |
| **Geocoding** | Nominatim (not Google Places); UI does not yet surface candidate picker |
| **E2E** | No Playwright/Cypress full journey test in CI |
| **CRM DB** | SQLite on local disk — fine for single instance only |
| **i18n / multi-currency** | Not implemented (architecture allows extension) |
| **npm audit** | Known advisories in transitive deps (Next/eslint tooling) — review before go-live |

---

## 3. Known risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Session/design assets lost across serverless instances | **High** | Wire S3/Cloudinary before production scale; sticky single-instance only as interim |
| Printify live call with incomplete blueprint | **High** | Keep `PRINTIFY_DRY_RUN=true` until mapping QA’d |
| Ambiguous birthplace geocode | **Medium** | Country required; `/geocode/search` available — add UI picker |
| Theme liquid not installed | **Medium** | Catalog redirect works but overlays/line props won’t inject |
| Astrological accuracy if `.se1` missing | **High** | Health check + fail closed on ephemeris; ship `download_ephe.sh` in deploy |
| Birth data in session JSON (CORS-restricted) | **Medium** | Allowlist origins; 72h TTL; DELETE + purge |

---

## 4. Recommended future improvements (priority)

1. **P0** — Durable object storage (S3/Cloudinary) for design/session assets  
2. **P0** — Complete Printify image upload + blueprint mapping; exit dry-run  
3. **P1** — `@resvg/resvg-js` PNG @ 300 DPI for DTG vendors rejecting SVG  
4. **P1** — Playwright E2E: birth → session → mock cart properties  
5. **P1** — Geocode candidate picker in the birth form  
6. **P2** — Printify Mockup API / displacement maps  
7. **P2** — Managed DB for CRM; rate limits on `/api/session`  
8. **P2** — i18n + multi-currency storefronts  

---

## 5. Production readiness assessment

| Dimension | Score | Notes |
|-----------|-------|-------|
| Astrological accuracy path | **90%** | Swiss Ephemeris only; needs prod ephe files + health monitoring |
| Print asset quality | **75%** | Vector + 300 DPI metadata solid; raster/PDF still pending |
| Customer journey UX | **80%** | End-to-end customizer path clear; Shopify theme install required |
| Shopify integration | **70%** | Session + cart props solid; personalized “only my products” is overlay not true dynamic products |
| Print fulfillment | **40%** | Dry-run / stub mapping — not live autonomous POD yet |
| Security / privacy | **75%** | CORS, redaction, erase, HMAC; encrypt-at-rest not done |
| Scalability | **55%** | Modular code yes; FS storage + SQLite limit horizontal scale |
| Observability | **70%** | Health + structured logs + analytics hooks; no APM wired |
| Testing | **45%** | Unit coverage on critical pure logic; no E2E/CI gate yet |
| Documentation | **85%** | Architecture + PRODUCTION ops/recovery/backup present |

---

## 6. Estimated readiness percentage

### Overall: **68% production-ready**

| Gate | Ready? |
|------|--------|
| Soft launch / single-region pilot (manual Printify follow-up) | **Yes, with caveats** |
| Fully automated unattended POD at scale | **No** — storage + Printify mapping + raster still required |

**Caveats for soft launch**
1. Single Node/Vercel instance **or** shared volume / cloud storage  
2. `PRINTIFY_DRY_RUN=true`; ops pulls `_print_*_url` from orders until live mapping  
3. Shopify liquid installed; CORS + `NEXT_PUBLIC_APP_URL` correct  
4. Ephemeris deployed with `.se1` files; `/api/health` green  
5. Privacy + webhook secret configured  

---

## Verification commands (re-run anytime)

```bash
cd apps/web && npx tsc --noEmit && npm test
cd services/ephemeris && PYTHONPATH=. .venv/bin/pytest tests/ -q
curl -s http://localhost:3000/api/health
```

This report does **not** claim 100% completion. Features listed under §2–§3 remain incomplete by design until the P0 storage/Printify work lands.
