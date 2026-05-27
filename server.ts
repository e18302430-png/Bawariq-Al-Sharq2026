import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON parsing
app.use(express.json());

// Detect writeable data directory dynamically (prefer workspace local data folder for persistence, fallback to /tmp if write is protected)
let DATA_DIR = path.join(process.cwd(), "data");

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  // Safe write test to ensure directory is writable
  const testFile = path.join(DATA_DIR, ".write_test");
  fs.writeFileSync(testFile, "test_write", "utf8");
  fs.unlinkSync(testFile);
} catch (e) {
  DATA_DIR = "/tmp";
}

const DATA_FILE = path.join(DATA_DIR, "couriers.json");
const TICKETS_FILE = path.join(DATA_DIR, "support_tickets.json");
const SETTINGS_FILE = path.join(DATA_DIR, "app_settings.json");
const SUPERVISORS_FILE = path.join(DATA_DIR, "supervisors.json");
const DEBUG_LOG_FILE = path.join(DATA_DIR, "debug.log");

// Seed/Copy from read-only application data folder to writable folder if needed
try {
  const seedCouriersPath = path.join(process.cwd(), "data", "couriers.json");
  const seedTicketsPath = path.join(process.cwd(), "data", "support_tickets.json");
  const seedSettingsPath = path.join(process.cwd(), "data", "app_settings.json");
  const seedSupervisorsPath = path.join(process.cwd(), "data", "supervisors.json");

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

  if (!fs.existsSync(SETTINGS_FILE)) {
    if (fs.existsSync(seedSettingsPath)) {
      fs.copyFileSync(seedSettingsPath, SETTINGS_FILE);
    } else {
      const defaultSettings = {
        hungerstation: { id: "hungerstation", isAvailable: true, region: "مستوى المملكة", warningMessage: "" },
        toyou: { id: "toyou", isAvailable: true, region: "مستوى المملكة", warningMessage: "" },
        keeta: { id: "keeta", isAvailable: true, region: "مستوى المملكة", warningMessage: "" },
        thechefs: { id: "thechefs", isAvailable: true, region: "مستوى المملكة", warningMessage: "" },
        mrsool: { id: "mrsool", isAvailable: true, region: "مستوى المملكة", warningMessage: "" },
        jahez: { id: "jahez", isAvailable: true, region: "مستوى المملكة", warningMessage: "" }
      };
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2), "utf8");
    }
  }

  if (!fs.existsSync(SUPERVISORS_FILE)) {
    if (fs.existsSync(seedSupervisorsPath)) {
      fs.copyFileSync(seedSupervisorsPath, SUPERVISORS_FILE);
    } else {
      const defaultSupervisors = [
        { id: "direct", name: "تسجيل مباشر (بدون مشرف)", phone: "0599612490", active: true },
        { id: "sup_1", name: "الأستاذ أحمد (مشرف المنطقة الشرقية)", phone: "0599612490", active: true },
        { id: "sup_2", name: "الأستاذ خالد (مشرف الوسطى والرياض)", phone: "0599612490", active: true },
        { id: "sup_3", name: "الأستاذ محمد (مشرف الغربية وجدة)", phone: "0599612490", active: true }
      ];
      fs.writeFileSync(SUPERVISORS_FILE, JSON.stringify(defaultSupervisors, null, 2), "utf8");
    }
  } else {
    try {
      let content = fs.readFileSync(SUPERVISORS_FILE, "utf8");
      if (content.includes("0501112223") || content.includes("0502223334") || content.includes("0503334445") || content.includes("966501112223")) {
        content = content.replace(/0501112223/g, "0599612490")
                         .replace(/0502223334/g, "0599612490")
                         .replace(/0503334445/g, "0599612490")
                         .replace(/966501112223/g, "0599612490");
        fs.writeFileSync(SUPERVISORS_FILE, content, "utf8");
      }
    } catch (e) {}
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
  supervisorId?: string;
  supervisorName?: string;
  supervisorPhone?: string;
  agreementAccepted?: boolean;
  agreementAcceptedAt?: string;
  agreementSignature?: string;
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
  title?: string;
  courierId?: string;
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

// Config PostgreSQL / Supabase connection (Dynamic depending on Environment context)
import pg from "pg";
const { Pool } = pg;

let pgPool: pg.Pool | null = null;
const pgDbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;

const isPlaceholderPg = pgDbUrl && (pgDbUrl.includes("@base") || pgDbUrl.includes("://base") || pgDbUrl === "base");

if (pgDbUrl && !isPlaceholderPg) {
  try {
    pgPool = new Pool({
      connectionString: pgDbUrl,
      ssl: { rejectUnauthorized: false } // Required for external Supabase or Neon connections
    });
    console.log("🐘 PostgreSQL/Supabase DB Client instantiated successfully.");
  } catch (err: any) {
    console.error("⚠️ Failed to initialize PostgreSQL Pool client:", err.message);
  }
} else if (isPlaceholderPg) {
  console.log("ℹ️ Detected placeholder PostgreSQL connection URL pointing to 'base' (Unresolvable sandbox dummy). Skipping PostgreSQL client instantiation. Using Supabase REST APIs & local fallback database instead.");
}

// 🌐 Helper to dynamically resolve and heal invalid or swapped Supabase properties
function getSupabaseConfig(): { url: string; key: string } | null {
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;

  // Helper to extract ref from JWT token (e.g. from key or even url)
  function extractRef(token: string): string | null {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    try {
      const payload = Buffer.from(parts[1], "base64").toString("utf-8");
      const parsed = JSON.parse(payload);
      if (parsed && typeof parsed.ref === "string") {
        return parsed.ref;
      }
    } catch (e) {
      // Ignore
    }
    return null;
  }

  // Detect which one is the JWT token
  let token = "";
  if (key.includes(".")) {
    token = key;
  } else if (url.includes(".")) {
    token = url;
  }

  const ref = extractRef(token);
  let resolvedUrl = "";
  let resolvedKey = "";

  if (ref) {
    resolvedUrl = `https://${ref}.supabase.co`;
    resolvedKey = token; // Must use the full JWT
  } else {
    // If no JWT was parsed but url looks correct
    resolvedUrl = url.startsWith("http") ? url : `https://${url}.supabase.co`;
    resolvedKey = key;
  }

  // Double check if resolved values are valid
  if (!resolvedUrl || !resolvedUrl.startsWith("http") || !resolvedKey) {
    return null;
  }

  return { url: resolvedUrl, key: resolvedKey };
}

// 🌐 Supabase PostgREST Client Wrapper (for serverless persistence and crash recovery)
async function callSupabase(table: string, method: "GET" | "POST" | "PATCH" | "DELETE", body?: any, query?: string): Promise<any> {
  const config = getSupabaseConfig();
  if (!config) return null;

  const { url: supabaseUrl, key: supabaseKey } = config;

  try {
    const url = `${supabaseUrl}/rest/v1/${table}${query ? `?${query}` : ""}`;
    const headers: Record<string, string> = {
      "apikey": supabaseKey,
      "Authorization": `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
    };

    if (method === "POST" || method === "PATCH") {
      // resolution=merge-duplicates enables standard UPSERT on primary key
      headers["Prefer"] = "resolution=merge-duplicates";
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    if (!response.ok) {
      const errText = await response.text();
      
      // 🩺 Self-Heal Schema Mismatches (PGRST204): Auto-strip missing columns and retry!
      try {
        const errObj = JSON.parse(errText);
        if (errObj && errObj.code === "PGRST204" && errObj.message && body) {
          const match = errObj.message.match(/Could not find the '([^']+)' column/);
          if (match && match[1]) {
            const missingCol = match[1];
            console.warn(`⚠️ Supabase lacking column '${missingCol}' in '${table}'. Filtering it out and retrying request...`);
            
            let cleanedBody = null;
            if (Array.isArray(body)) {
              cleanedBody = body.map(item => {
                if (item && typeof item === "object") {
                  const newItem = { ...item };
                  delete newItem[missingCol];
                  return newItem;
                }
                return item;
              });
            } else if (body && typeof body === "object") {
              cleanedBody = { ...body };
              delete cleanedBody[missingCol];
            }
            
            if (cleanedBody) {
              return await callSupabase(table, method, cleanedBody, query);
            }
          }
        }
      } catch (e) {
        // Ignored
      }

      // Only warning because some tables might not exist yet before SQL setup
      console.warn(`Supabase REST Warn/Error (${method} ${table}):`, errText);
      return null;
    }

    if (method === "GET") {
      return await response.json();
    }
    return { success: true };
  } catch (err: any) {
    console.error(`Supabase fetch error for table ${table}:`, err.message);
    return null;
  }
}

async function restoreAllDataFromSupabase() {
  const config = getSupabaseConfig();
  if (!config) {
    console.log("ℹ️ Supabase credentials are not set in .env or invalid. Skipping cloud data load.");
    return;
  }

  console.log("🔄 Restoring database cache from persistent Supabase tables...");

  // 1. Restore supervisors table
  try {
    const sList = await callSupabase("supervisors", "GET");
    if (sList && Array.isArray(sList) && sList.length > 0) {
      const supervisors = sList.map((r: any) => ({
        id: r.id,
        name: r.name,
        phone: r.phone,
        active: r.active === undefined ? true : !!r.active
      }));
      fs.writeFileSync(SUPERVISORS_FILE, JSON.stringify(supervisors, null, 2), "utf8");
      console.log(`✅ Restored ${supervisors.length} supervisors from Supabase.`);
    }
  } catch (err: any) {
    console.error("⚠️ Failed to restore supervisors from Supabase:", err.message);
  }

  // 2. Restore app settings
  try {
    const settingsList = await callSupabase("app_settings", "GET");
    if (settingsList && Array.isArray(settingsList) && settingsList.length > 0) {
      const settingsMap: Record<string, any> = {};
      for (const row of settingsList) {
        settingsMap[row.key] = row.value;
      }
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settingsMap, null, 2), "utf8");
      console.log(`✅ Restored app settings from Supabase.`);
    }
  } catch (err: any) {
    console.error("⚠️ Failed to restore app settings from Supabase:", err.message);
  }

  // 3. Restore couriers table
  try {
    const cList = await callSupabase("couriers", "GET");
    if (cList && Array.isArray(cList) && cList.length > 0) {
      const mappedList: Courier[] = cList.map((row: any) => ({
        id: row.id,
        name: row.name,
        phone: row.phone,
        city: row.city,
        apps: row.apps || [],
        nationalId: row.national_id || "",
        supervisorId: row.supervisor_id || "",
        supervisorName: row.supervisor_name || "",
        supervisorPhone: row.supervisor_phone || "",
        agreementAccepted: !!row.agreement_accepted,
        agreementAcceptedAt: row.agreement_accepted_at || "",
        createdAt: row.created_at || "",
        experience: row.experience || "",
        status: row.status || "جديد",
        interviewDate: row.details?.interviewDate || "",
        interviewTime: row.details?.interviewTime || "",
        iban: row.details?.iban || "",
        carPlate: row.details?.carPlate || "",
        vehicleModel: row.details?.vehicleModel || "",
        appCourierCode: row.details?.appCourierCode || "",
        activationDate: row.details?.activationDate || "",
        adminNotes: row.details?.adminNotes || row.additional_notes || "",
        agreementSignature: row.details?.agreementSignature || "",
      } as Courier));
      writeCouriersFile(mappedList);
      console.log(`✅ Restored ${mappedList.length} couriers from Supabase.`);
    }
  } catch (err: any) {
    console.error("⚠️ Failed to restore couriers from Supabase:", err.message);
  }

  // 4. Restore support tickets table
  try {
    const tList = await callSupabase("support_tickets", "GET");
    if (tList && Array.isArray(tList) && tList.length > 0) {
      const mappedList: SupportTicket[] = tList.map((row: any) => ({
        id: row.id,
        title: row.title || row.details?.title || "",
        status: row.status || "جديد",
        courierId: row.courier_id || "",
        courierName: row.courier_name || "",
        createdAt: row.created_at || "",
        messages: row.messages || [],
        courierPhone: row.details?.courierPhone || "",
        category: row.details?.category || "",
        subject: row.details?.subject || "",
        updatedAt: row.details?.updatedAt || ""
      } as SupportTicket));
      writeTicketsFile(mappedList);
      console.log(`✅ Restored ${mappedList.length} support tickets from Supabase.`);
    }
  } catch (err: any) {
    console.error("⚠️ Failed to restore support tickets from Supabase:", err.message);
  }
}

async function initPgDb() {
  if (!pgPool) {
    console.log("ℹ️ Skipping PostgreSQL schema check (No connection URL configured). Local files mode active.");
    return;
  }
  try {
    const client = await pgPool.connect();
    try {
      // 1. Create supervisors table
      await client.query(`
        CREATE TABLE IF NOT EXISTS supervisors (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          active BOOLEAN DEFAULT TRUE
        );
      `);

      // 2. Create couriers table
      await client.query(`
        CREATE TABLE IF NOT EXISTS couriers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          city TEXT NOT NULL,
          apps TEXT[] NOT NULL,
          national_id TEXT,
          supervisor_id TEXT,
          supervisor_name TEXT,
          supervisor_phone TEXT,
          agreement_accepted BOOLEAN DEFAULT FALSE,
          agreement_accepted_at TEXT,
          created_at TEXT DEFAULT '',
          additional_notes TEXT DEFAULT '',
          experience TEXT DEFAULT '',
          status TEXT DEFAULT 'جديد',
          details JSONB DEFAULT '{}'::jsonb
        );
      `);

      // 3. Create support_tickets table
      await client.query(`
        CREATE TABLE IF NOT EXISTS support_tickets (
          id TEXT PRIMARY KEY,
          title TEXT,
          status TEXT DEFAULT 'جديد',
          courier_id TEXT,
          courier_name TEXT,
          created_at TEXT DEFAULT '',
          messages JSONB DEFAULT '[]'::jsonb,
          details JSONB DEFAULT '{}'::jsonb
        );
      `);

      // 4. Create app_settings table
      await client.query(`
        CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL
        );
      `);

      console.log("✅ PostgreSQL schema verified/created successfully.");

      // Check if supervisors exist, otherwise seed from local files or default
      const supCheck = await client.query("SELECT COUNT(*) FROM supervisors;");
      if (parseInt(supCheck.rows[0].count) === 0) {
        console.log("🌱 Seeding default supervisors into Postgres database...");
        
        let supervisors = [
          { id: "direct", name: "تسجيل مباشر (بدون مشرف)", phone: "0599612490", active: true },
          { id: "sup_1", name: "الأستاذ أحمد (مشرف المنطقة الشرقية)", phone: "0599612490", active: true },
          { id: "sup_2", name: "الأستاذ خالد (مشرف الوسطى والرياض)", phone: "0599612490", active: true },
          { id: "sup_3", name: "الأستاذ محمد (مشرف الغربية وجدة)", phone: "0599612490", active: true }
        ];

        try {
          if (fs.existsSync(SUPERVISORS_FILE)) {
            const fileContent = fs.readFileSync(SUPERVISORS_FILE, "utf8");
            if (fileContent) {
              const fileSups = JSON.parse(fileContent);
              if (Array.isArray(fileSups) && fileSups.length > 0) {
                supervisors = fileSups;
              }
            }
          }
        } catch (e) {}

        for (const s of supervisors) {
          await client.query(
            "INSERT INTO supervisors (id, name, phone, active) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING;",
            [s.id, s.name, s.phone, s.active]
          );
        }
      }

      // Check if app settings exist, otherwise seed from app_settings.json
      const settingsCheck = await client.query("SELECT COUNT(*) FROM app_settings;");
      if (parseInt(settingsCheck.rows[0].count) === 0) {
        console.log("🌱 Seeding default app settings into Postgres database...");
        let defaultSettings = {
          hungerstation: { id: "hungerstation", isAvailable: true, region: "مستوى المملكة", warningMessage: "" },
          toyou: { id: "toyou", isAvailable: true, region: "مستوى المملكة", warningMessage: "" },
          keeta: { id: "keeta", isAvailable: true, region: "مستوى المملكة", warningMessage: "" },
          thechefs: { id: "thechefs", isAvailable: true, region: "مستوى المملكة", warningMessage: "" },
          mrsool: { id: "mrsool", isAvailable: true, region: "مستوى المملكة", warningMessage: "" },
          jahez: { id: "jahez", isAvailable: true, region: "مستوى المملكة", warningMessage: "" }
        };

        try {
          if (fs.existsSync(SETTINGS_FILE)) {
            const fileContent = fs.readFileSync(SETTINGS_FILE, "utf8");
            if (fileContent) {
              defaultSettings = JSON.parse(fileContent);
            }
          }
        } catch (e) {}

        for (const [key, value] of Object.entries(defaultSettings)) {
          await client.query(
            "INSERT INTO app_settings (key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO NOTHING;",
            [key, JSON.stringify(value)]
          );
        }
      }
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("⚠️ Failed to run PostgreSQL initialization schema:", err.message);
    console.log("ℹ️ Setting pgPool to null to prevent further failed connection attempts.");
    pgPool = null;
  }
}

// Execute bootstrap database structure
initPgDb();

// Config Firestore Rest Credentials
let firestoreRest: {
  projectId: string;
  databaseId: string;
  apiKey: string;
} | null = null;

let firestoreClient: any = null;

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
  } else {
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

// Read App Settings Helper
async function readSettings(): Promise<Record<string, any>> {
  const defaultSettings = {
    hungerstation: { id: "hungerstation", isAvailable: false, region: "مستوى المملكة", warningMessage: "" },
    toyou: { id: "toyou", isAvailable: true, region: "مستوى المملكة", warningMessage: "" },
    keeta: { id: "keeta", isAvailable: true, region: "مستوى المملكة", warningMessage: "" },
    thechefs: { id: "thechefs", isAvailable: true, region: "مستوى المملكة", warningMessage: "" },
    mrsool: { id: "mrsool", isAvailable: true, region: "مستوى المملكة", warningMessage: "" },
    jahez: { id: "jahez", isAvailable: false, region: "مستوى المملكة", warningMessage: "" }
  };

  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    try {
      const sList = await callSupabase("app_settings", "GET");
      if (sList && Array.isArray(sList) && sList.length > 0) {
        const settingsMap: Record<string, any> = {};
        for (const row of sList) {
          settingsMap[row.id] = {
            id: row.id,
            isAvailable: row.is_available,
            region: row.region || "مستوى المملكة",
            warningMessage: row.warning_message || ""
          };
        }
        return settingsMap;
      }
    } catch (err: any) {
      console.error("⚠️ Supabase error reading app settings:", err.message);
    }
  }
  return defaultSettings;
}
// Write App Settings Helper
async function writeSettings(settings: Record<string, any>) {
  writeSettingsFile(settings);

  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    try {
      for (const [key, value] of Object.entries(settings)) {
        await callSupabase("app_settings", "POST", {
          id: key,
          is_available: value.isAvailable !== undefined ? value.isAvailable : true,
          region: value.region || "مستوى المملكة",
          warning_message: value.warningMessage || ""
        });
      }
    } catch (err: any) {
      console.error("⚠️ Supabase error writing app settings:", err.message);
    }
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
  // Try Supabase first if configured
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    try {
      const sList = await callSupabase("couriers", "GET");
      if (sList && Array.isArray(sList)) {
        const mappedList: Courier[] = sList.map((row: any) => ({
          id: row.id,
          name: row.name,
          phone: row.phone,
          city: row.city,
          apps: row.apps || [],
          nationalId: row.national_id || "",
          supervisorId: row.supervisor_id || "",
          supervisorName: row.supervisor_name || "",
          supervisorPhone: row.supervisor_phone || "",
          agreementAccepted: !!row.agreement_accepted,
          agreementAcceptedAt: row.agreement_accepted_at || "",
          createdAt: row.created_at || "",
          experience: row.experience || "",
          status: row.status || "جديد",
          interviewDate: row.details?.interviewDate || "",
          interviewTime: row.details?.interviewTime || "",
          iban: row.details?.iban || "",
          carPlate: row.details?.carPlate || "",
          vehicleModel: row.details?.vehicleModel || "",
          appCourierCode: row.details?.appCourierCode || "",
          activationDate: row.details?.activationDate || "",
          adminNotes: row.details?.adminNotes || row.additional_notes || "",
          agreementSignature: row.details?.agreementSignature || "",
        } as Courier));
        const localList = readCouriersFile();
        const mergedList = mergeCouriers(localList, mappedList);
        writeCouriersFile(mergedList);
        return mergedList;
      }
    } catch (err: any) {
      console.error("⚠️ Supabase REST error reading couriers:", err.message);
    }
  }

  // Try PostgreSQL first if configured
  if (pgPool) {
    try {
      const result = await pgPool.query("SELECT * FROM couriers;");
      if (result.rows.length > 0) {
        const pgList: Courier[] = result.rows.map((row: any) => ({
          id: row.id,
          name: row.name,
          phone: row.phone,
          city: row.city,
          apps: row.apps || [],
          nationalId: row.national_id || "",
          supervisorId: row.supervisor_id || "",
          supervisorName: row.supervisor_name || "",
          supervisorPhone: row.supervisor_phone || "",
          agreementAccepted: !!row.agreement_accepted,
          agreementAcceptedAt: row.agreement_accepted_at || "",
          createdAt: row.created_at || "",
          experience: row.experience || "",
          status: row.status || "جديد",
          interviewDate: row.details?.interviewDate || "",
          interviewTime: row.details?.interviewTime || "",
          iban: row.details?.iban || "",
          carPlate: row.details?.carPlate || "",
          vehicleModel: row.details?.vehicleModel || "",
          appCourierCode: row.details?.appCourierCode || "",
          activationDate: row.details?.activationDate || "",
          adminNotes: row.details?.adminNotes || row.additional_notes || "",
          agreementSignature: row.details?.agreementSignature || "",
        } as Courier));
        return pgList;
      }
    } catch (dbErr: any) {
      console.error("⚠️ PostgreSQL error reading couriers; falling back to Firestore/local:", dbErr.message);
    }
  }

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

  // Sync to Supabase if configured
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    try {
      const sbObj = {
        id: courier.id,
        name: courier.name,
        phone: courier.phone,
        city: courier.city,
        apps: courier.apps || [],
        national_id: courier.nationalId || "",
        supervisor_id: courier.supervisorId || "",
        supervisor_name: courier.supervisorName || "",
        supervisor_phone: courier.supervisorPhone || "",
        agreement_accepted: !!courier.agreementAccepted,
        agreement_accepted_at: courier.agreementAcceptedAt || "",
        created_at: courier.createdAt || new Date().toISOString(),
        experience: courier.experience || "",
        status: courier.status || "جديد",
        additional_notes: courier.adminNotes || "",
        details: {
          interviewDate: courier.interviewDate,
          interviewTime: courier.interviewTime,
          iban: courier.iban,
          carPlate: courier.carPlate,
          vehicleModel: courier.vehicleModel,
          appCourierCode: courier.appCourierCode,
          activationDate: courier.activationDate,
          adminNotes: courier.adminNotes,
          agreementSignature: courier.agreementSignature
        }
      };
      await callSupabase("couriers", "POST", sbObj);
      console.log(`Document ${courier.id} successfully synchronized to Supabase.`);
    } catch (err: any) {
      console.error("⚠️ Supabase REST error saving courier:", err.message);
    }
  }

  // 2. Synchronize to PostgreSQL if database connection exists
  if (pgPool) {
    try {
      await pgPool.query(
        `INSERT INTO couriers (
          id, name, phone, city, apps, national_id, supervisor_id, supervisor_name, supervisor_phone,
          agreement_accepted, agreement_accepted_at, created_at, experience, status, additional_notes, details
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb)
        ON CONFLICT (id) DO UPDATE SET
          name = $2, phone = $3, city = $4, apps = $5, national_id = $6, supervisor_id = $7,
          supervisor_name = $8, supervisor_phone = $9, agreement_accepted = $10,
          agreement_accepted_at = $11, created_at = $12, experience = $13, status = $14,
          additional_notes = $15, details = $16::jsonb;`,
        [
          courier.id,
          courier.name,
          courier.phone,
          courier.city,
          courier.apps || [],
          courier.nationalId || "",
          courier.supervisorId || "",
          courier.supervisorName || "",
          courier.supervisorPhone || "",
          !!courier.agreementAccepted,
          courier.agreementAcceptedAt || "",
          courier.createdAt || new Date().toISOString(),
          courier.experience || "",
          courier.status || "جديد",
          courier.adminNotes || "",
          JSON.stringify({
            interviewDate: courier.interviewDate,
            interviewTime: courier.interviewTime,
            iban: courier.iban,
            carPlate: courier.carPlate,
            vehicleModel: courier.vehicleModel,
            appCourierCode: courier.appCourierCode,
            activationDate: courier.activationDate,
            adminNotes: courier.adminNotes
          })
        ]
      );
      console.log(`Document ${courier.id} successfully synchronized to PostgreSQL.`);
    } catch (dbErr: any) {
      console.error("⚠️ PostgreSQL error saving courier:", dbErr.message);
    }
  }

  // 3. Try native Firestore Client second
  if (firestoreClient) {
    try {
      await firestoreClient.collection("couriers").doc(courier.id).set(courier);
      console.log(`Document ${courier.id} successfully saved to Native Cloud Firestore.`);
      return;
    } catch (sdkError: any) {
      console.warn("⚠️ Native Firestore SDK set failed, trying REST API fallback...", sdkError.message);
    }
  }

  // 4. Fallback to Cloud Firestore REST API
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

  // Sync deletion to Supabase
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    try {
      await callSupabase("couriers", "DELETE", null, `id=eq.${id}`);
      console.log(`Courier ${id} successfully deleted from Supabase.`);
    } catch (err: any) {
      console.error("⚠️ Supabase error deleting courier:", err.message);
    }
  }

  // 2. Delete from PostgreSQL
  if (pgPool) {
    try {
      await pgPool.query("DELETE FROM couriers WHERE id = $1;", [id]);
      console.log(`Courier ${id} successfully deleted from PostgreSQL.`);
    } catch (dbErr: any) {
      console.error("⚠️ PostgreSQL error deleting courier:", dbErr.message);
    }
  }

  // 3. Try Native Firestore Client first
  if (firestoreClient) {
    try {
      await firestoreClient.collection("couriers").doc(id).delete();
      console.log(`Document ${id} successfully deleted from Native Cloud Firestore.`);
      return;
    } catch (sdkError: any) {
      console.warn("⚠️ Native Firestore SDK delete failed, trying REST API fallback...", sdkError.message);
    }
  }

  // 4. Fallback to Cloud Firestore REST API
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
  // Try Supabase first if configured
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    try {
      const sList = await callSupabase("support_tickets", "GET");
      if (sList && Array.isArray(sList)) {
        const mappedList: SupportTicket[] = sList.map((row: any) => ({
          id: row.id,
          title: row.title || row.details?.title || "",
          status: row.status || "جديد",
          courierId: row.courier_id || "",
          courierName: row.courier_name || "",
          createdAt: row.created_at || "",
          messages: row.messages || [],
          courierPhone: row.details?.courierPhone || "",
          category: row.details?.category || "",
          subject: row.details?.subject || "",
          updatedAt: row.details?.updatedAt || ""
        } as SupportTicket));
        const localList = readTicketsFile();
        const mergedList = mergeTickets(localList, mappedList);
        writeTicketsFile(mergedList);
        return mergedList;
      }
    } catch (err: any) {
      console.error("⚠️ Supabase REST error reading tickets:", err.message);
    }
  }

  // Try PostgreSQL first if configured
  if (pgPool) {
    try {
      const result = await pgPool.query("SELECT * FROM support_tickets ORDER BY id DESC;");
      if (result.rows.length > 0) {
        const pgList: SupportTicket[] = result.rows.map((row: any) => ({
          id: row.id,
          title: row.title || row.details?.title || "",
          status: row.status || "جديد",
          courierId: row.courier_id || "",
          courierName: row.courier_name || "",
          createdAt: row.created_at || "",
          messages: row.messages || [],
          courierPhone: row.details?.courierPhone || "",
          category: row.details?.category || "",
          subject: row.details?.subject || "",
          updatedAt: row.details?.updatedAt || ""
        } as SupportTicket));
        return pgList;
      }
    } catch (dbErr: any) {
      console.error("⚠️ PostgreSQL error reading tickets; falling back to Firestore/local:", dbErr.message);
    }
  }

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

  // Sync support ticket to Supabase if configured
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    try {
      const sbObj = {
        id: ticket.id,
        title: ticket.title || ticket.subject || "",
        status: ticket.status || "جديد",
        courier_id: ticket.courierId || "",
        courier_name: ticket.courierName || "",
        created_at: ticket.createdAt || new Date().toISOString(),
        messages: ticket.messages || [],
        details: {
          courierPhone: ticket.courierPhone,
          category: ticket.category,
          subject: ticket.subject,
          updatedAt: ticket.updatedAt || new Date().toISOString()
        }
      };
      await callSupabase("support_tickets", "POST", sbObj);
      console.log(`Support ticket ${ticket.id} successfully synchronized to Supabase.`);
    } catch (err: any) {
      console.error("⚠️ Supabase REST error saving ticket:", err.message);
    }
  }

  // 2. Save to PostgreSQL if available
  if (pgPool) {
    try {
      await pgPool.query(
        `INSERT INTO support_tickets (
          id, title, status, courier_id, courier_name, created_at, messages, details
        ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb)
        ON CONFLICT (id) DO UPDATE SET
          title = $2, status = $3, courier_id = $4, courier_name = $5,
          created_at = $6, messages = $7::jsonb, details = $8::jsonb;`,
        [
          ticket.id,
          ticket.title || ticket.subject || "",
          ticket.status || "جديد",
          ticket.courierId || "",
          ticket.courierName || "",
          ticket.createdAt || new Date().toISOString(),
          JSON.stringify(ticket.messages || []),
          JSON.stringify({
            courierPhone: ticket.courierPhone,
            category: ticket.category,
            subject: ticket.subject,
            updatedAt: ticket.updatedAt || new Date().toISOString()
          })
        ]
      );
      console.log(`Support ticket ${ticket.id} synchronized to PostgreSQL.`);
    } catch (dbErr: any) {
      console.error("⚠️ PostgreSQL error saving ticket:", dbErr.message);
    }
  }

  // 3. Try Native Firestore Client first
  if (firestoreClient) {
    try {
      await firestoreClient.collection("support_tickets").doc(ticket.id).set(ticket);
      console.log(`Support ticket ${ticket.id} successfully saved to Native Cloud Firestore.`);
      return;
    } catch (sdkError: any) {
      console.warn("⚠️ Native Firestore SDK ticket save failed, trying REST API fallback...", sdkError.message);
    }
  }

  // 4. Fallback to Cloud Firestore REST API
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
    const { name, phone, city, experience, apps, nationalId, supervisorId, supervisorName, supervisorPhone } = req.body;

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
      supervisorId: supervisorId || "direct",
      supervisorName: supervisorName || "تسجيل مباشر (بدون مشرف)",
      supervisorPhone: supervisorPhone || "0599612490",
      agreementAccepted: false,
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

// 2.75 Look up courier by phone number or national ID (Restoring session / check status)
app.post("/api/couriers/lookup", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "الرجاء إدخال رقم الجوال أو رقم الهوية الوطنية للاستعلام" });
    }

    const cleanQuery = query.replace(/\s+/g, "").trim();
    if (!cleanQuery) {
      return res.status(400).json({ error: "الرجاء إدخال رقم استعلام صالح" });
    }

    const couriers = await readAllCouriers();
    const courier = couriers.find((c) => {
      const matchPhone = c.phone && c.phone.replace(/\s+/g, "").includes(cleanQuery);
      const matchNationalId = c.nationalId && c.nationalId.replace(/\s+/g, "").includes(cleanQuery);
      return matchPhone || matchNationalId;
    });

    if (!courier) {
      return res.status(404).json({ error: "لم نجد أي طلب تقديم مسجل بهذا الرقم. يرجى التأكد وإعادة المحاولة أو إنشاء طلب جديد." });
    }

    res.json({ success: true, courier });
  } catch (error: any) {
    res.status(500).json({ error: "فشل الاستعلام عن حالة الطلب: " + error.message });
  }
});

// 2.80 Get delivery apps with dynamic administrative overrides
async function readSettings(): Promise<Record<string, any>> {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    try {
      const sList = await callSupabase("app_settings", "GET");
      if (sList && Array.isArray(sList) && sList.length > 0) {
        const settingsMap: Record<string, any> = {};
        for (const row of sList) {
          settingsMap[row.key] = row.value;
        }
        return settingsMap;
      }
    } catch (err: any) {
      console.error("⚠️ Supabase error reading app settings:", err.message);
    }
  }

  const defaultSettings = {
    hungerstation: { id: "hungerstation", isAvailable: true, region: "مستوى المملكة", warningMessage: "" },
    toyou: { id: "toyou", isAvailable: true, region: "مستوى المملكة", warningMessage: "" },
    keeta: { id: "keeta", isAvailable: true, region: "مستوى المملكة", warningMessage: "" },
    thechefs: { id: "thechefs", isAvailable: true, region: "مستوى المملكة", warningMessage: "" },
    mrsool: { id: "mrsool", isAvailable: true, region: "مستوى المملكة", warningMessage: "" },
    jahez: { id: "jahez", isAvailable: true, region: "مستوى المملكة", warningMessage: "" }
  };

  if (pgPool) {
    try {
      const result = await pgPool.query("SELECT * FROM app_settings;");
      if (result.rows.length > 0) {
        const settingsMap: Record<string, any> = {};
        for (const row of result.rows) {
          settingsMap[row.key] = row.value;
        }
        return settingsMap;
      }
    } catch (dbErr: any) {
      console.error("⚠️ PostgreSQL error reading app settings:", dbErr.message);
    }
  }

  return readSettingsFile();
}

async function writeSettings(settings: Record<string, any>) {
  writeSettingsFile(settings);

  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    try {
      for (const [key, value] of Object.entries(settings)) {
        await callSupabase("app_settings", "POST", {
          key,
          value
        });
      }
    } catch (err: any) {
      console.error("⚠️ Supabase error writing app settings:", err.message);
    }
  }

  if (pgPool) {
    try {
      for (const [key, value] of Object.entries(settings)) {
        await pgPool.query(
          "INSERT INTO app_settings (key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO UPDATE SET value = $2::jsonb;",
          [key, JSON.stringify(value)]
        );
      }
      console.log("App settings synchronized to PostgreSQL.");
    } catch (dbErr: any) {
      console.error("⚠️ PostgreSQL error saving app settings:", dbErr.message);
    }
  }
}

async function getSupervisorsList(): Promise<any[]> {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    try {
      const sList = await callSupabase("supervisors", "GET");
      if (sList && Array.isArray(sList) && sList.length > 0) {
        return sList.map((r: any) => ({
          id: r.id,
          name: r.name,
          phone: r.phone,
          active: !!r.active
        }));
      }
    } catch (err: any) {
      console.error("⚠️ Supabase error reading supervisors:", err.message);
    }
  }

  if (pgPool) {
    try {
      const result = await pgPool.query("SELECT * FROM supervisors ORDER BY id ASC;");
      if (result.rows.length > 0) {
        return result.rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          phone: r.phone,
          active: !!r.active
        }));
      }
    } catch (dbErr: any) {
      console.error("⚠️ PostgreSQL error reading supervisors:", dbErr.message);
    }
  }

  try {
    if (!fs.existsSync(SUPERVISORS_FILE)) {
      const defaultSupervisors = [
        { id: "direct", name: "تسجيل مباشر (بدون مشرف)", phone: "0599612490", active: true },
        { id: "sup_1", name: "الأستاذ أحمد (مشرف المنطقة الشرقية)", phone: "0599612490", active: true },
        { id: "sup_2", name: "الأستاذ خالد (مشرف الوسطى والرياض)", phone: "0599612490", active: true },
        { id: "sup_3", name: "الأستاذ محمد (مشرف الغربية وجدة)", phone: "0599612490", active: true }
      ];
      fs.writeFileSync(SUPERVISORS_FILE, JSON.stringify(defaultSupervisors, null, 2), "utf8");
      return defaultSupervisors;
    }
    const supContent = fs.readFileSync(SUPERVISORS_FILE, "utf8");
    return supContent ? JSON.parse(supContent) : [];
  } catch (parseErr) {
    console.warn("⚠️ Error parsing supervisors file.", parseErr);
    return [];
  }
}

async function saveSupervisorsList(supervisors: any[]): Promise<void> {
  try {
    fs.writeFileSync(SUPERVISORS_FILE, JSON.stringify(supervisors, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing supervisors file:", err);
  }

  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    try {
      for (const sup of supervisors) {
        await callSupabase("supervisors", "POST", {
          id: sup.id,
          name: sup.name,
          phone: sup.phone,
          active: typeof sup.active === "boolean" ? sup.active : true
        });
      }
      const currentIds = supervisors.map(s => s.id);
      const allSups = await callSupabase("supervisors", "GET");
      if (allSups && Array.isArray(allSups)) {
        for (const existing of allSups) {
          if (!currentIds.includes(existing.id) && existing.id !== "direct") {
            await callSupabase("supervisors", "DELETE", null, `id=eq.${existing.id}`);
          }
        }
      }
    } catch (err: any) {
      console.error("⚠️ Supabase error synchronizing supervisors:", err.message);
    }
  }

  if (pgPool) {
    try {
      for (const sup of supervisors) {
        await pgPool.query(
          "INSERT INTO supervisors (id, name, phone, active) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET name = $2, phone = $3, active = $4;",
          [sup.id, sup.name, sup.phone, typeof sup.active === "boolean" ? sup.active : true]
        );
      }
      
      const ids = supervisors.map(s => s.id);
      if (ids.length > 0) {
        await pgPool.query("DELETE FROM supervisors WHERE id NOT IN (" + ids.map((_, i) => `$${i + 1}`).join(",") + ") AND id != 'direct';", ids);
      }
    } catch (dbErr: any) {
      console.error("⚠️ PostgreSQL error saving supervisors:", dbErr.message);
    }
  }
}

app.get("/api/delivery-apps", async (req, res) => {
  try {
    const settings = await readSettings();
    // Static app descriptions from list, client will consume these merged
    const staticApps = [
      { id: "hungerstation", name: "هنقرستيشن (Hungerstation)", description: "برنامج بوارق الحصري لربط حسابات هنقرستيشن مباشرة وتوزيع الطلبات بنسب تشغيلية مريحة.", logo: "🚚", color: "from-amber-500 to-amber-600" },
      { id: "toyou", name: "تويو (ToYou)", description: "تفعيل مباشر لكود كابتن تويو على مستوى المملكة مع دعم فني أسبوعي متكامل.", logo: "⚡", color: "from-cyan-400 to-cyan-500" },
      { id: "keeta", name: "كيتا (Keeta)", description: "الانضمام لبرنامج كابتن كيتا المعتمد بامتيازات وحوافز وحصانة من الغرامات لشركاء بوارق.", logo: "📦", color: "from-emerald-400 to-emerald-500" },
      { id: "thechefs", name: "ذا شفز (The Chefs)", description: "توزيع وجبات وحلويات فاخرة بمناطق تشغيلية ممتازة ومعدلات ربح مميزة.", logo: "🧁", color: "from-purple-400 to-pink-500" },
      { id: "mrsool", name: "مرسول (Mrsool)", description: "عمل مرن وحر للغاية لتوصيل أي شيء في أي وقت لأكثر من 5 ملايين مستخدم نشط بالمملكة.", logo: "🦅", color: "from-blue-400 to-indigo-500" },
      { id: "jahez", name: "جاهز (Jahez)", description: "الكود الأكثر طلباً، تفعيل مباشر مع بوارق الشرق وحقائب حرارية مطابقة للمواصفات ونسبة عمولة ثابتة ومنافسة.", logo: "🎯", color: "from-rose-400 to-orange-500" }
    ];

    const mergedApps = staticApps.map((app) => {
      const override = settings[app.id] || { isAvailable: true, region: "مستوى المملكة", warningMessage: "" };
      const explicitAvailable = override.isAvailable === true || override.isAvailable === "true" || override.isAvailable === undefined;
      return {
        ...app,
        isAvailable: explicitAvailable,
        region: override.region || "مستوى المملكة",
        warningMessage: override.warningMessage || ""
      };
    });

    res.json({ success: true, apps: mergedApps });
  } catch (error: any) {
    res.status(500).json({ error: "فشل جلب تطبيقات التوصيل: " + error.message });
  }
});

// 2.85 Save/Update delivery app settings (Admin panel action)
app.post("/api/admin/update-app-settings", async (req, res) => {
  try {
    const { password, id, isAvailable, region, warningMessage } = req.body;
    if (password !== "bawariq2026") {
      return res.status(403).json({ error: "عذراً، الرمز السري بغير محلّه المصرح به لـ بوارق" });
    }

    if (!id) {
      return res.status(400).json({ error: "الرجاء تحديد معرف التطبيق لتعديله" });
    }

    const settings = await readSettings();
    settings[id] = {
      id,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      region: region || "مستوى المملكة",
      warningMessage: warningMessage || ""
    };

    await writeSettings(settings);
    res.json({ success: true, settings: settings[id] });
  } catch (error: any) {
    res.status(500).json({ error: "فشل تحديث إعدادات التطبيق: " + error.message });
  }
});

// --- Supervisors Manager APIs ---

// 1. Get all supervisors
app.get("/api/supervisors", async (req, res) => {
  try {
    const supervisors = await getSupervisorsList();
    res.json(supervisors);
  } catch (error: any) {
    res.status(500).json({ error: "فشل جلب قائمة المشرفين: " + error.message });
  }
});

// 2. Admin add supervisor
app.post("/api/admin/supervisors/add", async (req, res) => {
  try {
    const { password, name, phone } = req.body;
    if (password !== "bawariq2026") {
      return res.status(403).json({ error: "الرمز السري للإدارة غير صحيح" });
    }
    if (!name) {
      return res.status(400).json({ error: "الرجاء إدخال اسم المشرف" });
    }

    const supervisors = await getSupervisorsList();

    const newSupervisor = {
      id: "sup_" + Date.now().toString(),
      name: String(name).trim(),
      phone: phone ? String(phone).trim() : "0599612490",
      active: true
    };

    supervisors.push(newSupervisor);
    await saveSupervisorsList(supervisors);
    res.json({ success: true, supervisor: newSupervisor, supervisors });
  } catch (error: any) {
    res.status(500).json({ error: "فشل إضافة المشرف: " + error.message });
  }
});

// 3. Admin delete supervisor
app.post("/api/admin/supervisors/delete", async (req, res) => {
  try {
    const { password, id } = req.body;
    if (password !== "bawariq2026") {
      return res.status(403).json({ error: "الرمز السري للإدارة غير صحيح" });
    }
    if (!id) {
       return res.status(400).json({ error: "الرجاء تحديد معرّف المشرف لحذفه" });
    }
    if (id === "direct") {
      return res.status(400).json({ error: "لا يمكن حذف مشرف المتابعة المباشرة الأساسي" });
    }

    let supervisors = await getSupervisorsList();
    supervisors = supervisors.filter((s: any) => s.id !== id);
    await saveSupervisorsList(supervisors);
    res.json({ success: true, supervisors });
  } catch (error: any) {
    res.status(500).json({ error: "فشل حذف المشرف: " + error.message });
  }
});

// --- Agreement Accepts APIs ---
app.post("/api/agreement/accept", async (req, res) => {
  try {
    const { courierId, signature } = req.body;
    if (!courierId) {
      return res.status(400).json({ error: "الرجاء توفير معرّف المندوب" });
    }

    const couriers = await readAllCouriers();
    const index = couriers.findIndex((c) => c.id === courierId);

    if (index === -1) {
      return res.status(404).json({ error: "طلب المندوب المطلوب غير موجود" });
    }

    // Set agreement as accepted
    couriers[index].agreementAccepted = true;
    couriers[index].agreementAcceptedAt = new Date().toISOString();
    if (signature) {
      couriers[index].agreementSignature = signature;
    }

    console.log(`Courier ${couriers[index].name} accepted the work agreement with signature: ${signature}`);

    await saveCourier(couriers[index]);

    res.json({ success: true, courier: couriers[index] });
  } catch (error: any) {
    res.status(500).json({ error: "فشل توثيق اتفاقية العمل: " + error.message });
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
      "المشرف المتابع للطلب",
      "حالة اتفاقية العمل الرسمية",
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

      const agreementStatus = c.agreementAccepted 
        ? `موافق وموثق (${c.agreementAcceptedAt ? new Date(c.agreementAcceptedAt).toLocaleDateString("ar-SA") : ""})`
        : "بانتظار الموافقة والتوقيع";

      const row = [
        escapeCsv(c.id),
        escapeCsv(c.name),
        escapeCsv(c.phone),
        escapeCsv(c.city),
        escapeCsv(appStr),
        escapeCsv(c.experience),
        escapeCsv(c.status || "جديد"),
        escapeCsv(c.supervisorName || "تنظيم مباشر (بدون مشرف)"),
        escapeCsv(agreementStatus),
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
  // Restore all caches from Supabase tables on boot
  try {
    await restoreAllDataFromSupabase();
  } catch (syncErr: any) {
    console.error("⚠️ Background data restoration warning:", syncErr.message);
  }

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
      if (req.url.startsWith("/api/")) {
        return res.status(404).json({ success: false, error: "API Route not found / مسار برمجية الربط غير موجود" });
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } else {
    console.log("ℹ️ Serverless mode active on Vercel. Skipping app.listen().");
  }
}

start();

export default app;
