import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { productApi } from "../../utils/api";
import {
  UserPlus, Shield, ShieldCheck, Trash2, X, Users, Crown, Store,
  User as UserIcon, Check, Search, Mail, Calendar, LayoutGrid, List,
  Eye, EyeOff, Lock, KeyRound, ChevronRight, Sparkles, AlertTriangle,
} from "lucide-react";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  username?: string;
  avatar?: string;
  adminPermissions?: string[];
  createdAt: string;
}

const ALL_PERMISSIONS = [
  { key: "manage_products", label: "Quản lý sản phẩm", icon: "📦" },
  { key: "manage_orders", label: "Quản lý đơn hàng", icon: "🛒" },
  { key: "manage_users", label: "Quản lý người dùng", icon: "👥" },
  { key: "manage_banners", label: "Quản lý quảng cáo", icon: "🖼️" },
  { key: "manage_reviews", label: "Quản lý đánh giá", icon: "⭐" },
  { key: "manage_chat", label: "Quản lý chat", icon: "💬" },
  { key: "manage_vouchers", label: "Quản lý voucher", icon: "🎟️" },
  { key: "view_dashboard", label: "Xem dashboard", icon: "📊" },
];

const ROLE_CONFIG: Record<string, { label: string; color: string; gradient: string; icon: typeof Crown }> = {
  admin: {
    label: "Admin",
    color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    gradient: "from-red-500 to-orange-500",
    icon: Crown,
  },
  seller: {
    label: "Người bán",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    gradient: "from-blue-500 to-cyan-500",
    icon: Store,
  },
  user: {
    label: "Người dùng",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    gradient: "from-gray-400 to-gray-500",
    icon: UserIcon,
  },
};

