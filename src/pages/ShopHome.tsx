import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { productApi } from "../utils/api";
import type { Product } from "../types";
import ProductCard from "../components/ProductCard";
import { Star, MapPin, Clock } from "lucide-react";

const ShopHome = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const sort = searchParams.get("sort") || "";
        const res = await productApi.getAll({
          sort,
          limit: "24",
          page: "1",
        });
        const data = Array.isArray(res.data) ? res.data : [];
        setProducts(
          data.map((p: Product) => ({
            ...p,
            id: p._id ?? p.id,
          }))
        );
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [searchParams]);

  const activeSort = searchParams.get("sort") || "";
  const updateSort = (value: "" | "sold" | "new") => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set("sort", value);
    else params.delete("sort");
    setSearchParams(params, { replace: true });
  };

  const totalProducts = products.length;
  const totalSold = products.reduce((sum, p) => sum + (p.sold ?? 0), 0);
  const averageRating =
    products.length > 0
      ? Number(
          (
            products.reduce((sum, p) => sum + (p.rating ?? 0), 0) /
            products.length
          ).toFixed(1)
        )
      : 0;

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-10">
      <div className="site-container">
        <div className="mt-4 mb-6 text-xs text-gray-500 flex items-center gap-2">
          <Link to="/" className="hover:text-shopee-blue transition-colors">
            Shopee
          </Link>
          <span>/</span>
          <span className="text-gray-400">Trang chủ shop</span>
        </div>

        <div className="glass-card rounded-[32px] overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-shopee-blue to-shopee-lightBlue/80 h-28"></div>
          <div className="p-5 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-center">
            <div className="-mt-14 md:-mt-16 flex items-center gap-3 md:gap-4">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-slate-800 to-slate-600 flex items-center justify-center text-white text-3xl font-bold">
                S
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                  Shoppe Official Store
                </h1>
                <p className="text-[11px] md:text-xs text-gray-700 dark:text-slate-300 mt-1">
                  Cửa hàng chính thức mô phỏng phong cách Shopee
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] md:text-xs text-gray-700 dark:text-slate-300">
                  <span className="flex items-center gap-1">
                    <Star size={12} className="text-yellow-400" />
                    {averageRating.toFixed(1)} ({totalSold.toLocaleString()}{" "}
                    lượt bán)
                  </span>
                  <span>•</span>
                  <span>{totalProducts} Sản phẩm</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 md:ml-auto">
              <button className="px-4 py-2 rounded-2xl bg-white/95 text-shopee-blue border border-shopee-blue/70 text-xs md:text-sm font-bold shadow-sm shadow-shopee-blue/15 hover:bg-white/70 hover:backdrop-blur-md hover:shadow-[0_0_18px_rgba(14,116,144,0.45)] transition-all">
                Theo dõi
              </button>
              <button className="px-4 py-2 rounded-2xl bg-white/95 text-gray-900 border border-shopee-blue/70 text-xs md:text-sm font-bold shadow-sm shadow-shopee-blue/15 hover:bg-white/70 hover:backdrop-blur-md hover:shadow-[0_0_18px_rgba(14,116,144,0.45)] transition-all">
                Chat
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6">
          <div className="glass-card rounded-3xl p-5 text-sm text-gray-800 dark:text-slate-100 space-y-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Thông tin shop
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <Clock size={14} className="text-shopee-blue" />
              <span>Tham gia: 2024</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <MapPin size={14} className="text-shopee-blue" />
              <span>TP. Hồ Chí Minh, Việt Nam</span>
            </div>
            <div className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed">
              Chuyên cung cấp các sản phẩm công nghệ, thời trang và phụ kiện với
              phong cách giao diện giống Shopee để bạn tham khảo cho đồ án.
            </div>
          </div>

          <div className="glass-card rounded-3xl p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 text-xs md:text-sm font-semibold text-gray-900 dark:text-slate-200">
                <button
                  type="button"
                  onClick={() => updateSort("")}
                  className={`px-3 py-1.5 rounded-full transition-all ${
                    activeSort === ""
                      ? "bg-white/95 text-gray-900 border border-shopee-blue shadow-[0_0_16px_rgba(14,116,144,0.4)]"
                      : "bg-slate-100/90 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-white hover:border-shopee-blue/40 hover:shadow-[0_0_12px_rgba(14,116,144,0.35)]"
                  }`}
                >
                  Tất cả sản phẩm
                </button>
                <button
                  type="button"
                  onClick={() => updateSort("sold")}
                  className={`px-3 py-1.5 rounded-full transition-all ${
                    activeSort === "sold"
                      ? "bg-white/95 text-gray-900 border border-shopee-blue shadow-[0_0_16px_rgba(14,116,144,0.4)]"
                      : "bg-slate-100/90 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-white hover:border-shopee-blue/40 hover:shadow-[0_0_12px_rgba(14,116,144,0.35)]"
                  }`}
                >
                  Bán chạy
                </button>
                <button
                  type="button"
                  onClick={() => updateSort("new")}
                  className={`px-3 py-1.5 rounded-full transition-all ${
                    activeSort === "new"
                      ? "bg-white/95 text-gray-900 border border-shopee-blue shadow-[0_0_16px_rgba(14,116,144,0.4)]"
                      : "bg-slate-100/90 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-white hover:border-shopee-blue/40 hover:shadow-[0_0_12px_rgba(14,116,144,0.35)]"
                  }`}
                >
                  Mới nhất
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {loading ? (
                <div className="col-span-full flex justify-center py-10">
                  <div className="w-8 h-8 border-4 border-shopee-blue border-t-transparent rounded-full animate-spin" />
                </div>
              ) : products.length === 0 ? (
                <div className="col-span-full text-center text-sm text-slate-400 py-16">
                  Chưa có sản phẩm nào trong shop.
                </div>
              ) : (
                products.map((p) => <ProductCard key={p.id} product={p} />)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopHome;
