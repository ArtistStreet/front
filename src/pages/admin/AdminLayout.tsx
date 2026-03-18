import { NavLink, Outlet } from "react-router-dom";
import { Home, Package, BarChart2, MessageSquare } from "lucide-react";

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="w-64 bg-white dark:bg-slate-900 shadow-md p-4 flex flex-col sticky top-0 h-screen">
        <h1 className="text-2xl font-black italic uppercase tracking-tighter text-shopee-blue mb-8 px-2">
          Admin Panel
        </h1>
        <nav className="flex flex-col space-y-2 flex-1">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              `flex items-center space-x-3 p-3 rounded-2xl transition-all font-bold ${
                isActive
                  ? "bg-shopee-blue/10 text-shopee-blue shadow-sm"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
              }`
            }
          >
            <BarChart2 size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/admin/products"
            className={({ isActive }) =>
              `flex items-center space-x-3 p-3 rounded-2xl transition-all font-bold ${
                isActive
                  ? "bg-shopee-blue/10 text-shopee-blue shadow-sm"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
              }`
            }
          >
            <Package size={20} />
            <span>Sản phẩm</span>
          </NavLink>
          <NavLink
            to="/admin/reviews"
            className={({ isActive }) =>
              `flex items-center space-x-3 p-3 rounded-2xl transition-all font-bold ${
                isActive
                  ? "bg-shopee-blue/10 text-shopee-blue shadow-sm"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
              }`
            }
          >
            <MessageSquare size={20} />
            <span>Đánh giá</span>
          </NavLink>
        </nav>
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
          <NavLink
            to="/"
            className="flex items-center space-x-3 p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 font-bold transition-all"
          >
            <Home size={20} />
            <span>Về trang chủ</span>
          </NavLink>
        </div>
      </aside>
      <main className="flex-1 p-10 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
