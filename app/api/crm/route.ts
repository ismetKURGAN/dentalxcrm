import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { LabelConfig } from "../settings/labels/route";
import { getAllCustomersFull, getCustomerById, upsertCustomer, deleteCustomer, findDuplicate } from "../lib/sqlite-customers";
import { detectCountryFromPhone } from "../lib/phone-country";
import { sendSatisMail, sendVisitMail } from "../lib/notify-mail";

// Veri dosyasının yolu
const CAMPAIGNS_DB_PATH = path.join(process.cwd(), "campaigns.json");
const LABELS_PATH = path.join(process.cwd(), "labels.json");
const AUTOMATION_CATEGORIES_PATH = path.join(process.cwd(), "data", "categories.json");

// --- YARDIMCI FONKSİYONLAR ---

const CORS_ORIGINS = [
  "https://dentalxturkey.com",
  "https://www.dentalxturkey.com",
];

function withCors(res: NextResponse, request?: Request): NextResponse {
  try {
    const origin = request?.headers.get("origin") || "";
    const allowedOrigin = CORS_ORIGINS.includes(origin) ? origin : "*";
    res.headers.set("Access-Control-Allow-Origin", allowedOrigin);
    res.headers.set(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS"
    );
    res.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );
    res.headers.set("Access-Control-Allow-Credentials", "true");
  } catch (e) {
    // sessizce geç
  }
  return res;
}

// --- ETIKET (LABEL) DESTEGI ---

function readLabelsSafe(): LabelConfig[] {
  try {
    if (!fs.existsSync(LABELS_PATH)) {
      return [];
    }
    const raw = fs.readFileSync(LABELS_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as LabelConfig[];
  } catch (e) {
    console.error("labels.json okunamadı", e);
    return [];
  }
}

// Uygulama içi API çağrıları (örn. /api/wp/messages) için temel URL
// Geliştirmede localhost:3000, production'da ise ortam değişkeni ile ayarlanabilir
const INTERNAL_BASE_URL =
  process.env.NEXT_INTERNAL_BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "http://localhost:3000";

function findActiveLabelForCategory(categoryId?: string | null): LabelConfig | null {
  if (!categoryId) return null;

  const labels = readLabelsSafe().filter((l) => l && l.active);
  if (!labels.length) return null;

  // Hızlı erişim için categoryId -> label map'i
  const labelMap = new Map<string, LabelConfig>();
  for (const l of labels) {
    if (l.categoryId) {
      labelMap.set(l.categoryId, l);
    }
  }

  // Önce doğrudan leaf categoryId için bak
  if (labelMap.has(categoryId)) {
    console.log("[CRM] Etiket bulundu (doğrudan eşleşme):", labelMap.get(categoryId)!.title, "categoryId:", categoryId);
    return labelMap.get(categoryId)!;
  }

  // Birleşik kategori haritası oluştur (önce otomasyon kategorileri, sonra campaigns)
  const combinedCategoryMap = new Map<string, any>();
  
  // Otomasyon kategorilerini ekle (data/categories.json)
  try {
    const automationCategoriesPath = path.join(process.cwd(), "data", "categories.json");
    if (fs.existsSync(automationCategoriesPath)) {
      const automationCategories = JSON.parse(fs.readFileSync(automationCategoriesPath, "utf-8"));
      for (const c of automationCategories as any[]) {
        if (c && typeof c.id === "string") {
          combinedCategoryMap.set(c.id, c);
        }
      }
    }
  } catch (e) {
    console.error("Otomasyon kategorileri okunamadı", e);
  }
  
  // Campaigns'i ekle (campaigns.json)
  const campaigns = getCampaignsSafe();
  for (const c of campaigns as any[]) {
    if (c && typeof c.id === "string") {
      // Otomasyon kategorisinde yoksa ekle
      if (!combinedCategoryMap.has(c.id)) {
        combinedCategoryMap.set(c.id, c);
      }
    }
  }

  let currentId: string | undefined | null = categoryId;
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const camp = combinedCategoryMap.get(currentId);
    if (!camp) break;

    const parentId: string | undefined = camp.parentId;
    const topParent: string | undefined = camp.topParent;

    // Önce parentId için etiket var mı bak
    if (parentId && labelMap.has(parentId)) {
      console.log("[CRM] Etiket bulundu (parent eşleşme):", labelMap.get(parentId)!.title, "parentId:", parentId);
      return labelMap.get(parentId)!;
    }

    // Sonra topParent için etiket var mı bak
    if (topParent && labelMap.has(topParent)) {
      console.log("[CRM] Etiket bulundu (topParent eşleşme):", labelMap.get(topParent)!.title, "topParent:", topParent);
      return labelMap.get(topParent)!;
    }

    // Yukarı çıkmaya devam et (öncelik parentId, yoksa topParent)
    currentId = parentId || topParent || null;
  }

  return null;
}

