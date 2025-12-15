import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CALENDAR_PATH = path.join(process.cwd(), "calendar.json");

function readEvents() {
  try {
    if (!fs.existsSync(CALENDAR_PATH)) {
      fs.writeFileSync(CALENDAR_PATH, "[]", "utf-8");
      return [];
    }
    const raw = fs.readFileSync(CALENDAR_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("calendar.json okunamadı", e);
    return [];
  }
}

function writeEvents(events: any[]) {
  fs.writeFileSync(CALENDAR_PATH, JSON.stringify(events, null, 2), "utf-8");
}

export async function GET() {
  const events = readEvents();
  return NextResponse.json(events);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const events = readEvents();
    const id = Date.now();
    const newEvent = { id, ...body };
    events.push(newEvent);
    writeEvents(events);
    return NextResponse.json(newEvent);
  } catch (e) {
    console.error("Takvim kaydı eklenemedi", e);
    return NextResponse.json({ error: "Takvim kaydı eklenemedi" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const events = readEvents();
    const index = events.findIndex((e: any) => e.id === body.id);
    if (index === -1) {
      return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    }
    events[index] = { ...events[index], ...body };
    writeEvents(events);
    return NextResponse.json(events[index]);
  } catch (e) {
    console.error("Takvim kaydı güncellenemedi", e);
    return NextResponse.json({ error: "Takvim kaydı güncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");
    if (!idParam) {
      return NextResponse.json({ error: "id gerekli" }, { status: 400 });
    }
    const id = Number(idParam);
    const events = readEvents();
    const filtered = events.filter((e: any) => e.id !== id);
    writeEvents(filtered);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Takvim kaydı silinemedi", e);
    return NextResponse.json({ error: "Takvim kaydı silinemedi" }, { status: 500 });
  }
}
