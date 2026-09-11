// User types
export type UserRole = 'customer' | 'shopkeeper' | 'delivery' | 'developer';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  vehicle_type?: string;
  vehicle_number?: string;
  avatar_url?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  created_at: string;
}

// Shop types
export interface Shop {
  id: string;
  owner_id: string;
  owner_email?: string;
  name: string;
  description?: string;
  logo_url?: string;
  cover_image_url?: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  is_active: boolean;
  opening_time: string;
  closing_time: string;
  delivery_radius_km: number;
  min_order_amount: number;
  delivery_fee: number;
  created_at: string;
  rating?: number;
  rating_count?: number;
  tags?: string[];
  isOpen?: boolean;
  distance?: number;
}

// Category types
export interface Category {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
}

// Product types
export interface Product {
  id: string;
  shop_id: string;
  category_id: string;
  name: string;
  description?: string;
  image_url?: string;
  price: number;
  mrp: number;
  unit: 'kg' | 'g' | 'L' | 'mL' | 'piece' | 'pack';
  unit_value: number;
  stock_quantity: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
  shop?: Shop;
}

// Order types
export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivery_accepted' | 'picked_up' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type PaymentMethod = 'online' | 'upi_on_delivery' | 'cod' | 'upi' | 'card';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Order {
  id: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  shop_id: string;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  total: number;
  delivery_address: string;
  delivery_lat: number;
  delivery_lng: number;
  delivery_partner_id?: string;
  delivery_partner_name?: string;
  delivery_partner_phone?: string;
  picked_up_at?: string;
  delivered_at?: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_id?: string;
  payment_time?: string;
  paid_amount?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  shop?: Shop;
  customer?: User;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  product_image_url?: string;
  quantity: number;
  total: number;
}
