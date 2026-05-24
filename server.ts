import express from "express";
import path from "path";
import fs from "fs";
import { Firestore } from "@google-cloud/firestore";

const app = express();
const PORT = 3000;

// Enable JSON parsing
app.use(express.json());

// Detect writeable data directory dynamically (use /tmp in production/serverless)
let DATA_DIR = "/tmp";
if (process.env.NODE_ENV !== "production") {
  DATA_DIR = path.join(process.cwd(), "data");
}

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  DATA_DIR = "/tmp";
}

const DATA_FILE = path.join(DATA_DIR, "couriers.json");
const TICKETS_FILE = path.join(DATA_DIR, "support_tickets.json");
const DEBUG_LOG_FILE = path.join(DATA_DIR, "debug.log");

// Seed/Copy from read-only application data folder to writable folder if needed
try {
  const seedCouriersPath = path.join(process.cwd(), "data", "couriers.json");
  const seedTicketsPath = path.join(process.cwd(), "data", "support_tickets.json");

  if (!fs.existsSync(DATA_FILE)) {
    if (fs.existsSync(seedCouriersPath)) {
      fs.copyFileSync(seedCouriersPath, DATA_FILE);
    } else {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf8");
    }
  }

  if (!fs.existsSync(TICKETS_FILE)) {
    if (fs.existsSync(seedTicketsPath)) {
      fs.copyFileSync(seedTicketsPath, TICKETS_FILE);
    } else {
      fs.writeFileSync(TICKETS_FILE, JSON.stringify([], null, 2), "utf8");
    }
  }
} catch (e) {
  console.warn("⚠️ DATA_DIR seeding/copying had a warning:", e);
}

// Request and Crash Debug Logger
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

// Map Firestore Typed Fields recursively for REST API serialization
function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (typeof val === "boolean") {
    return { booleanValue: val };
  }
  if (typeof val === "number") {
    if (Number.isInteger(val)) {
      return { integerValue: String(val) };
    }
    return { doubleValue: val };
  }
  if (typeof val === "string") {
    return { stringValue: val };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(toFirestoreValue)
      }
    };
  }
  if (typeof val === "object") {
    const fields: any = {};
    for (const k of Object.keys(val)) {
      fields[k] = toFirestoreValue(val[k]);
    }
    return {
      mapValue: {
        fields
      }
    };
  }
  return { stringValue: String(val) };
}

// Parse Firestore Typed Fields recursively for REST API deserialization
function fromFirestoreValue(fVal: any): any {
  if (!fVal) return null;
  if ("nullValue" in fVal) return null;
  if ("booleanValue" in fVal) return fVal.booleanValue;
  if ("integerValue" in fVal) return parseInt(fVal.integerValue, 10);
  if ("doubleValue" in fVal) return fVal.doubleValue;
  if ("stringValue" in fVal) return fVal.stringValue;
  if ("arrayValue" in fVal) {
    const values = fVal.arrayValue.values || [];
    return values.map(fromFirestoreValue);
  }
  if ("mapValue" in fVal) {
    const fields = fVal.mapValue.fields || {};
    const res: any = {};
    for (const k of Object.keys(fields)) {
      res[k] = fromFirestoreValue(fields[k]);
    }
    return res;
  }
  return null;
}

// Config Firestore Rest Credentials
let firestoreRest: {
  projectId: string;
  databaseId: string;
  apiKey: string;
} | null = null;

let firestoreClient: Firestore | null = null;

