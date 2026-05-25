import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Features from "./components/Features";
import RegistrationForm from "./components/RegistrationForm";
import AppointmentScheduler from "./components/AppointmentScheduler";
import TicketSummary from "./components/TicketSummary";
import AdminDashboard from "./components/AdminDashboard";
import SupportPortal from "./components/SupportPortal";
import SupervisorDashboard from "./components/SupervisorDashboard";
import { Sparkles, CheckCircle2, FileText, ArrowLeft, Trophy, LifeBuoy, MapPin, Search, Loader2, AlertCircle, X, KeyRound, Lock } from "lucide-react";

function SupervisorLogin({ onLogin }: { onLogin: (supervisor: any, password: string) => void }) {
  const [supervisorId, setSupervisorId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [supervisors, setSupervisors] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/supervisors")
      .then(r => r.json())
      .then(d => { if (d.success) setSupervisors(d.supervisors || []); })
      .catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/supervisor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supervisorId, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "كلمة المرور غير صحيحة");
      onLogin(data.supervisor, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <KeyRound className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-xl font-extrabold text-white">لوحة المشرفين</h3>
          <p className="text-xs text-slate-400">أدخل بيانات دخولك للوصول للوحتك الخاصة</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">اختر اسمك</label>
            <select required value={supervisorId} onChange={e => setSupervisorId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer">
              <option value="">— اختر المشرف —</option>
              {supervisors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">كلمة المرور</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="أدخل كلمة المرور"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 tracking-widest font-mono text-center" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold py-3 rounded-xl hover:brightness-110 cursor-pointer disabled:opacity-50">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>جاري التحقق...</span></> : <><Lock className="w-4 h-4" /><span>دخول</span></>}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isSupportMode, setIsSupportMode] = useState(false);
  const [isSupervisorMode, setIsSupervisorMode] = useState(false);
  const [supervisorData, setSupervisorData] = useState<any>(null);
  const [supervisorPassword, setSupervisorPassword] = useState("");
  const [step, setStep] = useState(0);
  const [courierId, setCourierId] = useState("");
  const [registrationInfo, setRegistrationInfo] = useState<{
    name: string; phone: string; city: string; apps: string[]; nationalId?: string;
  }>({ name: "", phone: "", city: "", apps: [], nationalId: "" });
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [courierName, setCourierName] = useState("");
  const [footerClicks, setFooterClicks] = useState(0);
  const [showLookup, setShowLookup] = useState(false);
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [lookupSuccessMsg, setLookupSuccessMsg] = useState("");

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(""); setLookupSuccessMsg(""); setLookupLoading(true);
    try {
      const response = await fetch("/api/couriers/lookup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: lookupQuery }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "عذراً، لم نجد أي طلب تقديم متطابق.");
      const { courier } = data;
      setCourierId(courier.id); setCourierName(courier.name);
      const info = { name: courier.name, phone: courier.phone, city: courier.city, apps: courier.apps || [], nationalId: courier.nationalId || "" };
      setRegistrationInfo(info);
      localStorage.setItem("bawariq_courier_id", courier.id);
      localStorage.setItem("bawariq_courier_name", courier.name);
      localStorage.setItem("bawariq_courier_phone", courier.phone);
      localStorage.setItem("bawariq_courier_reg_info", JSON.stringify(info));
      if (courier.interviewDate && courier.interviewTime) {
        setScheduledDate(courier.interviewDate); setScheduledTime(courier.interviewTime); setStep(3);
        localStorage.setItem("bawariq_courier_step", "3");
        localStorage.setItem("bawariq_courier_scheduled_date", courier.interviewDate);
        localStorage.setItem("bawariq_courier_scheduled_time", courier.interviewTime);
      } else {
        setStep(2); localStorage.setItem("bawariq_courier_step", "2");
      }
      setLookupSuccessMsg(`أهلاً بك مجدداً يا كابتن ${courier.name}!`);
      setTimeout(() => { setShowLookup(false); setLookupQuery(""); setLookupSuccessMsg(""); }, 3000);
    } catch (err: any) {
      setLookupError(err.message || "حدث خطأ أثناء فحص البيانات.");
    } finally { setLookupLoading(false); }
  };

  useEffect(() => {
    const s = localStorage.getItem("bawariq_courier_step");
    const id = localStorage.getItem("bawariq_courier_id");
    const info = localStorage.getItem("bawariq_courier_reg_info");
    const date = localStorage.getItem("bawariq_courier_scheduled_date");
    const time = localStorage.getItem("bawariq_courier_scheduled_time");
    const name = localStorage.getItem("bawariq_courier_name");
    if (s) setStep(Number(s));
    if (id) setCourierId(id);
    if (info) { try { setRegistrationInfo(JSON.parse(info)); } catch (e) {} }
    if (date) setScheduledDate(date);
    if (time) setScheduledTime(time);
    if (name) setCourierName(name);
  }, []);

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash === "#admin" || hash === "#bawariq") {
        setIsAdminMode(true); setIsSupportMode(false); setIsSupervisorMode(false);
      } else if (hash === "#support") {
        setIsSupportMode(true); setIsAdminMode(false); setIsSupervisorMode(false);
      } else if (hash === "#supervisor") {
        setIsSupervisorMode(true); setIsAdminMode(false); setIsSupportMode(false);
      } else {
        setIsAdminMode(false); setIsSupportMode(false); setIsSupervisorMode(false);
      }
    };
    // تشغيل فوري + بعد 200ms عشان يضمن التحميل
    checkHash();
    const t = setTimeout(checkHash, 200);
    window.addEventListener("hashchange", checkHash);
    return () => { clearTimeout(t); window.removeEventListener("hashchange", checkHash); };
  }, []);

  const handleAdminToggle = () => {
    if (isAdminMode) { window.location.hash = ""; setIsAdminMode(false); }
    else { window.location.hash = "#admin"; setIsAdminMode(true); }
  };

  const handleFooterClick = () => {
    const n = footerClicks + 1; setFooterClicks(n);
    if (n >= 5) { window.location.hash = "#admin"; setIsAdminMode(true); setFooterClicks(0); alert("تم تفعيل ممر العبور الآمن 🔒"); }
  };

  const handleRegisterSuccess = (id: string, info: typeof registrationInfo) => {
    setCourierId(id); setCourierName(info.name); setRegistrationInfo(info); setStep(2);
    localStorage.setItem("bawariq_courier_step", "2");
    localStorage.setItem("bawariq_courier_id", id);
    localStorage.setItem("bawariq_courier_reg_info", JSON.stringify(info));
    localStorage.setItem("bawariq_courier_name", info.name);
    localStorage.setItem("bawariq_courier_phone", info.phone);
  };

  const handleScheduleSuccess = (date: string, time: string) => {
    setScheduledDate(date); setScheduledTime(time); setStep(3);
    localStorage.setItem("bawariq_courier_step", "3");
    localStorage.setItem("bawariq_courier_scheduled_date", date);
    localStorage.setItem("bawariq_courier_scheduled_time", time);
  };

  const handleReset = () => {
    setCourierId(""); setCourierName("");
    setRegistrationInfo({ name: "", phone: "", city: "", apps: [] });
    setScheduledDate(""); setScheduledTime(""); setStep(0);
    ["bawariq_courier_step","bawariq_courier_id","bawariq_courier_reg_info",
     "bawariq_courier_scheduled_date","bawariq_courier_scheduled_time",
     "bawariq_courier_name","bawariq_courier_phone"].forEach(k => localStorage.removeItem(k));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 font-sans tracking-tight text-slate-100 selection:bg-amber-500 selection:text-slate-950 overflow-x-hidden">
      <Navbar onAdminClick={handleAdminToggle} isAdminMode={isAdminMode} />
      <main className="flex-grow max-w-6xl mx-auto w-full px-4 py-8 md:py-12 space-y-12">
        {isAdminMode ? (
          <AdminDashboard />
        ) : isSupportMode ? (
          <SupportPortal />
        ) : isSupervisorMode ? (
          supervisorData ? (
            <SupervisorDashboard
              supervisor={supervisorData}
              password={supervisorPassword}
              onLogout={() => { setSupervisorData(null); setSupervisorPassword(""); setIsSupervisorMode(false); window.location.hash = ""; }}
            />
          ) : (
            <SupervisorLogin onLogin={(sup, pw) => { setSupervisorData(sup); setSupervisorPassword(pw); }} />
          )
        ) : (
          <div className="space-y-10">
            {step > 0 && (
              <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 font-extrabold text-xs">{step}</div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">مراحل توثيق الحساب</span>
                    <h3 className="text-sm font-bold text-white">
                      {step === 1 && "تقديم البيانات الشخصية واختيار التطبيق"}
                      {step === 2 && "جدولة موعد المقابلة والتحقق"}
                      {step === 3 && "الحصول على تصريح الدخول والبدء"}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-3 text-xs font-semibold">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] ${step >= 1 ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-900 text-slate-600"}`}>الاسم والتطبيق</span>
                  <span className="text-slate-700">←</span>
                  <span className={`px-2.5 py-1 rounded-md text-[10px] ${step >= 2 ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-900 text-slate-600"}`}>حجز الموعد</span>
                  <span className="text-slate-700">←</span>
                  <span className={`px-2.5 py-1 rounded-md text-[10px] ${step >= 3 ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-900 text-slate-600"}`}>رقم التصريح</span>
                </div>
              </div>
            )}

            {step === 0 && (
              <div className="space-y-16 animate-fade-in">
                <div className="text-center relative py-6 space-y-6">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
                  <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-full text-xs font-bold text-slate-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>التسجيل متاح لكافة المواطنين والمقيمين بالمملكة العربية السعودية</span>
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">
                    بوابتك الكبرى للعمل كـ <span className="text-amber-400">مندوب توصيل محترف</span>
                  </h1>
                  <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    يسر شركة <strong className="text-slate-200">بوارق الشرق للخدمات اللوجستية</strong> أن تفتح باب التوظيف المباشر ومنح تصاريح العمل للمناديب في كافة مدن ومحافظات المملكة.
                  </p>
                  <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button onClick={() => setStep(1)}
                      className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-extrabold text-base rounded-xl cursor-pointer hover:brightness-110 transition-all flex items-center justify-center gap-3.5 shadow-lg shadow-amber-500/15">
                      <span>ابدأ التسجيل الفوري وتأكيد حسابك الآن</span>
                      <ArrowLeft className="w-5 h-5 stroke-[2.5] bg-slate-950 text-amber-400 rounded-full p-1" />
                    </button>
                    <a href="#support" className="w-full sm:w-auto px-6 py-4 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                      <LifeBuoy className="w-4 h-4 text-amber-500 animate-pulse" />
                      <span>الدعم الفني المباشر 🎧</span>
                    </a>
                  </div>
                  <div className="pt-2">
                    <button onClick={() => { setShowLookup(!showLookup); setLookupError(""); setLookupSuccessMsg(""); }}
                      className="text-xs text-amber-500 font-extrabold flex items-center gap-1.5 mx-auto cursor-pointer border border-amber-500/20 px-5 py-2.5 rounded-full bg-slate-900/50 hover:bg-slate-900 transition-all shadow-md">
                      <Search className="w-3.5 h-3.5" />
                      <span>هل قمت بالتسجيل مسبقاً؟ استعلم عن حالة طلبك 🔍</span>
                    </button>
                  </div>
                  {showLookup && (
                    <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl space-y-4 text-right">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <button type="button" onClick={() => setShowLookup(false)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                        <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                          <Search className="w-4 h-4 text-amber-400" />
                          <span>الاستعلام عن طلب واسترجاع الجلسة</span>
                        </h4>
                      </div>
                      <form onSubmit={handleLookup} className="space-y-4">
                        {lookupError && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] p-3 rounded-xl flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0" /><span>{lookupError}</span></div>}
                        {lookupSuccessMsg && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] p-3 rounded-xl flex items-center gap-2"><CheckCircle2 className="w-4 h-4 flex-shrink-0" /><span>{lookupSuccessMsg}</span></div>}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-300 block">رقم الجوال أو رقم الهوية</label>
                          <input type="text" required value={lookupQuery} onChange={e => setLookupQuery(e.target.value)}
                            placeholder="مثال: 0512345678 أو 1024354228"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-center text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono" />
                        </div>
                        <button type="submit" disabled={lookupLoading}
                          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-extrabold text-xs py-2.5 px-4 rounded-xl hover:brightness-110 cursor-pointer disabled:opacity-50">
                          {lookupLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>جاري البحث...</span></> : <><Search className="w-3.5 h-3.5" /><span>استرجاع حالة الطلب</span></>}
                        </button>
                      </form>
                    </div>
                  )}
                  <div className="pt-2 flex flex-wrap justify-center items-center gap-x-6 gap-y-2.5 text-slate-500 text-xs text-center">
                    <span className="flex items-center gap-1"><Trophy className="w-4 h-4 text-amber-500/65" /><span>تسويات فورية</span></span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500/65" /><span>بلا عمولات خفية</span></span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><FileText className="w-4 h-4 text-cyan-500/65" /><span>تدريب مجاني شامل</span></span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-amber-500" />
                      <a href="https://maps.google.com/?q=Dammam+Abu+Bakr+Al+Siddiq+Road+Business+Tower" target="_blank" rel="noopener noreferrer"
                        className="text-slate-400 hover:text-amber-400 font-bold underline transition-all">مقرنا الرئيسي بالدمام 📍</a>
                    </span>
                  </div>
                </div>
                <div id="partners-grid" className="scroll-mt-24"><Features /></div>
              </div>
            )}

            {step === 1 && (
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <button onClick={() => setStep(0)} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer">
                    <span>الرجوع للرئيسية</span><span className="rotate-180 inline-block font-bold">←</span>
                  </button>
                  <span className="text-xs text-slate-500 font-bold">يرجى ملء الحقول المطلوبة لتوثيق الملف</span>
                </div>
                <RegistrationForm onSuccess={handleRegisterSuccess} />
              </div>
            )}

            {step === 2 && (
              <div className="max-w-3xl mx-auto">
                <AppointmentScheduler courierId={courierId} courierName={courierName} onSuccess={handleScheduleSuccess} />
              </div>
            )}

            {step === 3 && (
              <TicketSummary courierId={courierId} info={registrationInfo} scheduledDate={scheduledDate} scheduledTime={scheduledTime} onReset={handleReset} />
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-8 mt-12 text-xs text-slate-500 text-center">
        <div className="max-w-6xl mx-auto px-4 space-y-3">
          <p onClick={handleFooterClick} className="cursor-pointer select-none hover:text-slate-400 transition-colors py-1 inline-block">
            © {new Date().getFullYear()} بوارق الشرق للخدمات اللوجستية. كافة الحقوق محفوظة.
          </p>
          <p className="text-[10px] text-slate-600 leading-normal max-w-xl mx-auto">
            منصة بوارق الشرق للتسجيل مسجلة تحت مظلة الهيئة العامة للنقل بالتنسيق مع أشهر التطبيقات.
          </p>
          <p className="text-[10px] text-slate-700">
            <a href="#supervisor" className="hover:text-amber-500 transition-colors cursor-pointer">بوابة المشرفين</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
