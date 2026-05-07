import { MessageCircle, X, Send, User as UserIcon, Store, Loader2, Bot, Search, Package, ShoppingBag, ArrowLeft, Trash2, ExternalLink, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatLogic } from "./useChatLogic";
import { useState } from "react";

const UnifiedChat = () => {
  const c = useChatLogic();
  const [mobileShowRight, setMobileShowRight] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{id:string;name:string}|null>(null);
  const [deleting, setDeleting] = useState(false);

  if (!c.user) return null;

  const isBot = c.activeChat.type === "bot";
  const placeholder = isBot ? "Hỏi ShopBee AI..." : "Nhập tin nhắn...";

  const handleSelectChat = (chat: Parameters<typeof c.setActiveChat>[0]) => {
    c.setActiveChat(chat);
    setMobileShowRight(true);
  };
  const handleBackToList = () => setMobileShowRight(false);

  return (
    <>
      {/* Chat Panel */}
      <AnimatePresence>
        {c.isOpen && (
          <motion.div
            initial={{ opacity:0, scale:0.9, y:20 }}
            animate={{ opacity:1, scale:1, y:0 }}
            exit={{ opacity:0, scale:0.9, y:20 }}
            transition={{ type:"spring", damping:22, stiffness:300 }}
            className="fixed z-50 inset-4 sm:inset-auto sm:bottom-[5.5rem] sm:right-6 sm:w-[680px] sm:h-[550px] rounded-2xl overflow-hidden shadow-2xl border border-white/30 flex bg-white dark:bg-slate-900"
          >
            {/* LEFT PANEL - Contact List */}
            <div className={`w-full sm:w-[240px] border-r border-gray-200 dark:border-slate-700 flex flex-col bg-white dark:bg-slate-900 sm:shrink-0 ${mobileShowRight ? "hidden sm:flex" : "flex"}`}>
              {/* Header */}
              <div className="p-3 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-shopbee-blue font-bold text-base">
                    Chat {c.unreadTotal > 0 && <span className="text-red-500 text-sm">({c.unreadTotal})</span>}
                  </h3>
                  <button onClick={() => c.setIsOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                    <X size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 rounded-lg px-2.5 py-1.5">
                  <Search size={13} className="text-gray-400 shrink-0" />
                  <input
                    type="text" value={c.searchText} onChange={e => c.setSearchText(e.target.value)}
                    placeholder="Tìm theo tên" className="bg-transparent text-xs outline-none flex-1 text-gray-700 dark:text-slate-200 placeholder:text-gray-400"
                  />
                </div>
                {/* Seller: Link to Admin Chat */}
                {c.isSeller && (
                  <a href="/admin/chat" className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 hover:from-indigo-500/20 hover:to-purple-500/20 transition-all group">
                    <ExternalLink size={13} className="text-indigo-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">Mở trang Chat Khách hàng</span>
                  </a>
                )}
              </div>

              {/* Chatbot Entry */}
              <button
                onClick={() => handleSelectChat({ type:"bot" })}
                className={`flex items-center gap-2.5 px-3 py-2.5 text-left border-b border-gray-100 dark:border-slate-800 transition-colors ${isBot ? "bg-blue-50 dark:bg-slate-800" : "hover:bg-gray-50 dark:hover:bg-slate-800/50"}`}
              >
                <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shrink-0">
                  <Bot size={18} className="text-white" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs text-gray-800 dark:text-slate-100 truncate">Trợ lý ShopBee AI</p>
                  <p className="text-[10px] text-gray-400 truncate">Hỏi đáp tự động 24/7</p>
                </div>
              </button>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto">
                {c.loadingConvs ? (
                  <div className="p-4 space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="animate-pulse flex items-center gap-2 p-2">
                        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-slate-700" />
                        <div className="flex-1 space-y-1.5"><div className="h-2.5 bg-gray-200 dark:bg-slate-700 rounded w-20" /><div className="h-2 bg-gray-200 dark:bg-slate-700 rounded w-28" /></div>
                      </div>
                    ))}
                  </div>
                ) : c.conversations.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-400">
                    {c.searchText ? "Không tìm thấy" : "Chưa có cuộc trò chuyện"}
                  </div>
                ) : (
                  c.conversations.map(conv => {
                    const sid = conv.partnerId;
                    const isActive = c.activeChat.type === "seller" && c.activeChat.sellerId === sid;
                    return (
                      <div key={sid} className={`group relative w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all border-b border-gray-50 dark:border-slate-800/50 cursor-pointer ${isActive ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 shadow-sm" : "hover:bg-gray-50/80 dark:hover:bg-slate-800/50"}`}
                        onClick={() => handleSelectChat({ type:"seller", sellerId:sid })}
                      >
                        <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-shopbee-blue/20 to-indigo-200/30 dark:from-shopbee-blue/30 dark:to-indigo-500/20 flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-white dark:ring-slate-900">
                          {conv.avatar ? <img src={conv.avatar} alt={conv.name} className="w-full h-full object-cover" /> : <Store size={16} className="text-shopbee-blue" />}
                          {c.onlineIds.has(sid) && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`font-semibold text-xs truncate ${isActive ? "text-shopbee-blue" : "text-gray-800 dark:text-slate-100"}`}>{conv.name}</p>
                            <span className="text-[9px] text-gray-400 shrink-0 ml-1">{c.fmtTime(conv.lastAt)}</span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-[10px] text-gray-400 truncate">{(c.isSeller ? conv.lastSender === "seller" : conv.lastSender === "customer") ? "Bạn: " : ""}{conv.lastMessage}</p>
                            {conv.unreadCount > 0 && <span className="ml-1 shrink-0 w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-[9px] font-bold text-white flex items-center justify-center shadow-sm">{conv.unreadCount > 9 ? "9+" : conv.unreadCount}</span>}
                          </div>
                        </div>
                        {/* Delete button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget({id:sid,name:conv.name}); }}
                          className="shrink-0 p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-300 hover:text-red-500 transition-colors"
                          title="Xóa cuộc trò chuyện"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT PANEL - Messages */}
            <div className={`flex-1 flex flex-col min-w-0 ${mobileShowRight ? "flex" : "hidden sm:flex"}`}>
              {/* Right Header */}
              <div className="px-4 py-2.5 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center gap-2.5 shrink-0">
                <button onClick={handleBackToList} className="sm:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 mr-1">
                  <ArrowLeft size={18} />
                </button>
                {isBot ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center"><Bot size={16} className="text-white" /></div>
                    <div><p className="font-bold text-sm text-gray-800 dark:text-slate-100">Trợ lý ShopBee AI</p><p className="text-[10px] text-green-500 font-medium">● Trực tuyến</p></div>
                  </>
                ) : c.activeConv ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-shopbee-blue/10 flex items-center justify-center overflow-hidden">
                      {c.activeConv.avatar ? <img src={c.activeConv.avatar} alt="" className="w-full h-full object-cover" /> : <Store size={16} className="text-shopbee-blue" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-800 dark:text-slate-100">{c.activeConv.name}</p>
                      <p className={`text-[10px] font-medium ${c.isSellerOnline ? "text-green-500" : "text-gray-400"}`}>● {c.isSellerOnline ? "Đang hoạt động" : "Ngoại tuyến"}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Chọn cuộc trò chuyện</p>
                )}
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-slate-950/30">
                {isBot ? (
                  /* Bot Messages */
                  <>
                    {c.botMessages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`flex gap-2 max-w-[80%] ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.sender === "user" ? "bg-shopbee-blue text-white" : "bg-gradient-to-br from-blue-500 to-purple-500 text-white"}`}>
                            {msg.sender === "user" ? <UserIcon size={13} /> : <Bot size={13} />}
                          </div>
                          <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed ${msg.sender === "user" ? "bg-shopbee-blue text-white rounded-tr-sm" : "bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 rounded-tl-sm shadow-sm border border-gray-100 dark:border-slate-700"}`}>
                            {msg.sender === "bot" ? <div dangerouslySetInnerHTML={{ __html: c.formatBot(msg.text) }} className="[&_ul]:my-1 [&_li]:ml-2 [&_strong]:font-bold [&_strong]:text-shopbee-blue" /> : msg.text}
                            <div className={`text-[9px] mt-1 ${msg.sender === "user" ? "text-white/60 text-right" : "text-gray-400"}`}>
                              {msg.timestamp.toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"})}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {c.botTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 dark:border-slate-700 flex gap-1">
                          <span className="w-1.5 h-1.5 bg-blue-400/50 rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-blue-400/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1.5 h-1.5 bg-blue-400/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    )}
                  </>
                ) : c.selectedSellerId ? (
                  /* Seller Messages */
                  c.loadingMsgs ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <Loader2 size={22} className="text-shopbee-blue animate-spin" />
                      <span className="text-xs text-gray-400">Đang tải...</span>
                    </div>
                  ) : c.sellerMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Store size={36} className="text-gray-300 dark:text-slate-600 mb-2" />
                      <p className="text-xs text-gray-400">Bắt đầu cuộc trò chuyện</p>
                    </div>
                  ) : (
                    <>
                      {c.sellerMessages.map(msg => {
                        const fromMe = c.isSeller ? msg.sender === "seller" : msg.sender === "customer";
                        return (
                          <div key={msg.id} className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
                            <div className={`flex gap-2 max-w-[80%] ${fromMe ? "flex-row-reverse" : ""}`}>
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${fromMe ? "bg-shopbee-blue text-white" : "bg-white dark:bg-slate-800 text-shopbee-blue shadow-sm"}`}>
                                {fromMe ? <UserIcon size={13} /> : <Store size={13} />}
                              </div>
                              <div className={`rounded-2xl text-xs leading-relaxed overflow-hidden ${fromMe ? "bg-shopbee-blue text-white rounded-tr-sm" : msg.isAI ? "bg-emerald-500 text-white rounded-tl-sm" : "bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 rounded-tl-sm shadow-sm border border-gray-100 dark:border-slate-700"}`}>
                                {/* Product Card */}
                                {msg.product && msg.product.productId && (
                                  <div className={`flex items-center gap-2 p-2 border-b ${fromMe ? "border-white/20 bg-white/10" : "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50"}`}>
                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-white shrink-0">
                                      {msg.product.image ? <img src={msg.product.image} alt="" className="w-full h-full object-cover" /> : <Package size={20} className="w-full h-full p-2 text-gray-300" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-[11px] font-semibold truncate ${fromMe ? "text-white" : "text-gray-800 dark:text-slate-100"}`}>{msg.product.name}</p>
                                      <p className={`text-[11px] font-bold ${fromMe ? "text-yellow-200" : "text-red-500"}`}>
                                        {new Intl.NumberFormat('vi-VN').format(msg.product.price)}đ
                                      </p>
                                    </div>
                                  </div>
                                )}
                                <div className="px-3 py-2">
                                  {msg.isAI && <span className="inline-flex items-center px-1.5 py-px rounded-full bg-white/15 text-[8px] font-semibold mr-1">AI</span>}
                                  {msg.text}
                                  <div className={`text-[9px] mt-1 ${fromMe ? "text-white/60 text-right" : "text-gray-400"}`}>
                                    {c.fmtTime(msg.createdAt)}
                                    {fromMe && msg.isRead && <span className="ml-1">✓</span>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {c.sellerTyping && (
                        <div className="flex justify-start">
                          <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 dark:border-slate-700 flex gap-1">
                            <span className="w-1.5 h-1.5 bg-shopbee-blue/40 rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-shopbee-blue/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="w-1.5 h-1.5 bg-shopbee-blue/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                        </div>
                      )}
                    </>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageCircle size={40} className="text-gray-200 dark:text-slate-700 mb-2" />
                    <p className="text-xs text-gray-400">Chọn một cuộc trò chuyện để bắt đầu</p>
                  </div>
                )}
                <div ref={c.messagesEndRef} />
              </div>

              {/* Input Area */}
              {(isBot || c.selectedSellerId) && (
                <div className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700">
                  {/* Tagged Product Preview */}
                  {c.taggedProduct && !isBot && (
                    <div className="px-3 pt-2 flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-blue-50 dark:bg-slate-800 rounded-lg px-2.5 py-1.5 flex-1">
                        <div className="w-8 h-8 rounded overflow-hidden bg-white shrink-0 border border-gray-200">
                          {c.taggedProduct.image ? <img src={c.taggedProduct.image} alt="" className="w-full h-full object-cover" /> : <Package size={14} className="w-full h-full p-1 text-gray-300" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold text-gray-800 dark:text-slate-100 truncate">{c.taggedProduct.name}</p>
                          <p className="text-[10px] text-red-500 font-bold">{new Intl.NumberFormat('vi-VN').format(c.taggedProduct.price)}đ</p>
                        </div>
                        <button onClick={c.setTaggedProduct} className="text-gray-400 hover:text-red-500 transition-colors"><X size={14} /></button>
                      </div>
                    </div>
                  )}
                  {/* Product Picker Dropdown */}
                  {c.showProductPicker && !isBot && (
                    <div className="px-3 pt-2">
                      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-lg">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-gray-100 dark:border-slate-700">
                          <Search size={12} className="text-gray-400" />
                          <input type="text" value={c.productSearchText} onChange={e => c.setProductSearchText(e.target.value)} placeholder="Tìm sản phẩm..." autoFocus className="bg-transparent text-xs outline-none flex-1 text-gray-700 dark:text-slate-200 placeholder:text-gray-400" />
                          <button onClick={() => c.setShowProductPicker(false)} className="text-gray-400 hover:text-gray-600"><X size={12} /></button>
                        </div>
                        <div className="max-h-[140px] overflow-y-auto">
                          {c.searchingProducts ? (
                            <div className="p-3 text-center"><Loader2 size={14} className="animate-spin text-shopbee-blue mx-auto" /></div>
                          ) : c.productSearchResults.length === 0 ? (
                            <div className="p-3 text-center text-[10px] text-gray-400">{c.productSearchText ? "Không tìm thấy" : "Nhập tên sản phẩm"}</div>
                          ) : (
                            c.productSearchResults.map((p: any) => (
                              <button key={p._id || p.id} onClick={() => c.selectProduct(p)} className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left">
                                <div className="w-8 h-8 rounded overflow-hidden bg-gray-100 shrink-0">
                                  {(p.images?.[0] || p.image) ? <img src={p.images?.[0] || p.image} alt="" className="w-full h-full object-cover" /> : <Package size={14} className="w-full h-full p-1 text-gray-300" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] font-medium text-gray-800 dark:text-slate-100 truncate">{p.name}</p>
                                  <p className="text-[10px] text-red-500 font-bold">{new Intl.NumberFormat('vi-VN').format(p.salePrice || p.price)}đ</p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="p-3">
                    <div className="flex gap-2 bg-gray-100 dark:bg-slate-800 p-1.5 rounded-xl focus-within:ring-2 focus-within:ring-shopbee-blue/20 transition-all">
                      {!isBot && c.selectedSellerId && (
                        <button onClick={() => c.setShowProductPicker(!c.showProductPicker)} className={`p-2 rounded-lg transition-colors ${c.showProductPicker ? 'bg-shopbee-blue text-white' : 'text-gray-400 hover:text-shopbee-blue hover:bg-white dark:hover:bg-slate-700'}`} title="Tag sản phẩm">
                          <ShoppingBag size={16} />
                        </button>
                      )}
                      <input
                        type="text" value={c.messageText}
                        onChange={e => { c.setMessageText(e.target.value); if(!isBot) c.emitTyping(e.target.value.length > 0); }}
                        onKeyDown={e => { if(e.key === "Enter"){ e.preventDefault(); c.handleSend(); } }}
                        placeholder={placeholder}
                        className="flex-1 bg-transparent px-3 py-1.5 text-sm outline-none text-gray-800 dark:text-slate-100 placeholder:text-gray-400"
                      />
                      <button
                        onClick={c.handleSend}
                        disabled={(!c.messageText.trim() && !c.taggedProduct) || c.sending || c.botTyping}
                        className="liquid-btn text-white p-2 rounded-lg disabled:opacity-40 transition-all"
                      >
                        {(c.sending || c.botTyping) ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale:1.08 }} whileTap={{ scale:0.92 }}
        onClick={() => c.setIsOpen(!c.isOpen)}
        className="fixed z-50 bottom-6 right-6 liquid-btn text-white p-4 rounded-3xl shadow-2xl shadow-shopbee-blue/30 group overflow-hidden flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={c.isOpen?"c":"o"} initial={{rotate:-90,scale:0}} animate={{rotate:0,scale:1}} exit={{rotate:90,scale:0}} transition={{duration:0.2}}>
            {c.isOpen ? <X size={28} /> : <MessageCircle size={28} />}
          </motion.div>
        </AnimatePresence>
        {!c.isOpen && c.unreadTotal > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 min-w-5 h-5 px-1 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
            {c.unreadTotal > 9 ? "9+" : c.unreadTotal}
          </span>
        )}
      </motion.button>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-slate-700"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                  <Trash2 size={18} className="text-red-500" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 dark:text-white text-sm">Xóa cuộc trò chuyện</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Với <span className="font-semibold text-gray-700 dark:text-gray-200">{deleteTarget.name}</span></p>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
                Bạn có chắc chắn muốn xóa toàn bộ tin nhắn trong cuộc trò chuyện này không? Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={async () => {
                    setDeleting(true);
                    await c.deleteConversation(deleteTarget.id);
                    setDeleting(false);
                    setDeleteTarget(null);
                  }}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {deleting ? <><Loader2 size={13} className="animate-spin" /> Đang xóa...</> : <><Trash2 size={13} /> Xóa</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default UnifiedChat;
