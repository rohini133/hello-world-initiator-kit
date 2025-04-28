
/**
 * Sales report data for a specific date
 */
export interface SalesReport {
  date: string;
  totalSales: number;
  billCount: number;
}

/**
 * Sales report data for a specific category
 */
export interface CategorySales {
  category: string;
  totalSales: number;
}

/**
 * Sales report data for a specific brand
 */
export interface BrandSales {
  brand: string;
  totalSales: number;
}

/**
 * Product sales data for detailed product performance report
 */
export interface ProductSalesData {
  id: string;
  name: string;
  category: string;
  brand: string;
  buyingPrice: number;
  sellingPrice: number;
  quantitySold: number;
  revenue: number;
  profit: number;
}
