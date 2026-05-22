import React from "react";
import { DELIVERY_APPS } from "../data";
import { Users, Coins, Zap, ShieldAlert, Award, Compass } from "lucide-react";

export default function Features() {
  return (
    <div className="space-y-12">
      {/* Dynamic Intro Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/25 px-4 py-1.5 rounded-full text-amber-400 text-sm font-bold">
          <Award className="w-4 h-4" />
          <span>الشريك التشغيلي الأول والمعتمد بالمملكة</span>
        </div>
        <h2 className="text-3xl font-extrabold text-white md:text-4xl leading-tight">
          انضم لعائلة <span className="text-amber-400">بوارق الشرق</span> وابدأ برفع دخلك اليومي فوراً!
        </h2>
        <p className="text-slate-400 leading-relaxed text-sm md:text-base">
          نحن نوفر لك أفضل بيئة تشغيلية ممتازة مع تسوية سريعة وماتش ذكي للطلبات. شركاؤنا هم عمالقة السوق السعودي لضمان عمل مستقر طوال 24 ساعة بدون انقطاع.
        </p>
      </div>

      {/* Grid of Partners with custom glow cards for Hunger Station, Toyou, Keeta, Chefs, Mrsool, Jahez */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-400" />
            <span className="text-lg font-bold text-white">تطبيقات التوصيل المدعومة بنسبة تشغيلية 100%</span>
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md">
            يمكنك تفعيل جميع التطبيقات معنا
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DELIVERY_APPS.map((app) => (
            <div
              key={app.id}
              className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all duration-300 hover:translate-y-[-2px] flex flex-col justify-between group h-full relative overflow-hidden"
            >
              {/* Subtle accent color top bar to pop */}
              <div className={`absolute top-0 right-0 h-[3px] w-full bg-gradient-to-r ${app.color}`}></div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl bg-slate-950/80 p-2 rounded-xl border border-slate-800 flex items-center justify-center">
                      {app.logo}
                    </span>
                    <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                      {app.name}
                    </h3>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed h-11 overflow-hidden">
                  {app.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-medium">متاح للاستلام والعمل فوراً</span>
                <span className={`text-[10px] uppercase font-extrabold ${app.textColor} bg-slate-950 px-2 py-0.5 rounded border border-slate-800/80`}>
                  بث تشغيلي نشط
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Showcase for Couriers to create desire to work */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800/80 rounded-2xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl -z-10"></div>

        <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-4 mb-6 text-center sm:text-right">
          لماذا تعد <span className="text-amber-400">بوارق الشرق</span> الخيار الأذكى للمناديب الطموحين؟
        </h3>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Coins className="w-5.5 h-5.5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">تسوية مستحقات فورية وأسبوعية</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                لا تأخير في صرف مستحقات التوصيل أو الحوافز الإضافية. نظامنا مالي احترافي ومعتمد بالكامل.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Zap className="w-5.5 h-5.5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">دعم فني بشري متواصل 24/7</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                نحمي حقوق المناديب من خلال غرف عمليات لمتابعة وحل مشكلات التوصيل والمنصات لحظياً.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Users className="w-5.5 h-5.5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">بدون تعقيد وبأتمتة كاملة</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                من لحظات التسجيل حتى تفعيل حسابك، تتم الأمور آلياً وتتلقى موعد مقابلتك لحيازة عتادك وبدء رحلتك.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
