
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProductSize } from "@/types/supabase-extensions";
import { useState } from "react";

interface SizeSelectorProps {
  sizes: ProductSize[];
  onSizeSelect: (size: ProductSize) => void;
}

export function SizeSelector({ sizes, onSizeSelect }: SizeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const availableSizes = sizes.filter(size => size.stock > 0);

  const handleSizeSelect = (size: ProductSize) => {
    onSizeSelect(size);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          style={{ borderColor: '#ea384c', color: '#ea384c' }}
          disabled={availableSizes.length === 0}
        >
          {availableSizes.length > 0 ? "Select Size" : "Out of Stock"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Size</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2 p-4">
          {availableSizes.map((size) => (
            <Button
              key={size.id}
              variant="outline"
              className="w-full"
              onClick={() => handleSizeSelect(size)}
            >
              {size.size} ({size.stock})
            </Button>
          ))}
        </div>
        {availableSizes.length === 0 && (
          <p className="text-center text-gray-500">No sizes available</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
