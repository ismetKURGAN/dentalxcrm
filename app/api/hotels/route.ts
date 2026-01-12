import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const HOTELS_DB_PATH = path.join(process.cwd(), "hotels.json");

function getHotels() {
  try {
    if (!fs.existsSync(HOTELS_DB_PATH)) {
      fs.writeFileSync(HOTELS_DB_PATH, "[]", "utf-8");
      return [];
    }
    const fileData = fs.readFileSync(HOTELS_DB_PATH, "utf-8");
    return JSON.parse(fileData);
  } catch (e) {
    return [];
  }
}

function saveHotels(data: any[]) {
  fs.writeFileSync(HOTELS_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET() {
  try {
    const hotels = getHotels();
    return NextResponse.json(hotels);
  } catch (e) {
    return NextResponse.json({ error: "Oteller okunamadı" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const hotels = getHotels();
    const newHotel = { ...body, id: Date.now() };
    hotels.push(newHotel);
    saveHotels(hotels);
    return NextResponse.json(newHotel);
  } catch (e) {
    return NextResponse.json({ error: "Otel ekleme hatası" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    let hotels = getHotels();
    const index = hotels.findIndex((h: any) => h.id == body.id);
    if (index > -1) {
      hotels[index] = { ...hotels[index], ...body };
      saveHotels(hotels);
      return NextResponse.json(hotels[index]);
    }
    return NextResponse.json({ error: "Otel bulunamadı" }, { status: 404 });
  } catch (e) {
    return NextResponse.json({ error: "Otel güncelleme hatası" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
    let hotels = getHotels();
    hotels = hotels.filter((h: any) => h.id != id);
    saveHotels(hotels);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Otel silme hatası" }, { status: 500 });
  }
}
