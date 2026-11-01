# BookBuch — Хөгжүүлэлтийн гарын авлага

Next.js 16 (App Router) + TypeScript + Tailwind 4 + Drizzle ORM + PostgreSQL. Supabase нь заавал биш.

## Environment variables

`.env.example`-г `.env` болгож хуулна (`cp .env.example .env`).

| Нэр | Заавал | Тайлбар |
|---|---|---|
| `DATABASE_URL` | Тийм | PostgreSQL холболтын хаяг. Local: `postgresql://postgres:postgres@127.0.0.1:5432/app_db` |
| `NEXT_PUBLIC_SITE_URL` | Үгүй | Сайтын нийтийн хаяг (sitemap, metadata). Default `http://localhost:3000` |
| `NEXT_PUBLIC_CURRENCY` | Үгүй | `MNT` бол ₮, хоосон бол $ |
| `NEXT_PUBLIC_SUPABASE_URL` | Үгүй | Supabase төслийн URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Үгүй | Supabase public key (`..._PUBLISHABLE_KEY` ч болно) |
| `R2_ACCOUNT_ID` | Үгүй | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | Үгүй | R2 API token-ий Access Key ID |
| `R2_SECRET_ACCESS_KEY` | Үгүй | R2 API token-ий Secret (зөвхөн сервер, `NEXT_PUBLIC_` бүү тавь) |
| `R2_BUCKET` | Үгүй | Bucket-ийн нэр |
| `R2_PUBLIC_URL` | Үгүй | Bucket-ийн нийтийн хаяг (`https://pub-xxx.r2.dev` эсвэл өөрийн домэйн) |

| `BONUM_GATEWAY_BASE_URL` | Үгүй | Test: `https://testapi.bonum.mn`, Production: `https://apis.bonum.mn` |
| `BONUM_APP_SECRET` | Үгүй | Bonum merchant portal-оос (зөвхөн сервер) |
| `BONUM_TERMINAL_ID` | Үгүй | Bonum terminal ID |
| `BONUM_MERCHANT_CHECKSUM_KEY` | Үгүй | Webhook гарын үсэг шалгах түлхүүр (Bonum олгоно) |

Supabase хувьсагчгүй бол сайт local бүртгэл (scrypt нууц үг, DB session) ашиглана. R2 хувьсагч бүрэн байвал зургийг Cloudflare R2-д, үгүй бол `public/uploads` хавтсанд хадгална.

### Cloudflare R2 тохируулах
1. Cloudflare → R2 → **Create bucket**.
2. Bucket → Settings → **Public access** асааж `r2.dev` хаягийг аваад `R2_PUBLIC_URL`-д тавь.
3. R2 → **Manage API tokens** → Object Read & Write эрхтэй token үүсгэж Access Key, Secret-ийг `.env`-д хуул.
4. `npm install` (шинэ `@aws-sdk/client-s3` сан суухад).

## Local ажиллуулах (Termux / Linux)

```
pkg install nodejs-lts postgresql        # Termux
initdb $PREFIX/var/lib/postgresql
pg_ctl -D $PREFIX/var/lib/postgresql -l ~/pg.log start
createuser -s postgres && createdb -O postgres app_db
psql -d postgres -c "ALTER USER postgres PASSWORD 'postgres'"

cp .env.example .env
npm install
npx drizzle-kit push                     # хүснэгт үүсгэнэ / шинэчилнэ
npm run dev -- --webpack                 # Android дээр Turbopack ажиллахгүй
```

Эхний удаа `/` нээхэд 20 ном, 8 ангилал автоматаар үүснэ. Дараагийн удаа: Postgres асаагаад `npm run dev -- --webpack`.

## Бүтэц

- `src/app` — хуудас, `api/` route-ууд
- `src/components` — UI (`mobile-tab-bar`, `book-row`, `sell-manager`, `language-switcher`)
- `src/db/schema.ts` — Drizzle schema
- `src/lib/i18n.ts` — English / Deutsch / Монгол орчуулга (шинэ текст энд нэмнэ)
- `src/lib/fees.ts` — marketplace шимтгэл (10%)
- `supabase/policies.sql` — Supabase RLS (зөвхөн Supabase дээр)

## Marketplace

- Хэрэглэгч `/sell` дээр ном нэмнэ (`books.seller_id`).
- Захиалга хийхэд `order_items`-д `fee_cents` (10%) ба `seller_earnings_cents` хадгалагдана. Сайтын өөрийн номонд шимтгэл тооцохгүй.
- Админ `/admin` дээр нийт шимтгэл, зарсан хүн бүрийн орлогыг харна.
- Төлбөр одоогоор зөвхөн хүргэлтээр (cash on delivery). Мөнгө шилжүүлэлт гараар хийгдэнэ; QPay/банк холбоогүй.

## QPay (Bonum) төлбөр

Дээрх 4 `BONUM_*` хувьсагч + `NEXT_PUBLIC_CURRENCY=MNT` + нийтийн `https` `NEXT_PUBLIC_SITE_URL` байвал checkout автоматаар онлайн төлбөр болно, үгүй бол хүргэлтээр төлөх хэвээр.

1. Checkout захиалгыг үүсгээд (нөөц хасагдана) Bonum invoice үүсгэж, хэрэглэгчийг төлбөрийн хуудас руу шилжүүлнэ.
2. Төлбөр дууссан үед Bonum `POST /api/payments/bonum/webhook` руу дуудна (`x-checksum-v2` HMAC-SHA256-аар шалгана). SUCCESS → `payment_status = paid`, FAILED → захиалга цуцлагдаж нөөц буцна.
3. Шимтгэл (10%) зөвхөн `paid` захиалгаас тооцогдоно. Хүргэлтээр төлөх захиалга "delivered" болоход `paid` болно.
4. 35 минутын дотор төлөөгүй захиалга автоматаар цуцлагдана.

Webhook URL-ийг Bonum merchant portal дээр `https://ТАНЫ-ДОМЭЙН/api/payments/bonum/webhook` гэж бүртгэнэ. Localhost руу Bonum дуудаж чадахгүй тул тест хийхдээ Cloudflare Tunnel зэрэг ашигла.

## Админ эрх

Бүртгэл үүсгээд DB дээр:
```
psql -d app_db -c "UPDATE profiles SET role='admin' WHERE email='таны@email';"
```

## Supabase руу гаргах

1. Connect → **Session pooler** URI-г `DATABASE_URL`-д тавь.
2. `npx drizzle-kit push` (эсвэл `npx drizzle-kit generate` гаргасан SQL-ийг SQL Editor-т ажиллуул).
3. **Дараа нь** `supabase/policies.sql`-ийг SQL Editor-т нэг удаа ажиллуул.
4. Supabase болон R2 хувьсагчдыг сервер дээр тохируул.

## Түгээмэл алдаа

| Алдаа | Шийдэл |
|---|---|
| `DATABASE_URL is required` | `.env` файл төслийн хавтсанд байгаа эсэхийг шалга |
| `connection refused` | Postgres асаагаагүй байна (`pg_ctl ... start`) |
| `Turbopack is not supported` | `npm run dev -- --webpack` |
| `relation "public.profiles" does not exist` | `policies.sql`-ээс өмнө `drizzle-kit push` хий |
| `policy ... already exists` | `policies.sql`-ийг хоёр дахь удаа ажиллуулсан; нэг л удаа ажиллуулна |

## Аюулгүй байдал

`.env`, `drizzle.supabase.config.json`-г git-д оруулахгүй (`.gitignore`-д байгаа). Token, нууц үг, service-role key-г чат эсвэл repo-д бүү тавь.
