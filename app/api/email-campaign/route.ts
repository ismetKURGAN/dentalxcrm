import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("[email-campaign]", JSON.stringify(body));
    // Burada gerçek bir SMTP veya e-posta servisine bağlanabilirsiniz.
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "E-posta kampanya hatası" }, { status: 500 });
  }
}
