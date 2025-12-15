import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const USERS_DB_PATH = path.join(process.cwd(), "users.json");

function getUsers() {
  try {
    if (!fs.existsSync(USERS_DB_PATH)) {
      fs.writeFileSync(USERS_DB_PATH, "[]", "utf-8");
      return [];
    }
    const raw = fs.readFileSync(USERS_DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveUsers(data: any[]) {
  fs.writeFileSync(USERS_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET() {
  try {
    const users = getUsers();
    return NextResponse.json(users);
  } catch (e) {
    return NextResponse.json({ error: "Kullanıcılar okunamadı" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const users = getUsers();
    const user = { ...body, id: Date.now() };
    users.push(user);
    saveUsers(users);
    return NextResponse.json(user);
  } catch (e) {
    return NextResponse.json({ error: "Kullanıcı ekleme hatası" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const users = getUsers();
    const index = users.findIndex((u: any) => u.id == body.id);
    if (index === -1) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }
    users[index] = { ...users[index], ...body };
    saveUsers(users);
    return NextResponse.json(users[index]);
  } catch (e) {
    return NextResponse.json({ error: "Kullanıcı güncelleme hatası" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
    let users = getUsers();
    users = users.filter((u: any) => u.id != id);
    saveUsers(users);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Kullanıcı silme hatası" }, { status: 500 });
  }
}
