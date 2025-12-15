// /app/api/waha/[...path]/route.ts

import fs from "fs";
import path from "path";

// Waha konteyneri host üzerinde 3000 portuna publish edilmiş durumda,
// bu yüzden UI konteyneri de dış IP üzerinden erişecek.
// whatsappSettings.baseUrl doluysa onu, değilse bu varsayılan adresi kullanırız.
const FALLBACK_WAHA_URL = "http://odoo-docker-waha-1:3000";
const FALLBACK_WAHA_TOKEN = "moon123";

function getWhatsappConfig() {
  try {
    const settingsPath = path.join(process.cwd(), "settings.json");
    if (!fs.existsSync(settingsPath)) {
      return { baseUrl: FALLBACK_WAHA_URL, apiKey: FALLBACK_WAHA_TOKEN };
    }
    const raw = fs.readFileSync(settingsPath, "utf-8");
    const json = JSON.parse(raw);
    const ws = json.whatsappSettings || {};
    return {
      baseUrl: ws.baseUrl || FALLBACK_WAHA_URL,
      apiKey: ws.apiKey || FALLBACK_WAHA_TOKEN,
    };
  } catch (e) {
    console.error("whatsappSettings okunamadı", e);
    return { baseUrl: FALLBACK_WAHA_URL, apiKey: FALLBACK_WAHA_TOKEN };
  }
}

export async function GET(request: Request) {
  return proxyRequest(request);
}

export async function POST(request: Request) {
  return proxyRequest(request);
}

async function proxyRequest(request: Request) {
  const cfg = getWhatsappConfig();
  const url = new URL(request.url);
  const targetPath = url.pathname.replace("/api/waha", "");
  const targetUrl = `${cfg.baseUrl}${targetPath}${url.search}`;

  console.log(`🔄 Proxy: ${request.method} -> ${targetUrl}`);

  try {
    // 1. Başlıkları Hazırla
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${cfg.apiKey}`,
      'X-Api-Key': cfg.apiKey,
      'Accept': 'application/json',
    };

    let bodyString: string | undefined = undefined;

    // 2. POST İsteği ise BODY'yi İşle (Hatanın Çözümü Burası)
    if (request.method === 'POST') {
        headers['Content-Type'] = 'application/json';
        
        try {
            // Gelen isteği JSON olarak oku
            const jsonBody = await request.json();
            // Tekrar string'e çevir (Garantili yöntem)
            bodyString = JSON.stringify(jsonBody);
            console.log("📦 Gönderilen Body:", bodyString);
        } catch (e) {
            console.error("Body Okuma Hatası:", e);
            // Eğer JSON parse edilemezse (boşsa), undefined bırak
        }
    }

    // 3. İsteği WAHA'ya İlet
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: bodyString,
      cache: 'no-store'
    });

    // Cevabı al
    const responseData = await response.text(); // Önce text olarak alıp hata varsa görelim

    if (!response.ok) {
        console.error(`❌ WAHA Hatası (${response.status}):`, responseData);
    } else {
        console.log(`✅ WAHA Başarılı (${response.status})`);
    }

    return new Response(responseData, {
      status: response.status,
      statusText: response.statusText,
      headers: {
          'Content-Type': 'application/json'
      },
    });

  } catch (error) {
    console.error("🔥 Proxy Kritik Hata:", error);
    return new Response(JSON.stringify({ error: "Proxy Bağlantı Hatası", details: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}