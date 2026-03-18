import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { productApi } from "../utils/api";
import type { Notification } from "../types";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";

const NotificationsPage = () => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await productApi.getNotifications(token);
        setNotifications(res.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const markRead = async (id: string) => {
    if (!token) return;
    await productApi.markNotificationAsRead(id, token);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
  };

  if (!token) {
    return (
      <div className="site-container py-10 min-h-[60vh]">
        <div className="glass-card rounded-3xl p-8 text-center">
          <Bell size={28} className="mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600 mb-4">
            Vui lòng đăng nhập để xem thông báo
          </p>
          <Link
            to="/login"
            className="liquid-btn text-white px-6 py-3 rounded-2xl font-bold"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="site-container py-6 min-h-[60vh]">
      <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Bell size={20} className="text-shopee-blue" /> Thông báo
      </h1>
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-shopee-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-card rounded-3xl p-8 text-center text-gray-500">
          Không có thông báo
        </div>
      ) : (
        <div className="glass-card rounded-3xl divide-y divide-gray-100 dark:divide-slate-800">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`p-4 flex items-start justify-between ${
                !n.isRead ? "bg-shopee-blue/[0.02]" : ""
              }`}
            >
              <div>
                <p className="font-bold text-sm mb-1">{n.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {n.message}
                </p>
                <p className="text-[10px] text-gray-400 mt-1 uppercase">
                  {new Date(n.createdAt).toLocaleDateString()}
                </p>
              </div>
              {!n.isRead && (
                <button
                  onClick={() => markRead(n._id)}
                  className="text-[11px] font-bold text-shopee-blue hover:opacity-80"
                >
                  Đánh dấu đã đọc
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
