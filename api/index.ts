import express from "express";
import path from "path";
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

async function db(table: string, method: string, body?: any, query?: string) {
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

function checkAdmin(p: string) { return p === ADMIN_PASSWORD; }

function mapCourier(c: any) {
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
    createdAt: c.created_at || "",
  };
}

function mapTicket(t: any) {
  return {
    id: t.id, courierName: t.courier_name || "",
    courierPhone: t.courier_phone || "",
    category: t.category || "عام", subject: t.subject || "",
    status: t.status || "جديد", messages: t.messages || [],
    supervisorId: t.supervisor_id || "",
    createdAt: t.created_at || "", updatedAt: t.updated_at || t.created_at || "",
  };
}

function mapSupervisor(s: any) {
  return { id: s.id, name: s.name, phone: s.phone || "", isActive: s.is_active };
}

app.use((req: any, res: any, next: any) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.get("/api/health", (req: any, res: any) => {
  res.json({ status: "ok", database: "supabase", timestamp: new Date().toISOString() });
});

app.get("/api/supervisors", async (req: any, res: any) => {
  try {
    const data = await db("supervisors", "GET", undefined, "is_active=eq.true&order=created_at.asc");
    res.json({ success: true, supervisors: data.map(mapSupervisor) });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/supervisor/login", async (req: any, res: any) => {
  try {
    const { supervisorId, password } = req.body;
    const data = await db("supervisors", "GET", undefined, `id=eq.${supervisorId}&is_active=eq.true`);
    if (!data.length) return res.status(404).json({ success: false, error: "المشرف غير موجود" });
    if (data[0].password !== password) return res.status(403).json({ success: false, error: "كلمة المرور غير صحيحة" });
    res.json({ success: true, supervisor: mapSupervisor(data[0]) });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/supervisor/couriers", async (req: any, res: any) => {
  try {
    const { supervisorId, password } = req.body;
    const sup = await db("supervisors", "GET", undefined, `id=eq.${supervisorId}`);
    if (!sup.length || sup[0].password !== password) return res.status(403).json({ success: false, error: "غير مصرح" });
    const couriers = await db("couriers", "GET", undefined, `supervisor_id=eq.${supervisorId}&order=created_at.desc`);
    res.json({ success: true, couriers: couriers.map(mapCourier) });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/supervisor/tickets", async (req: any, res: any) => {
  try {
    const { supervisorId, password } = req.body;
    const sup = await db("supervisors", "GET", undefined, `id=eq.${supervisorId}`);
    if (!sup.length || sup[0].password !== password) return res.status(403).json({ success: false, error: "غير مصرح" });
    const tickets = await db("support_tickets", "GET", undefined, `supervisor_id=eq.${supervisorId}&order=created_at.desc`);
    res.json({ success: true, tickets: tickets.map(mapTicket) });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/supervisor/tickets/:id/reply", async (req: any, res: any) => {
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
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/supervisor/update-status", async (req: any, res: any) => {
  try {
    const { supervisorId, password, courierId, status } = req.body;
    const sup = await db("supervisors", "GET", undefined, `id=eq.${supervisorId}`);
    if (!sup.length || sup[0].password !== password) return res.status(403).json({ success: false, error: "غير مصرح" });
    const data = await db("couriers", "PATCH", { status }, `id=eq.${courierId}`);
    res.json({ success: true, courier: mapCourier(Array.isArray(data) ? data[0] : data) });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

const APPS_BASE = [
  { id: "hungerstation", name: "هنقرستيشن (HungerStation)", description: "المنصة الأكبر والأكثر طلباً بالمملكة مع بونص يومي مجزٍ", logo: "🍔", color: "from-amber-500 to-amber-600", textColor: "text-amber-500" },
  { id: "toyou", name: "تويو (ToYou)", description: "نمو متسارع وطلبات مستمرة وتغطية كافة أنحاء المدن الرئيسية", logo: "🚗", color: "from-red-500 to-red-600", textColor: "text-red-500" },
  { id: "keeta", name: "كيتا (Keeta)", description: "تطبيق التوصيل الصاعد بقوة مع حوافز ممتازة وعمولات ثابتة", logo: "⚡", color: "from-orange-500 to-orange-600", textColor: "text-orange-500" },
  { id: "thechefs", name: "ذا شفز (The Chefs)", description: "نخبة المطاعم والحلويات الفاخرة مع متوسط قيمة توصيل مرتفعة", logo: "👨‍🍳", color: "from-purple-500 to-purple-600", textColor: "text-purple-500" },
  { id: "mrsool", name: "مرسول (Mrsool)", description: "تحكم كامل في اختيار الطلبات والتواصل المباشر مع العميل", logo: "📨", color: "from-emerald-500 to-emerald-600", textColor: "text-emerald-500" },
  { id: "jahez", name: "جاهز (Jahez)", description: "قاعدة عملاء عريضة وشبكة مطاعم حصرية تضمن تدفق مستمر للطلبات", logo: "🛵", color: "from-pink-500 to-pink-600", textColor: "text-pink-500" },
];

app.get("/api/delivery-apps", async (req: any, res: any) => {
  try {
    const settings = await db("app_settings", "GET").catch(() => []);
    const apps = APPS_BASE.map((app) => {
      const s = settings.find((x: any) => x.id === app.id);
      return { ...app, isAvailable: s ? s.is_available : true, region: s ? s.region : "مستوى المملكة", warningMessage: s ? s.warning_message : "" };
    });
    res.json({ success: true, apps });
  } catch (e: any) {
    res.json({ success: true, apps: APPS_BASE.map(a => ({ ...a, isAvailable: true, region: "مستوى المملكة", warningMessage: "" })) });
  }
});

app.post("/api/register", async (req: any, res: any) => {
  try {
    const b = req.body;
    if (!b.name || !b.phone || !b.city) return res.status(400).json({ success: false, error: "الاسم والجوال والمدينة مطلوبة" });
    const existing = await db("couriers", "GET", undefined, `phone=eq.${b.phone}`);
    if (existing.length > 0) return res.status(409).json({ success: false, error: "رقم الجوال مسجل مسبقاً" });
    const data = await db("couriers", "POST", {
      name: b.name, phone: b.phone, city: b.city,
      experience: b.experience || "", apps: b.apps || [],
      national_id: b.nationalId || "", status: "جديد",
      interview_date: "", interview_time: "", admin_notes: "",
      supervisor_id: b.supervisorId || "",
    });
    const courier = Array.isArray(data) ? data[0] : data;
    if (N8N_WEBHOOK) {
      fetch(N8N_WEBHOOK, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "new_courier", courier: mapCourier(courier), profileUrl: `${APP_URL}/courier/${courier.id}`, timestamp: new Date().toISOString() }) }).catch(() => {});
    }
    res.status(201).json({ success: true, courierId: courier.id, courier: mapCourier(courier) });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/schedule", async (req: any, res: any) => {
  try {
    const { courierId, interviewDate, interviewTime } = req.body;
    if (!courierId || !interviewDate || !interviewTime) return res.status(400).json({ success: false, error: "بيانات الجدولة غير مكتملة" });
    const data = await db("couriers", "PATCH", { interview_date: interviewDate, interview_time: interviewTime, status: "تمت المقابلة" }, `id=eq.${courierId}`);
    res.json({ success: true, courier: mapCourier(Array.isArray(data) ? data[0] : data) });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/couriers/lookup", async (req: any, res: any) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ success: false, error: "أدخل رقم الجوال أو الهوية" });
    let data = await db("couriers", "GET", undefined, `phone=eq.${query}`);
    if (!data.length) data = await db("couriers", "GET", undefined, `national_id=eq.${query}`);
    if (!data.length) return res.status(404).json({ success: false, error: "لم يتم العثور على أي طلب تقديم مطابق" });
    res.json({ success: true, courier: mapCourier(data[0]) });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

app.get("/api/courier-profile/:id", async (req: any, res: any) => {
  try {
    const data = await db("couriers", "GET", undefined, `id=eq.${req.params.id}`);
    if (!data.length) return res.status(404).json({ error: "المندوب غير موجود" });
    res.json({ success: true, courier: mapCourier(data[0]) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/support/tickets", async (req: any, res: any) => {
  try {
    const b = req.body;
    if (!b.name || !b.phone || !b.subject) return res.status(400).json({ success: false, error: "الاسم والجوال والموضوع مطلوبة" });
    const messages = [];
    if (b.message) messages.push({ sender: "courier", text: b.message, imageUrl: b.imageUrl || null, createdAt: new Date().toISOString() });
    const data = await db("support_tickets", "POST", { courier_name: b.name, courier_phone: b.phone, category: b.category || "عام", subject: b.subject, status: "جديد", messages, supervisor_id: b.supervisorId || "" });
    const ticket = Array.isArray(data) ? data[0] : data;
    res.status(201).json({ success: true, ticket: mapTicket(ticket) });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/support/search", async (req: any, res: any) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, error: "أدخل رقم الجوال" });
    const data = await db("support_tickets", "GET", undefined, `courier_phone=eq.${phone}&order=created_at.desc`);
    res.json({ success: true, tickets: data.map(mapTicket) });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

app.get("/api/support/tickets/:id", async (req: any, res: any) => {
  try {
    const data = await db("support_tickets", "GET", undefined, `id=eq.${req.params.id}`);
    if (!data.length) return res.status(404).json({ success: false, error: "التذكرة غير موجودة" });
    res.json({ success: true, ticket: mapTicket(data[0]) });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/support/tickets/:id/messages", async (req: any, res: any) => {
  try {
    const { sender, text, imageUrl } = req.body;
    const ticketData = await db("support_tickets", "GET", undefined, `id=eq.${req.params.id}`);
    if (!ticketData.length) return res.status(404).json({ success: false, error: "التذكرة غير موجودة" });
    const messages = ticketData[0].messages || [];
    messages.push({ sender: sender || "courier", text: text || "", imageUrl: imageUrl || null, createdAt: new Date().toISOString() });
    const newStatus = sender === "admin" ? "تم الرد" : "قيد المتابعة";
    const data = await db("support_tickets", "PATCH", { messages, status: newStatus }, `id=eq.${req.params.id}`);
    res.json({ success: true, ticket: mapTicket(Array.isArray(data) ? data[0] : data) });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/admin/couriers", async (req: any, res: any) => {
  try {
    if (!checkAdmin(req.body.password)) return res.status(403).json({ success: false, error: "كلمة المرور غير صحيحة" });
    const data = await db("couriers", "GET", undefined, "order=created_at.desc");
    res.json({ success: true, couriers: data.map(mapCourier) });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/admin/update-status", async (req: any, res: any) => {
  try {
    const { password, courierId, status } = req.body;
    if (!checkAdmin(password)) return res.status(403).json({ success: false, error: "غير مصرح" });
    const data = await db("couriers", "PATCH", { status }, `id=eq.${courierId}`);
    res.json({ success: true, courier: mapCourier(Array.isArray(data) ? data[0] : data) });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/admin/assign-supervisor", async (req: any, res: any) => {
  try {
    const { password, courierId, supervisorId } = req.body;
    if (!checkAdmin(password)) return res.status(403).json({ success: false, error: "غير مصرح" });
    const data = await db("couriers", "PATCH", { supervisor_id: supervisorId }, `id=eq.${courierId}`);
    res.json({ success: true, courier: mapCourier(Array.isArray(data) ? data[0] : data) });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/admin/update-profile", async (req: any, res: any) => {
  try {
    const { password, courierId, nationalId, iban, carPlate, vehicleModel, appCourierCode, activationDate, adminNotes, supervisorId } = req.body;
    if (!checkAdmin(password)) return res.status(403).json({ success: false, error: "غير مصرح" });
    const data = await db("couriers", "PATCH", { national_id: nationalId || "", iban: iban || "", car_plate: carPlate || "", vehicle_model: vehicleModel || "", app_courier_code: appCourierCode || "", activation_date: activationDate || "", admin_notes: adminNotes || "", supervisor_id: supervisorId || "" }, `id=eq.${courierId}`);
    res.json({ success: true, courier: mapCourier(Array.isArray(data) ? data[0] : data) });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/admin/delete-courier", async (req: any, res: any) => {
  try {
    const { password, courierId } = req.body;
    if (!checkAdmin(password)) return res.status(403).json({ success: false, error: "غير مصرح" });
    await db("couriers", "DELETE", undefined, `id=eq.${courierId}`);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/admin/update-app-settings", async (req: any, res: any) => {
  try {
    const { password, id, isAvailable, region, warningMessage } = req.body;
    if (!checkAdmin(password)) return res.status(403).json({ success: false, error: "غير مصرح" });
    const existing = await db("app_settings", "GET", undefined, `id=eq.${id}`).catch(() => []);
    let data;
    if (existing.length > 0) {
      data = await db("app_settings", "PATCH", { is_available: isAvailable, region: region || "مستوى المملكة", warning_message: warningMessage || "" }, `id=eq.${id}`);
    } else {
      data = await db("app_settings", "POST", { id, is_available: isAvailable, region: region || "مستوى المملكة", warning_message: warningMessage || "" });
    }
    res.json({ success: true, setting: Array.isArray(data) ? data[0] : data });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/admin/tickets", async (req: any, res: any) => {
  try {
    if (!checkAdmin(req.body.password)) return res.status(403).json({ success: false, error: "غير مصرح" });
    const data = await db("support_tickets", "GET", undefined, "order=created_at.desc");
    res.json({ success: true, tickets: data.map(mapTicket) });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/admin/tickets/update-status", async (req: any, res: any) => {
  try {
    const { password, ticketId, status } = req.body;
    if (!checkAdmin(password)) return res.status(403).json({ success: false, error: "غير مصرح" });
    const data = await db("support_tickets", "PATCH", { status }, `id=eq.${ticketId}`);
    res.json({ success: true, ticket: mapTicket(Array.isArray(data) ? data[0] : data) });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/admin/supervisors", async (req: any, res: any) => {
  try {
    if (!checkAdmin(req.body.password)) return res.status(403).json({ success: false, error: "غير مصرح" });
    const data = await db("supervisors", "GET", undefined, "order=created_at.asc");
    res.json({ success: true, supervisors: data });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/admin/supervisors/add", async (req: any, res: any) => {
  try {
    const { password, id, name, supervisorPassword, phone } = req.body;
    if (!checkAdmin(password)) return res.status(403).json({ success: false, error: "غير مصرح" });
    if (!id || !name || !supervisorPassword) return res.status(400).json({ success: false, error: "المعرف والاسم وكلمة المرور مطلوبة" });
    const existing = await db("supervisors", "GET", undefined, `id=eq.${id}`);
    if (existing.length > 0) return res.status(409).json({ success: false, error: "المعرف مستخدم مسبقاً" });
    const data = await db("supervisors", "POST", { id, name, password: supervisorPassword, phone: phone || "", is_active: true });
    res.status(201).json({ success: true, supervisor: mapSupervisor(Array.isArray(data) ? data[0] : data) });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/admin/supervisors/update-password", async (req: any, res: any) => {
  try {
    const { password, supervisorId, newPassword } = req.body;
    if (!checkAdmin(password)) return res.status(403).json({ success: false, error: "غير مصرح" });
    await db("supervisors", "PATCH", { password: newPassword }, `id=eq.${supervisorId}`);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/admin/supervisors/toggle", async (req: any, res: any) => {
  try {
    const { password, supervisorId, isActive } = req.body;
    if (!checkAdmin(password)) return res.status(403).json({ success: false, error: "غير مصرح" });
    await db("supervisors", "PATCH", { is_active: isActive }, `id=eq.${supervisorId}`);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

app.get("/api/admin/download-csv", async (req: any, res: any) => {
  try {
    const { auth } = req.query;
    if (!checkAdmin(auth as string)) return res.status(403).send("غير مصرح");
    const couriers = await db("couriers", "GET", undefined, "order=created_at.desc");
    const supervisors = await db("supervisors", "GET").catch(() => []);
    const supMap: Record<string, string> = {};
    supervisors.forEach((s: any) => { supMap[s.id] = s.name; });
    const headers = ["الاسم","الجوال","المدينة","الهوية","التطبيقات","الحالة","المشرف","موعد المقابلة","وقت المقابلة","IBAN","المركبة","اللوحة","كود التطبيق","تاريخ التفعيل","الملاحظات","تاريخ التسجيل"];
    const rows = couriers.map((c: any) => [c.name, c.phone, c.city, c.national_id || "", (c.apps || []).join(" - "), c.status || "جديد", supMap[c.supervisor_id] || "", c.interview_date || "", c.interview_time || "", c.iban || "", c.vehicle_model || "", c.car_plate || "", c.app_courier_code || "", c.activation_date || "", c.admin_notes || "", c.created_at || ""].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="bawariq-couriers-${new Date().toISOString().split("T")[0]}.csv"`);
    res.send(csv);
  } catch (e: any) { res.status(500).send("خطأ في تصدير البيانات"); }
});

app.get("/api/settings", async (req: any, res: any) => {
  try {
    const data = await db("app_settings", "GET").catch(() => []);
    const settings: Record<string, any> = {};
    for (const row of data) { settings[row.id] = row; }
    res.json(settings);
  } catch (e: any) {
    res.json({});
  }
});

app.get("/api/stats", async (req: any, res: any) => {
  try {
    const couriers = await db("couriers", "GET");
    const tickets = await db("support_tickets", "GET").catch(() => []);
    const cities: Record<string, number> = {};
    for (const c of couriers) { cities[c.city] = (cities[c.city] || 0) + 1; }
    res.json({ total: couriers.length, new: couriers.filter((c: any) => c.status === "جديد").length, interviewed: couriers.filter((c: any) => c.status === "تمت المقابلة").length, activated: couriers.filter((c: any) => c.status === "تم التفعيل").length, open_tickets: tickets.filter((t: any) => t.status !== "مغلق").length, cities });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get("*", (req: any, res: any) => {
  res.json({ message: "بوارق الشرق API تعمل ✅", database: "Supabase" });
});

export default app;
