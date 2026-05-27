import React from "react";
import { Check, Flame, MapPin, Calendar, Clock, Download, RefreshCw, Smartphone, ShieldCheck, Printer, Navigation } from "lucide-react";
import { OFFICE_INFO } from "../data";

interface TicketSummaryProps {
  courierId: string;
  info: {
    name: string;
    phone: string;
    city: string;
    apps: string[];
  };
  scheduledDate: string;
  scheduledTime: string;
  onReset: () => void;
}

export default function TicketSummary({ courierId, info, scheduledDate, scheduledTime, onReset }: TicketSummaryProps) {
  const [localStatus, setLocalStatus] = React.useState<string>("جديد");
  const [localDate, setLocalDate] = React.useState<string>(scheduledDate);
  const [localTime, setLocalTime] = React.useState<string>(scheduledTime);
  const [appCode, setAppCode] = React.useState<string>("");
  const [notes, setNotes] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [courierObj, setCourierObj] = React.useState<any>(null);

  const fetchLiveStatus = async () => {
    if (!courierId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/couriers/${courierId}`);
      if (res.ok) {
        let data;
        try {
          data = await res.json();
        } catch (jsonErr) {
          console.warn("Returned response was not valid JSON:", jsonErr);
          return;
        }
        if (data && data.success && data.courier) {
          const c = data.courier;
          setCourierObj(c);
          setLocalStatus(c.status || "جديد");
          if (c.interviewDate) setLocalDate(c.interviewDate);
          if (c.interviewTime) setLocalTime(c.interviewTime);
          if (c.appCourierCode) setAppCode(c.appCourierCode);
          if (c.adminNotes) setNotes(c.adminNotes);
        }
      }
    } catch (e) {
      console.error("Error loading live courier status:", e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchLiveStatus();
  }, [courierId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto print:bg-white print:text-slate-900" id="receipt-ticket-container">
      {/* Complete Success Spark */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <Check className="w-8 h-8 stroke-[3]" />
        </div>
        <h2 className="text-2xl font-black text-white">يا كابتن {info.name.split(" ")[0]}، حجزك مكتمل ومؤكد بنجاح!</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          تمت جدولة موعدك آلياً وإضافته إلى نظام الموارد البشرية لـ بوارق الشرق. سيقوم موظف الاستلام بانتظارك في الموعد المختار لتسليمك العهدة وتفعيل حسابك.
        </p>
      </div>

      {/* The High Tech Ticket design */}
      <div className="relative border border-amber-500/30 bg-slate-950 rounded-2xl overflow-hidden shadow-2xl shadow-amber-500/5">
        {/* Futuristic glowing strips */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-600 to-amber-400"></div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-slate-900 rounded-l-full border-r border-slate-900"></div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-slate-900 rounded-r-full border-l border-slate-900"></div>

        <div className="p-6 md:p-8 space-y-6">
          {/* Header of Ticket */}
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-500 tracking-widest font-mono">Bawariq Express Ticket</span>
              <h3 className="text-md font-extrabold text-white mt-0.5">بطاقة الحضور والتسجيل الذكي للمناديب</h3>
            </div>
            <div className="text-left font-mono">
              <span className="text-[10px] text-slate-500 block">كود الطلب الأصلي:</span>
              <span className="text-xs font-bold text-slate-300">#{(courierId || "").substring(0, 8).toUpperCase()}</span>
            </div>
          </div>

          {/* Live Mobile Tracking Progress Indicator */}
          <div className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-4 space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <span className="text-xs text-slate-400 font-bold block">متابعة وحالة ملف الانتساب الخاص بك:</span>
              <button 
                onClick={fetchLiveStatus}
                disabled={loading}
                className="px-2 py-1 text-[9px] bg-slate-950 border border-slate-805 rounded hover:text-white flex items-center gap-1 cursor-pointer"
                title="تحديث الحالة لحظياً"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin text-amber-500" : ""}`} />
                <span>تحديث</span>
              </button>
            </div>
            
            {/* Visual Stepper */}
            <div className="relative py-2 pb-6 border-b border-slate-900/50">
              <div className="h-0.5 bg-slate-800 w-[80%] absolute top-4 left-1/2 -translate-x-1/2 rounded -z-1"></div>
              <div className="flex justify-between relative z-10 text-[9px] sm:text-[10px]">
                <div className="flex flex-col items-center gap-1.5">
                  <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    localStatus === "جديد" || localStatus === "تمت المقابلة" || localStatus === "تم التفعيل"
                      ? "bg-amber-500 text-slate-950 ring-4 ring-amber-500/10" : "bg-slate-800 text-slate-550"
                  }`}>1</span>
                  <span className="font-extrabold text-slate-300">تقديم الطلب</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    localStatus === "تمت المقابلة" || localStatus === "تم التفعيل"
                      ? "bg-cyan-400 text-slate-950 ring-4 ring-cyan-400/10" : "bg-slate-800 text-slate-550"
                  }`}>2</span>
                  <span className="font-extrabold text-slate-300">المقابلة الوجاهية</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    localStatus === "تم التفعيل"
                      ? "bg-emerald-400 text-slate-950 ring-4 ring-emerald-400/10" : "bg-slate-800 text-slate-550"
                  }`}>3</span>
                  <span className="font-extrabold text-slate-300">التنشيط النهائي 🎉</span>
                </div>
              </div>
            </div>

            {/* Admin notes section if present */}
            {notes && (
              <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg text-[11px] text-amber-400 leading-relaxed">
                <strong>📝 ملاحظات الإدارة والمراجعة:</strong> {notes}
              </div>
            )}

            {/* Activated app code segment */}
            {localStatus === "تم التفعيل" && appCode && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs leading-normal space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold border-b border-emerald-500/15 pb-1.5">
                  <span>🚀 تم التفعيل وتعيين كودك الموحد بنجاح:</span>
                  <span className="text-[10px] bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded uppercase font-black">الحالة: مفعّل</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">كود المندوب بالبوابات الموحدة:</span>
                  <span className="font-mono bg-slate-950 border border-emerald-500/30 px-3 py-1 rounded font-black tracking-wider text-emerald-400 text-sm select-all">{appCode}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-sans leading-relaxed">تفضل الآن بالتوجه لتطبيقات التوصيل (جاهز / هنقرستيشن) التي وافقنا لك عليها، وقم بتسجيل الدخول باستخدام كود بوارق لبدء التوزيع والاستلام دون عوائق.</p>
              </div>
            )}
          </div>

          {/* Core Appointment Panel */}
          <div className="grid gap-4 sm:grid-cols-2 bg-slate-900/40 border border-slate-800 p-4 rounded-xl text-sm">
            <div className="flex gap-3 items-center">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">تاريخ المقابلة المعتمد</span>
                <span className="font-bold text-white text-xs md:text-sm">{localDate}</span>
              </div>
            </div>

            <div className="flex gap-3 items-center">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">فترة حضورك والقبول المباشر</span>
                <span className="font-bold text-white text-xs md:text-sm">{localTime}</span>
              </div>
            </div>
          </div>

          {/* Courier Base Info Details */}
          <div className="border-t border-b border-dashed border-slate-800/80 py-4 grid gap-4 grid-cols-2 text-xs">
            <div>
              <span className="text-slate-500 block mb-0.5">الاسم الكامل للمرشح:</span>
              <span className="font-bold text-slate-200">{info.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">رقم جوال الكابتن:</span>
              <span className="font-bold text-slate-200 tracking-wider font-mono">{info.phone}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">مدينة ممارسة العمل:</span>
              <span className="font-bold text-slate-200">{info.city}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">التطبيقات المختارة للتفعيل:</span>
              <span className="font-bold text-amber-400">
                {info.apps.map(id => id.toUpperCase()).join(", ")}
              </span>
            </div>
          </div>

          {/* Headquarters / Map link option on ticket */}
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-slate-500 block">عنوان المقابلة واستلام العهدة:</span>
                <p className="text-slate-250 font-bold leading-normal text-slate-200">{OFFICE_INFO.address}</p>
              </div>
            </div>
            <a
              href={OFFICE_INFO.mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-850 hover:border-slate-700 border border-slate-800 rounded-lg text-amber-400 font-extrabold flex items-center justify-center gap-1.5 transition-all text-[11px] shrink-0"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>افتح في خرائط Google 🗺️</span>
            </a>
          </div>

          {/* Real-time WhatsApp Verification action card */}
          <div className="bg-gradient-to-br from-emerald-500/10 via-slate-900/60 to-slate-950 border border-emerald-500/35 rounded-2xl p-6 space-y-5">
            <div className="flex gap-4 items-start">
              <div className="p-3 rounded-2xl bg-emerald-500 text-slate-950 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse flex items-center justify-center">
                {/* Custom styled chat symbol */}
                <svg viewBox="0 0 24 24" className="w-5.5 h-5.5 fill-current">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.446L0 24zm6.59-4.846c1.6.95 3.1 1.4 4.8 1.4 5.3 0 9.7-4.3 9.7-9.7s-4.3-9.7-9.7-9.7-9.7 4.3-9.7 9.7c0 2 .5 3.7 1.6 5.2l-.9 3.4 3.5-.9zM16.5 13.5c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.2-.2.3-.8.9-1 .1-.2-.2-.3-.5-.3-.5s-1.1-1.7-1.7-2.7c-.5-.9-.1-1.3.1-1.4.2-.1.4-.4.5-.5s.2-.3.3-.5c.1-.2 0-.4 0-.5s-.7-1.7-1-2.4c-.3-.7-.6-.6-.8-.6h-.6c-.2 0-.5.1-.8.4-1 1-1.5 2.4-1.5 3.9 0 3.1 2.3 6 2.6 6.4.3.4 4.5 6.9 10.9 9.6 1.5.6 2.7 1 3.6 1.3 1.5.5 2.9.4 4-.1 1.2-.2 2.5-.8 2.8-1.6s.3-1.5.2-1.6c-.1-.1-.4-.3-.9-.6z" />
                </svg>
              </div>
              <div className="space-y-1 text-right">
                <span className="text-[10px] bg-emerald-500 text-slate-900 px-2.5 py-0.5 rounded font-black tracking-wider uppercase inline-block mb-1">هام جداً: التفعيل الفوري إلكترونياً ⚡</span>
                <h4 className="text-sm font-extrabold text-white">إرسال عبارة "جاهز لاستلام اليوزر" للبدء المباشر واستلام يوزرك!</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  يتطلب منك الآن وبطريقة آلية سريعة إرسال رسالة واتساب بعبارة <strong className="text-emerald-400">جاهز لاستلام اليوزر</strong> إلى رقم المشرف الخاص بك، مع إرفاق الهوية والرخصة والاستمارة لتنشيط حسابك فوراً.
                </p>
              </div>
            </div>

            {/* Document details box */}
            <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 space-y-3">
              <span className="text-xs font-bold text-slate-200 block border-b border-slate-900 pb-1.5">📂 يرجى إرفاق المستندات التالية فور فتح الشات في الواتساب:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] text-slate-400 font-semibold">
                <div className="flex items-center gap-1.5 bg-slate-900/40 p-2.5 rounded-lg border border-slate-900">
                  <span className="text-emerald-400 font-extrabold text-xs">✓</span>
                  <span>صورة الهوية الوطنية / الإقامة</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-900/40 p-2.5 rounded-lg border border-slate-900">
                  <span className="text-emerald-400 font-extrabold text-xs">✓</span>
                  <span>صورة رخصة القيادة السارية</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-900/40 p-2.5 rounded-lg border border-slate-900">
                  <span className="text-emerald-400 font-extrabold text-xs">✓</span>
                  <span>صورة استمارة السيارة</span>
                </div>
              </div>
            </div>

            {/* Interactive Clipboard Copy Cells */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 bg-slate-950 border border-slate-900 rounded-xl p-3 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-bold">العبارة المفتاحية للإرسال:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-amber-400 bg-amber-400/10 px-3 py-1 rounded-lg">جاهز لاستلام اليوزر</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText("جاهز لاستلام اليوزر");
                      alert("تم نسخ العبارة المفتاحية 'جاهز لاستلام اليوزر' بنجاح! 📋");
                    }}
                    className="p-1.5 text-slate-500 hover:text-white bg-slate-900 rounded-md hover:border-slate-800 border border-slate-950 transition-colors text-[10px] font-bold"
                  >
                    نسخ العبارة
                  </button>
                </div>
              </div>
              
              {/* Direct Open Whatsapp Link */}
              <a
                href={`https://wa.me/${(() => {
                  const phoneStr = courierObj?.supervisorPhone || "0599612490";
                  let clean = phoneStr.replace(/[\s\-\+]/g, "");
                  if (clean.startsWith("00966")) {
                    clean = clean.substring(5);
                  } else if (clean.startsWith("966")) {
                    clean = clean.substring(3);
                  } else if (clean.startsWith("05")) {
                    clean = clean.substring(1);
                  } else if (clean.startsWith("5") && clean.length === 9) {
                    // already 5xxxxxxxx
                  }
                  return `966${clean}`;
                })()}?text=${encodeURIComponent("جاهز لاستلام اليوزر")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl transition-all text-xs flex items-center justify-center gap-2 shrink-0 shadow-[0_4px_15px_rgba(16,185,129,0.25)] hover:scale-[1.01]"
              >
                <span>إرسال المستندات في الواتساب الآن 🚀</span>
                {courierObj?.supervisorName && (
                  <span className="text-[9px] bg-slate-950/20 px-1.5 py-0.5 rounded text-emerald-950 font-extrabold">({courierObj.supervisorName})</span>
                )}
              </a>
            </div>
          </div>

          {/* Fake QR Check-In Graphic (represented brilliantly via high tech SVG to avoid dependencies) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2 bg-slate-900/10 p-4 rounded-2xl border border-slate-900">
            <div className="space-y-1.5 flex-1 text-center sm:text-right">
              <span className="text-xs font-extrabold text-white flex items-center gap-2 justify-center sm:justify-start">
                <Smartphone className="w-4 h-4 text-amber-500" />
                <span>امسح تصريح الدخول عند بوابة المكتب الرئيسي</span>
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                هذا الباركود الرقمي يسمح لك بالحصول على أولوية القبول والدخول السريع دون الحاجة للانتظار الطويل بقسم الاستقبال. يرجى إظهار هذه الشاشة لموظف الاستقبال مباشرة.
              </p>
            </div>

            {/* Structured QR Visual with SVG patterns */}
            <div className="flex-shrink-0 bg-white p-3.5 rounded-xl flex items-center justify-center">
              <svg className="w-24 h-24 text-slate-950" viewBox="0 0 100 100" fill="currentColor">
                <rect width="100" height="100" fill="white" />
                {/* Outlines of corners */}
                <path d="M5 5h20v20H5zM5 5v5h15V5zm15 15H5v-5h15z" />
                <path d="M75 5h20v20H75zM75 5v5h15V5zm15 15H75v-5h15z" />
                <path d="M5 75h20v20H5zM5 75v5h15V75zm15 15H5v-5h15z" />
                {/* Random blocks representing QR code strictly */}
                <path d="M35 15h10v10H35zM55 15h15v5H55zM45 35h15v10H45zM15 45h10v15H15zM35 55h20v5H35zM75 45h15v10H75zM70 70h15v15H70z M20 20h2v2h-2z M80 20h2v2h-2z M20 80h2v2h-2zM35 80h10v5H35zM55 80h10v10H55z" />
                {/* Small Center Circle */}
                <circle cx="50" cy="50" r="4" fill="currentColor" />
              </svg>
            </div>
          </div>
        </div>

        {/* Footer of card */}
        <div className="bg-slate-900 border-t border-slate-800/80 p-4 text-center">
          <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>بوارق الشرق للخدمات اللوجستية ش.م.م - مرخص وموثق رسمياً</span>
          </p>
        </div>
      </div>

      {/* Control Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-2">
        <button
          onClick={handlePrint}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white px-5 py-3 rounded-xl hover:bg-slate-800 transition-all font-bold text-xs"
        >
          <Printer className="w-4 h-4" />
          <span>اطبع تصريح الموعد مباشرة</span>
        </button>

        <button
          onClick={onReset}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-950 border border-slate-900 text-slate-400 hover:text-amber-400 px-5 py-3 rounded-xl hover:bg-slate-900/60 transition-all font-bold text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>تقديم طلب مندوب جديد (كابتن آخر)</span>
        </button>
      </div>
    </div>
  );
}
