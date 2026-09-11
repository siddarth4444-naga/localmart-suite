// User types
export type UserRole = 'customer' | 'shopkeeper' | 'developer';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  age?: number;
  avatar_url?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  address_type?: 'home' | 'work' | 'other';
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
  is_24_hours?: boolean;
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
  // Computed
  distance?: number;
  estimated_time?: string;
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
  // Joined
  category?: Category;
  shop?: Shop;
}

// Order types
export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cod';
export type PaymentStatus = 'pending' | 'paid';

export interface Order {
  id: string;
  customer_id: string;
  shop_id: string;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  total: number;
  delivery_address: string;
  delivery_lat: number;
  delivery_lng: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined
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

// Cart types
export interface CartItem {
  product: Product;
  quantity: number;
}
