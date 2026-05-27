import React, { useState, useEffect, useRef } from "react";
import { Courier } from "../types";
import { 
  Lock, KeyRound, Loader2, Download, Search, MapPin, 
  Layers, LogOut, RefreshCw, BarChart3, Users, Clock, AlertCircle, Eye, EyeOff,
  UserCheck, ShieldCheck, Edit, CreditCard, Car, Sparkles, X, FileText, CheckCircle2,
  Send, MessageSquare, LifeBuoy, Settings, UserPlus, Trash2
} from "lucide-react";

export default function AdminDashboard() {
  const [password, setPassword] = useState("bawariq2026");
  const [isAuth, setIsAuth] = useState(true);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"applications" | "activated" | "support" | "settings" | "supervisors">("applications");
  const [supervisorsList, setSupervisorsList] = useState<any[]>([]);
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);
  const [newSupervisorName, setNewSupervisorName] = useState("");
  const [newSupervisorPhone, setNewSupervisorPhone] = useState("");
  const [addingSupervisor, setAddingSupervisor] = useState(false);
  const [deletingSupervisorId, setDeletingSupervisorId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCityFilter, setSelectedCityFilter] = useState("all");
  const [selectedAppFilter, setSelectedAppFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [editingCourier, setEditingCourier] = useState<Courier | null>(null);
  const [nationalId, setNationalId] = useState("");
  const [iban, setIban] = useState("");
  const [carPlate, setCarPlate] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [appCourierCode, setAppCourierCode] = useState("");
  const [activationDate, setActivationDate] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const isInitialOpen = useRef(true);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [appSettings, setAppSettings] = useState<Record<string, any>>({
    hungerstation: { id: "hungerstation", name: "هنقرستيشن (HungerStation)", isAvailable: true, region: "مستوى المملكة", warningMessage: "" },
    toyou: { id: "toyou", name: "تويو (ToYou)", isAvailable: true, region: "مستوى المملكة", warningMessage: "" },
    keeta: { id: "keeta", name: "كيتا (Keeta)", isAvailable: true, region: "مستوى المملكة", warningMessage: "" },
    thechefs: { id: "thechefs", name: "ذا شفز (The Chefs)", isAvailable: true, region: "مستوى المملكة", warningMessage: "" },
    mrsool: { id: "mrsool", name: "مرسول (Mrsool)", isAvailable: true, region: "مستوى المملكة", warningMessage: "" },
    jahez: { id: "jahez", name: "جاهز (Jahez)", isAvailable: true, region: "مستوى المملكة", warningMessage: "" }
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSavingId, setSettingsSavingId] = useState<string | null>(null);

  const fetchAppSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch("/api/delivery-apps");
      const data = await res.json();
      if (res.ok && data.success && data.apps) {
        const rec: Record<string, any> = {};
        data.apps.forEach((app: any) => { rec[app.id] = { id: app.id, name: app.name, isAvailable: app.isAvailable, region: app.region, warningMessage: app.warningMessage }; });
        setAppSettings(rec);
      }
    } catch (err) { console.error("Error fetching app settings:", err); }
    finally { setSettingsLoading(false); }
  };

  const handleUpdateAppSetting = async (appId: string, isAvailable: boolean, region: string, warningMessage: string) => {
    setSettingsSavingId(appId);
    const pw = password || sessionStorage.getItem("admin_pw") || "bawariq2026";
    try {
      const res = await fetch("/api/admin/update-app-settings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw, id: appId, isAvailable, region, warningMessage })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAppSettings(prev => ({ ...prev, [appId]: { ...prev[appId], isAvailable, region, warningMessage } }));
        alert(`تم تحديث إعدادات (${appSettings[appId]?.name?.split(" ")[0] || appId}) بنجاح! 🚀`);
      } else { alert(data.error || "فشل تحديث إعدادات التطبيق."); }
    } catch { alert("حدث خطأ في الشبكة أثناء الحفظ."); }
    finally { setSettingsSavingId(null); }
  };

  const fetchSupervisorsList = async () => {
    setLoadingSupervisors(true);
    try {
      const res = await fetch("/api/supervisors");
      if (res.ok) { const data = await res.json(); setSupervisorsList(data.supervisors || []); }
    } catch (e) { console.error("Failed to load supervisors:", e); }
    finally { setLoadingSupervisors(false); }
  };

  const handleAddSupervisor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupervisorName.trim() || !newSupervisorPhone.trim()) return;
    setAddingSupervisor(true);
    const pw = password || sessionStorage.getItem("admin_pw") || "bawariq2026";
    const generatedId = "sup_" + Date.now().toString().slice(-6);
    const generatedPassword = "sup" + Math.random().toString(36).slice(-4);
    try {
      const res = await fetch("/api/admin/supervisors/add", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw, id: generatedId, name: newSupervisorName.trim(), supervisorPassword: generatedPassword, phone: newSupervisorPhone.trim() })
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { success: false, error: "استجابة غير معيارية." }; }
      if (res.ok && data.success) {
        await fetchSupervisorsList();
        setNewSupervisorName(""); setNewSupervisorPhone("");
        alert(`تمت إضافة المشرف بنجاح! 👤\nكلمة المرور: ${generatedPassword}\nاحفظها الآن!`);
      } else { alert(data.error || "فشل إضافة المشرف"); }
    } catch { alert("حدث خطأ في الشبكة أثناء إضافة المشرف."); }
    finally { setAddingSupervisor(false); }
  };

  const handleDeleteSupervisor = async (supId: string) => {
    if (supId === "direct") { alert("لا يمكن حذف تسجيل مباشر!"); return; }
    if (!confirm("هل أنت متأكد من رغبتك بحذف هذا المشرف؟")) return;
    setDeletingSupervisorId(supId);
    const pw = password || sessionStorage.getItem("admin_pw") || "bawariq2026";
    try {
      const res = await fetch("/api/admin/supervisors/toggle", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw, supervisorId: supId, isActive: false })
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { success: false, error: "استجابة غير معيارية." }; }
      if (res.ok && data.success) { await fetchSupervisorsList(); alert("تم حذف المشرف بنجاح."); }
      else { alert(data.error || "فشل حذف المشرف"); }
    } catch { alert("حدث خطأ في الاتصال بالخادم."); }
    finally { setDeletingSupervisorId(null); }
  };

  useEffect(() => {
    if (activeTab === "settings" && isAuth) fetchAppSettings();
    else if (activeTab === "supervisors" && isAuth) fetchSupervisorsList();
  }, [activeTab, isAuth]);

  const getFilteredTickets = () => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return supportTickets;
    return supportTickets.filter((t) => {
      const linkedCourier = couriers.find((c) => c.phone === t.courierPhone || (c.phone && c.phone.replace(/^0/, "") === t.courierPhone.replace(/^0/, "")));
      return (
        (t.id && t.id.toLowerCase().includes(query)) ||
        (t.courierName && t.courierName.toLowerCase().includes(query)) ||
        (t.courierPhone && t.courierPhone.includes(query)) ||
        (t.subject && t.subject.toLowerCase().includes(query)) ||
        (t.category && t.category.toLowerCase().includes(query)) ||
        (linkedCourier && linkedCourier.nationalId && linkedCourier.nationalId.includes(query)) ||
        (linkedCourier && linkedCourier.id && linkedCourier.id.toLowerCase().includes(query))
      );
    });
  };

  const fetchTickets = async () => {
    const pw = password || sessionStorage.getItem("admin_pw");
    if (!pw) return;
    setLoadingTickets(true);
    try {
      const response = await fetch("/api/admin/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
      const data = await response.json();
      if (response.ok && data.success) setSupportTickets(data.tickets || []);
    } catch { console.error("Error fetching tickets"); }
    finally { setLoadingTickets(false); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const response = await fetch("/api/admin/couriers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch { throw new Error(`خطأ بالنظام: ${text.substring(0, 150)}`); }
      if (!response.ok || !data.success) throw new Error(data.error || "عذراً، كلمة المرور غير صحيحة.");
      setIsAuth(true); setCouriers(data.couriers || []);
      sessionStorage.setItem("admin_pw", password);
      setTimeout(() => fetchTickets(), 100);
    } catch (err: any) { setError(err.message || "فشلت عملية التحقق."); }
    finally { setLoading(false); }
  };

  const fetchCouriers = async () => {
    const pw = password || sessionStorage.getItem("admin_pw");
    if (!pw) return;
    setLoading(true);
    try {
      const response = await fetch("/api/admin/couriers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
      const data = await response.json();
      if (response.ok && data.success) setCouriers(data.couriers || []);
    } catch { console.error("Error refreshing"); }
    finally { setLoading(false); }
  };

  const handleStatusChange = async (courierId: string, newStatus: "جديد" | "تمت المقابلة" | "تم التفعيل") => {
    const pw = password || sessionStorage.getItem("admin_pw") || "";
    setUpdatingId(courierId);
    try {
      const response = await fetch("/api/admin/update-status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw, courierId, status: newStatus }) });
      const data = await response.json();
      if (response.ok && data.success) {
        setCouriers((prev) => prev.map((c) => (c.id === courierId ? { ...c, status: newStatus, activationDate: newStatus === "تم التفعيل" ? new Date().toLocaleDateString("ar-SA") : c.activationDate } : c)));
      } else { alert(data.error || "فشل تحديث الحالة."); }
    } catch { alert("حدث خطأ في الاتصال بالشبكة."); }
    finally { setUpdatingId(null); }
  };

  const handleDeleteCourier = async (courierId: string, courierName: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف الكابتن (${courierName}) نهائياً؟`)) return;
    const pw = password || sessionStorage.getItem("admin_pw") || "";
    setUpdatingId(courierId);
    try {
      const response = await fetch("/api/admin/delete-courier", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw, courierId }) });
      const data = await response.json();
      if (response.ok && data.success) { setCouriers((prev) => prev.filter((c) => c.id !== courierId)); alert("تم حذف المندوب بنجاح."); }
      else { alert(data.error || "فشل حذف المندوب."); }
    } catch { alert("حدث خطأ في الاتصال."); }
    finally { setUpdatingId(null); }
  };

  useEffect(() => {
    const defaultPw = "bawariq2026";
    setPassword(defaultPw); setIsAuth(true);
    sessionStorage.setItem("admin_pw", defaultPw);
    setLoading(true);
    fetch("/api/admin/couriers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: defaultPw }) })
      .then((res) => { if (!res.ok) throw new Error("HTTP error"); return res.json(); })
      .then((data) => { if (data.success) setCouriers(data.couriers || []); })
      .catch((err) => console.warn("Failed loading couriers:", err))
      .finally(() => { setLoading(false); fetchTickets(); });
  }, []);

  useEffect(() => {
    if (activeTab !== "support" || !isAuth) return;
    const timer = setInterval(() => fetchTickets(), 7000);
    return () => clearInterval(timer);
  }, [activeTab, isAuth, activeTicket?.id]);

  const handleLogout = () => { sessionStorage.removeItem("admin_pw"); setPassword(""); setIsAuth(false); setCouriers([]); };

  const openEditProfile = (courier: Courier) => {
    isInitialOpen.current = true; setAutoSaveStatus("idle");
    setEditingCourier(courier); setNationalId(courier.nationalId || ""); setIban(courier.iban || "");
    setCarPlate(courier.carPlate || ""); setVehicleModel(courier.vehicleModel || "");
    setAppCourierCode(courier.appCourierCode || "");
    setActivationDate(courier.activationDate || new Date().toLocaleDateString("ar-SA"));
    setAdminNotes(courier.adminNotes || "");
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourier) return;
    setSavingProfile(true);
    const pw = password || sessionStorage.getItem("admin_pw") || "";
    try {
      const response = await fetch("/api/admin/update-profile", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw, courierId: editingCourier.id, nationalId, iban, carPlate, vehicleModel, appCourierCode, activationDate, adminNotes }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setCouriers((prev) => prev.map((c) => (c.id === editingCourier.id ? { ...c, ...data.courier } : c)));
        setEditingCourier(null);
        alert(`تم تحديث ملف الكابتن (${editingCourier.name}) بنجاح! 🚀`);
      } else { alert(data.error || "فشل تحديث الملف التشغيلي."); }
    } catch { alert("حدث خطأ في الاتصال."); }
    finally { setSavingProfile(false); }
  };

  useEffect(() => {
    if (!editingCourier) { setAutoSaveStatus("idle"); return; }
    if (isInitialOpen.current) { isInitialOpen.current = false; return; }
    setAutoSaveStatus("saving");
    const pw = password || sessionStorage.getItem("admin_pw") || "";
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/admin/update-profile", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: pw, courierId: editingCourier.id, nationalId, iban, carPlate, vehicleModel, appCourierCode, activationDate, adminNotes }),
        });
        const data = await response.json();
        if (response.ok && data.success) { setCouriers((prev) => prev.map((c) => (c.id === editingCourier.id ? { ...c, ...data.courier } : c))); setAutoSaveStatus("saved"); }
        else { setAutoSaveStatus("error"); }
      } catch { setAutoSaveStatus("error"); }
    }, 1200);
    return () => clearTimeout(timer);
  }, [editingCourier?.id, nationalId, iban, carPlate, vehicleModel, appCourierCode, activationDate, adminNotes]);

  const uniqueCities = Array.from(new Set(couriers.map((c) => c.city)));
  const uniqueApps = Array.from(new Set(couriers.flatMap((c) => c.apps || [])));

  const filteredCouriers = couriers.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm) || c.id.includes(searchTerm) || (c.nationalId && c.nationalId.includes(searchTerm)) || (c.appCourierCode && c.appCourierCode.toLowerCase().includes(searchTerm.toLowerCase())) || (c.carPlate && c.carPlate.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCity = selectedCityFilter === "all" || c.city === selectedCityFilter;
    const matchesApp = selectedAppFilter === "all" || (c.apps && c.apps.includes(selectedAppFilter));
    const currentStatus = c.status || "جديد";
    let matchesStatus = true;
    if (activeTab === "activated") { matchesStatus = currentStatus === "تم التفعيل"; }
    else { if (selectedStatusFilter === "all") matchesStatus = currentStatus !== "تم التفعيل"; else matchesStatus = currentStatus === selectedStatusFilter; }
    return matchesSearch && matchesCity && matchesApp && matchesStatus;
  });

  const totalCount = couriers.length;
  const scheduledCount = couriers.filter((c) => c.interviewDate && c.interviewTime).length;
  const activatedCount = couriers.filter((c) => c.status === "تم التفعيل").length;
  const interviewedCount = couriers.filter((c) => c.status === "تمت المقابلة").length;
  const newCount = couriers.filter((c) => !c.status || c.status === "جديد").length;
  if (!isAuth) {
    return (
      <div className="max-w-md mx-auto my-12">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <KeyRound className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-xl font-extrabold text-white">لوحة تشغيل بوارق الشرق المغلقة</h3>
            <p className="text-xs text-slate-400">هذه الصفحة مخصصة لمدير النظام ومسؤولي الموارد البشرية.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3.5 rounded-xl flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0" /><span>{error}</span></div>}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">كلمة مرور بوابة التحكم</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="أدخل الرمز السري"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm text-center text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 tracking-widest font-mono" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer p-1">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold py-3 px-4 rounded-xl hover:brightness-110 transition-all cursor-pointer disabled:opacity-50">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>جاري التحقق...</span></> : <><Lock className="w-4 h-4" /><span>دخول لوحة بوارق</span></>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>بوابة التحكم الموحدة واستخراج المناديب</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">تمت مزامنة قاعدة البيانات لحظياً.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button onClick={fetchCouriers} disabled={loading} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all text-xs flex items-center gap-1.5 cursor-pointer">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /><span>تحديث</span>
          </button>
          <a href={`/api/admin/download-csv?auth=${password}`} target="_blank" rel="noopener noreferrer"
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-slate-950 font-bold hover:brightness-110 text-xs shadow-md transition-all cursor-pointer">
            <Download className="w-4 h-4" /><span>تنزيل كشف الإكسيل (Excel)</span>
          </a>
          <button onClick={handleLogout} className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all text-xs cursor-pointer">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between"><span className="text-[10px] text-slate-400 font-bold">إجمالي المرشحين</span><Users className="w-4 h-4 text-slate-400" /></div>
          <span className="text-lg font-black text-white font-mono mt-2">{totalCount} كابتن</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-col justify-between border-r-2 border-r-amber-500/65">
          <div className="flex items-center justify-between"><span className="text-[10px] text-amber-400 font-bold">طلبات جديدة</span><span className="w-2 h-2 rounded-full bg-amber-500"></span></div>
          <span className="text-lg font-black text-white font-mono mt-2">{newCount} كابتن</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-col justify-between border-r-2 border-r-cyan-500/65">
          <div className="flex items-center justify-between"><span className="text-[10px] text-cyan-400 font-bold">تمت المقابلة</span><span className="w-2 h-2 rounded-full bg-cyan-500"></span></div>
          <span className="text-lg font-black text-white font-mono mt-2">{interviewedCount} كابتن</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-col justify-between border-r-2 border-r-emerald-500/65">
          <div className="flex items-center justify-between"><span className="text-[10px] text-emerald-400 font-bold">حسابات مفعّلة</span><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span></div>
          <span className="text-lg font-black text-white font-mono mt-2">{activatedCount} كابتن</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between"><span className="text-[10px] text-purple-400 font-bold">حاجزي مواعيد</span><Clock className="w-4 h-4 text-purple-400" /></div>
          <span className="text-lg font-black text-white font-mono mt-2">{scheduledCount} كابتن</span>
        </div>
      </div>

      {/* Charts */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
          <BarChart3 className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-extrabold text-white">إحصائيات المناديب والنشاط الميداني</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
            <h4 className="text-xs font-black text-white border-b border-slate-900 pb-2">📍 توزيع حسب المدينة</h4>
            <div className="space-y-3 max-h-[220px] overflow-y-auto">
              {(() => {
                const citiesData = couriers.reduce<Record<string, number>>((acc, c) => { const city = c.city || "غير محدد"; acc[city] = (acc[city] || 0) + 1; return acc; }, {});
                const sorted = (Object.entries(citiesData) as [string, number][]).sort((a, b) => b[1] - a[1]);
                const maxCount = Math.max(...(Object.values(citiesData) as number[]), 1);
                return sorted.map(([city, count]) => (
                  <div key={city} className="space-y-1">
                    <div className="flex justify-between text-[11px]"><span className="font-bold text-slate-300">{city}</span><span className="font-mono font-bold text-amber-400">{count}</span></div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full" style={{ width: `${(count / maxCount) * 100}%` }}></div></div>
                  </div>
                ));
              })()}
              {couriers.length === 0 && <div className="text-center text-[10px] text-slate-500 py-6">لا توجد بيانات</div>}
            </div>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
            <h4 className="text-xs font-black text-white border-b border-slate-900 pb-2">📱 التطبيقات التشغيلية</h4>
            <div className="space-y-3 max-h-[220px] overflow-y-auto">
              {(() => {
                const appsData = couriers.reduce<Record<string, number>>((acc, c) => { if (Array.isArray(c.apps)) c.apps.forEach(app => { acc[app] = (acc[app] || 0) + 1; }); return acc; }, {});
                const sorted = (Object.entries(appsData) as [string, number][]).sort((a, b) => b[1] - a[1]);
                const maxCount = Math.max(...(Object.values(appsData) as number[]), 1);
                return sorted.map(([app, count]) => (
                  <div key={app} className="space-y-1">
                    <div className="flex justify-between text-[11px]"><span className="font-mono font-bold text-slate-300 uppercase">{app}</span><span className="font-mono font-bold text-cyan-400">{count}</span></div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full" style={{ width: `${(count / maxCount) * 100}%` }}></div></div>
                  </div>
                ));
              })()}
              {couriers.length === 0 && <div className="text-center text-[10px] text-slate-500 py-6">لا توجد بيانات</div>}
            </div>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
            <h4 className="text-xs font-black text-white border-b border-slate-900 pb-2">🛡️ مراحل التوظيف</h4>
            <div className="space-y-3">
              {[
                { label: "جديد", count: newCount, color: "from-amber-500 to-amber-600" },
                { label: "تمت المقابلة", count: interviewedCount, color: "from-cyan-400 to-cyan-500" },
                { label: "تم التفعيل", count: activatedCount, color: "from-emerald-400 to-emerald-500" }
              ].map((item, idx) => {
                const percent = couriers.length > 0 ? (item.count / couriers.length) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[11px]"><span className="font-bold text-slate-300">{item.label}</span><span className="font-mono text-slate-400">{item.count} ({Math.round(percent)}%)</span></div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden"><div className={`h-full bg-gradient-to-r ${item.color} rounded-full`} style={{ width: `${percent}%` }}></div></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto">
        {[
          { id: "applications", label: `طلبات التقديم (${totalCount - activatedCount})`, icon: <Clock className="w-4 h-4 text-amber-500" /> },
          { id: "activated", label: `المفعّلين (${activatedCount})`, icon: <UserCheck className="w-4 h-4 text-emerald-500" /> },
          { id: "support", label: "تذاكر الدعم 🎧", icon: <Users className="w-4 h-4 text-cyan-400" /> },
          { id: "settings", label: "إعدادات التطبيقات ⚙️", icon: <Settings className="w-4 h-4 text-amber-500" /> },
          { id: "supervisors", label: "إدارة المشرفين 🧑‍💼", icon: <Users className="w-4 h-4 text-cyan-400" /> },
        ].map((tab) => (
          <button key={tab.id} type="button"
            onClick={() => { setActiveTab(tab.id as any); if (tab.id === "activated") setSelectedStatusFilter("تم التفعيل"); else if (tab.id === "applications") setSelectedStatusFilter("all"); else if (tab.id === "support") fetchTickets(); else if (tab.id === "supervisors") fetchSupervisorsList(); }}
            className={`flex-shrink-0 px-5 py-3.5 border-b-2 transition-all cursor-pointer flex items-center gap-2 text-xs font-extrabold whitespace-nowrap ${activeTab === tab.id ? "border-amber-500 text-amber-500 bg-amber-500/5" : "border-transparent text-slate-400 hover:text-white"}`}>
            {tab.icon}<span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      {activeTab !== "support" && activeTab !== "settings" && activeTab !== "supervisors" && (
        <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4 gap-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500"><Search className="w-4 h-4" /></div>
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="ابحث بالاسم أو الجوال أو المعرف..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <select value={selectedCityFilter} onChange={(e) => setSelectedCityFilter(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs cursor-pointer focus:outline-none text-slate-200">
                <option value="all">كافة المدن</option>
                {uniqueCities.map((city) => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <select value={selectedAppFilter} onChange={(e) => setSelectedAppFilter(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs cursor-pointer focus:outline-none text-slate-200">
                <option value="all">كل التطبيقات</option>
                {uniqueApps.map((app) => <option key={app as string} value={app as string}>{(app as string).toUpperCase()}</option>)}
              </select>
            </div>
            {activeTab !== "activated" && (
              <select value={selectedStatusFilter} onChange={(e) => setSelectedStatusFilter(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs cursor-pointer focus:outline-none text-slate-200">
                <option value="all">جميع الحالات</option>
                <option value="جديد">جديد</option>
                <option value="تمت المقابلة">تمت المقابلة</option>
              </select>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="bg-slate-950/20 border border-slate-900 rounded-2xl overflow-hidden">
        {activeTab === "settings" ? (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-sm font-black text-white flex items-center gap-2"><Settings className="w-5 h-5 text-amber-500" /><span>إعدادات التطبيقات</span></h3>
              <button onClick={fetchAppSettings} disabled={settingsLoading} className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer">
                <RefreshCw className={`w-3.5 h-3.5 ${settingsLoading ? "animate-spin text-amber-500" : ""}`} /><span>تحديث</span>
              </button>
            </div>
            {settingsLoading ? (
              <div className="py-24 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" /></div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {Object.values(appSettings).map((app: any) => (
                  <div key={app.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <span className="text-[10px] font-mono text-slate-500">{app.id}</span>
                      <h4 className="text-xs font-black text-white">{app.name}</h4>
                    </div>
                    <button type="button" onClick={() => setAppSettings(prev => ({ ...prev, [app.id]: { ...prev[app.id], isAvailable: !prev[app.id].isAvailable } }))}
                      className={`w-full px-3 py-1.5 rounded-lg text-[10px] font-black border text-center ${app.isAvailable ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-400"}`}>
                      {app.isAvailable ? "● متاح حالياً للتسجيل" : "○ مغلق (نفذت الحسابات ⚠️)"}
                    </button>
                    <input type="text" value={app.region} onChange={(e) => setAppSettings(prev => ({ ...prev, [app.id]: { ...prev[app.id], region: e.target.value } }))}
                      placeholder="منطقة العمل..." className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500" />
                    <textarea rows={2} value={app.warningMessage || ""} onChange={(e) => setAppSettings(prev => ({ ...prev, [app.id]: { ...prev[app.id], warningMessage: e.target.value } }))}
                      placeholder="رسالة تحذيرية..." className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 resize-none" />
                    <div className="flex justify-end">
                      <button type="button" disabled={settingsSavingId === app.id} onClick={() => handleUpdateAppSetting(app.id, app.isAvailable, app.region, app.warningMessage)}
                        className="bg-amber-500 hover:brightness-110 text-slate-950 font-black text-[10px] px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                        {settingsSavingId === app.id ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>جاري الحفظ...</span></> : <><CheckCircle2 className="w-3.5 h-3.5" /><span>حفظ وتعميم 🚀</span></>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === "supervisors" ? (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-sm font-black text-white flex items-center gap-2"><Users className="w-5 h-5 text-cyan-400" /><span>إدارة المشرفين</span></h3>
              <span className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs"><span className="text-slate-400">الإجمالي: </span><span className="font-bold text-cyan-400">{supervisorsList.length}</span></span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-black text-white border-b border-slate-800 pb-2 flex items-center gap-1.5"><UserPlus className="w-4 h-4 text-emerald-400" /><span>إضافة مشرف جديد</span></h4>
                <form onSubmit={handleAddSupervisor} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">اسم المشرف الكامل *</label>
                    <input type="text" required value={newSupervisorName} onChange={(e) => setNewSupervisorName(e.target.value)} placeholder="مثال: أ. صالح الحربي"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">رقم جوال الواتساب (966...) *</label>
                    <input type="text" required value={newSupervisorPhone} onChange={(e) => setNewSupervisorPhone(e.target.value)} placeholder="مثال: 966501112223"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono" />
                  </div>
                  <button type="submit" disabled={addingSupervisor} className="w-full py-2 px-4 bg-gradient-to-r from-cyan-500 to-cyan-600 font-bold text-xs text-slate-950 rounded-lg cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-45">
                    {addingSupervisor ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>جاري الإضافة...</span></> : <><UserPlus className="w-3.5 h-3.5" /><span>إضافة المشرف 👥</span></>}
                  </button>
                </form>
              </div>
              <div className="lg:col-span-2 bg-slate-900/20 border border-slate-900 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-black text-white border-b border-slate-800 pb-2">سجل المشرفين</h4>
                {loadingSupervisors ? (
                  <div className="py-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" /></div>
                ) : supervisorsList.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">لا يوجد أي مشرف مضاف حالياً.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500 text-[10px]">
                          <th className="pb-2.5 font-bold">المعرّف</th>
                          <th className="pb-2.5 font-bold">الاسم</th>
                          <th className="pb-2.5 font-bold">الجوال</th>
                          <th className="pb-2.5 font-bold text-left">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {supervisorsList.map((sup) => (
                          <tr key={sup?.id || Math.random().toString()} className="hover:bg-slate-900/10">
                            <td className="py-3 font-mono text-[10px] text-slate-500">#{String(sup?.id || "").substring(0, 8)}</td>
                            <td className="py-3 font-bold text-slate-200">
                              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span><span>{sup.name}</span></div>
                            </td>
                            <td className="py-3 font-mono text-slate-400">{sup.phone}</td>
                            <td className="py-3 text-left">
                              {sup.id !== "direct" ? (
                                <button type="button" disabled={deletingSupervisorId === sup.id} onClick={() => handleDeleteSupervisor(sup.id)}
                                  className="p-1 px-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded border border-rose-500/15 cursor-pointer text-[10px] font-bold flex items-center gap-1">
                                  {deletingSupervisorId === sup.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                  <span>حذف</span>
                                </button>
                              ) : <span className="text-[10px] text-slate-600">— غير قابل للحذف —</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === "support" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 md:p-6">
            <div className="col-span-1 bg-slate-900/60 rounded-xl p-4 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded-full font-mono">{supportTickets.length} تذكرة</span>
                <h4 className="text-xs font-black text-white flex items-center gap-1.5"><MessageSquare className="w-4 h-4 text-cyan-400" /><span>تذاكر الدعم 🎧</span></h4>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500"><Search className="w-3.5 h-3.5" /></div>
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="ابحث في التذاكر..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-9 py-2 text-[11px] text-white focus:outline-none focus:border-cyan-500" />
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {loadingTickets && supportTickets.length === 0 ? (
                  <div className="p-8 text-center flex flex-col items-center gap-2"><Loader2 className="w-5 h-5 animate-spin text-cyan-500" /><span className="text-xs text-slate-500">جاري التحميل...</span></div>
                ) : getFilteredTickets().length === 0 ? (
                  <div className="p-8 text-center text-slate-600 border border-dashed border-slate-800 rounded-lg text-xs">لا توجد تذاكر.</div>
                ) : getFilteredTickets().map((t) => {
                  const isSelected = activeTicket?.id === t.id;
                  const statusColors = t.status === "جديد" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : t.status === "قيد المتابعة" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : t.status === "تم الرد" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-800/20 text-slate-400 border-slate-800";
                  return (
                    <div key={t.id} onClick={() => { setActiveTicket(t); setReplyText(""); }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all space-y-2 ${isSelected ? "bg-cyan-500/5 border-cyan-600/50" : "bg-slate-950/40 border-slate-800 hover:bg-slate-900/60"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${statusColors}`}>{t.status}</span>
                        <span className="text-[10px] text-slate-500 font-mono">#{t.id.slice(0, 8)}</span>
                      </div>
                      <h5 className="text-xs font-extrabold text-white truncate">{t.subject || t.category || "استفسار دعم"}</h5>
                      <p className="text-[10px] text-slate-400 flex items-center justify-between">
                        <span className="font-bold text-slate-300">{t.courierName}</span>
                        <span className="font-mono text-slate-500">{t.courierPhone}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="col-span-1 lg:col-span-2 bg-slate-900/60 rounded-xl p-5 border border-slate-800 flex flex-col min-h-[500px]">
              {activeTicket ? (
                <div className="flex flex-col h-full space-y-4">
                  <div className="border-b border-slate-800 pb-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-white flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse"></span><span>{activeTicket.subject}</span></h4>
                      <select value={activeTicket.status} onChange={async (e) => {
                        const newSt = e.target.value;
                        const pw = password || sessionStorage.getItem("admin_pw") || "";
                        const res = await fetch("/api/admin/tickets/update-status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw, ticketId: activeTicket.id, status: newSt }) });
                        const data = await res.json();
                        if (res.ok && data.success) { setSupportTickets((prev) => prev.map((t) => (t.id === activeTicket.id ? { ...t, status: newSt } : t))); setActiveTicket((prev: any) => ({ ...prev, status: newSt })); }
                      }} className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none cursor-pointer">
                        <option value="جديد">جديد</option><option value="قيد المتابعة">قيد المتابعة</option><option value="تم الرد">تم الرد</option><option value="مغلق">مغلق</option>
                      </select>
                    </div>
                    <p className="text-xs text-slate-400">صاحب التذكرة: <strong className="text-slate-200">{activeTicket.courierName}</strong> | <span className="font-mono">{activeTicket.courierPhone}</span></p>
                  </div>
                  <div className="flex-grow overflow-y-auto max-h-[300px] p-2 bg-slate-950/20 rounded-lg border border-slate-900 space-y-4 flex flex-col">
                    {activeTicket.messages?.length === 0 ? (
                      <div className="m-auto text-center text-slate-600 text-xs p-8">لا توجد رسائل. اكتب رداً بالأسفل.</div>
                    ) : activeTicket.messages?.map((m: any, idx: number) => {
                      const isAdmin = m.sender === "admin";
                      return (
                        <div key={idx} className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${isAdmin ? "bg-cyan-600/90 text-white self-start" : "bg-slate-950 text-slate-200 self-end border border-slate-800"}`}>
                          <div className="flex items-center justify-between gap-6 text-[9px] opacity-75 mb-1">
                            <span className="font-bold">{isAdmin ? "إدارة بوارق" : activeTicket.courierName}</span>
                            <span className="font-mono">{new Date(m.createdAt || Date.now()).toLocaleTimeString("ar-SA", { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
                          {m.imageUrl && <img src={m.imageUrl} alt="مرفق" onClick={() => setZoomImageUrl(m.imageUrl)} className="max-h-40 max-w-full object-cover rounded cursor-zoom-in mt-2 mx-auto block" referrerPolicy="no-referrer" />}
                        </div>
                      );
                    })}
                  </div>
                  <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 space-y-3">
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      if (!replyText.trim()) return;
                      setSendingReply(true);
                      const pw = password || sessionStorage.getItem("admin_pw") || "";
                      try {
                        const res = await fetch(`/api/support/tickets/${activeTicket.id}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sender: "admin", text: replyText, password: pw }) });
                        const data = await res.json();
                        if (res.ok && data.success) {
                          setReplyText("");
                          setSupportTickets((prev) => prev.map((t) => (t.id === activeTicket.id ? { ...t, status: "تم الرد", messages: [...(t.messages || []), { sender: "admin", text: replyText, createdAt: new Date().toISOString() }] } : t)));
                          setActiveTicket((prev: any) => ({ ...prev, status: "تم الرد", messages: [...(prev.messages || []), { sender: "admin", text: replyText, createdAt: new Date().toISOString() }] }));
                        } else { alert(data.error || "خطأ أثناء الإرسال"); }
                      } catch { console.error("Error replying"); } finally { setSendingReply(false); }
                    }} className="space-y-2">
                      <textarea rows={2} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="اكتب رد الدعم الفني هنا..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none text-right" />
                      <div className="flex items-center justify-between">
                        <button type="button" onClick={() => fetchTickets()} className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"><RefreshCw className="w-3.5 h-3.5" /></button>
                        <button type="submit" disabled={sendingReply || !replyText.trim()} className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40">
                          {sendingReply ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>جاري الإرسال...</span></> : <><Send className="w-3.5 h-3.5 -scale-x-100" /><span>إرسال الرد 🚀</span></>}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="m-auto text-center space-y-3.5 p-12 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20"><LifeBuoy className="w-8 h-8 animate-pulse text-cyan-500" /></div>
                  <h5 className="text-sm font-extrabold text-white">مركز الدعم المباشر</h5>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">اضغط على أي تذكرة من القائمة لفتح المحادثة والرد.</p>
                </div>
              )}
            </div>
          </div>
        ) : filteredCouriers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <p className="text-sm font-bold">لم يتم العثور على كباتن يطابقون البحث.</p>
            <p className="text-xs text-slate-600">جرب إزالة الفلاتر.</p>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {filteredCouriers.map((c) => {
              const currentStatus = c.status || "جديد";
              const isActivated = activeTab === "activated";
              const statusColor = currentStatus === "تم التفعيل" ? "#10b981" : currentStatus === "تمت المقابلة" ? "#06b6d4" : "#f59e0b";
              return (
                <div key={c.id} className="grid grid-cols-1 lg:grid-cols-7 gap-4 items-center p-5 bg-slate-900/40 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
                  <div className="flex items-center gap-3 lg:col-span-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${statusColor}15`, border: `1px solid ${statusColor}30` }}>
                      <Car className="w-5 h-5" style={{ color: statusColor }} />
                    </div>
                    <div>
                      <div className="font-extrabold text-white text-sm">{c.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{c.phone}</div>
                      <div className="text-[10px] text-slate-400">{c.city}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {c.apps && c.apps.length > 0 ? c.apps.map((app) => <span key={app} className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-amber-400 rounded text-[9px] font-extrabold">{app.toUpperCase()}</span>) : <span className="text-[10px] text-slate-600 italic">لم يحدد</span>}
                  </div>
                  {isActivated && (
                    <>
                      <div className="space-y-1 text-xs">
                        <div className="text-slate-400">هوية: <span className="text-amber-400 font-mono">{c.nationalId || "—"}</span></div>
                        <div className="text-slate-400 text-[10px]">IBAN: <span className="text-slate-200 font-mono">{c.iban || "—"}</span></div>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="text-slate-400">كود: <span className="text-emerald-400 font-mono">{c.appCourierCode || "—"}</span></div>
                        <div className="text-slate-400">لوحة: <span className="text-amber-400 font-mono">{c.carPlate || "—"}</span></div>
                      </div>
                    </>
                  )}
                  {!isActivated && (
                    <div className="text-xs text-slate-400 lg:col-span-2">
                      {c.interviewDate ? <div className="text-amber-400 font-bold">{c.interviewDate} - {c.interviewTime}</div> : <span className="text-rose-400">لم يحجز موعداً</span>}
                      <div className="text-[10px] text-slate-500 mt-1">{new Date(c.createdAt).toLocaleDateString("ar-SA")}</div>
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    {isActivated && (
                      <button onClick={() => openEditProfile(c)} className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 text-amber-400 border border-amber-500/30 rounded-lg text-[10px] font-extrabold flex items-center gap-1.5 cursor-pointer transition-all">
                        <Edit className="w-3.5 h-3.5" /><span>تعديل الملف</span>
                      </button>
                    )}
                    <select value={currentStatus} disabled={updatingId === c.id} onChange={(e) => handleStatusChange(c.id, e.target.value as any)}
                      className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-[9px] font-bold text-slate-400 cursor-pointer text-center">
                      <option value="جديد">جديد</option>
                      <option value="تمت المقابلة">تمت المقابلة</option>
                      <option value="تم التفعيل">تم التفعيل</option>
                    </select>
                    <button onClick={() => handleDeleteCourier(c.id, c.name)} className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 border border-rose-500/20 rounded text-[9px] font-bold cursor-pointer transition-all">
                      حذف
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingCourier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg"><ShieldCheck className="w-5 h-5" /></div>
                <div>
                  <h3 className="text-base font-extrabold text-white">تعديل الملف التشغيلي</h3>
                  <p className="text-xs text-slate-400">الكابتن: <span className="text-amber-400 font-bold">{editingCourier.name}</span>
                    {autoSaveStatus === "saving" && <span className="mr-2 text-amber-400 animate-pulse"> ● جاري الحفظ...</span>}
                    {autoSaveStatus === "saved" && <span className="mr-2 text-emerald-400"> ✓ تم الحفظ</span>}
                    {autoSaveStatus === "error" && <span className="mr-2 text-rose-400"> ✗ فشل الحفظ</span>}
                  </p>
                </div>
              </div>
              <button onClick={() => setEditingCourier(null)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleProfileSave} className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "رقم الهوية / الإقامة", value: nationalId, setter: setNationalId, placeholder: "1024354228", mono: true },
                  { label: "رقم الآيبان (IBAN)", value: iban, setter: (v: string) => setIban(v.toUpperCase()), placeholder: "SA038000000...", mono: true },
                  { label: "نوع وموديل المركبة", value: vehicleModel, setter: setVehicleModel, placeholder: "تويوتا كامري 2022", mono: false },
                  { label: "رقم لوحة المركبة", value: carPlate, setter: setCarPlate, placeholder: "ح د ر 2356", mono: false },
                  { label: "كود المندوب بالتطبيقات", value: appCourierCode, setter: setAppCourierCode, placeholder: "B29452", mono: true },
                  { label: "تاريخ التفعيل", value: activationDate, setter: setActivationDate, placeholder: "2026/05/22", mono: false },
                ].map((field) => (
                  <div key={field.label} className="space-y-1.5 text-right">
                    <label className="text-xs font-bold text-slate-300 block">{field.label}</label>
                    <input type="text" value={field.value} onChange={(e) => field.setter(e.target.value)} placeholder={field.placeholder}
                      className={`w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 ${field.mono ? "font-mono text-center" : ""}`} />
                  </div>
                ))}
              </div>
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-slate-300 block">ملاحظات الإدارة</label>
                <textarea rows={3} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="أدخل أي ملاحظات إدارية..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 resize-none text-right" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setEditingCourier(null)} className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-bold cursor-pointer">إلغاء</button>
                <button type="submit" disabled={savingProfile} className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 rounded-lg text-xs font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                  {savingProfile ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>جاري الحفظ...</span></> : <><CheckCircle2 className="w-3.5 h-3.5" /><span>حفظ ومزامنة 🚀</span></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Zoom */}
      {zoomImageUrl && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setZoomImageUrl(null)}>
          <button onClick={() => setZoomImageUrl(null)} className="absolute top-4 right-4 p-2 bg-slate-900 border border-slate-700 text-slate-400 hover:text-white rounded-xl cursor-pointer"><X className="w-5 h-5" /></button>
          <div className="max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-slate-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <img src={zoomImageUrl} alt="صورة مكبرة" className="max-w-full max-h-[85vh] object-contain block mx-auto" referrerPolicy="no-referrer" />
          </div>
        </div>
      )}
    </div>
  );
}
