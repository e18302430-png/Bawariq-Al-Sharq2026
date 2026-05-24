import React, { useState, useEffect } from "react";
import { DELIVERY_APPS, SAUDI_CITIES, EXPERIENCE_LEVELS } from "../data";
import { User, Phone, MapPin, Briefcase, Check, ArrowLeft, ArrowRight, Loader2, Landmark, Fingerprint, AlertTriangle } from "lucide-react";

interface RegistrationFormProps {
  onSuccess: (courierId: string, info: { name: string; phone: string; city: string; apps: string[]; nationalId?: string }) => void;
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
  
  // Dynamic delivery apps loaded from backend configurations with static fallback
  const [deliveryApps, setDeliveryApps] = useState<any[]>(DELIVERY_APPS);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/delivery-apps")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.apps) {
          setDeliveryApps(data.apps);
        }
      })
      .catch((err) => console.warn("Failed loading live delivery apps catalog:", err));
  }, []);

  const handleAppToggle = (appId: string) => {
    const targetApp = deliveryApps.find((a) => a.id === appId);
    if (targetApp && !targetApp.isAvailable) {
      // Alert/Notification regarding app being out-of-stock (نفاذ الحسابات المتاحة)
      alert(`⚠️ تنبيه عاجل من إدارة بوارق الشرق:\n\nعذراً يا كابتن، تطبيق (${targetApp.name.split(" ")[0]}) غير متاح للتسجيل حالياً بسبب نفاد الحسابات الجاهزة المتوفرة لدينا بالمحافظة.\n\nالرسالة الإدارية: ${targetApp.warningMessage || "نعمل على إعادة تزويد الحسابات وسنرسل لك إشعاراً فور توفرها. يرجى اختيار التطبيقات الأخرى المتاحة حالياً للانضمام الفوري وبدء العمل."}`);
      return;
    }
    setSelectedApps((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  const handleSelectAllApps = () => {
    const activeAndAvailable = deliveryApps.filter(a => a.isAvailable).map(a => a.id);
    if (selectedApps.length === activeAndAvailable.length) {
      setSelectedApps([]); // clear
    } else {
      setSelectedApps(activeAndAvailable); // select available only
    }
  };

  const validateSaudiPhone = (p: string) => {
    // Basic clean-up and Saudis validator
    // Matches 05xxxxxxxx or +9665xxxxxxxx
    const converted = convertArabicNumerals(p);
    const clean = converted.replace(/\s+/g, "");
    const regex = /^(05|5|\+9665)[0-9]{8}$/;
    return regex.test(clean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const normalizedPhone = convertArabicNumerals(phone).trim();
    const normalizedNationalId = convertArabicNumerals(nationalId).trim();

    // Validation
    if (!name.trim()) {
      setError("الرجاء إدخال الاسم الكامل ثنائياً أو ثلاثياً على الأقل.");
      return;
    }

    if (name.trim().split(" ").length < 2) {
      setError("الرجاء كتابة الاسم الثنائي أو الثلاثي لتسهيل التوثيق الحكومي.");
      return;
    }

    if (!validateSaudiPhone(normalizedPhone)) {
      setError("صيغة رقم الجوال غير صحيحة. يجب أن يبدأ بـ 05 ويتكون من 10 أرقام (مثال: 0512345678).");
      return;
    }

    const validateNationalId = (idInput: string) => {
      const clean = idInput.trim();
      return /^[12][0-9]{9}$/.test(clean);
    };

    if (!normalizedNationalId) {
      setError("الرجاء إدخال رقم الهوية الوطنية أو الإقامة.");
      return;
    }

    if (!validateNationalId(normalizedNationalId)) {
      setError("رقم الهوية الوطنية أو الإقامة غير صحيح. يجب أن يتكون من 10 خانات ويبدأ بـ 1 للسعوديين أو 2 للمقيمين.");
      return;
    }

    if (selectedApps.length === 0) {
      setError("الرجاء اختيار تطبيق واحد على الأقل ترغب بالعمل عليه لتسهيل معالجة طلبك.");
      return;
    }

    setLoading(true);

    const finalCity = useCustomCity ? customCity.trim() : city;
    if (useCustomCity && !customCity.trim()) {
      setError("الرجاء كتابة اسم المدينة المراد العمل بها.");
      setLoading(false);
      return;
    }

    const finalExperience = `${experience} ${customExperience ? ` - ملاحظات إضافية: ${customExperience}` : ""}`;

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: normalizedPhone,
          nationalId: normalizedNationalId,
          city: finalCity,
          experience: finalExperience,
          apps: selectedApps,
        }),
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch (jsonErr: any) {
          throw new Error("حدث خطأ في قراءة استجابة الخوادم. يرجى تكرار المحاولة.");
        }
      } else {
        const text = await response.text();
        throw new Error(`خطأ من الخادم (الحالة ${response.status}): ${text.substring(0, 150)}`);
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || "حدث خطأ غير متوقع أثناء تسجيل الطلب.");
      }

      // Fire success callback
      onSuccess(data.courierId, {
        name: name.trim(),
        phone: normalizedPhone,
        city: finalCity,
        apps: selectedApps,
        nationalId: normalizedNationalId,
      });
    } catch (err: any) {
      setError(err.message || "حدث خطأ في الاتصال بالخادم الرئيسي. الرجاء المحاولة مجدداً.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8" id="courier-register-form">
      {/* Alert Error If Any */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-xs md:text-sm flex items-start gap-2.5 animate-pulse">
          <span className="font-extrabold mt-0.5">⚠️ تنبيه:</span>
          <span>{error}</span>
        </div>
      )}

      {/* Main Form Fields Container */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-6">
        <h3 className="text-lg font-bold text-white border-b border-slate-800/80 pb-3 flex items-center gap-2">
          <Landmark className="w-5 h-5 text-amber-400" />
          <span>الخطوة 1 من 2: تعبئة البيانات الأساسية للمندوب</span>
        </h3>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Candidate Full Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">الاسم الكامل (ثنائى أو ثلاثي) <span className="text-amber-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4.5 h-4.5" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أدخل اسمك الكريم الموثق بالهوية الوطنية"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all font-medium"
              />
            </div>
          </div>

          {/* Candidate Phone Number */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">رقم الجوال النشط (المرتبط بأبشر والتوصيل) <span className="text-amber-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                <Phone className="w-4.5 h-4.5" />
              </div>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(convertArabicNumerals(e.target.value))}
                placeholder="05xxxxxxxx"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-11 py-3 text-sm text-left text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all font-mono tracking-wider"
                dir="ltr"
              />
            </div>
          </div>

          {/* Candidate National ID / Iqama */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">رقم الهوية الوطنية أو الإقامة <span className="text-amber-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                <Fingerprint className="w-4.5 h-4.5" />
              </div>
              <input
                type="text"
                required
                maxLength={10}
                value={nationalId}
                onChange={(e) => setNationalId(convertArabicNumerals(e.target.value).replace(/\D/g, ""))}
                placeholder="أدخل 10 خانات (مثال: 1xxxxxxxxx)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all font-mono tracking-wider"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* City / Location of Work */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-300">المدينة المراد العمل بها <span className="text-amber-500">*</span></label>
              <button
                type="button"
                onClick={() => setUseCustomCity(!useCustomCity)}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold"
              >
                {useCustomCity ? "اختر من القائمة" : "مدينتي ليست مضافة بموقع المكتنب؟ اكتب يدوياً"}
              </button>
            </div>

            {useCustomCity ? (
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                  <MapPin className="w-4.5 h-4.5" />
                </div>
                <input
                  type="text"
                  required
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  placeholder="اكتب مدينتك الحالية بالمملكة يدوياً"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all font-medium"
                />
              </div>
            ) : (
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                  <MapPin className="w-4.5 h-4.5" />
                </div>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-11 pl-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer font-medium"
                >
                  {SAUDI_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Previous Delivery Experience Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">مستوى خبرتك في مجال التوصيل والخدمات اللوجستية <span className="text-amber-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                <Briefcase className="w-4.5 h-4.5" />
              </div>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-11 pl-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer font-medium"
              >
                {EXPERIENCE_LEVELS.map((el) => (
                  <option key={el.id} value={el.label}>
                    {el.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Custom Experience TextArea Details */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block">اكتب بالتفصيل الشركات أو التطبيقات السابقة التي عملت بها (أو اذكر أية ملاحظات تفيد قبولك سريعاً)</label>
          <textarea
            value={customExperience}
            onChange={(e) => setCustomExperience(e.target.value)}
            placeholder="مثال: عملت مع هنقرستيشن لمدة سنة ونصف بسيارة خاصة، وأمتلك دراية شاملة بأحياء شمال الرياض بالكامل وتقييمي مرتفع..."
            rows={2}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all font-medium"
          />
        </div>
      </div>

      {/* Choose delivery applications sector (REQUIRED) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
          <div>
            <h4 className="text-md font-bold text-white flex items-center gap-2">
              <span className="bg-amber-500 text-slate-950 text-xs w-5 h-5 rounded-full flex items-center justify-center font-extrabold font-mono">2</span>
              <span>اختر التطبيق / التطبيقات المراد العمل عليها حالياً</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">يمكنك تسجيل وتفعيل أكثر من تطبيق بنفس الوقت لزيادة مدخولك اليومي</p>
          </div>
          
          <button
            type="button"
            onClick={handleSelectAllApps}
            className="text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg font-bold"
          >
            {selectedApps.length === deliveryApps.filter(a => a.isAvailable).length ? "إلغاء اختيار الكل" : "اختر كافة التطبيقات المتاحة لقناة الدخل الأقصى"}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deliveryApps.map((app) => {
            const isSelected = selectedApps.includes(app.id);
            const isAvailable = app.isAvailable;
            return (
              <div
                key={app.id}
                onClick={() => handleAppToggle(app.id)}
                className={`rounded-2xl p-4 border transition-all duration-300 relative flex flex-col justify-between select-none ${
                  !isAvailable
                    ? "bg-slate-950/40 border-slate-900 opacity-60 cursor-not-allowed hover:bg-slate-950/60"
                    : isSelected
                    ? "bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border-amber-500 ring-2 ring-amber-500/20 cursor-pointer"
                    : "bg-slate-950/70 border-slate-800/80 hover:border-slate-700/80 cursor-pointer"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                      {app.logo}
                    </span>
                    <div className="flex flex-col gap-0.5 text-right">
                      <span className="text-xs font-bold text-white">{app.name.split(" ")[0]}</span>
                      <span className="text-[10px] text-amber-500 font-bold leading-none">📍 {app.region}</span>
                    </div>
                  </div>

                  {!isAvailable ? (
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-450 border border-rose-500/20 font-bold animate-pulse leading-none flex items-center justify-center">
                      نفد المعروض ⚠️
                    </span>
                  ) : (
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                      isSelected
                        ? "bg-amber-500 border-amber-400 text-slate-950"
                        : "bg-slate-900 border-slate-800"
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3.5]" />}
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
                  {app.description}
                </p>

                {!isAvailable && (
                  <div className="text-[9px] text-rose-400 border-t border-slate-850/50 pt-2 mt-2 flex items-center gap-1 font-sans">
                    <span>* عذراً: غير متاح لعدم توفر الحسابات حالياً</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Large Submit Application Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-3.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-slate-950 font-bold py-4 px-6 rounded-xl hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer shadow-lg shadow-amber-500/15 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>جاري تقديم طلبك وتوثيقه بلوحات التشغيل...</span>
            </>
          ) : (
            <>
              <span>إرسال وتوثيق الطلب فورياً والانتقال لحجز موعد المقابلة</span>
              <ArrowLeft className="w-5 h-5" />
            </>
          )}
        </button>
        <p className="text-center text-[11px] text-slate-500 mt-3 leading-relaxed">
          بضغطك على إرسال، فإنك توافق على تزويد بوارق الشرق بالمعلومات المذكورة لغرض مراجعة وثيقة القيادة والمركبة وتفعيل حسابك الرسمي مع التطبيقات المختارة.
        </p>
      </div>
    </form>
  );
}
