# Cosmographic entegrasyon — yol A (önerilen)

## Mimari

| URL | Rol |
|-----|-----|
| **www.cosmographic.store** | Shopify vitrin + ürün (Printify) + ödeme |
| **customize.cosmographic.store** | Natal chart customizer (Next.js / Vercel) |
| **Ephemeris API** | Swiss Ephemeris backend (ayrı host) |

Akış: Ürün sayfası CTA → customize → harita → Buy Now → Shopify checkout → Printify.

Line item properties (zaten customizer’da): `_visual_id`, `_date_of_birth`, `_print_side`, …

## 1) Namecheap DNS

Yeni CNAME (www’yi Shopify’da bırak):

| Type | Host | Value |
|------|------|--------|
| CNAME | `customize` | `51cdba650384265c.vercel-dns-017.com` |

Kaydet → 5–30 dk bekle.

## 2) Shopify ürün CTA

1. Admin → **Online Store → Themes → Customize**
2. Ürün şablonu (Printify tee)
3. **Add block → Custom Liquid**
4. `docs/shopify-product-cta.liquid` içeriğini yapıştır
5. Bloğu Buy buttons’ın **üstüne** koy → Save

## 3) Ephemeris (kalıcı)

`services/ephemeris` Dockerfile ile Railway / Render / Fly.

Vercel env:

```
EPHEMERIS_API_URL=https://<ephemeris-public-url>
SHOPIFY_CHECKOUT_ON_MYSHOPIFY=true
```

## 4) Doğrulama

- https://customize.cosmographic.store → form + harita
- Buy Now → `*.myshopify.com` checkout
- Siparişte line item properties görünür
