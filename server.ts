import express from "express";
import path from "path";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Supabase Config
const SUPABASE_URL = process.env.SUPABASE_URL || "https://gsvodabvuodhqgozisbq.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzdm9kYWJ2dW9kaHFnb3ppc2JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTY3MjYsImV4cCI6MjA5NTE5MjcyNn0.v_kZqy-bWDtbl8pAGW3qcpNh5JGpiAshbpiY9u3uxWA";

// Helper: Supabase REST API
async function supabase(table: string, method: string, body?: any, query?: string): Promise<any> {
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
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase error: ${err}`);
  }
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
const distPath = path.join(process.cwd(), "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", database: "supabase", timestamp: new Date().toISOString() });
});

// GET all couriers
app.get("/api/couriers", async (req, res) => {
  try {
    const data = await supabase("couriers", "GET", undefined, "order=created_at.desc");
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET single courier
app.get("/api/couriers/:id", async (req, res) => {
  try {
    const data = await supabase("couriers", "GET", undefined, `id=eq.${req.params.id}`);
    if (!data || data.length === 0) return res.status(404).json({ error: "غير موجود" });
    res.json(data[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST: Register new courier
app.post("/api/couriers", async (req, res) => {
  try {
    const body = req.body;
    if (!body.name || !body.phone || !body.city) {
      return res.status(400).json({ error: "الاسم والجوال والمدينة مطلوبة" });
    }
    const existing = await supabase("couriers", "GET", undefined, `phone=eq.${body.phone}`);
    if (existing && existing.length > 0) {
      return res.status(409).json({ error: "رقم الجوال مسجل مسبقاً" });
    }
    const newCourier = {
      name: body.name,
      phone: body.phone,
      city: body.city,
      experience: body.experience || "",
      apps: body.apps || [],
      status: "جديد",
      interview_date: body.interview_date || "",
      interview_time: body.interview_time || "",
      admin_notes: "",
    };
    const data = await supabase("couriers", "POST", newCourier);
    res.status(201).json(Array.isArray(data) ? data[0] : data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH: Update courier
app.patch("/api/couriers/:id", async (req, res) => {
  try {
    const data = await supabase(
      "couriers", "PATCH",
      { ...req.body, updated_at: new Date().toISOString() },
      `id=eq.${req.params.id}`
    );
    res.json(Array.isArray(data) ? data[0] : data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE: courier
app.delete("/api/couriers/:id", async (req, res) => {
  try {
    await supabase("couriers", "DELETE", undefined, `id=eq.${req.params.id}`);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET all tickets
app.get("/api/tickets", async (req, res) => {
  try {
    const data = await supabase("support_tickets", "GET", undefined, "order=created_at.desc");
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST: Create ticket
app.post("/api/tickets", async (req, res) => {
  try {
    const body = req.body;
    const data = await supabase("support_tickets", "POST", {
      courier_name: body.courier_name,
      courier_phone: body.courier_phone,
      category: body.category || "عام",
      subject: body.subject,
      status: "جديد",
      messages: body.messages || [],
    });
    res.status(201).json(Array.isArray(data) ? data[0] : data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH: Update ticket
app.patch("/api/tickets/:id", async (req, res) => {
  try {
    const data = await supabase(
      "support_tickets", "PATCH",
      { ...req.body, updated_at: new Date().toISOString() },
      `id=eq.${req.params.id}`
    );
    res.json(Array.isArray(data) ? data[0] : data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET settings
app.get("/api/settings", async (req, res) => {
  try {
    const data = await supabase("app_settings", "GET");
    const settings: any = {};
    for (const row of data) { settings[row.id] = row; }
    res.json(settings);
  } catch (e: any) {
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

// PATCH: Update setting
app.patch("/api/settings/:id", async (req, res) => {
  try {
    const data = await supabase("app_settings", "PATCH", req.body, `id=eq.${req.params.id}`);
    res.json(Array.isArray(data) ? data[0] : data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET stats
app.get("/api/stats", async (req, res) => {
  try {
    const couriers = await supabase("couriers", "GET");
    const tickets = await supabase("support_tickets", "GET").catch(() => []);
    const cities: any = {};
    for (const c of couriers) { cities[c.city] = (cities[c.city] || 0) + 1; }
    res.json({
      total: couriers.length,
      new: couriers.filter((c: any) => c.status === "جديد").length,
      interviewed: couriers.filter((c: any) => c.status === "تمت المقابلة").length,
      activated: couriers.filter((c: any) => c.status === "تم التفعيل").length,
      open_tickets: tickets.filter((t: any) => t.status !== "مغلق").length,
      cities,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Catch-all
app.get("*", (req, res) => {
  const indexPath = path.join(process.cwd(), "dist", "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({ message: "بوارق الشرق API تعمل ✅", database: "Supabase" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🗄️  Supabase: ${SUPABASE_URL}`);
});

export default app;