function pickAdvisorFromLabel(label: LabelConfig | null): string | undefined {
  if (!label || !Array.isArray(label.advisors)) return undefined;
  const list = label.advisors.filter(Boolean);
  if (!list.length) return undefined;
  
  // Etiket bazlı round-robin: Her etiket için ayrı index tut
  try {
    const labelsPath = path.join(process.cwd(), "labels.json");
    if (!fs.existsSync(labelsPath)) return list[0];
    
    const raw = fs.readFileSync(labelsPath, "utf-8");
    const labels = JSON.parse(raw);
    const labelIndex = labels.findIndex((l: any) => l && l.id === label.id);
    
    if (labelIndex === -1) return list[0];
    
    const currentLabel = labels[labelIndex];
    let lastIndex = typeof currentLabel.lastAssignedIndex === "number" ? currentLabel.lastAssignedIndex : -1;
    const nextIndex = (lastIndex + 1) % list.length;
    const advisorName = list[nextIndex];
    
    // Index'i güncelle ve kaydet
    currentLabel.lastAssignedIndex = nextIndex;
    labels[labelIndex] = currentLabel;
    fs.writeFileSync(labelsPath, JSON.stringify(labels, null, 2), "utf-8");
    
    return advisorName;
  } catch (e) {
    console.error("Etiket bazlı round-robin hatası:", e);
    // Hata durumunda ilk danışmanı döndür
    return list[0];
  }
}

