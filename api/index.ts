import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const SUPABASE_URL = process.env.SUPABASE_URL || "https://gsvodabvuodhqgozisbq.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzdm9kYWJ2dW9kaHFnb3ppc2JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTY3MjYsImV4cCI6MjA5NTE5MjcyNn0.v_kZqy-bWDtbl8pAGW3qcpNh5JGpiAshbpiY9u3uxWA";

async function db(table, method, body, query) {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? "?" + query : ""}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Prefer": "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Serve frontend
const distPath = path.join(__dirname, "..", "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// ============================================================
// Health Check
// ============================================================
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", database: "supabase", timestamp: new Date().toISOString() });
});

// ============================================================
// Delivery Apps
// ============================================================
const APPS_BASE = [
  { id: "hungerstation", name: "هنقرستيشن (HungerStation)", description: "المنصة الأكبر والأكثر طلباً بالمملكة مع بونص يومي مجزٍ", logo: "🍔", color: "from-amber-500 to-amber-600", textColor: "text-amber-500" },
  { id: "toyou", name: "تويو (ToYou)", description: "نمو متسارع وطلبات مستمرة وتغطية كافة أنحاء المدن الرئيسية", logo: "🚗", color: "from-red-500 to-red-600", textColor: "text-red-500" },
  { id: "keeta", name: "كيتا (Keeta)", description: "تطبيق التوصيل الصاعد بقوة مع حوافز ممتازة وعمولات ثابتة", logo: "⚡", color: "from-orange-500 to-orange-600", textColor: "text-orange-500" },
  { id: "thechefs", name: "ذا شفز (The Chefs)", description: "نخبة المطاعم والحلويات الفاخرة مع متوسط قيمة توصيل مرتفعة", logo: "👨‍🍳", color: "from-purple-500 to-purple-600", textColor: "text-purple-500" },
  { id: "mrsool", name: "مرسول (Mrsool)", description: "تحكم كامل في اختيار الطلبات والتواصل المباشر مع العميل", logo: "📨", color: "from-emerald-500 to-emerald-600", textColor: "text-emerald-500" },
  { id: "jahez", name: "جاهز (Jahez)", description: "قاعدة عملاء عريضة وشبكة مطاعم حصرية تضمن تدفق مستمر للطلبات", logo: "🛵", color: "from-pink-500 to-pink-600", textColor: "text-pink-500" },
];

app.get("/api/delivery-apps", async (req, res) => {
  try {
    const settings = await db("app_settings", "GET");
    const apps = APPS_BASE.map((app) => {
      const setting = settings.find((s) => s.id === app.id);
      return {
        ...app,
        isAvailable: setting ? setting.is_available : true,
        region: setting ? setting.region : "مستوى المملكة",
        warningMessage: setting ? setting.warning_message : "",
      };
    });
    res.json({ success: true, apps });
  } catch (e) {
    res.json({
      success: true,
      apps: APPS_BASE.map(a => ({ ...a, isAvailable: true, region: "مستوى المملكة", warningMessage: "" })),
    });
  }
});

