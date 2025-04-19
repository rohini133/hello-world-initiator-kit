
import { Product, ProductSize } from "@/types/supabase-extensions";
import { getProductStockStatus } from "@/services/productService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SizeSelector } from "./SizeSelector";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface ProductSearchItemProps {
  product: Product;
  onAddToCart: (product: Product, selectedSize: ProductSize) => void;
}

export const ProductSearchItem = ({ product, onAddToCart }: ProductSearchItemProps) => {
  const { toast } = useToast();
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const stockStatus = getProductStockStatus(product);
  
  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    currencyDisplay: 'symbol'
  }).format(product.price).replace('₹', '₹ '); // Add a space after the symbol
  
  const discountedPrice = product.discountPercentage > 0 
    ? product.price * (1 - product.discountPercentage / 100) 
    : null;
    
  const formattedDiscountedPrice = discountedPrice 
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
        currencyDisplay: 'symbol'
      }).format(discountedPrice).replace('₹', '₹ ') // Add a space after the symbol
    : null;

  // Check if product has sizes defined and has at least one size with stock > 0
  const hasAvailableSizes = product.sizes && product.sizes.length > 0 
    ? product.sizes.some(size => size.stock > 0)
    : product.stock > 0;

  const handleAddToCart = () => {
    // For products without sizes, create a dummy size
    if (!product.sizes || product.sizes.length === 0) {
      const dummySize: ProductSize = {
        id: "default",
        size: "One Size",
        stock: product.stock,
        productId: product.id,
        lowStockThreshold: product.lowStockThreshold
      };
      onAddToCart(product, dummySize);
    } else {
      toast({
        title: "Please select a size",
        description: "You need to select a size before adding to cart",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-md mb-2">
      <div className="flex items-center">
        <div className="h-12 w-12 rounded-md overflow-hidden flex-shrink-0">
          <img 
            src={product.image} 
            alt={product.name} 
            className="h-full w-full object-cover"
          />
        </div>
        <div className="ml-4">
          <h3 className="font-medium text-gray-900">{product.name}</h3>
          <div className="text-sm text-gray-500">
            {product.brand} • Item #{product.itemNumber}
          </div>
          <div className="flex items-center mt-1">
            {discountedPrice ? (
              <>
                <span className="font-medium text-gray-900">{formattedDiscountedPrice}</span>
                <span className="ml-2 text-sm line-through text-gray-500">{formattedPrice}</span>
                <Badge variant="destructive" className="ml-2">-{product.discountPercentage}%</Badge>
              </>
            ) : (
              <span className="font-medium text-gray-900">{formattedPrice}</span>
            )}
          </div>
          {product.sizes && product.sizes.length > 0 && (
            <div className="text-sm text-gray-500 mt-1">
              Available Sizes: {product.sizes.filter(size => size.stock > 0).map(size => size.size).join(", ")}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end">
        {stockStatus === "in-stock" && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mb-2">
            In Stock ({product.stock})
          </Badge>
        )}
        {stockStatus === "low-stock" && (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 mb-2">
            Low Stock ({product.stock})
          </Badge>
        )}
        {stockStatus === "out-of-stock" && (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 mb-2">
            Out of Stock
          </Badge>
        )}
        {product.sizes && product.sizes.length > 0 ? (
          <SizeSelector 
            sizes={product.sizes} 
            onSizeSelect={(size) => onAddToCart(product, size)} 
          />
        ) : hasAvailableSizes ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddToCart}
            style={{ borderColor: '#ea384c', color: '#ea384c' }}
          >
            Add to Cart
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={true}
            style={{ borderColor: '#ea384c', color: '#ea384c' }}
          >
            Out of Stock
          </Button>
        )}
      </div>
    </div>
  );
};
