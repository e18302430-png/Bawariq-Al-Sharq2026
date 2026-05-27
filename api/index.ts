import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const SUPABASE_URL = process.env.SUPABASE_URL || "https://gsvodabvuodhqgozisbq.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzdm9kYWJ2dW9kaHFnb3ppc2JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTY3MjYsImV4cCI6MjA5NTE5MjcyNn0.v_kZqy-bWDtbl8pAGW3qcpNh5JGpiAshbpiY9u3uxWA";
const ADMIN_PASSWORD = "bawariq2026";
const APP_URL = process.env.APP_URL || "https://bawariq-al-sharq2026.vercel.app";
const N8N_WEBHOOK = process.env.N8N_WEBHOOK || "";

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

function checkAdmin(p) { return p === ADMIN_PASSWORD; }

function mapCourier(c) {
  return {
    id: c.id, name: c.name, phone: c.phone, city: c.city,
    experience: c.experience, apps: c.apps || [],
    status: c.status || "جديد",
    interviewDate: c.interview_date || "",
    interviewTime: c.interview_time || "",
    nationalId: c.national_id || "", iban: c.iban || "",
    carPlate: c.car_plate || "", vehicleModel: c.vehicle_model || "",
    appCourierCode: c.app_courier_code || "",
    activationDate: c.activation_date || "",
    adminNotes: c.admin_notes || "",
    supervisorId: c.supervisor_id || "",
    supervisorPhone: c.supervisor_phone || "",
    supervisorName: c.supervisor_name || "",
    createdAt: c.created_at || "",
  };
}

function mapTicket(t) {
  return {
    id: t.id, courierName: t.courier_name || "",
    courierPhone: t.courier_phone || "",
    category: t.category || "عام", subject: t.subject || "",
    status: t.status || "جديد", messages: t.messages || [],
    supervisorId: t.supervisor_id || "",
    createdAt: t.created_at || "", updatedAt: t.updated_at || t.created_at || "",
  };
}

function mapSupervisor(s) {
  return { id: s.id, name: s.name, phone: s.phone || "", isActive: s.is_active };
}

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

const distPath = path.join(__dirname, "..", "dist");
if (fs.existsSync(distPath)) app.use(express.static(distPath));

// ============================================================
// Health
// ============================================================
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", database: "supabase", timestamp: new Date().toISOString() });
});

