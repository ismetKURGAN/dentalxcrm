import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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
            whatsappSettings: {
              baseUrl: "",
              defaultSession: "",
              apiKey: "",
              sendDelayMs: 1500,
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
    return { whatsappSettings: {} };
  }
}

function writeSettings(data: any) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET() {
  try {
    const all = readSettings();
    return NextResponse.json(all.whatsappSettings || {});
  } catch (e) {
    return NextResponse.json({ error: "WhatsApp ayarları okunamadı" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const all = readSettings();
    const current = all.whatsappSettings || {};
    const updated = { ...current, ...body };
    all.whatsappSettings = updated;
    if (!all.emailSettings) {
      all.emailSettings = {
        host: "",
        port: 587,
        secure: false,
        user: "",
        password: "",
        fromName: "",
        fromEmail: "",
      };
    }
    writeSettings(all);
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: "WhatsApp ayarları kaydedilemedi" }, { status: 500 });
  }
}