const AdminUsers = () => {
  const { token, isAdmin, user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showRoleMenu, setShowRoleMenu] = useState<string | null>(null);

  // Create form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    permissions: ALL_PERMISSIONS.map((p) => p.key),
  });

  // Edit permissions state
  const [editPermissions, setEditPermissions] = useState<string[]>([]);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await productApi.getAdminAllUsers(token);
      setUsers(res.data || []);
    } catch (err) {
      console.error("Lỗi tải danh sách users:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      await productApi.createAdminUser(formData, token);
      await fetchUsers();
      setShowCreateForm(false);
      setFormData({
        name: "",
        email: "",
        password: "",
        permissions: ALL_PERMISSIONS.map((p) => p.key),
      });
    } catch (err: any) {
      alert(err?.response?.data?.message || "Lỗi tạo tài khoản admin");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePermissions = async () => {
    if (!token || !editingUser) return;
    setSaving(true);
    try {
      await productApi.updateAdminPermissions(editingUser._id, editPermissions, token);
      await fetchUsers();
      setEditingUser(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Lỗi cập nhật quyền");
    } finally {
      setSaving(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (!token) return;
    try {
      await productApi.changeUserRole(userId, newRole, token);
      await fetchUsers();
      setShowRoleMenu(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Lỗi thay đổi vai trò");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!token) return;
    try {
      await productApi.deleteAdminUser(userId, token);
      await fetchUsers();
      setShowDeleteConfirm(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Lỗi xóa người dùng");
    }
  };

  const togglePermission = (key: string, isCreate = false) => {
    if (isCreate) {
      setFormData((prev) => ({
        ...prev,
        permissions: prev.permissions.includes(key)
          ? prev.permissions.filter((p) => p !== key)
          : [...prev.permissions, key],
      }));
    } else {
      setEditPermissions((prev) =>
        prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key],
      );
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchQuery ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const adminCount = users.filter((u) => u.role === "admin").length;
  const sellerCount = users.filter((u) => u.role === "seller").length;
  const userCount = users.filter((u) => u.role === "user").length;

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Bạn không có quyền truy cập trang này.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-blue-900/30">
            <Users size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-800 dark:text-white">Quản Lý Tài Khoản</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tạo admin mới và phân quyền chi tiết • {users.length} tài khoản</p>
          </div>
        </div>
        <button onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-bold hover:shadow-xl hover:shadow-blue-200 dark:hover:shadow-blue-900/30 hover:-translate-y-0.5 transition-all duration-300">
          <UserPlus size={18} /> Tạo Admin
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { count: adminCount, label: "Quản trị viên", Icon: Crown, grad: "from-red-500 to-orange-400", bg: "bg-red-50 dark:bg-red-950/30" },
          { count: sellerCount, label: "Người bán", Icon: Store, grad: "from-blue-500 to-cyan-400", bg: "bg-blue-50 dark:bg-blue-950/30" },
          { count: userCount, label: "Người dùng", Icon: Users, grad: "from-violet-500 to-purple-400", bg: "bg-violet-50 dark:bg-violet-950/30" },
        ].map((s) => (
          <div key={s.label} className={`relative overflow-hidden rounded-2xl p-5 ${s.bg} border border-white/60 dark:border-white/5`}>
            <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br ${s.grad} opacity-15 blur-xl`} />
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.grad} flex items-center justify-center shadow-lg`}>
                <s.Icon size={22} className="text-white" />
              </div>
              <div>
                <p className="text-3xl font-black text-gray-800 dark:text-white leading-none">{s.count}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">{s.label}</p>
              </div>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-white/50 dark:bg-white/10 overflow-hidden">
              <div className={`h-full rounded-full bg-gradient-to-r ${s.grad} transition-all duration-700`} style={{width:`${Math.min(100,users.length?s.count/users.length*100:0)}%`}} />
            </div>
          </div>
        ))}
      </div>

      {/* Search & Tab Filter */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} placeholder="Tìm kiếm theo tên, email..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 shadow-sm" />
          {searchQuery && <button onClick={()=>setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X size={14} className="text-gray-400"/></button>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[{v:'all',l:'Tất cả',c:users.length},{v:'admin',l:'Admin',c:adminCount},{v:'seller',l:'Người bán',c:sellerCount},{v:'user',l:'Người dùng',c:userCount}].map((t)=>(
            <button key={t.v} onClick={()=>setFilterRole(t.v)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filterRole===t.v?'bg-shopbee-blue text-white shadow-md shadow-blue-200 dark:shadow-blue-900/30':'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}>
              {t.l} <span className={`ml-1 text-xs ${filterRole===t.v?'text-blue-100':'text-gray-400'}`}>({t.c})</span>
            </button>
          ))}
        </div>
      </div>

      {/* User List */}
      {/* User Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i=><div key={i} className="h-52 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse"/>)}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="glass-card rounded-3xl p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Search size={28} className="text-gray-300" />
          </div>
          <p className="text-gray-500 font-bold text-lg">Không tìm thấy người dùng</p>
          <p className="text-gray-400 text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((u) => {
            const rc = ROLE_CONFIG[u.role] || ROLE_CONFIG.user;
            const isSelf = String(u._id) === String(currentUser?.id || currentUser?._id);
            const RI = rc.icon;
            const permCount = u.adminPermissions?.length || 0;
            return (
              <div key={u._id} className="group relative bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-xl hover:shadow-blue-100/30 dark:hover:shadow-blue-900/10 hover:-translate-y-0.5 transition-all duration-300">
                {/* Gradient top strip */}
                <div className={`h-1.5 bg-gradient-to-r ${rc.gradient}`} />
                <div className="p-5">
                  <div className="flex items-start gap-3.5">
                    {/* Avatar */}
                    <div className={`relative shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${rc.gradient} p-[2px]`}>
                      <div className="w-full h-full rounded-[14px] bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                        {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover"/>
                        : <span className={`text-xl font-black bg-gradient-to-br ${rc.gradient} bg-clip-text text-transparent`}>{u.name.charAt(0).toUpperCase()}</span>}
                      </div>
                      {isSelf && <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-400 border-2 border-white dark:border-gray-900 flex items-center justify-center"><Sparkles size={10} className="text-white"/></div>}
                    </div>
                    {/* Name & Role */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="font-bold text-[15px] text-gray-800 dark:text-white truncate">{u.name}</h3>
                        {isSelf && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 font-bold shrink-0">Bạn</span>}
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg font-semibold ${rc.color}`}><RI size={11}/>{rc.label}</span>
                      <div className="flex items-center gap-1 mt-1.5 text-[11px] text-gray-400"><Mail size={11}/><span className="truncate">{u.email}</span></div>
                      {u.createdAt && <div className="flex items-center gap-1 mt-0.5 text-[11px] text-gray-400"><Calendar size={11}/>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</div>}
                    </div>
                  </div>
                  {/* Permission chips for admin */}
                  {u.role === 'admin' && permCount > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-1.5 mb-2">
                        <KeyRound size={12} className="text-blue-500"/>
                        <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">Quyền hạn ({permCount}/{ALL_PERMISSIONS.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(u.adminPermissions||[]).map(p=>{const pm=ALL_PERMISSIONS.find(a=>a.key===p);return pm?<span key={p} className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300">{pm.icon}</span>:null;})}
                      </div>
                    </div>
                  )}
                  {/* Actions */}
                  {!isSelf && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
                      <div className="relative">
                        <button onClick={()=>setShowRoleMenu(showRoleMenu===u._id?null:u._id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
                          <Shield size={13}/> Vai trò <ChevronRight size={12} className={`transition-transform ${showRoleMenu===u._id?'rotate-90':''}`}/>
                        </button>
                        {showRoleMenu===u._id && (
                          <div className="absolute left-0 bottom-full mb-1 w-40 py-1 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-20">
                            {['admin','seller','user'].map(r=>{const cfg=ROLE_CONFIG[r];return(
                              <button key={r} onClick={()=>handleChangeRole(u._id,r)} className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 ${u.role===r?'font-bold text-blue-600':'text-gray-600 dark:text-gray-300'}`}>
                                {u.role===r&&<Check size={12}/>}<cfg.icon size={12}/>{cfg.label}
                              </button>
                            );})}
                          </div>
                        )}
                      </div>
                      {u.role==='admin' && <button onClick={()=>{setEditingUser(u);setEditPermissions(u.adminPermissions||[]);}} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all"><ShieldCheck size={13}/>Phân quyền</button>}
                      <button onClick={()=>setShowDeleteConfirm(u._id)} className="ml-auto p-1.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"><Trash2 size={14}/></button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={()=>setShowDeleteConfirm(null)}/>
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle size={28} className="text-red-500"/>
            </div>
            <h3 className="text-lg font-black text-gray-800 dark:text-white mb-2">Xác nhận xóa</h3>
            <p className="text-sm text-gray-500 mb-6">Bạn có chắc chắn muốn xóa người dùng này? Hành động không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button onClick={()=>setShowDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">Hủy</button>
              <button onClick={()=>handleDeleteUser(showDeleteConfirm)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-200 dark:shadow-red-900/30">Xóa</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowCreateForm(false)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2">
                <Crown size={20} className="text-red-500" />
                Tạo Tài Khoản Admin
              </h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Tên *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Nhập tên admin"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="admin@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Mật khẩu *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Tối thiểu 6 ký tự"
                  minLength={6}
                  required
                />
              </div>

              {/* Permissions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    Phân quyền
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        permissions:
                          p.permissions.length === ALL_PERMISSIONS.length
                            ? []
                            : ALL_PERMISSIONS.map((x) => x.key),
                      }))
                    }
                    className="text-xs text-blue-500 font-bold hover:underline"
                  >
                    {formData.permissions.length === ALL_PERMISSIONS.length
                      ? "Bỏ chọn tất cả"
                      : "Chọn tất cả"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_PERMISSIONS.map((perm) => (
                    <label
                      key={perm.key}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        formData.permissions.includes(perm.key)
                          ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600"
                          : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm.key)}
                        onChange={() => togglePermission(perm.key, true)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-400"
                      />
                      <span className="text-sm">
                        {perm.icon} {perm.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-shopbee-blue text-white font-bold hover:bg-blue-600 disabled:opacity-50 transition-all shadow-lg shadow-blue-200 dark:shadow-blue-900/30"
                >
                  {saving ? "Đang tạo..." : "Tạo Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Permissions Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setEditingUser(null)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-black text-gray-800 dark:text-white">
                  Phân Quyền Admin
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {editingUser.name} ({editingUser.email})
                </p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 mb-6">
              {ALL_PERMISSIONS.map((perm) => (
                <label
                  key={perm.key}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    editPermissions.includes(perm.key)
                      ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={editPermissions.includes(perm.key)}
                    onChange={() => togglePermission(perm.key)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-400"
                  />
                  <span className="text-lg">{perm.icon}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {perm.label}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdatePermissions}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-shopbee-blue text-white font-bold hover:bg-blue-600 disabled:opacity-50 transition-all shadow-lg shadow-blue-200 dark:shadow-blue-900/30"
              >
                {saving ? "Đang lưu..." : "Lưu quyền"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