// ============================================================
// Supervisors
// ============================================================
app.get("/api/supervisors", async (req, res) => {
  try {
    const data = await db("supervisors", "GET", undefined, "is_active=eq.true&order=created_at.asc");
    res.json({ success: true, supervisors: data.map(mapSupervisor) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/supervisor/login", async (req, res) => {
  try {
    const { supervisorId, password } = req.body;
    const data = await db("supervisors", "GET", undefined, `id=eq.${supervisorId}&is_active=eq.true`);
    if (!data.length) return res.status(404).json({ success: false, error: "المشرف غير موجود" });
    if (data[0].password !== password) return res.status(403).json({ success: false, error: "كلمة المرور غير صحيحة" });
    res.json({ success: true, supervisor: mapSupervisor(data[0]) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/supervisor/couriers", async (req, res) => {
  try {
    const { supervisorId, password } = req.body;
    const sup = await db("supervisors", "GET", undefined, `id=eq.${supervisorId}`);
    if (!sup.length || sup[0].password !== password) return res.status(403).json({ success: false, error: "غير مصرح" });
    const couriers = await db("couriers", "GET", undefined, `supervisor_id=eq.${supervisorId}&order=created_at.desc`);
    res.json({ success: true, couriers: couriers.map(mapCourier) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/supervisor/tickets", async (req, res) => {
  try {
    const { supervisorId, password } = req.body;
    const sup = await db("supervisors", "GET", undefined, `id=eq.${supervisorId}`);
    if (!sup.length || sup[0].password !== password) return res.status(403).json({ success: false, error: "غير مصرح" });
    const tickets = await db("support_tickets", "GET", undefined, `supervisor_id=eq.${supervisorId}&order=created_at.desc`);
    res.json({ success: true, tickets: tickets.map(mapTicket) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/supervisor/tickets/:id/reply", async (req, res) => {
  try {
    const { supervisorId, password, text } = req.body;
    const sup = await db("supervisors", "GET", undefined, `id=eq.${supervisorId}`);
    if (!sup.length || sup[0].password !== password) return res.status(403).json({ success: false, error: "غير مصرح" });
    const ticketData = await db("support_tickets", "GET", undefined, `id=eq.${req.params.id}`);
    if (!ticketData.length) return res.status(404).json({ success: false, error: "التذكرة غير موجودة" });
    const messages = ticketData[0].messages || [];
    messages.push({ sender: "admin", senderName: sup[0].name, text, createdAt: new Date().toISOString() });
    const updated = await db("support_tickets", "PATCH", { messages, status: "تم الرد" }, `id=eq.${req.params.id}`);
    res.json({ success: true, ticket: mapTicket(Array.isArray(updated) ? updated[0] : updated) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/supervisor/update-status", async (req, res) => {
  try {
    const { supervisorId, password, courierId, status } = req.body;
    const sup = await db("supervisors", "GET", undefined, `id=eq.${supervisorId}`);
    if (!sup.length || sup[0].password !== password) return res.status(403).json({ success: false, error: "غير مصرح" });
    const data = await db("couriers", "PATCH", { status }, `id=eq.${courierId}`);
    res.json({ success: true, courier: mapCourier(Array.isArray(data) ? data[0] : data) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
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
      const s = settings.find((x) => x.id === app.id);
      return { ...app, isAvailable: s ? s.is_available : true, region: s ? s.region : "مستوى المملكة", warningMessage: s ? s.warning_message : "" };
    });
    res.json({ success: true, apps });
  } catch (e) {
    res.json({ success: true, apps: APPS_BASE.map(a => ({ ...a, isAvailable: true, region: "مستوى المملكة", warningMessage: "" })) });
  }
});

// ============================================================
// Couriers - GET single (للـ TicketSummary)
// ============================================================
app.get("/api/couriers/:id", async (req, res) => {
  try {
    const data = await db("couriers", "GET", undefined, `id=eq.${req.params.id}`);
    if (!data.length) return res.status(404).json({ success: false, error: "غير موجود" });
    const c = data[0];
    // جلب بيانات المشرف
    let supervisorName = "";
    let supervisorPhone = "0599612490";
    if (c.supervisor_id && c.supervisor_id !== "direct") {
      const sup = await db("supervisors", "GET", undefined, `id=eq.${c.supervisor_id}`).catch(() => []);
      if (sup.length) {
        supervisorName = sup[0].name;
        supervisorPhone = sup[0].phone || "0599612490";
      }
    }
    res.json({
      success: true,
      courier: {
        ...mapCourier(c),
        supervisorName,
        supervisorPhone,
      }
    });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ============================================================
// Register & Schedule
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
      name: b.name, phone: b.phone, city: b.city,
      experience: b.experience || "", apps: b.apps || [],
      national_id: b.nationalId || "", status: "جديد",
      interview_date: "", interview_time: "", admin_notes: "",
      supervisor_id: b.supervisorId || "",
    });
    const courier = Array.isArray(data) ? data[0] : data;
    if (N8N_WEBHOOK) {
      fetch(N8N_WEBHOOK, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "new_courier", courier: mapCourier(courier), profileUrl: `${APP_URL}/courier/${courier.id}`, timestamp: new Date().toISOString() }),
      }).catch(() => {});
    }
    res.status(201).json({ success: true, courierId: courier.id, courier: mapCourier(courier) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/schedule", async (req, res) => {
  try {
    const { courierId, interviewDate, interviewTime } = req.body;
    if (!courierId || !interviewDate || !interviewTime)
      return res.status(400).json({ success: false, error: "بيانات الجدولة غير مكتملة" });
    const data = await db("couriers", "PATCH",
      { interview_date: interviewDate, interview_time: interviewTime, status: "تمت المقابلة" },
      `id=eq.${courierId}`
    );
    res.json({ success: true, courier: mapCourier(Array.isArray(data) ? data[0] : data) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/couriers/lookup", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ success: false, error: "أدخل رقم الجوال أو الهوية" });
    let data = await db("couriers", "GET", undefined, `phone=eq.${query}`);
    if (!data.length) data = await db("couriers", "GET", undefined, `national_id=eq.${query}`);
    if (!data.length) return res.status(404).json({ success: false, error: "لم يتم العثور على أي طلب تقديم مطابق" });
    res.json({ success: true, courier: mapCourier(data[0]) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ============================================================
// QR - صفحة بيانات المندوب
// ============================================================
app.get("/api/courier-profile/:id", async (req, res) => {
  try {
    const data = await db("couriers", "GET", undefined, `id=eq.${req.params.id}`);
    if (!data.length) return res.status(404).json({ error: "المندوب غير موجود" });
    res.json({ success: true, courier: mapCourier(data[0]) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/courier/:id", async (req, res) => {
  try {
    const data = await db("couriers", "GET", undefined, `id=eq.${req.params.id}`);
    if (!data.length) return res.status(404).send("<h1 style='font-family:Arial;text-align:center;margin-top:50px'>المندوب غير موجود</h1>");
    const c = data[0];
    const statusColor = c.status === "تم التفعيل" ? "#10b981" : c.status === "تمت المقابلة" ? "#06b6d4" : "#f59e0b";
    let supervisorName = "";
    if (c.supervisor_id && c.supervisor_id !== "direct") {
      const sup = await db("supervisors", "GET", undefined, `id=eq.${c.supervisor_id}`).catch(() => []);
      if (sup.length) supervisorName = sup[0].name;
    }
    res.send(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>بطاقة المندوب - ${c.name}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
.card { background: #1e293b; border: 1px solid #334155; border-radius: 20px; padding: 32px 24px; max-width: 380px; width: 100%; text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.5); }
.logo { font-size: 12px; color: #64748b; margin-bottom: 20px; letter-spacing: 2px; }
.avatar { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #d97706); display: flex; align-items: center; justify-content: center; font-size: 36px; margin: 0 auto 16px; }
.name { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
.city { font-size: 13px; color: #94a3b8; margin-bottom: 16px; }
.status { display: inline-block; padding: 6px 18px; border-radius: 20px; font-size: 12px; font-weight: 700; margin-bottom: 24px; background: ${statusColor}22; color: ${statusColor}; border: 1px solid ${statusColor}44; }
.info-box { background: #0f172a; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
.info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #1e293b; font-size: 13px; }
.info-row:last-child { border-bottom: none; }
.info-label { color: #64748b; }
.info-value { color: #e2e8f0; font-weight: 600; }
.apps { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin: 16px 0; }
.app-tag { background: #f59e0b22; color: #f59e0b; border: 1px solid #f59e0b44; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }
.footer { font-size: 11px; color: #475569; margin-top: 16px; }
.verified { color: #10b981; font-size: 12px; margin-top: 8px; font-weight: 700; }
</style>
</head>
<body>
<div class="card">
  <div class="logo">🚀 بوارق الشرق للخدمات اللوجستية</div>
  <div class="avatar">🛵</div>
  <div class="name">${c.name}</div>
  <div class="city">📍 ${c.city}</div>
  <div class="status">${c.status || "جديد"}</div>
  <div class="info-box">
    <div class="info-row"><span class="info-label">المشرف</span><span class="info-value">${supervisorName || "مباشر"}</span></div>
    <div class="info-row"><span class="info-label">موعد المقابلة</span><span class="info-value">${c.interview_date ? c.interview_date.split(" (")[0] : "لم يحدد بعد"}</span></div>
    <div class="info-row"><span class="info-label">الوقت</span><span class="info-value">${c.interview_time || "—"}</span></div>
    <div class="info-row"><span class="info-label">تاريخ التسجيل</span><span class="info-value">${new Date(c.created_at).toLocaleDateString("ar-SA")}</span></div>
  </div>
  <div class="apps">${(c.apps || []).map(a => `<span class="app-tag">${a.toUpperCase()}</span>`).join("") || "<span style='color:#475569;font-size:12px'>لا توجد تطبيقات</span>"}</div>
  <div class="footer">رقم التعريف: ${c.id.substring(0, 8).toUpperCase()}</div>
  <div class="verified">✓ موثق من بوارق الشرق</div>
</div>
</body>
</html>`);
  } catch (e) { res.status(500).send("<h1>حدث خطأ</h1>"); }
});

// ============================================================
// Support Tickets
// ============================================================
app.post("/api/support/tickets", async (req, res) => {
  try {
    const b = req.body;
    if (!b.name || !b.phone || !b.subject)
      return res.status(400).json({ success: false, error: "الاسم والجوال والموضوع مطلوبة" });
    const messages = [];
    if (b.message) messages.push({ sender: "courier", text: b.message, imageUrl: b.imageUrl || null, createdAt: new Date().toISOString() });
    const data = await db("support_tickets", "POST", {
      courier_name: b.name, courier_phone: b.phone,
      category: b.category || "عام", subject: b.subject,
      status: "جديد", messages, supervisor_id: b.supervisorId || "",
    });
    const ticket = Array.isArray(data) ? data[0] : data;
    res.status(201).json({ success: true, ticket: mapTicket(ticket) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/support/search", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, error: "أدخل رقم الجوال" });
    const data = await db("support_tickets", "GET", undefined, `courier_phone=eq.${phone}&order=created_at.desc`);
    res.json({ success: true, tickets: data.map(mapTicket) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get("/api/support/tickets/:id", async (req, res) => {
  try {
    const data = await db("support_tickets", "GET", undefined, `id=eq.${req.params.id}`);
    if (!data.length) return res.status(404).json({ success: false, error: "التذكرة غير موجودة" });
    res.json({ success: true, ticket: mapTicket(data[0]) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/support/tickets/:id/messages", async (req, res) => {
  try {
    const { sender, text, imageUrl } = req.body;
    const ticketData = await db("support_tickets", "GET", undefined, `id=eq.${req.params.id}`);
    if (!ticketData.length) return res.status(404).json({ success: false, error: "التذكرة غير موجودة" });
    const messages = ticketData[0].messages || [];
    messages.push({ sender: sender || "courier", text: text || "", imageUrl: imageUrl || null, createdAt: new Date().toISOString() });
    const newStatus = sender === "admin" ? "تم الرد" : "قيد المتابعة";
    const data = await db("support_tickets", "PATCH", { messages, status: newStatus }, `id=eq.${req.params.id}`);
    res.json({ success: true, ticket: mapTicket(Array.isArray(data) ? data[0] : data) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ============================================================
// Admin Endpoints
// ============================================================
app.post("/api/admin/couriers", async (req, res) => {
  try {
    if (!checkAdmin(req.body.password)) return res.status(403).json({ success: false, error: "كلمة المرور غير صحيحة" });
    const data = await db("couriers", "GET", undefined, "order=created_at.desc");
    res.json({ success: true, couriers: data.map(mapCourier) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/admin/update-status", async (req, res) => {
  try {
    const { password, courierId, status } = req.body;
    if (!checkAdmin(password)) return res.status(403).json({ success: false, error: "غير مصرح" });
    const data = await db("couriers", "PATCH", { status }, `id=eq.${courierId}`);
    res.json({ success: true, courier: mapCourier(Array.isArray(data) ? data[0] : data) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/admin/assign-supervisor", async (req, res) => {
  try {
    const { password, courierId, supervisorId } = req.body;
    if (!checkAdmin(password)) return res.status(403).json({ success: false, error: "غير مصرح" });
    const data = await db("couriers", "PATCH", { supervisor_id: supervisorId }, `id=eq.${courierId}`);
    res.json({ success: true, courier: mapCourier(Array.isArray(data) ? data[0] : data) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/admin/update-profile", async (req, res) => {
  try {
    const { password, courierId, nationalId, iban, carPlate, vehicleModel, appCourierCode, activationDate, adminNotes, supervisorId } = req.body;
    if (!checkAdmin(password)) return res.status(403).json({ success: false, error: "غير مصرح" });
    const data = await db("couriers", "PATCH", {
      national_id: nationalId || "", iban: iban || "",
      car_plate: carPlate || "", vehicle_model: vehicleModel || "",
      app_courier_code: appCourierCode || "", activation_date: activationDate || "",
      admin_notes: adminNotes || "", supervisor_id: supervisorId || "",
    }, `id=eq.${courierId}`);
    res.json({ success: true, courier: mapCourier(Array.isArray(data) ? data[0] : data) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/admin/delete-courier", async (req, res) => {
  try {
    const { password, courierId } = req.body;
    if (!checkAdmin(password)) return res.status(403).json({ success: false, error: "غير مصرح" });
    await db("couriers", "DELETE", undefined, `id=eq.${courierId}`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/admin/update-app-settings", async (req, res) => {
  try {
    const { password, id, isAvailable, region, warningMessage } = req.body;
    if (!checkAdmin(password)) return res.status(403).json({ success: false, error: "غير مصرح" });
    const data = await db("app_settings", "PATCH",
      { is_available: isAvailable, region: region || "مستوى المملكة", warning_message: warningMessage || "" },
      `id=eq.${id}`
    );
    res.json({ success: true, setting: Array.isArray(data) ? data[0] : data });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/admin/tickets", async (req, res) => {
  try {
    if (!checkAdmin(req.body.password)) return res.status(403).json({ success: false, error: "غير مصرح" });
    const data = await db("support_tickets", "GET", undefined, "order=created_at.desc");
    res.json({ success: true, tickets: data.map(mapTicket) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/admin/tickets/update-status", async (req, res) => {
  try {
    const { password, ticketId, status } = req.body;
    if (!checkAdmin(password)) return res.status(403).json({ success: false, error: "غير مصرح" });
    const data = await db("support_tickets", "PATCH", { status }, `id=eq.${ticketId}`);
    res.json({ success: true, ticket: mapTicket(Array.isArray(data) ? data[0] : data) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/admin/supervisors", async (req, res) => {
  try {
    if (!checkAdmin(req.body.password)) return res.status(403).json({ success: false, error: "غير مصرح" });
    const supervisors = await db("supervisors", "GET", undefined, "order=created_at.asc");
    // إضافة عدد المناديب لكل مشرف
    const couriers = await db("couriers", "GET", undefined, "select=supervisor_id").catch(() => []);
    const countMap = {};
    couriers.forEach(c => { if (c.supervisor_id) countMap[c.supervisor_id] = (countMap[c.supervisor_id] || 0) + 1; });
    res.json({ success: true, supervisors: supervisors.map(s => ({ ...mapSupervisor(s), password: s.password, courierCount: countMap[s.id] || 0 })) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/admin/supervisors/add", async (req, res) => {
  try {
    const { password, id, name, supervisorPassword, phone } = req.body;
    if (!checkAdmin(password)) return res.status(403).json({ success: false, error: "غير مصرح" });
    if (!id || !name || !supervisorPassword) return res.status(400).json({ success: false, error: "المعرف والاسم وكلمة المرور مطلوبة" });
    const existing = await db("supervisors", "GET", undefined, `id=eq.${id}`);
    if (existing.length > 0) return res.status(409).json({ success: false, error: "المعرف مستخدم مسبقاً" });
    const data = await db("supervisors", "POST", { id, name, password: supervisorPassword, phone: phone || "", is_active: true });
    res.status(201).json({ success: true, supervisor: mapSupervisor(Array.isArray(data) ? data[0] : data) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/admin/supervisors/update-password", async (req, res) => {
  try {
    const { password, supervisorId, newPassword } = req.body;
    if (!checkAdmin(password)) return res.status(403).json({ success: false, error: "غير مصرح" });
    await db("supervisors", "PATCH", { password: newPassword }, `id=eq.${supervisorId}`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/admin/supervisors/toggle", async (req, res) => {
  try {
    const { password, supervisorId, isActive } = req.body;
    if (!checkAdmin(password)) return res.status(403).json({ success: false, error: "غير مصرح" });
    await db("supervisors", "PATCH", { is_active: isActive }, `id=eq.${supervisorId}`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/admin/supervisors/delete", async (req, res) => {
  try {
    const { password, supervisorId } = req.body;
    if (!checkAdmin(password)) return res.status(403).json({ success: false, error: "غير مصرح" });
    await db("supervisors", "DELETE", undefined, `id=eq.${supervisorId}`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get("/api/admin/download-csv", async (req, res) => {
  try {
    const { auth } = req.query;
    if (!checkAdmin(auth)) return res.status(403).send("غير مصرح");
    const couriers = await db("couriers", "GET", undefined, "order=created_at.desc");
    const supervisors = await db("supervisors", "GET").catch(() => []);
    const supMap = {};
    supervisors.forEach(s => { supMap[s.id] = s.name; });
    const headers = ["الاسم","الجوال","المدينة","الهوية","التطبيقات","الحالة","المشرف","موعد المقابلة","وقت المقابلة","IBAN","المركبة","اللوحة","كود التطبيق","تاريخ التفعيل","الملاحظات","تاريخ التسجيل"];
    const rows = couriers.map(c => [
      c.name, c.phone, c.city, c.national_id || "",
      (c.apps || []).join(" - "), c.status || "جديد",
      supMap[c.supervisor_id] || "",
      c.interview_date || "", c.interview_time || "",
      c.iban || "", c.vehicle_model || "", c.car_plate || "",
      c.app_courier_code || "", c.activation_date || "",
      c.admin_notes || "", c.created_at || ""
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="bawariq-couriers-${new Date().toISOString().split("T")[0]}.csv"`);
    res.send(csv);
  } catch (e) { res.status(500).send("خطأ في تصدير البيانات"); }
});

// ============================================================
// Settings & Stats
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
// Catch-all
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
