import React, { useState, useEffect } from "react";
import { OFFICE_INFO, INTERVIEW_SLOTS } from "../data";
import { Calendar, Clock, MapPin, Phone, CheckCircle, ArrowLeft, Loader2, Navigation, FileCheck } from "lucide-react";

interface AppointmentSchedulerProps {
  courierId: string;
  courierName: string;
  onSuccess: (date: string, time: string) => void;
}

export default function AppointmentScheduler({ courierId, courierName, onSuccess }: AppointmentSchedulerProps) {
  const [availableDates, setAvailableDates] = useState<{ raw: Date; label: string; dateStr: string }[]>([]);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(INTERVIEW_SLOTS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Generate next 7 working days (excluding Fridays)
    const dates = [];
    let current = new Date();
    
    // Add 1 day to start scheduling starting from tomorrow or today if early, let's start from tomorrow for professionalism
    current.setDate(current.getDate() + 1);

    while (dates.length < 7) {
      const dayOfWeek = current.getDay();
      
      // In JS: 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
      // We skip Friday (5) because it is the weekly off day!
      if (dayOfWeek !== 5) {
        const dateStr = current.toISOString().split("T")[0]; // YYYY-MM-DD
        
        // Beautiful Arabic description
        const formatter = new Intl.DateTimeFormat("ar-SA", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });
        
        dates.push({
          raw: new Date(current),
          label: formatter.format(current),
          dateStr,
        });
      }
      current.setDate(current.getDate() + 1);
    }

    setAvailableDates(dates);
  }, []);

  const handleSubmit = async () => {
    if (availableDates.length === 0) return;
    
    setLoading(true);
    setError("");

    const chosenDate = availableDates[selectedDateIndex];

    try {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courierId,
          interviewDate: chosenDate.label + " (" + chosenDate.dateStr + ")",
          interviewTime: selectedTimeSlot,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "فشلت جدولة الموعد، الرجاء المحاولة مجدداً.");
      }

      onSuccess(chosenDate.label, selectedTimeSlot);
    } catch (err: any) {
      setError(err.message || "حدث خطأ في الاتصال بالخادم الرئيسي لإتمام الجدولة.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="appointment-scheduler-container">
      {/* Alert Error If Any */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-xs md:text-sm animate-pulse">
          {error}
        </div>
      )}

      {/* Greeting and Instruction Header */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-right space-y-2">
        <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-amber-400" />
          <span>أهلاً بك يا كابتن {courierName}، تم توثيق بياناتك بنجاح!</span>
        </h3>
        <p className="text-sm text-slate-300">
          طلبك مسجل الآن بالنظام برقم تسلسلي مؤقت <strong className="text-amber-400 font-mono">#{courierId.substring(0, 6).toUpperCase()}</strong>.
        </p>
        <p className="text-xs text-slate-400 leading-relaxed pt-1">
          لكي نقوم بالموافقة الفورية وتفعيل حساباتك على تطبيقات التوصيل، يرجى استكمال خطوتك الأخيرة بتحديد موعد مناسب لك بالحضور شخصياً إلى مقر مكتب بوارق الشرق لاستلام الحسابات وتصريح العمل وحزمة المناديب.
        </p>
      </div>

      {/* Office & Timing Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Info Address Box */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-4">
          <h4 className="text-sm font-extrabold text-white border-b border-slate-800 pb-2.5 flex items-center gap-2">
            <MapPin className="w-4.5 h-4.5 text-amber-400" />
            <span>عنوان المكتب وتفاصيل العمل المكتبي</span>
          </h4>

          <div className="space-y-3.5 text-sm">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 block">الفرع الرئيسي:</span>
              <p className="text-slate-200 font-semibold">{OFFICE_INFO.city}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-500 block">العنوان الجغرافي الدقيق للفرع الرئيسي:</span>
              <p className="text-slate-300 leading-relaxed text-xs">
                {OFFICE_INFO.address}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-500 block">أوقات العمل واستقبال المناديب الجدد:</span>
              <p className="text-amber-400 font-medium text-xs">
                {OFFICE_INFO.workingHours}
              </p>
            </div>

            <div className="pt-2">
              <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <Navigation className="w-5 h-5 text-amber-400 animate-bounce" />
                <div>
                  <span className="text-[10px] text-slate-500 block">هل تستخدم نظام الـ GPS؟</span>
                  <a
                    href="https://maps.google.com/?q=24.7886,46.6293"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-slate-300 hover:text-amber-400 transition-colors underline"
                  >
                    رابط خرائط جوجل للمقر الرئيسي بالرياض
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Required Documents Section */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-extrabold text-white border-b border-slate-800 pb-2.5 flex items-center gap-2">
              <FileCheck className="w-4.5 h-4.5 text-emerald-400" />
              <span>المستندات الورقية والملفات المطلوب إحضارها معك</span>
            </h4>
            <ul className="mt-3.5 space-y-2.5 text-xs text-slate-300 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-extrabold">✓</span>
                <span>أصل وجرة الهوية الوطنية أو الإقامة (سارية المفعول).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-extrabold">✓</span>
                <span>رخصة قيادة سارية ومقبولة ومسجلة رسمياً.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-extrabold">✓</span>
                <span>استمارة السيارة أو تفويض موثق في حال كانت قيادتك لسيارة مستعارة أو بإيجار.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-extrabold">✓</span>
                <span>الجوال الذكي محمل عليه نظام أبشر وتطبيقات التوصيل.</span>
              </li>
            </ul>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl mt-4">
            <p className="text-[10px] text-slate-400 leading-relaxed text-center sm:text-right">
              💡 <strong className="text-emerald-400">ملاحظة هامة:</strong> الموافقة تأتي مباشرة عقب المراجعة السريعة لهويتك. المقابلة لا تتعدى 10 دقائق لتسليم الحقيبة اللوجستية وتفعيل الأرقام آلياً.
            </p>
          </div>
        </div>
      </div>

      {/* Date & Time Selection Stage */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-6">
        <div>
          <h4 className="text-md font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <span>اختر تاريخ المقابلة المرتقبة</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">يرجى اختيار يوم واحد من الأيام السبعة القادمة للعمل المباشر</p>
        </div>

        {/* Date Selector bubbles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {availableDates.map((d, index) => {
            const isSelected = selectedDateIndex === index;
            return (
              <div
                key={d.dateStr}
                onClick={() => setSelectedDateIndex(index)}
                className={`cursor-pointer rounded-xl p-3.5 border text-center transition-all select-none ${
                  isSelected
                    ? "bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-md shadow-amber-500/10"
                    : "bg-slate-950 border-slate-850 hover:border-slate-700 text-slate-300"
                }`}
              >
                <span className="text-xs font-extrabold block">{d.label.split(",")[0]}</span>
                <span className={`text-[11px] block mt-1 font-mono ${isSelected ? 'text-slate-950 font-bold' : 'text-slate-500'}`}>
                  {d.dateStr}
                </span>
              </div>
            );
          })}
        </div>

        {/* Time Slots Area */}
        <div className="pt-2 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-amber-400" />
            <span className="text-xs font-bold text-slate-305 text-white">اختر الفترة الزمنية التي تريد الحضور بها للمكتب</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {INTERVIEW_SLOTS.map((slot) => {
              const isSelected = selectedTimeSlot === slot;
              return (
                <div
                  key={slot}
                  onClick={() => setSelectedTimeSlot(slot)}
                  className={`cursor-pointer rounded-xl p-3 border text-center text-xs transition-all select-none font-bold ${
                    isSelected
                      ? "bg-slate-900 border-amber-500 text-amber-400 ring-2 ring-amber-500/10"
                      : "bg-slate-950 border-slate-850 hover:border-slate-700 text-slate-400"
                  }`}
                >
                  {slot}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Booking Action Button */}
      <div className="pt-2">
        <button
          onClick={handleSubmit}
          disabled={loading || availableDates.length === 0}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-slate-950 font-extrabold py-4 px-6 rounded-xl hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer shadow-lg shadow-amber-500/15 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>جاري حجز موعد المقابلة وتثبيته بالنظام للتحقق...</span>
            </>
          ) : (
            <>
              <span>تأكيد زمان ومكان المقابلة وطباعة تصريح الحضور</span>
              <ArrowLeft className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
