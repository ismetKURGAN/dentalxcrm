import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const LABELS_PATH = path.join(process.cwd(), "labels.json");

export type LabelConfig = {
  id: number;
  title: string;
  categoryId: string;
  advisors?: string[];
  language: string;
  message: string;
  active: boolean;
};

function readLabels(): LabelConfig[] {
  try {
    if (!fs.existsSync(LABELS_PATH)) {
      fs.writeFileSync(LABELS_PATH, "[]", "utf-8");
      return [];
    }
    const raw = fs.readFileSync(LABELS_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as LabelConfig[];
  } catch (e) {
    console.error("labels.json okunamadı", e);
    return [];
  }
}

function writeLabels(items: LabelConfig[]) {
  fs.writeFileSync(LABELS_PATH, JSON.stringify(items, null, 2), "utf-8");
}

export async function GET() {
  const items = readLabels();
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items = readLabels();
    const now = Date.now();
    const id = now;
    const item: LabelConfig = {
      id,
      title: String(body.title || ""),
      categoryId: String(body.categoryId || ""),
      advisors: Array.isArray(body.advisors)
        ? body.advisors.map((x: any) => String(x)).filter(Boolean)
        : undefined,
      language: String(body.language || ""),
      message: String(body.message || ""),
      active: body.active !== false,
    };
    items.push(item);
    writeLabels(items);
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("Etiket oluşturulamadı", e);
    return NextResponse.json({ error: "Etiket oluşturulamadı" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!id) {
      return NextResponse.json({ error: "Geçersiz ID" }, { status: 400 });
    }
    const items = readLabels();
    const idx = items.findIndex((l) => l.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Etiket bulunamadı" }, { status: 404 });
    }
    const prev = items[idx];
    const updated: LabelConfig = {
      ...prev,
      ...body,
      id: prev.id,
      title: String(body.title ?? prev.title),
      categoryId: String(body.categoryId ?? prev.categoryId),
      advisors:
        body.advisors === undefined
          ? prev.advisors
          : Array.isArray(body.advisors)
          ? body.advisors.map((x: any) => String(x)).filter(Boolean)
          : prev.advisors,
      language: String(body.language ?? prev.language),
      message: String(body.message ?? prev.message),
      active: body.active === undefined ? prev.active : !!body.active,
    };
    items[idx] = updated;
    writeLabels(items);
    return NextResponse.json(updated);
  } catch (e) {
    console.error("Etiket güncellenemedi", e);
    return NextResponse.json({ error: "Etiket güncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");
    const id = idParam ? Number(idParam) : NaN;
    if (!id) {
      return NextResponse.json({ error: "Geçersiz ID" }, { status: 400 });
    }
    const items = readLabels();
    const next = items.filter((l) => l.id !== id);
    writeLabels(next);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Etiket silinemedi", e);
    return NextResponse.json({ error: "Etiket silinemedi" }, { status: 500 });
  }
}
