import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart as ShoppingCartIcon, SendHorizonal, Loader2, User, Phone, Asterisk, Percent, IndianRupee } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CartItem } from "@/data/models";
import { CartItemRow } from "@/components/billing/CartItemRow";
import { createBill } from "@/services/billService";

interface ShoppingCartProps {
  cartItems: CartItem[];
  onUpdateCartItem: (item: CartItem, newQuantity: number) => void;
  onRemoveCartItem: (item: CartItem) => void;
  onCheckoutComplete: (customerInfo: any, paymentMethod: string, discount: DiscountObj) => void;
  onCartClear: () => void;
  total: number;
  isSubmitting?: boolean;
}

type DiscountType = "percent" | "amount";
interface DiscountObj {
  value: number;
  type: DiscountType;
}

export const ShoppingCart = ({
  cartItems,
  onUpdateCartItem,
  onRemoveCartItem,
  onCheckoutComplete,
  onCartClear,
  total,
  isSubmitting
}: ShoppingCartProps) => {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "digital-wallet">("cash");
  const [isLoading, setIsLoading] = useState(false);

  const [discountType, setDiscountType] = useState<DiscountType>("percent");
  const [discountValue, setDiscountValue] = useState<number>(0);

  const { toast } = useToast();

  let discountAmount = 0;
  if (discountType === "percent") {
    discountAmount = total * (discountValue / 100);
  } else {
    discountAmount = discountValue;
  }
  if (discountAmount < 0) discountAmount = 0;
  if (discountAmount > total) discountAmount = total;

  const finalTotal = total - discountAmount;

  const formattedTotal = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    currencyDisplay: "symbol"
  }).format(finalTotal).replace('₹', '₹ ');

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Empty cart",
        description: "Please add items to the cart before proceeding to checkout.",
        variant: "destructive",
      });
      return;
    }
    if (!customerName.trim()) {
      toast({
        title: "Customer name required",
        description: "Please enter customer's name to continue.",
        variant: "destructive",
      });
      return;
    }
    if (!customerPhone.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter customer's phone number to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      onCheckoutComplete({
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        paymentMethod
      }, paymentMethod, { value: discountValue, type: discountType });

      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setPaymentMethod("cash");
      setDiscountValue(0);
      setDiscountType("percent");

      onCartClear();
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout failed",
        description: "There was an error processing your bill. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle>Shopping Cart</CardTitle>
          <ShoppingCartIcon className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto">
        {cartItems.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCartIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Your cart is empty</p>
            <p className="text-sm text-gray-400 mt-1">
              Scan products or search to add items
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {cartItems.map((item) => (
              <CartItemRow
                key={item.product.id}
                item={item}
                onUpdateQuantity={onUpdateCartItem}
                onRemoveItem={onRemoveCartItem}
              />
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t">
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>
              <span className={discountAmount ? "line-through text-gray-400 mr-2" : ""}>
                {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(total).replace('₹', '₹ ')}
              </span>
              {discountAmount > 0 && (
                <span className="text-primary">{formattedTotal}</span>
              )}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <label className="text-sm font-medium">Discount</label>
            <Select
              value={discountType}
              onValueChange={v => setDiscountType(v as DiscountType)}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">
                  <Percent className="inline w-4 h-4 mr-1" /> %
                </SelectItem>
                <SelectItem value="amount">
                  <IndianRupee className="inline w-4 h-4 mr-1" /> ₹
                </SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              className="w-28"
              placeholder={discountType === "percent" ? "Discount (%)" : "Discount (₹)"}
              value={discountValue === 0 ? "" : discountValue}
              min={0}
              max={discountType === "percent" ? 100 : total}
              onChange={e => {
                const v = Number(e.target.value);
                setDiscountValue(isNaN(v) ? 0 : v);
              }}
            />
          </div>
          {discountAmount > 0 && (
            <div className="text-xs text-green-700 mt-1">
              Special Discount Offer {discountType === "percent" ? `(${discountValue}%)` : ""}: ₹{discountAmount.toFixed(2)}
            </div>
          )}
        </div>
      </CardContent>
      <Separator />
      <CardHeader className="pb-3 pt-4">
        <CardTitle>Customer Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 flex items-center">
            Customer Name 
            <Asterisk className="h-3 w-3 ml-1 text-red-500" />
            <User className="h-4 w-4 ml-1 text-gray-500" />
          </label>
          <Input
            placeholder="Enter customer name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            className={!customerName.trim() ? "border-red-300 focus-visible:ring-red-300" : ""}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 flex items-center">
            Phone Number 
            <Asterisk className="h-3 w-3 ml-1 text-red-500" />
            <Phone className="h-4 w-4 ml-1 text-gray-500" />
          </label>
          <Input
            placeholder="Enter phone number (for WhatsApp receipt)"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            required
            className={!customerPhone.trim() ? "border-red-300 focus-visible:ring-red-300" : ""}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">
            Email (optional)
          </label>
          <Input
            placeholder="Enter email address"
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">
            Payment Method
          </label>
          <Select
            value={paymentMethod}
            onValueChange={(value) => 
              setPaymentMethod(value as "cash" | "card" | "digital-wallet")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent position="popper" className="bg-white">
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Credit/Debit Card</SelectItem>
              <SelectItem value="digital-wallet">Digital Wallet</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button 
          className="w-full" 
          onClick={handleCheckout}
          disabled={isLoading || cartItems.length === 0 || isSubmitting}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <SendHorizonal className="h-4 w-4 mr-2" />
              Complete Checkout
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
