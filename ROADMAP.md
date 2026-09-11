# LocalMart → Production Roadmap (Zepto/Blinkit-style)

Goal: take LocalMart from a 3-app prototype (mock data + a local JSON "sync
server") to a real, secure, multi-tenant quick-commerce platform that can
handle many concurrent customers, shops, and delivery partners at once.

## Where things stand today

- 3 standalone Expo apps: Customer (:8081), Shopkeeper (:8082), Delivery (:8083)
- "Sync" is `sync-server.js` — a single Node process reading/writing a local
  `shared_database.json` file and broadcasting over SSE. No auth, no real
  persistence, `Access-Control-Allow-Origin: *`, one writer at a time. This
  cannot support more than one device/customer reliably and has no security
  boundary at all — anyone who can reach the port can read or overwrite the
  entire database.
- `@supabase/supabase-js` is already a dependency and a schema exists
  (`supabase/schema.sql`), but every RLS policy on it is `using (true)` —
  i.e. wide open — and the app doesn't actually call Supabase yet; screens
  read from Zustand stores seeded with mock data.

## Phase 1 — Secure, real multi-user backend (foundation) ✅ started
- [x] `supabase/migrations/002_production_security_and_roles.sql`:
      - `profiles` table tied to Supabase Auth (`role`: customer/shopkeeper/delivery/admin)
      - `delivery_partners` (live lat/lng, online status) for dispatch + tracking
      - `order_status_history` audit trail
      - `reviews`, `addresses`, `coupons`
      - Real RLS: customers see only their own orders/addresses; shopkeepers
        only their shop's products/orders; delivery partners only orders
        assigned to them (or unclaimed "ready" ones); coupons are read-only
        to clients (writes are service-role/admin only)
      - Indexes for the query patterns the apps actually run (orders by
        customer/shop/partner/status) so lookups stay fast under load
      - Realtime enabled on `orders` / `delivery_partners` / history
- [ ] Run migration 001 then 002 against a real Supabase project
- [ ] Turn on Supabase Auth (email/OTP or phone OTP — Blinkit/Zepto use phone OTP)
- [ ] Retire `sync-server.js` and `shared_database.json` entirely

## Phase 2 — Wire the 3 apps to the real backend
- [ ] Replace mock auth screens with real Supabase Auth (signup writes `role` into user metadata so the Phase 1 trigger creates the right profile)
- [ ] Replace Zustand mock stores with Supabase queries + `.channel()` realtime subscriptions (this is what makes multiple customers/shops/partners actually see each other's live updates instead of a shared local file)
- [ ] Server-side order total/coupon validation (never trust client-computed totals)
- [ ] Image uploads (shop covers, product photos, profile photos) via Supabase Storage with signed URLs + file-type/size limits

## Phase 3 — Feature parity with Zepto/Blinkit
- [ ] Full order lifecycle UI: pending → accepted → preparing → ready → assigned → picked up → delivered, with live timeline (backed by `order_status_history`)
- [ ] Delivery partner dispatch: auto-notify nearby online partners when an order goes `ready`; "Accept" claims it (guarded by the RLS policy already added)
- [ ] Live map tracking for customers once a partner is assigned (`delivery_partners.current_lat/lng` via Realtime)
- [ ] Push notifications (Expo push + Supabase Edge Function triggers) for order-status changes, not just in-app
- [ ] Ratings & reviews surfaced on shop pages (table already added)
- [ ] Coupons/promotions at checkout (table already added)
- [ ] Saved addresses with a default address (table already added)
- [ ] Search with filters/sorting, "frequently bought", reorder from history
- [ ] Delivery slot / ETA estimate based on shop prep time + partner distance
- [ ] Shopkeeper: low-stock alerts, sales analytics, payout summary

## Phase 4 — Production hardening & scale
- [ ] Rate limiting on write-heavy endpoints (Supabase Edge Functions + Upstash, or API gateway in front)
- [ ] Payment gateway integration (Razorpay/Stripe test mode) instead of COD-only; never store card data — use the gateway's hosted checkout/tokenization
- [ ] Secrets management: move Supabase keys/service-role key out of the repo into EAS secrets / environment config; service-role key must never ship in the mobile bundle
- [ ] Input validation everywhere a client sends data (zod/yup schemas) to stop malformed or malicious payloads
- [ ] Structured logging + error monitoring (Sentry) across all 3 apps
- [ ] Load testing the order-creation path (this is the highest-contention write under real traffic)
- [ ] CI: typecheck + lint + build on every push, before merging to main

## Suggested order of attack
Phase 1 is committed as a migration but not yet applied — needs a real
Supabase project + running the SQL. Phase 2 (wiring the apps to it) is the
next big, well-defined chunk of work and unblocks everything in Phase 3.
Tell me which of these you want next and I'll start on it directly.
