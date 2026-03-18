import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { User, ChevronRight } from "lucide-react";
import type { Product, Review } from "../types";
import {
  Star,
  ShieldCheck,
  Truck,
  ShoppingCart,
  MessageSquare,
  Store,
  Send,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { productApi } from "../utils/api";

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const styleOptions = ["Kiểu 1", "Kiểu 2", "Kiểu 3"];
  const colorOptions = ["Đen", "Trắng", "Xanh dương"];
  const [selectedStyle, setSelectedStyle] = useState(styleOptions[0]);
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);

  useEffect(() => {
    const fetchProductAndReviews = async () => {
      if (!id) return;
      try {
        const [productRes, reviewsRes] = await Promise.all([
          productApi.getById(id),
          productApi.getProductReviews(id),
        ]);

        if (productRes.data) {
          setProduct({
            ...productRes.data,
            id: productRes.data._id || productRes.data.id,
          });
        }
        setReviews(reviewsRes.data);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndReviews();
  }, [id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !id) return;

    setSubmittingReview(true);
    try {
      await productApi.createReview({ rating, comment, productId: id }, token);
      setComment("");
      setRating(5);
      // Refresh reviews
      const reviewsRes = await productApi.getProductReviews(id);
      setReviews(reviewsRes.data);
      alert("Cảm ơn bạn đã đánh giá!");
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || "Lỗi khi gửi đánh giá");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-20 min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-shopee-orange border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500">Đang tải chi tiết sản phẩm...</p>
      </div>
    );
  if (!product)
    return <div className="text-center py-20">Sản phẩm không tồn tại</div>;

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      alert(
        `Đã thêm sản phẩm vào giỏ hàng!\nPhân loại: ${selectedStyle} / ${selectedColor}`
      );
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    navigate("/checkout", {
      state: {
        items: [
          {
            id: String(product.id),
            name: product.name,
            image: product.image,
            price: product.price,
            quantity,
            style: selectedStyle,
            color: selectedColor,
          },
        ],
      },
    });
  };

  const incrementQuantity = () => setQuantity((prev) => prev + 1);
  const decrementQuantity = () =>
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  return (
    <div className="bg-slate-50 dark:bg-slate-950 py-8 min-h-screen">
      <div className="site-container">
        {/* Breadcrumb - iOS style */}
        <div className="flex items-center text-xs text-gray-500 mb-6 px-2">
          <Link to="/" className="hover:text-shopee-blue transition-colors">
            Shopee
          </Link>
          <ChevronRight size={12} className="mx-2" />
          <span className="hover:text-shopee-blue cursor-pointer">
            {product.category}
          </span>
          <ChevronRight size={12} className="mx-2" />
          <span className="text-gray-400 line-clamp-1">{product.name}</span>
        </div>

        <div className="glass-card rounded-[32px] overflow-hidden p-8 flex flex-col md:flex-row gap-10">
          {/* Left: Images */}
          <div className="w-full md:w-[450px] shrink-0">
            <div className="relative pt-[100%] rounded-2xl overflow-hidden bg-gray-100 group">
              <img
                src={product.image}
                alt={product.name}
                className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {product.isMall && (
                <div className="absolute top-4 left-4 bg-shopee-blue text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                  MALL
                </div>
              )}
            </div>

            <div className="grid grid-cols-5 gap-3 mt-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="pt-[100%] relative rounded-xl overflow-hidden border-2 border-transparent hover:border-shopee-blue cursor-pointer transition-all"
                >
                  <img
                    src={`${product.image}?sig=${i}`}
                    alt=""
                    className="absolute top-0 left-0 w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right: Info */}
          <div className="flex-1 flex flex-col">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-4">
                {product.name}
              </h1>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-shopee-blue font-bold border-b border-shopee-blue leading-none">
                    {product.rating}
                  </span>
                  <div className="flex text-shopee-blue">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        fill={s <= product.rating ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                </div>
                <div className="h-4 w-px bg-gray-200"></div>
                <div>
                  <span className="font-bold border-b border-gray-900 leading-none">
                    {reviews.length > 1000
                      ? `${(reviews.length / 1000).toFixed(1)}k`
                      : reviews.length}
                  </span>
                  <span className="text-gray-500 ml-1">Đánh giá</span>
                </div>
                <div className="h-4 w-px bg-gray-200"></div>
                <div>
                  <span className="font-bold">
                    {product.sold > 1000
                      ? `${(product.sold / 1000).toFixed(1)}k`
                      : product.sold}
                  </span>
                  <span className="text-gray-500 ml-1">Đã bán</span>
                </div>
              </div>

              <div className="mt-4 inline-flex items-center gap-2 text-xs text-gray-500">
                <Store size={14} className="text-shopee-blue" />
                <span className="font-semibold text-gray-700">
                  Shoppe Official Store
                </span>
                <span>•</span>
                <Link
                  to="/shop"
                  className="text-shopee-blue font-semibold hover:underline"
                >
                  Xem trang chủ shop
                </Link>
              </div>
            </div>

            <div className="bg-gray-50/50 backdrop-blur-sm rounded-2xl p-6 mb-8">
              <div className="flex items-center gap-4">
                {product.discount > 0 && (
                  <span className="text-sm text-gray-400 line-through">
                    ₫{product.originalPrice.toLocaleString()}
                  </span>
                )}
                <span className="text-4xl font-bold text-shopee-blue">
                  ₫{product.price.toLocaleString()}
                </span>
                {product.discount > 0 && (
                  <span className="bg-shopee-blue/10 text-shopee-blue text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {product.discount}% GIẢM
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-8 flex-1">
              <div className="flex gap-10">
                <span className="w-24 text-gray-500 text-sm">Phân loại</span>
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Kiểu dáng</p>
                    <div className="flex flex-wrap gap-2">
                      {styleOptions.map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setSelectedStyle(style)}
                          className={`px-3 py-1 rounded-2xl border text-xs font-medium transition-all ${
                            selectedStyle === style
                              ? "bg-shopee-blue/10 text-shopee-blue dark:bg-shopee-blue/40 dark:text-white border-shopee-blue shadow-sm shadow-shopee-blue/30"
                              : "bg-white dark:bg-slate-900/60 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Màu sắc</p>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`px-3 py-1 rounded-2xl border text-xs font-medium transition-all ${
                            selectedColor === color
                              ? "bg-shopee-blue/10 text-shopee-blue dark:bg-shopee-blue/40 dark:text-white border-shopee-blue shadow-sm shadow-shopee-blue/30"
                              : "bg-white dark:bg-slate-900/60 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-10">
                <span className="w-24 text-gray-500 text-sm">Vận chuyển</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck size="18" className="text-green-500" />
                    <span className="text-sm font-medium">
                      Miễn phí vận chuyển
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Miễn phí vận chuyển cho đơn hàng trên ₫50.000
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-10">
                <span className="w-24 text-gray-500 text-sm">Số lượng</span>
                <div className="flex items-center gap-4">
                  <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <button
                      onClick={decrementQuantity}
                      className="px-4 py-2 hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="text"
                      value={quantity}
                      readOnly
                      className="w-12 text-center border-x border-gray-100 font-bold"
                    />
                    <button
                      onClick={incrementQuantity}
                      className="px-4 py-2 hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-gray-400">
                    {product.stock ?? 999} sản phẩm có sẵn
                  </span>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-shopee-blue text-shopee-blue font-bold hover:bg-shopee-blue/5 transition-all"
                >
                  <ShoppingCart size={20} />
                  Thêm vào giỏ hàng
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex-1 liquid-btn text-white font-bold rounded-2xl py-4 shadow-lg shadow-shopee-blue/20"
                >
                  Mua ngay
                </button>
              </div>
            </div>

            <div className="mt-10 pt-10 border-t border-gray-100 flex items-center gap-10">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <ShieldCheck size={16} className="text-shopee-blue" />
                <span>Shopee Đảm Bảo</span>
              </div>
              <span className="text-[10px] text-gray-400">
                3 ngày trả hàng / Hoàn tiền
              </span>
            </div>
          </div>
        </div>

        {/* Shop Info & Description (Mock) */}
        <div className="bg-white mt-4 p-4 shadow-sm rounded-sm">
          <h2 className="bg-[#fafafa] p-3 text-lg font-medium uppercase mb-4">
            CHI TIẾT SẢN PHẨM
          </h2>
          <div className="space-y-4 text-sm px-3">
            <div className="flex">
              <span className="text-gray-500 w-32">Danh Mục</span>
              <span className="text-blue-800">{product.category}</span>
            </div>
            <div className="flex">
              <span className="text-gray-500 w-32">Thương hiệu</span>
              <span className="text-blue-800">No Brand</span>
            </div>
            <div className="flex">
              <span className="text-gray-500 w-32">Gửi từ</span>
              <span>Nước Ngoài</span>
            </div>
          </div>

          <h2 className="bg-[#fafafa] p-3 text-lg font-medium uppercase mt-8 mb-4">
            MÔ TẢ SẢN PHẨM
          </h2>
          <div className="px-3 text-sm leading-relaxed whitespace-pre-line">
            {product.name}
            {"\n\n"}✨ THÔNG TIN SẢN PHẨM: - Chất liệu: Vải cao cấp, bền đẹp,
            thoáng khí. - Thiết kế: Hiện đại, trẻ trung, phù hợp với xu hướng. -
            Màu sắc: Đa dạng lựa chọn. - Kích thước: Đầy đủ các size.
            {"\n\n"}
            🔥 ƯU ĐIỂM NỔI BẬT: - Sản phẩm giống hình 100%. - Đường may tỉ mỉ,
            chắc chắn. - Giá cả cạnh tranh nhất thị trường.
            {"\n\n"}
            📦 HƯỚNG DẪN BẢO QUẢN: - Tránh tiếp xúc trực tiếp với hóa chất tẩy
            rửa mạnh. - Giặt tay hoặc giặt máy chế độ nhẹ. - Phơi nơi khô ráo,
            thoáng mát.
            {"\n\n"}
            ⚠️ CHÍNH SÁCH ĐỔI TRẢ: - Hỗ trợ đổi trả trong 7 ngày nếu lỗi do nhà
            sản xuất. - Sản phẩm phải còn nguyên tem mác, chưa qua sử dụng.
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white mt-4 p-8 shadow-sm rounded-sm mb-10">
          <h2 className="text-xl font-bold uppercase mb-8 flex items-center gap-2">
            <MessageSquare size={24} className="text-shopee-blue" />
            Đánh giá sản phẩm
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Review List */}
            <div className="lg:col-span-2 space-y-8">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div
                    key={review._id}
                    className="flex gap-4 border-b border-gray-50 pb-6 last:border-0"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <User size={20} className="text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold">{review.userName}</p>
                      <div className="flex text-yellow-400 my-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={12}
                            fill={s <= review.rating ? "currentColor" : "none"}
                          />
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 mb-2">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-gray-400 italic">
                  Chưa có đánh giá nào cho sản phẩm này.
                </div>
              )}
            </div>

            {/* Review Form */}
            <div className="lg:col-span-1">
              <div className="glass-card p-6 rounded-3xl border-white/40 sticky top-24">
                <h3 className="font-bold mb-4">Viết đánh giá của bạn</h3>
                {user ? (
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Số sao
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setRating(s)}
                            className="transition-transform hover:scale-125"
                          >
                            <Star
                              size={24}
                              className={
                                s <= rating
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-200"
                              }
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Nhận xét
                      </label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm này..."
                        className="w-full bg-gray-50 border border-transparent focus:border-shopee-blue focus:bg-white rounded-2xl p-4 text-sm outline-none transition-all h-32 resize-none"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="w-full liquid-btn text-white font-bold py-3 rounded-2xl shadow-lg shadow-shopee-blue/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                    >
                      {submittingReview ? (
                        "Đang gửi..."
                      ) : (
                        <>
                          Gửi đánh giá <Send size={16} />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-500 mb-4">
                      Vui lòng đăng nhập để viết đánh giá.
                    </p>
                    <Link
                      to="/login"
                      className="text-shopee-blue font-bold hover:underline"
                    >
                      Đăng nhập ngay
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
