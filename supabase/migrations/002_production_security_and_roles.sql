-- ==============================================================================
-- LocalMart: Production-grade multi-role schema with real RLS security
-- Fixes: schema.sql / 001_initial_schema.sql used `using (true)` on every
-- table, meaning ANY anonymous client could read/write/delete ANY shop,
-- product, or order. This migration replaces that with role-scoped policies
-- tied to Supabase Auth, and adds the tables needed for a real multi-vendor,
-- multi-customer, multi-delivery-partner marketplace (Zepto/Blinkit-style).
-- Run this AFTER 001_initial_schema.sql in the Supabase SQL editor.
-- ==============================================================================

-- ---------------------------------------------------------------------------
-- 1. PROFILES — one row per authenticated user, role-tagged.
--    id mirrors auth.users.id so RLS can check auth.uid() = profiles.id.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('customer','shopkeeper','delivery','admin')),
  full_name text,
  phone text,
  avatar_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- auto-create a profile row whenever someone signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'customer'),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. Re-point shops / products / orders at real users instead of free-text ids
-- ---------------------------------------------------------------------------
alter table public.shops
  alter column owner_id type uuid using nullif(owner_id, '')::uuid,
  add constraint shops_owner_fk foreign key (owner_id) references public.profiles(id);

alter table public.orders
  alter column customer_id type uuid using nullif(customer_id, '')::uuid,
  add constraint orders_customer_fk foreign key (customer_id) references public.profiles(id);

alter table public.orders
  add column if not exists delivery_partner_id uuid references public.profiles(id),
  add column if not exists accepted_at timestamptz,
  add column if not exists preparing_at timestamptz,
  add column if not exists ready_at timestamptz,
  add column if not exists picked_up_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancel_reason text;

-- full order lifecycle instead of the old free-text status
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending','accepted','preparing','ready','assigned','picked_up','delivered','cancelled'));

