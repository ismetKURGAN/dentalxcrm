import { NextResponse } from "next/server";
import { getCustomerById, upsertCustomer } from "../../lib/sqlite-customers";

export async function POST(request: Request) {
  try {
    const { customers } = await request.json();
    
    // Her müşteriyi SQLite'da güncelle
    for (const updatedCustomer of customers) {
      // Mevcut kaydı oku, üzerine yaz
      const existing = getCustomerById(updatedCustomer.id);
      if (existing) {
        const merged = { ...existing, ...updatedCustomer, updatedAt: new Date().toISOString() };
        upsertCustomer(merged);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
  }
}