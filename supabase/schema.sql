-- ==============================================================================
-- 🛍️ LocalMart Hyperlocal Platform: Supabase PostgreSQL Schema & Realtime Setup
-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Create Shops Table
create table if not exists public.shops (
  id text primary key,
  owner_id text not null,
  owner_email text,
  name text not null,
  description text,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  phone text not null,
  is_active boolean default true,
  isOpen boolean default true,
  opening_time text default '07:00:00',
  closing_time text default '22:00:00',
  delivery_radius_km double precision default 5.0,
  min_order_amount double precision default 50.0,
  delivery_fee double precision default 0.0,
  cover_image_url text,
  logo_url text,
  rating double precision default 5.0,
  rating_count integer default 1,
  tags text[],
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Create Products Table
create table if not exists public.products (
  id text primary key,
  shop_id text not null references public.shops(id) on delete cascade,
  category_id text default 'c1',
  name text not null,
  description text,
  image_url text,
  price double precision not null,
  mrp double precision,
  unit text default 'piece',
  unit_value double precision default 1,
  stock_quantity integer default 50,
  is_available boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Create Orders Table
create table if not exists public.orders (
  id text primary key,
  customer_id text not null,
  shop_id text not null references public.shops(id) on delete cascade,
  status text not null default 'pending',
  subtotal double precision not null default 0.0,
  delivery_fee double precision not null default 0.0,
  total double precision not null default 0.0,
  delivery_address text not null,
  delivery_lat double precision default 17.4142,
  delivery_lng double precision default 78.4335,
  payment_method text default 'cod',
  payment_status text default 'pending',
  notes text,
  items jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Enable Row Level Security (RLS) with Public Access Policies
alter table public.shops enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

create policy "Allow public read on shops" on public.shops for select using (true);
create policy "Allow public insert on shops" on public.shops for insert with check (true);
create policy "Allow public update on shops" on public.shops for update using (true);

create policy "Allow public read on products" on public.products for select using (true);
create policy "Allow public insert on products" on public.products for insert with check (true);
create policy "Allow public update on products" on public.products for update using (true);
create policy "Allow public delete on products" on public.products for delete using (true);

create policy "Allow public read on orders" on public.orders for select using (true);
create policy "Allow public insert on orders" on public.orders for insert with check (true);
create policy "Allow public update on orders" on public.orders for update using (true);

-- 5. Enable Realtime Publications for Sub-Second Live Sync
alter publication supabase_realtime add table public.shops, public.products, public.orders;