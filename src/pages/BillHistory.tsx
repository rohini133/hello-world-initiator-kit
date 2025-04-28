
import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { BillHistoryList } from "@/components/billing/BillHistoryList";
import { BillReceipt } from "@/components/billing/BillReceipt";
import { Bill } from "@/data/models";
import { getBills, deleteBill } from "@/services/billService";
import { useToast } from "@/components/ui/use-toast";

const BillHistory = () => {
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchBills = async () => {
    setIsLoading(true);
    try {
      const data = await getBills();
      console.log("Fetched bills:", data.length);
      setBills(data);
    } catch (error) {
      console.error("Error loading bills:", error);
      toast({
        title: "Failed to load bills",
        description: "There was an error loading the bill history.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleSelectBill = (bill: Bill) => {
    setSelectedBill(bill);
    setIsReceiptOpen(true);
  };

  const handleDeleteBill = async (billId: string) => {
    try {
      console.log("Permanently deleting bill:", billId);
      
      // Delete bill completely from database
      const success = await deleteBill(billId);
      
      if (!success) {
        throw new Error("Failed to delete bill from database");
      }
      
      console.log("Bill permanently deleted, updating UI");
      
      // Update local state to reflect deletion
      setBills(prevBills => prevBills.filter(bill => bill.id !== billId));
      
      // If the deleted bill was selected, clear selection
      if (selectedBill?.id === billId) {
        setSelectedBill(null);
        setIsReceiptOpen(false);
      }
      
      toast({
        title: "Bill deleted",
        description: `Bill #${billId} has been permanently deleted.`,
      });
    } catch (error) {
      console.error("Error deleting bill:", error);
      toast({
        title: "Delete failed",
        description: "Failed to delete bill. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <PageContainer title="Bill History" subtitle="View and manage past transactions">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BillHistoryList 
            onSelectBill={handleSelectBill} 
            selectedBillId={selectedBill?.id}
            onDeleteBill={handleDeleteBill}
            bills={bills}
            isLoading={isLoading}
          />
        </div>
        <div>
          <BillReceipt 
            bill={selectedBill} 
            open={isReceiptOpen}
            onClose={() => setIsReceiptOpen(false)}
          />
        </div>
      </div>
    </PageContainer>
  );
};

export default BillHistory;
