import React, { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { generateSalesReportPDF } from "@/utils/pdfGenerator";
import { generateSalesReportExcel } from "@/utils/excelGenerator";
import { useToast } from "@/components/ui/use-toast";
import { 
  getSalesReportData, 
  getCategorySalesData, 
  getBrandSalesData 
} from "@/services/reportService";
import { 
  SalesReport, 
  CategorySales, 
  BrandSales 
} from "@/types/report";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

export const AdminPanel = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, new Date().getDate()),
    to: new Date(),
  });
  const [salesData, setSalesData] = useState<SalesReport[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySales[]>([]);
  const [brandSales, setBrandSales] = useState<BrandSales[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      if (dateRange?.from && dateRange?.to) {
        try {
          const sales = await getSalesReportData(dateRange.from, dateRange.to);
          setSalesData(sales);

          const categoryData = await getCategorySalesData(dateRange.from, dateRange.to);
          setCategorySales(categoryData);

          const brandData = await getBrandSalesData(dateRange.from, dateRange.to);
          setBrandSales(brandData);
        } catch (error) {
          console.error("Error fetching sales data:", error);
          toast({
            title: "Failed to load sales data",
            description: "There was an error loading the sales data.",
            variant: "destructive",
          });
        }
      }
    };

    fetchData();
  }, [dateRange, toast]);

  const formatCurrency = (value: number) => {
    return `₹${value.toFixed(2)}`;
  };

  const handleGenerateReport = async (format: "pdf" | "excel") => {
    setIsGeneratingReport(true);

    try {
      if (format === "pdf") {
        await generateSalesReportPDF(dateRange, salesData, categorySales, brandSales);
      } else if (format === "excel") {
        await generateSalesReportExcel(dateRange, salesData, categorySales, brandSales);
      }

      toast({
        title: "Report generated",
        description: `Sales report has been generated as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Report generation failed",
        description: "There was a problem generating the report.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <PageContainer title="Admin Panel" subtitle="Generate sales reports and manage store settings">
      <div className="space-y-4">
        {/* Date Range Picker */}
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[300px] justify-start text-left font-normal",
                  !dateRange?.from && "text-muted-foreground"
                )}
              >
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "MMM dd, yyyy")} - {format(dateRange.to, "MMM dd, yyyy")}
                    </>
                  ) : (
                    format(dateRange.from, "MMM dd, yyyy")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                disabled={{ after: new Date() }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Report Generation Buttons */}
        <div className="flex space-x-2">
          <Button onClick={() => handleGenerateReport("pdf")} disabled={isGeneratingReport}>
            Generate PDF Report
          </Button>
          <Button onClick={() => handleGenerateReport("excel")} disabled={isGeneratingReport}>
            Generate Excel Report
          </Button>
        </div>

        {/* Sales Data Table */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Sales Overview</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Total Sales</TableHead>
                  <TableHead>Number of Bills</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.map((sale) => (
                  <TableRow key={sale.date}>
                    <TableCell>{format(new Date(sale.date), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{formatCurrency(sale.totalSales)}</TableCell>
                    <TableCell>{sale.billCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Category Sales Table */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Category Sales</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Total Sales</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categorySales.map((category) => (
                  <TableRow key={category.category}>
                    <TableCell>{category.category}</TableCell>
                    <TableCell>{formatCurrency(category.totalSales)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Brand Sales Table */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Brand Sales</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Total Sales</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brandSales.map((brand) => (
                  <TableRow key={brand.brand}>
                    <TableCell>{brand.brand}</TableCell>
                    <TableCell>{formatCurrency(brand.totalSales)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
