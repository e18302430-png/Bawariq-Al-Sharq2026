import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, HelpCircle, Phone, ArrowRight, Send, RefreshCw, Layers, ShieldCheck, Clock, Search, ExternalLink, LifeBuoy, Zap, Sparkles, AlertTriangle, Check } from "lucide-react";

const QUICK_ISSUES = [
  {
    id: "jahez_hunger",
    title: "تفعيل كود جاهز / هنقرستيشن ⚡",
    desc: "طلب ربط الكود وتفعيل الحساب للبدء في توصيل الطلبات فوراً",
    category: "ربط وتفعيل الكود وتطبيقات التوصيل (جاهز/هنقر)",
    subject: "طلب ربط وتفعيل كود جاهز / هنقرستيشن",
    message: "أرجو من الإدارة الكريمة تفعيل كود بوارق الخاص بي على تطبيقات التوصيل لكي أتمكن من بدء العمل الميداني فوراً. كافة مستنداتي المرفوعة مكتملة وصحيحة."
  },
  {
    id: "iban_change",
    title: "تحديث الآيبان أو رقم الجوال 🏦",
    desc: "تعديل الحساب المصرفي (IBAN) لاستلام الأرباح والتمويل المالي",
    category: "تحديث رقم الآيبان البنكي (IBAN) أو الهوية",
    subject: "تحديث بيانات الحساب المصرفي والآيبان البنكي",
    message: "أريد تحديث معلومات الآيبان البنكي (IBAN) أو تعديل المعلومات للتأكد من ربط الحساب المالي الجديد واستلام مستحقاتي والتصفية بانتظام وبدون تأخير."
  },
  {
    id: "interview_delay",
    title: "جدولة مواعيد المقابلة الشخصية 🗓️",
    desc: "طلب تفعيل سريع لموعد المقابلة أو رغبة في إعادة ترتيب الحضور",
    category: "تأخير في جدولة أو تغيير موعد المقابلة",
    subject: "تأجيل أو استعجال موعد المقابلة الشخصية",
    message: "أرجو مساعدتي في تسريع موعد مقابلتي الشخصية وتحديد موعد تشغيلي مناسب لي للبدء بالعمل تحت مظلة بوارق."
  },
  {
    id: "other_complaints",
    title: "إفادة، شكوى أو مشكلة أخرى 💬",
    desc: "ملاحظة تشغيلية ميدانية أو شكوى عاجلة لمدير ومسؤول الدعم",
    category: "اقتراحات، شكاوى وإفادات تشغيلية",
    subject: "طلب دعم بخصوص تحدي ميداني أو تقني",
    message: "أرغب في تفصيل مشكلة تشغيلية أواجهها بالميدان مع مشرف الدعم المباشر لإيجاد حل فوري وسلس."
  }
];

