import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  MessageCircle,
  X,
  Send,
  User as UserIcon,
  Store,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { productApi } from "../utils/api";
import { SOCKET_URL } from "../utils/runtimeConfig";
import type { ChatConversation, ChatMessage } from "../types";
import { io, Socket } from "socket.io-client";

const CustomerChat = () => {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [sellerTyping, setSellerTyping] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [unreadTotal, setUnreadTotal] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const messageIdsRef = useRef<Set<string>>(new Set());
  const selectedSellerIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const currentUserId = String(
    user?.id || ((user as { _id?: string } | null)?._id ?? ""),
  );

  const isSeller = user?.role === "seller" || user?.role === "admin";

  // Keep ref in sync
  useEffect(() => {
    selectedSellerIdRef.current = selectedSellerId;
  }, [selectedSellerId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sellerTyping]);

  // Listen for "open-customer-chat" event from ProductDetail
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.sellerId) {
        setSelectedSellerId(detail.sellerId);
        setIsOpen(true);
      }
    };
    window.addEventListener("open-customer-chat", handler);
    return () => window.removeEventListener("open-customer-chat", handler);
  }, []);

  // Fetch conversations
  const fetchConversations = useCallback(
    async (showLoader = true) => {
      if (!token || !user) return;
      try {
        if (showLoader) setLoadingConversations(true);
        const res = await productApi.getChatConversations(token);
        setConversations(res.data);
        // Calculate total unread
        const total = res.data.reduce(
          (sum: number, c: ChatConversation) => sum + (c.unreadCount || 0),
          0,
        );
        setUnreadTotal(total);
      } catch (err) {
        console.error("Failed to load conversations", err);
      } finally {
        if (showLoader) setLoadingConversations(false);
      }
    },
    [token, user],
  );

  // Socket.io connection
  useEffect(() => {
    if (!token || !user || isSeller) return;

    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;
    socket.emit("chat:join", { userId: currentUserId });

    socket.on(
      "chat:newMessage",
      (payload: {
        id: string;
        text: string;
        sender: "customer" | "seller";
        createdAt: string;
        isRead?: boolean;
        isAI?: boolean;
        customerId: string;
        sellerId: string;
      }) => {
        if (!payload || String(payload.customerId) !== currentUserId) return;

        const activeSellerId = selectedSellerIdRef.current;

        // Update conversations list
        setConversations((prev) => {
          const index = prev.findIndex(
            (c) => String(c.sellerId) === String(payload.sellerId),
          );
          if (index === -1) {
            setTimeout(() => fetchConversations(false), 0);
            return prev;
          }
          const updated = [...prev];
          const conv = { ...updated[index] };
          conv.lastMessage = payload.text;
          conv.lastSender = payload.sender;
          conv.lastAt = payload.createdAt;
          if (
            payload.sender === "seller" &&
            String(payload.sellerId) !== activeSellerId
          ) {
            conv.unreadCount += 1;
          }
          updated.splice(index, 1);
          updated.unshift(conv);
          return updated;
        });

        // Add to active chat
        if (String(payload.sellerId) === activeSellerId) {
          if (messageIdsRef.current.has(payload.id)) return;
          messageIdsRef.current.add(payload.id);
          setMessages((prev) => [
            ...prev,
            {
              id: payload.id,
              text: payload.text,
              sender: payload.sender,
              createdAt: payload.createdAt,
              isRead: payload.isRead ?? false,
              isAI: payload.isAI ?? false,
            },
          ]);
        }

        // Update unread count
        if (payload.sender === "seller") {
          setUnreadTotal((prev) => prev + 1);
        }
      },
    );

    socket.on(
      "chat:typing",
      (payload: {
        customerId: string;
        sellerId: string;
        typing: boolean;
        isFromCustomer: boolean;
      }) => {
        if (!payload || String(payload.customerId) !== currentUserId) return;
        const activeSellerId = selectedSellerIdRef.current;
        if (String(payload.sellerId) !== activeSellerId) return;
        if (!payload.isFromCustomer) {
          setSellerTyping(!!payload.typing);
        }
      },
    );

    socket.on(
      "chat:read",
      (payload: { customerId: string; sellerId: string; reader: string }) => {
        if (!payload || String(payload.customerId) !== currentUserId) return;
        if (payload.reader === "seller") {
          setMessages((prev) =>
            prev.map((m) =>
              m.sender === "customer" ? { ...m, isRead: true } : m,
            ),
          );
        }
      },
    );

    socket.on("chat:presence:list", (payload: { userIds?: string[] }) => {
      const list = Array.isArray(payload?.userIds)
        ? payload.userIds.map((id) => String(id))
        : [];
      setOnlineUserIds(new Set(list));
    });

    socket.on(
      "chat:presence",
      (payload: { userId: string; isOnline: boolean }) => {
        if (!payload?.userId) return;
        setOnlineUserIds((prev) => {
          const updated = new Set(prev);
          if (payload.isOnline) updated.add(String(payload.userId));
          else updated.delete(String(payload.userId));
          return updated;
        });
      },
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user, isSeller, currentUserId, fetchConversations]);

  // Load conversations on mount and open
  useEffect(() => {
    if (isOpen && token && user && !isSeller) {
      fetchConversations();
    }
  }, [isOpen, token, user, isSeller, fetchConversations]);

  // Load messages when selecting a seller
  useEffect(() => {
    if (!token || !selectedSellerId || !user || isSeller) return;
    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);
        const res = await productApi.getChatMessages(token, selectedSellerId);
        setMessages(res.data);
        messageIdsRef.current = new Set(res.data.map((m) => m.id));
        // Reset unread for this conversation
        setConversations((prev) =>
          prev.map((c) =>
            String(c.sellerId) === selectedSellerId
              ? { ...c, unreadCount: 0 }
              : c,
          ),
        );
      } catch (err) {
        console.error("Failed to load messages", err);
      } finally {
        setLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [token, selectedSellerId, user, isSeller]);

  // Polling fallback
  useEffect(() => {
    if (!token || !selectedSellerId || !isOpen) return;
    const timer = window.setInterval(() => {
      void fetchConversations(false);
      void productApi
        .getChatMessages(token, selectedSellerId)
        .then((res) => {
          setMessages(res.data);
          messageIdsRef.current = new Set(res.data.map((m) => m.id));
        })
        .catch(() => {});
    }, 15000);
    return () => window.clearInterval(timer);
  }, [token, selectedSellerId, isOpen, fetchConversations]);

  const handleSend = useCallback(async () => {
    if (!token || !selectedSellerId || !messageText.trim()) return;
    try {
      setSending(true);
      const res = await productApi.sendChatMessage(
        messageText.trim(),
        token,
        selectedSellerId,
      );
      const sent = res.data;
      if (!messageIdsRef.current.has(sent.id)) {
        messageIdsRef.current.add(sent.id);
        setMessages((prev) => [...prev, sent]);
      }
      // Update conversations
      setConversations((prev) => {
        const idx = prev.findIndex(
          (c) => String(c.sellerId) === selectedSellerId,
        );
        if (idx === -1) {
          // New conversation - reload
          setTimeout(() => fetchConversations(false), 100);
          return prev;
        }
        const updated = [...prev];
        const conv = { ...updated[idx] };
        conv.lastMessage = sent.text;
        conv.lastSender = "customer";
        conv.lastAt = sent.createdAt;
        updated.splice(idx, 1);
        updated.unshift(conv);
        return updated;
      });
      setMessageText("");
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSending(false);
    }
  }, [token, selectedSellerId, messageText, fetchConversations]);

  const activeConversation = useMemo(
    () => conversations.find((c) => String(c.sellerId) === selectedSellerId),
    [conversations, selectedSellerId],
  );

  const isSellerOnline = useMemo(
    () => !!selectedSellerId && onlineUserIds.has(selectedSellerId),
    [selectedSellerId, onlineUserIds],
  );

  const formatTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Don't render for sellers (they use AdminChat)
  if (!user || isSeller) return null;

  const showConversationList = !selectedSellerId;

  return (
    <>
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            className="fixed z-50 bottom-[5.5rem] right-6 glass-card rounded-4xl w-95 h-137.5 flex flex-col overflow-hidden shadow-2xl border-white/40"
          >
            {/* Header */}
            <div className="liquid-btn p-4 flex justify-between items-center text-white shrink-0 shadow-lg">
              <div className="flex items-center gap-3">
                {selectedSellerId && (
                  <button
                    onClick={() => {
                      setSelectedSellerId(null);
                      setMessages([]);
                      setSellerTyping(false);
                    }}
                    className="bg-white/10 hover:bg-white/20 p-1.5 rounded-xl transition-colors"
                  >
                    <ArrowLeft size={16} />
                  </button>
                )}
                <div className="bg-white/20 p-2 rounded-2xl backdrop-blur-md">
                  {selectedSellerId ? (
                    <Store size={20} className="text-white" />
                  ) : (
                    <MessageCircle size={20} className="text-white" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight">
                    {selectedSellerId && activeConversation
                      ? activeConversation.name
                      : "Tin nhắn"}
                  </h3>
                  {selectedSellerId ? (
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${isSellerOnline ? "bg-green-400 animate-pulse" : "bg-gray-400"}`}
                      />
                      <span className="text-[10px] font-medium opacity-80">
                        {isSellerOnline ? "Đang trực tuyến" : "Ngoại tuyến"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-medium opacity-80">
                      {conversations.length} cuộc trò chuyện
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            {showConversationList ? (
              /* Conversation List */
              <div className="flex-1 overflow-y-auto bg-gray-50/30 dark:bg-slate-900/50">
                {loadingConversations ? (
                  <div className="p-5 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="animate-pulse flex items-center gap-3 p-3"
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-24" />
                          <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <MessageCircle
                      size={48}
                      className="text-gray-300 dark:text-slate-600 mb-4"
                    />
                    <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">
                      Chưa có cuộc trò chuyện nào
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                      Nhấn "Chat ngay" trên trang sản phẩm để bắt đầu
                    </p>
                  </div>
                ) : (
                  <div className="p-2">
                    {conversations.map((conv) => (
                      <button
                        key={conv.sellerId || conv.partnerId}
                        onClick={() =>
                          setSelectedSellerId(conv.sellerId || conv.partnerId)
                        }
                        className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white dark:hover:bg-slate-800 transition-colors text-left"
                      >
                        <div className="relative w-10 h-10 rounded-full bg-shopbee-blue/10 flex items-center justify-center overflow-hidden shrink-0">
                          {conv.avatar ? (
                            <img
                              src={conv.avatar}
                              alt={conv.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Store size={18} className="text-shopbee-blue" />
                          )}
                          {onlineUserIds.has(
                            conv.sellerId || conv.partnerId,
                          ) && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-xs truncate text-gray-800 dark:text-slate-100">
                              {conv.name}
                            </p>
                            <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                              {formatTime(conv.lastAt)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
                              {conv.lastSender === "customer" ? "Bạn: " : ""}
                              {conv.lastMessage}
                            </p>
                            {conv.unreadCount > 0 && (
                              <span className="ml-2 shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-[10px] font-bold text-white">
                                {conv.unreadCount > 9
                                  ? "9+"
                                  : conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Message View */
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30 dark:bg-slate-900/50">
                  {loadingMessages ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <Loader2
                        size={24}
                        className="text-shopbee-blue animate-spin"
                      />
                      <span className="text-xs text-gray-400">
                        Đang tải tin nhắn...
                      </span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                      <Store
                        size={40}
                        className="text-gray-300 dark:text-slate-600 mb-3"
                      />
                      <p className="text-sm text-gray-500">
                        Bắt đầu cuộc trò chuyện với shop
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const fromCustomer = msg.sender === "customer";
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${fromCustomer ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`flex gap-2 max-w-[85%] ${fromCustomer ? "flex-row-reverse" : ""}`}
                          >
                            <div
                              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                                fromCustomer
                                  ? "bg-shopbee-blue text-white"
                                  : "bg-white dark:bg-slate-800 text-shopbee-blue shadow-sm"
                              }`}
                            >
                              {fromCustomer ? (
                                <UserIcon size={14} />
                              ) : (
                                <Store size={14} />
                              )}
                            </div>
                            <div
                              className={`px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                                fromCustomer
                                  ? "bg-shopbee-blue text-white rounded-tr-none"
                                  : msg.isAI
                                    ? "bg-emerald-500 text-white rounded-tl-none"
                                    : "bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 rounded-tl-none shadow-sm border border-gray-100 dark:border-slate-700"
                              }`}
                            >
                              {msg.isAI && (
                                <span className="inline-flex items-center px-1.5 py-[1px] rounded-full bg-white/15 text-[9px] font-semibold mr-1">
                                  AI
                                </span>
                              )}
                              {msg.text}
                              <div
                                className={`mt-1 text-[9px] ${
                                  fromCustomer
                                    ? "text-white/70 text-right"
                                    : "text-gray-400"
                                }`}
                              >
                                {formatTime(msg.createdAt)}
                                {fromCustomer && msg.isRead && (
                                  <span className="ml-1">✓ Đã xem</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {sellerTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 dark:border-slate-700 flex gap-1">
                        <span className="w-1.5 h-1.5 bg-shopbee-blue/40 rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-shopbee-blue/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 bg-shopbee-blue/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 bg-white/50 dark:bg-slate-900/60 backdrop-blur-md border-t border-white/20 dark:border-slate-800/60">
                  <div className="flex gap-2 bg-gray-100/80 dark:bg-slate-800/70 p-1.5 rounded-2xl focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-2 focus-within:ring-shopbee-blue/20 transition-all">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => {
                        setMessageText(e.target.value);
                        if (socketRef.current && selectedSellerId) {
                          socketRef.current.emit("chat:typing", {
                            sellerId: selectedSellerId,
                            customerId: currentUserId,
                            typing: e.target.value.length > 0,
                            isFromCustomer: true,
                          });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Nhập tin nhắn..."
                      className="flex-1 bg-transparent px-3 py-1.5 text-sm outline-none text-gray-800 dark:text-slate-100 placeholder:text-gray-400"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!messageText.trim() || sending}
                      className="liquid-btn text-white p-2 rounded-xl disabled:opacity-50 transition-all"
                    >
                      {sending ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed z-50 bottom-6 right-24 liquid-btn text-white p-4 rounded-3xl shadow-2xl shadow-shopbee-blue/30 group overflow-hidden hidden md:flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={isOpen ? "close" : "open"}
            initial={{ rotate: -90, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            exit={{ rotate: 90, scale: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
          </motion.div>
        </AnimatePresence>
        {/* Unread badge */}
        {!isOpen && unreadTotal > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 min-w-5 h-5 px-1 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
            {unreadTotal > 9 ? "9+" : unreadTotal}
          </span>
        )}
      </motion.button>
    </>
  );
};

export default CustomerChat;
