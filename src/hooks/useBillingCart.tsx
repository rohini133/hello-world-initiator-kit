
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Product } from "@/types/supabase-extensions";
import { supabase } from "@/integrations/supabase/client";

export interface CartItem {
  product: Product;
  quantity: number;
}

export function useBillingCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  const addToCart = (product: Product) => {
    const existingItemIndex = cartItems.findIndex(
      (item) => item.product.id === product.id
    );

    if (existingItemIndex >= 0) {
      const newCartItems = [...cartItems];
      const currentQuantity = newCartItems[existingItemIndex].quantity;
      
      if (currentQuantity < product.stock) {
        newCartItems[existingItemIndex] = {
          ...newCartItems[existingItemIndex],
          quantity: currentQuantity + 1,
        };
        setCartItems(newCartItems);
        
        toast({
          title: "Item quantity updated",
          description: `${product.name} quantity increased to ${currentQuantity + 1}`,
        });
      } else {
        toast({
          title: "Maximum stock reached",
          description: `Cannot add more ${product.name} as the maximum stock (${product.stock}) has been reached.`,
          variant: "destructive",
        });
      }
    } else {
      setCartItems([...cartItems, { product, quantity: 1 }]);
      
      toast({
        title: "Item added to cart",
        description: `${product.name} has been added to the cart`,
      });
    }
  };

  const updateQuantity = (item: CartItem, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(item);
      return;
    }

    if (newQuantity > item.product.stock) {
      toast({
        title: "Maximum stock reached",
        description: `Cannot add more ${item.product.name} as the maximum stock (${item.product.stock}) has been reached.`,
        variant: "destructive",
      });
      return;
    }

    const newCartItems = cartItems.map((cartItem) =>
      cartItem.product.id === item.product.id
        ? { ...cartItem, quantity: newQuantity }
        : cartItem
    );

    setCartItems(newCartItems);
  };

  const removeItem = (item: CartItem) => {
    const newCartItems = cartItems.filter(
      (cartItem) => cartItem.product.id !== item.product.id
    );
    setCartItems(newCartItems);
    
    toast({
      title: "Item removed",
      description: `${item.product.name} has been removed from the cart`,
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
  
  // Update stock in the database
  const updateStock = async (item: CartItem) => {
    try {
      console.log(`Updating stock for product ${item.product.id}, quantity ${item.quantity}`);
      
      // Update the products table directly
      const { error } = await supabase
        .from('products')
        .update({ 
          stock: item.product.stock - item.quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.product.id);
      
      if (error) {
        console.error("Error updating stock:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error in updateStock:", error);
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
    updateStock
  };
}
