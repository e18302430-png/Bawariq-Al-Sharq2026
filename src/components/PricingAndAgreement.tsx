import React, { useState } from "react";
import { ShieldCheck, Percent, HelpCircle, Gift, Award, ClipboardCheck, ArrowRight, Check, CheckSquare, Sparkles, Terminal } from "lucide-react";

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
    if (!agreed) {
      setError("الرجاء تحديد مربع التأكيد للموافقة على بنود الاتفاقية.");
      return;
    }
    if (!signature.trim()) {
      setError("الرجاء كتابة اسمك الثلاثي في حقل التوقيع الإلكتروني للمتابعة.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/agreement/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courierId, signature: signature.trim() })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "عذراً، فشل اعتماد التوقيع الإلكتروني للطلب.");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "حدث خطأ في الاتصال بالخادم عند حفظ وثيقة العمل.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="pricing-agreement-module">
      
      {/* 1. Rates & Pricing Presentation Block (لوحة العمولات والتسعيرات الفاخرة) */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-6">
        <div className="text-center md:text-right space-y-2 border-b border-slate-800/60 pb-5">
          <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-1 rounded-full font-bold">
            المرجع المالي والدليل الميداني المعتمد 💰
          </span>
          <h3 className="text-xl md:text-2xl font-black text-white">وثيقة العمولات والتسعيرات وتوزيع الأرباح</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            تلتزم شركة بوارق الشرق للخدمات اللوجستية بأقصى درجات الشفافية والعدالة المالية مع شركائنا الرياض رغبةً بدعم المناديب الكباتن وتأمين أعلى المقاييس بالمملكة.
          </p>
        </div>

        {/* Dynamic Bento Box for Pricing details */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Card A: ToYou Pricing & Policy From Saved Image */}
          <div className="bg-slate-950/70 border-2 border-amber-500/25 p-5 rounded-2xl space-y-4 hover:border-amber-500/40 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚡</span>
                  <h4 className="text-sm font-black text-amber-500">تطبيق تويو (ToYou)</h4>
                </div>
                <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded">نظام الشرائح المعتمد ⭐</span>
              </div>
              
              <div className="space-y-2">
                <div className="text-[10px] text-slate-400 font-bold">🎯 نظام التسعيرات (الحد الأدنى 40 طلب):</div>
                <div className="bg-slate-900/60 rounded-xl overflow-hidden border border-slate-850">
                  <table className="w-full text-right text-[11px] font-sans">
                    <thead className="bg-slate-950 text-slate-450 border-b border-slate-850">
                      <tr>
                        <th className="p-2 font-bold">عدد الطلبات</th>
                        <th className="p-2 font-bold text-left">سعر الطلب</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 font-semibold">
                      <tr className="hover:bg-slate-900/50">
                        <td className="p-2 text-slate-300">من 1 إلى 49 طلب</td>
                        <td className="p-2 text-amber-400 text-left font-bold">8 ريال</td>
                      </tr>
                      <tr className="hover:bg-slate-900/50">
                        <td className="p-2 text-slate-300">من 50 إلى 74 طلب</td>
                        <td className="p-2 text-amber-400 text-left font-bold">10 ريال</td>
                      </tr>
                      <tr className="hover:bg-slate-900/50">
                        <td className="p-2 text-slate-300">من 75 إلى 89 طلب</td>
                        <td className="p-2 text-amber-400 text-left font-bold">13 ريال</td>
                      </tr>
                      <tr className="hover:bg-slate-900/50">
                        <td className="p-2 text-slate-300">من 90 إلى 114 طلب</td>
                        <td className="p-2 text-amber-400 text-left font-bold">15 ريال</td>
                      </tr>
                      <tr className="hover:bg-slate-900/50">
                        <td className="p-2 text-slate-300">من 115 طلب فما فوق</td>
                        <td className="p-2 text-amber-400 text-left font-bold">17 ريال</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2.5 pt-1.5 text-xs text-slate-300 border-t border-slate-900">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-bold">📅 نظام الدفع:</span>
                  <span className="text-white font-extrabold bg-slate-900 px-2.5 py-1 rounded border border-slate-850">كل 15 يوم (يوم 15 بالشهر)</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-bold">🏷️ إيجار اليوزر:</span>
                  <span className="text-amber-400 font-extrabold">150 ريال يُخصم أسبوعياً</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-bold">🚗 وسيلة العمل:</span>
                  <span className="text-white font-extrabold flex items-center gap-1">توصيل بالسيارة 🚙</span>
                </div>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-500 leading-relaxed pt-2.5 border-t border-slate-900/80">
              💡 نظام إيجار اليوزر يضمن لك صلاحيات استخدام الكود بمعدلات ربح ممتازة، ويُستقطع تلقائياً من إجمالي مستحقاتك بكل نهاية دورة أسبوعية.
            </p>
          </div>

          {/* Card B: Keeta Pricing & Policy */}
          <div className="bg-slate-950/70 border border-emerald-500/20 p-5 rounded-2xl space-y-4 hover:border-emerald-500/35 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📦</span>
                  <h4 className="text-sm font-black text-emerald-400">تطبيق كيتا (Keeta)</h4>
                </div>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-black px-1.5 py-0.5 rounded border border-emerald-500/20">نسبة ثابتة</span>
              </div>

              <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-900 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                  <span className="text-[11px] font-bold text-slate-300">نسبة العمولة المقتطعة:</span>
                </div>
                <p className="text-2xl font-black text-emerald-400">10% <span className="text-xs text-slate-400 font-normal">فقط على إجمالي الأرباح</span></p>
                <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                  تتميز كيتا بتقديم أقل نسبة عمولة تشغيلية لشركائنا، مما يوفر لك صافي دخل يعادل 90% من قيمة كل طلب يتم توصيله بنجاح.
                </p>
              </div>

              <div className="space-y-2.5 pt-1.5 text-xs text-slate-300 border-t border-slate-900">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-bold">📅 آلية الدفع والتسوية:</span>
                  <span className="text-white font-extrabold bg-slate-900 px-2.5 py-1 rounded border border-slate-850">كل شهر (شهرياً)</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-bold">🏷️ رسوم إيجار اليوزرات:</span>
                  <span className="text-emerald-450 text-emerald-400 font-bold">لا توجد رسوم إيجار إضافية</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-bold">🏆 الحوافز:</span>
                  <span className="text-white font-extrabold">بونص مستمر وحصانة من التقييد</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 leading-relaxed pt-2.5 border-t border-slate-900/80">
              💡 تلتزم بوارق الشرق بتحويل الأرباح المستحقة لـ كيتا مباشرة في اليوم الأول المعتمد من كل شهر ميلادي وبشكل أوتوماتيكي ومباشر.
            </p>
          </div>

          {/* Card C: The Chefs Pricing & Policy */}
          <div className="bg-slate-950/70 border border-purple-500/20 p-5 rounded-2xl space-y-4 hover:border-purple-500/35 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🧁</span>
                  <h4 className="text-sm font-black text-purple-400">تطبيق ذا شفز (The Chefs)</h4>
                </div>
                <span className="text-[9px] bg-purple-500/20 text-purple-400 font-black px-1.5 py-0.5 rounded border border-purple-500/20">مسافات ميدانية</span>
              </div>

              <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-900 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                  <span className="text-[11px] font-bold text-slate-300">الاشتراك والتشغيل اليومي:</span>
                </div>
                <p className="text-2xl font-black text-purple-400">20 ريال <span className="text-xs text-slate-400 font-normal">يومياً</span></p>
                <div className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                  بمقابل هذا الاشتراك اليومي، تحصل على <strong className="text-purple-300">تسعيرات مخصصة بالكامل على المسافة المقطوعة</strong> (تضمن لك عوائد ممتازة لطلبات التوصيل البعيد).
                </div>
              </div>

              <div className="space-y-2.5 pt-1.5 text-xs text-slate-300 border-t border-slate-900">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-bold">📅 آلية الدفع والتسوية:</span>
                  <span className="text-white font-extrabold bg-slate-900 px-2.5 py-1 rounded border border-slate-850">كل 20 يوم</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-bold">🏷️ نوع التسعيرة:</span>
                  <span className="text-purple-300 font-bold">محتسبة بناءً على الكيلومترات</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-bold">🏁 الدعم:</span>
                  <span className="text-white font-extrabold">مراعاة تامة لطلبات الحلويات الفخمة</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 leading-relaxed pt-2.5 border-t border-slate-900/80">
              💡 تسوية دورة الـ 20 يوماً متوافقة بشكل آلي مع جداول بوارق، حيث يقدم النظام تقريراً وافياً بالمسافات المقطوعة التي تم رصدها بالمسار.
            </p>
          </div>

        </div>
      </div>

      {/* 2. Official Short Work Agreement (وثيقة العمل الرسمية والشرعية مختصرة) */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-2.5 border-b border-slate-800/60 pb-4">
          <div className="p-2 rounded-xl bg-amber-500 text-slate-950">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-md font-bold text-white">وثيقة العمل التعاقدية الرسمية (المختصرة)</h4>
            <p className="text-xs text-slate-400 mt-1">بموافقتك وبصمتك الإلكترونية أدناه، تلتزم بالبنود اللوجستية الأساسية لبوارق الشرق</p>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-850 rounded-2xl p-5 space-y-4 text-xs text-slate-300 leading-relaxed text-right md:text-justify font-sans">
          
          <div className="flex gap-2">
            <div className="text-amber-500 font-bold text-md leading-none">١.</div>
            <p><strong>الالتزام بالسلوك والمهنية:</strong> يقر المناديب الكباتن بتمثيل بوارق الشرق والمنصات الشريكة بأفضل مظهر لائق، والتعامل الأخلاقي الرفيع وبكل احترام مع العملاء وموظفي المطاعم بالميدان، مع الالتزام بأنظمة المرور والسلامة للمملكة العربية السعودية.</p>
          </div>

          <div className="flex gap-2 border-t border-slate-900 pt-3">
            <div className="text-amber-500 font-bold text-md leading-none">٢.</div>
            <p><strong>صيانة الأجهزة والعهد:</strong> يتعهد الكابتن بالمحافظة التامة على الحقيبة الحرارية المخصصة له وبقية التجهيزات المسلمة من مكتب بوارق وعدم التفريط بها أو إتاحتها لأطراف غير معتمدة أو العمل بها خارج النطاق الرسمي.</p>
          </div>

          <div className="flex gap-2 border-t border-slate-900 pt-3">
            <div className="text-amber-500 font-bold text-md leading-none">٣.</div>
            <p><strong>نطاق المسؤولية والعمل الحر:</strong> يمتلك الكابتن الحرية التامة في تفعيل ساعات عمله التشغيلي وقبول المشاوير من عدمه، ويتم احتساب مستحقاته بالعمولة المحددة لكل طلب تم توصيله بنجاح وإغلاقه على السيستم.</p>
          </div>

          <div className="flex gap-2 border-t border-slate-900 pt-3">
            <div className="text-amber-500 font-bold text-md leading-none">٤.</div>
            <p><strong>الوثائق والبيانات:</strong> تشير هذه البصمة إلى أن كافة أوراق الكابتن المرفوعة (الهوية الوطنية أو الإقامة، الرخصة الرسمية، استمارة القيادة، الآيبان المالي لمالك الحساب) صحيحة وتابعة له شخصياً ويتحمل المسؤولية القانونية حيال ذك.</p>
          </div>

        </div>

        {/* Validation Interactive Checks (التأكيد والتوقيع الإلكتروني الإبداعي) */}
        <div className="space-y-4 pt-2">
          
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3.5 rounded-xl font-bold text-right flex items-center gap-2">
              <span className="shrink-0 font-bold">⚠️ تنبيه:</span>
              <span>{error}</span>
            </div>
          )}

          {/* Accept checkbox layout */}
          <label 
            onClick={() => setAgreed(!agreed)}
            className="flex items-start gap-3 p-4 bg-slate-950/40 border border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-900/30 transition-all text-right select-none"
          >
            <div className="pt-0.5">
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${agreed ? "bg-amber-500 border-amber-500 text-slate-950" : "border-slate-700 bg-slate-950"}`}>
                {agreed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-white">أقر وأوافق بالتوقيع الإلكتروني على وثيقة الشروط والأسعار الخاصة ببوارق الشرق</p>
              <p className="text-[10px] text-slate-400 leading-relaxed">بموجب أحكام نظام المعاملات الإلكترونية واللائحة التنظيمية لنظام الاتصالات اللوجستية.</p>
            </div>
          </label>

          {/* Name Signature Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">اكتب اسمك الثلاثي للتصديق والتوقيع إلكترونياً <span className="text-amber-500">*</span></label>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="مثال: محمد بن عبد العزيز بن فيصل"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-amber-400 placeholder-slate-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all font-bold tracking-wide"
            />
            {signature.trim() && (
              <div className="bg-slate-950 border border-dashed border-slate-800 p-3.5 rounded-xl text-center relative overflow-hidden">
                <span className="absolute top-1.5 right-2 text-[8px] text-slate-600 font-mono select-none">ELECTRONIC SIGNATURE COMPLIANCE ✔</span>
                <span className="font-serif italic text-lg text-amber-500/80 tracking-wide select-none block py-1 font-extrabold">
                  {signature.trim()}
                </span>
              </div>
            )}
          </div>

          {/* Action trigger button */}
          <button
            type="button"
            disabled={loading}
            onClick={handleAcceptAgreement}
            className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-amber-600 font-extrabold text-xs text-slate-950 rounded-xl hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 select-none hover:scale-[1.005] duration-200"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-slate-950" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>جاري ربط بصمتك والتوثيق على خوادم بوارق...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 text-slate-950 stroke-[2.5]" />
                <span>اعتماد التوقيع وإتمام عملية الجدولة اللوجستية 🔒</span>
              </>
            )}
          </button>

        </div>
      </div>

    </div>
  );
}
