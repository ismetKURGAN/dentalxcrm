import { NextResponse } from "next/server";

export async function GET() {
  try {
    const API_URL = process.env.CRM_URL;
    const API_KEY = process.env.CRM_API_KEY;

    const res = await fetch(`${API_URL}/api/v1/Lead`, {
      headers: { "X-Api-Key": API_KEY || "" },
    });

    const data = await res.json();

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message });
  }
}