function getCampaignsSafe() {
  try {
    if (!fs.existsSync(CAMPAIGNS_DB_PATH)) {
      return [];
    }
    const raw = fs.readFileSync(CAMPAIGNS_DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("campaigns.json okunamadı", e);
    return [];
  }
}

// Otomasyon kategorilerini oku (data/categories.json)
function getAutomationCategoriesSafe() {
  try {
    if (!fs.existsSync(AUTOMATION_CATEGORIES_PATH)) {
      return [];
    }
    const raw = fs.readFileSync(AUTOMATION_CATEGORIES_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("data/categories.json okunamadı", e);
    return [];
  }
}

// Kategori hiyerarşisini oluştur (parent'ları takip ederek)
function buildCategoryHierarchy(category: any) {
  if (!category) return null;
  
  const allCategories = [...getAutomationCategoriesSafe(), ...getCampaignsSafe()];
  const hierarchy: string[] = [];
  let current = category;
  
  // Maksimum 10 seviye (sonsuz döngü önlemi)
  for (let i = 0; i < 10 && current; i++) {
    const categoryName = current.name || current.title || '';
    if (categoryName) {
      hierarchy.unshift(categoryName); // Başa ekle
    }
    
    // Parent'ı bul
    if (current.parentId) {
      current = allCategories.find((c: any) => c.id === current.parentId);
    } else {
      break;
    }
  }
  
  return {
    fullPath: hierarchy.join(' > '),
    topParent: category.topParent || category.parent || '',
    level1: hierarchy[0] || category.topParent || category.parent || '',
    level2: hierarchy[1] || '',
    level3: hierarchy[2] || '',
    level4: hierarchy[3] || '',
    level5: hierarchy[4] || hierarchy[hierarchy.length - 1] || '',
    leafCategory: hierarchy[hierarchy.length - 1] || category.name || category.title || ''
  };
}

function findCampaignByLeadFormId(leadFormId?: string | null) {
  if (!leadFormId) return null;
  
  // Önce otomasyon kategorilerinde ara (data/categories.json) - öncelikli
  const automationCategories = getAutomationCategoriesSafe();
  const automationMatch = automationCategories.find(
    (c: any) =>
      c &&
      typeof c.leadFormId === "string" &&
      c.leadFormId.trim() !== "" &&
      c.leadFormId !== "0" &&
      c.leadFormId === leadFormId
  );
  
  if (automationMatch) {
    console.log("[CRM] Lead Form ID eşleşmesi bulundu (otomasyon kategorileri):", automationMatch.name, "leadFormId:", leadFormId);
    return automationMatch;
  }
  
  // Bulunamazsa campaigns.json'da ara (geriye uyumluluk için)
  const items = getCampaignsSafe();
  const campaignMatch = items.find(
    (c: any) =>
      c &&
      typeof c.leadFormId === "string" &&
      c.leadFormId.trim() !== "" &&
      c.leadFormId !== "0" &&
      c.leadFormId === leadFormId
  );
  
  if (campaignMatch) {
    console.log("[CRM] Lead Form ID eşleşmesi bulundu (campaigns):", campaignMatch.name || campaignMatch.title, "leadFormId:", leadFormId);
  }
  
  return campaignMatch || null;
}

// getCustomers artık SQLite'dan okuyor (getAllCustomersFull)

// --- OTOMATIK KARŞILAMA MESAJI ---

// Basit telefon normalizasyonu (check-reminders ile uyumlu)
function normalizePhone(value: string | undefined | null): string {
  if (!value) return "";
  let digits = String(value).replace(/\D/g, "");

  // Zaten 90..., 44... gibi ülke kodu ile başlıyorsa dokunma
  if (digits.startsWith("90") || digits.startsWith("44")) {
    return digits;
  }

  // TR mobil: 05xxxxxxxxx → 905xxxxxxxxx (sadece baştaki 0'ı at)
  if (digits.length === 11 && digits.startsWith("05")) {
    return `90${digits.slice(1)}`;
  }

  // TR mobil: 5xxxxxxxxx → 905xxxxxxxxx
  if (digits.length === 10 && digits.startsWith("5")) {
    return `90${digits}`;
  }

  // UK mobil: 07xxxxxxxxx → 447xxxxxxxxx
  if (digits.length === 11 && digits.startsWith("07")) {
    return `44${digits.slice(1)}`;
  }

  // UK mobil: 7xxxxxxxxx → 447xxxxxxxxx
  if (digits.length === 10 && digits.startsWith("7")) {
    return `44${digits}`;
  }

  // Diğer durumlarda olduğu gibi bırak
  return digits;
}

type SupportedLang =
  | "en"
  | "fr"
  | "pl"
  | "hr"
  | "ro"
  | "bg"
  | "ru"
  | "fa" // Farsça
  | "ar" // Arapça
  | "unknown";

// Category (kampanya adı) içinden dil tahmini
function detectLanguageFromCategory(categoryRaw: string | undefined): SupportedLang {
  if (!categoryRaw) return "unknown";
  const category = categoryRaw.toLowerCase();

  // Farsça kampanyalar (Moon Farsça, Xirtiz Farsça vb.)
  if (category.includes("farsç")) return "fa";

  // Arapça kampanyalar
  if (category.includes("arapç")) return "ar";
  if (category.includes("lehçe") || category.includes("polony")) return "pl";
  if (category.includes("fince") || category.includes("helsinki")) return "fi" as SupportedLang; // şablon yok, atlamamız için unknown'a döneceğiz
  if (category.includes("almanca") || category.includes("germany")) return "de" as SupportedLang; // şablon yok
  if (category.includes("rus")) return "ru";

  // Default: İngilizce varsayalım (İngiltere, Belfast, Dublin vb.)
  if (
    category.includes("ingilizce") ||
    category.includes("ingiltere") ||
    category.includes("belfast") ||
    category.includes("dublin") ||
    category.includes("edin") ||
    category.includes("scotland")
  ) {
    return "en";
  }

  // Tanımsız diller için unknown dön; getWelcomeTemplate bunlar için İngilizce dönecek
  return "unknown";
}

type WelcomeTemplate = {
  session: string; // Hangi Waha oturumu, şimdilik "default"
  text: string;    // {name} ve {user} placeholder'ları içerebilir
};

function getDefaultWhatsappSession(): string {
  try {
    const settingsPath = path.join(process.cwd(), "settings.json");
    if (!fs.existsSync(settingsPath)) return "default";
    const raw = fs.readFileSync(settingsPath, "utf-8");
    const json = JSON.parse(raw);
    const ws = json.whatsappSettings || {};
    return ws.defaultSession || "default";
  } catch (e) {
    console.error("whatsappSettings.defaultSession okunamadı", e);
    return "default";
  }
}

function getWhatsappSessionForAdvisor(advisorName?: string): string {
  if (!advisorName) return getDefaultWhatsappSession();

  try {
    const usersPath = path.join(process.cwd(), "users.json");
    if (!fs.existsSync(usersPath)) return getDefaultWhatsappSession();

    const raw = fs.readFileSync(usersPath, "utf-8");
    const users = JSON.parse(raw) as Array<{ name?: string; session?: string }>;

    const found = users.find(
      (u) => u.name && u.name.toLowerCase() === advisorName.toLowerCase()
    );

    // Session alanı varsa ve boş değilse kullan, yoksa default'a düş
    if (found?.session && typeof found.session === "string" && found.session.trim() !== "") {
      console.log(`[WhatsApp Session] ${advisorName} için session: ${found.session}`);
      return found.session;
    }

    console.log(`[WhatsApp Session] ${advisorName} için session bulunamadı, default kullanılıyor`);
    return getDefaultWhatsappSession();
  } catch (e) {
    console.error("getWhatsappSessionForAdvisor hatası", e);
    return getDefaultWhatsappSession();
  }
}

function getWelcomeTemplate(
  lang: SupportedLang,
  advisorName?: string
): WelcomeTemplate | null {
  // Danışmana özel WhatsApp oturumu; yoksa default
  const session = getWhatsappSessionForAdvisor(advisorName);
  switch (lang) {
    case "fa":
      return {
        session,
        text:
          "سلام {name}! من صادق از *Xirtiz Dental Turkey* هستم.\nدرخواست شما برای درمان دندان را دریافت کردم و خوشحال می‌شوم در مسیر درمانتان همراهتان باشم.🦷😊\nمایل هستید چه نوع درمانی انجام دهید؟",
      };
    case "ar":
      return {
        session,
        text:
          "السلام عليكم، أنا عبد الحكيم من Xirtiz Luxury Health Tourism.\nشكرًا لزيارتك صفحتنا.\nهل ترغب في معرفة المزيد عن زراعة الشعر أو علاج الأسنان؟\nأنا هنا لمساعدتك، هل تفضل التواصل عبر الرسائل أم اتصال هاتفي؟",
      };
    case "ru":
      return {
        session,
        text:
          "Здравствуйте! Я {user}  из стоматологической клиники *Xirtiz Dental Turkey.* Я получила ваш запрос на лечение зубов.\nЯ буду рада помочь вам на вашем пути к стоматологическому лечению.",
      };
    case "pl":
      return {
        session,
        text:
          "Cześć, {name}! Nazywam się {user} i reprezentuję *Xirtiz Dental w Turcji.* Otrzymałem Twoją prośbę o leczenie stomatologiczne.\nChętnie pomogę Ci w Twojej podróży stomatologicznej.\nJakim rodzajem leczenia jesteś zainteresowany?",
      };
    case "en":
    default:
      // Özel şablonu olmayan diller için İngilizce metni fallback olarak kullan
      return {
        session,
        text:
          "Hello, {name}! I’m {user} from *Xirtiz Dental Turkey.* I got your request for dental treatment.\nI would be happy to help you through your dental journey.\nWhat kind of treatment are you interested in?",
      };
  }
}

async function sendAutoWelcomeIfPossible(customer: any) {
  // noAutoWelcome flag'i varsa karşılama mesajı gönderme
  if (customer.noAutoWelcome) {
    console.log("[crm:auto-welcome] Müşteri noAutoWelcome flag'i ile işaretli, mesaj gönderilmedi");
    return;
  }

  const rawPhone = customer.phone || customer.personal?.phone;
  const phone = normalizePhone(rawPhone);
  if (!phone) {
    console.log("[crm:auto-welcome] Telefon numarası bulunamadı, mesaj gönderilmedi");
    return;
  }

  const category = customer.category || customer.personal?.facebook?.campaignName;
  const lang = detectLanguageFromCategory(category);
  const advisorName = customer.advisor || customer.personal?.advisor;
  const tpl = getWelcomeTemplate(lang, advisorName);
  
  if (!tpl) {
    console.log("[crm:auto-welcome] Bu dil için şablon bulunamadı:", lang);
    return;
  }

  const name = customer.name || customer.personal?.name || "";
  const user = customer.advisor || "Xirtiz Health";

  console.log("[crm:auto-welcome] Karşılama mesajı gönderiliyor:", {
    customerName: name,
    category,
    detectedLang: lang,
    advisorName,
    session: tpl.session,
    phone,
  });

  const text = tpl.text
    .replace(/{name}/g, name || "friend")
    .replace(/{user}/g, user);

  try {
    const payload = {
      instance_name: tpl.session,
      remote_jid: phone,
      message_body: text,
      from_me: true,
    };

    console.log("[crm:auto-welcome] Payload hazırlandı:", { 
      instance_name: payload.instance_name, 
      remote_jid: payload.remote_jid,
      message_preview: text.substring(0, 50) + "..."
    });

    const response = await fetch(`${INTERNAL_BASE_URL.replace(/\/$/, "")}/api/wp/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const respText = await response.text();
    console.log("[crm:auto-welcome] Evolution API response", response.status, respText.substring(0, 200));
    
    if (!response.ok) {
      console.error("[crm:auto-welcome] Mesaj gönderilemedi! Status:", response.status);
    } else {
      console.log("[crm:auto-welcome] ✓ Mesaj başarıyla gönderildi");
    }
  } catch (e) {
    console.error("[crm:auto-welcome] WhatsApp gönderim hatası:", e);
  }
}

// Etiket bazlı karşılama mesajı (etiketteki dil ve metni kullanır)
async function sendAutoWelcomeByLabelIfPossible(
  customer: any,
  label: LabelConfig
) {
  // noAutoWelcome flag'i varsa karşılama mesajı gönderme
  if (customer.noAutoWelcome) {
    console.log("[crm:auto-welcome:label] Müşteri noAutoWelcome flag'i ile işaretli, mesaj gönderilmedi");
    return;
  }

  const rawPhone = customer.phone || customer.personal?.phone;
  const phone = normalizePhone(rawPhone);
  if (!phone) return;

  const advisorName = customer.advisor || customer.personal?.advisor;
  const session = getWhatsappSessionForAdvisor(advisorName);

  const name = customer.name || customer.personal?.name || "";
  const user = advisorName || "Xirtiz Health";
  const category =
    customer.category || customer.personal?.facebook?.campaignName || "";
  const language = label.language || "";

  const text = (label.message || "")
    .replace(/{name}/g, name || "friend")
    .replace(/{user}/g, user)
    .replace(/{category}/g, category || "-")
    .replace(/{language}/g, language || "");

  if (!text.trim()) return;

  try {
    const payload = {
      instance_name: session,
      remote_jid: phone,
      message_body: text,
      from_me: true,
    };

    const response = await fetch(`${INTERNAL_BASE_URL.replace(/\/$/, "")}/api/wp/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const respText = await response.text();
    console.log("[crm:auto-welcome:label] Evolution API response", response.status, respText);
  } catch (e) {
    console.error("[crm:auto-welcome:label] WhatsApp gönderim hatası:", e);
  }
}

// Yeni lead oluşturulduğunda ilgili danışmana Evolution API üzerinden WhatsApp bildirimi gönder
async function sendAdvisorLeadNotificationIfPossible(customer: any) {
  try {
    const advisorName = customer.advisor;
    if (!advisorName) return;

    const usersPath = path.join(process.cwd(), "users.json");
    if (!fs.existsSync(usersPath)) return;

    const raw = fs.readFileSync(usersPath, "utf-8");
    const users = JSON.parse(raw) as Array<{
      name?: string;
      session?: string;
      phone?: string;
    }>;

    const advisor = users.find(
      (u) => u.name && u.name.toLowerCase() === advisorName.toLowerCase()
    );
    if (!advisor) {
      console.warn("[crm:advisor-notify] Danışman users.json içinde bulunamadı:", advisorName);
      return;
    }

    const rawPhone = advisor.phone;
    const phone = normalizePhone(rawPhone);
    if (!phone) {
      console.warn("[crm:advisor-notify] Danışman telefonu geçersiz:", advisorName);
      return;
    }

    // Evolution'daki "admin" session'ını kullan
    const instanceName = "admin";

    const customerName = customer.name || customer.personal?.name || "-";
    const customerPhone =
      customer.phone || customer.personal?.phone || "-";
    const category = customer.category || customer.personal?.facebook?.campaignName || "-";
    const status =
      (customer.status && customer.status.status) || customer.status || "-";
    const whatsappNum =
      customer.whatsappNumber ||
      customer.personal?.whatsappNumber ||
      customer["jaki_jest_twoj_numer_whatsapp"] ||
      "";

    const text =
      "📥 *Yeni Lead Atandı*\n\n" +
      `🧑‍💼 Danışman: ${advisorName}\n` +
      `👤 Müşteri: ${customerName}\n` +
      `📱 Müşteri Tel: ${customerPhone}\n` +
      (whatsappNum ? `� Notlar: ${whatsappNum}\n` : "") +
      `🏷 Kategori: ${category}\n` +
      `📌 Durum: ${status}`;

    const payload = {
      instance_name: instanceName,
      remote_jid: phone,
      message_body: text,
      from_me: true,
    };

    const response = await fetch(`${INTERNAL_BASE_URL.replace(/\/$/, "")}/api/wp/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const respText = await response.text();
    console.log(
      "[crm:advisor-notify] Evolution API response",
      response.status,
      respText
    );
  } catch (e) {
    console.error("[crm:advisor-notify] WhatsApp bildirimi hatası:", e);
  }
}

// saveCustomers kaldırıldı — artık doğrudan SQLite'a yazılıyor (upsertCustomer)

function pickAdvisorForNewLead(): string | undefined {
  try {
    const settingsPath = path.join(process.cwd(), "settings.json");
    if (!fs.existsSync(settingsPath)) return undefined;
    const raw = fs.readFileSync(settingsPath, "utf-8");
    const json = JSON.parse(raw);
    const la = json.leadAssignment;
    if (!la || !Array.isArray(la.advisors) || la.advisors.length === 0) return undefined;

    const active = la.advisors.filter((a: any) => a && a.active && a.name);
    if (active.length === 0) return undefined;

    const strategy = la.strategy || "sequential";
    if (strategy !== "sequential") {
      // Şimdilik sadece sıralı, diğer stratejiler ileride
      la.strategy = "sequential";
    }

    let idx = typeof la.lastAssignedIndex === "number" ? la.lastAssignedIndex : -1;
    const nextIdx = (idx + 1) % active.length;
    const advisorName = active[nextIdx].name as string;

    la.lastAssignedIndex = nextIdx;
    json.leadAssignment = la;
    fs.writeFileSync(settingsPath, JSON.stringify(json, null, 2), "utf-8");

    return advisorName;
  } catch (e) {
    console.error("Lead atama stratejisi okunamadı", e);
    return undefined;
  }
}

// --- API METOTLARI ---

// GET: Hepsini Getir (Pagination destekli)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const noPagination = searchParams.get("all") === "true"; // ?all=true ile tüm veriyi al

    const customers = getAllCustomersFull();
    // SQLite zaten createdAt DESC sıralı döndürüyor

    // Pagination olmadan tüm veriyi döndür
    if (noPagination) {
      return withCors(NextResponse.json(customers), request);
    }

    // Pagination uygula
    const total = customers.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedCustomers = customers.slice(start, end);

    const response = {
      data: paginatedCustomers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    return withCors(NextResponse.json(response), request);
  } catch (error) {
    return withCors(
      NextResponse.json({ error: "Veri okunamadı" }, { status: 500 }),
      request
    );
  }
}

// POST: Yeni Müşteri Ekle
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Mükerrer kontrolü (SQLite)
    const incomingEmail = (body.email || body.personal?.email || "").trim().toLowerCase();
    const incomingPhone = (body.phone || body.personal?.phone || "").replace(/\D/g, "");
    
    // Zapier'den gelen leadFormId üzerinden kampanya/kategori eşlemesi
    const flatLeadFormId = (body as any)["personal.facebook.leadFormId"];
    const incomingLeadFormId = body?.personal?.facebook?.leadFormId ?? flatLeadFormId;
    
    // Zapier/lead mi yoksa manuel ekleme mi kontrol et
    const isFromZapier = body.source === "zapier" || body.source === "facebook" || !!incomingLeadFormId;
    
    if (incomingEmail || incomingPhone) {
      const duplicate = findDuplicate(incomingEmail, body.phone || body.personal?.phone || "");

      if (duplicate) {
        const duplicateInfo = {
          existingId: duplicate.id,
          existingName: duplicate.name,
          existingEmail: duplicate.email,
          existingPhone: duplicate.phone,
          incomingName: body.name || body.personal?.name,
          incomingEmail: incomingEmail,
          incomingPhone: body.phone || body.personal?.phone,
        };
        
        console.log("[CRM] Mükerrer müşteri tespit edildi:", JSON.stringify(duplicateInfo, null, 2));
        
        if (isFromZapier) {
          console.log("[CRM] Zapier lead mükerrer - kayıt atlandı");
          return withCors(
            NextResponse.json({ 
              error: "duplicate", 
              message: "Bu müşteri zaten mevcut",
              duplicate: duplicateInfo 
            }, { status: 409 }),
            request
          );
        } else {
          return withCors(
            NextResponse.json({ 
              error: "duplicate", 
              message: "Bu e-posta veya telefon numarası ile kayıtlı müşteri zaten mevcut",
              duplicate: duplicateInfo 
            }, { status: 409 }),
            request
          );
        }
      }
    }

    const matchedCampaign = findCampaignByLeadFormId(incomingLeadFormId);

    // Kategoriye göre aktif etiket bul (varsa)
    const matchedLabel = matchedCampaign
      ? findActiveLabelForCategory(matchedCampaign.id)
      : null;

    let advisor = body.advisor;
    if (!advisor) {
      // Önce etikette tanımlı danışman(lar)dan birini dene, yoksa global round-robin'e düş
      advisor = pickAdvisorFromLabel(matchedLabel) || pickAdvisorForNewLead() || body.advisor;
    }

    // Zapier'dan gelen WhatsApp numarasını status.notes'a ekle
    const whatsappNumber = body.whatsappNumber || body.personal?.whatsappNumber || body["jaki_jest_twoj_numer_whatsapp"];
    const statusNotes = whatsappNumber ? `WhatsApp: ${whatsappNumber}` : "";

    // Status alanını düzgün şekilde ayarla - default "Yeni Form"
    const incomingStatus = typeof body.status === "string" ? body.status : (body.status?.status || "Yeni Form");
    
    // Kategori hiyerarşisini oluştur
    const categoryHierarchy = matchedCampaign ? buildCategoryHierarchy(matchedCampaign) : null;
    
    // Kategori bilgilerini al
    const categoryName = categoryHierarchy?.leafCategory || matchedCampaign?.name || matchedCampaign?.title || body.category || '';
    const topParentName = categoryHierarchy?.topParent || matchedCampaign?.topParent || matchedCampaign?.parent || '';
    
    const incomingCategory = categoryName;
    const incomingServices = body.service || body.services || '';

    // Telefon numarasından ülke otomatik tespiti
    const incomingPhoneRaw = body.phone || body.personal?.phone || "";
    const detectedCountry = !body.country && incomingPhoneRaw
      ? detectCountryFromPhone(incomingPhoneRaw)
      : null;

    const newCustomer = {
      ...body,
      advisor,
      country: body.country || detectedCountry || body.personal?.country || "",
      // Kampanya eşleşmesi varsa kategori ve üst kategori bilgilerini yaz
      category: incomingCategory,
      parentCategory: topParentName || body.parentCategory,
      categoryLevel1: categoryHierarchy?.level1 || topParentName,
      categoryLevel2: categoryHierarchy?.level2 || '',
      categoryLevel3: categoryHierarchy?.level3 || '',
      categoryLevel4: categoryHierarchy?.level4 || '',
      categoryLevel5: categoryHierarchy?.level5 || categoryName,
      categoryFullPath: categoryHierarchy?.fullPath || categoryName,
      id: Date.now(), // Benzersiz ID
      // Eğer body'de createdAt varsa onu kullan (manuel ekleme), yoksa şimdiki zamanı kullan
      createdAt: body.createdAt || new Date().toISOString(),
      // Manuel eklenen müşterilere otomatik karşılama mesajı gönderme
      noAutoWelcome: !isFromZapier,
      // Status objesini doğru formatta oluştur
      status: {
        consultant: advisor || '',
        category: incomingCategory,
        services: incomingServices,
        status: incomingStatus || "Yeni Form"
      },
      statusNotes: statusNotes,
    } as any;

    // Nested personal alanlarını güncelle
    if (!newCustomer.personal) newCustomer.personal = {};
    if (!newCustomer.personal.facebook) newCustomer.personal.facebook = {};
    
    // Email varsa personal.email'e de yaz
    if (body.email && !newCustomer.personal.email) {
      newCustomer.personal.email = body.email;
    }
    // Name varsa personal.name'e de yaz
    if (body.name && !newCustomer.personal.name) {
      newCustomer.personal.name = body.name;
    }
    // Phone varsa personal.phone'a da yaz
    if (body.phone && !newCustomer.personal.phone) {
      newCustomer.personal.phone = body.phone;
    }
    // WhatsApp numarasını notlar kısmına ekle
    if (whatsappNumber) {
      const existingNotes = newCustomer.personal.notes || body.notes || "";
      newCustomer.personal.notes = existingNotes 
        ? `${existingNotes}\n\nWhatsApp: ${whatsappNumber}` 
        : `WhatsApp: ${whatsappNumber}`;
    }
    if (incomingLeadFormId) {
      newCustomer.personal.facebook.leadFormId = incomingLeadFormId;
    }
    if (matchedCampaign?.title) {
      newCustomer.personal.facebook.campaignName = matchedCampaign.title;
    }

    // SQLite'a kaydet
    upsertCustomer(newCustomer);

    // Yeni lead için otomatik WhatsApp karşılama mesajı
    // Öncelik: Etiket bazlı özel mesaj; yoksa kampanya dilinden türetilen şablon
    try {
      if (matchedLabel) {
        await sendAutoWelcomeByLabelIfPossible(newCustomer, matchedLabel);
      } else {
        await sendAutoWelcomeIfPossible(newCustomer);
      }
    } catch (e) {
      console.error("Auto welcome WhatsApp hatası:", e);
    }

    // Yeni lead atandığında danışmana bilgilendirme mesajı gönder
    try {
      await sendAdvisorLeadNotificationIfPossible(newCustomer);
    } catch (e) {
      console.error("Danışman bildirim WhatsApp hatası:", e);
    }

    return withCors(NextResponse.json(newCustomer), request);
  } catch (error) {
    return withCors(
      NextResponse.json({ error: "Kayıt başarısız" }, { status: 500 }),
      request
    );
  }
}

// PUT: Müşteri Güncelle (Detay sayfası ve Liste düzenleme için)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const existingCustomer = getCustomerById(body.id);

    if (existingCustomer) {
      let updatedCustomer;
      
      // Eğer body'de advisor, service, category gibi düz alanlar varsa
      // bunları status objesine dönüştür
      if (body.advisor !== undefined || body.service !== undefined || 
          body.category !== undefined || body.status !== undefined) {
        
        // Mevcut status objesini koru
        // Status obje veya string olabilir — her iki durumda da advisor/category/service bilgisini koru
        const currentStatus = typeof existingCustomer.status === 'object' 
          ? existingCustomer.status 
          : { 
              consultant: existingCustomer.advisor || '', 
              category: existingCustomer.category || '', 
              services: existingCustomer.service || '', 
              status: existingCustomer.status || '' 
            };
        
        // Yeni status objesi oluştur
        const newStatus = {
          consultant: body.advisor !== undefined ? body.advisor : currentStatus.consultant,
          category: body.category !== undefined ? body.category : currentStatus.category,
          services: body.service !== undefined ? body.service : currentStatus.services,
          status: body.status !== undefined && typeof body.status === 'string' 
            ? body.status 
            : (body.status?.status || currentStatus.status)
        };
        
        // Body'den düz alanları temizle
        const cleanBody = { ...body };
        delete cleanBody.advisor;
        delete cleanBody.service;
        delete cleanBody.category;
        if (typeof body.status === 'string') {
          delete cleanBody.status;
        }
        
        // Güncellemeyi yap
        updatedCustomer = { 
          ...existingCustomer, 
          ...cleanBody,
          status: { ...currentStatus, ...newStatus, ...(typeof body.status === 'object' ? body.status : {}) },
          advisor: newStatus.consultant,
          category: newStatus.category,
          service: newStatus.services
        };
      } else {
        // Normal güncelleme
        updatedCustomer = { ...existingCustomer, ...body };
      }
      
      // SQLite'a kaydet
      upsertCustomer(updatedCustomer);

      // Visit bildirimi: yeni eklenen veya düzenlenen Seyahat(ler)
      try {
        const oldTrips: any[] = Array.isArray(existingCustomer?.sales?.trips) ? existingCustomer.sales.trips : [];
        const newTrips: any[] = Array.isArray(updatedCustomer?.sales?.trips) ? updatedCustomer.sales.trips : [];
        const oldById = new Map(oldTrips.map((t: any) => [String(t?.id ?? ""), t]));
        const advisorName = updatedCustomer.advisor || (typeof updatedCustomer.status === "object" ? updatedCustomer.status?.consultant : "") || "";
        const customerName = updatedCustomer.name || updatedCustomer.personal?.name || "";
        const price = Number(updatedCustomer.sales?.price || 0);
        const currency = updatedCustomer.sales?.priceCurrency || "EUR";

        // Bir trip'in mail için anlamlı alanları aynı mı?
        const tripFields = [
          "appointmentDate", "appointmentTime", "doctor", "hotel", "roomType",
          "peopleCount", "transferCompany", "arrivalDate", "arrivalTime",
          "arrivalFlightCode", "departureDate", "departureTime", "departureFlightCode",
          "travelNotes", "dateUndetermined", "name",
        ];
        const tripsEqual = (a: any, b: any) => tripFields.every(f => String(a?.[f] ?? "") === String(b?.[f] ?? ""));

        for (const trip of newTrips) {
          if (!trip) continue;
          const key = String(trip.id ?? "");
          const prev = oldById.get(key);
          const isNew = !prev;
          const isUpdated = !isNew && !tripsEqual(prev, trip);
          if (!isNew && !isUpdated) continue;
          sendVisitMail({
            advisor: advisorName,
            customerName,
            tripName: trip.name,
            appointmentDate: trip.appointmentDate,
            appointmentTime: trip.appointmentTime,
            doctor: trip.doctor,
            hotel: trip.hotel,
            roomType: trip.roomType,
            peopleCount: trip.peopleCount,
            transferCompany: trip.transferCompany,
            arrivalDate: trip.arrivalDate,
            arrivalTime: trip.arrivalTime,
            arrivalFlightCode: trip.arrivalFlightCode,
            departureDate: trip.departureDate,
            departureTime: trip.departureTime,
            departureFlightCode: trip.departureFlightCode,
            notes: trip.travelNotes,
            dateUndetermined: !!trip.dateUndetermined,
            amount: price,
            currency,
            isUpdate: isUpdated,
          }).catch(() => {});
        }
      } catch {}

      // Satış bildirimi: status "Satış" oldu ve önceden değildi
      try {
        const prevStatus = typeof existingCustomer.status === "object"
          ? (existingCustomer.status?.status || "")
          : (existingCustomer.status || "");
        const newStatusStr = typeof updatedCustomer.status === "object"
          ? (updatedCustomer.status?.status || "")
          : (updatedCustomer.status || "");
        if (newStatusStr === "Satış" && prevStatus !== "Satış") {
          sendSatisMail({
            advisor: updatedCustomer.advisor || (typeof updatedCustomer.status === "object" ? updatedCustomer.status?.consultant : "") || "",
            customerName: updatedCustomer.name || updatedCustomer.personal?.name || "",
            category: updatedCustomer.category || (typeof updatedCustomer.status === "object" ? updatedCustomer.status?.category : "") || "",
            dateTime: new Date().toISOString(),
          }).catch(() => {});
        }
      } catch {}

      return withCors(NextResponse.json(updatedCustomer), request);
    } else {
      return withCors(
        NextResponse.json({ error: "Müşteri bulunamadı" }, { status: 404 }),
        request
      );
    }
  } catch (error) {
    return withCors(
      NextResponse.json({ error: "Güncelleme hatası" }, { status: 500 }),
      request
    );
  }
}

// DELETE: Müşteri Sil (Soft Delete - deleted-customers.json'a taşı)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return withCors(NextResponse.json({ error: "ID gerekli" }, { status: 400 }), request);

    // Silinecek müşteriyi bul (SQLite)
    const customerToDelete = getCustomerById(id);
    
    if (!customerToDelete) {
      return withCors(NextResponse.json({ error: "Müşteri bulunamadı" }, { status: 404 }), request);
    }
    
    // Silme bilgilerini ekle
    const deletedCustomer = {
      ...customerToDelete,
      deletedAt: new Date().toISOString(),
      deletedBy: request.headers.get('x-user-email') || 'unknown'
    };
    
    // deleted-customers.json'a ekle (soft delete)
    const deletedPath = path.join(process.cwd(), "deleted-customers.json");
    let deletedCustomers: any[] = [];
    
    try {
      const deletedData = fs.readFileSync(deletedPath, "utf-8");
      deletedCustomers = JSON.parse(deletedData);
    } catch (e) {
      deletedCustomers = [];
    }
    
    deletedCustomers.push(deletedCustomer);
    fs.writeFileSync(deletedPath, JSON.stringify(deletedCustomers, null, 2), "utf-8");
    
    // SQLite'dan sil
    deleteCustomer(id);
    
    return withCors(NextResponse.json({ success: true, message: "Müşteri deleted-customers.json'a taşındı" }), request);
  } catch (error) {
    return withCors(
      NextResponse.json({ error: "Silme hatası" }, { status: 500 }),
      request
    );
  }
}

// CORS preflight
export async function OPTIONS(request: Request) {
  return withCors(NextResponse.json({ ok: true }), request);
}