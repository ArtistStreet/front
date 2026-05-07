import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { productApi } from "../utils/api";
import { SOCKET_URL } from "../utils/runtimeConfig";
import type { ChatConversation, ChatMessage, Product } from "../types";
import { io, Socket } from "socket.io-client";

export interface TaggedProduct {
  productId: string;
  name: string;
  image: string;
  price: number;
}

interface BotMsg { id: number; text: string; sender: "user"|"bot"; timestamp: Date; }

const formatBot = (t: string) => t
  .replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")
  .replace(/__(.+?)__/g,"<strong>$1</strong>")
  .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g,"<em>$1</em>")
  .replace(/^[-•]\s+(.+)$/gm,"<li>$1</li>")
  .replace(/^\d+\.\s+(.+)$/gm,"<li>$1</li>")
  .replace(/((?:<li>.*<\/li>\n?)+)/g,"<ul class='ml-3 list-disc space-y-0.5'>$1</ul>")
  .replace(/\n/g,"<br/>");

export type ActiveChat = { type: "bot" } | { type: "seller"; sellerId: string };

export function useChatLogic() {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<ActiveChat>({ type: "bot" });
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [sellerMessages, setSellerMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [sellerTyping, setSellerTyping] = useState(false);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [taggedProduct, setTaggedProduct] = useState<TaggedProduct | null>(null);
  const [productSearchText, setProductSearchText] = useState("");
  const [productSearchResults, setProductSearchResults] = useState<Product[]>([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [searchingProducts, setSearchingProducts] = useState(false);

  // Bot state
  const [botMessages, setBotMessages] = useState<BotMsg[]>([
    { id:1, text:"Xin chào! Tôi là trợ lý ảo của ShopBee. Tôi có thể giúp gì cho bạn?", sender:"bot", timestamp:new Date() }
  ]);
  const [botTyping, setBotTyping] = useState(false);

  const socketRef = useRef<Socket|null>(null);
  const msgIdsRef = useRef<Set<string>>(new Set());
  const activeChatRef = useRef<ActiveChat>({ type: "bot" });
  const messagesEndRef = useRef<HTMLDivElement|null>(null);

  const currentUserId = String(user?.id || ((user as {_id?:string}|null)?._id ?? ""));
  const isSeller = user?.role === "seller" || user?.role === "admin";
  const selectedSellerId = activeChat.type === "seller" ? activeChat.sellerId : null;

  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [sellerMessages, botMessages, sellerTyping, botTyping]);

  // Events
  useEffect(() => {
    const h1 = () => { setActiveChat({ type:"bot" }); setIsOpen(true); };
    const h2 = (e:Event) => {
      const d = (e as CustomEvent).detail;
      if(d?.sellerId){ setActiveChat({ type:"seller", sellerId:d.sellerId }); setIsOpen(true); }
    };
    window.addEventListener("open-chatbot", h1);
    window.addEventListener("open-customer-chat", h2);
    return () => { window.removeEventListener("open-chatbot", h1); window.removeEventListener("open-customer-chat", h2); };
  }, []);

  const fetchConvs = useCallback(async (loader=true) => {
    if(!token||!user) return;
    try {
      if(loader) setLoadingConvs(true);
      const r = await productApi.getChatConversations(token);
      setConversations(r.data);
      setUnreadTotal(r.data.reduce((s:number,c:ChatConversation)=>s+(c.unreadCount||0),0));
    } catch(e){ console.error(e); }
    finally { if(loader) setLoadingConvs(false); }
  }, [token, user]);

  // Socket
  useEffect(() => {
    if(!token||!user) return;
    const socket = io(SOCKET_URL, { transports:["websocket"] });
    socketRef.current = socket;
    socket.emit("chat:join", { userId: currentUserId });

    socket.on("chat:newMessage", (p:any) => {
      if(!p) return;
      // Support both roles: customer sees messages where they are customer, seller sees where they are seller
      const isMyMessage = isSeller
        ? String(p.sellerId)===currentUserId
        : String(p.customerId)===currentUserId;
      if(!isMyMessage) return;
      const ac = activeChatRef.current;
      const activeSid = ac.type==="seller" ? ac.sellerId : null;
      setConversations(prev => {
        const matchKey = isSeller ? String(p.customerId) : String(p.sellerId);
        const i = prev.findIndex(c=>String(c.sellerId)===String(p.sellerId) || String(c.partnerId)===matchKey);
        if(i===-1){ setTimeout(()=>fetchConvs(false),0); return prev; }
        const u=[...prev]; const cv={...u[i]};
        cv.lastMessage=p.text; cv.lastSender=p.sender; cv.lastAt=p.createdAt;
        const otherSender = isSeller ? "customer" : "seller";
        if(p.sender===otherSender&&String(p.sellerId)!==activeSid) cv.unreadCount+=1;
        u.splice(i,1); u.unshift(cv); return u;
      });
      if(String(p.sellerId)===activeSid){
        if(msgIdsRef.current.has(p.id)) return;
        msgIdsRef.current.add(p.id);
        setSellerMessages(prev=>[...prev,{ id:p.id, text:p.text, sender:p.sender, createdAt:p.createdAt, isRead:p.isRead??false, isAI:p.isAI??false }]);
      }
      const otherSender = isSeller ? "customer" : "seller";
      if(p.sender===otherSender) setUnreadTotal(prev=>prev+1);
    });
    socket.on("chat:typing",(p:any)=>{
      if(!p) return;
      const isRelevant = isSeller ? String(p.sellerId)===currentUserId : String(p.customerId)===currentUserId;
      if(!isRelevant) return;
      const ac=activeChatRef.current;
      const isOtherTyping = isSeller ? p.isFromCustomer : !p.isFromCustomer;
      if(ac.type==="seller"&&String(p.sellerId)===ac.sellerId&&isOtherTyping) setSellerTyping(!!p.typing);
    });
    socket.on("chat:read",(p:any)=>{
      if(!p) return;
      const isRelevant = isSeller ? String(p.sellerId)===currentUserId : String(p.customerId)===currentUserId;
      if(!isRelevant) return;
      const myRole = isSeller ? "seller" : "customer";
      if(p.reader!==myRole) setSellerMessages(prev=>prev.map(m=>m.sender===myRole?{...m,isRead:true}:m));
    });
    socket.on("chat:presence:list",(p:any)=>{ setOnlineIds(new Set((p?.userIds||[]).map(String))); });
    socket.on("chat:presence",(p:any)=>{
      if(!p?.userId) return;
      setOnlineIds(prev=>{ const u=new Set(prev); p.isOnline?u.add(String(p.userId)):u.delete(String(p.userId)); return u; });
    });
    return ()=>{ socket.disconnect(); socketRef.current=null; };
  }, [token, user, isSeller, currentUserId, fetchConvs]);

  useEffect(()=>{ if(isOpen&&token&&user) fetchConvs(); },[isOpen,token,user,fetchConvs]);

  useEffect(()=>{
    if(!token||!selectedSellerId||!user) return;
    (async()=>{
      setLoadingMsgs(true);
      try{
        const r=await productApi.getChatMessages(token,selectedSellerId);
        setSellerMessages(r.data); msgIdsRef.current=new Set(r.data.map((m:ChatMessage)=>m.id));
        setConversations(prev=>prev.map(c=>String(c.partnerId)===selectedSellerId?{...c,unreadCount:0}:c));
      }catch(e){console.error(e);}
      finally{setLoadingMsgs(false);}
    })();
  },[token,selectedSellerId,user]);

  // Polling
  useEffect(()=>{
    if(!token||!selectedSellerId||!isOpen) return;
    const t=setInterval(()=>{
      fetchConvs(false);
      productApi.getChatMessages(token,selectedSellerId).then(r=>{
        setSellerMessages(r.data); msgIdsRef.current=new Set(r.data.map((m:ChatMessage)=>m.id));
      }).catch(()=>{});
    },8000);
    return ()=>clearInterval(t);
  },[token,selectedSellerId,isOpen,fetchConvs]);

  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim() || !selectedSellerId) { setProductSearchResults([]); return; }
    setSearchingProducts(true);
    try {
      const r = await productApi.getAll({ search: query, seller: selectedSellerId, limit: "5" });
      const data = Array.isArray(r.data) ? r.data : [];
      setProductSearchResults(data.slice(0, 5));
    } catch (e) { console.error(e); setProductSearchResults([]); }
    finally { setSearchingProducts(false); }
  }, [selectedSellerId]);

  useEffect(() => {
    const t = setTimeout(() => { if (productSearchText.trim()) searchProducts(productSearchText); else setProductSearchResults([]); }, 300);
    return () => clearTimeout(t);
  }, [productSearchText, searchProducts]);

  const selectProduct = useCallback((p: Product) => {
    const img = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : (p as any).image || "";
    setTaggedProduct({ productId: String((p as any)._id || (p as any).id), name: p.name, image: img, price: p.salePrice || p.price });
    setShowProductPicker(false);
    setProductSearchText("");
    setProductSearchResults([]);
  }, []);

  const removeTaggedProduct = useCallback(() => { setTaggedProduct(null); }, []);

  const sendSellerMsg = useCallback(async()=>{
    if(!token||!selectedSellerId||(!messageText.trim()&&!taggedProduct)) return;
    setSending(true);
    try{
      const txt = messageText.trim() || (taggedProduct ? `Sản phẩm: ${taggedProduct.name}` : "");
      const r=await productApi.sendChatMessage(txt,token,selectedSellerId,undefined,taggedProduct||undefined);
      const s=r.data;
      if(!msgIdsRef.current.has(s.id)){ msgIdsRef.current.add(s.id); setSellerMessages(prev=>[...prev,s]); }
      setConversations(prev=>{
        const i=prev.findIndex(c=>String(c.partnerId)===selectedSellerId);
        if(i===-1){ setTimeout(()=>fetchConvs(false),100); return prev; }
        const u=[...prev]; const cv={...u[i]}; cv.lastMessage=s.text; cv.lastSender=isSeller?"seller":"customer"; cv.lastAt=s.createdAt;
        u.splice(i,1); u.unshift(cv); return u;
      });
      setMessageText(""); setTaggedProduct(null);
    }catch(e){console.error(e);}
    finally{setSending(false);}
  },[token,selectedSellerId,messageText,taggedProduct,fetchConvs]);

  const sendBotMsg = useCallback(async()=>{
    if(!messageText.trim()) return;
    const um:BotMsg = { id:Date.now(), text:messageText, sender:"user", timestamp:new Date() };
    setBotMessages(prev=>[...prev,um]);
    const q=messageText; setMessageText(""); setBotTyping(true);
    try{
      const r=await productApi.chatbot(q);
      const reply=r.data.success?r.data.reply:r.data.response||"Xin lỗi, tôi chưa hiểu.";
      setBotMessages(prev=>[...prev,{ id:Date.now()+1, text:reply, sender:"bot", timestamp:new Date() }]);
    }catch(e:any){
      const et=e.response?.data?.error||"Xin lỗi, có lỗi xảy ra!";
      setBotMessages(prev=>[...prev,{ id:Date.now()+1, text:et, sender:"bot", timestamp:new Date() }]);
    }finally{ setBotTyping(false); }
  },[messageText]);

  const handleSend = activeChat.type==="bot" ? sendBotMsg : sendSellerMsg;

  const emitTyping = useCallback((typing:boolean)=>{
    if(socketRef.current&&selectedSellerId){
      socketRef.current.emit("chat:typing",{ sellerId:selectedSellerId, customerId:currentUserId, typing, isFromCustomer:true });
    }
  },[selectedSellerId,currentUserId]);

  const activeConv = useMemo(()=>conversations.find(c=>String(c.partnerId)===selectedSellerId),[conversations,selectedSellerId]);
  const isSellerOnline = useMemo(()=>!!selectedSellerId&&onlineIds.has(selectedSellerId),[selectedSellerId,onlineIds]);

  const filteredConvs = useMemo(()=>{
    if(!searchText.trim()) return conversations;
    const q=searchText.toLowerCase();
    return conversations.filter(c=>c.name.toLowerCase().includes(q)||c.email.toLowerCase().includes(q));
  },[conversations,searchText]);

  const fmtTime = (v:string)=>{ const d=new Date(v); return isNaN(d.getTime())?"":d.toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"}); };

  const deleteConversation = useCallback(async(partnerId:string)=>{
    if(!token) return;
    try{
      await productApi.deleteChatConversation(token, partnerId);
      setConversations(prev=>prev.filter(c=>String(c.partnerId)!==partnerId));
      if(selectedSellerId===partnerId){
        setActiveChat({type:"bot"});
        setSellerMessages([]);
      }
    }catch(e){console.error(e);}
  },[token,selectedSellerId]);

  return {
    user, isSeller, isOpen, setIsOpen, activeChat, setActiveChat,
    conversations: filteredConvs, allConversations: conversations,
    sellerMessages, botMessages, messageText, setMessageText,
    loadingConvs, loadingMsgs, sending, sellerTyping, botTyping,
    onlineIds, unreadTotal, searchText, setSearchText,
    messagesEndRef, handleSend, emitTyping,
    activeConv, isSellerOnline, selectedSellerId, fmtTime, formatBot,
    taggedProduct, setTaggedProduct: removeTaggedProduct,
    showProductPicker, setShowProductPicker,
    productSearchText, setProductSearchText,
    productSearchResults, searchingProducts, selectProduct,
    deleteConversation,
  };
}

export { formatBot };
