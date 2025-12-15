import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SEGMENTS_DB_PATH = path.join(process.cwd(), "segments.json");

function getSegments() {
  try {
    if (!fs.existsSync(SEGMENTS_DB_PATH)) {
      fs.writeFileSync(SEGMENTS_DB_PATH, "[]", "utf-8");
      return [];
    }
    const raw = fs.readFileSync(SEGMENTS_DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveSegments(data: any[]) {
  fs.writeFileSync(SEGMENTS_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET() {
  try {
    const segs = getSegments();
    return NextResponse.json(segs);
  } catch (e) {
    return NextResponse.json({ error: "Segmentler okunamadı" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const segs = getSegments();
    const seg = { ...body, id: Date.now() };
    segs.push(seg);
    saveSegments(segs);
    return NextResponse.json(seg);
  } catch (e) {
    return NextResponse.json({ error: "Segment ekleme hatası" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const segs = getSegments();
    const index = segs.findIndex((s: any) => s.id == body.id);
    if (index === -1) {
      return NextResponse.json({ error: "Segment bulunamadı" }, { status: 404 });
    }
    segs[index] = { ...segs[index], ...body };
    saveSegments(segs);
    return NextResponse.json(segs[index]);
  } catch (e) {
    return NextResponse.json({ error: "Segment güncelleme hatası" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
    let segs = getSegments();
    segs = segs.filter((s: any) => s.id != id);
    saveSegments(segs);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Segment silme hatası" }, { status: 500 });
  }
}
