import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDocs, Firestore, deleteDoc } from "firebase/firestore";

const app = express();
const PORT = 3000;

// Enable JSON parsing
app.use(express.json());

// Path to store local backup courier registrations
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "couriers.json");

// Ensure data directory exists early
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Request and Crash Debug Logger
const DEBUG_LOG_FILE = path.join(DATA_DIR, "debug.log");
app.use((req, res, next) => {
  const bodyCopy = { ...req.body };
  if (bodyCopy.password) bodyCopy.password = "******";
  const logMsg = `[${new Date().toISOString()}] ${req.method} ${req.url} - BODY: ${JSON.stringify(bodyCopy)}\n`;
  try {
    fs.appendFileSync(DEBUG_LOG_FILE, logMsg, "utf8");
  } catch (err) {}
  next();
});

// Define interface for Courier
interface Courier {
  id: string;
  name: string;
  phone: string;
  city: string;
  experience: string;
  apps: string[];
  createdAt: string;
  status: "جديد" | "تمت المقابلة" | "تم التفعيل";
  interviewDate?: string;
  interviewTime?: string;
  nationalId?: string;
  iban?: string;
  carPlate?: string;
  vehicleModel?: string;
  appCourierCode?: string;
  activationDate?: string;
  adminNotes?: string;
}

interface SupportMessage {
  id: string;
  sender: "courier" | "admin";
  text: string;
  imageUrl?: string;
  createdAt: string;
}

interface SupportTicket {
  id: string; // T-XXXX
  courierName: string;
  courierPhone: string;
  category: string;
  subject: string;
  status: "جديد" | "قيد المتابعة" | "تم الرد" | "مغلق";
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
}

// Ensure data directory and file backup exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf8");
}

const TICKETS_FILE = path.join(DATA_DIR, "support_tickets.json");
if (!fs.existsSync(TICKETS_FILE)) {
  fs.writeFileSync(TICKETS_FILE, JSON.stringify([], null, 2), "utf8");
}

// Lazy connect to Cloud Firestore (cross-platform client connection using API key)
let firestoreDb: Firestore | null = null;
try {
  const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(firebaseConfigPath)) {
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
    const firebaseApp = initializeApp(config);
    firestoreDb = getFirestore(firebaseApp, config.firestoreDatabaseId);
    console.log(`⚡ Firebase Web Client successfully initiated on server! Project: ${config.projectId}, DB: ${config.firestoreDatabaseId}`);
  } else {
    console.warn("⚠️ No firebase-applet-config.json found. Running on fallback local file database.");
  }
} catch (e) {
  console.warn("⚠️ Firestore native initialization deferred, running on fallback local file database.", e);
}

// Read Support Tickets Helper (From local JSON file)
function readTicketsFile(): SupportTicket[] {
  try {
    if (!fs.existsSync(TICKETS_FILE)) return [];
    const content = fs.readFileSync(TICKETS_FILE, "utf8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading tickets file:", error);
    return [];
  }
}

// Write Support Tickets Helper to file
function writeTicketsFile(tickets: SupportTicket[]) {
  try {
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2), "utf8");
  } catch (error) {
    console.error("Error writing tickets file:", error);
  }
}

// Read Couriers Helper (Tries Firestore, falls back to JSON)
function readCouriersFile(): Courier[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const content = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading couriers file:", error);
    return [];
  }
}

// Write Couriers Helper for physical backup file
function writeCouriersFile(couriers: Courier[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(couriers, null, 2), "utf8");
  } catch (error) {
    console.error("Error writing backup file:", error);
  }
}

async function readAllCouriers(): Promise<Courier[]> {
  if (firestoreDb) {
    try {
      const fetchPromise = (async () => {
        const snap = await getDocs(collection(firestoreDb!, "couriers"));
        const list: Courier[] = [];
        snap.forEach((document) => {
          const data = document.data();
          list.push({
            id: document.id,
            name: data.name || "",
            phone: data.phone || "",
            city: data.city || "",
            experience: data.experience || "",
            apps: data.apps || [],
            createdAt: data.createdAt || new Date().toISOString(),
            status: data.status || "جديد",
            interviewDate: data.interviewDate,
            interviewTime: data.interviewTime,
            nationalId: data.nationalId || "",
            iban: data.iban || "",
            carPlate: data.carPlate || "",
            vehicleModel: data.vehicleModel || "",
            appCourierCode: data.appCourierCode || "",
            activationDate: data.activationDate || "",
            adminNotes: data.adminNotes || "",
          } as Courier);
        });
        writeCouriersFile(list);
        return list;
      })();

      // Prevent database connection failure from hanging the client's request
      return await Promise.race([
        fetchPromise,
        new Promise<Courier[]>((resolve) => {
          setTimeout(() => {
            console.warn("⏰ Firestore courier fetch timed out. Falling back to local file JSON database.");
            resolve(readCouriersFile());
          }, 1500);
        })
      ]);
    } catch (error) {
      console.warn("Firestore collection fetch failed, querying local JSON fallback.", error);
      return readCouriersFile();
    }
  }
  return readCouriersFile();
}

