import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getAllCustomersLight } from "../lib/sqlite-customers";

const SETTINGS_PATH = path.join(process.cwd(), "settings.json");

const INTERNAL_BASE_URL =
  process.env.NEXT_INTERNAL_BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "http://localhost:3000";

interface DailyStats {
  advisorName: string;
  totalLeads: number;
  quoteSent: number;
  sales: number;
}

function getSettings(): any {
  if (!fs.existsSync(SETTINGS_PATH)) return {};
  const raw = fs.readFileSync(SETTINGS_PATH, "utf-8");
  return JSON.parse(raw);
}

function calculateDailyStats(): DailyStats[] {
  const customers = getAllCustomersLight();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Bugün oluşturulan müşterileri filtrele
  const todayCustomers = customers.filter((c: any) => {
    if (!c.createdAt) return false;
    const createdDate = new Date(c.createdAt);
    createdDate.setHours(0, 0, 0, 0);
    return createdDate.getTime() === today.getTime();
  });

  // Danışman bazında grupla
  const advisorMap = new Map<string, DailyStats>();

  todayCustomers.forEach((c: any) => {
    const advisorName = c.advisor || c.status?.consultant || "Atanmamış";
    
    if (!advisorMap.has(advisorName)) {
      advisorMap.set(advisorName, {
        advisorName,
        totalLeads: 0,
        quoteSent: 0,
        sales: 0,
      });
    }

    const stats = advisorMap.get(advisorName)!;
    stats.totalLeads++;

    // Status kontrolü
    const status = typeof c.status === "object" ? c.status.status : c.status;
    const statusStr = (status || "").toLowerCase();

    // Teklif gönderildi kontrolü
    if (
      statusStr.includes("teklif yollandı") ||
      statusStr.includes("teklif yollandı 2") ||
      statusStr.includes("teklif yollandı 3") ||
      statusStr.includes("teklif yollandı 4") ||
      statusStr.includes("teklif yollandı ( özel )")
    ) {
      stats.quoteSent++;
    }

    // Satış kontrolü
    if (statusStr.includes("satış") && !statusStr.includes("iptal") && !statusStr.includes("potansiyel")) {
      stats.sales++;
    }
  });

  return Array.from(advisorMap.values()).sort((a, b) => 
    b.totalLeads - a.totalLeads
  );
}

function formatReportMessage(stats: DailyStats[]): string {
  const today = new Date().toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  let message = `📊 *Günlük Satış Raporu*\n`;
  message += `📅 Tarih: ${today}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (stats.length === 0) {
    message += "Bugün hiç lead kaydı bulunmamaktadır.\n";
    return message;
  }

  let totalLeads = 0;
  let totalQuotes = 0;
  let totalSales = 0;

  stats.forEach((stat) => {
    message += `👤 *${stat.advisorName}*\n`;
    message += `   📥 Lead: ${stat.totalLeads}\n`;
    message += `   💼 Teklif: ${stat.quoteSent}\n`;
    message += `   ✅ Satış: ${stat.sales}\n`;
    message += `\n`;

    totalLeads += stat.totalLeads;
    totalQuotes += stat.quoteSent;
    totalSales += stat.sales;
  });

  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📈 *TOPLAM*\n`;
  message += `   📥 Lead: ${totalLeads}\n`;
  message += `   💼 Teklif: ${totalQuotes}\n`;
  message += `   ✅ Satış: ${totalSales}\n`;

  return message;
}

async function sendReportToWhatsAppGroup(message: string): Promise<boolean> {
  try {
    const settings = getSettings();
    const reportSettings = settings.dailyReportSettings || {};
    
    const groupJid = reportSettings.whatsappGroupJid;
    if (!groupJid || groupJid.trim() === "") {
      console.log("[daily-report] WhatsApp grup ID tanımlanmamış, rapor gönderilmedi");
      return false;
    }

    // Admin instance kullan
    const evoSettings = settings.whatsappSettingsEvolution || {};
    const instanceName = evoSettings.instance || "admin";

    const payload = {
      instance_name: instanceName,
      remote_jid: groupJid,
      message_body: message,
      from_me: true,
    };

    console.log("[daily-report] WhatsApp grubuna rapor gönderiliyor:", {
      instance: instanceName,
      group: groupJid,
    });

    const response = await fetch(
      `${INTERNAL_BASE_URL.replace(/\/$/, "")}/api/wp/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const respText = await response.text();
    console.log("[daily-report] WhatsApp API response:", response.status, respText);

    return response.ok;
  } catch (e) {
    console.error("[daily-report] WhatsApp gönderim hatası:", e);
    return false;
  }
}

// GET: Raporu hesapla ve döndür (test için)
export async function GET(req: NextRequest) {
  try {
    const stats = calculateDailyStats();
    const message = formatReportMessage(stats);

    return NextResponse.json({
      success: true,
      stats,
      message,
    });
  } catch (error) {
    console.error("[daily-report] Rapor hesaplama hatası:", error);
    return NextResponse.json(
      { error: "Rapor hesaplanamadı" },
      { status: 500 }
    );
  }
}

// POST: Raporu hesapla ve WhatsApp grubuna gönder
export async function POST(req: NextRequest) {
  try {
    const stats = calculateDailyStats();
    const message = formatReportMessage(stats);

    const sent = await sendReportToWhatsAppGroup(message);

    return NextResponse.json({
      success: true,
      sent,
      stats,
      message,
    });
  } catch (error) {
    console.error("[daily-report] Rapor gönderme hatası:", error);
    return NextResponse.json(
      { error: "Rapor gönderilemedi" },
      { status: 500 }
    );
  }
}
