import { DateRange } from "react-day-picker";
import { SalesReport, CategorySales, BrandSales, ProductSalesData } from "@/types/report";
import { BillWithItems } from "@/types/supabase-extensions";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Formats a bill ID/number into a simpler display format
 * @param billId The bill ID to format
 * @returns Formatted bill number
 */
export const formatBillNumber = (billId: string): string => {
  // Extract the last 6 characters of the ID for a simpler display
  return billId ? billId.substring(Math.max(0, billId.length - 6)) : "";
};

/**
 * Generates a PDF receipt for a bill
 * @param bill The bill with items to generate PDF for
 * @returns A Blob containing the PDF file
 */
export const generatePDF = (bill: BillWithItems): Blob => {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Add logo and store information
  doc.setFontSize(20);
  doc.text("Vivaa's", 105, 25, { align: "center" });
  
  doc.setFontSize(10);
  doc.text("Shiv Park Phase 2 Shop No-6-7 Pune Solapur Road", 105, 35, { align: "center" });
  doc.text("Lakshumi Colony Opp. HDFC Bank Near Angle School, Pune - 412307", 105, 40, { align: "center" });
  doc.text("9657171777 | 9765971717", 105, 45, { align: "center" });
  
  // Add bill details
  const simpleBillNumber = formatBillNumber(bill.id);
  const createdAtDate = new Date(bill.createdAt);
  
  doc.text(`Bill #: ${simpleBillNumber}`, 14, 60);
  doc.text(`Date: ${createdAtDate.toLocaleDateString()}`, 14, 65);
  doc.text(`Time: ${createdAtDate.toLocaleTimeString()}`, 14, 70);
  
  // Add customer info if available
  if (bill.customerName || bill.customerPhone || bill.customerEmail) {
    doc.text("Customer Information:", 14, 80);
    doc.text(`Name: ${bill.customerName || "Walk-in Customer"}`, 14, 85);
    doc.text(`Phone: ${bill.customerPhone || "N/A"}`, 14, 90);
    doc.text(`Email: ${bill.customerEmail || "N/A"}`, 14, 95);
  }
  
  // Add items table
  const tableColumn = ["Particulars", "Qty", "MRP", "Amount"];
  const tableRows: any[] = [];
  
  if (bill.items && bill.items.length > 0) {
    bill.items.forEach(item => {
      const prodName = item.productName || (item.product ? item.product.name : "Unknown");
      const price = item.productPrice || (item.product ? item.product.price : 0);
      
      tableRows.push([
        prodName,
        item.quantity.toString(),
        `₹${price.toFixed(2)}`,
        `₹${(price * item.quantity).toFixed(2)}`
      ]);
    });
  } else {
    tableRows.push(["No items in bill", "", "", ""]);
  }
  
  autoTable(doc, {
    startY: 105,
    head: [tableColumn],
    body: tableRows,
  });
  
  // Calculate final Y position after the table
  let finalY = (doc as any).lastAutoTable?.finalY || 150;
  
  // Add totals
  const totalMRP = bill.subtotal || 0;
  const discount = bill.discountAmount || 0;
  const total = bill.total || 0;
  
  finalY += 10;
  doc.text("MRP:", 140, finalY);
  doc.text(`₹${totalMRP.toFixed(2)}`, 180, finalY, { align: "right" });
  
  if (discount > 0) {
    finalY += 5;
    doc.text("Discount:", 140, finalY);
    doc.text(`- ₹${discount.toFixed(2)}`, 180, finalY, { align: "right" });
  }
  
  finalY += 5;
  doc.setFont("helvetica", "bold");
  doc.text("Total Amount:", 140, finalY);
  doc.text(`₹${total.toFixed(2)}`, 180, finalY, { align: "right" });
  doc.setFont("helvetica", "normal");
  
  // Add footer
  finalY += 15;
  doc.text("Thank you for shopping with us", 105, finalY, { align: "center" });
  finalY += 5;
  doc.text("Please visit again..!", 105, finalY, { align: "center" });
  finalY += 5;
  doc.text("*** Have A Nice Day ***", 105, finalY, { align: "center" });
  
  // Return as blob
  return doc.output('blob');
};