try {
  const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(firebaseConfigPath)) {
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
    firestoreRest = {
      projectId: config.projectId,
      databaseId: config.firestoreDatabaseId || "(default)",
      apiKey: config.apiKey
    };
    console.log(`⚡ Firestore REST Client configured. Project: ${config.projectId}, DB: ${config.firestoreDatabaseId}`);

    firestoreClient = new Firestore({
      projectId: config.projectId,
      databaseId: config.firestoreDatabaseId || "(default)"
    });
    console.log(`⚡ Native Firestore Client initialized for project ${config.projectId}, DB: ${config.firestoreDatabaseId}`);
  } else {
    firestoreClient = new Firestore();
    console.log("⚡ Native Firestore Client initialized with default credentials.");
    console.warn("⚠️ No firebase-applet-config.json found. Running on fallback local file database.");
  }
} catch (e: any) {
  console.warn("⚠️ Firestore Client / REST initialization deferred, running on fallback local file database:", e.message);
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

// Custom fast HTTP fetcher with abort timeout to avoid hanging serverless threads
async function fetchWithTimeout(url: string, options: any = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

// Highly reliable Firestore REST client request execution wrapper with auto-fallbacks
async function callFirestoreREST(
  collectionPath: string,
  method: "POST" | "PATCH" | "DELETE" | "GET",
  body: any,
  subPathSuffix: string = "" // e.g. ":runQuery" or "/someDocumentId"
): Promise<any> {
  if (!firestoreRest) {
    throw new Error("Firestore REST client not configured");
  }

  const { projectId, databaseId, apiKey } = firestoreRest;

  // Let's check status-safe response body parser
  const parseResponse = async (res: Response) => {
    const contentType = res.headers.get("content-type");
    if (res.status === 204) return {};
    if (contentType && contentType.includes("application/json")) {
      try {
        return await res.json();
      } catch {
        return {};
      }
    }
    return {};
  };

  // Attempt with primary database id
  let currentDbId = databaseId;
  let url = subPathSuffix.startsWith(":")
    ? `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${currentDbId}/documents${subPathSuffix}?key=${apiKey}`
    : `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${currentDbId}/documents/${collectionPath}${subPathSuffix}?key=${apiKey}`;

  try {
    const res = await fetchWithTimeout(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    }, 15000);

    if (res.ok) {
      return await parseResponse(res);
    }

    const errText = await res.text();
    console.warn(`[Firestore Alert] Direct DB ID "${currentDbId}" failed (Status ${res.status}): ${errText}`);

    // If database or document is not found, or access issues, and not default DB yet, retry using default databaseId "(default)"
    if (currentDbId !== "(default)" && (res.status === 404 || res.status === 403 || res.status === 400 || res.status === 401)) {
      console.log(`♻️ [Firestore REST Fallback] Retrying operational token under default database ID "(default)"...`);
      currentDbId = "(default)";
      url = subPathSuffix.startsWith(":")
        ? `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${currentDbId}/documents${subPathSuffix}?key=${apiKey}`
        : `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${currentDbId}/documents/${collectionPath}${subPathSuffix}?key=${apiKey}`;

      const retryRes = await fetchWithTimeout(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined
      }, 15000);

      if (retryRes.ok) {
        // Cache successful fallback DB ID in memory so we don't need to cycle it repeatedly
        firestoreRest.databaseId = "(default)";
        console.log(`✅ [Firestore REST Fallback] Successfully connected to default database. Persistent cached.`);
        return await parseResponse(retryRes);
      }

      const retryError = await retryRes.text();
      throw new Error(`Firestore default DB fallback retry failed: ${retryError}`);
    } else {
      throw new Error(`Firestore REST error: ${errText}`);
    }
  } catch (error: any) {
    // If request timed out, aborted, or had a TCP issue and we haven't checked default DB yet, try as ultimate failover
    if (currentDbId !== "(default)") {
      console.warn(`[Firestore Alert] Network issue on primary DB ID "${currentDbId}". Attempting default failover retry...`, error.message);
      currentDbId = "(default)";
      url = subPathSuffix.startsWith(":")
        ? `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${currentDbId}/documents${subPathSuffix}?key=${apiKey}`
        : `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${currentDbId}/documents/${collectionPath}${subPathSuffix}?key=${apiKey}`;

      try {
        const retryRes = await fetchWithTimeout(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: body ? JSON.stringify(body) : undefined
        }, 15000);

        if (retryRes.ok) {
          firestoreRest.databaseId = "(default)";
          console.log(`✅ [Firestore REST Failover] Restored connection to default database successfully.`);
          return await parseResponse(retryRes);
        }
      } catch (retryErr: any) {
        console.error(`Firestore REST double-fault failure:`, retryErr.message);
      }
    }
    throw error;
  }
}

function mergeCouriers(localList: Courier[], firestoreList: Courier[]): Courier[] {
  const mergedMap = new Map<string, Courier>();
  for (const item of localList) {
    mergedMap.set(item.id, item);
  }
  for (const item of firestoreList) {
    const existingLocal = mergedMap.get(item.id);
    if (existingLocal) {
      mergedMap.set(item.id, {
        ...existingLocal,
        ...item,
        apps: item.apps && item.apps.length > 0 ? item.apps : existingLocal.apps,
      });
    } else {
      mergedMap.set(item.id, item);
    }
  }
  const mergedList = Array.from(mergedMap.values());
  writeCouriersFile(mergedList);
  return mergedList;
}

