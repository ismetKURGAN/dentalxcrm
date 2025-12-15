import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "db.json");

export async function POST(request: Request) {
  try {
    const { customers } = await request.json(); // React'ten gelen güncellemeler
    
    // Mevcut veriyi oku
    let allData = [];
    if (fs.existsSync(DB_PATH)) {
      allData = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    }

    // Güncellemeleri uygula
    // Gelen listedeki her bir müşteri için, ana listedeki karşılığını bulup değiştiriyoruz
    customers.forEach((updatedCustomer: any) => {
      const index = allData.findIndex((c: any) => c.id === updatedCustomer.id);
      if (index !== -1) {
        // Sadece değişen alanları güncelle, diğerlerini koru (tarih vs.)
        allData[index] = { ...allData[index], ...updatedCustomer };
      }
    });

    // Dosyaya geri yaz
    fs.writeFileSync(DB_PATH, JSON.stringify(allData, null, 2), "utf-8");

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
  }
}