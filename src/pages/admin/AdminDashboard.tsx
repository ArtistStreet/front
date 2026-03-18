import { useEffect, useState } from "react";
import { productApi } from "../../utils/api";
import { DollarSign, ShoppingCart, Package } from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    productsSold: [],
  });

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem("token");
      const res = await productApi.getDashboardStats(token || "");
      setStats(res.data);
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="glass-card p-6 rounded-2xl flex items-center space-x-4">
          <div className="bg-shopee-blue/10 p-3 rounded-full">
            <DollarSign className="text-shopee-blue" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Sales
            </p>
            <p className="text-2xl font-bold">
              {stats.totalSales.toLocaleString()} ₫
            </p>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl flex items-center space-x-4">
          <div className="bg-shopee-blue/10 p-3 rounded-full">
            <ShoppingCart className="text-shopee-blue" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Orders
            </p>
            <p className="text-2xl font-bold">{stats.totalOrders}</p>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl flex items-center space-x-4">
          <div className="bg-shopee-blue/10 p-3 rounded-full">
            <Package className="text-shopee-blue" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Products Sold
            </p>
            <p className="text-2xl font-bold">
              {stats.productsSold.reduce(
                (acc: number, p: { totalQuantity: number }) =>
                  acc + p.totalQuantity,
                0
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-xl font-bold mb-4">Top Selling Products</h2>
        <div className="space-y-4">
          {stats.productsSold.map(
            (product: { _id: string; totalQuantity: number }) => (
              <div
                key={product._id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-700/50"
              >
                <p className="font-medium">{product._id}</p>
                <p className="font-bold text-shopee-blue">
                  {product.totalQuantity} sold
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
