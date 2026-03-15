import { Shop, Product, Order, Rider, User } from '@/types';

export const mockShops: Shop[] = [
  {
    id: 'shop-1',
    owner_id: 'user-shop-1',
    shop_name: 'Al-Baraka General Store',
    category: 'General Store',
    description: 'Your one-stop shop for daily essentials',
    village: 'Chak 45',
    address: 'Main Bazaar, Chak 45',
    is_open: true,
    logo_url: '',
    created_at: '2024-01-01',
    rating: 4.5,
    delivery_time: '20-30 min',
  },
  {
    id: 'shop-2',
    owner_id: 'user-shop-2',
    shop_name: 'Fresh Bake Corner',
    category: 'Bakery',
    description: 'Freshly baked goods every morning',
    village: 'Chak 45',
    address: 'Near Masjid, Chak 45',
    is_open: true,
    logo_url: '',
    created_at: '2024-01-05',
    rating: 4.8,
    delivery_time: '15-25 min',
  },
  {
    id: 'shop-3',
    owner_id: 'user-shop-3',
    shop_name: 'Village Pharmacy',
    category: 'Medicine',
    description: 'All medicines and health products',
    village: 'Chak 45',
    address: 'Hospital Road, Chak 45',
    is_open: false,
    logo_url: '',
    created_at: '2024-01-10',
    rating: 4.2,
    delivery_time: '25-35 min',
  },
];

export const mockProducts: Product[] = [
  // Al-Baraka General Store
  { id: 'p1', shop_id: 'shop-1', name: 'Basmati Rice 5kg', description: 'Premium quality basmati rice', price: 850, discount_percent: 10, category: 'Grocery', image_url: '', in_stock: true, created_at: '2024-01-01' },
  { id: 'p2', shop_id: 'shop-1', name: 'Cooking Oil 1L', description: 'Pure sunflower cooking oil', price: 450, discount_percent: 0, category: 'Grocery', image_url: '', in_stock: true, created_at: '2024-01-01' },
  { id: 'p3', shop_id: 'shop-1', name: 'Sugar 1kg', description: 'Refined white sugar', price: 180, discount_percent: 5, category: 'Grocery', image_url: '', in_stock: true, created_at: '2024-01-01' },
  { id: 'p4', shop_id: 'shop-1', name: 'Tea 200g', description: 'Premium black tea leaves', price: 350, discount_percent: 0, category: 'Grocery', image_url: '', in_stock: true, created_at: '2024-01-01' },
  { id: 'p5', shop_id: 'shop-1', name: 'Daal Chana 1kg', description: 'Split chickpea lentils', price: 280, discount_percent: 15, category: 'Grocery', image_url: '', in_stock: true, created_at: '2024-01-01' },
  { id: 'p6', shop_id: 'shop-1', name: 'Milk Pack 1L', description: 'Full cream UHT milk', price: 220, discount_percent: 0, category: 'Dairy', image_url: '', in_stock: false, created_at: '2024-01-01' },

  // Fresh Bake Corner
  { id: 'p7', shop_id: 'shop-2', name: 'Fresh Naan (5 pcs)', description: 'Soft tandoori naan bread', price: 100, discount_percent: 0, category: 'Bread', image_url: '', in_stock: true, created_at: '2024-01-05' },
  { id: 'p8', shop_id: 'shop-2', name: 'Cake Rusk 500g', description: 'Crunchy sweet cake rusk', price: 250, discount_percent: 20, category: 'Bakery', image_url: '', in_stock: true, created_at: '2024-01-05' },
  { id: 'p9', shop_id: 'shop-2', name: 'Cream Roll', description: 'Fresh cream filled roll', price: 80, discount_percent: 0, category: 'Bakery', image_url: '', in_stock: true, created_at: '2024-01-05' },
  { id: 'p10', shop_id: 'shop-2', name: 'Fruit Cake', description: 'Rich fruit cake slice', price: 150, discount_percent: 10, category: 'Bakery', image_url: '', in_stock: true, created_at: '2024-01-05' },
  { id: 'p11', shop_id: 'shop-2', name: 'Biscuits Pack', description: 'Assorted biscuit pack', price: 120, discount_percent: 0, category: 'Snacks', image_url: '', in_stock: true, created_at: '2024-01-05' },

  // Village Pharmacy
  { id: 'p12', shop_id: 'shop-3', name: 'Panadol (10 tabs)', description: 'Pain relief tablets', price: 50, discount_percent: 0, category: 'Medicine', image_url: '', in_stock: true, created_at: '2024-01-10' },
  { id: 'p13', shop_id: 'shop-3', name: 'Disprin (10 tabs)', description: 'Aspirin tablets', price: 40, discount_percent: 0, category: 'Medicine', image_url: '', in_stock: true, created_at: '2024-01-10' },
  { id: 'p14', shop_id: 'shop-3', name: 'Cough Syrup', description: 'Herbal cough syrup 100ml', price: 180, discount_percent: 5, category: 'Medicine', image_url: '', in_stock: true, created_at: '2024-01-10' },
  { id: 'p15', shop_id: 'shop-3', name: 'Band-Aid Pack', description: 'Adhesive bandages 20 pcs', price: 120, discount_percent: 0, category: 'First Aid', image_url: '', in_stock: true, created_at: '2024-01-10' },
  { id: 'p16', shop_id: 'shop-3', name: 'Dettol 250ml', description: 'Antiseptic liquid', price: 350, discount_percent: 10, category: 'Hygiene', image_url: '', in_stock: true, created_at: '2024-01-10' },
];

export const mockRiders: (Rider & { user: User })[] = [
  {
    id: 'rider-1',
    user_id: 'user-rider-1',
    is_available: true,
    total_earnings: 12500,
    vehicle_type: 'Motorcycle',
    user: { id: 'user-rider-1', name: 'Ahmed Khan', phone: '03001234567', role: 'rider', village: 'Chak 45', address: 'Street 3, Chak 45', created_at: '2024-01-01' },
  },
  {
    id: 'rider-2',
    user_id: 'user-rider-2',
    is_available: false,
    total_earnings: 8700,
    vehicle_type: 'Bicycle',
    user: { id: 'user-rider-2', name: 'Bilal Hussain', phone: '03009876543', role: 'rider', village: 'Chak 45', address: 'Street 7, Chak 45', created_at: '2024-01-03' },
  },
];

export const mockOrders: Order[] = [
  {
    id: 'order-1',
    customer_id: 'user-customer-1',
    shop_id: 'shop-1',
    rider_id: 'rider-1',
    status: 'delivered',
    total_amount: 1280,
    delivery_fee: 50,
    payment_method: 'cash_on_delivery',
    delivery_address: 'House 12, Street 5, Chak 45',
    created_at: '2024-03-10T10:30:00',
    shop: mockShops[0],
    items: [
      { id: 'oi-1', order_id: 'order-1', product_id: 'p1', quantity: 1, price_at_order: 765, product: mockProducts[0] },
      { id: 'oi-2', order_id: 'order-1', product_id: 'p2', quantity: 1, price_at_order: 450, product: mockProducts[1] },
    ],
  },
];

export const shopCategories = [
  { name: 'Grocery', icon: '🛒' },
  { name: 'Bakery', icon: '🍞' },
  { name: 'Medicine', icon: '💊' },
  { name: 'Vegetables', icon: '🥬' },
  { name: 'Electronics', icon: '📱' },
  { name: 'General Store', icon: '🏪' },
];
