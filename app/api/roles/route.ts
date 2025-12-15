import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ROLES_DB_PATH = path.join(process.cwd(), "roles.json");

function getRoles() {
  try {
    if (!fs.existsSync(ROLES_DB_PATH)) {
      fs.writeFileSync(ROLES_DB_PATH, "[]", "utf-8");
      return [];
    }
    const raw = fs.readFileSync(ROLES_DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("roles.json okunamadı", e);
    return [];
  }
}

function saveRoles(data: any[]) {
  fs.writeFileSync(ROLES_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET() {
  try {
    const roles = getRoles();
    return NextResponse.json(roles);
  } catch (e) {
    return NextResponse.json({ error: "Roller okunamadı" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const roles = getRoles();
    const role = { ...body, id: Date.now() };
    roles.push(role);
    saveRoles(roles);
    return NextResponse.json(role);
  } catch (e) {
    return NextResponse.json({ error: "Rol ekleme hatası" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const roles = getRoles();
    const index = roles.findIndex((r: any) => r.id == body.id);
    if (index === -1) {
      return NextResponse.json({ error: "Rol bulunamadı" }, { status: 404 });
    }
    roles[index] = { ...roles[index], ...body };
    saveRoles(roles);
    return NextResponse.json(roles[index]);
  } catch (e) {
    return NextResponse.json({ error: "Rol güncelleme hatası" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
    let roles = getRoles();
    roles = roles.filter((r: any) => r.id != id);
    saveRoles(roles);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Rol silme hatası" }, { status: 500 });
  }
}
