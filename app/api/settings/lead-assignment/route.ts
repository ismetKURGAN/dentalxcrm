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
              defaultSession: "default",
              apiKey: "",
              sendDelayMs: 1500,
            },
            leadAssignment: {
              strategy: "sequential",
              advisors: [
                { name: "İsmet Kurgan", active: true },
                { name: "Buse Yılmaz", active: true },
              ],
              lastAssignedIndex: -1,
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
    return {};
  }
}

function writeSettings(data: any) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET() {
  try {
    const all = readSettings();
    return NextResponse.json(
      all.leadAssignment || {
        strategy: "sequential",
        advisors: [],
        lastAssignedIndex: -1,
      }
    );
  } catch (e) {
    return NextResponse.json({ error: "Lead atama ayarları okunamadı" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const all = readSettings();
    const current = all.leadAssignment || {
      strategy: "sequential",
      advisors: [],
      lastAssignedIndex: -1,
    };
    const updated = { ...current, ...body };
    all.leadAssignment = updated;
    writeSettings(all);
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: "Lead atama ayarları kaydedilemedi" }, { status: 500 });
  }
}
