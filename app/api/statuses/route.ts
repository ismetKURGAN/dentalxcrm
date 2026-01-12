import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const STATUSES_FILE = path.join(process.cwd(), "data", "statuses.json");

interface StatusItem {
  id: number;
  tr: string;
  en: string;
}

function ensureDataDir() {
  const dir = path.dirname(STATUSES_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readStatuses(): StatusItem[] {
  ensureDataDir();
  if (!fs.existsSync(STATUSES_FILE)) {
    // Varsayılan durumlar
    const defaultStatuses: StatusItem[] = [
      { id: 1, tr: "Yeni Form", en: "" },
      { id: 2, tr: "Arandı", en: "" },
      { id: 3, tr: "Ön Bilgi", en: "" },
      { id: 4, tr: "Ön Bilgi 2", en: "" },
      { id: 5, tr: "Ön Bilgi 3", en: "" },
      { id: 6, tr: "Fotoğraf Bekleniyor", en: "" },
      { id: 7, tr: "Fotoğraf Bekleniyor 2", en: "" },
      { id: 8, tr: "Fotoğraf Bekleniyor 3", en: "" },
      { id: 9, tr: "Teklif Bekliyor", en: "" },
      { id: 10, tr: "Teklif Yollandı", en: "" },
      { id: 11, tr: "Teklif Yollandı 2", en: "" },
      { id: 12, tr: "Teklif Yollandı 3", en: "" },
      { id: 13, tr: "Teklif Yollandı 4", en: "" },
      { id: 14, tr: "Olumlu", en: "" },
      { id: 15, tr: "Bilet Bekliyor / Bilet Takip", en: "" },
      { id: 16, tr: "Satış", en: "" },
      { id: 17, tr: "Satış İptali", en: "" },
      { id: 18, tr: "Olumsuz", en: "" },
      { id: 19, tr: "Engelli/Spam", en: "" },
      { id: 20, tr: "Cevap Vermedi", en: "" },
      { id: 21, tr: "İlgisiz", en: "" },
      { id: 22, tr: "Ulaşılamadı", en: "" },
      { id: 23, tr: "Fiyat Olumsuz", en: "" },
      { id: 24, tr: "Ghost", en: "" },
      { id: 25, tr: "Eski Data Özel", en: "" },
      { id: 26, tr: "Randevu", en: "" },
      { id: 27, tr: "Konsültasyon Olumlu 1", en: "" },
      { id: 28, tr: "Potansiyel Satış ( Konsültasyon )", en: "" },
      { id: 29, tr: "Sorunlu Hasta", en: "" },
      { id: 30, tr: "Konsültasyon Olumlu 2", en: "" },
      { id: 31, tr: "Randevu İptal", en: "" },
      { id: 32, tr: "Randevuya Gelmedi", en: "" },
      { id: 33, tr: "Konsültasyon Ghost", en: "" },
      { id: 34, tr: "Randevu Onaylı", en: "" },
      { id: 35, tr: "Teklif Yollandı ( Özel )", en: "" },
      { id: 36, tr: "Fotoğraf Bekleniyor (Özel)", en: "" }
    ];
    fs.writeFileSync(STATUSES_FILE, JSON.stringify(defaultStatuses, null, 2), "utf-8");
    return defaultStatuses;
  }
  const raw = fs.readFileSync(STATUSES_FILE, "utf-8");
  const data = JSON.parse(raw);
  
  // Eski format (string array) ise yeni formata dönüştür
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === "string") {
    const converted: StatusItem[] = data.map((s: string, i: number) => ({
      id: i + 1,
      tr: s,
      en: ""
    }));
    fs.writeFileSync(STATUSES_FILE, JSON.stringify(converted, null, 2), "utf-8");
    return converted;
  }
  
  return data;
}

function writeStatuses(statuses: StatusItem[]) {
  ensureDataDir();
  fs.writeFileSync(STATUSES_FILE, JSON.stringify(statuses, null, 2), "utf-8");
}

export async function GET(req: NextRequest) {
  try {
    const statuses = readStatuses();
    // Eski uyumluluk için format parametresi
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format");
    
    if (format === "simple") {
      // Eski format - sadece Türkçe isimler
      return NextResponse.json(statuses.map(s => s.tr));
    }
    
    return NextResponse.json(statuses);
  } catch (error) {
    console.error("Durumlar okunurken hata:", error);
    return NextResponse.json({ error: "Durumlar okunamadı" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tr, en } = body;
    // Eski format desteği
    const statusTr = tr || body.status;

    if (!statusTr || typeof statusTr !== "string" || statusTr.trim() === "") {
      return NextResponse.json({ error: "Geçerli bir durum adı gerekli" }, { status: 400 });
    }

    const statuses = readStatuses();
    
    // Aynı isimde durum var mı kontrol et
    if (statuses.some(s => s.tr === statusTr.trim())) {
      return NextResponse.json({ error: "Bu durum zaten mevcut" }, { status: 400 });
    }

    const maxId = statuses.reduce((max, s) => Math.max(max, s.id), 0);
    const newStatus: StatusItem = {
      id: maxId + 1,
      tr: statusTr.trim(),
      en: (en || "").trim()
    };
    
    statuses.push(newStatus);
    writeStatuses(statuses);

    return NextResponse.json({ success: true, statuses });
  } catch (error) {
    console.error("Durum eklenirken hata:", error);
    return NextResponse.json({ error: "Durum eklenemedi" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, tr, en } = body;

    if (!id || typeof id !== "number") {
      return NextResponse.json({ error: "Geçerli bir durum ID gerekli" }, { status: 400 });
    }

    const statuses = readStatuses();
    const index = statuses.findIndex(s => s.id === id);

    if (index === -1) {
      return NextResponse.json({ error: "Durum bulunamadı" }, { status: 404 });
    }

    if (tr !== undefined) statuses[index].tr = tr.trim();
    if (en !== undefined) statuses[index].en = en.trim();

    writeStatuses(statuses);

    return NextResponse.json({ success: true, statuses });
  } catch (error) {
    console.error("Durum güncellenirken hata:", error);
    return NextResponse.json({ error: "Durum güncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    const statuses = readStatuses();
    let filtered: StatusItem[];
    
    if (id) {
      filtered = statuses.filter(s => s.id !== id);
    } else if (status) {
      // Eski format desteği
      filtered = statuses.filter(s => s.tr !== status);
    } else {
      return NextResponse.json({ error: "Geçerli bir durum ID veya adı gerekli" }, { status: 400 });
    }

    if (filtered.length === statuses.length) {
      return NextResponse.json({ error: "Durum bulunamadı" }, { status: 404 });
    }

    writeStatuses(filtered);

    return NextResponse.json({ success: true, statuses: filtered });
  } catch (error) {
    console.error("Durum silinirken hata:", error);
    return NextResponse.json({ error: "Durum silinemedi" }, { status: 500 });
  }
}
