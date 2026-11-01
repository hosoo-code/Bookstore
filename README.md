# BookBuch

A bilingual premium bookstore and reading community built with Next.js App Router, TypeScript, Tailwind, Drizzle/PostgreSQL, Lucide, and optional Supabase Auth/Realtime/Storage.

## Running locally

1. Set `DATABASE_URL` in `.env` to your PostgreSQL connection string.
2. Install dependencies with `npm install` and apply tables with `npx drizzle-kit push`.
3. Run `npm run dev`. The first catalog visit seeds 20 real, ISBN-matched books and 8 genres. Book cover photographs are stored locally in `public/images/covers`.

Without Supabase credentials the application uses real local PostgreSQL account registration (scrypt password hashes and random HttpOnly database-backed sessions). Private messages are stored in PostgreSQL and refresh every 5 seconds. Neither login nor checkout is a mocked interaction. Checkout creates a real pending order, validates stock and prices transactionally, and offers **cash on delivery only**; no card details are accepted or online payments claimed.

## Supabase deployment

Set these environment variables on the server:

- `DATABASE_URL`: direct PostgreSQL connection string for **the same Supabase project** (required for Supabase Realtime to observe message inserts).
- `NEXT_PUBLIC_SUPABASE_URL`: project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: public browser key.
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`: Cloudflare R2 image storage (server-only secrets).
- `NEXT_PUBLIC_SITE_URL`: public website URL for sitemap URLs.

Apply the Drizzle schema with `npx drizzle-kit push`, then run `supabase/policies.sql` in the Supabase SQL Editor to configure RLS, Storage, and the Realtime publication. With these values present, authentication uses Supabase Auth and cookie refresh through `src/proxy.ts`; Realtime subscribes to authorized message inserts, while polling covers reconnection. Email confirmation follows the project's Supabase Auth settings. Never prefix the service-role key with `NEXT_PUBLIC_`.

Uploaded files use Cloudflare R2 when the R2 variables are set. For local use, uploads are written to `public/uploads` (a writable, persistent filesystem is required). On read-only hosting, configure Cloudflare R2.

## Administrator access

For security, **signup never creates an administrator**. Register a normal account, then promote it explicitly in your trusted database console:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@example.com';
```

The `/admin` page and every admin API endpoint independently check `role = 'admin'` on the server. Admins can manage books, categories, stock, orders, users, reports, and contact submissions. Suspended accounts lose access to authenticated endpoints.

## Security model

- Server routes enforce ownership/visibility on posts, follows, orders, and private conversations; blocked members cannot contact each other.
- The Supabase RLS script additionally restricts direct browser database access and prevents browser reads of profile email/password hashes/roles. Session tokens and payment/order creation are server-only.
- Supabase Realtime is only enabled when its URL and public key exist; browser code never receives the service-role key.
- Uploaded images are limited to 5 MB and verified as JPEG, PNG, or WebP.

## Routes

Store: `/`, `/books`, `/books/[id]`, `/categories/[slug]`, `/cart`, `/checkout`.
Accounts: `/login`, `/register`, `/profile`, `/profile/[username]`, `/settings`.
Community: `/feed`, `/messages`, `/messages/[conversationId]`, `/notifications`.
Other: `/about`, `/contact`, `/faq`, `/privacy`, `/terms`, `/admin`.
