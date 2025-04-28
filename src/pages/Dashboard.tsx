
import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AlertCircle, DollarSign, Package, ShoppingBag, Settings2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { getDashboardStats } from "@/services/dashboardService";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { userRole, checkAuthAccess } = useAuth();
  const navigate = useNavigate();
  
  const canViewSalesStats = checkAuthAccess("sales_statistics");

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const liveStats = await getDashboardStats();
        setStats(liveStats);
      } catch (e: any) {
        setStats(null);
      }
      setLoading(false);
    };

    fetchStats();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value).replace('₹', '₹ ');
  };

  if (loading || !stats) {
    return (
      <PageContainer title="Dashboard">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer 
      title="Dashboard" 
      subtitle={userRole === "admin" 
        ? "Overview of store performance and inventory status" 
        : "Quick access to billing functions"}
    >
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 fade-in">
        {userRole === "admin" && (
          <Button 
            onClick={() => navigate("/admin")} 
            className="bg-purple-600 hover:bg-purple-700 h-auto py-3"
          >
            <Settings2 className="mr-2 h-5 w-5" />
            Admin Panel
          </Button>
        )}
        {userRole === "cashier" && (
          <>
            <Button 
              onClick={() => navigate("/billing")} 
              className="bg-emerald-600 hover:bg-emerald-700 h-auto py-3"
            >
              <DollarSign className="mr-2 h-5 w-5" />
              New Sale
            </Button>
            <Button 
              variant="outline" 
              className="border-gray-300 hover:bg-gray-50 h-auto py-3"
            >
              <Package className="mr-2 h-5 w-5 text-gray-700" />
              View Stock
            </Button>
          </>
        )}
      </div>

      {canViewSalesStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
          <StatsCard
            title="Total Sales"
            value={formatCurrency(stats.totalSales)}
            icon={<DollarSign />}
            trend={{ value: 0, label: "live", direction: "neutral" }}
          />
          <StatsCard
            title="Today's Sales"
            value={formatCurrency(stats.todaySales)}
            icon={<ShoppingBag />}
          />
          <StatsCard
            title="Low Stock Items"
            value={stats.lowStockItems}
            icon={<AlertCircle />}
            trend={{ value: 0, label: "live", direction: "neutral" }}
          />
          <StatsCard
            title="Total Products"
            value={stats.totalProducts || 0}
            icon={<Package />}
            trend={{ value: 0, label: "live", direction: "neutral" }}
          />
        </div>
      )}

      {userRole === "cashier" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 fade-in">
          <StatsCard
            title="Low Stock Items"
            value={stats.lowStockItems}
            icon={<AlertCircle />}
            trend={{ value: 0, label: "live", direction: "neutral" }}
          />
          <StatsCard
            title="Out of Stock Items"
            value={stats.outOfStockItems}
            icon={<Package />}
            trend={{ value: 0, label: "live", direction: "neutral" }}
          />
        </div>
      )}
    </PageContainer>
  );
};

export default Dashboard;
