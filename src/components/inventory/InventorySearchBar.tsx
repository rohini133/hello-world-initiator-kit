
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search } from "lucide-react";

interface InventorySearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddProduct: () => void;
}

export const InventorySearchBar = ({
  searchTerm,
  onSearchChange,
  onAddProduct,
}: InventorySearchBarProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={onAddProduct}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add New Product
        </Button>
      </div>
    </div>
  );
};
