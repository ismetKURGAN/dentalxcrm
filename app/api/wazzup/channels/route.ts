import { NextRequest, NextResponse } from "next/server";

const WAZZUP_API_KEY = "cd33745b85b1449daf90957be902a5f5";
const WAZZUP_API_BASE = "https://api.wazzup24.com/v3";

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching Wazzup24 channels...");
    const response = await fetch(`${WAZZUP_API_BASE}/channels`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${WAZZUP_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Wazzup24 API Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Wazzup24 API Error:", errorText);
      return NextResponse.json(
        { error: `API Error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Wazzup24 API Response:", JSON.stringify(data, null, 2));
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}
