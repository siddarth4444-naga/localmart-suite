import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Shop, Product, Category, Order, OrderStatus } from '../types';
import { realtimeSync, getSyncServerUrl } from '../services/realtimeSync';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Fruits & Veggies', icon: 'nutrition-outline', sort_order: 1 },
  { id: 'c2', name: 'Dairy & Bread', icon: 'water-outline', sort_order: 2 },
  { id: 'c3', name: 'Snacks & Munchies', icon: 'fast-food-outline', sort_order: 3 },
  { id: 'c4', name: 'Cold Drinks & Juices', icon: 'wine-outline', sort_order: 4 },
  { id: 'c5', name: 'Instant Food', icon: 'pizza-outline', sort_order: 5 },
  { id: 'c6', name: 'Atta, Rice & Dal', icon: 'restaurant-outline', sort_order: 6 },
  { id: 'c7', name: 'Masala & Dry Fruits', icon: 'leaf-outline', sort_order: 7 },
  { id: 'c8', name: 'Personal & Baby Care', icon: 'medkit-outline', sort_order: 8 },
];


export const SEED_INITIAL_SHOPS: Shop[] = [
  {
    "id": "shop_1789625170165",
    "owner_id": "owner_1789625170165",
    "owner_email": "vamshi@gmail.com",
    "name": "vamshi",
    "description": "Neighborhood grocery store",
    "address": "Road No. 12, Banjara Hills, Hyderabad",
    "latitude": 17.4142,
    "longitude": 78.4335,
    "phone": "+91 98480 12345",
    "is_active": true,
    "isOpen": true,
    "is_24_hours": true,
    "opening_time": "07:00:00",
    "closing_time": "22:00:00",
    "delivery_radius_km": 5,
    "min_order_amount": 50,
    "delivery_fee": 0,
    "created_at": "2026-09-17T06:06:10.165Z",
    "cover_image_url": "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80",
    "logo_url": "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=200&q=80",
    "rating": 5,
    "rating_count": 1,
    "tags": [
      "Groceries",
      "Local Store"
    ],
    "password": "store123"
  },
  {
    "id": "shop_1789108938651",
    "owner_id": "owner_1789108938647",
    "owner_email": "5@gmail.com",
    "name": "lalith shop",
    "description": "Official Store of lalit",
    "address": "Road No. 12, Banjara Hills, Hyderabad",
    "latitude": 17.4142,
    "longitude": 78.4335,
    "phone": "0000000000",
    "is_active": true,
    "isOpen": true,
    "is_24_hours": false,
    "opening_time": "07:00:00",
    "closing_time": "22:00:00",
    "delivery_radius_km": 5,
    "min_order_amount": 50,
    "delivery_fee": 0,
    "created_at": "2026-09-11T06:42:18.651Z",
    "cover_image_url": "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80",
    "logo_url": "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=200&q=80",
    "rating": 5,
    "rating_count": 1,
    "tags": [
      "Groceries",
      "Local Store"
    ]
  },
  {
    "id": "shop_1788890503159",
    "owner_id": "owner_1788890503152",
    "owner_email": "3@gmail.com",
    "name": "rajuuuuu",
    "description": "Official Store of Shop Owner",
    "address": "Neighborhood Area, Hyderabad",
    "latitude": 17.4142,
    "longitude": 78.4335,
    "phone": "+91 98480 12345",
    "is_active": true,
    "isOpen": true,
    "is_24_hours": false,
    "opening_time": "07:00:00",
    "closing_time": "22:00:00",
    "delivery_radius_km": 5,
    "min_order_amount": 50,
    "delivery_fee": 0,
    "created_at": "2026-09-08T18:01:43.159Z",
    "cover_image_url": "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80",
    "logo_url": "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=200&q=80",
    "rating": 5,
    "rating_count": 1,
    "tags": [
      "Groceries",
      "Local Store",
      "Fast Delivery"
    ]
  },
  {
    "id": "shop_1788884736981",
    "owner_id": "owner_1788884736977",
    "owner_email": "4@gmail.com",
    "name": "kamala meat",
    "description": "Official Store of kamala",
    "address": "Road No. 12, Banjara Hills, Hyderabad",
    "latitude": 17.4142,
    "longitude": 78.4335,
    "phone": "4444444444",
    "is_active": true,
    "isOpen": true,
    "is_24_hours": false,
    "opening_time": "07:00:00",
    "closing_time": "22:00:00",
    "delivery_radius_km": 5,
    "min_order_amount": 50,
    "delivery_fee": 0,
    "created_at": "2026-09-08T16:25:36.981Z",
    "cover_image_url": "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80",
    "logo_url": "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=200&q=80",
    "rating": 5,
    "rating_count": 1,
    "tags": [
      "Groceries",
      "Local Store"
    ]
  },
  {
    "id": "shop_1788878649259",
    "owner_id": "owner_1788878059768",
    "owner_email": "2@gmail.com",
    "name": "naveen's Store",
    "description": "Official Store of naveen",
    "address": "Neighborhood Area, Hyderabad",
    "latitude": 17.4142,
    "longitude": 78.4335,
    "phone": "2222222222",
    "is_active": true,
    "isOpen": true,
    "opening_time": "07:00:00",
    "closing_time": "22:00:00",
    "delivery_radius_km": 5,
    "min_order_amount": 50,
    "delivery_fee": 0,
    "created_at": "2026-09-08T14:44:09.259Z",
    "cover_image_url": "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80",
    "logo_url": "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=200&q=80",
    "rating": 5,
    "rating_count": 1,
    "tags": [
      "Groceries",
      "Local Store",
      "Fast Delivery"
    ]
  },
  {
    "id": "shop_1788868070638",
    "owner_id": "owner_1788868070634",
    "owner_email": "1@gmail.com",
    "name": "lalith's kirana shop",
    "description": "Official Store of lalith",
    "address": "Road No. 12, Banjara Hills, Hyderabad",
    "latitude": 17.4142,
    "longitude": 78.4335,
    "phone": "1111111111",
    "is_active": true,
    "isOpen": true,
    "opening_time": "07:00:00",
    "closing_time": "22:00:00",
    "delivery_radius_km": 5,
    "min_order_amount": 50,
    "delivery_fee": 0,
    "created_at": "2026-09-08T11:47:50.638Z",
    "cover_image_url": "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80",
    "logo_url": "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=200&q=80",
    "rating": 5,
    "rating_count": 1,
    "tags": [
      "Groceries",
      "Local Store"
    ]
  }
];
export const SEED_INITIAL_PRODUCTS: Product[] = [
  {
    "id": "prod_1790257035655",
    "shop_id": "shop_1789625170165",
    "category_id": "c1",
    "name": "mile",
    "description": "",
    "image_url": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80",
    "price": 40,
    "mrp": 50,
    "unit": "kg",
    "unit_value": 1,
    "stock_quantity": 100,
    "is_available": true,
    "created_at": "2026-09-24T13:37:15.655Z",
    "updated_at": "2026-09-24T13:37:15.656Z"
  },
  {
    "id": "prod_1790152463557",
    "shop_id": "shop_1789625170165",
    "category_id": "c1",
    "name": "lkdsjflskdj",
    "description": "",
    "image_url": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80",
    "price": 40,
    "mrp": 50,
    "unit": "kg",
    "unit_value": 1,
    "stock_quantity": 100,
    "is_available": true,
    "created_at": "2026-09-23T08:34:23.557Z",
    "updated_at": "2026-09-23T08:34:23.557Z"
  },
  {
    "id": "prod_1790152452269",
    "shop_id": "shop_1789625170165",
    "category_id": "c1",
    "name": "qqqq",
    "description": "",
    "image_url": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80",
    "price": 40,
    "mrp": 50,
    "unit": "kg",
    "unit_value": 1,
    "stock_quantity": 100,
    "is_available": true,
    "created_at": "2026-09-23T08:34:12.269Z",
    "updated_at": "2026-09-23T08:34:12.269Z"
  },
  {
    "id": "prod_1789636505272",
    "shop_id": "shop_1789108938651",
    "category_id": "c1",
    "name": "mango",
    "description": "",
    "image_url": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80",
    "price": 40,
    "mrp": 50,
    "unit": "kg",
    "unit_value": 1,
    "stock_quantity": 100,
    "is_available": true,
    "created_at": "2026-09-17T09:15:05.272Z",
    "updated_at": "2026-09-17T09:15:05.272Z"
  },
  {
    "id": "prod_1789628180244",
    "shop_id": "shop_1789108938651",
    "category_id": "c1",
    "name": "shampoo",
    "description": "",
    "image_url": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80",
    "price": 40,
    "mrp": 50,
    "unit": "kg",
    "unit_value": 1,
    "stock_quantity": 100,
    "is_available": true,
    "created_at": "2026-09-17T06:56:20.244Z",
    "updated_at": "2026-09-17T06:56:20.244Z"
  },
  {
    "id": "prod_1789628160346",
    "shop_id": "shop_1789108938651",
    "category_id": "c1",
    "name": "coconut",
    "description": "",
    "image_url": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80",
    "price": 40,
    "mrp": 50,
    "unit": "kg",
    "unit_value": 1,
    "stock_quantity": 100,
    "is_available": true,
    "created_at": "2026-09-17T06:56:00.346Z",
    "updated_at": "2026-09-17T06:56:00.346Z"
  },
  {
    "id": "prod_1789628093423",
    "shop_id": "shop_1789625170165",
    "category_id": "c1",
    "name": "milk",
    "description": "",
    "image_url": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80",
    "price": 40,
    "mrp": 50,
    "unit": "kg",
    "unit_value": 1,
    "stock_quantity": 100,
    "is_available": true,
    "created_at": "2026-09-17T06:54:53.423Z",
    "updated_at": "2026-09-17T06:55:09.291Z"
  },
  {
    "id": "prod_1789108971487",
    "shop_id": "shop_1789108938651",
    "category_id": "c1",
    "name": "tamatoo",
    "description": "",
    "image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
    "price": 450,
    "mrp": 500,
    "unit": "piece",
    "unit_value": 1,
    "stock_quantity": 50,
    "is_available": true,
    "created_at": "2026-09-11T06:42:51.487Z",
    "updated_at": "2026-09-11T06:42:51.487Z"
  },
  {
    "id": "prod_1789108960578",
    "shop_id": "shop_1789108938651",
    "category_id": "c1",
    "name": "atta",
    "description": "",
    "image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
    "price": 500,
    "mrp": 100,
    "unit": "piece",
    "unit_value": 1,
    "stock_quantity": 50,
    "is_available": true,
    "created_at": "2026-09-11T06:42:40.578Z",
    "updated_at": "2026-09-11T06:42:40.578Z"
  },
  {
    "id": "prod_1788890532595",
    "shop_id": "shop_1788890503159",
    "category_id": "c1",
    "name": "orange",
    "description": "",
    "image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
    "price": 22,
    "mrp": 22,
    "unit": "piece",
    "unit_value": 1,
    "stock_quantity": 50,
    "is_available": true,
    "created_at": "2026-09-08T18:02:12.595Z",
    "updated_at": "2026-09-08T18:02:12.595Z"
  },
  {
    "id": "prod_1788884795503",
    "shop_id": "shop_1788884736981",
    "category_id": "c1",
    "name": "chicken masala",
    "description": "",
    "image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
    "price": 5,
    "mrp": 7,
    "unit": "piece",
    "unit_value": 1,
    "stock_quantity": 50,
    "is_available": true,
    "created_at": "2026-09-08T16:26:35.503Z",
    "updated_at": "2026-09-08T16:26:35.503Z"
  },
  {
    "id": "prod_1788884777002",
    "shop_id": "shop_1788884736981",
    "category_id": "c1",
    "name": "mutton",
    "description": "",
    "image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
    "price": 900,
    "mrp": 1000,
    "unit": "kg",
    "unit_value": 1,
    "stock_quantity": 50,
    "is_available": true,
    "created_at": "2026-09-08T16:26:17.002Z",
    "updated_at": "2026-09-08T16:26:17.002Z"
  },
  {
    "id": "prod_1788884762268",
    "shop_id": "shop_1788884736981",
    "category_id": "c1",
    "name": "chicken",
    "description": "",
    "image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
    "price": 250,
    "mrp": 300,
    "unit": "kg",
    "unit_value": 1,
    "stock_quantity": 50,
    "is_available": true,
    "created_at": "2026-09-08T16:26:02.268Z",
    "updated_at": "2026-09-08T16:26:02.268Z"
  },
  {
    "id": "prod_1788878700648",
    "shop_id": "shop_1788878649259",
    "category_id": "c1",
    "name": "chilli",
    "description": "",
    "image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
    "price": 50,
    "mrp": 56,
    "unit": "piece",
    "unit_value": 1,
    "stock_quantity": 50,
    "is_available": true,
    "created_at": "2026-09-08T14:45:00.648Z",
    "updated_at": "2026-09-08T14:45:00.648Z"
  },
  {
    "id": "prod_1788878675323",
    "shop_id": "shop_1788878649259",
    "category_id": "c1",
    "name": "tomato",
    "description": "",
    "image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
    "price": 1,
    "mrp": 1,
    "unit": "piece",
    "unit_value": 1,
    "stock_quantity": 50,
    "is_available": true,
    "created_at": "2026-09-08T14:44:35.323Z",
    "updated_at": "2026-09-08T14:44:35.323Z"
  },
  {
    "id": "prod_1788868206605",
    "shop_id": "shop_1788868070638",
    "category_id": "c1",
    "name": "shampoo",
    "description": "",
    "image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
    "price": 2,
    "mrp": 5,
    "unit": "piece",
    "unit_value": 1,
    "stock_quantity": 50,
    "is_available": true,
    "created_at": "2026-09-08T11:50:06.605Z",
    "updated_at": "2026-09-08T11:50:06.605Z"
  },
  {
    "id": "prod_1788868189453",
    "shop_id": "shop_1788868070638",
    "category_id": "c1",
    "name": "basan",
    "description": "",
    "image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
    "price": 75,
    "mrp": 86,
    "unit": "kg",
    "unit_value": 1,
    "stock_quantity": 50,
    "is_available": true,
    "created_at": "2026-09-08T11:49:49.453Z",
    "updated_at": "2026-09-08T11:49:49.453Z"
  },
  {
    "id": "prod_1788868088734",
    "shop_id": "shop_1788868070638",
    "category_id": "c1",
    "name": "atta",
    "description": "",
    "image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
    "price": 50,
    "mrp": 60,
    "unit": "kg",
    "unit_value": 1,
    "stock_quantity": 50,
    "is_available": true,
    "created_at": "2026-09-08T11:48:08.734Z",
    "updated_at": "2026-09-08T11:48:08.734Z"
  }
];
export const SEED_INITIAL_ORDERS: Order[] = [
  {
    "id": "ord_1790256932908",
    "customer_id": "u_cust_1790157250115",
    "shop_id": "shop_1789625170165",
    "status": "delivered",
    "subtotal": 360,
    "delivery_fee": 0,
    "total": 365,
    "delivery_address": "Banjara Hills, Hyderabad",
    "delivery_lat": 17.4142,
    "delivery_lng": 78.4335,
    "payment_method": "phonepe",
    "payment_status": "paid",
    "payment_id": "TXN_PH_88446422",
    "payment_time": "2026-09-24T13:35:32.908Z",
    "created_at": "2026-09-24T13:35:32.908Z",
    "updated_at": "2026-09-24T13:36:11.737Z",
    "items": [
      {
        "id": "item_1790256932908_0",
        "order_id": "",
        "product_id": "prod_1790152463557",
        "product_name": "lkdsjflskdj",
        "product_price": 40,
        "product_image_url": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80",
        "quantity": 9,
        "total": 360
      }
    ],
    "delivery_partner": {
      "id": "dp_ravi_kumar",
      "name": "Ravi Kumar (Rider)",
      "phone": "+91 98480 99887"
    }
  },
  {
    "id": "ord_1790157264045",
    "customer_id": "u_cust_1790157250115",
    "shop_id": "shop_1789625170165",
    "status": "delivered",
    "subtotal": 680,
    "delivery_fee": 0,
    "total": 685,
    "delivery_address": "10, Banjara Hills, Hyderabad - 500034",
    "delivery_lat": 17.4142,
    "delivery_lng": 78.4335,
    "payment_method": "phonepe",
    "payment_status": "paid",
    "payment_id": "TXN_PH_46839222",
    "payment_time": "2026-09-23T09:54:24.045Z",
    "created_at": "2026-09-23T09:54:24.045Z",
    "updated_at": "2026-09-23T09:59:44.328Z",
    "items": [
      {
        "id": "item_1790157264045_0",
        "order_id": "",
        "product_id": "prod_1790152463557",
        "product_name": "lkdsjflskdj",
        "product_price": 40,
        "product_image_url": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80",
        "quantity": 17,
        "total": 680
      }
    ],
    "delivery_partner": {
      "id": "dp_ravi_kumar",
      "name": "Ravi Kumar (Rider)",
      "phone": "+91 98480 99887"
    }
  },
  {
    "id": "ord_1790157162790",
    "customer_id": "cust_1",
    "shop_id": "shop_1789625170165",
    "status": "delivered",
    "subtotal": 360,
    "delivery_fee": 0,
    "total": 365,
    "delivery_address": "Banjara Hills, Hyderabad",
    "delivery_lat": 17.4142,
    "delivery_lng": 78.4335,
    "payment_method": "phonepe",
    "payment_status": "paid",
    "payment_id": "TXN_PH_93629631",
    "payment_time": "2026-09-23T09:52:42.789Z",
    "created_at": "2026-09-23T09:52:42.790Z",
    "updated_at": "2026-09-23T09:59:54.685Z",
    "items": [
      {
        "id": "item_1790157162790_0",
        "order_id": "",
        "product_id": "prod_1790152463557",
        "product_name": "lkdsjflskdj",
        "product_price": 40,
        "product_image_url": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80",
        "quantity": 9,
        "total": 360
      }
    ],
    "delivery_partner": {
      "id": "dp_ravi_kumar",
      "name": "Ravi Kumar (Rider)",
      "phone": "+91 98480 99887"
    }
  },
  {
    "id": "ord_1790094452141",
    "customer_id": "u_cust_1788886617971",
    "shop_id": "shop_1789625170165",
    "status": "delivered",
    "subtotal": 360,
    "delivery_fee": 0,
    "total": 365,
    "delivery_address": "36/, Banjara Hills, Hyderabad - 500034",
    "delivery_lat": 17.4142,
    "delivery_lng": 78.4335,
    "payment_method": "cod",
    "payment_status": "paid",
    "notes": "Delivery Note: Leave at door",
    "created_at": "2026-09-22T16:27:32.141Z",
    "updated_at": "2026-09-22T16:28:40.493Z",
    "items": [
      {
        "id": "item_1790094452141_0",
        "order_id": "",
        "product_id": "prod_1789628093423",
        "product_name": "milk",
        "product_price": 40,
        "product_image_url": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80",
        "quantity": 9,
        "total": 360
      }
    ],
    "delivery_partner": {
      "id": "dp_ravi_kumar",
      "name": "Ravi Kumar (Rider)",
      "phone": "+91 98480 99887"
    }
  },
  {
    "id": "ord_1789628593293",
    "customer_id": "u_cust_1788886617971",
    "customer_name": "ramu",
    "customer_phone": "+91 66666 66666",
    "shop_id": "shop_1789108938651",
    "status": "delivered",
    "subtotal": 4490,
    "delivery_fee": 0,
    "total": 4445,
    "delivery_address": "36/, Banjara Hills, Hyderabad - 500034",
    "delivery_lat": 17.4142,
    "delivery_lng": 78.4335,
    "payment_method": "online",
    "payment_status": "paid",
    "payment_id": "PAY_UPI_1789628590779_8205",
    "payment_time": "2026-09-17T07:03:13.293Z",
    "paid_amount": 4445,
    "notes": "Delivery Note: Leave at door",
    "created_at": "2026-09-17T07:03:13.293Z",
    "updated_at": "2026-09-17T07:04:30.332Z",
    "items": [
      {
        "id": "item_1789628593293_0",
        "order_id": "",
        "product_id": "prod_1789628180244",
        "product_name": "shampoo",
        "product_price": 40,
        "product_image_url": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80",
        "quantity": 6,
        "total": 240
      },
      {
        "id": "item_1789628593293_1",
        "order_id": "",
        "product_id": "prod_1789108971487",
        "product_name": "tamatoo",
        "product_price": 450,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 5,
        "total": 2250
      },
      {
        "id": "item_1789628593293_2",
        "order_id": "",
        "product_id": "prod_1789108960578",
        "product_name": "atta",
        "product_price": 500,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 4,
        "total": 2000
      }
    ],
    "delivery_partner_id": "dp_ravi_kumar",
    "delivery_partner_name": "Ravi Kumar (Rider)",
    "delivery_partner_phone": "+91 98480 99887",
    "picked_up_at": "2026-09-17T07:04:17.879Z",
    "delivered_at": "2026-09-17T07:04:30.332Z"
  },
  {
    "id": "ord_1789625286176",
    "customer_id": "u_cust_1788886617971",
    "customer_name": "ramu",
    "customer_phone": "+91 66666 66666",
    "shop_id": "shop_1789625170165",
    "status": "delivered",
    "subtotal": 1500,
    "delivery_fee": 0,
    "total": 1405,
    "delivery_address": "36/, Banjara Hills, Hyderabad - 500034",
    "delivery_lat": 17.4142,
    "delivery_lng": 78.4335,
    "payment_method": "upi_on_delivery",
    "payment_status": "paid",
    "paid_amount": 0,
    "notes": "Delivery Note: Leave at door",
    "created_at": "2026-09-17T06:08:06.176Z",
    "updated_at": "2026-09-17T07:02:30.733Z",
    "items": [
      {
        "id": "item_1789625286175_0",
        "order_id": "",
        "product_id": "prod_1789625249301",
        "product_name": "condom",
        "product_price": 500,
        "product_image_url": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80",
        "quantity": 3,
        "total": 1500
      }
    ],
    "delivery_partner_id": "dp_ravi_kumar",
    "delivery_partner_name": "Ravi Kumar (Rider)",
    "delivery_partner_phone": "+91 98480 99887",
    "picked_up_at": "2026-09-17T07:02:28.569Z",
    "delivered_at": "2026-09-17T07:02:30.733Z"
  },
  {
    "id": "ord_1789116548518",
    "customer_id": "u_cust_1788886617971",
    "customer_name": "ramu",
    "customer_phone": "+91 66666 66666",
    "shop_id": "shop_1788868070638",
    "status": "pending",
    "subtotal": 450,
    "delivery_fee": 0,
    "total": 455,
    "delivery_address": "36/, Banjara Hills, Hyderabad - 500034",
    "delivery_lat": 17.4142,
    "delivery_lng": 78.4335,
    "payment_method": "online",
    "payment_status": "paid",
    "payment_id": "PAY_UPI_1789116545988_4388",
    "payment_time": "2026-09-11T08:49:08.518Z",
    "paid_amount": 455,
    "notes": "Delivery Note: Leave at door",
    "created_at": "2026-09-11T08:49:08.518Z",
    "updated_at": "2026-09-11T08:49:08.518Z",
    "items": [
      {
        "id": "item_1789116548518_0",
        "order_id": "",
        "product_id": "prod_1788868088734",
        "product_name": "atta",
        "product_price": 50,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 9,
        "total": 450
      }
    ]
  },
  {
    "id": "ord_1789108990665",
    "customer_id": "u_cust_1788886617971",
    "shop_id": "shop_1789108938651",
    "status": "delivered",
    "subtotal": 4300,
    "delivery_fee": 0,
    "total": 4305,
    "delivery_address": "36/, Banjara Hills, Hyderabad - 500034",
    "delivery_lat": 17.4142,
    "delivery_lng": 78.4335,
    "payment_method": "cod",
    "payment_status": "paid",
    "created_at": "2026-09-11T06:43:10.665Z",
    "updated_at": "2026-09-11T06:43:42.483Z",
    "items": [
      {
        "id": "item_1789108990664_0",
        "order_id": "",
        "product_id": "prod_1789108971487",
        "product_name": "tamatoo",
        "product_price": 450,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 4,
        "total": 1800
      },
      {
        "id": "item_1789108990664_1",
        "order_id": "",
        "product_id": "prod_1789108960578",
        "product_name": "atta",
        "product_price": 500,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 5,
        "total": 2500
      }
    ],
    "delivery_partner_id": "dp_ravi_kumar",
    "delivery_partner_name": "Ravi Kumar (Rider)",
    "delivery_partner_phone": "+91 98480 99887",
    "picked_up_at": "2026-09-11T06:43:35.577Z",
    "delivered_at": "2026-09-11T06:43:42.483Z"
  },
  {
    "id": "ord_1789108781563",
    "customer_id": "u_cust_1788886617971",
    "shop_id": "shop_1788868070638",
    "status": "pending",
    "subtotal": 254,
    "delivery_fee": 0,
    "total": 259,
    "delivery_address": "36/, Banjara Hills, Hyderabad - 500034",
    "delivery_lat": 17.4142,
    "delivery_lng": 78.4335,
    "payment_method": "cod",
    "payment_status": "pending",
    "created_at": "2026-09-11T06:39:41.563Z",
    "updated_at": "2026-09-11T06:39:41.563Z",
    "items": [
      {
        "id": "item_1789108781563_0",
        "order_id": "",
        "product_id": "prod_1788868206605",
        "product_name": "shampoo",
        "product_price": 2,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 2,
        "total": 4
      },
      {
        "id": "item_1789108781563_1",
        "order_id": "",
        "product_id": "prod_1788868189453",
        "product_name": "basan",
        "product_price": 75,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 2,
        "total": 150
      },
      {
        "id": "item_1789108781563_2",
        "order_id": "",
        "product_id": "prod_1788868088734",
        "product_name": "atta",
        "product_price": 50,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 2,
        "total": 100
      }
    ]
  },
  {
    "id": "ord_1788892031157",
    "customer_id": "u_cust_1788890375230",
    "shop_id": "shop_1788890503159",
    "status": "cancelled",
    "subtotal": 154,
    "delivery_fee": 0,
    "total": 159,
    "delivery_address": "Banjara Hills, Hyderabad",
    "delivery_lat": 17.4142,
    "delivery_lng": 78.4335,
    "payment_method": "cod",
    "payment_status": "pending",
    "created_at": "2026-09-08T18:27:11.157Z",
    "updated_at": "2026-09-08T18:30:33.413Z",
    "items": [
      {
        "id": "item_1788892031156_0",
        "order_id": "",
        "product_id": "prod_1788890532595",
        "product_name": "orange",
        "product_price": 22,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 7,
        "total": 154
      }
    ]
  },
  {
    "id": "ord_1788891237213",
    "customer_id": "u_cust_1788890375230",
    "shop_id": "shop_1788890503159",
    "status": "delivered",
    "subtotal": 154,
    "delivery_fee": 0,
    "total": 159,
    "delivery_address": "Banjara Hills, Hyderabad",
    "delivery_lat": 17.4142,
    "delivery_lng": 78.4335,
    "payment_method": "cod",
    "payment_status": "paid",
    "created_at": "2026-09-08T18:13:57.213Z",
    "updated_at": "2026-09-08T18:17:03.302Z",
    "items": [
      {
        "id": "item_1788891237213_0",
        "order_id": "",
        "product_id": "prod_1788890532595",
        "product_name": "orange",
        "product_price": 22,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 7,
        "total": 154
      }
    ],
    "delivery_partner_id": "dp_ravi_kumar",
    "delivery_partner_name": "Ravi Kumar (Rider)",
    "delivery_partner_phone": "+91 98480 99887",
    "picked_up_at": "2026-09-08T18:17:01.567Z",
    "delivered_at": "2026-09-08T18:17:03.302Z"
  },
  {
    "id": "ord_1788890401473",
    "customer_id": "u_cust_1788890375230",
    "shop_id": "shop_1788884736981",
    "status": "cancelled",
    "subtotal": 900,
    "delivery_fee": 0,
    "total": 905,
    "delivery_address": "Banjara Hills, Hyderabad",
    "delivery_lat": 17.4142,
    "delivery_lng": 78.4335,
    "payment_method": "cod",
    "payment_status": "pending",
    "created_at": "2026-09-08T18:00:01.473Z",
    "updated_at": "2026-09-08T18:30:38.784Z",
    "items": [
      {
        "id": "item_1788890401472_0",
        "order_id": "",
        "product_id": "prod_1788884777002",
        "product_name": "mutton",
        "product_price": 900,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 1,
        "total": 900
      }
    ]
  },
  {
    "id": "ord_1788887292095",
    "customer_id": "u_cust_1788886523992",
    "shop_id": "shop_1788878649259",
    "status": "delivered",
    "subtotal": 106,
    "delivery_fee": 0,
    "total": 111,
    "delivery_address": "5/55, Banjara Hills, Hyderabad - 500034",
    "delivery_lat": 17.4142,
    "delivery_lng": 78.4335,
    "payment_method": "cod",
    "payment_status": "paid",
    "created_at": "2026-09-08T17:08:12.095Z",
    "updated_at": "2026-09-08T18:16:55.019Z",
    "items": [
      {
        "id": "item_1788887292094_0",
        "order_id": "",
        "product_id": "prod_1788878700648",
        "product_name": "chilli",
        "product_price": 50,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 2,
        "total": 100
      },
      {
        "id": "item_1788887292094_1",
        "order_id": "",
        "product_id": "prod_1788878675323",
        "product_name": "tomato",
        "product_price": 1,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 6,
        "total": 6
      }
    ],
    "delivery_partner_id": "dp_ravi_kumar",
    "delivery_partner_name": "Ravi Kumar (Rider)",
    "delivery_partner_phone": "+91 98480 99887",
    "picked_up_at": "2026-09-08T18:16:43.249Z",
    "delivered_at": "2026-09-08T18:16:55.019Z"
  },
  {
    "id": "ord_1788887249017",
    "customer_id": "u_cust_1788886617971",
    "shop_id": "shop_1788884736981",
    "status": "delivered",
    "subtotal": 4540,
    "delivery_fee": 0,
    "total": 4545,
    "delivery_address": "36/, Banjara Hills, Hyderabad - 500034",
    "delivery_lat": 17.4142,
    "delivery_lng": 78.4335,
    "payment_method": "cod",
    "payment_status": "paid",
    "created_at": "2026-09-08T17:07:29.017Z",
    "updated_at": "2026-09-08T17:15:21.807Z",
    "items": [
      {
        "id": "item_1788887249017_0",
        "order_id": "",
        "product_id": "prod_1788884795503",
        "product_name": "chicken masala",
        "product_price": 5,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 8,
        "total": 40
      },
      {
        "id": "item_1788887249017_1",
        "order_id": "",
        "product_id": "prod_1788884777002",
        "product_name": "mutton",
        "product_price": 900,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 5,
        "total": 4500
      }
    ],
    "delivery_partner_id": "dp_ravi_kumar",
    "delivery_partner_name": "Ravi Kumar (Rider)",
    "delivery_partner_phone": "+91 98480 99887",
    "picked_up_at": "2026-09-08T17:15:20.803Z",
    "delivered_at": "2026-09-08T17:15:21.807Z"
  },
  {
    "id": "ord_1788886553856",
    "customer_id": "u_cust_1788886523992",
    "shop_id": "shop_1788884736981",
    "status": "delivered",
    "subtotal": 3705,
    "delivery_fee": 0,
    "total": 3710,
    "delivery_address": "5/55, Banjara Hills, Hyderabad - 500034",
    "delivery_lat": 17.4142,
    "delivery_lng": 78.4335,
    "payment_method": "cod",
    "payment_status": "paid",
    "created_at": "2026-09-08T16:55:53.856Z",
    "updated_at": "2026-09-08T17:32:05.460Z",
    "items": [
      {
        "id": "item_1788886553856_0",
        "order_id": "",
        "product_id": "prod_1788884795503",
        "product_name": "chicken masala",
        "product_price": 5,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 1,
        "total": 5
      },
      {
        "id": "item_1788886553856_1",
        "order_id": "",
        "product_id": "prod_1788884777002",
        "product_name": "mutton",
        "product_price": 900,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 3,
        "total": 2700
      },
      {
        "id": "item_1788886553856_2",
        "order_id": "",
        "product_id": "prod_1788884762268",
        "product_name": "chicken",
        "product_price": 250,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 4,
        "total": 1000
      }
    ],
    "delivery_partner_id": "dp_ravi_kumar",
    "delivery_partner_name": "Ravi Kumar (Rider)",
    "delivery_partner_phone": "+91 98480 99887",
    "picked_up_at": "2026-09-08T17:31:33.884Z",
    "delivered_at": "2026-09-08T17:32:05.460Z"
  },
  {
    "id": "ord_1788886395290",
    "customer_id": "u_cust_1788886090095",
    "shop_id": "shop_1788884736981",
    "status": "delivered",
    "subtotal": 1410,
    "delivery_fee": 0,
    "total": 1415,
    "delivery_address": "12-8-9-36A, Banjara Hills, Hyderabad - 500034",
    "delivery_lat": 17.4142,
    "delivery_lng": 78.4335,
    "payment_method": "cod",
    "payment_status": "paid",
    "created_at": "2026-09-08T16:53:15.290Z",
    "updated_at": "2026-09-08T16:54:23.504Z",
    "items": [
      {
        "id": "item_1788886395290_0",
        "order_id": "",
        "product_id": "prod_1788884795503",
        "product_name": "chicken masala",
        "product_price": 5,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 2,
        "total": 10
      },
      {
        "id": "item_1788886395290_1",
        "order_id": "",
        "product_id": "prod_1788884762268",
        "product_name": "chicken",
        "product_price": 250,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 2,
        "total": 500
      },
      {
        "id": "item_1788886395290_2",
        "order_id": "",
        "product_id": "prod_1788884777002",
        "product_name": "mutton",
        "product_price": 900,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 1,
        "total": 900
      }
    ],
    "delivery_partner_id": "dp_ravi_kumar",
    "delivery_partner_name": "Ravi Kumar (Rider)",
    "delivery_partner_phone": "+91 98480 99887",
    "picked_up_at": "2026-09-08T16:54:22.244Z",
    "delivered_at": "2026-09-08T16:54:23.504Z"
  },
  {
    "id": "ord_1788886348114",
    "customer_id": "u_cust_1788886090095",
    "shop_id": "shop_1788868070638",
    "status": "pending",
    "subtotal": 52,
    "delivery_fee": 0,
    "total": 57,
    "delivery_address": "12-8-9-36A, Banjara Hills, Hyderabad - 500034",
    "delivery_lat": 17.4142,
    "delivery_lng": 78.4335,
    "payment_method": "cod",
    "payment_status": "pending",
    "created_at": "2026-09-08T16:52:28.114Z",
    "updated_at": "2026-09-08T16:52:28.114Z",
    "items": [
      {
        "id": "item_1788886348113_0",
        "order_id": "",
        "product_id": "prod_1788868206605",
        "product_name": "shampoo",
        "product_price": 2,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 1,
        "total": 2
      },
      {
        "id": "item_1788886348113_1",
        "order_id": "",
        "product_id": "prod_1788868088734",
        "product_name": "atta",
        "product_price": 50,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 1,
        "total": 50
      }
    ]
  },
  {
    "id": "ord_1788884831450",
    "customer_id": "u_customer_shopper",
    "shop_id": "shop_1788884736981",
    "status": "delivered",
    "subtotal": 2310,
    "delivery_fee": 0,
    "total": 2315,
    "delivery_address": "Flat 402, Sai Balaji Residency, Banjara Hills, Hyderabad",
    "delivery_lat": 17.4142,
    "delivery_lng": 78.4335,
    "payment_method": "cod",
    "payment_status": "paid",
    "created_at": "2026-09-08T16:27:11.450Z",
    "updated_at": "2026-09-08T16:28:45.581Z",
    "items": [
      {
        "id": "item_1788884831449_0",
        "order_id": "",
        "product_id": "prod_1788884795503",
        "product_name": "chicken masala",
        "product_price": 5,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 2,
        "total": 10
      },
      {
        "id": "item_1788884831449_1",
        "order_id": "",
        "product_id": "prod_1788884762268",
        "product_name": "chicken",
        "product_price": 250,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 2,
        "total": 500
      },
      {
        "id": "item_1788884831449_2",
        "order_id": "",
        "product_id": "prod_1788884777002",
        "product_name": "mutton",
        "product_price": 900,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 2,
        "total": 1800
      }
    ],
    "delivery_partner_id": "dp_ravi_kumar",
    "delivery_partner_name": "Ravi Kumar (Rider)",
    "delivery_partner_phone": "+91 98480 99887",
    "picked_up_at": "2026-09-08T16:28:29.328Z",
    "delivered_at": "2026-09-08T16:28:45.581Z"
  },
  {
    "id": "ord_1788878805238",
    "customer_id": "u_customer_shopper",
    "shop_id": "shop_1788868070638",
    "status": "cancelled",
    "subtotal": 560,
    "delivery_fee": 0,
    "total": 565,
    "delivery_address": "Banjara Hills, Hyderabad",
    "delivery_lat": 17.4142,
    "delivery_lng": 78.4335,
    "payment_method": "cod",
    "payment_status": "pending",
    "created_at": "2026-09-08T14:46:45.238Z",
    "updated_at": "2026-09-08T14:47:31.734Z",
    "items": [
      {
        "id": "item_1788878805238_0",
        "order_id": "",
        "product_id": "prod_1788868206605",
        "product_name": "shampoo",
        "product_price": 2,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 5,
        "total": 10
      },
      {
        "id": "item_1788878805238_1",
        "order_id": "",
        "product_id": "prod_1788868189453",
        "product_name": "basan",
        "product_price": 75,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 4,
        "total": 300
      },
      {
        "id": "item_1788878805238_2",
        "order_id": "",
        "product_id": "prod_1788868088734",
        "product_name": "atta",
        "product_price": 50,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 5,
        "total": 250
      }
    ]
  },
  {
    "id": "ord_1788878769632",
    "customer_id": "u_customer_shopper",
    "shop_id": "shop_1788878649259",
    "status": "delivered",
    "subtotal": 306,
    "delivery_fee": 0,
    "total": 311,
    "delivery_address": "Banjara Hills, Hyderabad",
    "delivery_lat": 17.4142,
    "delivery_lng": 78.4335,
    "payment_method": "cod",
    "payment_status": "paid",
    "created_at": "2026-09-08T14:46:09.632Z",
    "updated_at": "2026-09-08T16:53:54.037Z",
    "items": [
      {
        "id": "item_1788878769632_0",
        "order_id": "",
        "product_id": "prod_1788878700648",
        "product_name": "chilli",
        "product_price": 50,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 6,
        "total": 300
      },
      {
        "id": "item_1788878769632_1",
        "order_id": "",
        "product_id": "prod_1788878675323",
        "product_name": "tomato",
        "product_price": 1,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 6,
        "total": 6
      }
    ],
    "delivery_partner_id": "dp_ravi_kumar",
    "delivery_partner_name": "Ravi Kumar (Rider)",
    "delivery_partner_phone": "+91 98480 99887",
    "picked_up_at": "2026-09-08T16:53:52.616Z",
    "delivered_at": "2026-09-08T16:53:54.037Z"
  },
  {
    "id": "ord_1788868242953",
    "customer_id": "u_customer_shopper",
    "shop_id": "shop_1788868070638",
    "status": "delivered",
    "subtotal": 227,
    "delivery_fee": 0,
    "total": 232,
    "delivery_address": "Current Location",
    "delivery_lat": 12.967182641243257,
    "delivery_lng": 77.71578066180403,
    "payment_method": "cod",
    "payment_status": "paid",
    "created_at": "2026-09-08T11:50:42.953Z",
    "updated_at": "2026-09-08T11:51:21.963Z",
    "items": [
      {
        "id": "item_1788868242953_0",
        "order_id": "",
        "product_id": "prod_1788868206605",
        "product_name": "shampoo",
        "product_price": 2,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 1,
        "total": 2
      },
      {
        "id": "item_1788868242953_1",
        "order_id": "",
        "product_id": "prod_1788868189453",
        "product_name": "basan",
        "product_price": 75,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 1,
        "total": 75
      },
      {
        "id": "item_1788868242953_2",
        "order_id": "",
        "product_id": "prod_1788868088734",
        "product_name": "atta",
        "product_price": 50,
        "product_image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        "quantity": 3,
        "total": 150
      }
    ],
    "delivery_partner_id": "dp_ravi_kumar",
    "delivery_partner_name": "Ravi Kumar (Rider)",
    "delivery_partner_phone": "+91 98480 99887",
    "picked_up_at": "2026-09-08T11:51:20.253Z",
    "delivered_at": "2026-09-08T11:51:21.963Z"
  }
];

