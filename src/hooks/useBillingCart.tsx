
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Product, ProductSize } from "@/types/supabase-extensions";
import { supabase } from "@/integrations/supabase/client";

export interface CartItem {
  product: Product;
  selectedSize: ProductSize;
  quantity: number;
}

export function useBillingCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  const addToCart = (product: Product, selectedSize: ProductSize) => {
    const existingItemIndex = cartItems.findIndex(
      (item) => item.product.id === product.id && item.selectedSize.size === selectedSize.size
    );

    if (existingItemIndex >= 0) {
      const newCartItems = [...cartItems];
      const currentQuantity = newCartItems[existingItemIndex].quantity;
      
      if (currentQuantity < selectedSize.stock) {
        newCartItems[existingItemIndex] = {
          ...newCartItems[existingItemIndex],
          quantity: currentQuantity + 1,
        };
        setCartItems(newCartItems);
        
        toast({
          title: "Item quantity updated",
          description: `${product.name} (${selectedSize.size}) quantity increased to ${currentQuantity + 1}`,
        });
      } else {
        toast({
          title: "Maximum stock reached",
          description: `Cannot add more ${product.name} in size ${selectedSize.size} as the maximum stock (${selectedSize.stock}) has been reached.`,
          variant: "destructive",
        });
      }
    } else {
      setCartItems([...cartItems, { product, selectedSize, quantity: 1 }]);
      
      toast({
        title: "Item added to cart",
        description: `${product.name} (${selectedSize.size}) has been added to the cart`,
      });
    }
  };

  const updateQuantity = (item: CartItem, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(item);
      return;
    }

    if (newQuantity > item.selectedSize.stock) {
      toast({
        title: "Maximum stock reached",
        description: `Cannot add more ${item.product.name} as the maximum stock (${item.selectedSize.stock}) has been reached.`,
        variant: "destructive",
      });
      return;
    }

    const newCartItems = cartItems.map((cartItem) =>
      cartItem.product.id === item.product.id && cartItem.selectedSize.id === item.selectedSize.id
        ? { ...cartItem, quantity: newQuantity }
        : cartItem
    );

    setCartItems(newCartItems);
  };

  const removeItem = (item: CartItem) => {
    const newCartItems = cartItems.filter(
      (cartItem) => !(cartItem.product.id === item.product.id && cartItem.selectedSize.id === item.selectedSize.id)
    );
    setCartItems(newCartItems);
    
    toast({
      title: "Item removed",
      description: `${item.product.name} (${item.selectedSize.size}) has been removed from the cart`,
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const discountedPrice = 
        item.product.price * (1 - item.product.discountPercentage / 100);
      return total + discountedPrice * item.quantity;
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal();
  };
  
  // Update size-based stock in the database
  const updateSizeStock = async (item: CartItem) => {
    try {
      console.log(`Updating stock for product ${item.product.id}, size ${item.selectedSize.id}, quantity ${item.quantity}`);
      
      // Update the product_sizes table
      const { error: sizeError } = await supabase
        .from('product_sizes')
        .update({ 
          stock: item.selectedSize.stock - item.quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.selectedSize.id);
      
      if (sizeError) {
        console.error("Error updating size stock:", sizeError);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error in updateSizeStock:", error);
      return false;
    }
  };

  return {
    cartItems,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    calculateSubtotal,
    calculateTotal,
    updateSizeStock
  };
}