async function saveCourier(courier: Courier) {
  // 1. Write to local memory/disk immediately so data is secure and persisted instantly
  const localList = readCouriersFile();
  const index = localList.findIndex((c) => c.id === courier.id);
  if (index !== -1) {
    localList[index] = courier;
  } else {
    localList.push(courier);
  }
  writeCouriersFile(localList);

  // 2. Write to Firestore permanently
  if (firestoreDb) {
    try {
      await Promise.race([
        setDoc(doc(firestoreDb!, "couriers", courier.id), {
          name: courier.name,
          phone: courier.phone,
          city: courier.city,
          experience: courier.experience,
          apps: courier.apps,
          createdAt: courier.createdAt,
          status: courier.status,
          interviewDate: courier.interviewDate || "",
          interviewTime: courier.interviewTime || "",
          nationalId: courier.nationalId || "",
          iban: courier.iban || "",
          carPlate: courier.carPlate || "",
          vehicleModel: courier.vehicleModel || "",
          appCourierCode: courier.appCourierCode || "",
          activationDate: courier.activationDate || "",
          adminNotes: courier.adminNotes || "",
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 4000))
      ]);
      console.log(`Document ${courier.id} successfully synchronized to Cloud Firestore.`);
    } catch (e) {
      console.warn("Failed to synchronize to Firestore, stored locally.", e);
    }
  }
}

async function deleteCourier(id: string) {
  // 1. Delete from local JSON file
  const localList = readCouriersFile();
  const filtered = localList.filter((c) => c.id !== id);
  writeCouriersFile(filtered);

  // 2. Delete from Firestore
  if (firestoreDb) {
    try {
      await Promise.race([
        deleteDoc(doc(firestoreDb!, "couriers", id)),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 4000))
      ]);
      console.log(`Document ${id} successfully deleted from Cloud Firestore.`);
    } catch (e) {
      console.warn("Failed to delete document from Firestore.", e);
    }
  }
}

async function readAllTickets(): Promise<SupportTicket[]> {
  if (firestoreDb) {
    try {
      const fetchPromise = (async () => {
        const snap = await getDocs(collection(firestoreDb!, "support_tickets"));
        const list: SupportTicket[] = [];
        snap.forEach((document) => {
          const data = document.data();
          list.push({
            id: document.id,
            courierName: data.courierName || "",
            courierPhone: data.courierPhone || "",
            category: data.category || "",
            subject: data.subject || "",
            status: data.status || "جديد",
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
            messages: data.messages || [],
          });
        });
        writeTicketsFile(list);
        return list;
      })();

      // Prevent database connection failure from hanging tickets retrieval
      return await Promise.race([
        fetchPromise,
        new Promise<SupportTicket[]>((resolve) => {
          setTimeout(() => {
            console.warn("⏰ Firestore tickets fetch timed out. Falling back to local tickets database.");
            resolve(readTicketsFile());
          }, 1500);
        })
      ]);
    } catch (error) {
      console.warn("Firestore support collection fetch failed, querying local fallback.", error);
      return readTicketsFile();
    }
  }
  return readTicketsFile();
}

async function saveSupportTicket(ticket: SupportTicket) {
  // 1. Local backup
  const localList = readTicketsFile();
  const index = localList.findIndex((t) => t.id === ticket.id);
  if (index !== -1) {
    localList[index] = ticket;
  } else {
    localList.push(ticket);
  }
  writeTicketsFile(localList);

  // 2. Synchronize to Firestore
  if (firestoreDb) {
    try {
      await Promise.race([
        setDoc(doc(firestoreDb!, "support_tickets", ticket.id), {
          courierName: ticket.courierName,
          courierPhone: ticket.courierPhone,
          category: ticket.category,
          subject: ticket.subject,
          status: ticket.status,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt,
          messages: ticket.messages,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 4000))
      ]);
      console.log(`Support ticket ${ticket.id} synchronized to Firestore.`);
    } catch (e) {
      console.warn("Failed to sync ticket to Firestore:", e);
    }
  }
}

// API Routes

