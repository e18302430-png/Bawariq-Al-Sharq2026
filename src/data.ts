import { DeliveryApp } from "./types";

export const DELIVERY_APPS: DeliveryApp[] = [
  {
    id: "hungerstation",
    name: "هنقرستيشن (HungerStation)",
    description: "المنصة الأكبر والأكثر طلباً بالمملكة مع بونص يومي مجزٍ",
    logo: "🍔",
    color: "from-amber-500 to-amber-600",
    textColor: "text-amber-500",
  },
  {
    id: "toyou",
    name: "تويو (ToYou)",
    description: "نمو متسارع، طلبات مستمرة وتغطية تغطي كافة أنحاء المدن الرئيسية",
    logo: "🚗",
    color: "from-red-500 to-red-600",
    textColor: "text-red-500",
  },
  {
    id: "keeta",
    name: "كيتا (Keeta)",
    description: "تطبيق التوصيل الصاعد بقوة مع حوافز ممتازة وعمولات ثابتة للمناديب المبادرين",
    logo: "⚡",
    color: "from-orange-500 to-orange-600",
    textColor: "text-orange-500",
  },
  {
    id: "thechefs",
    name: "ذا شفز (The Chefs)",
    description: "نخبة المطاعم والحلويات الفاخرة مع متوسط قيمة توصيل مرتفعة جداً",
    logo: "👨‍🍳",
    color: "from-purple-500 to-purple-600",
    textColor: "text-purple-500",
  },
  {
    id: "mrsool",
    name: "مرسول (Mrsool)",
    description: "تحكم كامل في اختيار الطلبات والتواصل المباشر مع العميل وتحديد العمولات",
    logo: "📨",
    color: "from-emerald-500 to-emerald-600",
    textColor: "text-emerald-500",
  },
  {
    id: "jahez",
    name: "جاهز (Jahez)",
    description: "قاعدة عملاء عريضة وشبكة مطاعم حصرية تضمن تدفق مستمر للطلبات طوال اليوم",
    logo: "🛵",
    color: "from-pink-500 to-pink-600",
    textColor: "text-pink-500",
  }
];

export const SAUDI_CITIES = [
  "الرياض",
  "جدة",
  "الدمام",
  "الخبر",
  "الجبيل",
  "الأحساء",
  "بريدة",
  "حائل",
  "مكة المكرمة",
  "المدينة المنورة",
  "تبوك",
  "جازان",
  "نجران",
  "خميس مشيط",
  "أبها",
  "الطائف",
  "الهفوف",
  "الخرج"
];

export const EXPERIENCE_LEVELS = [
  { id: "beginner", label: "مبتدئ (لا توجد خبرة سابقة ولكن متحمس للعمل)" },
  { id: "short", label: "أقل من سنة (عملت لعدة أشهر وعلى دراية بالطرق)" },
  { id: "mid", label: "سنة إلى سنتين (خبرة ممتازة وسجل تقييم جيد مع التطبيقات)" },
  { id: "long", label: "أكثر من سنتين (محترف وملم بجميع الأحياء وضوابط التوصيل السريع)" }
];

export const INTERVIEW_SLOTS = [
  "09:00 ص - 11:00 ص",
  "11:00 ص - 01:00 م",
  "01:00 م - 03:00 م",
  "04:00 م - 06:00 م",
  "06:00 م - 08:00 م",
  "08:00 م - 10:00 م"
];

export const OFFICE_INFO = {
  city: "الرياض (الفرع الرئيسي)",
  address: "طريق الملك فهد، حي الصحافة، برج رافال مكاتب بوارق الشرق، الدور الرابع",
  workingHours: "من السبت إلى الخميس: 09:00 صباحاً حتى 09:00 مساءً (الجمعة عطلة أسبوعية)",
  phone: "+966 50 000 0000",
  locationCoords: { lat: 24.7886, lng: 46.6293 }
};
