import React, { useState, useEffect } from "react";
import { ShieldCheck, Truck, Lock, LifeBuoy } from "lucide-react";

interface NavbarProps {
  onAdminClick: () => void;
  isAdminMode: boolean;
}

export default function Navbar({ onAdminClick, isAdminMode }: NavbarProps) {
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHash = () => {
      setCurrentHash(window.location.hash);
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const isSupport = currentHash === "#support";

  return (
    <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Logo and branding */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/20">
            <Truck className="w-6 h-6 text-slate-950" />
            <div className="absolute -inset-0.5 bg-amber-500 rounded-xl blur-sm opacity-20 -z-10 group-hover:opacity-40 transition-opacity"></div>
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 via-amber-200 to-white bg-clip-text text-transparent">
              بوارق الشرق للخدمات اللوجستية
            </h1>
            <p className="text-xs text-slate-400 font-medium">الفريد والحديث في قطاع الميل الأخير وقوة التشغيل</p>
          </div>
        </div>

        {/* Live Status and Admin toggle button */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-emerald-400 font-semibold arab-digits">منصة التسجيل الذكي فعالة</span>
          </div>

          {/* Support mode toggle right in navbar */}
          {!isAdminMode && (
            <a
              href={isSupport ? "#" : "#support"}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                isSupport
                  ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm shadow-amber-500/25"
                  : "bg-slate-900 hover:bg-slate-850 hover:border-slate-700 text-slate-350 border-slate-800"
              }`}
            >
              <LifeBuoy className={`w-3.5 h-3.5 ${isSupport ? "animate-spin" : "animate-pulse text-amber-500"}`} />
              <span>{isSupport ? "العودة للتسجيل" : "الدعم الفني والشكاوى 🎧"}</span>
            </a>
          )}

          {/* Only shown when admin mode is active to allow exit */}
          {isAdminMode && (
            <button
              onClick={onAdminClick}
              id="admin-toggle-btn"
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold border bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>الخروج والعودة للتسجيل الرئيسي</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