const STORAGE_KEY_SHOPS = '@localmart_shops';
const STORAGE_KEY_PRODUCTS = '@localmart_products';
const STORAGE_KEY_ORDERS = '@localmart_orders';
const STORAGE_KEY_ACTIVE_SHOPKEEPER_SHOP_ID = '@localmart_active_shopkeeper_shop_id';

interface ShopState {
  shops: Shop[];
  products: Product[];
  categories: Category[];
  orders: Order[];
  activeShopkeeperShopId: string | null;
  isLoading: boolean;

  // Init / Hydrate
  initialize: () => Promise<void>;

  // Developer / Admin Shop Actions
  addShop: (shopData: Partial<Shop>) => Shop;
  updateShop: (id: string, updates: Partial<Shop>) => void;
  deleteShop: (id: string) => void;
  toggleShopStatus: (id: string) => void;
  setActiveShopkeeperShopId: (shopId: string | null) => void;

  // Product Actions (Developer + Shopkeeper)
  addProduct: (productData: Partial<Product>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleProductAvailability: (id: string) => void;

  // Order & Delivery Actions (Customer + Shopkeeper + Delivery Partner)
  addOrder: (orderData: Partial<Order>) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  acceptDelivery: (orderId: string, rider?: { id: string; name: string; phone: string }) => void;
  pickupDelivery: (orderId: string) => void;
  completeDelivery: (orderId: string) => void;

  // Reset / Clear
  clearAllShops: () => void;
  seedDemoShops: () => void;
}

export const useShopStore = create<ShopState>((set, get) => ({
  shops: [],
  products: [],
  categories: DEFAULT_CATEGORIES,
  orders: [],
  activeShopkeeperShopId: null,
  isLoading: true,

  initialize: async () => {
    try {
      const [storedShops, storedProducts, storedOrders, storedActiveShopId] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_SHOPS),
        AsyncStorage.getItem(STORAGE_KEY_PRODUCTS),
        AsyncStorage.getItem(STORAGE_KEY_ORDERS),
        AsyncStorage.getItem(STORAGE_KEY_ACTIVE_SHOPKEEPER_SHOP_ID),
      ]);

      let parsedShops: Shop[] = storedShops ? JSON.parse(storedShops) : (SEED_INITIAL_SHOPS.length > 0 ? SEED_INITIAL_SHOPS : []);
      let parsedProducts: Product[] = storedProducts ? JSON.parse(storedProducts) : (SEED_INITIAL_PRODUCTS.length > 0 ? SEED_INITIAL_PRODUCTS : []);
      let parsedOrders: Order[] = storedOrders ? JSON.parse(storedOrders) : (SEED_INITIAL_ORDERS.length > 0 ? SEED_INITIAL_ORDERS : []);

      // Fetch latest snapshot from Shared Sync Bridge Server (Port 5000 / Cloud API)
      try {
        const syncUrl = getSyncServerUrl();
        const syncRes = await fetch(`${syncUrl}/api/sync`);
        if (syncRes.ok) {
          const serverDb = await syncRes.json();
          if (serverDb && Array.isArray(serverDb.shops) && serverDb.shops.length > 0) {
            parsedShops = serverDb.shops;
            parsedProducts = Array.isArray(serverDb.products) ? serverDb.products : [];
            parsedOrders = Array.isArray(serverDb.orders) ? serverDb.orders : [];
            AsyncStorage.setItem(STORAGE_KEY_SHOPS, JSON.stringify(parsedShops)).catch(() => {});
            AsyncStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(parsedProducts)).catch(() => {});
            AsyncStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(parsedOrders)).catch(() => {});
          } else if (parsedShops.length > 0 && (!serverDb.shops || serverDb.shops.length === 0)) {
            fetch(`${syncUrl}/api/sync`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'SYNC_UPDATE',
                snapshot: { shops: parsedShops, products: parsedProducts, orders: parsedOrders }
              })
            }).catch(() => {});
          }
        }
      } catch (err) {
        // Sync server offline - using local storage
      }

      let chosenActiveShopId = storedActiveShopId;
      if (!chosenActiveShopId || !parsedShops.some(s => s.id === chosenActiveShopId)) {
        chosenActiveShopId = parsedShops.length > 0 ? parsedShops[0].id : null;
      }

      set({
        shops: parsedShops,
        products: parsedProducts,
        orders: parsedOrders,
        activeShopkeeperShopId: chosenActiveShopId,
        isLoading: false,
      });
    } catch (e) {
      console.log('Error initializing shop store:', e);
      set({ isLoading: false });
    }
  },

  addShop: (shopData) => {
    const newId = `shop_${Date.now()}`;
    const newShop: Shop = {
      id: newId,
      owner_id: shopData.owner_id || `owner_${Date.now()}`,
      owner_email: shopData.owner_email || 'owner@example.com',
      name: shopData.name || 'New Local Store',
      description: shopData.description || 'Neighborhood grocery store',
      address: shopData.address || 'Local Street, Hyderabad',
      latitude: shopData.latitude ?? 17.4142,
      longitude: shopData.longitude ?? 78.4335,
      phone: shopData.phone || '9848012345',
      is_active: shopData.is_active ?? true,
      isOpen: shopData.isOpen ?? true,
      is_24_hours: shopData.is_24_hours ?? (shopData.opening_time === '24 Hours' || (shopData.opening_time === '00:00:00' && shopData.closing_time === '23:59:59')),
      opening_time: shopData.is_24_hours ? '24 Hours' : (shopData.opening_time || '07:00:00'),
      closing_time: shopData.is_24_hours ? '24 Hours' : (shopData.closing_time || '22:00:00'),
      delivery_radius_km: shopData.delivery_radius_km ?? 5,
      min_order_amount: shopData.min_order_amount ?? 50,
      delivery_fee: shopData.delivery_fee ?? 0,
      created_at: new Date().toISOString(),
      cover_image_url: shopData.cover_image_url || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
      logo_url: shopData.logo_url || 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=200&q=80',
      rating: shopData.rating || 5.0,
      rating_count: shopData.rating_count || 1,
      tags: shopData.tags || ['Groceries', 'Local Store', 'Fast Delivery'],
      ...((shopData as any).password ? { password: (shopData as any).password } : { password: 'store123' }),
    };

    const updatedShops = [newShop, ...get().shops];
    set({ 
      shops: updatedShops, 
      activeShopkeeperShopId: newId 
    });
    AsyncStorage.setItem(STORAGE_KEY_SHOPS, JSON.stringify(updatedShops)).catch(() => {});
    AsyncStorage.setItem(STORAGE_KEY_ACTIVE_SHOPKEEPER_SHOP_ID, newId).catch(() => {});
    realtimeSync.broadcast('SHOP_CREATED', {
      payload: newShop,
      snapshot: { shops: updatedShops, products: get().products, orders: get().orders }
    });
    return newShop;
  },

  updateShop: (id, updates) => {
    const updatedShops = get().shops.map(shop => 
      shop.id === id ? { ...shop, ...updates } : shop
    );
    set({ shops: updatedShops });
    AsyncStorage.setItem(STORAGE_KEY_SHOPS, JSON.stringify(updatedShops)).catch(() => {});
    realtimeSync.broadcast('SHOP_UPDATED', {
      payload: { id, ...updates },
      snapshot: { shops: updatedShops, products: get().products, orders: get().orders }
    });
  },

  deleteShop: (id) => {
    const updatedShops = get().shops.filter(shop => shop.id !== id);
    const updatedProducts = get().products.filter(p => p.shop_id !== id);
    const updatedOrders = get().orders.filter(o => o.shop_id !== id);
    const nextActive = updatedShops.length > 0 ? updatedShops[0].id : null;
    const finalActiveShopId = get().activeShopkeeperShopId === id ? nextActive : get().activeShopkeeperShopId;

    set({ 
      shops: updatedShops, 
      products: updatedProducts, 
      orders: updatedOrders,
      activeShopkeeperShopId: finalActiveShopId 
    });

    AsyncStorage.setItem(STORAGE_KEY_SHOPS, JSON.stringify(updatedShops)).catch(() => {});
    AsyncStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(updatedProducts)).catch(() => {});
    AsyncStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updatedOrders)).catch(() => {});
    if (finalActiveShopId) {
      AsyncStorage.setItem(STORAGE_KEY_ACTIVE_SHOPKEEPER_SHOP_ID, finalActiveShopId).catch(() => {});
    } else {
      AsyncStorage.removeItem(STORAGE_KEY_ACTIVE_SHOPKEEPER_SHOP_ID).catch(() => {});
    }
    realtimeSync.broadcast('SHOP_DELETED', {
      payload: { id },
      snapshot: { shops: updatedShops, products: updatedProducts, orders: updatedOrders }
    });
  },

  toggleShopStatus: (id) => {
    const updatedShops = get().shops.map(shop => {
      if (shop.id === id) {
        const nextStatus = !shop.is_active;
        return { ...shop, is_active: nextStatus, isOpen: nextStatus };
      }
      return shop;
    });
    set({ shops: updatedShops });
    AsyncStorage.setItem(STORAGE_KEY_SHOPS, JSON.stringify(updatedShops)).catch(() => {});
    realtimeSync.broadcast('SHOP_UPDATED', {
      payload: { id },
      snapshot: { shops: updatedShops, products: get().products, orders: get().orders }
    });
  },

  setActiveShopkeeperShopId: (shopId) => {
    set({ activeShopkeeperShopId: shopId });
    if (shopId) {
      AsyncStorage.setItem(STORAGE_KEY_ACTIVE_SHOPKEEPER_SHOP_ID, shopId).catch(() => {});
    } else {
      AsyncStorage.removeItem(STORAGE_KEY_ACTIVE_SHOPKEEPER_SHOP_ID).catch(() => {});
    }
  },

  addProduct: (productData) => {
    const newId = `prod_${Date.now()}`;
    const targetShopId = productData.shop_id || get().activeShopkeeperShopId || (get().shops.length > 0 ? get().shops[0].id : '');
    const newProduct: Product = {
      id: newId,
      shop_id: targetShopId,
      category_id: productData.category_id || 'c1',
      name: productData.name || 'New Item',
      description: productData.description || '',
      image_url: productData.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80',
      price: productData.price ?? 50,
      mrp: productData.mrp ?? (productData.price ? productData.price + 10 : 60),
      unit: productData.unit || 'piece',
      unit_value: productData.unit_value ?? 1,
      stock_quantity: productData.stock_quantity ?? 50,
      is_available: productData.is_available ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedProducts = [newProduct, ...get().products];
    set({ products: updatedProducts });
    AsyncStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(updatedProducts)).catch(() => {});
    realtimeSync.broadcast('PRODUCT_CREATED', {
      payload: newProduct,
      snapshot: { shops: get().shops, products: updatedProducts, orders: get().orders }
    });
    return newProduct;
  },

  updateProduct: (id, updates) => {
    const updatedProducts = get().products.map(p => 
      p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
    );
    set({ products: updatedProducts });
    AsyncStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(updatedProducts)).catch(() => {});
    realtimeSync.broadcast('PRODUCT_UPDATED', {
      payload: { id, ...updates },
      snapshot: { shops: get().shops, products: updatedProducts, orders: get().orders }
    });
  },

  deleteProduct: (id) => {
    const updatedProducts = get().products.filter(p => p.id !== id);
    set({ products: updatedProducts });
    AsyncStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(updatedProducts)).catch(() => {});
    realtimeSync.broadcast('PRODUCT_DELETED', {
      payload: { id },
      snapshot: { shops: get().shops, products: updatedProducts, orders: get().orders }
    });
  },

  toggleProductAvailability: (id) => {
    const updatedProducts = get().products.map(p => 
      p.id === id ? { ...p, is_available: !p.is_available, updated_at: new Date().toISOString() } : p
    );
    set({ products: updatedProducts });
    AsyncStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(updatedProducts)).catch(() => {});
    realtimeSync.broadcast('PRODUCT_UPDATED', {
      payload: { id },
      snapshot: { shops: get().shops, products: updatedProducts, orders: get().orders }
    });
  },

  addOrder: (orderData) => {
    const newId = `ord_${Date.now()}`;
    const newOrder: Order = {
      id: newId,
      customer_id: orderData.customer_id || 'cust_1',
      shop_id: orderData.shop_id || '',
      status: 'pending',
      subtotal: orderData.subtotal ?? 0,
      delivery_fee: orderData.delivery_fee ?? 0,
      total: orderData.total ?? 0,
      delivery_address: orderData.delivery_address || '',
      delivery_lat: orderData.delivery_lat || 17.4142,
      delivery_lng: orderData.delivery_lng || 78.4335,
      payment_method: orderData.payment_method || 'cod',
      payment_status: orderData.payment_status || (orderData.payment_method === 'cod' ? 'pending' : 'paid'),
      payment_id: orderData.payment_id || (orderData.payment_method !== 'cod' ? `TXN_${Date.now().toString(36).toUpperCase()}` : undefined),
      payment_time: orderData.payment_time || (orderData.payment_method !== 'cod' ? new Date().toISOString() : undefined),
      notes: orderData.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: orderData.items || [],
    };

    const updatedOrders = [newOrder, ...get().orders];
    set({ orders: updatedOrders });
    AsyncStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updatedOrders)).catch(() => {});
    realtimeSync.broadcast('ORDER_CREATED', {
      payload: newOrder,
      snapshot: { shops: get().shops, products: get().products, orders: updatedOrders }
    });
    return newOrder;
  },

  updateOrderStatus: (orderId, status) => {
    const updatedOrders = get().orders.map(o => 
      o.id === orderId ? { ...o, status, updated_at: new Date().toISOString() } : o
    );
    set({ orders: updatedOrders });
    AsyncStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updatedOrders)).catch(() => {});
    realtimeSync.broadcast('ORDER_STATUS_UPDATED', {
      payload: { id: orderId, status },
      snapshot: { shops: get().shops, products: get().products, orders: updatedOrders }
    });
  },

  acceptDelivery: (orderId, rider) => {
    const updatedOrders = get().orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'delivery_accepted' as OrderStatus,
          delivery_partner: rider || { id: 'dp_1', name: 'Ravi Kumar (Rider)', phone: '+91 98480 12345' },
          updated_at: new Date().toISOString(),
        };
      }
      return o;
    });
    set({ orders: updatedOrders });
    AsyncStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updatedOrders)).catch(() => {});
    realtimeSync.broadcast('ORDER_STATUS_UPDATED', {
      payload: { id: orderId, status: 'delivery_accepted', rider },
      snapshot: { shops: get().shops, products: get().products, orders: updatedOrders }
    });
  },

  pickupDelivery: (orderId) => {
    const updatedOrders = get().orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'out_for_delivery' as OrderStatus,
          updated_at: new Date().toISOString(),
        };
      }
      return o;
    });
    set({ orders: updatedOrders });
    AsyncStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updatedOrders)).catch(() => {});
    realtimeSync.broadcast('ORDER_STATUS_UPDATED', {
      payload: { id: orderId, status: 'out_for_delivery' },
      snapshot: { shops: get().shops, products: get().products, orders: updatedOrders }
    });
  },

  completeDelivery: (orderId) => {
    const updatedOrders = get().orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'delivered' as OrderStatus,
          payment_status: 'paid' as any,
          updated_at: new Date().toISOString(),
        };
      }
      return o;
    });
    set({ orders: updatedOrders });
    AsyncStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updatedOrders)).catch(() => {});
    realtimeSync.broadcast('ORDER_STATUS_UPDATED', {
      payload: { id: orderId, status: 'delivered', payment_status: 'paid' },
      snapshot: { shops: get().shops, products: get().products, orders: updatedOrders }
    });
  },

  clearAllShops: () => {
    set({ shops: [], products: [], orders: [], activeShopkeeperShopId: null });
    AsyncStorage.multiRemove([
      STORAGE_KEY_SHOPS,
      STORAGE_KEY_PRODUCTS,
      STORAGE_KEY_ORDERS,
      STORAGE_KEY_ACTIVE_SHOPKEEPER_SHOP_ID,
      '@localmart_registered_users',
      '@localmart_current_user',
    ]).catch(() => {});
    realtimeSync.broadcast('DATA_RELOAD', {
      snapshot: { shops: [], products: [], orders: [] }
    });
  },

  seedDemoShops: () => {
    const demoShop1: Shop = {
      id: 'shop_demo_1',
      owner_id: 'owner_demo_1',
      owner_email: 'srisai.kirana@example.com',
      name: 'Sri Sai Kirana & General Store',
      description: 'Fresh Atta, Dal, Oils, Grains & Daily Spices',
      address: 'Road No. 12, Banjara Hills, Hyderabad',
      latitude: 17.4142,
      longitude: 78.4335,
      phone: '9848012345',
      is_active: true,
      isOpen: true,
      opening_time: '06:30:00',
      closing_time: '23:00:00',
      delivery_radius_km: 5,
      min_order_amount: 50,
      delivery_fee: 0,
      created_at: new Date().toISOString(),
      cover_image_url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
      logo_url: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=200&q=80',
      rating: 4.9,
      rating_count: 840,
      tags: ['Kirana', 'Atta & Dal', 'Oils', 'Spices'],
    };

    const demoShop2: Shop = {
      id: 'shop_demo_2',
      owner_id: 'owner_demo_2',
      owner_email: 'farmfresh@example.com',
      name: 'Fresh Farm Veggies & Mandi',
      description: 'Farm fresh leafy vegetables, organic fruits & greens',
      address: 'Near Apollo Cradle, Jubilee Hills, Hyderabad',
      latitude: 17.4258,
      longitude: 78.4112,
      phone: '9848023456',
      is_active: true,
      isOpen: true,
      opening_time: '06:00:00',
      closing_time: '22:00:00',
      delivery_radius_km: 6,
      min_order_amount: 99,
      delivery_fee: 15,
      created_at: new Date().toISOString(),
      cover_image_url: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=600&q=80',
      logo_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80',
      rating: 4.8,
      rating_count: 1250,
      tags: ['Fresh Veggies', 'Organic Fruits', 'Green Leafy'],
    };

    const demoProducts: Product[] = [
      {
        id: 'prod_d1',
        shop_id: 'shop_demo_1',
        category_id: 'c6',
        name: 'Aashirvaad Shudh Chakki Atta',
        price: 275,
        mrp: 310,
        unit: 'kg',
        unit_value: 5,
        stock_quantity: 40,
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80',
      },
      {
        id: 'prod_d2',
        shop_id: 'shop_demo_1',
        category_id: 'c5',
        name: 'Maggi 2-Minute Masala Noodles',
        price: 14,
        mrp: 14,
        unit: 'pack',
        unit_value: 1,
        stock_quantity: 100,
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        image_url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=300&q=80',
      },
      {
        id: 'prod_d3',
        shop_id: 'shop_demo_2',
        category_id: 'c1',
        name: 'Farm Fresh Tomatoes',
        price: 35,
        mrp: 50,
        unit: 'kg',
        unit_value: 1,
        stock_quantity: 60,
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=300&q=80',
      },
      {
        id: 'prod_d4',
        shop_id: 'shop_demo_2',
        category_id: 'c1',
        name: 'Nashik Red Onions',
        price: 28,
        mrp: 40,
        unit: 'kg',
        unit_value: 1,
        stock_quantity: 120,
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        image_url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=300&q=80',
      }
    ];

    set({ shops: [demoShop1, demoShop2], products: demoProducts, activeShopkeeperShopId: 'shop_demo_1' });
    AsyncStorage.setItem(STORAGE_KEY_SHOPS, JSON.stringify([demoShop1, demoShop2])).catch(() => {});
    AsyncStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(demoProducts)).catch(() => {});
  }
}));
