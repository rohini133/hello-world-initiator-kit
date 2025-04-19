
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Product } from "@/data/models";
import { Loader2, Package } from "lucide-react";

interface CategoryTabsProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  isSyncLoading: boolean;
  filteredProducts: Product[];
  ProductCard: React.ComponentType<any>;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export const CategoryTabs = ({
  categories,
  selectedCategory,
  onCategoryChange,
  isSyncLoading,
  filteredProducts,
  ProductCard,
  onEdit,
  onDelete,
}: CategoryTabsProps) => {
  // Debug logging to see what's coming in for products and their sizes
  console.log('CategoryTabs - filteredProducts:', filteredProducts);
  if (filteredProducts.length > 0) {
    console.log('First product:', filteredProducts[0]);
    console.log('First product sizes:', filteredProducts[0].sizes);
  }

  return (
    <Tabs defaultValue={selectedCategory} value={selectedCategory} onValueChange={onCategoryChange}>
      <TabsList className="mb-4 flex flex-wrap overflow-x-auto">
        {categories.map((category) => (
          <TabsTrigger
            key={category}
            value={category}
            className="capitalize"
          >
            {category}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value={selectedCategory} className="mt-0">
        {isSyncLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No products found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="inventory-grid">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};
