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

// Health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", database: "supabase", timestamp: new Date().toISOString() });
});

// GET couriers
app.get("/api/couriers", async (req, res) => {
  try {
    res.json(await db("couriers", "GET", undefined, "order=created_at.desc"));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET single courier
app.get("/api/couriers/:id", async (req, res) => {
  try {
    const data = await db("couriers", "GET", undefined, `id=eq.${req.params.id}`);
    if (!data.length) return res.status(404).json({ error: "غير موجود" });
    res.json(data[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST courier
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
      status: "جديد", interview_date: b.interview_date || "",
      interview_time: b.interview_time || "", admin_notes: "",
    });
    res.status(201).json(Array.isArray(data) ? data[0] : data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH courier
app.patch("/api/couriers/:id", async (req, res) => {
  try {
    const data = await db("couriers", "PATCH",
      { ...req.body, updated_at: new Date().toISOString() },
      `id=eq.${req.params.id}`);
    res.json(Array.isArray(data) ? data[0] : data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE courier
app.delete("/api/couriers/:id", async (req, res) => {
  try {
    await db("couriers", "DELETE", undefined, `id=eq.${req.params.id}`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET tickets
app.get("/api/tickets", async (req, res) => {
  try {
    res.json(await db("support_tickets", "GET", undefined, "order=created_at.desc"));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST ticket
app.post("/api/tickets", async (req, res) => {
  try {
    const b = req.body;
    const data = await db("support_tickets", "POST", {
      courier_name: b.courier_name, courier_phone: b.courier_phone,
      category: b.category || "عام", subject: b.subject,
      status: "جديد", messages: b.messages || [],
    });
    res.status(201).json(Array.isArray(data) ? data[0] : data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH ticket
app.patch("/api/tickets/:id", async (req, res) => {
  try {
    const data = await db("support_tickets", "PATCH",
      { ...req.body, updated_at: new Date().toISOString() },
      `id=eq.${req.params.id}`);
    res.json(Array.isArray(data) ? data[0] : data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET settings
app.get("/api/settings", async (req, res) => {
  try {
    const data = await db("app_settings", "GET");
    const settings = {};
    for (const row of data) { settings[row.id] = row; }
    res.json(settings);
  } catch (e) {
    res.json({
      hungerstation: { id: "hungerstation", is_available: true, region: "مستوى المملكة" },
      toyou: { id: "toyou", is_available: true, region: "مستوى المملكة" },
      keeta: { id: "keeta", is_available: true, region: "مستوى المملكة" },
      thechefs: { id: "thechefs", is_available: true, region: "مستوى المملكة" },
      mrsool: { id: "mrsool", is_available: true, region: "مستوى المملكة" },
      jahez: { id: "jahez", is_available: true, region: "مستوى المملكة" },
    });
  }
});

// GET stats
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

// Catch-all frontend
app.get("*", (req, res) => {
  const indexPath = path.join(__dirname, "..", "dist", "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({ message: "بوارق الشرق API تعمل ✅", database: "Supabase" });
  }
});

export default app;
