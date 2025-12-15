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
