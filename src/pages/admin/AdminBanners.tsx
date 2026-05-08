import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { productApi } from "../../utils/api";
import {
  Image,
  Plus,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  Upload,
  X,
  GripVertical,
  Calendar,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Banner {
  _id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  position: "main" | "side-top" | "side-bottom";
  isActive: boolean;
  order: number;
  startDate?: string;
  endDate?: string;
  createdBy?: { name: string; email: string };
  createdAt: string;
}

const POSITION_LABELS: Record<string, string> = {
  main: "Banner chính (Slider)",
  "side-top": "Banner phụ trên",
  "side-bottom": "Banner phụ dưới",
};

const POSITION_COLORS: Record<string, string> = {
  main: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "side-top": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "side-bottom": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

const AdminBanners = () => {
  const { token, isAdmin } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    image: "",
    link: "",
    position: "main" as "main" | "side-top" | "side-bottom",
    isActive: true,
    order: 0,
    startDate: "",
    endDate: "",
  });

  const fetchBanners = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await productApi.getAllBanners(token);
      setBanners(res.data || []);
    } catch (err) {
      console.error("Lỗi tải banners:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      image: "",
      link: "",
      position: "main",
      isActive: true,
      order: 0,
      startDate: "",
      endDate: "",
    });
    setEditingBanner(null);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || "",
      image: banner.image,
      link: banner.link || "",
      position: banner.position,
      isActive: banner.isActive,
      order: banner.order,
      startDate: banner.startDate ? banner.startDate.split("T")[0] : "",
      endDate: banner.endDate ? banner.endDate.split("T")[0] : "",
    });
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !token) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", e.target.files[0]);
      const res = await productApi.uploadBannerImage(fd, token);
      setFormData((prev) => ({ ...prev, image: res.data.imageUrl }));
    } catch (err) {
      console.error("Lỗi upload ảnh:", err);
      alert("Lỗi tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !formData.title || !formData.image) return;
    setSaving(true);
    try {
      const payload = {
        ...formData,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      };

      if (editingBanner) {
        await productApi.updateBanner(editingBanner._id, payload, token);
      } else {
        await productApi.createBanner(payload, token);
      }
      await fetchBanners();
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error("Lỗi lưu banner:", err);
      alert("Lỗi khi lưu banner. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm("Bạn có chắc chắn muốn xóa banner này?")) return;
    try {
      await productApi.deleteBanner(id, token);
      await fetchBanners();
    } catch (err) {
      console.error("Lỗi xóa banner:", err);
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    if (!token) return;
    try {
      await productApi.updateBanner(banner._id, { isActive: !banner.isActive }, token);
      await fetchBanners();
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái:", err);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Bạn không có quyền truy cập trang này.</p>
      </div>
    );
  }

  const mainBanners = banners.filter((b) => b.position === "main" && b.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 dark:text-white">
            Quản Lý Quảng Cáo
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý banner quảng cáo hiển thị trên trang chủ giống Shopee
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-shopbee-blue text-white rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-200 dark:shadow-blue-900/30"
        >
          <Plus size={18} />
          Thêm Banner
        </button>
      </div>

      {/* Preview Section */}
      {mainBanners.length > 0 && (
        <div className="glass-card rounded-3xl p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-4">
            Xem trước trang chủ
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-[200px] md:h-[260px]">
            <div className="lg:col-span-2 relative rounded-3xl overflow-hidden group">
              {mainBanners[previewIndex % mainBanners.length] && (
                <>
                  <img
                    src={mainBanners[previewIndex % mainBanners.length].image}
                    alt={mainBanners[previewIndex % mainBanners.length].title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-bold">
                      {mainBanners[previewIndex % mainBanners.length].title}
                    </h3>
                    <p className="text-xs opacity-80">
                      {mainBanners[previewIndex % mainBanners.length].subtitle}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewIndex((p) => (p <= 0 ? mainBanners.length - 1 : p - 1))}
                    className="absolute top-1/2 left-3 -translate-y-1/2 bg-white/20 backdrop-blur-md p-2 rounded-xl text-white hover:bg-white/40 transition"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewIndex((p) => (p + 1) % mainBanners.length)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 bg-white/20 backdrop-blur-md p-2 rounded-xl text-white hover:bg-white/40 transition"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>
            <div className="grid grid-rows-2 gap-3 h-full">
              {banners
                .filter((b) => b.position === "side-top" && b.isActive)
                .slice(0, 1)
                .map((b) => (
                  <div key={b._id} className="rounded-3xl overflow-hidden relative">
                    <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-blue-500/10" />
                  </div>
                ))}
              {banners
                .filter((b) => b.position === "side-top" && b.isActive)
                .length === 0 && (
                <div className="rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-xs">
                  Banner phụ trên
                </div>
              )}
              {banners
                .filter((b) => b.position === "side-bottom" && b.isActive)
                .slice(0, 1)
                .map((b) => (
                  <div key={b._id} className="rounded-3xl overflow-hidden relative">
                    <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-blue-500/10" />
                  </div>
                ))}
              {banners
                .filter((b) => b.position === "side-bottom" && b.isActive)
                .length === 0 && (
                <div className="rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-xs">
                  Banner phụ dưới
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Banner List */}
      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-bold text-gray-700 dark:text-gray-200">
            Danh sách banner ({banners.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">Đang tải...</div>
        ) : banners.length === 0 ? (
          <div className="p-12 text-center">
            <Image size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Chưa có banner nào</p>
            <p className="text-sm text-gray-400 mt-1">
              Nhấn "Thêm Banner" để tạo quảng cáo đầu tiên
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {banners.map((banner) => (
              <div
                key={banner._id}
                className={`flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                  !banner.isActive ? "opacity-50" : ""
                }`}
              >
                <GripVertical size={16} className="text-gray-300 cursor-grab shrink-0" />
                <div className="w-24 h-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                  <img
                    src={banner.image}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm text-gray-800 dark:text-white truncate">
                      {banner.title}
                    </h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                        POSITION_COLORS[banner.position]
                      }`}
                    >
                      {POSITION_LABELS[banner.position]}
                    </span>
                  </div>
                  {banner.subtitle && (
                    <p className="text-xs text-gray-500 truncate">{banner.subtitle}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                    {banner.startDate && (
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(banner.startDate).toLocaleDateString("vi-VN")}
                      </span>
                    )}
                    {banner.endDate && (
                      <span>
                        → {new Date(banner.endDate).toLocaleDateString("vi-VN")}
                      </span>
                    )}
                    {banner.link && (
                      <span className="flex items-center gap-1">
                        <LinkIcon size={10} />
                        Link
                      </span>
                    )}
                    <span>Thứ tự: {banner.order}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggleActive(banner)}
                    className={`p-2 rounded-xl transition-all ${
                      banner.isActive
                        ? "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                        : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                    title={banner.isActive ? "Đang hiển thị" : "Đang ẩn"}
                  >
                    {banner.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button
                    onClick={() => handleEdit(banner)}
                    className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(banner._id)}
                    className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setShowForm(false);
              resetForm();
            }}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-gray-800 dark:text-white">
                {editingBanner ? "Chỉnh sửa Banner" : "Thêm Banner Mới"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Hình ảnh *
                </label>
                {formData.image ? (
                  <div className="relative rounded-2xl overflow-hidden h-40 bg-gray-100 dark:bg-gray-800">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, image: "" }))}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-40 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-colors bg-gray-50 dark:bg-gray-800/50">
                    <Upload
                      size={24}
                      className={`mb-2 ${uploading ? "animate-pulse" : ""} text-gray-400`}
                    />
                    <span className="text-sm text-gray-500">
                      {uploading ? "Đang tải..." : "Nhấn để chọn ảnh"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Tiêu đề *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="VD: Siêu Sale Công Nghệ"
                  required
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Phụ đề
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData((p) => ({ ...p, subtitle: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="VD: Giảm đến 50% các sản phẩm Apple"
                />
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Vị trí hiển thị
                </label>
                <select
                  value={formData.position}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      position: e.target.value as "main" | "side-top" | "side-bottom",
                    }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="main">Banner chính (Slider)</option>
                  <option value="side-top">Banner phụ trên</option>
                  <option value="side-bottom">Banner phụ dưới</option>
                </select>
              </div>

              {/* Link */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Link (URL khi nhấn vào banner)
                </label>
                <input
                  type="text"
                  value={formData.link}
                  onChange={(e) => setFormData((p) => ({ ...p, link: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="VD: /product/abc123"
                />
              </div>

              {/* Order & Active */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Thứ tự
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, order: Number(e.target.value) }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, isActive: e.target.checked }))
                      }
                      className="w-5 h-5 rounded-lg border-gray-300 text-blue-500 focus:ring-blue-400"
                    />
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      Hiển thị
                    </span>
                  </label>
                </div>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, startDate: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, endDate: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving || !formData.title || !formData.image}
                  className="flex-1 py-2.5 rounded-xl bg-shopbee-blue text-white font-bold hover:bg-blue-600 disabled:opacity-50 transition-all shadow-lg shadow-blue-200 dark:shadow-blue-900/30"
                >
                  {saving ? "Đang lưu..." : editingBanner ? "Cập nhật" : "Tạo Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBanners;
