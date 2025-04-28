
import { supabase } from "@/integrations/supabase/client";
import { SalesReport, CategorySales, BrandSales } from "@/types/report";

/**
 * Get sales report data for a specific date range
 * @param startDate Start date for the report
 * @param endDate End date for the report
 * @returns Array of daily sales data
 */
export const getSalesReportData = async (startDate: Date, endDate: Date): Promise<SalesReport[]> => {
  try {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Query to get bills within date range
    const { data: bills, error } = await supabase
      .from('bills')
      .select('id, created_at, total')
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr)
      .eq('status', 'completed');
    
    if (error) {
      throw error;
    }
    
    // Group bills by date
    const salesByDate = new Map<string, { totalSales: number; billCount: number }>();
    
    bills.forEach((bill) => {
      const date = new Date(bill.created_at).toISOString().split('T')[0];
      const currentData = salesByDate.get(date) || { totalSales: 0, billCount: 0 };
      
      salesByDate.set(date, {
        totalSales: currentData.totalSales + (bill.total || 0),
        billCount: currentData.billCount + 1,
      });
    });
    
    // Convert to array of SalesReport objects
    const salesData: SalesReport[] = Array.from(salesByDate).map(([date, data]) => ({
      date,
      totalSales: data.totalSales,
      billCount: data.billCount,
    }));
    
    // Sort by date
    return salesData.sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error("Error fetching sales report data:", error);
    throw new Error("Failed to fetch sales report data");
  }
};

/**
 * Get category sales report data for a specific date range
 * @param startDate Start date for the report
 * @param endDate End date for the report
 * @returns Array of category sales data
 */
export const getCategorySalesData = async (startDate: Date, endDate: Date): Promise<CategorySales[]> => {
  try {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Query to get bill items with product details for bills within date range
    const { data, error } = await supabase
      .from('bills')
      .select(`
        id,
        created_at,
        bill_items (
          quantity,
          product_price,
          products (
            id,
            name,
            category
          )
        )
      `)
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr)
      .eq('status', 'completed');
    
    if (error) {
      throw error;
    }
    
    // Group sales by category
    const salesByCategory = new Map<string, number>();
    
    data.forEach((bill) => {
      bill.bill_items?.forEach((item: any) => {
        if (!item.products) return;
        
        const category = item.products.category || 'Uncategorized';
        const itemTotal = item.quantity * item.product_price;
        
        const currentTotal = salesByCategory.get(category) || 0;
        salesByCategory.set(category, currentTotal + itemTotal);
      });
    });
    
    // Convert to array of CategorySales objects
    const categoryData: CategorySales[] = Array.from(salesByCategory).map(([category, totalSales]) => ({
      category,
      totalSales,
    }));
    
    // Sort by total sales (highest first)
    return categoryData.sort((a, b) => b.totalSales - a.totalSales);
  } catch (error) {
    console.error("Error fetching category sales data:", error);
    throw new Error("Failed to fetch category sales data");
  }
};

/**
 * Get brand sales report data for a specific date range
 * @param startDate Start date for the report
 * @param endDate End date for the report
 * @returns Array of brand sales data
 */
export const getBrandSalesData = async (startDate: Date, endDate: Date): Promise<BrandSales[]> => {
  try {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Query to get bill items with product details for bills within date range
    const { data, error } = await supabase
      .from('bills')
      .select(`
        id,
        created_at,
        bill_items (
          quantity,
          product_price,
          products (
            id,
            name,
            brand
          )
        )
      `)
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr)
      .eq('status', 'completed');
    
    if (error) {
      throw error;
    }
    
    // Group sales by brand
    const salesByBrand = new Map<string, number>();
    
    data.forEach((bill) => {
      bill.bill_items?.forEach((item: any) => {
        if (!item.products) return;
        
        const brand = item.products.brand || 'Unknown';
        const itemTotal = item.quantity * item.product_price;
        
        const currentTotal = salesByBrand.get(brand) || 0;
        salesByBrand.set(brand, currentTotal + itemTotal);
      });
    });
    
    // Convert to array of BrandSales objects
    const brandData: BrandSales[] = Array.from(salesByBrand).map(([brand, totalSales]) => ({
      brand,
      totalSales,
    }));
    
    // Sort by total sales (highest first)
    return brandData.sort((a, b) => b.totalSales - a.totalSales);
  } catch (error) {
    console.error("Error fetching brand sales data:", error);
    throw new Error("Failed to fetch brand sales data");
  }
};