// 1. Register a courier
app.post("/api/register", async (req, res) => {
  try {
    const { name, phone, city, experience, apps, nationalId } = req.body;

    if (!name || !phone || !city) {
      return res.status(400).json({ error: "الرجاء تعبئة جميع الحقول المطلوبة (الاسم، الجوال، المدينة)" });
    }

    const id = Date.now().toString() + Math.random().toString(36).substring(2, 7);
    
    const newCourier: Courier = {
      id,
      name,
      phone,
      city,
      experience: experience || "لا توجد خبرات سابقة",
      apps: Array.isArray(apps) ? apps : [],
      createdAt: new Date().toISOString(),
      status: "جديد", // Default status
      nationalId: nationalId || "",
    };

    await saveCourier(newCourier);

    res.json({ success: true, courierId: id });
  } catch (error: any) {
    res.status(500).json({ error: "فشل حفظ البيانات: " + error.message });
  }
});

// 2. Schedule interview
app.post("/api/schedule", async (req, res) => {
  try {
    const { courierId, interviewDate, interviewTime } = req.body;

    if (!courierId || !interviewDate || !interviewTime) {
      return res.status(400).json({ error: "الرجاء تحديد موعد وتاريخ المقابلة" });
    }

    const couriers = await readAllCouriers();
    const index = couriers.findIndex((c) => c.id === courierId);

    if (index === -1) {
      return res.status(404).json({ error: "طلب التقديم غير موجود" });
    }

    couriers[index].interviewDate = interviewDate;
    couriers[index].interviewTime = interviewTime;
    
    await saveCourier(couriers[index]);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "فشل جدولة الموعد: " + error.message });
  }
});

// 2.5 Get courier by id (for remote client-side status tracking / updates)
app.get("/api/couriers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const couriers = await readAllCouriers();
    const courier = couriers.find((c) => c.id === id);

    if (!courier) {
      return res.status(404).json({ error: "طلب التقديم غير موجود" });
    }

    res.json({ success: true, courier });
  } catch (error: any) {
    res.status(500).json({ error: "فشل جلب الملف: " + error.message });
  }
});

// 3. Admin: Get all couriers list (hidden page helper API)
app.post("/api/admin/couriers", async (req, res) => {
  try {
    const couriers = await readAllCouriers();
    // Sort by newest registered
    const sorted = [...couriers].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json({ success: true, couriers: sorted });
  } catch (e: any) {
    console.error("Crash avoided in admin couriers endpoint. Returning local fallback list.", e);
    const fallbackList = readCouriersFile();
    const sorted = [...fallbackList].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json({ success: true, couriers: sorted });
  }
});