// ============================================================
// Register Courier
// ============================================================
app.post("/api/register", async (req, res) => {
  try {
    const b = req.body;
    if (!b.name || !b.phone || !b.city)
      return res.status(400).json({ success: false, error: "الاسم والجوال والمدينة مطلوبة" });
    const existing = await db("couriers", "GET", undefined, `phone=eq.${b.phone}`);
    if (existing.length > 0)
      return res.status(409).json({ success: false, error: "رقم الجوال مسجل مسبقاً" });
    const data = await db("couriers", "POST", {
      name: b.name,
      phone: b.phone,
      city: b.city,
      experience: b.experience || "",
      apps: b.apps || [],
      national_id: b.nationalId || "",
      status: "جديد",
      interview_date: "",
      interview_time: "",
      admin_notes: "",
    });
    const courier = Array.isArray(data) ? data[0] : data;
    res.status(201).json({ success: true, courierId: courier.id, courier });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================================
// Schedule Interview
// ============================================================
app.post("/api/schedule", async (req, res) => {
  try {
    const { courierId, interviewDate, interviewTime } = req.body;
    if (!courierId || !interviewDate || !interviewTime)
      return res.status(400).json({ success: false, error: "بيانات الجدولة غير مكتملة" });
    const data = await db("couriers", "PATCH",
      {
        interview_date: interviewDate,
        interview_time: interviewTime,
        status: "تمت المقابلة",
        updated_at: new Date().toISOString(),
      },
      `id=eq.${courierId}`
    );
    const courier = Array.isArray(data) ? data[0] : data;
    res.json({ success: true, courier });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================================
// Lookup Courier
// ============================================================
app.post("/api/couriers/lookup", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query)
      return res.status(400).json({ success: false, error: "أدخل رقم الجوال أو الهوية" });
    let data = await db("couriers", "GET", undefined, `phone=eq.${query}`);
    if (!data.length)
      data = await db("couriers", "GET", undefined, `national_id=eq.${query}`);
    if (!data.length)
      return res.status(404).json({ success: false, error: "لم يتم العثور على أي طلب تقديم مطابق" });
    res.json({ success: true, courier: data[0] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================================
// Couriers CRUD
// ============================================================
app.get("/api/couriers", async (req, res) => {
  try {
    res.json(await db("couriers", "GET", undefined, "order=created_at.desc"));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/couriers/:id", async (req, res) => {
  try {
    const data = await db("couriers", "GET", undefined, `id=eq.${req.params.id}`);
    if (!data.length) return res.status(404).json({ error: "غير موجود" });
    res.json(data[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/couriers", async (req, res) => {
  try {
    const b = req.body;
    if (!b.name || !b.phone || !b.city)
      return res.status(400).json({ error: "الاسم والجوال والمدينة مطلوبة" });
    const existing = await db("couriers", "GET", undefined, `phone=eq.${b.phone}`);
    if (existing.length > 0)
      return res.status(409).json({ error: "رقم الجوال مسجل مسبقاً" });
    const data = await db("couriers", "POST", {
      name: b.name, phone: b.phone, city: b.city,
      experience: b.experience || "", apps: b.apps || [],
      status: "جديد", interview_date: "", interview_time: "", admin_notes: "",
    });
    res.status(201).json(Array.isArray(data) ? data[0] : data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch("/api/couriers/:id", async (req, res) => {
  try {
    const data = await db("couriers", "PATCH",
      { ...req.body, updated_at: new Date().toISOString() },
      `id=eq.${req.params.id}`);
    res.json(Array.isArray(data) ? data[0] : data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/couriers/:id", async (req, res) => {
  try {
    await db("couriers", "DELETE", undefined, `id=eq.${req.params.id}`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// Support Tickets
// ============================================================
app.get("/api/tickets", async (req, res) => {
  try {
    res.json(await db("support_tickets", "GET", undefined, "order=created_at.desc"));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/tickets/:id", async (req, res) => {
  try {
    const data = await db("support_tickets", "GET", undefined, `id=eq.${req.params.id}`);
    if (!data.length) return res.status(404).json({ error: "غير موجود" });
    res.json(data[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/tickets", async (req, res) => {
  try {
    const b = req.body;
    const data = await db("support_tickets", "POST", {
      courier_name: b.courier_name,
      courier_phone: b.courier_phone,
      category: b.category || "عام",
      subject: b.subject,
      status: "جديد",
      messages: b.messages || [],
    });
    res.status(201).json(Array.isArray(data) ? data[0] : data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch("/api/tickets/:id", async (req, res) => {
  try {
    const data = await db("support_tickets", "PATCH",
      { ...req.body, updated_at: new Date().toISOString() },
      `id=eq.${req.params.id}`);
    res.json(Array.isArray(data) ? data[0] : data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// App Settings
// ============================================================
app.get("/api/settings", async (req, res) => {
  try {
    const data = await db("app_settings", "GET");
    const settings = {};
    for (const row of data) { settings[row.id] = row; }
    res.json(settings);
  } catch (e) {
    res.json({
      hungerstation: { id: "hungerstation", is_available: true, region: "مستوى المملكة", warning_message: "" },
      toyou: { id: "toyou", is_available: true, region: "مستوى المملكة", warning_message: "" },
      keeta: { id: "keeta", is_available: true, region: "مستوى المملكة", warning_message: "" },
      thechefs: { id: "thechefs", is_available: true, region: "مستوى المملكة", warning_message: "" },
      mrsool: { id: "mrsool", is_available: true, region: "مستوى المملكة", warning_message: "" },
      jahez: { id: "jahez", is_available: true, region: "مستوى المملكة", warning_message: "" },
    });
  }
});

app.patch("/api/settings/:id", async (req, res) => {
  try {
    const data = await db("app_settings", "PATCH", req.body, `id=eq.${req.params.id}`);
    res.json(Array.isArray(data) ? data[0] : data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// Stats
// ============================================================
app.get("/api/stats", async (req, res) => {
  try {
    const couriers = await db("couriers", "GET");
    const tickets = await db("support_tickets", "GET").catch(() => []);
    const cities = {};
    for (const c of couriers) { cities[c.city] = (cities[c.city] || 0) + 1; }
    res.json({
      total: couriers.length,
      new: couriers.filter(c => c.status === "جديد").length,
      interviewed: couriers.filter(c => c.status === "تمت المقابلة").length,
      activated: couriers.filter(c => c.status === "تم التفعيل").length,
      open_tickets: tickets.filter(t => t.status !== "مغلق").length,
      cities,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// Catch-all frontend
// ============================================================
app.get("*", (req, res) => {
  const indexPath = path.join(__dirname, "..", "dist", "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({ message: "بوارق الشرق API تعمل ✅", database: "Supabase" });
  }
});

export default app;
