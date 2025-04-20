
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/supabase-extensions";
import { useState } from "react";

interface SizeSelectorProps {
  product: Product;
  onSizeSelect: (product: Product) => void;
}

export function SizeSelector({ product, onSizeSelect }: SizeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const hasAvailableSize = product.size && product.stock > 0;

  const handleSizeSelect = () => {
    if (hasAvailableSize) {
      onSizeSelect(product);
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          style={{ borderColor: '#ea384c', color: '#ea384c' }}
          disabled={!hasAvailableSize}
        >
          {hasAvailableSize ? "Select Size" : "Out of Stock"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Size</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2 p-4">
          {hasAvailableSize && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSizeSelect}
            >
              {product.size} ({product.stock})
            </Button>
          )}
        </div>
        {!hasAvailableSize && (
          <p className="text-center text-gray-500">No sizes available</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
