import React, { useState } from "react";
import { ShieldCheck, ClipboardCheck, Check, Loader2 } from "lucide-react";

interface PricingAndAgreementProps {
  courierId: string;
  courierName: string;
  onSuccess: () => void;
}

export default function PricingAndAgreement({ courierId, courierName, onSuccess }: PricingAndAgreementProps) {
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAcceptAgreement = async () => {
    if (!agreed) { setError("الرجاء تحديد مربع التأكيد للموافقة على بنود الاتفاقية."); return; }
    if (!signature.trim()) { setError("الرجاء كتابة اسمك الثلاثي في حقل التوقيع."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/agreement-accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courierId, signature: signature.trim() })
      });
      const contentType = res.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`خطأ من الخادم: ${text.substring(0, 100)}`);
      }
      if (!res.ok || !data.success) throw new Error(data.error || "فشل اعتماد التوقيع.");
      onSuccess();
    } catch (err: any) {
      setError(err.message || "حدث خطأ في الاتصال بالخادم.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">

      {/* التسعيرات */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-6">
        <div className="text-center space-y-2 border-b border-slate-800/60 pb-5">
          <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-1 rounded-full font-bold">المرجع المالي والدليل الميداني المعتمد 💰</span>
          <h3 className="text-xl md:text-2xl font-black text-white">وثيقة العمولات والتسعيرات وتوزيع الأرباح</h3>
          <p className="text-xs text-slate-400 leading-relaxed">تلتزم شركة بوارق الشرق بأقصى درجات الشفافية والعدالة المالية مع شركائنا الكباتن.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* تويو */}
          <div className="bg-slate-950/70 border-2 border-amber-500/25 p-5 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚡</span>
                  <h4 className="text-sm font-black text-amber-500">تطبيق تويو (ToYou)</h4>
                </div>
                <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded">نظام الشرائح ⭐</span>
              </div>
              <div className="space-y-2">
                <div className="text-[10px] text-slate-400 font-bold">🎯 نظام التسعيرات:</div>
                <div className="bg-slate-900/60 rounded-xl overflow-hidden border border-slate-800">
                  <table className="w-full text-right text-[11px]">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr><th className="p-2 font-bold">عدد الطلبات</th><th className="p-2 font-bold text-left">سعر الطلب</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {[["من 1 إلى 49 طلب","8 ريال"],["من 50 إلى 74 طلب","10 ريال"],["من 75 إلى 89 طلب","13 ريال"],["من 90 إلى 114 طلب","15 ريال"],["من 115 فما فوق","17 ريال"]].map(([range, price]) => (
                        <tr key={range} className="hover:bg-slate-900/50">
                          <td className="p-2 text-slate-300">{range}</td>
                          <td className="p-2 text-amber-400 text-left font-bold">{price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="space-y-2 pt-1.5 text-[11px] border-t border-slate-900">
                <div className="flex justify-between"><span className="text-slate-400 font-bold">📅 نظام الدفع:</span><span className="text-white font-bold">كل 15 يوم</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-bold">🏷️ إيجار اليوزر:</span><span className="text-amber-400 font-bold">150 ريال أسبوعياً</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-bold">🚗 وسيلة العمل:</span><span className="text-white font-bold">سيارة 🚙</span></div>
              </div>
            </div>
          </div>

          {/* كيتا */}
          <div className="bg-slate-950/70 border border-emerald-500/20 p-5 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📦</span>
                  <h4 className="text-sm font-black text-emerald-400">تطبيق كيتا (Keeta)</h4>
                </div>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-black px-1.5 py-0.5 rounded border border-emerald-500/20">نسبة ثابتة</span>
              </div>
              <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-900 space-y-3">
                <p className="text-2xl font-black text-emerald-400">10% <span className="text-xs text-slate-400 font-normal">فقط على إجمالي الأرباح</span></p>
                <p className="text-[10px] text-slate-400 leading-relaxed">أقل نسبة عمولة تشغيلية — 90% من قيمة كل طلب لك.</p>
              </div>
              <div className="space-y-2 pt-1.5 text-[11px] border-t border-slate-900">
                <div className="flex justify-between"><span className="text-slate-400 font-bold">📅 آلية الدفع:</span><span className="text-white font-bold">شهرياً</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-bold">🏷️ رسوم إيجار:</span><span className="text-emerald-400 font-bold">لا توجد رسوم</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-bold">🏆 الحوافز:</span><span className="text-white font-bold">بونص مستمر</span></div>
              </div>
            </div>
          </div>

          {/* ذا شفز */}
          <div className="bg-slate-950/70 border border-purple-500/20 p-5 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🧁</span>
                  <h4 className="text-sm font-black text-purple-400">ذا شفز (The Chefs)</h4>
                </div>
                <span className="text-[9px] bg-purple-500/20 text-purple-400 font-black px-1.5 py-0.5 rounded border border-purple-500/20">مسافات ميدانية</span>
              </div>
              <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-900 space-y-3">
                <p className="text-2xl font-black text-purple-400">20 ريال <span className="text-xs text-slate-400 font-normal">يومياً</span></p>
                <p className="text-[10px] text-slate-400 leading-relaxed">تسعيرات مخصصة على المسافة المقطوعة — عوائد ممتازة للطلبات البعيدة.</p>
              </div>
              <div className="space-y-2 pt-1.5 text-[11px] border-t border-slate-900">
                <div className="flex justify-between"><span className="text-slate-400 font-bold">📅 آلية الدفع:</span><span className="text-white font-bold">كل 20 يوم</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-bold">🏷️ نوع التسعيرة:</span><span className="text-purple-300 font-bold">بالكيلومترات</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-bold">🏁 الدعم:</span><span className="text-white font-bold">طلبات حلويات فاخرة</span></div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* الاتفاقية */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-2.5 border-b border-slate-800/60 pb-4">
          <div className="p-2 rounded-xl bg-amber-500 text-slate-950"><ClipboardCheck className="w-5 h-5" /></div>
          <div>
            <h4 className="text-md font-bold text-white">وثيقة العمل التعاقدية الرسمية</h4>
            <p className="text-xs text-slate-400 mt-1">بموافقتك وبصمتك الإلكترونية أدناه، تلتزم بالبنود اللوجستية الأساسية لبوارق الشرق</p>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs text-slate-300 leading-relaxed text-right">
          {[
            ["١", "الالتزام بالسلوك والمهنية", "يقر المناديب الكباتن بتمثيل بوارق الشرق بأفضل مظهر لائق، والتعامل الأخلاقي الرفيع مع العملاء وموظفي المطاعم، مع الالتزام بأنظمة المرور والسلامة."],
            ["٢", "صيانة الأجهزة والعهد", "يتعهد الكابتن بالمحافظة على الحقيبة الحرارية وبقية التجهيزات المسلمة من مكتب بوارق وعدم التفريط بها."],
            ["٣", "نطاق المسؤولية والعمل الحر", "يمتلك الكابتن الحرية التامة في تفعيل ساعات عمله وقبول المشاوير، ويتم احتساب مستحقاته بالعمولة المحددة لكل طلب."],
            ["٤", "الوثائق والبيانات", "تشير هذه البصمة إلى أن كافة أوراق الكابتن المرفوعة صحيحة وتابعة له شخصياً ويتحمل المسؤولية القانونية حيالها."],
          ].map(([num, title, text]) => (
            <div key={num} className="flex gap-2 border-t border-slate-900 pt-3 first:border-0 first:pt-0">
              <div className="text-amber-500 font-bold leading-none">{num}.</div>
              <p><strong>{title}:</strong> {text}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4 pt-2">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3.5 rounded-xl flex items-center gap-2">
              <span className="font-bold">⚠️</span><span>{error}</span>
            </div>
          )}

          <label onClick={() => setAgreed(!agreed)}
            className="flex items-start gap-3 p-4 bg-slate-950/40 border border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-900/30 transition-all text-right select-none">
            <div className="pt-0.5">
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${agreed ? "bg-amber-500 border-amber-500 text-slate-950" : "border-slate-700 bg-slate-950"}`}>
                {agreed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-white">أقر وأوافق بالتوقيع الإلكتروني على وثيقة الشروط والأسعار</p>
              <p className="text-[10px] text-slate-400">بموجب أحكام نظام المعاملات الإلكترونية.</p>
            </div>
          </label>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">اكتب اسمك الثلاثي للتوقيع إلكترونياً <span className="text-amber-500">*</span></label>
            <input type="text" value={signature} onChange={(e) => setSignature(e.target.value)}
              placeholder="مثال: محمد بن عبد العزيز بن فيصل"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-amber-400 placeholder-slate-700 focus:outline-none focus:border-amber-500 transition-all font-bold" />
            {signature.trim() && (
              <div className="bg-slate-950 border border-dashed border-slate-800 p-3.5 rounded-xl text-center">
                <span className="text-[8px] text-slate-600 font-mono block mb-1">ELECTRONIC SIGNATURE ✔</span>
                <span className="font-serif italic text-lg text-amber-500/80 font-extrabold">{signature.trim()}</span>
              </div>
            )}
          </div>

          <button type="button" disabled={loading} onClick={handleAcceptAgreement}
            className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-amber-600 font-extrabold text-xs text-slate-950 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40">
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /><span>جاري ربط بصمتك والتوثيق...</span></>
            ) : (
              <><ShieldCheck className="w-5 h-5 stroke-[2.5]" /><span>اعتماد التوقيع وإتمام الجدولة 🔒</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
