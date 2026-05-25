import React, { useState, useEffect } from "react";
import { LogOut, Users, Ticket, CheckCircle2, Clock, Loader2, AlertCircle } from "lucide-react";

interface Props {
  supervisor: { id: string; name: string };
  password: string;
  onLogout: () => void;
}

export default function SupervisorDashboard({ supervisor, password, onLogout }: Props) {
  const [tab, setTab] = useState<"couriers" | "tickets">("couriers");
  const [couriers, setCouriers] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      if (tab === "couriers") {
        const res = await fetch("/api/supervisor/couriers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ supervisorId: supervisor.id, password }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        setCouriers(data.couriers || []);
      } else {
        const res = await fetch("/api/supervisor/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ supervisorId: supervisor.id, password }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        setTickets(data.tickets || []);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (s: string) =>
    s === "تم التفعيل" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    : s === "تمت المقابلة" ? "text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
    : "text-amber-400 bg-amber-500/10 border-amber-500/20";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white">لوحة المشرف</h2>
          <p className="text-xs text-slate-400">مرحباً، {supervisor.name}</p>
        </div>
        <button onClick={onLogout}
          className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all">
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab("couriers")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${tab === "couriers" ? "bg-amber-500 text-slate-950" : "bg-slate-900 border border-slate-800 text-slate-400"}`}>
          <Users className="w-4 h-4" />
          <span>المناديب ({couriers.length})</span>
        </button>
        <button onClick={() => setTab("tickets")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${tab === "tickets" ? "bg-amber-500 text-slate-950" : "bg-slate-900 border border-slate-800 text-slate-400"}`}>
          <Ticket className="w-4 h-4" />
          <span>التذاكر ({tickets.length})</span>
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </div>
      ) : tab === "couriers" ? (
        <div className="space-y-3">
          {couriers.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-8">لا يوجد مناديب مسجلين بعد</p>
          ) : couriers.map((c) => (
            <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{c.name}</span>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${statusColor(c.status)}`}>{c.status}</span>
              </div>
              <div className="flex gap-4 text-xs text-slate-400">
                <span>📱 {c.phone}</span>
                <span>📍 {c.city}</span>
              </div>
              {c.interviewDate && (
                <div className="flex items-center gap-1 text-xs text-cyan-400">
                  <Clock className="w-3 h-3" />
                  <span>{c.interviewDate} - {c.interviewTime}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-8">لا توجد تذاكر دعم</p>
          ) : tickets.map((t) => (
            <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{t.subject}</span>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${statusColor(t.status)}`}>{t.status}</span>
              </div>
              <div className="flex gap-4 text-xs text-slate-400">
                <span>{t.courierName}</span>
                <span>📱 {t.courierPhone}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
