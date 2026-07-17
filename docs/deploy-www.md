# www.cosmographic.store → Natal Customizer

Goal: visiting **https://www.cosmographic.store** shows the natal chart UI (same as local `localhost:3000`).

## Architecture

1. **Next.js customizer** hosted on Vercel (this is the public site)
2. **Ephemeris API** (Python) hosted separately; `EPHEMERIS_API_URL` points to it
3. **Checkout** stays on Shopify (`wtx6n6-gu.myshopify.com`) while customizer owns `www`

Set in production:

```bash
SHOPIFY_CHECKOUT_ON_MYSHOPIFY=true
SHOPIFY_SHOP_DOMAIN=wtx6n6-gu.myshopify.com
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=www.cosmographic.store
SHOPIFY_STOREFRONT_TOKEN=...
SHOPIFY_STOREFRONT_PRIVATE_TOKEN=...
SHOPIFY_PRODUCT_VARIANT_ID=48999567851776
EPHEMERIS_API_URL=https://<ephemeris-host>
```

## Steps

### A) Vercel login + deploy customizer

```bash
cd apps/web
npx vercel login
npx vercel --prod
```

Add env vars in Vercel project settings (same as `.env.local` + `SHOPIFY_CHECKOUT_ON_MYSHOPIFY=true`).

### B) Ephemeris

```bash
cd services/ephemeris
# Deploy Dockerfile (Fly.io / Railway / Render)
# Ensure ./ephe Swiss Ephemeris files are included
```

### C) Point www DNS to Vercel

1. Vercel → Project → Domains → add `www.cosmographic.store`
2. Shopify Admin → Settings → Domains → remove / disconnect www from Online Store **or** leave Shopify on apex and only move `www` if DNS allows
3. At domain registrar / Cloudflare DNS:
   - `www` CNAME → `cname.vercel-dns.com` (value Vercel shows)
4. After DNS: `https://www.cosmographic.store` = customizer

### D) Interim (Shopify still owns www)

Until DNS moves, in Online Store theme homepage add redirect or full-page iframe to the Vercel URL (e.g. `https://cosmographic-natal.vercel.app`).

## Verify

- `/` → chart form
- Buy Now → Shopify checkout on `*.myshopify.com`
- Printify product appears on order
