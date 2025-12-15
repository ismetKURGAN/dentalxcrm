import { NextResponse } from "next/server";

const EVO_BASE_URL = process.env.EVO_BASE_URL;
const EVO_API_KEY = process.env.EVO_API_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const session = searchParams.get("session");

  if (!session) {
    return NextResponse.json({ error: "session parametresi gerekli" }, { status: 400 });
  }

  if (!EVO_BASE_URL) {
    return NextResponse.json({ error: "EVO_BASE_URL tanımlı değil" }, { status: 500 });
  }

  if (!EVO_API_KEY) {
    return NextResponse.json({ error: "EVO_API_KEY tanımlı değil" }, { status: 500 });
  }

  try {
    const evoUrl = `${EVO_BASE_URL}/instance/connect/${encodeURIComponent(session)}`;
    const res = await fetch(evoUrl, {
      headers: {
        apikey: EVO_API_KEY,
      },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Evolution QR alınamadı", status: res.status }, { status: 502 });
    }

    const data = await res.json();
    const base64 = (data as any)?.base64;
    if (!base64 || typeof base64 !== "string") {
      return NextResponse.json({ error: "Evolution base64 QR bulunamadı", raw: data }, { status: 502 });
    }

    return NextResponse.json({ image: base64 });
  } catch (e: any) {
    console.error("Evolution QR hata", e);
    return NextResponse.json(
      { error: "Evolution QR istek hatası", detail: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
