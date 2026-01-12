import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SERVICES_FILE = path.join(process.cwd(), "data", "services.json");

interface ServiceItem {
  id: number;
  tr: string;
  en: string;
}

function ensureDataDir() {
  const dir = path.dirname(SERVICES_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readServices(): ServiceItem[] {
  ensureDataDir();
  if (!fs.existsSync(SERVICES_FILE)) {
    // Varsayılan servisler
    const defaultServices: ServiceItem[] = [
      { id: 1, tr: "Randevu", en: "Appointment" },
      { id: 2, tr: "Diğer", en: "Other" },
      { id: 3, tr: "Tüp Bebek IVF", en: "IVF Treatment" },
      { id: 4, tr: "Onkoloji", en: "Oncology" },
      { id: 5, tr: "Beyin ve Sinir Cerrahisi (Nöroşirürji)", en: "Neurosurgery" },
      { id: 6, tr: "Göğüs (Akciğer) Hastalıkları", en: "Pulmonology" },
      { id: 7, tr: "Göz Hastalıkları", en: "Ophthalmology" },
      { id: 8, tr: "Ortopedi", en: "Orthopedics" },
      { id: 9, tr: "Obezite Cerrahisi", en: "Bariatric Surgery" },
      { id: 10, tr: "Saç Ekimi", en: "Hair Transplant" },
      { id: 11, tr: "Estetik Plastik ve Rekonstrüktif Cerrahi", en: "Plastic Surgery" },
      { id: 12, tr: "Check-Up", en: "Check-Up" },
      { id: 13, tr: "Dental Simple Treatments", en: "Dental Simple Treatments" },
      { id: 14, tr: "Dental Veneers", en: "Dental Veneers" },
      { id: 15, tr: "Dental Crowns", en: "Dental Crowns" },
      { id: 16, tr: "Dental Implants&Crowns", en: "Dental Implants&Crowns" },
      { id: 17, tr: "Dental All on 6", en: "Dental All on 6" },
      { id: 18, tr: "Dental All on 5", en: "Dental All on 5" },
      { id: 19, tr: "Dental All on 4", en: "Dental All on 4" },
      { id: 20, tr: "Dental Smile Makeover", en: "Dental Smile Makeover" }
    ];
    fs.writeFileSync(SERVICES_FILE, JSON.stringify(defaultServices, null, 2), "utf-8");
    return defaultServices;
  }
  const raw = fs.readFileSync(SERVICES_FILE, "utf-8");
  const data = JSON.parse(raw);
  
  // Eski format (string array) ise yeni formata dönüştür
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === "string") {
    const converted: ServiceItem[] = data.map((s: string, i: number) => ({
      id: i + 1,
      tr: s,
      en: ""
    }));
    fs.writeFileSync(SERVICES_FILE, JSON.stringify(converted, null, 2), "utf-8");
    return converted;
  }
  
  return data;
}

function writeServices(services: ServiceItem[]) {
  ensureDataDir();
  fs.writeFileSync(SERVICES_FILE, JSON.stringify(services, null, 2), "utf-8");
}

export async function GET(req: NextRequest) {
  try {
    const services = readServices();
    // Eski uyumluluk için format parametresi
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format");
    
    if (format === "simple") {
      // Eski format - sadece Türkçe isimler
      return NextResponse.json(services.map(s => s.tr));
    }
    
    return NextResponse.json(services);
  } catch (error) {
    console.error("Servisler okunurken hata:", error);
    return NextResponse.json({ error: "Servisler okunamadı" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tr, en } = body;
    // Eski format desteği
    const serviceTr = tr || body.service;

    if (!serviceTr || typeof serviceTr !== "string" || serviceTr.trim() === "") {
      return NextResponse.json({ error: "Geçerli bir servis adı gerekli" }, { status: 400 });
    }

    const services = readServices();
    
    // Aynı isimde servis var mı kontrol et
    if (services.some(s => s.tr === serviceTr.trim())) {
      return NextResponse.json({ error: "Bu servis zaten mevcut" }, { status: 400 });
    }

    const maxId = services.reduce((max, s) => Math.max(max, s.id), 0);
    const newService: ServiceItem = {
      id: maxId + 1,
      tr: serviceTr.trim(),
      en: (en || "").trim()
    };
    
    services.push(newService);
    writeServices(services);

    return NextResponse.json({ success: true, services });
  } catch (error) {
    console.error("Servis eklenirken hata:", error);
    return NextResponse.json({ error: "Servis eklenemedi" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, tr, en } = body;

    if (!id || typeof id !== "number") {
      return NextResponse.json({ error: "Geçerli bir servis ID gerekli" }, { status: 400 });
    }

    const services = readServices();
    const index = services.findIndex(s => s.id === id);

    if (index === -1) {
      return NextResponse.json({ error: "Servis bulunamadı" }, { status: 404 });
    }

    if (tr !== undefined) services[index].tr = tr.trim();
    if (en !== undefined) services[index].en = en.trim();

    writeServices(services);

    return NextResponse.json({ success: true, services });
  } catch (error) {
    console.error("Servis güncellenirken hata:", error);
    return NextResponse.json({ error: "Servis güncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, service } = body;

    const services = readServices();
    let filtered: ServiceItem[];
    
    if (id) {
      filtered = services.filter(s => s.id !== id);
    } else if (service) {
      // Eski format desteği
      filtered = services.filter(s => s.tr !== service);
    } else {
      return NextResponse.json({ error: "Geçerli bir servis ID veya adı gerekli" }, { status: 400 });
    }

    if (filtered.length === services.length) {
      return NextResponse.json({ error: "Servis bulunamadı" }, { status: 404 });
    }

    writeServices(filtered);

    return NextResponse.json({ success: true, services: filtered });
  } catch (error) {
    console.error("Servis silinirken hata:", error);
    return NextResponse.json({ error: "Servis silinemedi" }, { status: 500 });
  }
}
