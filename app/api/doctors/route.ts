import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DOCTORS_DB_PATH = path.join(process.cwd(), "doctors.json");

function getDoctors() {
  try {
    if (!fs.existsSync(DOCTORS_DB_PATH)) {
      fs.writeFileSync(DOCTORS_DB_PATH, "[]", "utf-8");
      return [];
    }
    const fileData = fs.readFileSync(DOCTORS_DB_PATH, "utf-8");
    return JSON.parse(fileData);
  } catch (e) {
    return [];
  }
}

function saveDoctors(data: any[]) {
  fs.writeFileSync(DOCTORS_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET() {
  try {
    const doctors = getDoctors();
    return NextResponse.json(doctors);
  } catch (e) {
    return NextResponse.json({ error: "Doktorlar okunamadı" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const doctors = getDoctors();
    const newDoctor = { ...body, id: Date.now() };
    doctors.push(newDoctor);
    saveDoctors(doctors);
    return NextResponse.json(newDoctor);
  } catch (e) {
    return NextResponse.json({ error: "Doktor ekleme hatası" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    let doctors = getDoctors();
    const index = doctors.findIndex((d: any) => d.id == body.id);
    if (index > -1) {
      doctors[index] = { ...doctors[index], ...body };
      saveDoctors(doctors);
      return NextResponse.json(doctors[index]);
    }
    return NextResponse.json({ error: "Doktor bulunamadı" }, { status: 404 });
  } catch (e) {
    return NextResponse.json({ error: "Doktor güncelleme hatası" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
    let doctors = getDoctors();
    doctors = doctors.filter((d: any) => d.id != id);
    saveDoctors(doctors);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Doktor silme hatası" }, { status: 500 });
  }
}
