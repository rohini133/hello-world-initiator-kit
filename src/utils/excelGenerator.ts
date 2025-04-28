import { DateRange } from "react-day-picker";
import { SalesReport, CategorySales, BrandSales, ProductSalesData } from "@/types/report";

/**
 * Generates an Excel report for sales data based on provided date range and sales information
 * @param dateRange The selected date range for the report
 * @param salesData Overall sales data
 * @param categorySales Sales data by category
 * @param brandSales Sales data by brand
 * @param productSalesData Detailed product sales data
 * @returns A Blob containing the Excel file
 */
export const generateSalesReportExcel = async (
  dateRange: DateRange | undefined,
  salesData: SalesReport[],
  categorySales: CategorySales[],
  brandSales: BrandSales[],
  productSalesData?: ProductSalesData[]
): Promise<void> => {
  try {
    // Create CSV data starting with headers
    let csvContent = "Sales Report\n";
    csvContent += `Period: ${dateRange?.from ? dateRange.from.toLocaleDateString() : ""} to ${dateRange?.to ? dateRange.to.toLocaleDateString() : ""}\n\n`;
    
    // Sales Overview
    csvContent += "SALES OVERVIEW\n";
    csvContent += "Date,Total Sales,Number of Bills\n";
    salesData.forEach((sale) => {
      csvContent += `${new Date(sale.date).toLocaleDateString()},₹${sale.totalSales.toFixed(2)},${sale.billCount}\n`;
    });
    
    // Add category sales
    csvContent += "\nCATEGORY SALES\n";
    csvContent += "Category,Total Sales\n";
    categorySales.forEach((category) => {
      csvContent += `${category.category},₹${category.totalSales.toFixed(2)}\n`;
    });
    
    // Add brand sales
    csvContent += "\nBRAND SALES\n";
    csvContent += "Brand,Total Sales\n";
    brandSales.forEach((brand) => {
      csvContent += `${brand.brand},₹${brand.totalSales.toFixed(2)}\n`;
    });
    
    // Add product sales data if available
    if (productSalesData && productSalesData.length > 0) {
      csvContent += "\nPRODUCT SALES DETAILS\n";
      csvContent += "Product,Category,Brand,Quantity Sold,Buying Price,Selling Price,Revenue,Profit\n";
      productSalesData.forEach((product) => {
        csvContent += `${product.name},${product.category},${product.brand},${product.quantitySold},₹${product.buyingPrice.toFixed(2)},₹${product.sellingPrice.toFixed(2)},₹${product.revenue.toFixed(2)},₹${product.profit.toFixed(2)}\n`;
      });
    }
    
    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    
    // Create a download link and trigger download
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    
    link.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error("Error generating Excel report:", error);
    throw new Error("Failed to generate Excel report");
  }
};
