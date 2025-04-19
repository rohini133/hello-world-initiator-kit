
import { Product } from "@/types/supabase-extensions";
import { ProductStockStatus } from "./types";

/**
 * Determine product stock status based on current stock and threshold
 */
export const getProductStockStatus = (product: Product): ProductStockStatus => {
  // For products with sizes, check if any sizes have stock
  if (product.sizes && product.sizes.length > 0) {
    const totalSizeStock = product.sizes.reduce((total, size) => total + size.stock, 0);
    if (totalSizeStock === 0) {
      return "out-of-stock";
    }
    const totalLowThreshold = product.sizes[0]?.lowStockThreshold || product.lowStockThreshold;
    if (totalSizeStock <= totalLowThreshold) {
      return "low-stock";
    }
    return "in-stock";
  }

  // For products without sizes, use the main product stock
  if (product.stock === 0) {
    return "out-of-stock";
  }
  if (product.stock <= product.lowStockThreshold) {
    return "low-stock";
  }
  return "in-stock";
};

/**
 * Map database product fields to our Product type
 */
export const mapDatabaseProductToProduct = (item: any): Product => {
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    stock: item.stock,
    brand: item.brand,
    category: item.category,
    itemNumber: item.item_number,
    discountPercentage: item.discount_percentage,
    lowStockThreshold: item.low_stock_threshold,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    buyingPrice: item.buying_price || 0,
    // Handle potentially null fields
    image: item.image || '',
    description: item.description || '',
    color: item.color || null,
    sizes: []  // This would need to be populated separately from product_sizes table
  };
};

/**
 * Map product from database format to application format
 */
export function mapProductToDatabaseProduct(product: Product) {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description || '',
    price: product.price,
    buying_price: product.buyingPrice,
    discount_percentage: product.discountPercentage,
    stock: product.stock,
    low_stock_threshold: product.lowStockThreshold,
    image: product.image || '',
    color: product.color,
    item_number: product.itemNumber,
    updated_at: new Date().toISOString()
  };
}
