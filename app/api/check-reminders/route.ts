import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Uygulama içi API çağrıları için temel URL
const INTERNAL_BASE_URL =
  process.env.NEXT_INTERNAL_BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "http://localhost:3000";

// --- AYARLAR ---

// 1. Waha (WhatsApp API) için istekleri, mevcut Next.js proxy'si üzerinden geçiyoruz
// (app/api/waha/[...path]/route.ts). Böylece token ve bağlantı ayarları tek yerde yönetilir.

const DB_PATH = path.join(process.cwd(), "db.json");
const USERS_PATH = path.join(process.cwd(), "users.json");

function getAdminWhatsappSession(): string {
  try {
    const settingsPath = path.join(process.cwd(), "settings.json");
    if (!fs.existsSync(settingsPath)) return "admin";
    const raw = fs.readFileSync(settingsPath, "utf-8");
    const json = JSON.parse(raw);
    const evoSettings = json.whatsappSettingsEvolution || {};
    return evoSettings.instance || "admin";
  } catch (e) {
    console.error("Admin instance okunamadı, 'admin' kullanılıyor", e);
    return "admin";
  }
}

function getConsultantPhone(consultantName: string): string | null {
  try {
    if (!fs.existsSync(USERS_PATH)) return null;
    const raw = fs.readFileSync(USERS_PATH, "utf-8");
    const users = JSON.parse(raw) as Array<{ name?: string; phone?: string }>;
    
    const user = users.find(
      (u) => u.name && u.name.toLowerCase() === consultantName.toLowerCase()
    );
    
    return user?.phone || null;
  } catch (e) {
    console.error("Kullanıcı telefonu okunamadı:", e);
    return null;
  }
}

export async function GET() {
  try {
    // 1. Veritabanını Oku
    if (!fs.existsSync(DB_PATH)) return NextResponse.json({ message: "Veritabanı yok" });
    const fileData = fs.readFileSync(DB_PATH, "utf-8");
    const customers = JSON.parse(fileData);

    const now = new Date();
    let updated = false;
    const logs: string[] = [];

    // 2. Müşterileri Tara
    const updatedCustomers = customers.map((c: any) => {
      // Hatırlatıcı kontrolü:
      // - Reminder objesi var mı?
      // - Açık mı (enabled)?
      // - Daha önce gönderilmedi mi (!sent)?
      // - Zamanı geldi mi veya geçti mi?
      
      if (
        c.reminder && 
        c.reminder.enabled && 
        !c.reminder.sent && 
        c.reminder.datetime
      ) {
        const reminderTime = new Date(c.reminder.datetime);
        
        // Eğer şu anki zaman, hatırlatma zamanından büyük veya eşitse (veya 1-2 dakika fark varsa)
        if (now >= reminderTime) {
          // Danışmana gidecek hatırlatma (müşteriye değil)
          const customerName = c.name || c.personal?.name || "Bilinmiyor";
          const rawCustomerPhone = c.personal?.phone || c.phone;

          const consultantName = c.status?.consultant || c.advisor || "Admin";
          const rawPhone = getConsultantPhone(consultantName);

          if (rawPhone) {
            const targetPhone = normalizePhone(rawPhone);
            const session = getAdminWhatsappSession(); // Admin session kullan

            if (targetPhone) {
              // --- WHATSAPP GÖNDERME ---
              const message = `🔔 *HATIRLATMA*\n\n` +
                `🧑‍💼 Danışman: ${consultantName}\n` +
                `👤 Müşteri: ${customerName}\n` +
                `📱 Müşteri Tel: ${rawCustomerPhone || "-"}\n` +
                `📝 Not: ${c.reminder.notes || "-"}\n` +
                `⏰ Saat: ${new Date(c.reminder.datetime).toLocaleTimeString('tr-TR')}`;

              // Admin session üzerinden danışmana mesaj gönder
              sendWhatsApp(session, targetPhone, message);

              logs.push(`Hatırlatma gönderildi (admin session -> ${consultantName}): ${targetPhone}`);
            } else {
              logs.push(`Danışman telefonu geçersiz: ${consultantName}`);
            }
          } else {
            logs.push(`Danışman telefonu bulunamadı: ${consultantName}`);
          }

          // 3. "Gönderildi" Olarak İşaretle (Tekrar göndermemek için)
          // 'sent: true' özelliğini ekliyoruz
          updated = true;
          return {
            ...c,
            reminder: {
              ...c.reminder,
              sent: true // Bu işaret sayesinde bir daha gönderilmez
            }
          };
        }
      }
      return c;
    });

    // 3. Değişiklik Varsa Kaydet
    if (updated) {
      fs.writeFileSync(DB_PATH, JSON.stringify(updatedCustomers, null, 2), "utf-8");
    }

    return NextResponse.json({ success: true, logs });

  } catch (error: any) {
    console.error("Cron Hatası:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Basit telefon normalizasyonu
// 1) Tüm rakam dışı karakterleri temizler
// 2) Eğer zaten ülke kodu (90, 44 vb.) ile başlıyorsa olduğu gibi bırakır
// 3) TR mobil için yardımcı dönüşüm:
//    - 05xxxxxxxxx  -> 905xxxxxxxxx
//    - 5xxxxxxxxx   -> 905xxxxxxxxx
// 4) UK mobil için yardımcı dönüşüm:
//    - 07xxxxxxxxx  -> 447xxxxxxxxx
//    - 7xxxxxxxxx   -> 447xxxxxxxxx
function normalizePhone(value: string): string {
  if (!value) return "";

  let digits = value.replace(/\D/g, "");

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

  // Diğer durumlarda olduğu gibi bırak (Waha tarafı zaten gerekirse reddeder)
  return digits;
}

// Hatırlatma mesajlarını Evolution API köprüsü üzerinden gönder
// session: Evolution instance adı gibi kullanılabilir (yoksa backend kendi default'unu kullanır)
async function sendWhatsApp(session: string, phone: string, text: string) {
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
    console.log("[check-reminders] Evolution API response", response.status, respText);
  } catch (e) {
    console.error("WhatsApp Gönderme Hatası (Evolution API):", e);
  }
}