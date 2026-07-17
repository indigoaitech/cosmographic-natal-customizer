# Shopify → www.cosmographic.store (basit kurulum)

Mağaza: [www.cosmographic.store](https://www.cosmographic.store)  
Shop: `wtx6n6-gu.myshopify.com`

Partner app / Headless **gerekmez**. Plan Headless’i desteklemiyorsa cart permalink kullanılır.

## 1) Mağazayı hazırla

1. Admin → **Online Mağaza** → şifre sayfasını aç / kapat (test için şifre kalabilir)
2. **Ödemeler** → Shopify Payments veya kart ödeme yöntemini aç
3. Boş Partner app’leri sil — sorun değil

## 2) Natal tişört ürünü oluştur

1. Admin → **Ürünler → Ürün ekle**
2. İsim: `Natal Chart Tee` (veya benzeri)
3. Fiyat + beden varyantları (S/M/L…)
4. Kaydet
5. Bir varyanta tıkla → URL’deki sayı:

```
.../variants/123456789
```

## 3) `.env.local`

```bash
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=www.cosmographic.store
SHOPIFY_SHOP_DOMAIN=wtx6n6-gu.myshopify.com
SHOPIFY_PRODUCT_VARIANT_ID=123456789
# Storefront token opsiyonel (Headless yoksa boş bırak)
SHOPIFY_STOREFRONT_TOKEN=
```

## 4) Test

```bash
cd apps/web && npm run dev
```

Harita üret → **Buy Now** → `www.cosmographic.store/cart/add?...` → Shopify sepet/checkout.

Durum: `GET /api/shopify/status` → `configured: true` (variant ID varsa)

## Line item özellikleri

| Key | Değer |
|-----|--------|
| `_design_option` | `A` |
| `_print_side` | `front` / `back` |
| `_visual_id` | baskı dosyası |
| `_date_of_birth` | … |

SVG: `GET /api/design/{visualId}?format=svg`