async function readAllCouriers(): Promise<Courier[]> {
  const localList = readCouriersFile();

  // 1. Try Native Firestore Client (Highest performance, native auth)
  if (firestoreClient) {
    try {
      const snapshot = await firestoreClient.collection("couriers").get();
      const firestoreList: Courier[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        firestoreList.push({
          id: doc.id,
          ...d,
        } as Courier);
      });
      return mergeCouriers(localList, firestoreList);
    } catch (sdkError: any) {
      console.warn("⚠️ Native Firestore SDK query failed, trying REST API fallback...", sdkError.message);
    }
  }

  // 2. Try REST API Client (Fallback)
  if (firestoreRest) {
    try {
      const payload = {
        structuredQuery: {
          from: [{ collectionId: "couriers" }]
        }
      };
      
      const data = await callFirestoreREST("couriers", "POST", payload, ":runQuery");
      const firestoreList: Courier[] = [];
      const queryResults = Array.isArray(data) ? data : [];

      for (const item of queryResults) {
        if (!item.document) continue;
        const d = item.document;
        const id = d.name.split("/").pop() || "";
        const fields = d.fields || {};
        const courierData: any = {};
        for (const key of Object.keys(fields)) {
          courierData[key] = fromFirestoreValue(fields[key]);
        }
        firestoreList.push({
          id,
          name: courierData.name || "",
          phone: courierData.phone || "",
          city: courierData.city || "",
          experience: courierData.experience || "",
          apps: courierData.apps || [],
          createdAt: courierData.createdAt || new Date().toISOString(),
          status: courierData.status || "جديد",
          interviewDate: courierData.interviewDate,
          interviewTime: courierData.interviewTime,
          nationalId: courierData.nationalId || "",
          iban: courierData.iban || "",
          carPlate: courierData.carPlate || "",
          vehicleModel: courierData.vehicleModel || "",
          appCourierCode: courierData.appCourierCode || "",
          activationDate: courierData.activationDate || "",
          adminNotes: courierData.adminNotes || "",
        } as Courier);
      }

      return mergeCouriers(localList, firestoreList);
    } catch (restError: any) {
      console.error("Firestore REST list failed, fallback to local JSON database.", restError.message);
    }
  }

  return localList;
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

  // 2. Try native Firestore Client first
  if (firestoreClient) {
    try {
      await firestoreClient.collection("couriers").doc(courier.id).set(courier);
      console.log(`Document ${courier.id} successfully saved to Native Cloud Firestore.`);
      return;
    } catch (sdkError: any) {
      console.warn("⚠️ Native Firestore SDK set failed, trying REST API fallback...", sdkError.message);
    }
  }

  // 3. Fallback to Cloud Firestore REST API
  if (firestoreRest) {
    try {
      const fields: any = {};
      const rawObj: any = {
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
      };

      for (const key of Object.keys(rawObj)) {
        fields[key] = toFirestoreValue(rawObj[key]);
      }

      await callFirestoreREST("couriers", "PATCH", { fields }, `/${courier.id}`);
      console.log(`Document ${courier.id} successfully synchronized to Cloud Firestore REST.`);
    } catch (e: any) {
      console.error("Failed to synchronize to Firestore REST, stored locally.", e.message);
    }
  }
}

async function deleteCourier(id: string) {
  // 1. Delete from local JSON file
  const localList = readCouriersFile();
  const filtered = localList.filter((c) => c.id !== id);
  writeCouriersFile(filtered);

  // 2. Try Native Firestore Client first
  if (firestoreClient) {
    try {
      await firestoreClient.collection("couriers").doc(id).delete();
      console.log(`Document ${id} successfully deleted from Native Cloud Firestore.`);
      return;
    } catch (sdkError: any) {
      console.warn("⚠️ Native Firestore SDK delete failed, trying REST API fallback...", sdkError.message);
    }
  }

  // 3. Fallback to Cloud Firestore REST API
  if (firestoreRest) {
    try {
      await callFirestoreREST("couriers", "DELETE", null, `/${id}`);
      console.log(`Document ${id} successfully deleted from Cloud Firestore REST.`);
    } catch (e: any) {
      console.error("Failed to delete document from Firestore REST.", e.message);
    }
  }
}