// 4. Admin Download Excel compatible CSV
app.get("/api/admin/download-csv", async (req, res) => {
  try {
    const { auth } = req.query;

    const couriers = await readAllCouriers();
    const sorted = [...couriers].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Define headers in Arabic
    const headers = [
      "معرّف الطلب",
      "الاسم الكامل",
      "رقم الجوال",
      "المدينة / مكان التواجد",
      "التطبيقات المراد العمل عليها",
      "الخبرات السابقة",
      "الحالة الحالية",
      "تاريخ التقديم",
      "تاريخ المقابلة المختار",
      "توقيت المقابلة المختار",
      "رقم الهوية / الإقامة",
      "رقم الآيبان البنكي (IBAN)",
      "رقم لوحة المركبة",
      "نوع وموديل المركبة",
      "كود المندوب بالبرامج",
      "تاريخ تفعيل الحساب",
      "ملاحظات الإدارة والتشغيل"
    ];

    // Map data to CSV rows
    const csvRows = [headers.join(",")];

    for (const c of sorted) {
      const appStr = c.apps && c.apps.length ? c.apps.join(" - ") : "جميع التطبيقات";
      const escapeCsv = (str: string) => {
        if (!str) return '""';
        const clean = str.replace(/"/g, '""');
        return `"${clean}"`;
      };

      const row = [
        escapeCsv(c.id),
        escapeCsv(c.name),
        escapeCsv(c.phone),
        escapeCsv(c.city),
        escapeCsv(appStr),
        escapeCsv(c.experience),
        escapeCsv(c.status || "جديد"),
        escapeCsv(new Date(c.createdAt).toLocaleDateString("ar-SA") + " " + new Date(c.createdAt).toLocaleTimeString("ar-SA")),
        escapeCsv(c.interviewDate || "لم يحدد بعد"),
        escapeCsv(c.interviewTime || "لم يحدد بعد"),
        escapeCsv(c.nationalId || "غير متوفر"),
        escapeCsv(c.iban || "غير متوفر"),
        escapeCsv(c.carPlate || "غير متوفر"),
        escapeCsv(c.vehicleModel || "غير متوفر"),
        escapeCsv(c.appCourierCode || "غير متوفر"),
        escapeCsv(c.activationDate || "غير متوفر"),
        escapeCsv(c.adminNotes || "لا توجد ملاحظات")
      ];
      csvRows.push(row.join(","));
    }

    // Join rows
    const csvContent = csvRows.join("\n");
    
    // Add UTF-8 BOM so Microsoft Excel can read Arabic characters correctly!
    const bom = Buffer.from("\uFEFF", "utf-8");
    const payload = Buffer.concat([bom, Buffer.from(csvContent, "utf-8")]);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="Bawariq_Logistics_Couriers_${new Date().toISOString().split('T')[0]}.csv"`);
    res.status(200).send(payload);
  } catch (error: any) {
    res.status(500).send("حدث خطأ أثناء تحميل الكشف: " + error.message);
  }
});

// 5. Admin: Update courier status (e.g. "جديد" | "تمت المقابلة" | "تم التفعيل")
app.post("/api/admin/update-status", async (req, res) => {
  try {
    const { password, courierId, status } = req.body;

    if (!courierId || !status) {
      return res.status(400).json({ error: "الرجاء توفير معرّف المندوب والحالة المطلوبة" });
    }

    const couriers = await readAllCouriers();
    const index = couriers.findIndex((c) => c.id === courierId);

    if (index === -1) {
      return res.status(404).json({ error: "المندوب المطلوب غير موجود" });
    }

    couriers[index].status = status;
    
    // Automatically fill activation date if updated to activated
    if (status === "تم التفعيل" && !couriers[index].activationDate) {
      couriers[index].activationDate = new Date().toLocaleDateString("ar-SA");
    }

    await saveCourier(couriers[index]);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "فشل تحديث الحالة: " + error.message });
  }
});

// 6. Admin: Complete/Update Activated Courier Complete Profile info
app.post("/api/admin/update-profile", async (req, res) => {
  try {
    const { 
      password, 
      courierId, 
      nationalId, 
      iban, 
      carPlate, 
      vehicleModel, 
      appCourierCode, 
      activationDate, 
      adminNotes 
    } = req.body;

    if (!courierId) {
      return res.status(400).json({ error: "يجب تحديد معرّف المندوب المطلوب" });
    }

    const couriers = await readAllCouriers();
    const index = couriers.findIndex((c) => c.id === courierId);

    if (index === -1) {
      return res.status(404).json({ error: "الملف التشغيلي للمندوب غير موجود" });
    }

    // Apply properties
    if (nationalId !== undefined) couriers[index].nationalId = nationalId;
    if (iban !== undefined) couriers[index].iban = iban;
    if (carPlate !== undefined) couriers[index].carPlate = carPlate;
    if (vehicleModel !== undefined) couriers[index].vehicleModel = vehicleModel;
    if (appCourierCode !== undefined) couriers[index].appCourierCode = appCourierCode;
    if (activationDate !== undefined) couriers[index].activationDate = activationDate;
    if (adminNotes !== undefined) couriers[index].adminNotes = adminNotes;

    await saveCourier(couriers[index]);

    res.json({ success: true, courier: couriers[index] });
  } catch (error: any) {
    res.status(500).json({ error: "فشل حفظ الملف التشغيلي الكامل: " + error.message });
  }
});

// 6.5 Admin: Delete courier profile physically
app.post("/api/admin/delete-courier", async (req, res) => {
  try {
    const { password, courierId } = req.body;
    
    if (!courierId) {
      return res.status(400).json({ error: "يجب تحديد معرّف المندوب المطلوب حذفه" });
    }

    const couriers = await readAllCouriers();
    const index = couriers.findIndex((c) => c.id === courierId);

    if (index === -1) {
      return res.status(404).json({ error: "الملف التشغيلي غير موجود بالفعل" });
    }

    await deleteCourier(courierId);

    res.json({ success: true, message: "تم حذف المندوب بنجاح" });
  } catch (error: any) {
    res.status(500).json({ error: "فشل حذف المندوب: " + error.message });
  }
});

// === Support Ticket APIs ===

// 7. Create Support Ticket
app.post("/api/support/tickets", async (req, res) => {
  try {
    const { name, phone, category, subject, message, imageUrl } = req.body;

    if (!name || !phone || !category || !subject || !message) {
      return res.status(400).json({ error: "الرجاء توفير جميع البيانات المطلوبة لفتح التذكرة" });
    }

    const ticketId = "T-" + Math.floor(100000 + Math.random() * 900000);
    const dateStr = new Date().toISOString();

    const newTicket: SupportTicket = {
      id: ticketId,
      courierName: name,
      courierPhone: phone,
      category,
      subject,
      status: "جديد",
      createdAt: dateStr,
      updatedAt: dateStr,
      messages: [
        {
          id: "m-" + Date.now().toString(),
          sender: "courier",
          text: message,
          imageUrl: imageUrl || undefined,
          createdAt: dateStr
        }
      ]
    };

    await saveSupportTicket(newTicket);
    res.json({ success: true, ticket: newTicket });
  } catch (error: any) {
    res.status(500).json({ error: "فشل فتح تذكرة الدعم الفني: " + error.message });
  }
});

// 8. Search Tickets by Phone Number
app.post("/api/support/search", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: "الرجاء إدخال رقم الجوال للبحث عن التذاكر" });
    }

    const tickets = await readAllTickets();
    const matched = tickets.filter(t => t.courierPhone === phone || t.courierPhone.replace(/^0/, "") === phone.replace(/^0/, ""));
    res.json({ success: true, tickets: matched });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Get Single Ticket
app.get("/api/support/tickets/:ticketId", async (req, res) => {
  try {
    const { ticketId } = req.params;
    const tickets = await readAllTickets();
    const ticket = tickets.find(t => t.id === ticketId);

    if (!ticket) {
      return res.status(404).json({ error: "التذكرة المطلوبة غير موجودة" });
    }
    res.json({ success: true, ticket });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Send Message inside Ticket
app.post("/api/support/tickets/:ticketId/messages", async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { sender, text, imageUrl } = req.body;

    if (!text && !imageUrl) {
      return res.status(400).json({ error: "الرجاء كتابة نص الرسالة أو إرفاق صورة" });
    }

    if (!sender) {
      return res.status(400).json({ error: "المرسل مفقود في الطلب" });
    }

    const tickets = await readAllTickets();
    const index = tickets.findIndex(t => t.id === ticketId);

    if (index === -1) {
      return res.status(404).json({ error: "التذكرة غير موجودة" });
    }

    const nowStr = new Date().toISOString();
    const newMessage: SupportMessage = {
      id: "m-" + Date.now().toString() + Math.random().toString(36).substring(2, 5),
      sender,
      text: text || "",
      imageUrl: imageUrl || undefined,
      createdAt: nowStr
    };

    tickets[index].messages.push(newMessage);
    tickets[index].updatedAt = nowStr;

    // Smart status changing
    if (sender === "admin") {
      tickets[index].status = "تم الرد";
    } else {
      tickets[index].status = "قيد المتابعة";
    }

    await saveSupportTicket(tickets[index]);
    res.json({ success: true, ticket: tickets[index] });
  } catch (error: any) {
    res.status(500).json({ error: "تفاصيل خطأ الإرسال: " + error.message });
  }
});

// 11. Admin: List all tickets
app.post("/api/admin/tickets", async (req, res) => {
  try {
    const tickets = await readAllTickets();
    const sorted = [...tickets].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return res.json({ success: true, tickets: sorted });
  } catch (error: any) {
    console.error("Crash avoided in admin tickets list. Returning local fallback tickets.", error);
    const fallbackTickets = readTicketsFile();
    const sorted = [...fallbackTickets].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return res.json({ success: true, tickets: sorted });
  }
});

// 12. Admin: Update Ticket Status (Mute/Close)
app.post("/api/admin/tickets/update-status", async (req, res) => {
  try {
    const { password, ticketId, status } = req.body;

    const tickets = await readAllTickets();
    const index = tickets.findIndex(t => t.id === ticketId);

    if (index === -1) {
      return res.status(404).json({ error: "التذكرة لم تكن موجودة بقاعدة البيانات" });
    }

    tickets[index].status = status;
    tickets[index].updatedAt = new Date().toISOString();

    await saveSupportTicket(tickets[index]);
    res.json({ success: true, ticket: tickets[index] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Global JSON error handler to catch body-parser errors or other crashes
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errMsg = `[ERROR] [${new Date().toISOString()}] ${req.method} ${req.url} - Error: ${err.message}\nStack: ${err.stack}\n\n`;
  try {
    fs.appendFileSync(path.join(process.cwd(), "data", "debug.log"), errMsg, "utf8");
  } catch (logErr) {}
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "حدث خطأ داخلي في الخادم. الرجاء المحاولة مجدداً."
  });
});

async function start() {
  // If running in Vercel Serverless environment, don't boot standalone listeners
  if (process.env.VERCEL === "1") {
    console.log("⚡ Running on Vercel Serverless Environment. Standalone listeners bypassed.");
    return;
  }

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

start();

export default app;
