export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  addressName: string;
  address: string;
  floorRoom: string;
  district: string;
  province: string;
  postalCode: string;
  lat: number | null;
  lng: number | null;
  isDefault: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  description: string | null;
  image_url: string | null;
  sort_order: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  category_id: string | null;
  images: string[];
  sizes: string[];
  colors: string[];
  stock: number;
  is_featured: boolean;
  is_new: boolean;
  is_sale: boolean;
  rating: number;
  review_count: number;
  sold_count: number;
  care_instructions: string | null;
  size_chart: string | null;
  created_at: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  images: string[];
  is_verified_purchase: boolean;
  created_at: string;
}

export interface CartItem {
  product_id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
  stock: number;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  shipping_address: Address;
  shipping_method: string;
  payment_method: string;
  payment_status: string;
  coupon_code: string | null;
  notes: string | null;
  tracking_number: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  size: string | null;
  color: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  addresses: Address[];
  loyalty_points: number;
  is_admin: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed' | 'shipping';
  value: number;
  min_order: number;
  max_uses: number | null;
  used_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

export interface UserCoupon {
  id: string;
  user_id: string;
  coupon_id: string;
  saved_at: string;
  used_at: string | null;
  order_id: string | null;
  coupon: Coupon;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  created_at: string;
}