function mergeTickets(localList: SupportTicket[], firestoreList: SupportTicket[]): SupportTicket[] {
  const mergedMap = new Map<string, SupportTicket>();
  for (const item of localList) {
    mergedMap.set(item.id, item);
  }
  for (const item of firestoreList) {
    const existingLocal = mergedMap.get(item.id);
    if (existingLocal) {
      mergedMap.set(item.id, {
        ...existingLocal,
        ...item,
        messages: item.messages && item.messages.length >= existingLocal.messages.length ? item.messages : existingLocal.messages,
      });
    } else {
      mergedMap.set(item.id, item);
    }
  }
  const mergedList = Array.from(mergedMap.values());
  writeTicketsFile(mergedList);
  return mergedList;
}

async function readAllTickets(): Promise<SupportTicket[]> {
  const localList = readTicketsFile();

  // 1. Try Native Firestore Client
  if (firestoreClient) {
    try {
      const snapshot = await firestoreClient.collection("support_tickets").get();
      const firestoreList: SupportTicket[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        firestoreList.push({
          id: doc.id,
          ...d,
        } as SupportTicket);
      });
      return mergeTickets(localList, firestoreList);
    } catch (sdkError: any) {
      console.warn("⚠️ Native Firestore SDK tickets query failed, trying REST API fallback...", sdkError.message);
    }
  }

  // 2. Try REST API Client
  if (firestoreRest) {
    try {
      const payload = {
        structuredQuery: {
          from: [{ collectionId: "support_tickets" }]
        }
      };
      
      const data = await callFirestoreREST("support_tickets", "POST", payload, ":runQuery");
      const firestoreList: SupportTicket[] = [];
      const queryResults = Array.isArray(data) ? data : [];

      for (const item of queryResults) {
        if (!item.document) continue;
        const d = item.document;
        const id = d.name.split("/").pop() || "";
        const fields = d.fields || {};
        const ticketData: any = {};
        for (const key of Object.keys(fields)) {
          ticketData[key] = fromFirestoreValue(fields[key]);
        }
        firestoreList.push({
          id,
          courierName: ticketData.courierName || "",
          courierPhone: ticketData.courierPhone || "",
          category: ticketData.category || "",
          subject: ticketData.subject || "",
          status: ticketData.status || "جديد",
          createdAt: ticketData.createdAt || new Date().toISOString(),
          updatedAt: ticketData.updatedAt || new Date().toISOString(),
          messages: ticketData.messages || [],
        });
      }

      return mergeTickets(localList, firestoreList);
    } catch (restError: any) {
      console.error("Firestore support collection list failed, fallback to local JSON database.", restError.message);
    }
  }

  return localList;
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

  // 2. Try Native Firestore Client first
  if (firestoreClient) {
    try {
      await firestoreClient.collection("support_tickets").doc(ticket.id).set(ticket);
      console.log(`Support ticket ${ticket.id} successfully saved to Native Cloud Firestore.`);
      return;
    } catch (sdkError: any) {
      console.warn("⚠️ Native Firestore SDK ticket save failed, trying REST API fallback...", sdkError.message);
    }
  }

  // 3. Fallback to Cloud Firestore REST API
  if (firestoreRest) {
    try {
      const fields: any = {};
      const rawObj: any = {
        courierName: ticket.courierName,
        courierPhone: ticket.courierPhone,
        category: ticket.category,
        subject: ticket.subject,
        status: ticket.status,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        messages: ticket.messages,
      };

      for (const key of Object.keys(rawObj)) {
        fields[key] = toFirestoreValue(rawObj[key]);
      }

      await callFirestoreREST("support_tickets", "PATCH", { fields }, `/${ticket.id}`);
      console.log(`Support ticket ${ticket.id} synchronized to Firestore REST.`);
    } catch (e: any) {
      console.error("Failed to sync ticket to Firestore (REST):", e.message);
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
    const matched = tickets.filter(t => {
      const p = t.courierPhone || "";
      const searchP = phone || "";
      return p === searchP || p.replace(/^0/, "") === searchP.replace(/^0/, "");
    });
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
    fs.appendFileSync(DEBUG_LOG_FILE, errMsg, "utf8");
  } catch (logErr) {}
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "حدث خطأ داخلي في الخادم. الرجاء المحاولة مجدداً."
  });
});

async function start() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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
