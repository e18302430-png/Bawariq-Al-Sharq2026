import React from "react";
import { Check, Flame, MapPin, Calendar, Clock, Download, RefreshCw, Smartphone, ShieldCheck, Printer } from "lucide-react";

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
              <span className="text-xs font-bold text-slate-300">#{courierId.substring(0, 8).toUpperCase()}</span>
            </div>
          </div>

          {/* Core Appointment Panel */}
          <div className="grid gap-4 sm:grid-cols-2 bg-slate-900/40 border border-slate-800 p-4 rounded-xl text-sm">
            <div className="flex gap-3 items-center">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">تاريخ المقابلة المعتمد</span>
                <span className="font-bold text-white text-xs md:text-sm">{scheduledDate}</span>
              </div>
            </div>

            <div className="flex gap-3 items-center">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">فترة حضورك والقبول المباشر</span>
                <span className="font-bold text-white text-xs md:text-sm">{scheduledTime}</span>
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
