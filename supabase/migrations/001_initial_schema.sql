-- =============================================
-- LocalMart Database Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role TEXT NOT NULL CHECK (role IN ('customer', 'shopkeeper')) DEFAULT 'customer',
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SHOPS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  phone TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  opening_time TIME DEFAULT '08:00',
  closing_time TIME DEFAULT '22:00',
  delivery_radius_km DOUBLE PRECISION DEFAULT 5.0,
  min_order_amount DOUBLE PRECISION DEFAULT 100,
  delivery_fee DOUBLE PRECISION DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CATEGORIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INT DEFAULT 0
);

-- Seed default categories
INSERT INTO categories (name, icon, sort_order) VALUES
  ('Fruits & Vegetables', 'leaf-outline', 1),
  ('Dairy & Bread', 'water-outline', 2),
  ('Snacks & Munchies', 'fast-food-outline', 3),
  ('Cold Drinks & Juices', 'beer-outline', 4),
  ('Instant & Ready to Eat', 'flame-outline', 5),
  ('Atta Rice & Dal', 'restaurant-outline', 6),
  ('Masala & Dry Fruits', 'nutrition-outline', 7),
  ('Personal Care', 'body-outline', 8);

-- =============================================
-- PRODUCTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price DOUBLE PRECISION NOT NULL,
  mrp DOUBLE PRECISION NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('kg', 'g', 'L', 'mL', 'piece', 'pack')) DEFAULT 'piece',
  unit_value DOUBLE PRECISION DEFAULT 1,
  stock_quantity INT DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ORDERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES users(id),
  shop_id UUID NOT NULL REFERENCES shops(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled')) DEFAULT 'pending',
  subtotal DOUBLE PRECISION NOT NULL,
  delivery_fee DOUBLE PRECISION DEFAULT 0,
  total DOUBLE PRECISION NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_lat DOUBLE PRECISION,
  delivery_lng DOUBLE PRECISION,
  payment_method TEXT DEFAULT 'cod' CHECK (payment_method IN ('cod', 'online')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ORDER ITEMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  product_price DOUBLE PRECISION NOT NULL,
  product_image_url TEXT,
  quantity INT NOT NULL DEFAULT 1,
  total DOUBLE PRECISION NOT NULL
);

-- =============================================
-- INDEXES for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_shops_owner ON shops(owner_id);
CREATE INDEX IF NOT EXISTS idx_shops_location ON shops(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_products_shop ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop ON orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Users: can read own profile, update own profile
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Shops: everyone can read active shops, owners can manage their own
CREATE POLICY "Anyone can view active shops" ON shops FOR SELECT USING (is_active = true);
CREATE POLICY "Owners can manage their shop" ON shops FOR ALL USING (auth.uid() = owner_id);

-- Categories: everyone can read
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);

-- Products: everyone can read available products, shop owners can manage their products
CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);
CREATE POLICY "Shop owners can manage products" ON products FOR ALL 
  USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));

-- Orders: customers see their orders, shop owners see orders for their shop
CREATE POLICY "Customers can view own orders" ON orders FOR SELECT 
  USING (auth.uid() = customer_id);
CREATE POLICY "Shop owners can view their shop orders" ON orders FOR SELECT 
  USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));
CREATE POLICY "Customers can create orders" ON orders FOR INSERT 
  WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Shop owners can update order status" ON orders FOR UPDATE 
  USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));

-- Order Items: visible to order participants
CREATE POLICY "Order participants can view items" ON order_items FOR SELECT 
  USING (order_id IN (
    SELECT id FROM orders WHERE customer_id = auth.uid() 
    OR shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  ));
CREATE POLICY "Customers can add order items" ON order_items FOR INSERT 
  WITH CHECK (order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid()));

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- REALTIME
-- Enable realtime for orders (for live order updates)
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