export default function SupportPortal() {
  const [activeTab, setActiveTab] = useState<"new-ticket" | "track-tickets">("new-ticket");
  const [selectedQuickId, setSelectedQuickId] = useState<string | null>(null);
  
  // Create ticket state
  const [ticketForm, setTicketForm] = useState({
    name: "",
    phone: "",
    category: "ربط وتفعيل الكود وتطبيقات التوصيل (جاهز/هنقر)",
    subject: "",
    message: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [createdTicketId, setCreatedTicketId] = useState("");
  
  // Track tickets state
  const [searchPhone, setSearchPhone] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [foundTickets, setFoundTickets] = useState<any[]>([]);
  
  // Active chat state
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [newMessageText, setNewMessageText] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [chatRefreshCooldown, setChatRefreshCooldown] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const prevMessagesCountRef = useRef(0);

  // Auto-fill phone if saved in localStorage
  useEffect(() => {
    const savedPhone = localStorage.getItem("bawariq_courier_phone");
    const savedName = localStorage.getItem("bawariq_courier_name");
    if (savedPhone) {
      setTicketForm(prev => ({ ...prev, phone: savedPhone, name: savedName || "" }));
      setSearchPhone(savedPhone);
      // Auto search if has phone on load
      fetchTicketsByPhone(savedPhone);
    }
  }, []);

  // WebAudio API Sound Generator API
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, audioCtx.currentTime + 0.12); // G5
      
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.4);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.log("Audio play blocked by browser sandbox:", e);
    }
  };

  // Sound trigger on new replies
  useEffect(() => {
    if (!activeTicket?.messages) {
      prevMessagesCountRef.current = 0;
      return;
    }
    const currentCount = activeTicket.messages.length;
    if (currentCount > prevMessagesCountRef.current) {
      const lastMsg = activeTicket.messages[currentCount - 1];
      if (lastMsg && lastMsg.sender === "admin" && prevMessagesCountRef.current > 0) {
        playChime();
      }
    }
    prevMessagesCountRef.current = currentCount;
  }, [activeTicket?.messages]);

  // Auto scroll chat to bottom when activeTicket message changes
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeTicket?.messages]);

  // Handle active chat polling (snappy live updates - super fast 3 seconds polling)
  useEffect(() => {
    if (!activeTicket) return;

    const interval = setInterval(() => {
      fetchSingleTicketUpdate(activeTicket.id);
    }, 3000); // 3 seconds for extremely direct communication feel

    return () => clearInterval(interval);
  }, [activeTicket?.id]);

  const fetchSingleTicketUpdate = async (id: string) => {
    try {
      const res = await fetch(`/api/support/tickets/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.ticket) {
          setActiveTicket(data.ticket);
        }
      }
    } catch (e) {
      console.error("Error polling ticket update", e);
    }
  };

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setIsSubmitting(true);

    if (!ticketForm.name || !ticketForm.phone || !ticketForm.subject || !ticketForm.message) {
      setSubmitError("الرجاء ملء كافة حقول الاستمارة لرفع التذكرة بنجاح");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticketForm)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "خطأ أثناء محاولة فتح التذكرة");
      }

      // Save credentials for easier future tracking
      localStorage.setItem("bawariq_courier_phone", ticketForm.phone);
      localStorage.setItem("bawariq_courier_name", ticketForm.name);

      setCreatedTicketId(data.ticket.id);
      setActiveTicket(data.ticket); // Jump straight into the live chat!
      setFoundTickets(prev => {
        if (prev.some(t => t.id === data.ticket.id)) return prev;
        return [data.ticket, ...prev];
      });
      setActiveTab("track-tickets");
      setTicketForm(prev => ({ ...prev, subject: "", message: "" })); // reset fields
    } catch (err: any) {
      setSubmitError(err.message || "حدث خطأ غير متوقع بالاتصال بالخادم الرئيسي");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchTicketsByPhone = async (phoneToSearch: string) => {
    if (!phoneToSearch) return;
    setIsSearching(true);
    setSearchError("");

    try {
      const res = await fetch("/api/support/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneToSearch })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل جلب قائمة التذاكر الخاصة بك");
      }

      setFoundTickets(data.tickets || []);
      if (data.tickets && data.tickets.length > 0) {
        localStorage.setItem("bawariq_courier_phone", phoneToSearch);
      }
    } catch (err: any) {
      setSearchError(err.message || "عذرًا، تعذر العثور على أي اتصالات برقم الجوال هذا");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTicketsByPhone(searchPhone);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeTicket) return;

    setIsSendingMessage(true);
    try {
      const res = await fetch(`/api/support/tickets/${activeTicket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: "courier",
          text: newMessageText
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل إرسال التعليق");
      }

      setActiveTicket(data.ticket);
      setNewMessageText("");
      // Update local listing instantly without loading flickering
      setFoundTickets(prev => prev.map(t => t.id === data.ticket.id ? data.ticket : t));
    } catch (err: any) {
      alert("عذراً، لم نتمكن من إرسال رسالتك: " + err.message);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleManualRefresh = async () => {
    if (chatRefreshCooldown || !activeTicket) return;
    setChatRefreshCooldown(true);
    await fetchSingleTicketUpdate(activeTicket.id);
    setTimeout(() => setChatRefreshCooldown(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in" id="support-portal-container">
      {/* Header section with 3D feel */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-2 border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-[5px_5px_0px_0px_rgba(245,158,11,0.15)]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -z-10 animate-pulse"></div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative">
          <div className="space-y-3 text-center md:text-right">
            <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full text-[11px] font-bold text-amber-400">
              <LifeBuoy className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>مركز الدعم الفني والمساعدة المباشر للمناديب 🎧</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white">تحتاج لمساعدة؟ تواصل معنا فوراً</h2>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              هذه الواجهة مخصصة لكباتن ومناديب بوارق الشرق الأبطال. يمكنك إدخال مشكلتك أو استفسارك، وسيقوم مسؤول الدعم المباشر بالرد عليك ومتابعة حالتك بشكل متطور وفي أسرع وقت ممكن.
            </p>
          </div>

          <button
            onClick={() => { window.location.hash = ""; }}
            className="flex-shrink-0 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-slate-950"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة لصفحة التسجيل</span>
          </button>
        </div>
      </div>

      {/* Main interface Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation panel */}
        <div className="lg:col-span-3 flex lg:flex-col gap-3">
          <button
            onClick={() => { setActiveTab("new-ticket"); setActiveTicket(null); }}
            className={`flex-1 flex items-center justify-center lg:justify-start gap-2.5 px-4 py-3.5 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
              activeTab === "new-ticket" && !activeTicket
                ? "bg-amber-500 text-slate-950 border-amber-400 font-black shadow-[3px_3px_0px_0px_rgba(245,158,11,0.3)]"
                : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-900"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>طلب دعم فني جديد</span>
          </button>

          <button
            onClick={() => setActiveTab("track-tickets")}
            className={`flex-1 flex items-center justify-center lg:justify-start gap-2.5 px-4 py-3.5 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
              activeTab === "track-tickets" || activeTicket
                ? "bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-[3px_3px_0px_0px_rgba(6,182,212,0.3)]"
                : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-900"
            }`}
          >
            <MessageSquare className="w-4 h-4 animate-pulse" />
            <span>تذاكري ومحادثاتي</span>
            {foundTickets.length > 0 && (
              <span className="bg-slate-950 text-cyan-400 rounded-full w-4.5 h-4.5 text-[9px] font-mono font-bold flex items-center justify-center ml-auto">
                {foundTickets.length}
              </span>
            )}
          </button>
        </div>

        {/* Dynamic content space */}
        <div className="lg:col-span-9">
          {activeTicket ? (
            /* Active Live Chat Interface */
            <div className="bg-slate-905 border-2 border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[550px] [transform-style:preserve-3d] shadow-[4px_4px_0px_0px_rgba(6,182,212,0.2)]">
              {/* Chat Header */}
              <div className="bg-slate-900/80 p-4 border-b border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono text-sm shadow-inner">
                    {activeTicket.id}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                      <span>{activeTicket.subject}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                        activeTicket.status === "جديد" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        activeTicket.status === "قيد المتابعة" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" :
                        activeTicket.status === "تم الرد" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 animate-pulse" :
                        "bg-slate-800 text-slate-400"
                      }`}>
                        {activeTicket.status}
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      المندوب: {activeTicket.courierName} • {activeTicket.category}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleManualRefresh}
                    disabled={chatRefreshCooldown}
                    className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all hover:border-slate-700 disabled:opacity-45 cursor-pointer"
                    title="تحديث فوري للمحادثة"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${chatRefreshCooldown ? "animate-spin text-cyan-400" : ""}`} />
                  </button>
                  <button
                    onClick={() => setActiveTicket(null)}
                    className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-[10px] font-bold text-slate-300 transition-all cursor-pointer"
                  >
                    عرض كل التذاكر
                  </button>
                </div>
              </div>

              {/* Chat Live Network Stats Banner */}
              <div className="bg-slate-950/80 px-4 py-2 border-b border-slate-900 flex items-center justify-between text-[10px] text-cyan-400 select-none font-sans font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>الخط الساخن نَشِط • كفاءة الاتصال فائقة السرعة</span>
                </div>
                <div className="text-slate-500 font-mono text-[9px]">
                  بروتوكول بوارق السريع ⚡ زمن الاستجابة حقيقي ~ 8ms
                </div>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-950/40">
                {activeTicket.messages.map((m: any) => {
                  const isAdmin = m.sender === "admin";
                  return (
                    <div 
                      key={m.id} 
                      className={`flex ${isAdmin ? "justify-start" : "justify-end"} items-end gap-2 animate-fade-in`}
                    >
                      {isAdmin && (
                        <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] flex items-center justify-center shadow-lg" title="مدير الدعم الفني">
                          B
                        </div>
                      )}
                      <div className={`max-w-[80%] rounded-2xl p-3.5 text-xs text-right space-y-1 ${
                        isAdmin 
                          ? "bg-slate-900 border border-amber-500/20 text-slate-150 rounded-br-none shadow-[2px_2px_10px_rgba(0,0,0,0.3)]" 
                          : "bg-cyan-500 text-slate-950 font-semibold rounded-bl-none shadow-[2px_2px_0px_rgba(6,182,212,0.25)]"
                      }`}>
                        {isAdmin && (
                          <div className="text-[9px] text-amber-400 font-extrabold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-amber-500" />
                            <span>دعم بوارق اللوجستي المباشر</span>
                          </div>
                        )}
                        <p className="whitespace-pre-line leading-relaxed tracking-wide">{m.text}</p>
                        <span className={`block text-[8px] text-left font-mono ${isAdmin ? "text-slate-500" : "text-slate-900/60 font-bold"}`}>
                          {new Date(m.createdAt).toLocaleTimeString("ar-SA", { hour: "numeric", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              {activeTicket.status === "مغلق" ? (
                <div className="p-4 bg-slate-900/40 border-t border-slate-850 text-center text-slate-550 text-xs font-bold font-sans">
                  🔒 تم إغلاق ملف هذه التذكرة تشغيلياً من قبل الإدارة. يمكن فتح تذكرة جديدة إذا لزم الأمر.
                </div>
              ) : (
                <div className="bg-slate-900/80 border-t border-slate-800 p-3 space-y-2">
                  {/* Quick-reply shortcut pills for fast communication */}
                  <div className="flex flex-wrap items-center gap-1.5 justify-end">
                    <span className="text-[9px] text-slate-500 font-bold ml-1">رد سريع:</span>
                    {[
                      "تحديث: تم القيام بالمطلوب كابتن 👍",
                      "يرجى تأكيد التفعيل للدخول الميداني 🚀",
                      "ألف شكر لدعم بوارق السريع والراقي 🌹"
                    ].map((pill, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewMessageText(pill)}
                        className="px-2.5 py-1 text-[9px] bg-slate-950 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900 rounded-full text-slate-400 hover:text-cyan-400 transition-all cursor-pointer"
                      >
                        {pill}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      placeholder="اكتب رسالتك للمشؤل المباشر هنا..."
                      className="flex-grow px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-650 font-sans"
                    />
                    <button
                      type="submit"
                      disabled={isSendingMessage || !newMessageText.trim()}
                      className="px-5 py-3 bg-cyan-500 hover:bg-cyan-600 font-extrabold text-slate-950 rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-45 cursor-pointer shadow-md shadow-cyan-500/10 active:scale-[0.98]"
                    >
                      <span>إرسال</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : activeTab === "new-ticket" ? (
            /* Create Ticket Form with Express Flow */
            <div className="space-y-6">
              {/* Live Support Metrics Ribbon */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900/60 border border-slate-850 p-3.5 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">متوسط الاستجابة اليوم</span>
                    <span className="text-xs text-cyan-400 font-black">أقل من 3 دقائق ⚡</span>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-850 p-3.5 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">إغلاق ومعالجة الشكاوى</span>
                    <span className="text-xs text-emerald-400 font-black">جاهزية فورية 100% 🛡️</span>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-850 p-3.5 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                    <LifeBuoy className="w-5 h-5 animate-spin-slow" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">مسؤلو المراجعة المباشرة</span>
                    <span className="text-xs text-amber-400 font-black">نشطين الآن بالخدمة 🟢</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCreateTicketSubmit} className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl space-y-6">
                <div className="border-b border-slate-850 pb-4 space-y-1">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>تقديم شكوى أو استفسار فوري متطور</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    لتسهيل الإجراءات وتسريع التفعيل بمعدل فائق، اختر نوع مشكلتك من لوحة الخيارات السريعة أدناه لتعبئة تفاصيل الشكوى فوراً وبكبسة زر واحدة.
                  </p>
                </div>

                {submitError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-bold arab-digits flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>⚠️ {submitError}</span>
                  </div>
                )}

                {/* 1-Click Fast Problem Selectors (Bento Grid) */}
                <div className="space-y-2.5">
                  <label className="text-xs text-slate-350 font-extrabold flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>خيارات ملء سريعة (اختر لملء الاستمارة تلقائياً بنقرة واحدة):</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {QUICK_ISSUES.map((issue) => {
                      const isSelected = selectedQuickId === issue.id;
                      return (
                        <button
                          key={issue.id}
                          type="button"
                          onClick={() => {
                            setSelectedQuickId(issue.id);
                            setTicketForm(prev => ({
                              ...prev,
                              category: issue.category,
                              subject: issue.subject,
                              message: issue.message
                            }));
                          }}
                          className={`text-right p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-full relative overflow-hidden group select-none ${
                            isSelected
                              ? "bg-gradient-to-br from-amber-500/15 via-slate-950 to-slate-950 border-amber-500 shadow-[0px_0px_15px_rgba(245,158,11,0.1)]"
                              : "bg-slate-950/60 border-slate-850 hover:border-slate-700 hover:bg-slate-950 text-slate-300"
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 left-2 bg-amber-500 text-slate-950 w-4 h-4 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[4]" />
                            </div>
                          )}
                          <div className="space-y-1 pr-1">
                            <h4 className={`text-xs font-black transition-colors ${isSelected ? "text-amber-400" : "text-white group-hover:text-amber-400"}`}>
                              {issue.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 leading-relaxed font-sans line-clamp-2">
                              {issue.desc}
                            </p>
                          </div>
                          <div className="mt-3 text-[8.5px] font-mono text-slate-500 text-left border-t border-slate-900/60 pt-2 font-bold uppercase tracking-tight">
                            فئة: {issue.category.split(" (")[0]}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Primary input fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-slate-850 pt-5">
                  {/* Name fields */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-bold block">الاسم الكريم بالكامل</label>
                    <input
                      type="text"
                      required
                      value={ticketForm.name}
                      onChange={(e) => setTicketForm({...ticketForm, name: e.target.value})}
                      placeholder="الاسم الثلاثي أو الثنائي لمطابقة الهوية"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all font-sans"
                    />
                  </div>

                  {/* Phone field */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-bold block max-sm:text-right">رقم الجوال الخاص بك</label>
                    <input
                      type="tel"
                      required
                      value={ticketForm.phone}
                      onChange={(e) => setTicketForm({...ticketForm, phone: e.target.value})}
                      placeholder="مثال: 05XXXXXXXX"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 font-mono tracking-wider focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all text-right"
                    />
                  </div>
                </div>

                {/* Category dropdown selection */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-bold block font-sans">تصنيف وفئة الاستفسار</label>
                  <select
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm({...ticketForm, category: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer text-right font-sans"
                  >
                    <option value="ربط وتفعيل الكود وتطبيقات التوصيل (جاهز/هنقر)">ربط وتفعيل الكود وتطبيقات التوصيل (جاهز/هنقر)</option>
                    <option value="مشكلة بالتسجيل وتأكيد الحساب">مشكلة بالتسجيل وتأكيد الحساب</option>
                    <option value="تأخير في جدولة أو تغيير موعد المقابلة">تأخير في جدولة أو تغيير موعد المقابلة</option>
                    <option value="تحديث رقم الآيبان البنكي (IBAN) أو الهوية">تحديث رقم الآيبان البنكي (IBAN) أو الهوية</option>
                    <option value="اقتراحات، شكاوى وإفادات تشغيلية">اقتراحات، شكاوى وإفادات تشغيلية</option>
                    <option value="أخرى / تفصيل إضافي">أخرى / تفصيل إضافي</option>
                  </select>
                </div>

                {/* Subject text */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-bold block font-sans">موضوع المشكلة باختصار</label>
                  <input
                    type="text"
                    required
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})}
                    placeholder="مثال: واجهتني مشكلة بربط حساب جاهز أو لم أحصل على الكود"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all font-sans"
                  />
                </div>

                {/* Message Description */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-bold block font-sans">شرح المشكلة بالتفصيل ومطلبك</label>
                  <textarea
                    required
                    rows={4}
                    value={ticketForm.message}
                    onChange={(e) => setTicketForm({...ticketForm, message: e.target.value})}
                    placeholder="الرجاء توضيح أي تفاصيل تسرّع الرد وحل المشكلة، نتشرف بخدمتكم في بوارق..."
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all resize-none leading-relaxed font-sans"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl cursor-pointer hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-500/10"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>جاري إرسال الطلب وحجز ممر الدعم كابتن...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>إرسال التذكرة وبدء ممر المحادثة الفورية</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Search and list all courier tickets */
            <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl space-y-6">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-slate-850 pb-3">
                <Search className="w-4 h-4 text-cyan-400" />
                <span>البحث الذكي عن تذاكرك السابقة والردود</span>
              </h3>

              <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-grow space-y-1.5 w-full">
                  <label className="text-xs text-slate-400 font-bold block">أدخل رقم جوالك المسجل للبحث</label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={searchPhone}
                      onChange={(e) => setSearchPhone(e.target.value)}
                      placeholder="مثال: 05XXXXXXXX"
                      className="w-full px-4 py-3 pr-10 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 font-mono tracking-wider focus:outline-none focus:border-cyan-500 transition-colors text-right"
                    />
                    <Phone className="w-4 h-4 text-slate-650 absolute top-3.5 right-3.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSearching}
                  className="w-full sm:w-auto px-6 py-3.5 bg-cyan-400 hover:bg-cyan-500 font-extrabold text-slate-950 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-cyan-400/10 shrink-0"
                >
                  {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>البحث وتنزيل التذاكر</span>
                </button>
              </form>

              {searchError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs text-center font-bold font-sans">
                  ⚠️ {searchError}
                </div>
              )}

              {/* Found tickets grid */}
              <div className="space-y-4">
                {foundTickets.length === 0 ? (
                  <div className="p-10 text-center border border-dashed border-slate-800 rounded-xl text-slate-550 space-y-2">
                    <MessageSquare className="w-8 h-8 mx-auto opacity-35 text-slate-400" />
                    <p className="text-xs font-bold">لا يوجد تذاكر معلّقة أو سابقة مسجلة لرقم هذا الجوال حالياً</p>
                    <p className="text-[10px] text-slate-600">يمكنك الانتقال لعلامة التبويب "طلب دعم فني جديد" لرفع تذكرة فورية.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {foundTickets.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setActiveTicket(t)}
                        className="p-4 bg-slate-950/65 border border-slate-850 hover:border-cyan-500/50 rounded-xl transition-all cursor-pointer group text-right flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] text-slate-500 font-extrabold">ID: {t.id}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                              t.status === "جديد" ? "bg-amber-500/15 text-amber-500" :
                              t.status === "قيد المتابعة" ? "bg-cyan-500/15 text-cyan-400" :
                              t.status === "تم الرد" ? "bg-emerald-500/15 text-emerald-400" :
                              "bg-slate-850 text-slate-400"
                            }`}>
                              {t.status}
                            </span>
                          </div>
                          <h4 className="text-xs font-extrabold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                            {t.subject}
                          </h4>
                          <p className="text-[10px] text-slate-400 line-clamp-2">
                            {t.messages && t.messages.length > 0 ? t.messages[t.messages.length - 1].text : ""}
                          </p>
                        </div>

                        <div className="border-t border-slate-900/60 pt-3 mt-3 flex items-center justify-between text-[9px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>آخر تحديث: {new Date(t.updatedAt).toLocaleDateString("ar-SA")}</span>
                          </span>
                          <span className="text-cyan-400 font-bold group-hover:underline flex items-center gap-1">
                            <span>فتح للتحدث المباشر</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
