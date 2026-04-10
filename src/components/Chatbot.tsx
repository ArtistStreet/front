import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  User,
  Bot,
  Store,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { productApi } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { io, Socket } from "socket.io-client";

interface Message {
  id: string | number;
  text: string;
  sender: "customer" | "bot" | "seller";
  timestamp: Date;
  isRead?: boolean;
}

interface OpenChatbotEventDetail {
  sellerId?: string | { _id?: string; $oid?: string };
}

interface ServerChatMessage {
  id: string;
  text: string;
  sender: "customer" | "seller";
  createdAt: string;
  isRead?: boolean;
  sellerReadAt?: string | null;
}

const Chatbot = () => {
  const { user, token } = useAuth();
  const currentUserId = String(
    user?.id || ((user as { _id?: string } | null)?._id ?? ""),
  );
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Xin chào! Tôi là trợ lý ảo của Shopee. Tôi có thể giúp gì cho bạn?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [sellerTyping, setSellerTyping] = useState(false);
  const [lastRead, setLastRead] = useState<null | Date>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const messageIdsRef = useRef<Set<string>>(new Set());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const openHandler = (event: Event) => {
      const detail = (event as CustomEvent<OpenChatbotEventDetail>).detail;
      if (detail && detail.sellerId) {
        const normalizedSellerId =
          typeof detail.sellerId === "string"
            ? detail.sellerId
            : detail.sellerId._id || detail.sellerId.$oid || "";
        setSellerId(normalizedSellerId);
        setIsOpen(true);
      }
    };
    window.addEventListener("open-chatbot", openHandler);
    return () => window.removeEventListener("open-chatbot", openHandler);
  }, []);

  useEffect(() => {
    if (!token || !currentUserId) return;
    const socket = io("http://localhost:5000", {
      transports: ["websocket"],
      query: { userId: currentUserId },
    });
    socketRef.current = socket;
    socket.emit("chat:join", { userId: currentUserId });

    socket.on(
      "chat:newMessage",
      (payload: {
        id: string;
        text: string;
        sender: string;
        createdAt: string;
        isRead?: boolean;
        isAI?: boolean;
        customerId: string;
        sellerId: string;
      }) => {
        if (!payload || String(payload.customerId) !== currentUserId) return;
        if (payload.sender !== "seller") return;
        // Only show message if it's from the current seller
        if (sellerId && String(payload.sellerId) === String(sellerId)) {
          if (messageIdsRef.current.has(payload.id)) return;
          messageIdsRef.current.add(payload.id);
          const msg: Message = {
            id: payload.id,
            text: payload.text,
            sender: "seller",
            timestamp: new Date(payload.createdAt),
            isRead: payload.isRead,
          };
          setMessages((prev) => [...prev, msg]);
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
        if (
          sellerId &&
          String(payload.sellerId) === String(sellerId) &&
          !payload.isFromCustomer
        ) {
          setSellerTyping(!!payload.typing);
        }
      },
    );

    socket.on(
      "chat:read",
      (payload: { customerId: string; sellerId: string; reader: string }) => {
        if (!payload || String(payload.customerId) !== currentUserId) return;
        if (
          sellerId &&
          String(payload.sellerId) === String(sellerId) &&
          payload.reader === "seller"
        ) {
          setLastRead(new Date());
        }
      },
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, currentUserId, sellerId]);

  useEffect(() => {
    if (!token || !user || !sellerId) return;
    const fetchHistory = async () => {
      try {
        const res = await productApi.getChatMessages(token, String(sellerId));
        const rawMessages = res.data as ServerChatMessage[];
        const serverMessages: Message[] = rawMessages.map((m) => ({
          id: m.id,
          text: m.text,
          sender: m.sender === "seller" ? "seller" : "customer",
          timestamp: new Date(m.createdAt),
          isRead: m.isRead,
        }));
        const lastReadMsg = rawMessages
          .filter((m) => m.sender === "customer" && m.isRead)
          .slice(-1)[0];
        if (lastReadMsg?.sellerReadAt) {
          setLastRead(new Date(lastReadMsg.sellerReadAt));
        }
        messageIdsRef.current = new Set(rawMessages.map((m) => m.id));
        setMessages([
          {
            id: 1,
            text: "Xin chào! Tôi là trợ lý ảo của Shopee. Tôi có thể giúp gì cho bạn?",
            sender: "bot",
            timestamp: new Date(),
          },
          ...serverMessages,
        ]);
      } catch (error) {
        console.error("Lỗi khi tải lịch sử chat:", error);
      }
    };
    fetchHistory();
  }, [token, user, sellerId]);

  const handleSendMessage = async () => {
    const text = inputValue.trim();
    if (!text || !sellerId) return;
    if (currentUserId && String(sellerId) === currentUserId) {
      const selfShopMessage: Message = {
        id: Date.now() + 2,
        text: "Bạn đang đăng nhập bằng chính tài khoản shop này, không thể tự chat với chính mình.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, selfShopMessage]);
      return;
    }
    setInputValue("");

    try {
      if (token) {
        const sent = await productApi.sendChatMessage(
          text,
          token,
          String(sellerId),
        );
        const sentId = sent.data.id || String(Date.now());
        if (!messageIdsRef.current.has(sentId)) {
          messageIdsRef.current.add(sentId);
          setMessages((prev) => [
            ...prev,
            {
              id: sentId,
              text,
              sender: "customer",
              timestamp: new Date(sent.data.createdAt || Date.now()),
              isRead: sent.data.isRead ?? false,
            },
          ]);
        }
        // Tự động gọi chatbot nếu người bán không đang gõ
        if (!sellerTyping) {
          setIsTyping(true);
          await productApi.chatbot(text, String(sellerId), token);
          setIsTyping(false);
        }
      } else {
        // Khách chưa đăng nhập: chỉ chat với bot (sellerId lúc này có thể là mặc định hoặc null)
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            text,
            sender: "customer",
            timestamp: new Date(),
            isRead: false,
          },
        ]);
        setIsTyping(true);
        const response = await productApi.chatbot(text);
        const botMessage: Message = {
          id: Date.now(),
          text: response.data.response,
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
        setIsTyping(false);
      }
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
      const apiError = error as {
        response?: { data?: { message?: string } };
      };
      const reason =
        apiError.response?.data?.message ||
        "Xin lỗi, không thể gửi tin nhắn. Vui lòng thử lại sau!";
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: reason,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const lastUserMessageIndex = messages.reduce(
    (lastIndex, msg, index) => (msg.sender === "customer" ? index : lastIndex),
    -1,
  );

  return (
    <>
      <div
        style={{
          position: "fixed",
          right: 24,
          bottom: 96,
          zIndex: 50,
        }}
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="glass-card relative rounded-[28px] w-[92vw] max-w-[420px] h-[65vh] sm:h-[560px] flex flex-col overflow-hidden mb-4 shadow-[0_24px_60px_rgba(15,23,42,0.55)] border border-white/40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl"
            >
              {/* Header - iOS Glass Style */}
              <div className="liquid-btn relative px-4 py-4 sm:px-5 sm:py-4 flex justify-between items-center text-white shrink-0 shadow-lg border-b border-white/15">
                <div className="flex items-center gap-3">
                  <div className="bg-white/15 p-2 rounded-2xl backdrop-blur-md shadow-sm">
                    {sellerId ? (
                      <Store size={22} className="text-white/95" />
                    ) : (
                      <Bot size={22} className="text-white/95" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[13px] sm:text-sm tracking-tight">
                      {sellerId
                        ? "Trò chuyện với Người bán"
                        : "Hỗ Trợ Shopee AI"}
                    </h3>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                      <span className="text-[10px] sm:text-[11px] font-medium opacity-85 uppercase tracking-[0.16em]">
                        Trực tuyến
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors backdrop-blur-sm border border-white/20"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4 bg-gradient-to-b from-slate-50/90 via-slate-50/70 to-slate-100/80 dark:from-slate-900/70 dark:via-slate-900/80 dark:to-slate-950/80">
                {messages.map((msg, index) => (
                  <motion.div
                    initial={{
                      opacity: 0,
                      x: msg.sender === "customer" ? 10 : -10,
                    }}
                    animate={{ opacity: 1, x: 0 }}
                    key={msg.id}
                    className={`flex ${
                      msg.sender === "customer"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex gap-2.5 max-w-[85%] ${
                        msg.sender === "customer" ? "flex-row-reverse" : ""
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden ${
                          msg.sender === "customer"
                            ? user?.avatar
                              ? "bg-transparent"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-200"
                            : msg.sender === "seller"
                              ? "bg-emerald-500 text-white"
                              : "bg-[#2563eb] text-white dark:bg-[#1d4ed8] dark:text-white"
                        }`}
                      >
                        {msg.sender === "customer" ? (
                          user?.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User size={16} />
                          )
                        ) : msg.sender === "seller" ? (
                          <User size={16} />
                        ) : (
                          <Bot size={16} />
                        )}
                      </div>
                      <div
                        className={`px-3.5 py-3 rounded-3xl text-[13px] sm:text-sm leading-relaxed ${
                          msg.sender === "customer"
                            ? "glass text-slate-900 dark:bg-slate-900/85 dark:text-slate-100 antialiased font-semibold rounded-tr-none shadow-md"
                            : "bg-white/95 text-slate-900 dark:bg-slate-900/85 dark:text-slate-100 rounded-tl-none shadow-sm border border-slate-100/80 dark:border-slate-800"
                        }`}
                      >
                        {msg.sender !== "customer" && (
                          <div
                            className={`text-[10px] font-semibold mb-1 ${
                              msg.sender === "seller"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-sky-600 dark:text-sky-400"
                            }`}
                          >
                            {msg.sender === "seller"
                              ? "Người bán"
                              : "Shopee AI"}
                          </div>
                        )}
                        {msg.text}
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            {msg.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {msg.sender === "customer" &&
                            index === lastUserMessageIndex && (
                              <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                                {lastRead
                                  ? `Đã xem lúc ${lastRead.toLocaleTimeString(
                                      [],
                                      { hour: "2-digit", minute: "2-digit" },
                                    )}`
                                  : "Đã gửi"}
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/95 dark:bg-slate-900/85 px-4 py-3 rounded-3xl rounded-tl-none shadow-sm border border-slate-100/80 dark:border-slate-800 flex gap-1">
                      <span className="w-1.5 h-1.5 bg-shopee-blue/40 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-shopee-blue/40 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-shopee-blue/40 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                )}
                {!isTyping && sellerTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/95 dark:bg-slate-900/85 px-4 py-3 rounded-3xl rounded-tl-none shadow-sm border border-slate-100/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span>Người bán đang trả lời, AI tạm dừng</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="px-4 py-3 sm:px-4 sm:py-4 bg-white/70 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-100/70 dark:border-slate-800/70">
                <div className="flex gap-2 bg-slate-100/80 dark:bg-slate-900/70 px-2 py-1.5 rounded-2xl focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-shopee-blue/25 transition-all shadow-[0_10px_30px_rgba(15,23,42,0.25)]">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      if (socketRef.current && user && sellerId) {
                        socketRef.current.emit("chat:typing", {
                          customerId: user.id,
                          sellerId: sellerId,
                          typing: e.target.value.length > 0,
                          isFromCustomer: true,
                        });
                      }
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder={
                      sellerId
                        ? "Nhắn tin cho người bán..."
                        : "Chọn một người bán để bắt đầu"
                    }
                    className="flex-1 bg-transparent px-3 py-1.5 text-[13px] sm:text-sm outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    disabled={!sellerId}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping || !sellerId}
                    className="liquid-btn text-white px-3 py-2 rounded-xl disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center bg-gradient-to-r from-[#0ea5e9] via-[#2563eb] to-[#6366f1]"
                  >
                    {isTyping ? (
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          right: 24,
          bottom: 24,
          zIndex: 40,
        }}
        className="liquid-btn text-white p-4 rounded-[999px] shadow-[0_18px_45px_rgba(37,99,235,0.55)] relative group overflow-hidden flex bg-gradient-to-r from-[#0ea5e9] via-[#2563eb] to-[#6366f1]"
      >
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}

        {/* Badge */}
        {!isOpen && (
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-red-500 text-[10px] font-semibold text-white shadow-[0_10px_25px_rgba(248,113,113,0.65)] animate-bounce">
            Tin nhắn mới
          </span>
        )}
      </motion.button>
    </>
  );
};

export default Chatbot;
