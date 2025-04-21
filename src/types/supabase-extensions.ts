export interface Product {
  id: string;
  createdAt: string;
  name: string;
  description: string;
  price: number;
  buyingPrice: number;
  quantity: number;
  category: string;
  brand: string;
  imageUrl: string;
  userId: string;
}

export interface BillItem {
  id: string;
  createdAt: string;
  billId: string;
  productId: string;
  quantity: number;
  productPrice: number;
}

export interface BillItemWithProduct extends BillItem {
  product: Product;
}

export interface Bill {
  id: string;
  createdAt: string;
  status: string;
  userId: string;
  discountAmount?: number;
  discountValue?: number;
  discountType?: "percent" | "amount";
  items?: BillItemWithProduct[]; // Optional for extended bill with items
}

export interface BillWithItems extends Bill {
  items: BillItemWithProduct[];
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
}
