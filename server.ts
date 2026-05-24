import express from "express";
import path from "path";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL || "https://gsvodabvuodhqgozisbq.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzdm9kYWJ2dW9kaHFnb3ppc2JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTY3MjYsImV4cCI6MjA5NTE5MjcyNn0.v_kZqy-bWDtbl8pAGW3qcpNh5JGpiAshbpiY9u3uxWA";

const supabaseHeaders = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  "Prefer": "return=representation"
};

async function supabaseQuery(
  table: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: any,
  filters?: string
): Promise<any> {
  const url = `${SUPABASE_URL}/rest/v1/${table}${filters ? "?" + filters : ""}`;
  const response = await fetch(url, {
    method,
    headers: supabaseHeaders,
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase error (${response.status}): ${error}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

const distPath = path.join(process.cwd(), "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// 1. تسجيل مندوب جديد
app.post("/api/register", async (req, res) => {
  try {
    const { name, phone, city, experience, apps, nationalId } = req.body;

    if (!name || !phone || !city) {
      return res.status(400).json({ error: "الرجاء تعبئة جميع الحقول المطلوبة (الاسم، الجوال، المدينة)" });
    }

    const id = Date.now().toString() + Math.random().toString(36).substring(2, 7);

    const newCourier = {
      id,
      name,
      phone,
      city,
      experience: experience || "لا توجد خبرات سابقة",
      apps: Array.isArray(apps) ? apps : [],
      created_at: new Date().toISOString(),
      status: "جديد",
      national_id: nationalId || "",
      iban: "",
      car_plate: "",
      vehicle_model: "",
      app_courier_code: "",
      activation_date: "",
      admin_notes: ""
    };

    await supabaseQuery("couriers", "POST", newCourier);
    res.json({ success: true, courierId: id });
  } catch (error: any) {
    console.error("Register error:", error.message);
    res.status(500).json({ error: "فشل حفظ البيانات: " + error.message });
  }
});

// 2. جدولة موعد مقابلة
app.post("/api/schedule", async (req, res) => {
  try {
    const { courierId, interviewDate, interviewTime } = req.body;

    if (!courierId || !interviewDate || !interviewTime) {
      return res.status(400).json({ error: "الرجاء تحديد موعد وتاريخ المقابلة" });
    }

    const result = await supabaseQuery(
      "couriers",
      "PATCH",
      { interview_date: interviewDate, interview_time: interviewTime },
      `id=eq.${courierId}`
    );

    if (!result || result.length === 0) {
      return res.status(404).json({ error: "طلب التقديم غير موجود" });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("Schedule error:", error.message);
    res.status(500).json({ error: "فشل جدولة الموعد: " + error.message });
  }
});

// 3. جلب مندوب بالمعرف
app.get("/api/couriers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await supabaseQuery("couriers", "GET", undefined, `id=eq.${id}`);

    if (!result || result.length === 0) {
      return res.status(404).json({ error: "طلب التقديم غير موجود" });
    }

    res.json({ success: true, courier: result[0] });
  } catch (error: any) {
    res.status(500).json({ error: "فشل جلب الملف: " + error.message });
  }
});

// 4. البحث عن مندوب بالجوال أو الهوية
app.post("/api/couriers/lookup", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "الرجاء إدخال رقم الجوال أو رقم الهوية للاستعلام" });
    }

    const cleanQuery = query.replace(/\s+/g, "").trim();

    let result = await supabaseQuery("couriers", "GET", undefined, `phone=ilike.*${cleanQuery}*`);

    if (!result || result.length === 0) {
      result = await supabaseQuery("couriers", "GET", undefined, `national_id=ilike.*${cleanQuery}*`);
    }

    if (!result || result.length === 0) {
      return res.status(404).json({ error: "لم نجد أي طلب تقديم مسجل بهذا الرقم." });
    }

    res.json({ success: true, courier: result[0] });
  } catch (error: any) {
    res.status(500).json({ error: "فشل الاستعلام: " + error.message });
  }
});

