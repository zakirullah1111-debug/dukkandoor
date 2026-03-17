export type UserRole = 'customer' | 'shopkeeper' | 'rider' | 'admin';

export type OrderStatus = 'placed' | 'confirmed' | 'picked_up' | 'delivered' | 'cancelled';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  village: string;
  address: string;
  created_at: string;
}

export interface Shop {
  id: string;
  owner_id: string;
  shop_name: string;
  category: string;
  description: string;
  village: string;
  address: string;
  is_open: boolean;
  logo_url: string;
  created_at: string;
  rating?: number;
  delivery_time?: string;
  business_hours?: any;
}

export interface Product {
  id: string;
  shop_id: string;
  name: string;
  description: string;
  price: number;
  discount_percent: number;
  category: string;
  image_url: string;
  in_stock: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  shop_id: string;
  rider_id: string | null;
  status: OrderStatus;
  total_amount: number;
  delivery_fee: number;
  payment_method: 'cash_on_delivery';
  delivery_address: string;
  created_at: string;
  items?: OrderItem[];
  shop?: Shop;
  rider?: Rider;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_order: number;
  product?: Product;
}

export interface Rider {
  id: string;
  user_id: string;
  is_available: boolean;
  total_earnings: number;
  vehicle_type: string;
  user?: User;
}

export interface Rating {
  id: string;
  order_id: string;
  rated_by: string;
  rider_id: string;
  rating: number;
  comment: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  shop_id: string;
}
