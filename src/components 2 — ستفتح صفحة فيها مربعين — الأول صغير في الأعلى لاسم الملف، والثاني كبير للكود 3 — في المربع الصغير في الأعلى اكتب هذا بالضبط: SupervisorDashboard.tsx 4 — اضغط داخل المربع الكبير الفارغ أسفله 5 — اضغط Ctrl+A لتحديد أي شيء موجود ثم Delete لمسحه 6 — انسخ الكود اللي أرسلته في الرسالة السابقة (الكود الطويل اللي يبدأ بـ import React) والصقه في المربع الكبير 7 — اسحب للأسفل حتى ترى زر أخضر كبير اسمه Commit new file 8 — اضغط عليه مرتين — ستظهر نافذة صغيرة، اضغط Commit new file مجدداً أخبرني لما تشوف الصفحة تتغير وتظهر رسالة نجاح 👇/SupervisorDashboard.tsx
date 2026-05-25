import React, { useState, useEffect, useRef } from "react";
import { LogOut, RefreshCw, Users, MessageSquare, CheckCircle, Clock, Search, Send, Loader2, X, AlertCircle, UserCheck, Car, MapPin } from "lucide-react";

interface Courier {
  id: string; name: string; phone: string; city: string;
  apps: string[]; status: string; interviewDate: string;
  interviewTime: string; experience: string; createdAt: string;
  supervisorId: string;
}

interface Ticket {
  id: string; courierName: string; courierPhone: string;
  category: string; subject: string; status: string;
  messages: any[]; supervisorId: string; createdAt: string; updatedAt: string;
}

interface Supervisor {
  id: string; name: string; isActive: boolean;
}

interface Props {
  supervisor: Supervisor;
  password: string;
  onLogout: () => void;
}

