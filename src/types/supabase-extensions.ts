
export interface Product {
  id: string;
  createdAt: string;
  updatedAt?: string;
  name: string;
  description: string;
  price: number;
  buyingPrice: number;
  quantity: number;  // Required property
  category: string;
  brand: string;
  imageUrl: string;  // Required property
  userId: string;    // Required property
  
  // Properties also used in the app
  discountPercentage: number;
  stock: number;
  lowStockThreshold: number;
  image: string;
  color?: string;
  size?: string;
  itemNumber: string;
}

export interface BillItem {
  id: string;
  createdAt: string;
  billId: string;
  productId: string;
  quantity: number;
  productPrice: number;
  productName?: string;
  discountPercentage?: number;
  total?: number;
}

export interface BillItemWithProduct extends BillItem {
  product: Product;
}

export interface Bill {
  id: string;
  createdAt: string;
  status: string;
  userId: string;
  
  // Add discount properties to Bill interface
  discountAmount?: number;
  discountValue?: number;
  discountType?: "percent" | "amount";
  
  // Add customer properties
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  
  // Add financial properties
  subtotal?: number;
  tax?: number;
  total?: number;
  paymentMethod?: string;
  
  items?: BillItemWithProduct[]; // Optional for extended bill with items
}

export interface BillWithItems extends Bill {
  items: BillItemWithProduct[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
}

// Add the missing types referenced in data/models.ts
export interface CartItem {
  product: Product;
  quantity: number;
}

export interface DashboardStats {
  totalProducts: number;
  totalSales: number;
  lowStock: number;
  recentSales: any[];
  // Add the missing property
  topSellingProducts: Array<{product: Product; soldCount: number}>;
  todaySales?: number;
  outOfStockItems?: number;
}

export interface ProductWithStatus extends Product {
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
}

export interface Profile {
  id: string;
  fullName?: string;
  role: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CustomerInfo {
  name?: string;
  phone?: string;
  email?: string;
}

export type UserRole = 'admin' | 'manager' | 'cashier';
