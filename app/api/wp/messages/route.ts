import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// GET /api/wp/messages?instance_name=...&remote_jid=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const instanceName = searchParams.get("instance_name");
  const remoteJid = searchParams.get("remote_jid");

  if (!instanceName || !remoteJid) {
    return NextResponse.json(
      { error: "instance_name ve remote_jid zorunlu" },
      { status: 400 }
    );
  }

  // Şimdilik sahte/demo cevap (ileride PostgreSQL'den okunacak)
  const demoMessages = [
    {
      id: 1,
      instance_name: instanceName,
      remote_jid: remoteJid,
      from_me: false,
      message_body: "Merhaba, bu demo bir mesajdır.",
      media_url: null,
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    {
      id: 2,
      instance_name: instanceName,
      remote_jid: remoteJid,
      from_me: true,
      message_body: "Merhaba, size nasıl yardımcı olabilirim?",
      media_url: null,
      created_at: new Date().toISOString(),
    },
  ];

  return NextResponse.json(demoMessages);
}

// POST /api/wp/messages
// Body: { instance_name, remote_jid, from_me?, message_body, media_url? }
export async function POST(request: Request) {
  try {
    console.log("[wp/messages] POST request received");
    const body = await request.json();
    console.log("[wp/messages] Body parsed:", body);

    const instanceName = String(body.instance_name || "");
    const remoteJid = String(body.remote_jid || "");
    const messageBody = String(body.message_body || "");
    const mediaUrl = body.media_url ? String(body.media_url) : null;
    const fromMe = body.from_me === undefined ? true : Boolean(body.from_me);

    console.log("[wp/messages] Parsed fields:", { instanceName, remoteJid, messageBody: messageBody.substring(0, 50) });

    if (!instanceName || !remoteJid || !messageBody) {
      console.log("[wp/messages] Missing required fields");
      return NextResponse.json(
        { error: "instance_name, remote_jid ve message_body zorunlu" },
        { status: 400 }
      );
    }

    // API ayarlarını settings.json'dan oku
    const settingsPath = path.join(process.cwd(), "settings.json");
    if (!fs.existsSync(settingsPath)) {
      console.log("[wp/messages] settings.json not found");
      return NextResponse.json(
        { error: "settings.json bulunamadı" },
        { status: 500 }
      );
    }

    const rawSettings = fs.readFileSync(settingsPath, "utf-8");
    const settings = JSON.parse(rawSettings);
    const evo = settings.whatsappSettingsEvolution || {};

    const baseUrl: string = evo.baseUrl;
    const defaultInstance: string = evo.instance;
    const apiKey: string = evo.apiKey;

    console.log("[wp/messages] Evolution settings:", { baseUrl, defaultInstance, apiKey: apiKey?.substring(0, 10) + "..." });

    const finalInstance = instanceName || defaultInstance;
    if (!baseUrl || !finalInstance || !apiKey) {
      console.log("[wp/messages] Missing Evolution config");
      return NextResponse.json(
        { error: "API ayarları eksik (baseUrl / instance / apiKey)" },
        { status: 500 }
      );
    }

    // API'ye mesaj gönder (500 hatası için retry)
    const evoUrl = `${baseUrl.replace(/\/$/, "")}/message/sendText/${encodeURIComponent(
      finalInstance
    )}`;

    console.log("[wp/messages] Sending to Evolution:", evoUrl);

    let evoRes: Response | null = null;
    let evoText: string = "";
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount <= maxRetries) {
      evoRes = await fetch(evoUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey,
        } as any,
        body: JSON.stringify({
          number: remoteJid,
          text: messageBody,
        }),
      });

      console.log("[wp/messages] Evolution response status:", evoRes.status, "attempt:", retryCount + 1);

      evoText = await evoRes.text();

      // 500 hatası değilse veya max retry'a ulaştıysak döngüden çık
      if (evoRes.status !== 500 || retryCount === maxRetries) {
        break;
      }

      // 500 hatası aldık, tekrar dene
      retryCount++;
      console.log("[wp/messages] Evolution 500 hatası, yeniden deneniyor...", retryCount, "/", maxRetries);
      
      // Bekleme (10 saniye)
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    // Eğer hiç response alamadıysak (çok nadir)
    if (!evoRes) {
      return NextResponse.json(
        { error: "Evolution API'ye ulaşılamadı" },
        { status: 502 }
      );
    }

    // Mesajı her durumda kaydet (başarılı veya başarısız)
    const saved = {
      id: Date.now(),
      instance_name: finalInstance,
      remote_jid: remoteJid,
      from_me: fromMe,
      message_body: messageBody,
      media_url: mediaUrl,
      created_at: new Date().toISOString(),
      evolution_response: evoText,
      evolution_status: evoRes.status,
      success: evoRes.ok,
      retry_count: retryCount,
    };

    // Başarısız olsa bile 201 dön (chat ekranında görünsün)
    if (!evoRes.ok) {
      console.log("[wp/messages] Evolution hatası ama mesaj kaydedildi:", evoRes.status, evoText.substring(0, 100));
      return NextResponse.json(saved, { status: 201 });
    }

    return NextResponse.json(saved, { status: 201 });
  } catch (e) {
    console.error("[wp/messages] Error in POST handler:", e);
    return NextResponse.json({ error: "İstek gövdesi okunamadı" }, { status: 400 });
  }
}
