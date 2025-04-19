
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getProduct } from "@/services/productService";
import { Product, ProductSize } from "@/types/supabase-extensions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ItemScannerProps {
  onItemScanned: (product: Product, selectedSize: ProductSize) => void;
}

export function ItemScanner({ onItemScanned }: ItemScannerProps) {
  const [itemNumber, setItemNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleScan = async () => {
    if (!itemNumber.trim()) {
      toast({
        title: "Item number required",
        description: "Please enter an item number to scan",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const product = await getProduct(itemNumber);
      
      if (product) {
        setScannedProduct(product);
        
        // If product has sizes, show the size selection dialog
        if (product.sizes && product.sizes.length > 0) {
          setIsDialogOpen(true);
        } else {
          // Create a default size for products without sizes
          const defaultSize: ProductSize = {
            id: "default",
            productId: product.id,
            size: "One Size",
            stock: product.stock,
            lowStockThreshold: product.lowStockThreshold
          };
          
          onItemScanned(product, defaultSize);
          setItemNumber("");
          toast({
            title: "Product added to cart",
            description: `${product.name} has been added to the cart`,
          });
        }
      } else {
        toast({
          title: "Product not found",
          description: `No product found with item number ${itemNumber}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error scanning product:", error);
      toast({
        title: "Error scanning product",
        description: "There was an error scanning the product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSizeSelect = (size: ProductSize) => {
    if (scannedProduct) {
      onItemScanned(scannedProduct, size);
      setItemNumber("");
      setScannedProduct(null);
      setIsDialogOpen(false);
      
      toast({
        title: "Product added to cart",
        description: `${scannedProduct.name} (${size.size}) has been added to the cart`,
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Scan Item</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="Enter item number..."
              value={itemNumber}
              onChange={(e) => setItemNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleScan}
            disabled={isLoading}
            style={{ backgroundColor: '#ea384c', color: 'white' }}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scanning...
              </>
            ) : (
              "Scan Item"
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Size selection dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Size</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2 p-4">
            {scannedProduct?.sizes?.filter(size => size.stock > 0).map((size) => (
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
          {scannedProduct?.sizes?.filter(size => size.stock > 0).length === 0 && (
            <p className="text-center text-gray-500">No sizes available</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
