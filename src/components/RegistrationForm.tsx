import React, { useState, useEffect } from "react";
import { DELIVERY_APPS, SAUDI_CITIES, EXPERIENCE_LEVELS } from "../data";
import { User, Phone, MapPin, Briefcase, Check, ArrowLeft, Loader2, Landmark, Fingerprint, Users } from "lucide-react";

interface RegistrationFormProps {
  onSuccess: (courierId: string, info: { name: string; phone: string; city: string; apps: string[]; nationalId?: string; supervisorId?: string; supervisorName?: string; supervisorPhone?: string }) => void;
}

function convertArabicNumerals(str: string): string {
  const arabicRules = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  const persianRules = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  let result = str;
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(arabicRules[i], "g"), String(i));
    result = result.replace(new RegExp(persianRules[i], "g"), String(i));
  }
  return result;
}

export default function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [city, setCity] = useState(SAUDI_CITIES[0]);
  const [customCity, setCustomCity] = useState("");
  const [useCustomCity, setUseCustomCity] = useState(false);
  const [experience, setExperience] = useState(EXPERIENCE_LEVELS[0].label);
  const [customExperience, setCustomExperience] = useState("");
  const [deliveryApps, setDeliveryApps] = useState<any[]>(DELIVERY_APPS);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("direct");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/delivery-apps")
      .then((res) => res.json())
      .then((data) => { if (data.success && data.apps) setDeliveryApps(data.apps); })
      .catch((err) => console.warn("Failed loading delivery apps:", err));

    fetch("/api/supervisors")
      .then((res) => res.json())
      .then((data) => { if (data.success && data.supervisors) setSupervisors(data.supervisors); })
      .catch((err) => console.warn("Failed loading supervisors:", err));
  }, []);

  const handleAppToggle = (appId: string) => {
    const targetApp = deliveryApps.find((a) => a.id === appId);
    if (targetApp && !targetApp.isAvailable) {
      alert(`⚠️ تنبيه عاجل من إدارة بوارق الشرق:\n\nعذراً يا كابتن، تطبيق (${targetApp.name.split(" ")[0]}) غير متاح للتسجيل حالياً.\n\n${targetApp.warningMessage || "نعمل على إعادة تزويد الحسابات قريباً."}`);
      return;
    }
    setSelectedApps((prev) => prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]);
  };

  const handleSelectAllApps = () => {
    const available = deliveryApps.filter(a => a.isAvailable).map(a => a.id);
    if (selectedApps.length === available.length) setSelectedApps([]);
    else setSelectedApps(available);
  };

  const validateSaudiPhone = (p: string) => {
    const clean = convertArabicNumerals(p).replace(/\s+/g, "");
    return /^(05|5|\+9665)[0-9]{8}$/.test(clean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const normalizedPhone = convertArabicNumerals(phone).trim();
    const normalizedNationalId = convertArabicNumerals(nationalId).trim();

    if (!name.trim()) { setError("الرجاء إدخال الاسم الكامل."); return; }
    if (name.trim().split(" ").length < 2) { setError("الرجاء كتابة الاسم الثنائي أو الثلاثي."); return; }
    if (!validateSaudiPhone(normalizedPhone)) { setError("صيغة رقم الجوال غير صحيحة. يجب أن يبدأ بـ 05 ويتكون من 10 أرقام."); return; }
    if (!normalizedNationalId) { setError("الرجاء إدخال رقم الهوية الوطنية أو الإقامة."); return; }
    if (!/^[12][0-9]{9}$/.test(normalizedNationalId)) { setError("رقم الهوية غير صحيح. يتكون من 10 خانات ويبدأ بـ 1 أو 2."); return; }
    if (selectedApps.length === 0) { setError("الرجاء اختيار تطبيق واحد على الأقل."); return; }

    const finalCity = useCustomCity ? customCity.trim() : city;
    if (useCustomCity && !customCity.trim()) { setError("الرجاء كتابة اسم المدينة."); return; }

    setLoading(true);
    const finalExperience = `${experience}${customExperience ? ` - ${customExperience}` : ""}`;
    const chosenSup = supervisors.find(s => s.id === selectedSupervisorId) || { id: "direct", name: "تسجيل مباشر", phone: "0599612490" };

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: normalizedPhone,
          nationalId: normalizedNationalId,
          city: finalCity,
          experience: finalExperience,
          apps: selectedApps,
          supervisorId: chosenSup.id,
          supervisorName: chosenSup.name,
          supervisorPhone: chosenSup.phone || "0599612490",
        }),
      });

      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`خطأ من الخادم: ${text.substring(0, 150)}`);
      }

      if (!response.ok || !data.success) throw new Error(data.error || "حدث خطأ غير متوقع.");

      onSuccess(data.courierId, {
        name: name.trim(),
        phone: normalizedPhone,
        city: finalCity,
        apps: selectedApps,
        nationalId: normalizedNationalId,
        supervisorId: chosenSup.id,
        supervisorName: chosenSup.name,
        supervisorPhone: chosenSup.phone || "0599612490",
      });
    } catch (err: any) {
      setError(err.message || "حدث خطأ في الاتصال بالخادم.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8" id="courier-register-form">
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-xs flex items-start gap-2.5">
          <span className="font-extrabold mt-0.5">⚠️ تنبيه:</span>
          <span>{error}</span>
        </div>
      )}

      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-6">
        <h3 className="text-lg font-bold text-white border-b border-slate-800/80 pb-3 flex items-center gap-2">
          <Landmark className="w-5 h-5 text-amber-400" />
          <span>الخطوة 1 من 3: تعبئة البيانات الأساسية</span>
        </h3>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">الاسم الكامل <span className="text-amber-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500"><User className="w-4 h-4" /></div>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="أدخل اسمك الكريم"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">رقم الجوال <span className="text-amber-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500"><Phone className="w-4 h-4" /></div>
              <input type="tel" required value={phone} onChange={(e) => setPhone(convertArabicNumerals(e.target.value))} placeholder="05xxxxxxxx" dir="ltr"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all font-mono" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">رقم الهوية / الإقامة <span className="text-amber-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500"><Fingerprint className="w-4 h-4" /></div>
              <input type="text" required maxLength={10} value={nationalId} onChange={(e) => setNationalId(convertArabicNumerals(e.target.value).replace(/\D/g, ""))} placeholder="1xxxxxxxxx"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all font-mono" />
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-300">المدينة <span className="text-amber-500">*</span></label>
              <button type="button" onClick={() => setUseCustomCity(!useCustomCity)} className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold">
                {useCustomCity ? "اختر من القائمة" : "اكتب يدوياً"}
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500"><MapPin className="w-4 h-4" /></div>
              {useCustomCity ? (
                <input type="text" required value={customCity} onChange={(e) => setCustomCity(e.target.value)} placeholder="اكتب مدينتك"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all" />
              ) : (
                <select value={city} onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-11 pl-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer">
                  {SAUDI_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">مستوى الخبرة <span className="text-amber-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500"><Briefcase className="w-4 h-4" /></div>
              <select value={experience} onChange={(e) => setExperience(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-11 pl-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer">
                {EXPERIENCE_LEVELS.map((el) => <option key={el.id} value={el.label}>{el.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block">تفاصيل إضافية عن خبرتك (اختياري)</label>
          <textarea value={customExperience} onChange={(e) => setCustomExperience(e.target.value)}
            placeholder="مثال: عملت مع هنقرستيشن لمدة سنة بسيارة خاصة..." rows={2}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all" />
        </div>

        <div className="space-y-2 border-t border-slate-800/60 pt-5">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-500" />
            <span>اختر المشرف المتابع <span className="text-slate-500 font-normal">(اختياري)</span></span>
          </label>
          <select value={selectedSupervisorId} onChange={(e) => setSelectedSupervisorId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer">
            <option value="direct">تسجيل مباشر (بدون مشرف)</option>
            {supervisors.filter(s => s.id !== "direct").map((s) => (
              <option key={s.id} value={s.id}>{s.name} {s.phone ? `(${s.phone})` : ""}</option>
            ))}
          </select>
        </div>
      </div>

      {/* التطبيقات */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
          <div>
            <h4 className="text-md font-bold text-white flex items-center gap-2">
              <span className="bg-amber-500 text-slate-950 text-xs w-5 h-5 rounded-full flex items-center justify-center font-extrabold">2</span>
              <span>اختر التطبيقات المراد العمل عليها</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">يمكنك اختيار أكثر من تطبيق لزيادة دخلك</p>
          </div>
          <button type="button" onClick={handleSelectAllApps}
            className="text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg font-bold">
            {selectedApps.length === deliveryApps.filter(a => a.isAvailable).length ? "إلغاء اختيار الكل" : "اختر كافة التطبيقات المتاحة"}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deliveryApps.map((app) => {
            const isSelected = selectedApps.includes(app.id);
            const isAvailable = app.isAvailable;
            return (
              <div key={app.id} onClick={() => handleAppToggle(app.id)}
                className={`rounded-2xl p-4 border transition-all duration-300 relative flex flex-col justify-between select-none ${
                  !isAvailable ? "bg-slate-950/40 border-slate-900 opacity-60 cursor-not-allowed"
                  : isSelected ? "bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border-amber-500 ring-2 ring-amber-500/20 cursor-pointer"
                  : "bg-slate-950/70 border-slate-800/80 hover:border-slate-700/80 cursor-pointer"
                }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl bg-slate-950 p-1.5 rounded-lg border border-slate-800">{app.logo}</span>
                    <div className="flex flex-col gap-0.5 text-right">
                      <span className="text-xs font-bold text-white">{app.name.split(" ")[0]}</span>
                      <span className="text-[10px] text-amber-500 font-bold">📍 {app.region}</span>
                    </div>
                  </div>
                  {!isAvailable ? (
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold animate-pulse">نفد ⚠️</span>
                  ) : (
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${isSelected ? "bg-amber-500 border-amber-400 text-slate-950" : "bg-slate-900 border-slate-800"}`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3.5]" />}
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">{app.description}</p>
                {!isAvailable && <div className="text-[9px] text-rose-400 border-t border-slate-800 pt-2 mt-2">* غير متاح حالياً</div>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-4">
        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-3.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-slate-950 font-bold py-4 px-6 rounded-xl hover:brightness-110 transition-all cursor-pointer shadow-lg shadow-amber-500/15 disabled:opacity-50">
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /><span>جاري تقديم طلبك...</span></>
          ) : (
            <><span>إرسال الطلب والانتقال للتسعيرات والاتفاقية</span><ArrowLeft className="w-5 h-5" /></>
          )}
        </button>
      </div>
    </form>
  );
}