/**
 * Generates a PDF report for sales data based on provided date range and sales information
 * @param dateRange The selected date range for the report
 * @param salesData Overall sales data
 * @param categorySales Sales data by category
 * @param brandSales Sales data by brand
 * @param productSalesData Detailed product sales data
 */
export const generateSalesReportPDF = async (
  dateRange: DateRange | undefined,
  salesData: SalesReport[],
  categorySales: CategorySales[],
  brandSales: BrandSales[],
  productSalesData?: ProductSalesData[]
): Promise<void> => {
  try {
    // Create a new PDF document
    const doc = new jsPDF();
    
    // Add title and date range
    doc.setFontSize(20);
    doc.text("Sales Report", 14, 22);
    
    doc.setFontSize(12);
    doc.text(
      `Period: ${dateRange?.from ? dateRange.from.toLocaleDateString() : ""} to ${dateRange?.to ? dateRange.to.toLocaleDateString() : ""}`,
      14,
      32
    );
    
    let yPos = 40;
    
    // Add sales data table if available
    if (salesData.length > 0) {
      doc.setFontSize(16);
      doc.text("Daily Sales Overview", 14, yPos);
      yPos += 10;
      
      autoTable(doc, {
        startY: yPos,
        head: [["Date", "Total Sales", "Number of Bills"]],
        body: salesData.map(sale => [
          new Date(sale.date).toLocaleDateString(),
          `₹${sale.totalSales.toFixed(2)}`,
          sale.billCount.toString()
        ])
      });
      
      yPos = (doc as any).lastAutoTable?.finalY || yPos + 40;
    }
    
    // Add category sales table if available
    if (categorySales.length > 0) {
      yPos += 10;
      doc.setFontSize(16);
      doc.text("Sales by Category", 14, yPos);
      yPos += 10;
      
      autoTable(doc, {
        startY: yPos,
        head: [["Category", "Total Sales"]],
        body: categorySales.map(cat => [
          cat.category,
          `₹${cat.totalSales.toFixed(2)}`
        ])
      });
      
      yPos = (doc as any).lastAutoTable?.finalY || yPos + 40;
    }
    
    // Add brand sales table if available
    if (brandSales.length > 0) {
      yPos += 10;
      doc.setFontSize(16);
      doc.text("Sales by Brand", 14, yPos);
      yPos += 10;
      
      autoTable(doc, {
        startY: yPos,
        head: [["Brand", "Total Sales"]],
        body: brandSales.map(brand => [
          brand.brand,
          `₹${brand.totalSales.toFixed(2)}`
        ])
      });
      
      yPos = (doc as any).lastAutoTable?.finalY || yPos + 40;
    }
    
    // Add product sales data if available
    if (productSalesData && productSalesData.length > 0) {
      // Check if we need a new page
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      } else {
        yPos += 10;
      }
      
      doc.setFontSize(16);
      doc.text("Product Sales Details", 14, yPos);
      yPos += 10;
      
      autoTable(doc, {
        startY: yPos,
        head: [["Product", "Category", "Qty Sold", "Buying Price", "Selling Price", "Revenue", "Profit"]],
        body: productSalesData.map(product => [
          product.name,
          product.category,
          product.quantitySold.toString(),
          `₹${product.buyingPrice.toFixed(2)}`,
          `₹${product.sellingPrice.toFixed(2)}`,
          `₹${product.revenue.toFixed(2)}`,
          `₹${product.profit.toFixed(2)}`
        ])
      });
    }
    
    // Save the PDF
    doc.save(`sales_report_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error("Error generating PDF report:", error);
    throw new Error("Failed to generate PDF report");
  }
};