// 5. جلب تطبيقات التوصيل
app.get("/api/delivery-apps", async (req, res) => {
  try {
    const settings = await supabaseQuery("app_settings", "GET");

    const settingsMap: Record<string, any> = {};
    if (settings) {
      for (const s of settings) {
        settingsMap[s.id] = s;
      }
    }

    const staticApps = [
      { id: "hungerstation", name: "هنقرستيشن (Hungerstation)", desc: "برنامج بوارق الحصري لربط حسابات هنقرستيشن مباشرة وتوزيع الطلبات بنسب تشغيلية مريحة.", logo: "🚚", color: "from-amber-500 to-amber-600" },
      { id: "toyou", name: "تويو (ToYou)", desc: "تفعيل مباشر لكود كابتن تويو على مستوى المملكة مع دعم فني أسبوعي متكامل.", logo: "⚡", color: "from-cyan-400 to-cyan-500" },
      { id: "keeta", name: "كيتا (Keeta)", desc: "الانضمام لبرنامج كابتن كيتا المعتمد بامتيازات وحوافز وحصانة من الغرامات لشركاء بوارق.", logo: "📦", color: "from-emerald-400 to-emerald-500" },
      { id: "thechefs", name: "ذا شفز (The Chefs)", desc: "توزيع وجبات وحلويات فاخرة بمناطق تشغيلية ممتازة ومعدلات ربح مميزة.", logo: "🧁", color: "from-purple-400 to-pink-500" },
      { id: "mrsool", name: "مرسول (Mrsool)", desc: "عمل مرن وحر للغاية لتوصيل أي شيء في أي وقت لأكثر من 5 ملايين مستخدم نشط بالمملكة.", logo: "🦅", color: "from-blue-400 to-indigo-500" },
      { id: "jahez", name: "جاهز (Jahez)", desc: "الكود الأكثر طلباً، تفعيل مباشر مع بوارق الشرق وحقائب حرارية مطابقة للمواصفات ونسبة عمولة ثابتة ومنافسة.", logo: "🎯", color: "from-rose-400 to-orange-500" }
    ];

    const mergedApps = staticApps.map((app) => {
      const override = settingsMap[app.id] || { is_available: true, region: "مستوى المملكة", warning_message: "" };
      return {
        ...app,
        isAvailable: override.is_available,
        region: override.region || "مستوى المملكة",
        warningMessage: override.warning_message || ""
      };
    });

    res.json({ success: true, apps: mergedApps });
  } catch (error: any) {
    res.status(500).json({ error: "فشل جلب تطبيقات التوصيل: " + error.message });
  }
});

// 6. تحديث إعدادات تطبيق
app.post("/api/admin/update-app-settings", async (req, res) => {
  try {
    const { password, id, isAvailable, region, warningMessage } = req.body;

    if (password !== "bawariq2026") {
      return res.status(403).json({ error: "الرمز السري غير صحيح" });
    }

    if (!id) {
      return res.status(400).json({ error: "الرجاء تحديد معرف التطبيق" });
    }

    const data = {
      is_available: isAvailable !== undefined ? isAvailable : true,
      region: region || "مستوى المملكة",
      warning_message: warningMessage || ""
    };

    await supabaseQuery("app_settings", "PATCH", data, `id=eq.${id}`);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "فشل تحديث الإعدادات: " + error.message });
  }
});

// 7. لوحة الإدارة - جلب جميع المندوبين
app.post("/api/admin/couriers", async (req, res) => {
  try {
    const result = await supabaseQuery("couriers", "GET", undefined, "order=created_at.desc");
    res.json({ success: true, couriers: result || [] });
  } catch (error: any) {
    res.status(500).json({ error: "فشل جلب قائمة المندوبين: " + error.message });
  }
});

