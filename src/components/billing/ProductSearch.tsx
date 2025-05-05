
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Product } from "@/types/supabase-extensions";
import { getProducts } from "@/services/productService";
import { ProductSearchItem } from "@/components/billing/ProductSearchItem";
import { useQuery } from "@tanstack/react-query";

interface ProductSearchProps {
  onAddToCart: (product: Product) => void;
}

export const ProductSearch = ({ onAddToCart }: ProductSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  
  const { data: allProducts = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
    staleTime: 60000, // 1 minute cache
    refetchOnWindowFocus: false,
  });

  // Enhanced search function that performs more robust matching
  const filterProducts = (products: Product[], term: string) => {
    if (!term.trim()) return [];
    
    // Normalize the search term: lowercase and trim
    const normalizedTerm = term.toLowerCase().trim();
    // Split the search term into keywords for partial matching
    const keywords = normalizedTerm.split(/\s+/).filter(k => k.length > 0);
    
    return products.filter((product) => {
      // Check various product fields with case-insensitive matching
      const productName = product.name?.toLowerCase() || '';
      const productBrand = product.brand?.toLowerCase() || '';
      const productItemNumber = product.itemNumber?.toLowerCase() || '';
      const productColor = product.color?.toLowerCase() || '';
      
      // Check if ALL keywords match at least one field
      return keywords.every(keyword => 
        productName.includes(keyword) || 
        productBrand.includes(keyword) || 
        productItemNumber.includes(keyword) || 
        productColor.includes(keyword) ||
        // Check sizes if available
        (product.sizes_stock && Object.keys(product.sizes_stock)
          .some(size => size.toLowerCase().includes(keyword)))
      );
    });
  };

  const filteredProducts = filterProducts(allProducts, searchTerm);

  const handleSearch = () => {
    if (searchTerm.trim() === "") {
      toast({
        title: "Please enter a search term",
        description: "Enter a product name, brand, item number, or color to search",
      });
    }
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Product Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search by name, brand, item number, or color..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isLoading}
              style={{ backgroundColor: '#ea384c', color: 'white' }}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Search Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {isLoading ? (
              <p className="text-center text-gray-500 py-8">
                Loading products...
              </p>
            ) : filteredProducts.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                {searchTerm.trim() === ""
                  ? "Enter search terms above to find products"
                  : "No products found matching your search."}
              </p>
            ) : (
              filteredProducts.map((product) => (
                <ProductSearchItem
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};