export default function SupervisorDashboard({ supervisor, password, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<"couriers" | "tickets">("couriers");
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchCouriers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/supervisor/couriers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supervisorId: supervisor.id, password }),
      });
      const data = await res.json();
      if (data.success) setCouriers(data.couriers || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/supervisor/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supervisorId: supervisor.id, password }),
      });
      const data = await res.json();
      if (data.success) setTickets(data.tickets || []);
    } catch (e) { console.error(e); }
  };

  const fetchTicketUpdate = async (id: string) => {
    try {
      const res = await fetch(`/api/support/tickets/${id}`);
      const data = await res.json();
      if (data.success) {
        setActiveTicket(data.ticket);
        setTickets(prev => prev.map(t => t.id === id ? data.ticket : t));
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchCouriers();
    fetchTickets();
  }, []);

  useEffect(() => {
    if (!activeTicket) return;
    const interval = setInterval(() => fetchTicketUpdate(activeTicket.id), 5000);
    return () => clearInterval(interval);
  }, [activeTicket?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeTicket?.messages]);

  const handleStatusChange = async (courierId: string, status: string) => {
    setUpdatingId(courierId);
    try {
      const res = await fetch("/api/supervisor/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supervisorId: supervisor.id, password, courierId, status }),
      });
      const data = await res.json();
      if (data.success) {
        setCouriers(prev => prev.map(c => c.id === courierId ? { ...c, status } : c));
      }
    } catch (e) { console.error(e); }
    finally { setUpdatingId(null); }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;
    setSending(true);
    try {
      const res = await fetch(`/api/supervisor/tickets/${activeTicket.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supervisorId: supervisor.id, password, text: replyText }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveTicket(data.ticket);
        setTickets(prev => prev.map(t => t.id === data.ticket.id ? data.ticket : t));
        setReplyText("");
      }
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const filteredCouriers = couriers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) || c.city.includes(searchTerm)
  );

  const filteredTickets = tickets.filter(t =>
    t.courierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.courierPhone.includes(searchTerm) || t.subject.includes(searchTerm)
  );

  const newCount = couriers.filter(c => c.status === "جديد").length;
  const openTickets = tickets.filter(t => t.status !== "مغلق").length;

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            لوحة المشرف — {supervisor.name}
          </h2>
          <p className="text-xs text-slate-400 mt-1">تحكم كامل بمناديبك وتذاكر دعمهم</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { fetchCouriers(); fetchTickets(); }} disabled={loading}
            className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={onLogout}
            className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5">
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-center">
          <div className="text-2xl font-black text-white">{couriers.length}</div>
          <div className="text-xs text-slate-400 mt-1">إجمالي المناديب</div>
        </div>
        <div className="bg-slate-900/60 border border-amber-500/20 p-4 rounded-xl text-center">
          <div className="text-2xl font-black text-amber-400">{newCount}</div>
          <div className="text-xs text-slate-400 mt-1">طلبات جديدة</div>
        </div>
        <div className="bg-slate-900/60 border border-cyan-500/20 p-4 rounded-xl text-center">
          <div className="text-2xl font-black text-cyan-400">{openTickets}</div>
          <div className="text-xs text-slate-400 mt-1">تذاكر مفتوحة</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button onClick={() => { setActiveTab("couriers"); setActiveTicket(null); }}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === "couriers" ? "border-amber-500 text-amber-400" : "border-transparent text-slate-400"}`}>
          <Users className="w-4 h-4" />
          <span>مناديبي ({couriers.length})</span>
        </button>
        <button onClick={() => setActiveTab("tickets")}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === "tickets" ? "border-cyan-500 text-cyan-400" : "border-transparent text-slate-400"}`}>
          <MessageSquare className="w-4 h-4" />
          <span>تذاكر الدعم ({tickets.length})</span>
          {openTickets > 0 && <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-mono">{openTickets}</span>}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          placeholder={activeTab === "couriers" ? "ابحث بالاسم أو الجوال أو المدينة..." : "ابحث في التذاكر..."}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500" />
      </div>

      {/* Content */}
      {activeTab === "couriers" ? (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto" /></div>
          ) : filteredCouriers.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">لا يوجد مناديب مسجلين بعد</div>
          ) : filteredCouriers.map(c => (
            <div key={c.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-lg">🛵</div>
                <div>
                  <div className="font-bold text-white text-sm">{c.name}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span className="font-mono">{c.phone}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.city}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(c.apps || []).map(a => (
                      <span key={a} className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono">{a.toUpperCase()}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {c.interviewDate && (
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{c.interviewDate.split(" (")[0]}</span>
                  </div>
                )}
                <select value={c.status} disabled={updatingId === c.id}
                  onChange={e => handleStatusChange(c.id, e.target.value)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none ${
                    c.status === "جديد" ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                    c.status === "تمت المقابلة" ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" :
                    "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  }`}>
                  <option value="جديد">جديد</option>
                  <option value="تمت المقابلة">تمت المقابلة</option>
                  <option value="تم التفعيل">تم التفعيل</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      ) : activeTicket ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[500px]">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
            <div>
              <h4 className="text-sm font-bold text-white">{activeTicket.subject}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{activeTicket.courierName} • {activeTicket.courierPhone}</p>
            </div>
            <button onClick={() => setActiveTicket(null)}
              className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeTicket.messages.map((m: any, i: number) => (
              <div key={i} className={`flex ${m.sender === "admin" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[80%] rounded-xl p-3 text-xs ${
                  m.sender === "admin" ? "bg-slate-800 text-white" : "bg-cyan-500 text-slate-950 font-semibold"
                }`}>
                  {m.sender === "admin" && <div className="text-[9px] text-amber-400 font-bold mb-1">{m.senderName || "الإدارة"}</div>}
                  <p className="whitespace-pre-line">{m.text}</p>
                  <span className="text-[8px] opacity-60 block mt-1 text-left">{new Date(m.createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Reply */}
          <form onSubmit={handleReply} className="p-3 border-t border-slate-800 flex gap-2">
            <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)}
              placeholder="اكتب ردك هنا..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500" />
            <button type="submit" disabled={sending || !replyText.trim()}
              className="px-4 py-2 bg-cyan-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-cyan-400 disabled:opacity-50 cursor-pointer flex items-center gap-1.5">
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>إرسال</span>
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">لا توجد تذاكر دعم بعد</div>
          ) : filteredTickets.map(t => (
            <div key={t.id} onClick={() => setActiveTicket(t)}
              className="bg-slate-900/50 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-4 cursor-pointer transition-all">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-white">{t.subject}</h4>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                  t.status === "جديد" ? "bg-amber-500/10 text-amber-400" :
                  t.status === "تم الرد" ? "bg-emerald-500/10 text-emerald-400" :
                  "bg-cyan-500/10 text-cyan-400"
                }`}>{t.status}</span>
              </div>
              <p className="text-xs text-slate-400">{t.courierName} • {t.courierPhone}</p>
              {t.messages.length > 0 && (
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                  {t.messages[t.messages.length - 1].text}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
