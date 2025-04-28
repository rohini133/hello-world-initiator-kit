import React, { useEffect, useState } from 'react';
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, FileText, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { generateSalesReportPDF } from "@/utils/pdfGenerator";
import { generateSalesReportExcel } from "@/utils/excelGenerator";
import { ProductSalesData } from "@/types/report";

export const SalesReport: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [salesData, setSalesData] = useState<ProductSalesData[]>([]);

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      fetchSalesData();
    }
  }, [dateRange]);

  const fetchSalesData = async () => {
    try {
      if (!dateRange?.from || !dateRange?.to) return;

      const { data: bills, error: billsError } = await supabase
        .from('bills')
        .select(`
          *,
          items:bill_items(
            quantity,
            product_price,
            product_id,
            products(
              id,
              name,
              category,
              brand,
              buying_price
            )
          )
        `)
        .eq('status', 'completed')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (billsError) throw billsError;

      const productSalesMap = new Map<string, ProductSalesData>();

      bills?.forEach(bill => {
        bill.items?.forEach((item: any) => {
          if (!item.products) return;
          
          const product = item.products;
          const productId = product.id;
          const quantity = item.quantity || 0;
          const sellingPrice = item.product_price;
          const buyingPrice = product.buying_price || 0;
          const revenue = quantity * sellingPrice;
          const profit = revenue - (quantity * buyingPrice);
          
          if (!productSalesMap.has(productId)) {
            productSalesMap.set(productId, {
              id: productId,
              name: product.name,
              category: product.category || 'Uncategorized',
              brand: product.brand || 'Unknown',
              buyingPrice: buyingPrice,
              sellingPrice: sellingPrice,
              quantitySold: 0,
              revenue: 0,
              profit: 0
            });
          }

          const existingData = productSalesMap.get(productId)!;
          productSalesMap.set(productId, {
            ...existingData,
            quantitySold: existingData.quantitySold + quantity,
            revenue: existingData.revenue + revenue,
            profit: existingData.profit + profit
          });
        });
      });

      setSalesData(Array.from(productSalesMap.values()));
    } catch (error) {
      console.error('Error fetching sales data:', error);
    }
  };

  const handleExportPDF = async () => {
    try {
      await generateSalesReportPDF(dateRange, [], [], [], salesData);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const handleExportExcel = async () => {
    try {
      await generateSalesReportExcel(dateRange, [], [], [], salesData);
    } catch (error) {
      console.error('Error generating Excel:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return `₹${value.toFixed(2)}`;
  };

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Sales Report (Products)</CardTitle>
            <CardDescription>
              Generated on: {new Date().toLocaleDateString()}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" onClick={handleExportPDF}>
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button variant="outline" onClick={handleExportExcel}>
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Qty Sold</TableHead>
                  <TableHead className="text-right">Buying Price</TableHead>
                  <TableHead className="text-right">Selling Price</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell className="text-right">{product.quantitySold}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.buyingPrice)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.sellingPrice)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.revenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.profit)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
