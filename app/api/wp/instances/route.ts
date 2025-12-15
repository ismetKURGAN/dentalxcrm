import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  const data = [
    {
      id: 1,
      user_id: userId ? Number(userId) : 1,
      instance_name: "user_1_demo",
      status: "disconnected",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const instance = {
      id: Date.now(),
      user_id: Number(body.user_id),
      instance_name: String(body.instance_name || ""),
      status: String(body.status || "disconnected"),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!instance.user_id || !instance.instance_name) {
      return NextResponse.json({ error: "user_id ve instance_name zorunlu" }, { status: 400 });
    }

    return NextResponse.json(instance, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "İstek gövdesi okunamadı" }, { status: 400 });
  }
}
