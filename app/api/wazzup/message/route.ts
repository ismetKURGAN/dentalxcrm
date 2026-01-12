import { NextRequest, NextResponse } from "next/server";

const WAZZUP_API_KEY = "cd33745b85b1449daf90957be902a5f5";
const WAZZUP_API_BASE = "https://api.wazzup24.com/v3";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelId, chatId, text } = body;

    if (!channelId || !chatId || !text) {
      return NextResponse.json(
        { error: "Missing required fields: channelId, chatId, text" },
        { status: 400 }
      );
    }

    const response = await fetch(`${WAZZUP_API_BASE}/message`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WAZZUP_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channelId,
        chatId: `${chatId}@c.us`,
        chatType: "whatsapp",
        text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `API Error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}