// 8. تحميل CSV
app.get("/api/admin/download-csv", async (req, res) => {
  try {
    const couriers = await supabaseQuery("couriers", "GET", undefined, "order=created_at.desc");
    const sorted = couriers || [];

    const headers = [
      "معرّف الطلب", "الاسم الكامل", "رقم الجوال", "المدينة",
      "التطبيقات", "الخبرات", "الحالة", "تاريخ التقديم",
      "تاريخ المقابلة", "توقيت المقابلة", "رقم الهوية",
      "رقم الآيبان", "لوحة المركبة", "نوع المركبة",
      "كود المندوب", "تاريخ التفعيل", "ملاحظات الإدارة"
    ];

    const escapeCsv = (str: string) => {
      if (!str) return '""';
      return `"${str.replace(/"/g, '""')}"`;
    };

    const csvRows = [headers.join(",")];
    for (const c of sorted) {
      const appStr = c.apps && c.apps.length ? c.apps.join(" - ") : "جميع التطبيقات";
      const row = [
        escapeCsv(c.id), escapeCsv(c.name), escapeCsv(c.phone), escapeCsv(c.city),
        escapeCsv(appStr), escapeCsv(c.experience), escapeCsv(c.status || "جديد"),
        escapeCsv(new Date(c.created_at).toLocaleDateString("ar-SA")),
        escapeCsv(c.interview_date || "لم يحدد بعد"), escapeCsv(c.interview_time || "لم يحدد بعد"),
        escapeCsv(c.national_id || "غير متوفر"), escapeCsv(c.iban || "غير متوفر"),
        escapeCsv(c.car_plate || "غير متوفر"), escapeCsv(c.vehicle_model || "غير متوفر"),
        escapeCsv(c.app_courier_code || "غير متوفر"), escapeCsv(c.activation_date || "غير متوفر"),
        escapeCsv(c.admin_notes || "لا توجد ملاحظات")
      ];
      csvRows.push(row.join(","));
    }

    const bom = Buffer.from("\uFEFF", "utf-8");
    const payload = Buffer.concat([bom, Buffer.from(csvRows.join("\n"), "utf-8")]);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="Bawariq_Couriers_${new Date().toISOString().split("T")[0]}.csv"`);
    res.status(200).send(payload);
  } catch (error: any) {
    res.status(500).send("حدث خطأ: " + error.message);
  }
});

// 9. تحديث حالة مندوب
app.post("/api/admin/update-status", async (req, res) => {
  try {
    const { courierId, status } = req.body;

    if (!courierId || !status) {
      return res.status(400).json({ error: "الرجاء توفير معرّف المندوب والحالة" });
    }

    const updateData: any = { status };
    if (status === "تم التفعيل") {
      updateData.activation_date = new Date().toLocaleDateString("ar-SA");
    }

    const result = await supabaseQuery("couriers", "PATCH", updateData, `id=eq.${courierId}`);

    if (!result || result.length === 0) {
      return res.status(404).json({ error: "المندوب غير موجود" });
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "فشل تحديث الحالة: " + error.message });
  }
});

// 10. تحديث بيانات مندوب
app.post("/api/admin/update-courier", async (req, res) => {
  try {
    const { password, courierId, ...updateFields } = req.body;

    if (password !== "bawariq2026") {
      return res.status(403).json({ error: "كلمة المرور غير صحيحة" });
    }

    if (!courierId) {
      return res.status(400).json({ error: "معرّف المندوب مطلوب" });
    }

    await supabaseQuery("couriers", "PATCH", updateFields, `id=eq.${courierId}`);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "فشل تحديث البيانات: " + error.message });
  }
});

// 11. حذف مندوب
app.delete("/api/admin/couriers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await supabaseQuery("couriers", "DELETE", undefined, `id=eq.${id}`);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "فشل حذف المندوب: " + error.message });
  }
});

// 12. إنشاء تذكرة دعم
app.post("/api/support/create", async (req, res) => {
  try {
    const { courierName, courierPhone, category, subject, message } = req.body;

    if (!courierName || !courierPhone || !category || !subject) {
      return res.status(400).json({ error: "جميع الحقول مطلوبة" });
    }

    const id = `T-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const newTicket = {
      id,
      courier_name: courierName,
      courier_phone: courierPhone,
      category,
      subject,
      status: "جديد",
      created_at: now,
      updated_at: now,
      messages: [{ id: Date.now().toString(), sender: "courier", text: message || subject, createdAt: now }]
    };

    await supabaseQuery("support_tickets", "POST", newTicket);
    res.json({ success: true, ticketId: id });
  } catch (error: any) {
    res.status(500).json({ error: "فشل إنشاء التذكرة: " + error.message });
  }
});

// 13. جلب تذكرة بالمعرف
app.get("/api/support/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await supabaseQuery("support_tickets", "GET", undefined, `id=eq.${id}`);

    if (!result || result.length === 0) {
      return res.status(404).json({ error: "التذكرة غير موجودة" });
    }

    res.json({ success: true, ticket: result[0] });
  } catch (error: any) {
    res.status(500).json({ error: "فشل جلب التذكرة: " + error.message });
  }
});

// 14. جلب جميع التذاكر
app.post("/api/admin/tickets", async (req, res) => {
  try {
    const result = await supabaseQuery("support_tickets", "GET", undefined, "order=created_at.desc");
    res.json({ success: true, tickets: result || [] });
  } catch (error: any) {
    res.status(500).json({ error: "فشل جلب التذاكر: " + error.message });
  }
});

// Catch-all للـ frontend
app.get("*", (req, res) => {
  const indexPath = path.join(process.cwd(), "dist", "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("الصفحة غير موجودة");
  }
});

app.listen(PORT, () => {
  console.log(`✅ بوارق الشرق - Server running on port ${PORT}`);
  console.log(`🗄️  Supabase: ${SUPABASE_URL}`);
});

export default app;
