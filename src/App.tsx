import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Features from "./components/Features";
import RegistrationForm from "./components/RegistrationForm";
import AppointmentScheduler from "./components/AppointmentScheduler";
import TicketSummary from "./components/TicketSummary";
import AdminDashboard from "./components/AdminDashboard";
import SupportPortal from "./components/SupportPortal";
import PricingAndAgreement from "./components/PricingAndAgreement";
import { Sparkles, CheckCircle2, FileText, ArrowLeft, Trophy, LifeBuoy, MapPin, Search, Loader2, AlertCircle, X } from "lucide-react";

export default function App() {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isSupportMode, setIsSupportMode] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [mobileOS, setMobileOS] = useState<"ios" | "android" | "other">("other");
  
  // Steps: 
  // 0 -> Hero / Partnerships Showcase (Welcome Screen)
  // 1 -> Main Application Form (Name, Phone, City, App select, Experience detail)
  // 2 -> Scheduler (Office hours info, preferred date calendar list, time slots)
  // 3 -> Success receipt with QR code (Print / Reset)
  const [step, setStep] = useState(0);

  // Registered Courier Context Data
  const [courierId, setCourierId] = useState("");
  const [registrationInfo, setRegistrationInfo] = useState<{
    name: string;
    phone: string;
    city: string;
    apps: string[];
    nationalId?: string;
    supervisorId?: string;
    supervisorName?: string;
    supervisorPhone?: string;
  }>({
    name: "",
    phone: "",
    city: "",
    apps: [],
    nationalId: "",
    supervisorId: "",
    supervisorName: "",
    supervisorPhone: "",
  });
  
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [courierName, setCourierName] = useState("");
  const [footerClicks, setFooterClicks] = useState(0);

  // Lookup states for active courier session recovery/check status
  const [showLookup, setShowLookup] = useState(false);
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [lookupSuccessMsg, setLookupSuccessMsg] = useState("");

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError("");
    setLookupSuccessMsg("");
    setLookupLoading(true);

    try {
      const response = await fetch("/api/couriers/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: lookupQuery }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "عذراً، لم نجد أي طلب تقديم متطابق.");
      }

      const { courier } = data;
      
      // Restoring courier context values in memory
      setCourierId(courier.id);
      setCourierName(courier.name);
      
      const info = {
        name: courier.name,
        phone: courier.phone,
        city: courier.city,
        apps: courier.apps || [],
        nationalId: courier.nationalId || ""
      };
      setRegistrationInfo(info);

      // Save to localStorage for reloading sessions persistently
      localStorage.setItem("bawariq_courier_id", courier.id);
      localStorage.setItem("bawariq_courier_name", courier.name);
      localStorage.setItem("bawariq_courier_phone", courier.phone);
      localStorage.setItem("bawariq_courier_reg_info", JSON.stringify(info));

      if (courier.interviewDate && courier.interviewTime) {
        setScheduledDate(courier.interviewDate);
        setScheduledTime(courier.interviewTime);
        setStep(3); // summary
        localStorage.setItem("bawariq_courier_step", "3");
        localStorage.setItem("bawariq_courier_scheduled_date", courier.interviewDate);
        localStorage.setItem("bawariq_courier_scheduled_time", courier.interviewTime);
      } else if (courier.agreementAccepted) {
        setStep(2.5); // scheduler
        localStorage.setItem("bawariq_courier_step", "2.5");
      } else {
        setStep(2); // pricing & agreement
        localStorage.setItem("bawariq_courier_step", "2");
      }

      setLookupSuccessMsg(`أهلاً بك مجدداً يا كابتن ${courier.name}! تم تمكين ومزامنة جلستك بنجاح.`);
      setTimeout(() => {
        setShowLookup(false);
        setLookupQuery("");
        setLookupSuccessMsg("");
      }, 3000);

    } catch (err: any) {
      setLookupError(err.message || "حدث خطأ أثناء فحص البيانات سحابياً.");
    } finally {
      setLookupLoading(false);
    }
  };

  // Synchronize and restore courier authentication state from localStorage (persistent sessions requested by user)
  useEffect(() => {
    // Detect mobile OS for home screen app integration guide
    const ua = navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);
    const dismissed = localStorage.getItem("bawariq_install_prompt_dismissed_v1");
    if ((isIos || isAndroid) && !dismissed) {
      setMobileOS(isIos ? "ios" : "android");
      setShowInstallPrompt(true);
    }

    const savedStep = localStorage.getItem("bawariq_courier_step");
    const savedId = localStorage.getItem("bawariq_courier_id");
    const savedRegInfo = localStorage.getItem("bawariq_courier_reg_info");
    const savedDate = localStorage.getItem("bawariq_courier_scheduled_date");
    const savedTime = localStorage.getItem("bawariq_courier_scheduled_time");
    const savedName = localStorage.getItem("bawariq_courier_name");

  if (savedStep) {
  setStep(Number(savedStep));
}
    if (savedId) {
      setCourierId(savedId);
    }
    if (savedRegInfo) {
      try {
        setRegistrationInfo(JSON.parse(savedRegInfo));
      } catch (e) {
        console.error("Failed to parse saved registration info", e);
      }
    }
    if (savedDate) {
      setScheduledDate(savedDate);
    }
    if (savedTime) {
      setScheduledTime(savedTime);
    }
    if (savedName) {
      setCourierName(savedName);
    }
  }, []);

  // Listening to URL hash changes to toggling administrative portal silently
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#admin" || window.location.hash === "#bawariq") {
        setIsAdminMode(true);
        setIsSupportMode(false);
      } else if (window.location.hash === "#support") {
        setIsSupportMode(true);
        setIsAdminMode(false);
      } else {
        setIsAdminMode(false);
        setIsSupportMode(false);
      }
    };

    // Run initially on mount
    handleHashChange();

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleAdminToggle = () => {
    if (isAdminMode) {
      window.location.hash = "";
      setIsAdminMode(false);
    } else {
      window.location.hash = "#admin";
      setIsAdminMode(true);
    }
  };

  const handleFooterClick = () => {
    const nextCount = footerClicks + 1;
    setFooterClicks(nextCount);
    
    if (nextCount >= 5) {
      window.location.hash = "#admin";
      setIsAdminMode(true);
      setFooterClicks(0);
      alert("تم تفعيل ممر العبور الآمن الخاص بإدارة بوارق الشرق للخدمات اللوجستية 🔒\nيرجى إدخال الرقم السري لرؤية التقارير وكشوفات المناديب.");
    }
  };

  const handleRegisterSuccess = (id: string, info: typeof registrationInfo) => {
    setCourierId(id);
    setCourierName(info.name);
    setRegistrationInfo(info);
    setStep(2); // Move instantly to Pricing & Agreement ( العقد والتسعيرات والتوقيع )

    localStorage.setItem("bawariq_courier_step", "2");
    localStorage.setItem("bawariq_courier_id", id);
    localStorage.setItem("bawariq_courier_reg_info", JSON.stringify(info));
    localStorage.setItem("bawariq_courier_name", info.name);
    localStorage.setItem("bawariq_courier_phone", info.phone); // auto-fill support form!
  };

  const handleAgreementSuccess = () => {
    setStep(2.5); // Move next to Appointment Scheduler ( حجز الموعد )
    localStorage.setItem("bawariq_courier_step", "2.5");
  };

  const handleScheduleSuccess = (date: string, time: string) => {
    setScheduledDate(date);
    setScheduledTime(time);
    setStep(3); // Move finally to ticket summary page ( رقم التصريح بالبدء والـ QR )

    localStorage.setItem("bawariq_courier_step", "3");
    localStorage.setItem("bawariq_courier_scheduled_date", date);
    localStorage.setItem("bawariq_courier_scheduled_time", time);
  };

  const handleReset = () => {
    setCourierId("");
    setCourierName("");
    setRegistrationInfo({
      name: "",
      phone: "",
      city: "",
      apps: [],
    });
    setScheduledDate("");
    setScheduledTime("");
    setStep(0); // Back to greetings

    localStorage.removeItem("bawariq_courier_step");
    localStorage.removeItem("bawariq_courier_id");
    localStorage.removeItem("bawariq_courier_reg_info");
    localStorage.removeItem("bawariq_courier_scheduled_date");
    localStorage.removeItem("bawariq_courier_scheduled_time");
    localStorage.removeItem("bawariq_courier_name");
    localStorage.removeItem("bawariq_courier_phone");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 font-sans tracking-tight text-slate-100 selection:bg-amber-500 selection:text-slate-950 overflow-x-hidden">
      {/* Dynamic Header Navbar combo with concealed admin toggle */}
      <Navbar 
        onAdminClick={handleAdminToggle} 
        isAdminMode={isAdminMode} 
      />

      {/* Main Container context */}
      <main className="flex-grow max-w-6xl mx-auto w-full px-4 py-8 md:py-12 space-y-12">
        {/* Mobile App Install Guides */}
        {showInstallPrompt && (
          <div className="relative bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20 border border-amber-500/20 rounded-2xl p-5 shadow-xl flex gap-4 pr-12 text-right">
            <button 
              onClick={() => {
                localStorage.setItem("bawariq_install_prompt_dismissed_v1", "true");
                setShowInstallPrompt(false);
              }}
              className="absolute left-3.5 top-3.5 text-slate-400 hover:text-white transition-all bg-slate-800/40 hover:bg-slate-850 p-1.5 rounded-full"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/10">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 flex-grow">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>تثبيت تطبيق بوارق الشرق على جوالك</span>
                <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-450 px-2 py-0.5 rounded-full font-black">جوال متكامل</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed md:max-w-3xl">
                {mobileOS === "ios" ? (
                  <>
                    للاستمتاع بتجربة تطبيق متكاملة وفورية على آيفون، اضغط على أيقونة المشاركة <span className="font-extrabold text-amber-400">"⎋" (Share)</span> أسفل متصفح سفاري، ثم اختر <span className="font-extrabold text-amber-400">"إضافة إلى الصفحة الرئيسية" ⊕ (Add to Home Screen)</span>. سيعمل بوارق الشرق كتطبيق متكامل في جهازك!
                  </>
                ) : (
                  <>
                    للحصول على وصول سلس وسريع على جوالك الأندرويد، اضغط على خيارات المتصفح <span className="font-bold text-amber-405">"⋮"</span> أعلى يسار متصفح كروم، ثم اختر <span className="font-extrabold text-amber-400">"تثبيت التطبيق" (Install App)</span> أو "الإضافة للشاشة الرئيسية".
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        {isAdminMode ? (
          // Admin Panel (Accessible only via footer clicks or #admin hash)
          <AdminDashboard />
        ) : isSupportMode ? (
          // Support Portal (Direct linked or accessed via navigation)
          <SupportPortal />
        ) : (
          // Candidate application Funnel
          <div className="space-y-10">
            {/* Steps tracker progress breadcrumb (renders if step > 0) */}
            {step > 0 && (
              <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 w-full md:w-auto">
                  <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 font-extrabold text-xs flex-shrink-0">
                    {Math.floor(step)}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">مراحل توثيق الحساب</span>
                    <h3 className="text-sm font-bold text-white">
                      {step === 1 && "تقديم البيانات الشخصية واختيار التطبيق"}
                      {step === 2 && "شروط وضوابط العمل والعقد التشغيلي للتوقيع"}
                      {step === 2.5 && "جدولة موعد المقابلة واختيار الوقت"}
                      {step === 3 && "الحصول على تصريح الدخول وبدء العمل"}
                    </h3>
                  </div>
                </div>

                {/* Status Bar */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 text-xs font-semibold w-full md:w-auto justify-end">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] ${step >= 1 ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-900 text-slate-600"}`}>الاسم والتطبيق</span>
                  <span className="text-slate-700">←</span>
                  <span className={`px-2.5 py-1 rounded-md text-[10px] ${step >= 2 ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-900 text-slate-600"}`}>العقد والتسعيرة</span>
                  <span className="text-slate-700">←</span>
                  <span className={`px-2.5 py-1 rounded-md text-[10px] ${step >= 2.5 ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-900 text-slate-600"}`}>حجز الموعد</span>
                  <span className="text-slate-700">←</span>
                  <span className={`px-2.5 py-1 rounded-md text-[10px] ${step >= 3 ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-900 text-slate-600"}`}>رقم التصريح والبدء</span>
                  
                  {/* Start over button */}
                  <button
                    onClick={handleReset}
                    className="mr-2 sm:mr-4 px-3.5 py-1.5 text-[10px] font-extrabold text-amber-500 hover:text-amber-450 border border-amber-500/20 hover:border-amber-500/40 bg-slate-950/80 rounded-md transition-all cursor-pointer flex items-center gap-1"
                    title="الرجوع للبداية ومسح الجلسة للبدء من جديد"
                  >
                    <span>البدء من الأول ↺</span>
                  </button>
                </div>
              </div>
            )}

            {/* Stepper routing logic */}
            {step === 0 && (
              <div className="space-y-16 animate-fade-in">
                {/* Hero section */}
                <div className="text-center relative py-6 space-y-6">
                  {/* Glowing background halo */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>

                  <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-full text-xs font-bold text-slate-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>التسجيل متاح لكافة المواطنين والمقيمين بالمملكة العربية السعودية</span>
                  </div>

                  <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">
                    بوابتك الكبرى للعمل كـ <span className="text-amber-400">مندوب توصيل محترف</span>
                  </h1>

                  <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    يسر شركة <strong className="text-slate-200">بوارق الشرق للخدمات اللوجستية</strong> أن تفتح باب التوظيف المباشر ومنح تصاريح العمل للمناديب في كافة مدن ومحافظات المملكة، بشراكة معتمدة وربط تقني شامل مع جميع تطبيقات توصيل المطاعم الكبرى.
                  </p>

                  <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                      onClick={() => setStep(1)}
                      className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-extrabold text-base rounded-xl cursor-pointer hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-3.5 shadow-lg shadow-amber-500/15"
                    >
                      <span>ابدأ التسجيل الفوري وتأكيد حسابك الآن</span>
                      <ArrowLeft className="w-5 h-5 stroke-[2.5] bg-slate-950 text-amber-400 rounded-full p-1" />
                    </button>
                    
                    <a
                      href="#support"
                      className="w-full sm:w-auto px-6 py-4 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-350 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <LifeBuoy className="w-4 h-4 text-amber-500 animate-pulse" />
                      <span>الدعم الفني المباشر 🎧</span>
                    </a>

                    <a
                      href="#partners-grid"
                      className="w-full sm:w-auto px-5 py-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-slate-750 text-slate-400 hover:text-white text-xs font-bold rounded-xl transition-all"
                    >
                      تصفح شركاء التوسع
                    </a>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setShowLookup(!showLookup);
                        setLookupError("");
                        setLookupSuccessMsg("");
                      }}
                      className="text-xs text-amber-500 font-extrabold flex items-center gap-1.5 mx-auto hover:text-amber-450 cursor-pointer border border-amber-500/20 px-5 py-2.5 rounded-full bg-slate-900/50 hover:bg-slate-900 transition-all font-sans shadow-md"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>هل قمت بالتسجيل مسبقاً؟ الاستعلام عن حالة الطلب أو استرجاع الجلسة 🔍</span>
                    </button>
                  </div>

                  {/* Inline lookup slide panel */}
                  {showLookup && (
                    <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl relative animate-fade-in space-y-4 text-right">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <button
                          type="button"
                          onClick={() => setShowLookup(false)}
                          className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-350 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                          <Search className="w-4 h-4 text-amber-400" />
                          <span>الاستعلام عن طلب واسترجاع الجلسة سحابياً</span>
                        </h4>
                      </div>

                      <form onSubmit={handleLookup} className="space-y-4">
                        {lookupError && (
                          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] p-3 rounded-xl flex items-center gap-2 text-right">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{lookupError}</span>
                          </div>
                        )}

                        {lookupSuccessMsg && (
                          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] p-3 rounded-xl flex items-center gap-2 text-right">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            <span>{lookupSuccessMsg}</span>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-300 block">رقم الجوال أو رقم الهوية الوطنية / الإقامة</label>
                          <input
                            type="text"
                            required
                            value={lookupQuery}
                            onChange={(e) => setLookupQuery(e.target.value)}
                            placeholder="مثال: 0512345678 أو 1024354228"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-center text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                          />
                          <p className="text-[9px] text-slate-500 text-center">أدخل رقم الهاتف أو الهوية الذي استخدمته عند تسجيل بياناتك أول مرة.</p>
                        </div>

                        <button
                          type="submit"
                          disabled={lookupLoading}
                          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-extrabold text-xs py-2.5 px-4 rounded-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {lookupLoading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>جاري البحث في قاعدة البيانات...</span>
                            </>
                          ) : (
                            <>
                              <Search className="w-3.5 h-3.5" />
                              <span>استرجاع حالة الطلب الفورية</span>
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  )}

                  <div className="pt-2 flex flex-wrap justify-center items-center gap-x-6 gap-y-2.5 text-slate-500 text-xs text-center">
                    <span className="flex items-center gap-1">
                      <Trophy className="w-4 h-4 text-amber-500/65" />
                      <span>تسويات فورية</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500/65" />
                      <span>بلا عمولات خفية</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4 text-cyan-500/65" />
                      <span>تدريب مجاني شامل</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-amber-500" />
                      <a 
                        href="https://maps.google.com/?q=Dammam+Abu+Bakr+Al+Siddiq+Road+Business+Tower" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-slate-400 hover:text-amber-400 font-bold underline decoration-slate-600 hover:decoration-amber-500 transition-all"
                      >
                        مقرنا الرئيسي بالدمام 📍
                      </a>
                    </span>
                  </div>
                </div>

                {/* 3D Immersive Delivery Simulator Showcase (To excite the candidate interactive) */}
                <div className="relative max-w-4xl mx-auto py-2 flex flex-col items-center justify-center">
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-pink-500/10 to-cyan-500/20 rounded-3xl blur-2xl opacity-75 animate-pulse"></div>
                  
                  {/* The 3D perspective stage wrapper */}
                  <div className="relative w-full bg-slate-900/50 border border-slate-800 rounded-3xl p-8 md:p-10 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl">
                    <div className="space-y-4 max-w-sm text-center md:text-right">
                      <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-500/10 to-amber-500/15 border border-amber-500/20 px-3 py-1 rounded-full text-[11px] font-bold text-amber-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        <span>بث تشغيلي فوري بالسيارة والأجهزة</span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-black text-white">ابدأ رحلة التوصيل بالسيارة فوراً!</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        نوفر لك دعماً وتفعيلاً شاملاً لمشاوير توصيل الطلبات بسيارتك الخاصة عبر أفضل المنصات العاملة في المملكة بنسبة تشغيلية ممتازة مع مرونة تامة لتأمين دخل إضافي ممتاز ومستقر.
                      </p>
                      
                      {/* Floating delivery indicators */}
                      <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-2">
                        <span className="text-[10px] bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-slate-350 font-bold">تسجيل فوري ⚡</span>
                        <span className="text-[10px] bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-slate-350 font-bold">بدون عمولات معقدة 💎</span>
                        <span className="text-[10px] bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-slate-350 font-bold">حوافز يومية 💰</span>
                      </div>
                    </div>

                    {/* Highly futuristic 3D delivery car isometric SVG simulation */}
                    <div className="relative flex-1 w-full max-w-[320px] md:max-w-[400px] h-[220px] flex items-center justify-center">
                      
                      {/* Perspective Platform Floor */}
                      <div className="absolute bottom-4 w-full h-12 bg-slate-800/30 rounded-full blur-md transform scale-x-110 skew-x-12 -rotate-12"></div>
                      <div className="absolute bottom-6 w-full h-[60px] bg-gradient-to-t from-slate-950 to-amber-500/10 rounded-full border border-amber-500/10 transform rotate-x-60 -rotate-12 flex items-center justify-center opacity-85">
                        <span className="text-[10px] font-mono text-amber-500/45 tracking-widest uppercase animate-pulse">BAWARIQ LAST-MILE LOGISTICS</span>
                      </div>

                      {/* Moving speed trails */}
                      <div className="absolute top-24 left-4 w-24 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse opacity-40"></div>
                      <div className="absolute top-16 right-4 w-32 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse opacity-40"></div>
                      <div className="absolute top-32 left-10 w-28 h-[1.5px] bg-gradient-to-r from-transparent via-pink-400 to-transparent animate-pulse opacity-30"></div>

                      {/* 3D Car Vector mockup container */}
                      <div className="relative transform hover:scale-105 transition-transform duration-500 ease-out z-10 flex flex-col items-center">
                        <svg viewBox="0 0 300 160" className="w-[280px] h-[150px] drop-shadow-[0_15px_30px_rgba(245,158,11,0.25)]">
                          {/* Wheels Glow */}
                          <ellipse cx="75" cy="120" rx="20" ry="6" fill="#f59e0b" opacity="0.15" />
                          <ellipse cx="225" cy="120" rx="20" ry="6" fill="#f59e0b" opacity="0.15" />
                          
                          {/* Car shadow body */}
                          <path d="M40,110 Q40,105 50,100 L250,100 Q260,105 260,110 L255,120 Q250,123 230,123 L70,123 Q50,123 45,120 Z" fill="#0f172a" opacity="0.8" />
                          
                          {/* Car Body 3D Base */}
                          <path d="M40,95 L45,65 Q50,55 65,55 L160,55 Q180,55 195,65 L245,85 Q255,89 255,95 L250,112 L50,112 Z" fill="url(#carGrad)" />
                          
                          {/* Cabin & Windshield */}
                          <path d="M68,58 L125,30 Q135,25 145,25 L210,25 Q220,25 225,32 L250,65 Z" fill="#020617" opacity="0.9" />
                          <path d="M135,30 L205,30 L233,65 L145,65 Z" fill="#06b6d4" opacity="0.35" /> {/* Cyan tint windshield */}
                          <path d="M78,58 L125,33 L135,65 L72,65 Z" fill="#020617" opacity="0.5" />
                          
                          {/* Headlights and glowing beams */}
                          <path d="M245,85 L255,85 L253,95 L243,95 Z" fill="#fef08a" />
                          <polygon points="255,85 295,78 295,115 253,95" fill="url(#glowGrad)" opacity="0.4" />
                          
                          {/* Taillight */}
                          <path d="M40,95 L48,95 L48,102 L40,102 Z" fill="#ef4444" />
                          
                          {/* Big 3D Delivery Box resting on Car Roof */}
                          <g transform="translate(130, -5)">
                            {/* Front-left side of 3D box */}
                            <polygon points="20,15 50,5 50,35 20,45" fill="#f59e0b" />
                            {/* Front-right side of 3D box */}
                            <polygon points="50,5 80,15 80,45 50,35" fill="#d97706" />
                            {/* Top side of 3D box */}
                            <polygon points="20,15 50,5 80,15 50,25" fill="#fbbf24" />
                            {/* Tape line across top of box */}
                            <polygon points="46,14 46,24 54,21 54,12" fill="#78350f" opacity="0.4" />
                            {/* Sparkles / Glowing badge next to the parcel */}
                            <circle cx="50" cy="20" r="14" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="4 4" className="animate-spin" />
                          </g>

                          {/* Wheels */}
                          <circle cx="80" cy="115" r="15" fill="#1e293b" stroke="#475569" strokeWidth="3" />
                          <circle cx="80" cy="115" r="7" fill="#64748b" />
                          <circle cx="220" cy="115" r="15" fill="#1e293b" stroke="#475569" strokeWidth="3" />
                          <circle cx="220" cy="115" r="7" fill="#64748b" />

                          {/* Decorative Speed Ribbons / Trails */}
                          <path d="M10,118 L45,118" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                          <path d="M20,123 L55,123" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />

                          {/* Define Gradients */}
                          <defs>
                            <linearGradient id="carGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#e11d48" /> {/* Hot red body */}
                              <stop offset="60%" stopColor="#be123c" />
                              <stop offset="100%" stopColor="#0f172a" />
                            </linearGradient>
                            <linearGradient id="glowGrad" x1="0%" y1="50%" x2="100%" y2="50%">
                              <stop offset="0%" stopColor="#fef08a" />
                              <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                        </svg>

                        {/* App Partners floating in 3D around the car with names and custom logos */}
                        {/* 1. Hungerstation */}
                        <div className="absolute top-1 right-[5px] bg-[#ffc72c] border-2 border-slate-950 text-slate-950 px-2 py-0.5 rounded-lg font-black text-[9px] shadow-lg flex items-center gap-1 hover:scale-110 transition-transform">
                          <span>🍔</span>
                          <span>هنقرستيشن</span>
                        </div>
                        {/* 2. Jahez */}
                        <div className="absolute top-2 left-[5px] bg-[#ec4899] border-2 border-slate-950 text-white px-2 py-0.5 rounded-lg font-black text-[9px] shadow-lg flex items-center gap-1 hover:scale-110 transition-transform">
                          <span>🛵</span>
                          <span>جاهز</span>
                        </div>
                        {/* 3. ToYou */}
                        <div className="absolute bottom-1 right-2 bg-gradient-to-r from-red-500 to-red-600 border-2 border-slate-950 text-white px-2 py-0.5 rounded-lg font-black text-[9px] shadow-lg flex items-center gap-1 hover:scale-110 transition-transform">
                          <span>🚗</span>
                          <span>تويو</span>
                        </div>
                        {/* 4. Keeta */}
                        <div className="absolute -bottom-3 left-6 bg-gradient-to-r from-orange-500 to-orange-600 border-2 border-slate-950 text-white px-2 py-0.5 rounded-lg font-black text-[9px] shadow-lg flex items-center gap-1 hover:scale-110 transition-transform">
                          <span>⚡</span>
                          <span>كيتا</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Partners grid */}
                <div id="partners-grid" className="scroll-mt-24">
                  <Features />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <button
                    onClick={() => setStep(0)}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <span>الرجوع للرئيسية</span>
                    <span className="rotate-180 inline-block font-bold">←</span>
                  </button>
                  <span className="text-xs text-slate-500 font-bold">يرجى ملء الحقول المطلوبة لتوثيق الملف</span>
                </div>
                
                <RegistrationForm onSuccess={handleRegisterSuccess} />
              </div>
            )}

            {step === 2 && (
              <div className="max-w-3xl mx-auto">
                <PricingAndAgreement 
                  courierId={courierId}
                  courierName={courierName}
                  onSuccess={handleAgreementSuccess}
                />
              </div>
            )}

            {step === 2.5 && (
              <div className="max-w-3xl mx-auto">
                <AppointmentScheduler 
                  courierId={courierId} 
                  courierName={courierName}
                  onSuccess={handleScheduleSuccess}
                  onReset={handleReset}
                />
              </div>
            )}

            {step === 3 && (
              <TicketSummary 
                courierId={courierId}
                info={registrationInfo}
                scheduledDate={scheduledDate}
                scheduledTime={scheduledTime}
                onReset={handleReset}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer Branding info with secret 5-click pattern to toggle Admin Portal discretely */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 mt-12 text-xs text-slate-500 text-center">
        <div className="max-w-6xl mx-auto px-4 space-y-3">
          <p 
            onClick={handleFooterClick}
            className="cursor-pointer select-none hover:text-slate-400 transition-colors py-1 inline-block"
            title="بوارق الشرق للخدمات اللوجستية"
          >
            © {new Date().getFullYear()} بوارق الشرق للخدمات اللوجستية (Bawariq Al-Sharq Logistics). كافة الحقوق محفوظة.
          </p>
          <p className="text-[10px] text-slate-600 leading-normal max-w-xl mx-auto">
            منصة بوارق الشرق للتسجيل مسجلة تحت مظلة الهيئة العامة للنقل والجهات المعنية لرفع الكفاءة وتوفير العمل للمواطنين والمقيمين بالتنسيق مع أشهر التطبيقات: جاهز، هنقرستيشن، تويو، ذا شفز، مرسول، وكيتا.
          </p>
        </div>
      </footer>
    </div>
  );
}
