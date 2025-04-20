
import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProductSearch } from "@/components/billing/ProductSearch";
import { ShoppingCart } from "@/components/billing/ShoppingCart";
import { useBillingCart } from "@/hooks/useBillingCart";
import { useNavigate } from 'react-router-dom';
import { Product } from "@/types/supabase-extensions";
import { CheckoutDialog } from "@/components/billing/CheckoutDialog";
import { CustomerInfo } from "@/types/supabase-extensions";
import { useToast } from "@/components/ui/use-toast";
import { createBill } from "@/services/billService";
import { BillWithItems } from "@/data/models";

const Billing = () => {
  const [showSearch, setShowSearch] = useState(true);
  const { 
    cartItems, 
    addToCart, 
    updateQuantity, 
    removeItem, 
    clearCart, 
    calculateSubtotal, 
    calculateTotal, 
    updateStock 
  } = useBillingCart();
  const navigate = useNavigate();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({});
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentBill, setCurrentBill] = useState<BillWithItems | null>(null);
  const { toast } = useToast();

  const handleItemSelect = (product: Product) => {
    if (product.stock > 0) {
      addToCart(product);
    } else {
      toast({
        title: "Out of stock",
        description: `${product.name} is currently out of stock.`,
        variant: "destructive",
      });
    }
  };

  const handleCheckout = async (customerData: CustomerInfo, paymentMethod: string) => {
    if (cartItems.length === 0) {
      toast({
        title: "Empty cart",
        description: "Please add items to the cart before proceeding to checkout.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the bill with its items
      const billWithItems = await createBill({
        cartItems,
        subtotal: calculateSubtotal(),
        tax: 0,
        total: calculateTotal(),
        customerName: customerData.name,
        customerPhone: customerData.phone,
        customerEmail: customerData.email,
        paymentMethod,
        status: 'completed'
      });

      console.log("Created bill with items:", billWithItems);

      // Update stock for each item
      for (const item of cartItems) {
        await updateStock(item);
      }

      setCurrentBill(billWithItems);
      setIsCheckoutOpen(true);
      clearCart();

    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout failed",
        description: "There was an error processing your bill. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer title="Billing" subtitle="Create new bills and process payments">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <ProductSearch onAddToCart={handleItemSelect} />
        </div>
        <div className="lg:col-span-7">
          <ShoppingCart 
            cartItems={cartItems}
            onUpdateCartItem={updateQuantity}
            onRemoveCartItem={removeItem}
            onCheckoutComplete={handleCheckout}
            onCartClear={clearCart}
            total={calculateTotal()}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
      
      <CheckoutDialog 
        open={isCheckoutOpen}
        onOpenChange={setIsCheckoutOpen}
        bill={currentBill}
      />
    </PageContainer>
  );
};

export default Billing;