-- ---------------------------------------------------------------------------
-- 3. DELIVERY PARTNERS — live location + availability for dispatch/tracking
-- ---------------------------------------------------------------------------
create table if not exists public.delivery_partners (
  id uuid primary key references public.profiles(id) on delete cascade,
  vehicle_type text default 'bike',
  is_online boolean default false,
  current_lat double precision,
  current_lng double precision,
  last_location_at timestamptz,
  rating double precision default 5.0,
  rating_count integer default 0,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 4. ORDER STATUS HISTORY — audit trail (who changed what, when)
-- ---------------------------------------------------------------------------
create table if not exists public.order_status_history (
  id bigint generated always as identity primary key,
  order_id text not null references public.orders(id) on delete cascade,
  status text not null,
  changed_by uuid references public.profiles(id),
  changed_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 5. REVIEWS, ADDRESSES, COUPONS — table stakes for a real commerce app
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  order_id text not null references public.orders(id) on delete cascade,
  shop_id text not null references public.shops(id) on delete cascade,
  customer_id uuid not null references public.profiles(id),
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique (order_id)
);

create table if not exists public.addresses (
  id bigint generated always as identity primary key,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  label text default 'Home',
  line1 text not null,
  line2 text,
  latitude double precision not null,
  longitude double precision not null,
  is_default boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.coupons (
  code text primary key,
  description text,
  discount_type text not null check (discount_type in ('flat','percent')),
  discount_value double precision not null,
  min_order_amount double precision default 0,
  max_discount double precision,
  usage_limit integer,
  usage_count integer default 0,
  valid_from timestamptz default now(),
  valid_until timestamptz,
  is_active boolean default true
);

-- ---------------------------------------------------------------------------
-- 6. PERFORMANCE — indexes so lookups stay fast as order volume grows
--    (every one of these backs a query pattern the apps actually run)
-- ---------------------------------------------------------------------------
create index if not exists idx_products_shop_id on public.products(shop_id) where is_available;
create index if not exists idx_orders_customer_id on public.orders(customer_id);
create index if not exists idx_orders_shop_id on public.orders(shop_id);
create index if not exists idx_orders_delivery_partner_id on public.orders(delivery_partner_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_ready_unassigned on public.orders(shop_id) where status = 'ready' and delivery_partner_id is null;
create index if not exists idx_delivery_partners_online on public.delivery_partners(is_online) where is_online;

-- ==============================================================================
-- 7. DROP the old wide-open policies and replace with real, role-scoped RLS.
-- ==============================================================================
drop policy if exists "Allow public read on shops" on public.shops;
drop policy if exists "Allow public insert on shops" on public.shops;
drop policy if exists "Allow public update on shops" on public.shops;
drop policy if exists "Allow public read on products" on public.products;
drop policy if exists "Allow public insert on products" on public.products;
drop policy if exists "Allow public update on products" on public.products;
drop policy if exists "Allow public delete on products" on public.products;
drop policy if exists "Allow public read on orders" on public.orders;
drop policy if exists "Allow public insert on orders" on public.orders;
drop policy if exists "Allow public update on orders" on public.orders;

alter table public.profiles enable row level security;
alter table public.delivery_partners enable row level security;
alter table public.order_status_history enable row level security;
alter table public.reviews enable row level security;
alter table public.addresses enable row level security;
alter table public.coupons enable row level security;

-- PROFILES: everyone can see basic public info (name/avatar for display),
-- but you can only edit your own row.
create policy "profiles_public_read" on public.profiles for select using (true);
create policy "profiles_self_update" on public.profiles for update using (auth.uid() = id);

-- SHOPS: anyone (incl. guests) can browse active shops; only the owning
-- shopkeeper can create/modify/delete their own shop.
create policy "shops_public_read" on public.shops for select using (is_active = true or owner_id = auth.uid());
create policy "shops_owner_insert" on public.shops for insert with check (auth.uid() = owner_id);
create policy "shops_owner_update" on public.shops for update using (auth.uid() = owner_id);
create policy "shops_owner_delete" on public.shops for delete using (auth.uid() = owner_id);

-- PRODUCTS: anyone can browse available products; only that shop's owner
-- can add/edit/delete/restock them.
create policy "products_public_read" on public.products for select using (
  is_available = true or shop_id in (select id from public.shops where owner_id = auth.uid())
);
create policy "products_owner_write" on public.products for all using (
  shop_id in (select id from public.shops where owner_id = auth.uid())
) with check (
  shop_id in (select id from public.shops where owner_id = auth.uid())
);

-- ORDERS: a customer sees/creates only their own orders. A shopkeeper sees
-- orders placed at their shop and can update status while it's theirs to
-- fulfil. A delivery partner sees only orders assigned to them (or open,
-- unassigned "ready" orders they could pick up) and can update once assigned.
create policy "orders_customer_read" on public.orders for select using (customer_id = auth.uid());
create policy "orders_customer_insert" on public.orders for insert with check (customer_id = auth.uid());

create policy "orders_shop_read" on public.orders for select using (
  shop_id in (select id from public.shops where owner_id = auth.uid())
);
create policy "orders_shop_update" on public.orders for update using (
  shop_id in (select id from public.shops where owner_id = auth.uid())
);

create policy "orders_delivery_read" on public.orders for select using (
  delivery_partner_id = auth.uid()
  or (status = 'ready' and delivery_partner_id is null)
);
create policy "orders_delivery_claim_update" on public.orders for update using (
  delivery_partner_id = auth.uid()
  or (status = 'ready' and delivery_partner_id is null)
);

-- DELIVERY_PARTNERS: a partner manages only their own presence/location row;
-- shopkeepers/customers can read it only to show live tracking on an order
-- that partner is actually assigned to.
create policy "delivery_partners_self_write" on public.delivery_partners for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "delivery_partners_tracking_read" on public.delivery_partners for select using (
  id in (select delivery_partner_id from public.orders where customer_id = auth.uid() or shop_id in (select id from public.shops where owner_id = auth.uid()))
);

-- ORDER_STATUS_HISTORY: read-only trail visible to anyone who can see the order.
create policy "order_history_read" on public.order_status_history for select using (
  order_id in (
    select id from public.orders
    where customer_id = auth.uid()
       or delivery_partner_id = auth.uid()
       or shop_id in (select id from public.shops where owner_id = auth.uid())
  )
);
create policy "order_history_insert" on public.order_status_history for insert with check (changed_by = auth.uid());

-- REVIEWS: anyone can read; a customer can only review their own delivered order.
create policy "reviews_public_read" on public.reviews for select using (true);
create policy "reviews_customer_insert" on public.reviews for insert with check (
  customer_id = auth.uid()
  and order_id in (select id from public.orders where customer_id = auth.uid() and status = 'delivered')
);

-- ADDRESSES: private to the customer who owns them.
create policy "addresses_owner_all" on public.addresses for all using (customer_id = auth.uid()) with check (customer_id = auth.uid());

-- COUPONS: everyone can read active coupons to apply at checkout; only
-- the service role (server-side, e.g. an admin panel/Edge Function) can
-- create or change them — no client-side write policy is defined on purpose.
create policy "coupons_public_read" on public.coupons for select using (is_active = true);

-- ==============================================================================
-- 8. REALTIME — live order + delivery-partner-location sync for tracking UI
-- ==============================================================================
alter publication supabase_realtime add table public.orders, public.delivery_partners, public.order_status_history;
