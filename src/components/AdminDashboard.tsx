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
  
  // Tab controller: "applications" (new & interviews) vs "activated" (after office setup & activated) vs "support" vs "settings" vs "supervisors" vs "documents"
  const [activeTab, setActiveTab] = useState<"applications" | "activated" | "support" | "settings" | "supervisors" | "documents">("applications");
  const [viewingDocumentCourier, setViewingDocumentCourier] = useState<Courier | null>(null);

  // Supervisors list admin states
  const [supervisorsList, setSupervisorsList] = useState<any[]>([]);
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);
  const [newSupervisorName, setNewSupervisorName] = useState("");
  const [newSupervisorPhone, setNewSupervisorPhone] = useState("");
  const [addingSupervisor, setAddingSupervisor] = useState(false);
  const [deletingSupervisorId, setDeletingSupervisorId] = useState<string | null>(null);
  
  // Search & Filter constraints
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCityFilter, setSelectedCityFilter] = useState("all");
  const [selectedAppFilter, setSelectedAppFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  // Detailed profile editor state for activated couriers
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

  // Support ticket administration states
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // App dynamic settings configurations
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
        data.apps.forEach((app: any) => {
          rec[app.id] = {
            id: app.id,
            name: app.name,
            isAvailable: app.isAvailable,
            region: app.region,
            warningMessage: app.warningMessage
          };
        });
        setAppSettings(rec);
      }
    } catch (err) {
      console.error("Error fetching app settings:", err);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleUpdateAppSetting = async (appId: string, isAvailable: boolean, region: string, warningMessage: string) => {
    setSettingsSavingId(appId);
    // Use inputted password or automatic authorization state
    const pw = password || sessionStorage.getItem("admin_pw") || "bawariq2026";
    try {
      const res = await fetch("/api/admin/update-app-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: pw,
          id: appId,
          isAvailable,
          region,
          warningMessage
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAppSettings(prev => ({
          ...prev,
          [appId]: {
            ...prev[appId],
            isAvailable,
            region,
            warningMessage
          }
        }));
        alert(`تم تفعيل التعديلات وتحديث إعدادات كابتن (${appSettings[appId]?.name?.split(" ")[0] || "تويو"}) بنجاح وتعميمها على المناديب! 🚀`);
      } else {
        alert(data.error || "فشل تحديث إعدادات التطبيق الإدارية.");
      }
    } catch (err) {
      console.error("Error updating setting:", err);
      alert("حدث خطأ في الشبكة السحابية أثناء الحفظ.");
    } finally {
      setSettingsSavingId(null);
    }
  };

  const fetchSupervisorsList = async () => {
    setLoadingSupervisors(true);
    try {
      const res = await fetch("/api/supervisors");
      if (res.ok) {
        const data = await res.json();
        setSupervisorsList(data || []);
      }
    } catch (e) {
      console.error("Failed to load supervisors in admin:", e);
    } finally {
      setLoadingSupervisors(false);
    }
  };

  const handleAddSupervisor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupervisorName.trim()) return;
    setAddingSupervisor(true);
    
    const pw = password || sessionStorage.getItem("admin_pw") || "bawariq2026";
    try {
      const res = await fetch("/api/admin/supervisors/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: pw,
          name: newSupervisorName.trim(),
          phone: newSupervisorPhone.trim()
        })
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        data = { success: false, error: "استجابة غير معيارية من الخادم الرئيسي." };
      }

      if (res.ok && data.success) {
        setSupervisorsList(data.supervisors || []);
        setNewSupervisorName("");
        setNewSupervisorPhone("");
        alert("تمت إضافة المشرف بنجاح! 👤");
      } else {
        alert(data.error || "فشل إضافة المشرف");
      }
    } catch (err) {
      alert("حدث خطأ في الشبكة السحابية أثناء رغبتك في إضافة المشرف.");
    } finally {
      setAddingSupervisor(false);
    }
  };

  const handleDeleteSupervisor = async (supId: string) => {
    if (supId === "direct") {
      alert("لا يمكن حذف تسجيل مباشر!");
      return;
    }
    if (!confirm("هل أنت متأكد من رغبتك بحذف هذا المشرف؟")) return;
    setDeletingSupervisorId(supId);
    
    const pw = password || sessionStorage.getItem("admin_pw") || "bawariq2026";
    try {
      const res = await fetch("/api/admin/supervisors/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: pw,
          id: supId
        })
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        data = { success: false, error: "استجابة غير معيارية من الخادم الرئيسي." };
      }

      if (res.ok && data.success) {
        setSupervisorsList(data.supervisors || []);
        alert("تم حذف المشرف بنجاح.");
      } else {
        alert(data.error || "فشل حذف المشرف");
      }
    } catch (err) {
      alert("حدث خطأ في الاتصال بالخادم لحذف المشرف.");
    } finally {
      setDeletingSupervisorId(null);
    }
  };

  useEffect(() => {
    if (activeTab === "settings" && isAuth) {
      fetchAppSettings();
    } else if (activeTab === "supervisors" && isAuth) {
      fetchSupervisorsList();
    }
  }, [activeTab, isAuth]);

  // Advanced comprehensive search for support tickets ("بحث بالاسم والهوية والمعرف وكل شيء")
  const getFilteredTickets = () => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return supportTickets;

    return supportTickets.filter((t) => {
      const matchesTicketId = t.id && t.id.toLowerCase().includes(query);
      const matchesName = t.courierName && t.courierName.toLowerCase().includes(query);
      const matchesPhone = t.courierPhone && t.courierPhone.includes(query);
      const matchesSubject = t.subject && t.subject.toLowerCase().includes(query);
      const matchesCategory = t.category && t.category.toLowerCase().includes(query);

      // Link to registered courier profile using phone number matches
      const linkedCourier = couriers.find(
        (c) =>
          c.phone === t.courierPhone ||
          (c.phone && c.phone.replace(/^0/, "") === t.courierPhone.replace(/^0/, ""))
      );

      const matchesNationalId = linkedCourier && linkedCourier.nationalId && linkedCourier.nationalId.includes(query);
      const matchesCourierId = linkedCourier && linkedCourier.id && linkedCourier.id.toLowerCase().includes(query);
      const matchesAppCode = linkedCourier && linkedCourier.appCourierCode && linkedCourier.appCourierCode.toLowerCase().includes(query);
      const matchesIban = linkedCourier && linkedCourier.iban && linkedCourier.iban.toLowerCase().includes(query);

      return (
        matchesTicketId ||
        matchesName ||
        matchesPhone ||
        matchesSubject ||
        matchesCategory ||
        matchesNationalId ||
        matchesCourierId ||
        matchesAppCode ||
        matchesIban
      );
    });
  };

  const fetchTickets = async () => {
    const pw = password || sessionStorage.getItem("admin_pw");
    if (!pw) return;

    setLoadingTickets(true);
    try {
      const response = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSupportTickets(data.tickets || []);
      }
    } catch (err) {
      console.error("Error fetching support tickets on admin dashboard:", err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/couriers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        throw new Error(`خطأ بالنظام: حدث استجابة غير متوقعة من الخادم. تفاصيل الاستجابة: ${text.substring(0, 150)}...`);
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || "عذراً، كلمة المرور غير صحيحة.");
      }

      setIsAuth(true);
      setCouriers(data.couriers || []);
      // Save password in session storage for refreshing
      sessionStorage.setItem("admin_pw", password);
      
      // Load support tickets concurrently
      setTimeout(() => fetchTickets(), 100);
    } catch (err: any) {
      setError(err.message || "فشلت عملية التحقق.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCouriers = async () => {
    const pw = password || sessionStorage.getItem("admin_pw");
    if (!pw) return;

    setLoading(true);
    try {
      const response = await fetch("/api/admin/couriers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: pw }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setCouriers(data.couriers || []);
      }
    } catch (err) {
      console.error("Error refreshing data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (courierId: string, newStatus: "جديد" | "تمت المقابلة" | "تم التفعيل") => {
    const pw = password || sessionStorage.getItem("admin_pw") || "";
    setUpdatingId(courierId);
    
    try {
      const response = await fetch("/api/admin/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: pw,
          courierId,
          status: newStatus
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setCouriers((prev) =>
          prev.map((c) => (c.id === courierId ? { ...c, status: newStatus, activationDate: newStatus === "تم التفعيل" ? new Date().toLocaleDateString("ar-SA") : c.activationDate } : c))
        );
      } else {
        alert(data.error || "عذراً، فشل تحديث حالة الكابتن.");
      }
    } catch (e) {
      console.error("Error updating courier status:", e);
      alert("حدث خطأ في الاتصال بالشبكة ولم يتم حفظ التغييرات.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteCourier = async (courierId: string, courierName: string) => {
    if (!window.confirm(`هل أنت متأكد تماماً من رغبتك في حذف الكابتن (${courierName}) نهائياً من النظام وقاعدة البيانات؟ لا يمكنك التراجع عن هذا الإجراء.`)) {
      return;
    }
    const pw = password || sessionStorage.getItem("admin_pw") || "";
    setUpdatingId(courierId);
    
    try {
      const response = await fetch("/api/admin/delete-courier", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: pw,
          courierId
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setCouriers((prev) => prev.filter((c) => c.id !== courierId));
        alert("تم حذف المندوب وسجلاته بالكامل من النظام بنجاح.");
      } else {
        alert(data.error || "عذراً، فشل حذف المندوب.");
      }
    } catch (e) {
      console.error("Error deleting courier:", e);
      alert("حدث خطأ في الاتصال بالشبكة لحذف المندوب.");
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    const defaultPw = "bawariq2026";
    setPassword(defaultPw);
    setIsAuth(true);
    sessionStorage.setItem("admin_pw", defaultPw);

    setLoading(true);
    fetch("/api/admin/couriers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: defaultPw }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("HTTP error");
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setCouriers(data.couriers || []);
        }
      })
      .catch((err) => console.warn("Failed loading couriers automatically on mount:", err))
      .finally(() => {
        setLoading(false);
        // Concurrently load support tickets
        fetchTickets();
      });
  }, []);

  // Poll for tickets update every 7 seconds when showing tickets workspace to ensure live answers
  useEffect(() => {
    if (activeTab !== "support" || !isAuth) return;
    const timer = setInterval(() => {
      fetchTickets();
    }, 7000);
    return () => clearInterval(timer);
  }, [activeTab, isAuth, activeTicket?.id]);

  const handleLogout = () => {
    sessionStorage.removeItem("admin_pw");
    setPassword("");
    setIsAuth(false);
    setCouriers([]);
  };

  const openEditProfile = (courier: Courier) => {
    isInitialOpen.current = true;
    setAutoSaveStatus("idle");
    setEditingCourier(courier);
    setNationalId(courier.nationalId || "");
    setIban(courier.iban || "");
    setCarPlate(courier.carPlate || "");
    setVehicleModel(courier.vehicleModel || "");
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
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: pw,
          courierId: editingCourier.id,
          nationalId,
          iban,
          carPlate,
          vehicleModel,
          appCourierCode,
          activationDate,
          adminNotes,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setCouriers((prev) =>
          prev.map((c) => (c.id === editingCourier.id ? { ...c, ...data.courier } : c))
        );
        setEditingCourier(null);
        alert(`تم تحديث الملف التشغيلي الكامل للكابتن (${editingCourier.name}) بنجاح ومزامنته! 🚀`);
      } else {
        alert(data.error || "عذراً، فشل تحديث الملف التشغيلي.");
      }
    } catch (e) {
      console.error("Error saving profile details:", e);
      alert("حدث خطأ في الاتصال بالملف التشغيلي السحابي.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Debounced auto-save effect for courier profile details
  useEffect(() => {
    if (!editingCourier) {
      setAutoSaveStatus("idle");
      return;
    }

    if (isInitialOpen.current) {
      isInitialOpen.current = false;
      return;
    }

    setAutoSaveStatus("saving");
    const pw = password || sessionStorage.getItem("admin_pw") || "";

    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/admin/update-profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: pw,
            courierId: editingCourier.id,
            nationalId,
            iban,
            carPlate,
            vehicleModel,
            appCourierCode,
            activationDate,
            adminNotes,
          }),
        });

        const data = await response.json();
        if (response.ok && data.success) {
          setCouriers((prev) =>
            prev.map((c) => (c.id === editingCourier.id ? { ...c, ...data.courier } : c))
          );
          setAutoSaveStatus("saved");
        } else {
          setAutoSaveStatus("error");
        }
      } catch (err) {
        console.error("Auto-save error:", err);
        setAutoSaveStatus("error");
      }
    }, 1200); // Debounce delay of 1.2s

    return () => clearTimeout(timer);
  }, [editingCourier?.id, nationalId, iban, carPlate, vehicleModel, appCourierCode, activationDate, adminNotes]);

  // Extract unique cities and delivery apps for filters
  const uniqueCities = Array.from(new Set(couriers.map((c) => c.city)));
  const uniqueApps = Array.from(new Set(couriers.flatMap((c) => c.apps || [])));

  // Filter logic
  const filteredCouriers = couriers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.id.includes(searchTerm) ||
      (c.nationalId && c.nationalId.includes(searchTerm)) ||
      (c.appCourierCode && c.appCourierCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.carPlate && c.carPlate.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCity = selectedCityFilter === "all" || c.city === selectedCityFilter;
    
    const matchesApp =
      selectedAppFilter === "all" || (c.apps && c.apps.includes(selectedAppFilter));

    const currentStatus = c.status || "جديد";
    
    // Status resolution based on tab
    let matchesStatus = true;
    if (activeTab === "activated") {
      matchesStatus = currentStatus === "تم التفعيل";
    } else {
      // In applications tab, default list excludes "تم التفعيل" so it's a true incoming queue
      if (selectedStatusFilter === "all") {
        matchesStatus = currentStatus !== "تم التفعيل";
      } else {
        matchesStatus = currentStatus === selectedStatusFilter;
      }
    }

    return matchesSearch && matchesCity && matchesApp && matchesStatus;
  });

  // Calculate metrics
  const totalCount = couriers.length;
  const scheduledCount = couriers.filter((c) => c.interviewDate && c.interviewTime).length;
  const activatedCount = couriers.filter((c) => c.status === "تم التفعيل").length;
  const interviewedCount = couriers.filter((c) => c.status === "تمت المقابلة").length;
  const newCount = couriers.filter((c) => !c.status || c.status === "جديد").length;

  if (!isAuth) {
    return (
      <div className="max-w-md mx-auto my-12" id="admin-login-lock">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <KeyRound className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-xl font-extrabold text-white">لوحة تشغبل بوارق الشرق المغلقة</h3>
            <p className="text-xs text-slate-400">
              هذه الصفحة مخصصة لمدير النظام ومسؤولي الموارد البشرية لتسليم واستخراج كشوفات المناديب المسجلين بالكامل.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3.5 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5ClassName">
              <label className="text-xs font-bold text-slate-300 block">كلمة مرور بوابة التحكم والمستندات</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل الرمز السري المصرح به لـ بوارق"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm text-center text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 tracking-widest font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 text-center mt-1">الرمز السري الافتراضي للمراجعة هو: <code className="font-mono text-amber-500 text-xs font-bold">bawariq2026</code></p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold py-3 px-4 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري فك تشفير وتأمين الجلسة...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>سجل دخول لوحة بوارق</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" id="admin-secured-dashboard">
      {/* Header section with export utilities */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>بوابة التحكم الموحدة واستخراج المناديب</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            لقد تمت مزامنة قاعدة البيانات الذكية لحظياً. يمكنك تنزيل ملف الإكسيل وإدارة مواعيد المقابلات وتعديل حالات الطلبات فوراً.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Refresh Action */}
          <button
            onClick={fetchCouriers}
            disabled={loading}
            className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all text-xs flex items-center gap-1.5 cursor-pointer"
            title="تحديث البيانات لحظياً"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>تحديث</span>
          </button>

          {/* Secure Download CSV for MS Excel */}
          <a
            href={`/api/admin/download-csv?auth=${password}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-slate-950 font-bold hover:brightness-110 text-xs shadow-md shadow-amber-500/10 transition-all font-sans cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تنزيل كشف الإكسيل (Excel)</span>
          </a>

          {/* Logout Trigger */}
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all text-xs cursor-pointer"
            title="خروج آمن"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bento Grid Analytics cards with live states */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {/* Total Registrations */}
        <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold block">إجمالي المرشحين</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-lg font-black text-white font-mono arab-digits mt-2">{totalCount} كابتن</span>
        </div>

        {/* New filter state counter */}
        <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl flex flex-col justify-between border-r-2 border-r-amber-500/65">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-amber-400 font-bold block">طلبات جديدة</span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          </div>
          <span className="text-lg font-black text-white font-mono arab-digits mt-2">{newCount} كابتن</span>
        </div>

        {/* Interviewed filter state counter */}
        <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl flex flex-col justify-between border-r-2 border-r-cyan-500/65">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-cyan-400 font-bold block">تمت المقابلة</span>
            <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
          </div>
          <span className="text-lg font-black text-white font-mono arab-digits mt-2">{interviewedCount} كابتن</span>
        </div>

        {/* Activated filter state counter */}
        <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl flex flex-col justify-between border-r-2 border-r-emerald-500/65">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-emerald-400 font-bold block">حسابات مفعّلة</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <span className="text-lg font-black text-white font-mono arab-digits mt-2">{activatedCount} كابتن</span>
        </div>

        {/* Scheduled dates */}
        <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-purple-400 font-bold block font-sans">حاجزي مواعيد</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-lg font-black text-white font-mono arab-digits mt-2">{scheduledCount} كابتن</span>
        </div>
      </div>

      {/* 📊 Dashboard Metrics (Sleek Real-time Graphical Section requested by user) */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -z-10"></div>
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
          <BarChart3 className="w-5 h-5 text-amber-500" />
          <div>
            <h3 className="text-sm font-extrabold text-white">إحصائيات المناديب والنشاط الميداني (Live Metrics)</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">رسوم بيانية تفصيلية للتوزيع الجغرافي والبرامج التشغيلية وحالات الانتساب المعتمدة</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Chart 1: Cities Distribution */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-4">
            <h4 className="text-xs font-black text-white border-b border-slate-900 pb-2 flex items-center gap-1.5">
              <span>📍 إجمالي المناديب حسب المدينة</span>
            </h4>
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {(() => {
                const citiesData = couriers.reduce<Record<string, number>>((acc, c) => {
                  const city = c.city || "غير محدد";
                  acc[city] = (acc[city] || 0) + 1;
                  return acc;
                }, {});

                const sortedCities = (Object.entries(citiesData) as [string, number][]).sort((a, b) => b[1] - a[1]);
                const maxCount = Math.max(...(Object.values(citiesData) as number[]), 1);

                return sortedCities.map(([city, count]) => {
                  const percent = (count / maxCount) * 100;
                  return (
                    <div key={city} className="space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-bold text-slate-300">{city}</span>
                        <span className="font-mono font-bold text-amber-400">{count} كابتن</span>
                      </div>
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-1000" 
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                });
              })()}
              {couriers.length === 0 && (
                <div className="text-center text-[10px] text-slate-550 py-6">لا توجد بيانات متاحة للمدن</div>
              )}
            </div>
          </div>

          {/* Chart 2: Selected Apps Selection Rates */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-4">
            <h4 className="text-xs font-black text-white border-b border-slate-900 pb-2 flex items-center gap-1.5">
              <span>📱 توفير وتفعيل التطبيقات التشغيلية</span>
            </h4>
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {(() => {
                const appsData = couriers.reduce<Record<string, number>>((acc, c) => {
                  if (Array.isArray(c.apps)) {
                    c.apps.forEach(app => {
                      acc[app] = (acc[app] || 0) + 1;
                    });
                  }
                  return acc;
                }, {});

                const sortedApps = (Object.entries(appsData) as [string, number][]).sort((a, b) => b[1] - a[1]);
                const maxCount = Math.max(...(Object.values(appsData) as number[]), 1);

                return sortedApps.map(([app, count]) => {
                  const percent = (count / maxCount) * 100;
                  return (
                    <div key={app} className="space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-mono font-bold text-slate-350 uppercase">{app}</span>
                        <span className="font-mono font-bold text-cyan-400">{count} كابتن</span>
                      </div>
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full transition-all duration-1000" 
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                });
              })()}
              {couriers.length === 0 && (
                <div className="text-center text-[10px] text-slate-550 py-6">لا توجد برامج مضافة</div>
              )}
            </div>
          </div>

          {/* Chart 3: Order Status Progress Gauge */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-4">
            <h4 className="text-xs font-black text-white border-b border-slate-900 pb-2 flex items-center gap-1.5">
              <span>🛡️ مراحل طلبات التوظيف الفعلي</span>
            </h4>
            <div className="space-y-3">
              {[
                { label: "جديد (بانتظار المقابلة للقبول السريع)", count: newCount, color: "from-amber-500 to-amber-600" },
                { label: "تمت المقابلة (بانتظار تفعيل الكود والعهدة)", count: interviewedCount, color: "from-cyan-400 to-cyan-500" },
                { label: "تم التفعيل (مباشر ومفعّل ميدانياً)", count: activatedCount, color: "from-emerald-400 to-emerald-500" }
              ].map((item, idx) => {
                const percent = couriers.length > 0 ? (item.count / couriers.length) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-slate-300">{item.label}</span>
                      <span className="font-mono font-bold text-slate-400">{item.count} ({Math.round(percent)}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-1000`} 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              {couriers.length === 0 && (
                <div className="text-center text-[10px] text-slate-550 py-6">لا يوجد ملفات بالفرز حالياً</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-800" id="admin-tabs">
        <button
          type="button"
          onClick={() => {
            setActiveTab("applications");
            setSelectedStatusFilter("all");
          }}
          className={`flex-1 md:flex-initial px-5 py-3.5 md:px-8 border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 text-xs md:text-sm font-extrabold ${
            activeTab === "applications"
              ? "border-amber-500 text-amber-500 bg-amber-500/5 font-black"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Clock className="w-4 h-4 text-amber-500" />
          <span>طلبات التقديم والمقابلات ({totalCount - activatedCount})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("activated");
            setSelectedStatusFilter("تم التفعيل");
          }}
          className={`flex-1 md:flex-initial px-5 py-3.5 md:px-8 border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 text-xs md:text-sm font-extrabold ${
            activeTab === "activated"
              ? "border-amber-500 text-amber-500 bg-amber-500/5 font-black"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <UserCheck className="w-4 h-4 text-emerald-500" />
          <span className="flex items-center gap-1.5">
            <span>سجل المناديب المفعّلين ومكتملي الحساب</span>
            <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 rounded-full font-mono">{activatedCount}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("documents");
            setSelectedStatusFilter("all");
          }}
          className={`flex-1 md:flex-initial px-5 py-3.5 md:px-8 border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 text-xs md:text-sm font-extrabold ${
            activeTab === "documents"
              ? "border-amber-500 text-amber-500 bg-amber-500/5 font-black"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4 text-amber-500" />
          <span className="flex items-center gap-1.5">
            <span>وثائق ومستندات المناديب 📂</span>
            <span className="px-1.5 py-0.5 text-[10px] bg-amber-500/10 text-amber-400 rounded-full font-mono font-bold">
              {couriers.filter(c => c.agreementAccepted).length}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("support");
            fetchTickets();
          }}
          className={`flex-1 md:flex-initial px-5 py-3.5 md:px-8 border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 text-xs md:text-sm font-extrabold ${
            activeTab === "support"
              ? "border-amber-500 text-amber-500 bg-amber-500/5 font-black"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <div className="relative">
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              {supportTickets.some(t => t.status === "جديد" || t.status === "قيد المتابعة") && (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-450 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                </>
              )}
            </span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="flex items-center gap-1.5">
            <span>تذاكر الدعم والاتصال المباشر 🎧</span>
            {supportTickets.filter(t => t.status === "جديد" || t.status === "قيد المتابعة").length > 0 && (
              <span className="px-2 py-0.5 text-[9px] bg-rose-500 text-white rounded-full font-mono font-bold animate-pulse">
                {supportTickets.filter(t => t.status === "جديد" || t.status === "قيد المتابعة").length}
              </span>
            )}
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("settings");
          }}
          className={`flex-1 md:flex-initial px-5 py-3.5 md:px-8 border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 text-xs md:text-sm font-extrabold ${
            activeTab === "settings"
              ? "border-amber-500 text-amber-500 bg-amber-500/5 font-black"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Settings className="w-4 h-4 text-amber-500" />
          <span>إعدادات التطبيقات ونطاق العمل ⚙️</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("supervisors");
            fetchSupervisorsList();
          }}
          className={`flex-1 md:flex-initial px-5 py-3.5 md:px-8 border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 text-xs md:text-sm font-extrabold ${
            activeTab === "supervisors"
              ? "border-amber-500 text-amber-500 bg-amber-500/5 font-black"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Users className="w-4 h-4 text-cyan-400" />
          <span>إدارة المشرفين بالموارد 🧑‍💼</span>
        </button>
      </div>

      {/* Advanced search and filters section */}
      {activeTab !== "support" && activeTab !== "settings" && activeTab !== "supervisors" && (
        <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4 gap-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                activeTab === "activated"
                  ? "ابحث باسم المندوب، رقم الهوية/الإقامة، لوحة السيارة، أو رقم الجوال..."
                  : "ابحث بالاسم بالكامل، معرّف الطلب، أو رقم الجوال..."
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Filters dropdowns combo */}
          <div className="flex flex-wrap items-center gap-3">
            {/* City filter */}
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCityFilter}
                onChange={(e) => setSelectedCityFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs cursor-pointer focus:outline-none text-slate-200 animate-slide-in"
              >
                <option value="all">تصفية حسب كافة المدن</option>
                {uniqueCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* App filter */}
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedAppFilter}
                onChange={(e) => setSelectedAppFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs cursor-pointer focus:outline-none text-slate-200"
              >
                <option value="all">الكل (طبيعة التطبيق)</option>
                {uniqueApps.map((app) => (
                  <option key={app as string} value={app as string}>
                    {(app as string).toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500/80"></span>
              {activeTab === "activated" ? (
                <span className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-550/20 font-extrabold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>حسابات مفعّلة بالكامل</span>
                </span>
              ) : activeTab === "documents" ? (
                <span className="text-xs bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-lg border border-amber-550/20 font-extrabold flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>أرشيف الاتفاقيات المصادق عليها</span>
                </span>
              ) : (
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs cursor-pointer focus:outline-none text-slate-200"
                >
                  <option value="all">جميع الحالات (دون المفعّلة)</option>
                  <option value="جديد">جديد</option>
                  <option value="تمت المقابلة">تمت المقابلة</option>
                </select>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-slate-950/20 border border-slate-900 rounded-2xl overflow-hidden" id="admin-table-panel">
        <div>
          {activeTab === "settings" ? (
            /* تحكم تطبيقات التوصيل وتلقي الطلبات */
            <div className="p-6 md:p-8 space-y-8 bg-slate-950/40 rounded-2xl text-right animate-fade-in">
              <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-amber-500" />
                    <span>تحكم التطبيقات الجاهزة، التفويض الفيدرالي، والأخطار ⚙️</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    يمكن للمسؤول تفعيل أو إلغاء تفعيل حسابات التوصيل، تخصيص المدن والمناطق التي ترغب بتشغيل الخدمة بها، وكتابة تذكيرات تظهر فورياً للكباتن بقالب رسائل الدستور.
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={fetchAppSettings}
                  disabled={settingsLoading}
                  className="px-4 py-2 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-45"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${settingsLoading ? "animate-spin text-amber-500" : ""}`} />
                  <span>تحديث البيانات</span>
                </button>
              </div>

              {settingsLoading ? (
                <div className="py-24 text-center text-slate-500 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
                  <p className="text-xs font-bold">جاري جلب تفضيلات تفعيل التطبيقات...</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {Object.values(appSettings).map((app: any) => {
                    const isSaving = settingsSavingId === app.id;
                    return (
                      <div key={app.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                            <span className="text-[10px] px-2 py-0.5 bg-slate-950/80 text-amber-550 border border-slate-800/80 rounded font-bold font-mono">
                              برمجيات بوارق: {app.id}
                            </span>
                            <h4 className="text-xs font-black text-white flex items-center gap-2">
                              <span>تطبيق {app.name}</span>
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5 text-right">
                              <label className="text-[11px] font-bold text-slate-400 block">حالة الحسابات والقبول</label>
                              <button
                                type="button"
                                onClick={() => {
                                  setAppSettings(prev => ({
                                    ...prev,
                                    [app.id]: {
                                      ...prev[app.id],
                                      isAvailable: !prev[app.id].isAvailable
                                    }
                                  }));
                                }}
                                className={`w-full px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border text-center ${
                                  app.isAvailable 
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                                    : "bg-rose-500/10 border-rose-500/30 text-rose-450"
                                }`}
                              >
                                {app.isAvailable ? "● متاح حالياً للتسجيل" : "○ مغلق (نفذت الحسابات ⚠️)"}
                              </button>
                            </div>

                            <div className="space-y-1.5 text-right">
                              <label className="text-[11px] font-bold text-slate-400 block">منطقة العمل المخصصة</label>
                              <input
                                type="text"
                                value={app.region}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setAppSettings(prev => ({
                                    ...prev,
                                    [app.id]: {
                                      ...prev[app.id],
                                      region: val
                                    }
                                  }));
                                }}
                                placeholder="الرياض، الدمام، أو كافة أنحاء المملكة..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-755 focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5 text-right">
                            <label className="text-[11px] font-bold text-slate-400 block flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-450" />
                              <span>تنبيه المندوب عند نفاذ الحسابات واختيار التطبيق</span>
                            </label>
                            <textarea
                              rows={2}
                              value={app.warningMessage || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAppSettings(prev => ({
                                  ...prev,
                                  [app.id]: {
                                    ...prev[app.id],
                                    warningMessage: val
                                  }
                                }));
                              }}
                              placeholder="أدخل رسالة مخصصة تظهر للكابتن بلون تحذيري عريض..."
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white leading-relaxed placeholder-slate-700 focus:outline-none focus:border-amber-500 resize-none font-sans"
                            />
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-800/40 mt-4 flex justify-end">
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => handleUpdateAppSetting(app.id, app.isAvailable, app.region, app.warningMessage)}
                            className="bg-amber-500 hover:brightness-110 text-slate-950 font-black text-[10px] px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-amber-500/10"
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>جاري التحديث برمجياً...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>حفظ وتعميم التعديل 🚀</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activeTab === "supervisors" ? (
            /* بوابة إدارة المشرفين بالموارد اللوجستية */
            <div className="p-6 md:p-8 space-y-8 bg-slate-950/40 rounded-2xl text-right animate-fade-in border border-slate-900">
              <div className="border-b border-slate-800 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" />
                    <span>بوابة إدارة المشرفين وموارد التفعيل 🧑‍💼</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    يمكن لمدير النظام إضافة المشرفين المتخصصين للتواصل وتفعيل المناديب، بحيث يستطيع كل مندوب عند التسجيل اختيار المشرف الخاص به لتحويله مباشرة لواتس اب المشرف بعد الموعد.
                  </p>
                </div>
                <div className="shrink-0 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs leading-none">
                  <span className="text-slate-400">إجمالي المشرفين: </span>
                  <span className="font-bold text-cyan-400 font-mono">{supervisorsList.length}</span>
                </div>
              </div>

              {/* Grid 1: Add form & Current List split */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Right side: Add form card */}
                <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
                  <h4 className="text-xs font-black text-white border-b border-slate-800 pb-2 flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-emerald-400" />
                    <span>إضافة مشرف ميداني جديد</span>
                  </h4>
                  
                  <form onSubmit={handleAddSupervisor} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block">اسم المشرف الكامل (ثنائي أو ثلاثي) *</label>
                      <input
                        type="text"
                        required
                        value={newSupervisorName}
                        onChange={(e) => setNewSupervisorName(e.target.value)}
                        placeholder="مثال: أ. صالح الحربي"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block">رقم جوال الواتساب (صيغة كـ 966) *</label>
                      <input
                        type="text"
                        required
                        value={newSupervisorPhone}
                        onChange={(e) => setNewSupervisorPhone(e.target.value)}
                        placeholder="مثال: 966501112223"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-550 font-mono"
                      />
                      <span className="text-[9px] text-slate-500 leading-tight block">يرجى كتابتها دولي كامل مفتاح المملكة دون (+ أو 00) مثل 9665xxxxxxxx.</span>
                    </div>

                    <button
                      type="submit"
                      disabled={addingSupervisor}
                      className="w-full py-2 px-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 font-bold text-xs text-slate-950 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:opacity-45 shadow-[0_4px_12px_rgba(6,182,212,0.15)]"
                    >
                      {addingSupervisor ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                          <span>جاري الإضافة للسيستم اللوجستي...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5 text-slate-950" />
                          <span>إضافة المشرف واعتماد الرقم 👥</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Left side: supervisors list Table */}
                <div className="lg:col-span-2 bg-slate-900/20 border border-slate-900 rounded-xl overflow-hidden p-5 space-y-4">
                  <h4 className="text-xs font-black text-white border-b border-slate-800 pb-2">سجل المشرفين المتواجدين بالأنظمة للشركة</h4>
                  
                  {loadingSupervisors ? (
                    <div className="py-12 text-center text-slate-500 space-y-2">
                      <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
                      <p className="text-xs">جاري تحميل سجل المشرفين المعتمدين...</p>
                    </div>
                  ) : supervisorsList.length === 0 ? (
                    <div className="py-12 text-center text-slate-550 text-xs text-center">لا يوجد أي مشرف مضاف حالياً.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase tracking-wider">
                            <th className="pb-2.5 font-bold">معرّف الفريد</th>
                            <th className="pb-2.5 font-bold">اسم المشرف بالكامل</th>
                            <th className="pb-2.5 font-bold">رقم جوال الواتساب الدولي</th>
                            <th className="pb-2.5 font-bold text-left">التحكم والإدارة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {supervisorsList.map((sup) => (
                            <tr key={sup?.id || Math.random().toString()} className="hover:bg-slate-900/10 transition-colors">
                              <td className="py-3 font-mono text-[10px] text-slate-500">#{sup?.id ? (typeof sup.id === "string" ? sup.id.substring(0, 6) : String(sup.id).substring(0, 6)) : ""}</td>
                              <td className="py-3 font-bold text-slate-200 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span>{sup.name}</span>
                                {sup.id === "direct" && (
                                  <span className="text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/10 px-1.5 py-0.5 rounded">الافتراضي</span>
                                )}
                              </td>
                              <td className="py-3 font-mono text-slate-350">{sup.phone}</td>
                              <td className="py-3 text-left">
                                <div className="inline-flex items-center gap-2">
                                  {sup.id !== "direct" ? (
                                    <button
                                      type="button"
                                      disabled={deletingSupervisorId === sup.id}
                                      onClick={() => handleDeleteSupervisor(sup.id)}
                                      className="p-1 px-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded border border-rose-500/15 cursor-pointer text-[10px] font-bold transition-all flex items-center gap-1"
                                      title="حذف هذا المشرف من النظام"
                                    >
                                      {deletingSupervisorId === sup.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Trash2 className="w-3 h-3" />
                                      )}
                                      <span>حذف</span>
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-slate-600">— غير قابل للحذف —</span>
                                  )}
                                </div>
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
            /* مركز تذاكر الدعم والربط السحابي */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 md:p-6 bg-slate-950/40 rounded-2xl border border-slate-900 text-right">
              {/* قائمة تذاكر الدعم */}
              <div className="col-span-1 bg-slate-900/60 rounded-xl p-4 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded-full font-mono font-bold">
                    {supportTickets.length} تذكرة إجمالاً
                  </span>
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                    <span>تذاكر الكباتن النشطة 🎧</span>
                  </h4>
                </div>

                {/* حقل تصفية التذاكر الفوري */}
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ابحث برقم تذكرة أو اسم أو جوال المندوب..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-9 py-2 text-[11px] text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* قائمة التذاكر */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                  {loadingTickets && supportTickets.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
                      <span className="text-xs font-bold font-sans">جاري تنزيل التذاكر الحية...</span>
                    </div>
                  ) : getFilteredTickets().length === 0 ? (
                    <div className="p-8 text-center text-slate-600 border border-dashed border-slate-800 rounded-lg text-xs font-sans">
                      لا توجد تذاكر دعم توافق هذا البحث.
                    </div>
                  ) : (
                    getFilteredTickets()
                      .map((t) => {
                        const isSelected = activeTicket?.id === t.id;
                        const statusColors = 
                          t.status === "جديد" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                          t.status === "قيد المتابعة" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" :
                          t.status === "تم الرد" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          "bg-slate-800/20 text-slate-400 border-slate-800";
                        
                        return (
                          <div
                            key={t.id}
                            onClick={() => {
                              setActiveTicket(t);
                              setReplyText("");
                            }}
                            className={`p-3 rounded-lg border text-right cursor-pointer transition-all space-y-2.5 ${
                              isSelected
                                ? "bg-cyan-500/5 border-cyan-600/50 shadow-md shadow-cyan-500/5"
                                : "bg-slate-950/40 border-slate-850 hover:bg-slate-900/60 hover:border-slate-750"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${statusColors}`}>
                                {t.status}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                #{t.id.slice(0, 8)}
                              </span>
                            </div>

                            <div>
                              <h5 className="text-xs font-extrabold text-white truncate">
                                {t.subject || t.category || "استفسار دعم فني"}
                              </h5>
                              <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                                <span className="font-bold text-slate-300">{t.courierName}</span>
                                <span className="font-mono text-slate-500">{t.courierPhone}</span>
                              </p>
                            </div>

                            <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1.5 border-t border-slate-900">
                              <span>القسم: {t.category}</span>
                              <span className="font-mono">
                                {new Date(t.createdAt).toLocaleDateString("ar-SA")}
                              </span>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

              {/* تفاصيل التذكرة الحالية والدردشة النشطة */}
              <div className="col-span-1 lg:col-span-2 bg-slate-900/60 rounded-xl p-5 border border-slate-800 flex flex-col justify-between min-h-[500px]">
                {activeTicket ? (
                  <div className="flex flex-col h-full justify-between flex-1 space-y-4">
                    {/* ترويسة التذكرة المحددة */}
                    <div className="border-b border-slate-800 pb-4 space-y-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-black text-white flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse"></span>
                            <span>{activeTicket.subject || activeTicket.category}</span>
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 font-sans md:flex-row flex-col">
                            <span>صاحب التذكرة: <strong className="text-slate-200">{activeTicket.courierName}</strong></span>
                            <span className="hidden md:inline text-slate-700">|</span>
                            <span>الهاتف: <strong className="text-slate-200 font-mono">{activeTicket.courierPhone}</strong></span>
                          </p>
                        </div>

                        {/* تحكم بحالة التذكرة */}
                        <div className="flex items-center gap-2.5 self-start">
                          <label className="text-[10px] font-bold text-slate-400">حالة التذكرة:</label>
                          <select
                            value={activeTicket.status}
                            onChange={async (e) => {
                              const newSt = e.target.value;
                              const pw = password || sessionStorage.getItem("admin_pw") || "";
                              try {
                                const res = await fetch("/api/admin/tickets/update-status", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    password: pw,
                                    ticketId: activeTicket.id,
                                    status: newSt
                                  })
                                });
                                const data = await res.json();
                                if (res.ok && data.success) {
                                  setSupportTickets((prev) =>
                                    prev.map((t) => (t.id === activeTicket.id ? { ...t, status: newSt } : t))
                                  );
                                  setActiveTicket((prev: any) => ({ ...prev, status: newSt }));
                                }
                              } catch (err) {
                                console.error("Error updating ticket status:", err);
                              }
                            }}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 hover:border-slate-700 cursor-pointer"
                          >
                            <option value="جديد">جديد</option>
                            <option value="قيد المتابعة">قيد المتابعة</option>
                            <option value="تم الرد">تم الرد</option>
                            <option value="مغلق">مغلق</option>
                          </select>
                        </div>
                      </div>

                      <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850 text-xs text-slate-300 leading-relaxed text-right">
                        <span className="text-[9px] font-bold text-cyan-400 block mb-1">شرح المشكلة والمستندات المقدمة:</span>
                        {activeTicket.messages && activeTicket.messages[0] ? activeTicket.messages[0].text : (activeTicket.subject || "لا توجد تفاصيل إضافية")}
                      </div>
                    </div>

                    {/* مسار رسائل المحادثة */}
                    <div className="flex-grow overflow-y-auto max-h-[300px] p-2 bg-slate-950/20 rounded-lg border border-slate-900 space-y-4 custom-scrollbar flex flex-col">
                      {activeTicket.messages?.length === 0 ? (
                        <div className="m-auto text-center text-slate-600 text-xs p-8">
                          لا توجد رسائل سابقة. اكتب رداً بالأسفل لتباشر الكابتن الميداني بالحلول المناسبة.
                        </div>
                      ) : (
                        activeTicket.messages?.map((m: any, idx: number) => {
                          const isAdmin = m.sender === "admin";
                          return (
                            <div
                              key={idx}
                              className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                                isAdmin
                                  ? "bg-cyan-600/90 text-white self-start text-right"
                                  : "bg-slate-950 text-slate-200 self-end text-right border border-slate-850"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-6 text-[9px] opacity-75 mb-1 select-none">
                                <span className="font-bold">
                                  {isAdmin ? "إدارة بوارق الشرق" : activeTicket.courierName}
                                </span>
                                <span className="font-mono">
                                  {new Date(m.createdAt || m.time || Date.now()).toLocaleTimeString("ar-SA", { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
                              {m.imageUrl && (
                                <div className="mt-2 rounded-lg border border-white/5 overflow-hidden max-w-full bg-slate-900">
                                  <img 
                                    src={m.imageUrl} 
                                    alt="مرفق صورة" 
                                    onClick={() => setZoomImageUrl(m.imageUrl)}
                                    className="max-h-40 max-w-full object-cover rounded cursor-zoom-in hover:opacity-95 transition-all select-none mx-auto block" 
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* إدخال الرد الجديد */}
                    <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 space-y-3">
                      {/* Admin Quick Replies Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 justify-end">
                        <span className="text-[9px] text-slate-500 font-bold ml-1">رد نموذجي سريع للسرعة الفائقة:</span>
                        {[
                          "تحية طيبة كابتن، جاري التحقق من كود وتطبيق التوصيل فوراً وكافة الإجراءات سريعة.",
                          "قامت الإدارة بمراجعة الحساب وتأكيد تفعيله بالكامل، يرجى تشغيل التطبيق مجدداً ⚡",
                          "يرجى كابتن التأكد من رفع صورة رقم الآيبان وصورة تطابق الهوية الوطنية للتأكيد.",
                          "الرجاء كابتن تزويدنا بصورة رقم اللوحة الجديد المعتمد والمرخص من المرور."
                        ].map((pill, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setReplyText(pill)}
                            className="px-2.5 py-1 text-[9px] bg-slate-900 border border-slate-800 hover:border-cyan-500 hover:bg-slate-850 rounded-full text-slate-400 hover:text-white transition-all cursor-pointer"
                          >
                            {pill.slice(0, 42)}...
                          </button>
                        ))}
                      </div>

                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!replyText.trim()) return;

                          setSendingReply(true);
                          const pw = password || sessionStorage.getItem("admin_pw") || "";
                          try {
                            const res = await fetch(`/api/support/tickets/${activeTicket.id}/messages`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                sender: "admin",
                                text: replyText,
                                password: pw
                              })
                            });
                            const data = await res.json();
                            if (res.ok && data.success) {
                              setReplyText("");
                              // Fast update active ticket list locally with the new message and set status to "تم الرد"
                              setSupportTickets((prev) =>
                                prev.map((t) => (t.id === activeTicket.id ? { 
                                  ...t, 
                                  status: "تم الرد",
                                  messages: [...(t.messages || []), { sender: "admin", text: replyText, createdAt: new Date().toISOString() }]
                                } : t))
                              );
                              setActiveTicket((prev: any) => ({
                                ...prev,
                                status: "تم الرد",
                                messages: [...(prev.messages || []), { sender: "admin", text: replyText, createdAt: new Date().toISOString() }]
                              }));
                            } else {
                              alert(data.error || "خطأ أثناء إرسال الرسالة");
                            }
                          } catch (err) {
                            console.error("Error replying on ticket:", err);
                          } finally {
                            setSendingReply(false);
                          }
                        }}
                        className="space-y-2 text-right"
                      >
                        <textarea
                          rows={2}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="اكتب رد الدعم الفني المباشر هنا لمساعدة الكابتن..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none leading-relaxed text-right placeholder-slate-700 focus:ring-1 focus:ring-cyan-500 font-sans"
                        />
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => fetchTickets()}
                            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer hover:bg-slate-900"
                            title="تحديث تذاكر الدعم والدردشة"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="submit"
                            disabled={sendingReply || !replyText.trim()}
                            className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
                          >
                            {sendingReply ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>جاري إرسال الرد...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5 -scale-x-100" />
                                <span>إرسال رد الدستور الميداني 🚀</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="m-auto text-center space-y-3.5 p-12 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400">
                      <LifeBuoy className="w-8 h-8 animate-pulse text-cyan-500" />
                    </div>
                    <h5 className="text-sm font-extrabold text-white">منصة مركز حل نزاعات واستفسارات المناديب المباشر</h5>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed font-sans">
                      الرجاء توجيه اهتمامك بالضغط على أي تذكرة قادمة من الكباتن من القائمة اليمنى لفتح الخط الساخن والاطلاع على مسار المشكلة والمستندات والرد فوراً.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === "documents" ? (
            /* Tab 6: وثائق المناديب والتعاقدات الإلكترونية المتقدمة البصرية */
            <div className="p-6 md:p-8 space-y-8 bg-slate-950/40 rounded-2xl text-right animate-fade-in border border-slate-900" id="documents-hub">
              {/* Header block with search details */}
              <div className="border-b border-slate-800 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-500" />
                    <span>أرشيف وثائق وتواقيع المناديب المعتمدة (Bawariq Ledger) 🖋️</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    هنا يتم استلام وفهرسة تواقيع المناديب على اتفاقيات العمل الشروط المالية إلكترونياً. يمكنك استخراج طباعة العقد التشغيلي كامل لكل قائد مركبة ومطابقة التواقيع مع سجلات الأحوال المدنية.
                  </p>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1">
                    <span>موقّع ومكتمل:</span>
                    <strong className="font-mono">{couriers.filter(c => c.agreementAccepted).length}</strong>
                  </span>
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1">
                    <span>بانتظار التوقيع:</span>
                    <strong className="font-mono">{couriers.filter(c => !c.agreementAccepted).length}</strong>
                  </span>
                </div>
              </div>

              {/* Grid of Documents */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(() => {
                  // Filter couriers based on search term
                  const query = searchTerm.toLowerCase().trim();
                  const docCouriers = couriers.filter(c => {
                    const matchesSearch = !query || 
                      c.name.toLowerCase().includes(query) ||
                      c.phone.includes(query) ||
                      c.id.includes(query) ||
                      (c.nationalId && c.nationalId.includes(query)) ||
                      (c.agreementSignature && c.agreementSignature.toLowerCase().includes(query));
                    return matchesSearch;
                  });

                  if (docCouriers.length === 0) {
                    return (
                      <div className="col-span-full py-12 text-center text-slate-500 bg-slate-950/60 rounded-xl border border-slate-900">
                        لا توجد وثائق تطابق البحث الحالي
                      </div>
                    );
                  }

                  return docCouriers.map((c) => {
                    return (
                      <div 
                        key={c.id} 
                        className={`bg-slate-950 border rounded-2xl p-5 space-y-4 hover:scale-[1.01] transition-all flex flex-col justify-between relative overflow-hidden ${
                          c.agreementAccepted 
                            ? "border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/10" 
                            : "border-slate-800 bg-gradient-to-br from-slate-950 to-slate-900/40"
                        }`}
                      >
                        {/* Status watermark banner */}
                        {c.agreementAccepted && (
                          <div className="absolute -top-1 -left-1 bg-emerald-500 text-slate-950 text-[8px] font-black uppercase px-2 py-0.5 rounded-br-lg rotate-12 select-none opacity-80">
                            SIGNED ✔
                          </div>
                        )}

                        <div className="space-y-3">
                          {/* Top bar Folder representation */}
                          <div className="flex justify-between items-center border-b border-slate-900 pb-2.5">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded ${c.agreementAccepted ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-850 text-slate-400"}`}>
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 block font-mono">ID: {c.id.substring(0,6).toUpperCase()}</span>
                                <h4 className="text-xs font-bold text-white max-w-[120px] truncate">{c.name}</h4>
                              </div>
                            </div>

                            {c.agreementAccepted ? (
                              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black">
                                معتمد ومقر 🔒
                              </span>
                            ) : (
                              <span className="text-[9px] bg-amber-500/10 text-amber-550 px-2 py-0.5 rounded font-bold">
                                معلّق التوقيع ⏳
                              </span>
                            )}
                          </div>

                          {/* Info Rows */}
                          <div className="space-y-1.5 text-xs text-slate-300">
                            <div className="flex justify-between font-sans">
                              <span className="text-slate-500 font-bold">رقم الهاتف:</span>
                              <span className="font-mono text-white font-bold">{c.phone}</span>
                            </div>
                            <div className="flex justify-between font-sans">
                              <span className="text-slate-500 font-bold">المدينة / المنطقة:</span>
                              <span className="text-white font-bold">{c.city}</span>
                            </div>
                            <div className="flex justify-between font-sans">
                              <span className="text-slate-500 font-bold">رقم الهوية:</span>
                              <span className="font-mono text-white font-bold">{c.nationalId || "لم يدخل بعد"}</span>
                            </div>
                            <div className="flex justify-between font-sans">
                              <span className="text-slate-500 font-bold">التطبيقات المختارة:</span>
                              <span className="text-amber-450 font-extrabold max-w-[120px] truncate text-left select-none">
                                {Array.isArray(c.apps) && c.apps.length > 0 ? c.apps.join(", ") : "لا توجد"}
                              </span>
                            </div>
                          </div>

                          {/* Visual Electronic Hand Signature representation */}
                          {c.agreementAccepted ? (
                            <div className="bg-slate-900 border border-dashed border-slate-850 p-2.5 rounded-xl text-center relative overflow-hidden select-none">
                              <span className="text-[8px] text-slate-600 block text-right font-mono mb-1">SIGNATURE STAMP:</span>
                              <p className="font-serif italic text-sm text-emerald-400 font-bold py-1 select-none">
                                {c.agreementSignature || c.name}
                              </p>
                              <span className="text-[8px] text-slate-500 block text-left font-mono">
                                تاريخ البصمة: {new Date(c.agreementAcceptedAt || "").toLocaleDateString('ar-SA')}
                              </span>
                            </div>
                          ) : (
                            <div className="bg-slate-900/50 border border-slate-900 p-3 rounded-xl text-center">
                              <p className="text-[10px] text-slate-500 leading-relaxed">
                                لم يتم توقيع العقد حتى الآن من قبل الكابتن.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Action details */}
                        <div className="pt-2">
                          {c.agreementAccepted ? (
                            <button
                              type="button"
                              onClick={() => setViewingDocumentCourier(c)}
                              className="w-full py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 text-xs font-black rounded-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
                              <span>مراجعة وطباعة وثيقة العمل كاملة</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="w-full py-2 bg-slate-900 text-slate-600 text-xs font-bold rounded-lg cursor-not-allowed text-center"
                            >
                              بانتظار مصادقة الكابتن ⏳
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          ) : filteredCouriers.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2 bg-slate-950 border border-slate-850 rounded-xl">
              <p className="text-sm font-bold">عذراً، لم يتم العثور على أي كباتن يطابقون خيارات البحث والفرز المحددة في هذا القسم.</p>
              <p className="text-xs text-slate-600">يمكنك محاولة إزالة الفلاتر أو تصفير حقل البحث الفوري.</p>
            </div>
          ) : activeTab === "activated" ? (
            /* Tab 2: Activated Couriers Complete Profiles Tab with 3D isometric blocks layout */
            <div className="space-y-6 p-1 md:p-3">
              {/* 3D Header Row (aligned horizontally) */}
              <div className="hidden lg:grid grid-cols-6 gap-6 px-6 py-4 bg-slate-900/60 border border-slate-800 text-[11px] text-slate-350 font-extrabold uppercase tracking-wider text-right rounded-xl shadow-[3px_3px_0px_0px_rgba(245,158,11,0.1)]">
                <div>بيانات الكابتن والتواصل</div>
                <div>الهوية والآيبان البنكي (IBAN)</div>
                <div>المركبة وتفاصيل لوحة المرور</div>
                <div>كود وتفعيل البرامج</div>
                <div>تاريخ التفعيل وملاحظات الإدارة</div>
                <div className="text-center font-bold text-amber-400">الملف التشغيلي والإجراءات</div>
              </div>

              {/* 3D Body Card list */}
              <div className="space-y-5">
                {filteredCouriers.map((c) => {
                  const shadowColorClass = "shadow-[4px_4px_0px_0px_#10b981] hover:shadow-[10px_10px_0px_0px_#10b981] hover:border-emerald-500/50";
                  
                  return (
                    <div 
                      key={c.id} 
                      className={`grid grid-cols-1 lg:grid-cols-6 gap-6 items-center p-6 bg-slate-900/40 rounded-xl border-2 border-slate-800 transition-all duration-300 group [transform-style:preserve-3d] hover:-translate-y-1 hover:-translate-x-1 ${shadowColorClass}`}
                    >
                      {/* Name, ID & Phone with highly stylized 3D Car icon badge */}
                      <div className="flex items-center gap-4">
                        <div className="relative flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 border border-emerald-500/30 shadow-[2px_2px_0px_rgba(16,185,129,0.25)] group-hover:shadow-[5px_5px_0px_rgba(16,185,129,0.4)] transition-all flex flex-col justify-center">
                          <Car className="w-7 h-7 text-emerald-450 animate-pulse group-hover:-translate-y-0.5 transition-transform" />
                          <div className="absolute bottom-1 w-8 h-1 bg-emerald-500/10 rounded-full opacity-60"></div>
                        </div>
                        <div>
                          <div className="font-extrabold text-white text-sm flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                            <span className="line-clamp-1">{c.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-550 font-mono mt-0.5">ID: {c.id}</div>
                          <div className="text-amber-500 font-bold mt-1 tracking-wider font-mono text-xs">{c.phone}</div>
                          <div className="text-slate-400 text-[10px] mt-0.5">{c.city}</div>
                        </div>
                      </div>

                      {/* National ID & IBAN */}
                      <div className="space-y-1.5 text-right">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[11px] text-slate-450">سجل مدني: </span>
                          <span className="font-mono text-amber-500 font-extrabold">{c.nationalId || "🚨 غير مدخل"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[10px] text-slate-400">IBAN: </span>
                          <span className="font-mono text-slate-200 text-[10px] font-extrabold tracking-tight">{c.iban || "🚨 غير مدخل"}</span>
                        </div>
                      </div>

                      {/* Vehicle Details */}
                      <div className="space-y-1.5 text-right">
                        <div className="flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                          <span className="text-[11px] font-bold text-slate-200">{c.vehicleModel || "🚨 لم يعين"}</span>
                        </div>
                        <div className="inline-block bg-slate-950 border border-slate-800 px-2.5 py-0.5 rounded text-[10px] text-amber-400 font-mono">
                          لوحة: {c.carPlate || "🚨 غير مدخل"}
                        </div>
                      </div>

                      {/* Activated apps */}
                      <div className="space-y-1.5 text-right">
                        <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          <span>كود البرامج: </span>
                          <span className="font-mono text-emerald-400 font-extrabold bg-emerald-500/10 px-1 py-0.5 rounded">{c.appCourierCode || "🚨 لم يتم التعيين"}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 leading-relaxed">
                          التطبيقات: {c.apps && c.apps.length > 0 ? c.apps.join(" - ").toUpperCase() : "كامل تطبيقات بوارق"}
                        </div>
                      </div>

                      {/* Admin notes & activation dates */}
                      <div className="space-y-1.5 text-right max-w-xs">
                        <div className="text-[11px] text-slate-300 line-clamp-2" title={c.adminNotes || "لا توجد ملاحظات"}>
                          {c.adminNotes || <span className="text-slate-600 italic">لا توجد ملاحظات إدارية مسجلة</span>}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-500" />
                          <span>التفعيل: {c.activationDate || "غير محدد"}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="text-center">
                        <div className="flex flex-col gap-2 items-center justify-center max-w-[170px] mx-auto">
                          <button
                            type="button"
                            onClick={() => openEditProfile(c)}
                            className="px-3 py-1.5 bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-amber-500/15 hover:from-amber-500 hover:to-amber-600 hover:text-slate-950 text-amber-400 border border-amber-500/30 rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer w-full shadow-[2px_2px_0px_rgba(245,158,11,0.15)] hover:shadow-none"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>تعديل وحفظ الملف الكامل</span>
                          </button>
                          
                          <select
                            value={c.status}
                            onChange={(e) => handleStatusChange(c.id, e.target.value as any)}
                            className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-[9px] font-bold text-slate-400 hover:text-white cursor-pointer w-full text-center"
                          >
                            <option value="تم التفعيل">مفعّل (ابقاء بالحسابات المتميزة)</option>
                            <option value="جديد">إرجاع لطلبات المراجعة</option>
                            <option value="تمت المقابلة">إرجاع لخانة تمت المقابلة</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleDeleteCourier(c.id, c.name)}
                            className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 border border-rose-500/20 rounded text-[9px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer w-full"
                          >
                            <span>حذف من السجلات نهائياً</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Tab 1: Normal applications queue with 3D isometric blocks layout */
            <div className="space-y-6 p-1 md:p-3">
              {/* 3D Header Row (aligned horizontally) */}
              <div className="hidden lg:grid grid-cols-7 gap-6 px-6 py-4 bg-slate-900/60 border border-slate-800 text-[11px] text-slate-350 font-extrabold uppercase tracking-wider text-right rounded-xl shadow-[3px_3px_0px_0px_rgba(245,158,11,0.1)]">
                <div>المرشح وحالة المتابعة</div>
                <div>بيانات التواصل والمدينة</div>
                <div className="text-center">حالة الطلب المحدثة</div>
                <div>التطبيقات المختارة</div>
                <div>الخبرة والملاحظات</div>
                <div>موعد المقابلة المعتمد</div>
                <div className="text-left">توقيت تقديم الطلب</div>
              </div>

              {/* 3D Body Card list */}
              <div className="space-y-5">
                {filteredCouriers.map((c) => {
                  const currentStatus = c.status || "جديد";
                  
                  // Color codes for 3D state
                  let shadowColorClass = "shadow-[4px_4px_0px_0px_#f59e0b] hover:shadow-[10px_10px_0px_0px_#f59e0b] hover:border-amber-500/50";
                  let iconColor = "text-amber-500";
                  let bgBorderColor = "border-amber-500/20 shadow-[2px_2px_0px_rgba(245,158,11,0.25)] group-hover:shadow-[5px_5px_0px_rgba(245,158,11,0.4)]";

                  if (currentStatus === "تمت المقابلة") {
                    shadowColorClass = "shadow-[4px_4px_0px_0px_#06b6d4] hover:shadow-[10px_10px_0px_0px_#06b6d4] hover:border-cyan-500/50";
                    iconColor = "text-cyan-400";
                    bgBorderColor = "border-cyan-500/20 shadow-[2px_2px_0px_rgba(6,182,212,0.25)] group-hover:shadow-[5px_5px_0px_rgba(6,182,212,0.4)]";
                  } else if (currentStatus === "تم التفعيل") {
                    shadowColorClass = "shadow-[4px_4px_0px_0px_#10b981] hover:shadow-[10px_10px_0px_0px_#10b981] hover:border-emerald-500/50";
                    iconColor = "text-emerald-400";
                    bgBorderColor = "border-emerald-500/20 shadow-[2px_2px_0px_rgba(16,185,129,0.25)] group-hover:shadow-[5px_5px_0px_rgba(16,185,129,0.4)]";
                  }

                  return (
                    <div 
                      key={c.id} 
                      className={`grid grid-cols-1 lg:grid-cols-7 gap-6 items-center p-6 bg-slate-900/40 rounded-xl border-2 border-slate-800 transition-all duration-300 group [transform-style:preserve-3d] hover:-translate-y-1 hover:-translate-x-1 ${shadowColorClass}`}
                    >
                      {/* Name with 3D status-colored car icon badge */}
                      <div className="flex items-center gap-4">
                        <div className={`relative flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 border ${bgBorderColor} transition-all flex flex-col justify-center`}>
                          <Car className={`w-7 h-7 ${iconColor} animate-pulse group-hover:-translate-y-0.5 transition-transform`} />
                          <div className="absolute bottom-1 w-8 h-1 bg-slate-800/80 rounded-full opacity-60"></div>
                        </div>
                        <div>
                          <div className="font-extrabold text-white text-sm">{c.name}</div>
                          <div className="text-[10px] text-slate-550 font-mono mt-0.5">ID: {c.id}</div>
                        </div>
                      </div>

                      {/* Phone + City */}
                      <div className="space-y-1 text-right">
                        <div className="font-semibold text-slate-200 tracking-wider font-mono">{c.phone}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 justify-start">
                          <MapPin className="w-3 h-3 text-amber-500 animate-pulse" />
                          <span>{c.city}</span>
                        </div>
                      </div>

                      {/* Manual Status Column */}
                      <div className="text-center">
                        <div className="flex flex-col gap-2 items-center justify-center">
                          <div className="inline-block relative">
                            <select
                              value={currentStatus}
                              disabled={updatingId === c.id}
                              onChange={(e) => handleStatusChange(c.id, e.target.value as any)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer focus:outline-none transition-all duration-200 text-center ${
                                currentStatus === "جديد"
                                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                                  : currentStatus === "تمت المقابلة"
                                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                              } ${updatingId === c.id ? "opacity-40 cursor-not-allowed" : ""}`}
                            >
                              <option value="جديد" className="bg-slate-950 text-amber-400">جديد</option>
                              <option value="تمت المقابلة" className="bg-slate-950 text-cyan-400">تمت المقابلة</option>
                              <option value="تم التفعيل" className="bg-slate-950 text-emerald-400">تفعيل وتنشيط الحساب</option>
                            </select>
                            {updatingId === c.id && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteCourier(c.id, c.name)}
                            className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 border border-rose-500/20 rounded text-[9px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer w-full"
                          >
                            <span>حذف المندوب</span>
                          </button>
                        </div>
                      </div>

                      {/* Selected apps */}
                      <div className="text-right">
                        <div className="flex flex-wrap gap-1 justify-start">
                          {c.apps && c.apps.length > 0 ? (
                            c.apps.map((appId) => (
                              <span
                                key={appId}
                                className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-amber-400/85 rounded text-[9px] font-extrabold shadow-[1px_1px_0px_rgba(245,158,11,0.15)]"
                              >
                                {appId.toUpperCase()}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-600 italic">لم يحدد</span>
                          )}
                        </div>
                      </div>

                      {/* Experience Info */}
                      <div className="text-right max-w-xs">
                        <p className="text-slate-300 leading-relaxed text-[11px] line-clamp-2" title={c.experience}>
                          {c.experience}
                        </p>
                      </div>

                      {/* Interview Date Slot */}
                      <div className="text-right">
                        {c.interviewDate && c.interviewTime ? (
                          <div className="space-y-1 bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 shadow-[2px_2px_0px_rgba(245,158,11,0.1)]">
                            <span className="font-extrabold text-white block text-[11px] text-amber-400">
                              {c.interviewDate.split(" (")[0]}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {c.interviewTime}
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold">
                            <span>لم يحجز موعداً بعد</span>
                          </div>
                        )}
                      </div>

                      {/* Created Date */}
                      <div className="text-slate-500 font-mono text-[10px] text-left">
                        <div>{new Date(c.createdAt).toLocaleDateString("ar-SA")}</div>
                        <div className="text-[9px] text-slate-600 mt-0.5 font-bold">
                          {new Date(c.createdAt).toLocaleTimeString("ar-SA", { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Complete Profile Editor Modal */}
      {editingCourier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in directive-overlay" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">إكمال وتقييم الملف التشغيلي الكامل للمندوب</h3>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <p className="text-xs text-slate-400">المرشح: <span className="text-amber-400 font-bold">{editingCourier.name}</span> | جوال: {editingCourier.phone}</p>
                    {autoSaveStatus === "saving" && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-medium bg-amber-550/10 text-amber-400 border border-amber-500/20 rounded-md animate-pulse">
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        <span>جاري الحفظ الآمن...</span>
                      </span>
                    )}
                    {autoSaveStatus === "saved" && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-medium bg-emerald-550/10 text-emerald-400 border border-emerald-500/20 rounded-md animate-fade-in">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>تم الحفظ والمزامنة ✓</span>
                      </span>
                    )}
                    {autoSaveStatus === "error" && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-medium bg-rose-550/10 text-rose-400 border border-rose-500/20 rounded-md animate-bounce">
                        <AlertCircle className="w-2.5 h-2.5" />
                        <span>فشل الحفظ التلقائي!</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCourier(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleProfileSave} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* National ID */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-300 block flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-500" />
                    <span>رقم الهوية الوطنية / الإقامة</span>
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ""))}
                    placeholder="مثال: 1024354228"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono text-center"
                  />
                  <p className="text-[9px] text-slate-500">مكون من 10 خانات رقمية للتحقق وعمل التسويات المالية والامنية.</p>
                </div>

                {/* Bank IBAN */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-300 block flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                    <span>رقم الآيبان البنكي للتحويلات (IBAN)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={30}
                    value={iban}
                    onChange={(e) => setIban(e.target.value.toUpperCase())}
                    placeholder="مثال: SA038000000..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono tracking-wide text-center"
                  />
                  <p className="text-[9px] text-slate-500">يبدأ برمز الدولة SA متبوعاً بالحساب البنكي للتسويات الأسبوعية.</p>
                </div>

                {/* Vehicle Model */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-300 block flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-amber-500" />
                    <span>نوع وموديل المركبة</span>
                  </label>
                  <input
                    type="text"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="مثال: تويوتا كامري 2022"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 text-right"
                  />
                  <p className="text-[9px] text-slate-500">الماركة مع سنة الصنع لتوثيق فئة الخدمة بالنقل والتطبيقات المعتمدة.</p>
                </div>

                {/* Vehicle Plate */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-300 block flex items-center gap-1.5">
                    <span className="font-bold text-amber-500 font-mono text-xs">١ - أ - ب</span>
                    <span>رقم وحروف لوحة المركبة</span>
                  </label>
                  <input
                    type="text"
                    value={carPlate}
                    onChange={(e) => setCarPlate(e.target.value)}
                    placeholder="مثال: ح د ر 2356"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 text-center"
                  />
                  <p className="text-[9px] text-slate-500">إدخال لوحة الكابتن لتوثيق الهوية المرورية وحق الحركة التشغيلي.</p>
                </div>

                {/* Partner apps Courier Code */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-300 block flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>كود تفعيل المندوب بالشركات الزميلة</span>
                  </label>
                  <input
                    type="text"
                    value={appCourierCode}
                    onChange={(e) => setAppCourierCode(e.target.value)}
                    placeholder="مثال: B29452 / GH-902"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono text-center"
                  />
                  <p className="text-[9px] text-slate-500">معرّف السائق المعتمد والنشط بتطبيقات التوصيل الزميلة بـ بوارق.</p>
                </div>

                {/* Account Activation Date */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-300 block flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>تاريخ تنشيط الحساب الفعلي بـ بوارق</span>
                  </label>
                  <input
                    type="text"
                    value={activationDate}
                    onChange={(e) => setActivationDate(e.target.value)}
                    placeholder="مثال: 2026/05/22"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 text-center"
                  />
                  <p className="text-[9px] text-slate-500">تاريخ تسليم الحساب للعمل الميداني الفعلي والاعتراف بمستنداته.</p>
                </div>
              </div>

              {/* General Admin Notes fields */}
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-slate-300 block">ملاحظات HR والتقييم والبيانات الإدارية الخاصة بـ بوارق</label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="أدخل أي ملاحظات كفالات، عهود، سلوك كباتن، غرامات، أو تفاصيل تشغيلية أخرى للمندوب هنا..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 resize-none leading-relaxed text-right"
                />
              </div>

              {/* Actions Footer inside modal */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 bg-slate-900">
                <button
                  type="button"
                  onClick={() => setEditingCourier(null)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  إلغاء الإجراء
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 rounded-lg text-xs font-black flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري مزامنة السحابة...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>حفظ ومزامنة وتحديث الملف التشغيلي</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Image Zoom Overlay Modal */}
      {zoomImageUrl && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setZoomImageUrl(null)}
        >
          <div className="absolute top-4 right-4 z-[101]">
            <button 
              onClick={() => setZoomImageUrl(null)}
              className="p-2 bg-slate-905 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer flex items-center justify-center animate-scale-up"
              title="إغلاق التكبير"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-slate-800 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <img 
              src={zoomImageUrl} 
              alt="صورة مكبرة للتفاصيل" 
              className="max-w-full max-h-[85vh] object-contain block mx-auto"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {/* --- 📝 Premium Contract & Electronic Agreement Document Popup Modal (طباعة ومراجعة) --- */}
      {viewingDocumentCourier && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6" id="formal-document-modal">
          <div className="bg-white text-slate-900 rounded-3xl w-full max-w-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none animate-fade-in border-4 border-slate-100">
            
            {/* Absolute floating controls (hidden in prints) */}
            <div className="absolute top-4 left-4 flex gap-2 print:hidden z-10">
              {/* Print button */}
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-650 text-white font-extrabold text-xs rounded-xl hover:bg-emerald-500 transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير وطباعة 🖨️</span>
              </button>

              {/* Close Button */}
              <button
                onClick={() => setViewingDocumentCourier(null)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contract Page Layout (Pure elegant vector display, styled for print) */}
            <div className="p-8 md:p-12 space-y-8 flex-1 overflow-y-auto text-right font-sans" id="printable-contract-page">
              {/* Document Header (Bawariq Al-Sharq Branding) */}
              <div className="border-b-4 border-amber-500 pb-5 flex flex-col md:flex-row items-center justify-between text-center md:text-right gap-4">
                <div className="space-y-1">
                  <h1 className="text-xl font-black tracking-tight text-slate-900">شركة بوارق الشرق للخدمات اللوجستية</h1>
                  <p className="text-xs text-slate-500 font-bold">بوابة التوثيق والمصادقة التنظيمية والامتثال للمناديب</p>
                  <p className="text-[10px] text-slate-400 font-mono">CR-NO: 1010882191 | LICENSED BY TRANSPORT GENERAL AUTHORITY</p>
                </div>
                {/* Circular Stamp / Seal representation */}
                <div className="w-16 h-16 rounded-full border-4 border-dashed border-amber-500 flex flex-col items-center justify-center font-mono opacity-85 select-none shrink-0">
                  <span className="text-[8px] font-black text-amber-600 tracking-tighter leading-none">BAWARIQ</span>
                  <span className="text-[9px] font-bold text-slate-800 leading-none mt-1">APPROVED</span>
                </div>
              </div>

              {/* Contract Identifier Metadata */}
              <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl grid grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-semibold">
                <div>
                  <span className="text-slate-400 text-[10px] block font-bold">رقم وثيقة العقد:</span>
                  <span className="font-mono text-slate-900 text-sm font-bold">BQ-2026-REG-{viewingDocumentCourier.id.substring(0,8).toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-bold">تاريخ المصادقة الإلكترونية:</span>
                  <span className="text-slate-900 text-xs font-bold">{new Date(viewingDocumentCourier.agreementAcceptedAt || "").toLocaleString('ar-SA')}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-bold">حالة الوثيقة:</span>
                  <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>معتمدة وصالحة قانونياً</span>
                  </span>
                </div>
              </div>

              {/* Contract Parties definition */}
              <div className="space-y-3.5 border-b border-slate-150 pb-5">
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>بند أطراف العقد:</span>
                </h2>
                <div className="space-y-2 text-xs leading-relaxed text-slate-850">
                  <p>
                    <strong>الطرف الأول (صاحب العمل المعتمد):</strong> مؤسسة شركة بوارق الشرق للخدمات اللوجستية والتوصيل السريع بالمملكة العربية السعودية.
                  </p>
                  <p>
                    <strong>الطرف الثاني (الكابتن المندوب):</strong> السيد/السيدة <span className="font-extrabold text-slate-900 border-b border-dotted border-slate-900 px-2">{viewingDocumentCourier.name}</span>، 
                    رقم الهاتف: <span className="font-mono font-bold text-slate-900">{viewingDocumentCourier.phone}</span>، 
                    مدينة العمل: <span className="font-bold text-slate-900">{viewingDocumentCourier.city}</span>، 
                    ورقم الهوية الوطنية/الإقامة: <span className="font-mono font-bold text-slate-900 border-b border-dotted border-slate-900 px-2">{viewingDocumentCourier.nationalId || "لم تكتمل"}</span>.
                  </p>
                </div>
              </div>

              {/* Legal Clauses Statement */}
              <div className="space-y-4">
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>البنود والشروط ومحضر الاتفاقية والعمولات المعتمدة:</span>
                </h2>
                <div className="space-y-3 text-[11px] text-slate-700 leading-relaxed text-justify list-decimal font-sans">
                  <p>
                    <strong>البند الأول (الشفافية وقبول العمولات التفعيلية):</strong> يوافق الطرف الثاني بكامل إرادته وصلاحياته القانونية واللوجستية على العمل بتطبيقات التوصيل المختارة (وهي بالتفصيل: {viewingDocumentCourier.apps?.join(", ") || "لا توجد"}). كما يعلن الطرف الثاني اطلاعه الكامل وموافقته على تسعيرات الشرائح ونسب العمولات والخصومات المئوية وإيجار اليوزرات الموضحة بالكتيب اللوجستي لشركة بوارق الشرق.
                  </p>
                  <p>
                    <strong>البند الثاني (حفظ العهد وصيانة البيانات):</strong> يتعهد الكابتن المندوب بالمحافظة المطلقة على سرية أكواد التوصيل المسلمة له، ويتحمل كامل المسؤولية عن أي أضرار مادية أو معنوية ناتجة عن تسليم هذه الأكواد لجهات خارجية أو العمل بها خارج النطاق اللوجستي المعتمد.
                  </p>
                  <p>
                    <strong>البند الثالث (الالتزام بالقوانين العامة):</strong> يلتزم الطرف الثاني بالتقيد الصارم بالتعاليم والقيم الأخلاقية للمملكة، ومراعاة آداب التعامل مع العملاء والموردين. ويقر بتحمله المسؤولية التامة عن كافة الالتزامات الجنائية والمرورية التي تقع أثناء فترات تفعيله للعمل.
                  </p>
                  <p>
                    <strong>البند الرابع (حجية البصمة الإلكترونية والتوقيع الرقمي):</strong> بموجب أحكام نظام المعاملات الإلكترونية واللوائح ذات العلاقة المعمول بها بالمملكة، يقر الطرفان بتمتع التوقيع الإلكتروني والبصمة الرقمية المسجلة أدناه بالحجية القانونية والالتزام التعاقدي الصارم، وتعتبر بديلاً كافياً ووافياً للتوقيع الخطي الورقي.
                  </p>
                </div>
              </div>

              {/* Detailed Signature Blocks */}
              <div className="grid grid-cols-2 gap-8 pt-6 border-t-2 border-slate-200">
                {/* Party A Signature */}
                <div className="space-y-3 text-center border border-slate-100 p-4 rounded-xl bg-slate-50 relative overflow-hidden">
                  <h3 className="text-xs font-black text-slate-900">توقيع الطرف الأول (شركة بوارق الشرق)</h3>
                  <div className="py-2.5 flex items-center justify-center">
                    {/* Circular Stamps & Seals */}
                    <div className="w-14 h-14 rounded-full border-2 border-double border-red-500 flex items-center justify-center text-center opacity-70 select-none transform rotate-6">
                      <span className="text-[7px] font-black text-red-550 font-mono tracking-tight leading-none text-center">BAWARIQ CHARTERED SEAL</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500">إدارة العلاقات اللوجستية والامتثال</p>
                </div>

                {/* Party B Driver Signature */}
                <div className="space-y-3 text-center border border-slate-100 p-4 rounded-xl bg-slate-50">
                  <h3 className="text-xs font-black text-slate-900">توقيع الطرف الثاني (الكابتن المندوب)</h3>
                  <div className="py-2 select-none">
                    <span className="font-serif italic text-lg text-emerald-700 font-extrabold border-b-2 border-slate-300 pb-1 px-4 block">
                      {viewingDocumentCourier.agreementSignature || viewingDocumentCourier.name}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500">بصمة إلكترونية مؤمنة وثابتة بالنظام</p>
                  <p className="text-[8px] text-slate-400 font-mono">HASH CODE: {viewingDocumentCourier.id.substring(0,10).toUpperCase()}-ACCEPT</p>
                </div>
              </div>

              {/* Footer print note */}
              <div className="text-center text-[9px] text-slate-400 pt-5 border-t border-slate-100">
                تمت طباعة وصياغة هذه الوثيقة من أرشيف الكباتن لشركة بوارق الشرق للخدمات اللوجستية. جميع الحقوق محفوظة لعام ٢٠٢٦ ©
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
