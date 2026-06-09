import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";

const SETTINGS_PATH = path.join(process.cwd(), "settings.json");

function readSettings() {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) {
      fs.writeFileSync(
        SETTINGS_PATH,
        JSON.stringify(
          {
            emailSettings: {
              host: "",
              port: 587,
              secure: false,
              user: "",
              password: "",
              fromName: "",
              fromEmail: "",
            },
          },
          null,
          2
        ),
        "utf-8"
      );
    }
    const raw = fs.readFileSync(SETTINGS_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("settings.json okunamadı", e);
    return { emailSettings: {} };
  }
}

function writeSettings(data: any) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET() {
  try {
    const all = readSettings();
    return NextResponse.json(all.emailSettings || {});
  } catch (e) {
    return NextResponse.json({ error: "E-posta ayarları okunamadı" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const all = readSettings();
    const current = all.emailSettings || {};
    const updated = { ...current, ...body };
    all.emailSettings = updated;
    writeSettings(all);
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: "E-posta ayarları kaydedilemedi" }, { status: 500 });
  }
}

// POST: E-posta gönder (to, subject, html alanlarıyla)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, html } = body;
    if (!to || !subject || !html) {
      return NextResponse.json({ error: "to, subject ve html alanları zorunludur" }, { status: 400 });
    }

    const all = readSettings();
    const cfg = all.emailSettings || {};

    // Önce settings.json'dan, yoksa env variables'dan al
    const smtpHost = cfg.host || process.env.NOTIFY_SMTP_HOST;
    const smtpPort = Number(cfg.port || process.env.NOTIFY_SMTP_PORT || 465);
    const smtpSecure = cfg.secure ?? (String(process.env.NOTIFY_SMTP_SECURE || "true") === "true");
    const smtpUser = cfg.user || process.env.NOTIFY_SMTP_USER;
    const smtpPass = cfg.password || process.env.NOTIFY_SMTP_PASS;
    const fromEmail = cfg.fromEmail || process.env.NOTIFY_MAIL_FROM || smtpUser;
    const fromName = cfg.fromName || "DentalX CRM";

    if (!smtpHost || !smtpUser || !smtpPass) {
      return NextResponse.json({ error: "SMTP ayarları yapılandırılmamış. Lütfen Ayarlar > E-Posta sayfasını kontrol edin." }, { status: 503 });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false },
    });

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("[email/send] error:", e);
    return NextResponse.json({ error: e.message || "E-posta gönderilemedi" }, { status: 500 });
  }
}
