import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProductCard } from "@/components/inventory/ProductCard";
import { Product } from "@/data/models";
import { updateProduct, deleteProduct } from "@/services/productService";
import { toast } from "@/components/ui/use-toast";
import { useProductsSync } from "@/hooks/useProductsSync";
import { DebugPanel } from "@/components/admin/DebugPanel";
import { InventorySearchBar } from "@/components/inventory/InventorySearchBar";
import { CategoryTabs } from "@/components/inventory/CategoryTabs";
import { ProductDialogs } from "@/components/inventory/ProductDialogs";

const Inventory = () => {
  const { 
    products: syncedProducts, 
    isLoading: isSyncLoading, 
    error: syncError, 
    isAuthenticated,
    refetchProducts
  } = useProductsSync();

  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);

  useEffect(() => {
    console.log("Inventory - Raw products:", syncedProducts);
    if (syncedProducts.length > 0) {
      console.log("Sample product:", syncedProducts[0]);
      console.log("Sample product sizes:", syncedProducts[0].sizes);
    }
    
    filterProducts();
  }, [syncedProducts, searchTerm, categoryFilter]);

  useEffect(() => {
    if (syncError) {
      toast({
        title: "Synchronization Error",
        description: syncError,
        variant: "destructive",
      });
    }
  }, [syncError]);

  const filterProducts = () => {
    let filtered = [...syncedProducts];

    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (product) => product.category.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    if (searchTerm.trim() !== "") {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(search) ||
          product.brand.toLowerCase().includes(search) ||
          product.itemNumber.toLowerCase().includes(search)
      );
    }

    setFilteredProducts(filtered);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    try {
      await updateProduct(editingProduct);
      setIsEditDialogOpen(false);
      
      toast({
        title: "Product updated",
        description: `${editingProduct.name} has been updated successfully.`,
      });
      
      refetchProducts();
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;

    try {
      await deleteProduct(deletingProduct.id);
      setFilteredProducts(filtered => filtered.filter(p => p.id !== deletingProduct.id));
      setIsDeleteDialogOpen(false);
      
      toast({
        title: "Product deleted",
        description: `${deletingProduct.name} has been deleted successfully.`,
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getUniqueCategories = () => {
    const categories = syncedProducts.map((product) => product.category);
    return ["all", ...new Set(categories)];
  };

  const handleAddProductSuccess = () => {
    setIsAddProductDialogOpen(false);
    toast({
      title: "Product Added",
      description: "The product has been successfully added to inventory.",
    });
    refetchProducts();
  };

  const handleRefresh = () => {
    refetchProducts();
    toast({
      title: "Refreshing inventory",
      description: "Fetching latest product data from the database...",
    });
  };

  return (
    <PageContainer title="Vivaas Inventory" subtitle="Manage your product inventory">
      <div className="mb-6">
        <InventorySearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddProduct={() => setIsAddProductDialogOpen(true)}
          onRefresh={handleRefresh}
        />
        
        {isDebugMode && (
          <div className="mb-6">
            <DebugPanel />
          </div>
        )}

        {isAuthenticated === false && (
          <div className="p-4 mb-6 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-amber-800">
              <strong>Authentication Notice:</strong> You are not currently authenticated with the database.
              Products will be loaded from local data and changes may not persist.
              Please log out and log back in to reauthenticate.
            </p>
          </div>
        )}

        <CategoryTabs
          categories={getUniqueCategories()}
          selectedCategory={categoryFilter}
          onCategoryChange={setCategoryFilter}
          isSyncLoading={isSyncLoading}
          filteredProducts={filteredProducts}
          ProductCard={ProductCard}
          onEdit={(product) => {
            setEditingProduct(product);
            setIsEditDialogOpen(true);
          }}
          onDelete={(product) => {
            setDeletingProduct(product);
            setIsDeleteDialogOpen(true);
          }}
        />
      </div>

      <ProductDialogs
        isEditDialogOpen={isEditDialogOpen}
        setIsEditDialogOpen={setIsEditDialogOpen}
        isAddProductDialogOpen={isAddProductDialogOpen}
        setIsAddProductDialogOpen={setIsAddProductDialogOpen}
        isDeleteDialogOpen={isDeleteDialogOpen}
        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
        editingProduct={editingProduct}
        deletingProduct={deletingProduct}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
        onAddProductSuccess={handleAddProductSuccess}
      />
    </PageContainer>
  );
};

export default Inventory;
