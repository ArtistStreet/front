import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { Product } from "../types";

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <Link
      to={`/product/${product.id}`}
      className="glass-card rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-500 group flex flex-col h-full border border-white/50"
    >
      <div className="relative pt-[100%] overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="absolute top-0 left-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        {product.discount > 0 && (
          <div className="absolute top-2 right-2 bg-yellow-400/90 backdrop-blur-md text-shopee-blue text-[10px] font-bold px-2 py-1 rounded-lg">
            -{product.discount}%
          </div>
        )}
        {product.isMall && (
          <div className="absolute top-2 left-2 bg-shopee-blue text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-lg shadow-shopee-blue/20">
            Mall
          </div>
        )}
      </div>

      <div className="p-2 md:p-3 flex flex-col flex-1 bg-white/70 dark:bg-slate-900/60">
        <h3
          className="text-xs md:text-sm text-gray-800 dark:text-slate-100 line-clamp-3 md:line-clamp-2 mb-1.5 md:mb-2 font-medium leading-snug group-hover:text-shopee-blue transition-colors"
          title={product.name}
        >
          {product.name}
        </h3>

        <div className="mt-auto">
          <div className="flex items-center gap-1.5 mb-1.5 md:mb-2">
            <span className="text-shopee-blue font-bold text-sm md:text-base">
              ₫{product.price.toLocaleString()}
            </span>
            {product.discount > 0 && (
              <span className="text-[10px] text-gray-400 line-through">
                ₫{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 border-t border-gray-100/50 dark:border-slate-800 pt-1.5 md:pt-2">
            <div className="flex items-center">
              <Star size={10} className="text-yellow-400 fill-current" />
              <span className="ml-1">{product.rating}</span>
            </div>
            <span>
              Đã bán{" "}
              {product.sold > 1000
                ? `${(product.sold / 1000).toFixed(1)}k`
                : product.sold}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
