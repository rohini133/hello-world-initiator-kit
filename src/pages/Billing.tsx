
import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductSearch } from "@/components/billing/ProductSearch";
import { ShoppingCart } from "@/components/billing/ShoppingCart";
import { useBillingCart } from "@/hooks/useBillingCart";
import { useNavigate } from 'react-router-dom';
import { Product } from "@/types/supabase-extensions";
import { CheckoutDialog } from "@/components/billing/CheckoutDialog";
import { CustomerInfo } from "@/types/supabase-extensions";
import { useToast } from "@/components/ui/use-toast";

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

  return (
    <PageContainer title="Billing" subtitle="Create new bills and process payments">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side - Search */}
        <div className="lg:col-span-5">
          <ProductSearch onAddToCart={handleItemSelect} />
        </div>

        {/* Right Side - Shopping Cart */}
        <div className="lg:col-span-7">
          <ShoppingCart 
            cartItems={cartItems}
            onUpdateCartItem={updateQuantity}
            onRemoveCartItem={removeItem}
            onCheckoutComplete={() => {}}
            onCartClear={clearCart}
            total={calculateTotal()}
          />
        </div>
      </div>
      
      {/* Checkout Dialog */}
      <CheckoutDialog 
        open={isCheckoutOpen}
        onOpenChange={setIsCheckoutOpen}
        bill={null}
      />
    </PageContainer>
  );
};

export default Billing;
