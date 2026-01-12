import { NextRequest, NextResponse } from "next/server";

const WAZZUP_API_KEY = "cd33745b85b1449daf90957be902a5f5";
const WAZZUP_API_BASE = "https://api.wazzup24.com/v3";

export async function GET(request: NextRequest) {
  const results: any = {};

  // Test 1: /channels
  try {
    const res1 = await fetch(`${WAZZUP_API_BASE}/channels`, {
      headers: { "Authorization": `Bearer ${WAZZUP_API_KEY}` },
    });
    results.channels = {
      status: res1.status,
      data: res1.ok ? await res1.json() : await res1.text(),
    };
  } catch (e: any) {
    results.channels = { error: e.message };
  }

  // Test 2: /channel (singular)
  try {
    const res2 = await fetch(`${WAZZUP_API_BASE}/channel`, {
      headers: { "Authorization": `Bearer ${WAZZUP_API_KEY}` },
    });
    results.channel = {
      status: res2.status,
      data: res2.ok ? await res2.json() : await res2.text(),
    };
  } catch (e: any) {
    results.channel = { error: e.message };
  }

  // Test 3: /users/me (account info)
  try {
    const res3 = await fetch(`${WAZZUP_API_BASE}/users/me`, {
      headers: { "Authorization": `Bearer ${WAZZUP_API_KEY}` },
    });
    results.userInfo = {
      status: res3.status,
      data: res3.ok ? await res3.json() : await res3.text(),
    };
  } catch (e: any) {
    results.userInfo = { error: e.message };
  }

  return NextResponse.json(results, { status: 200 });
}
