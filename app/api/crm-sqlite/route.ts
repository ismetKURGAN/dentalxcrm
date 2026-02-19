import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "crm.db");

function withCors(response: NextResponse, request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.headers.set("Access-Control-Allow-Credentials", "true");
  return response;
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return withCors(new NextResponse(null, { status: 200 }), request);
}

// GET: Müşterileri getir (Pagination destekli)
export async function GET(request: NextRequest) {
  try {
    const db = new Database(dbPath, { readonly: true });
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100");
    const all = searchParams.get("all") === "true";
    
    if (all) {
      // Tüm kayıtları getir
      const stmt = db.prepare("SELECT * FROM customers ORDER BY createdAt DESC");
      const customers = stmt.all();
      
      // JSON parse with error handling
      const safeParse = (str: string, fallback: any) => {
        try {
          return str ? JSON.parse(str) : fallback;
        } catch {
          return fallback;
        }
      };
      
      const parsed = customers.map((c: any) => ({
        ...c,
        personal: safeParse(c.personal, {}),
        status: safeParse(c.status, {}),
        reminder: safeParse(c.reminder, {}),
        payment: safeParse(c.payment, {}),
        sales: safeParse(c.sales, {}),
        calls: safeParse(c.calls, []),
        files: safeParse(c.files, []),
        history: safeParse(c.history, []),
      }));
      
      db.close();
      return withCors(NextResponse.json(parsed), request);
    }
    
    // Pagination
    const offset = (page - 1) * limit;
    
    // Toplam kayıt sayısı
    const countStmt = db.prepare("SELECT COUNT(*) as total FROM customers");
    const { total } = countStmt.get() as { total: number };
    
    // Sayfalı veri
    const stmt = db.prepare(
      "SELECT * FROM customers ORDER BY createdAt DESC LIMIT ? OFFSET ?"
    );
    const customers = stmt.all(limit, offset);
    
    // JSON parse with error handling
    const safeParse = (str: string, fallback: any) => {
      try {
        return str ? JSON.parse(str) : fallback;
      } catch {
        return fallback;
      }
    };
    
    const parsed = customers.map((c: any) => ({
      ...c,
      personal: safeParse(c.personal, {}),
      status: safeParse(c.status, {}),
      reminder: safeParse(c.reminder, {}),
      payment: safeParse(c.payment, {}),
      sales: safeParse(c.sales, {}),
      calls: safeParse(c.calls, []),
      files: safeParse(c.files, []),
      history: safeParse(c.history, []),
    }));
    
    db.close();
    
    return withCors(
      NextResponse.json({
        data: parsed,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }),
      request
    );
  } catch (error: any) {
    console.error("SQLite GET error:", error);
    return withCors(
      NextResponse.json({ error: error.message }, { status: 500 }),
      request
    );
  }
}

// POST: Yeni müşteri ekle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = new Database(dbPath);
    
    const id = body.id || Date.now();
    const createdAt = body.createdAt || new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO customers (
        id, createdAt, personal, status, reminder, payment, sales, calls, files, history,
        email, name, phone, advisor, service, category
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      createdAt,
      JSON.stringify(body.personal || {}),
      JSON.stringify(body.status || {}),
      JSON.stringify(body.reminder || {}),
      JSON.stringify(body.payment || {}),
      JSON.stringify(body.sales || {}),
      JSON.stringify(body.calls || []),
      JSON.stringify(body.files || []),
      JSON.stringify(body.history || []),
      body.email || "",
      body.name || body.personal?.name || "",
      body.phone || body.personal?.phone || "",
      body.advisor || body.status?.consultant || "",
      body.service || body.status?.services || "",
      body.category || body.status?.category || ""
    );
    
    db.close();
    
    return withCors(
      NextResponse.json({ success: true, id }),
      request
    );
  } catch (error: any) {
    console.error("SQLite POST error:", error);
    return withCors(
      NextResponse.json({ error: error.message }, { status: 500 }),
      request
    );
  }
}

// PUT: Müşteri güncelle
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const db = new Database(dbPath);
    
    if (!body.id) {
      db.close();
      return withCors(
        NextResponse.json({ error: "ID gerekli" }, { status: 400 }),
        request
      );
    }
    
    const stmt = db.prepare(`
      UPDATE customers SET
        personal = ?,
        status = ?,
        reminder = ?,
        payment = ?,
        sales = ?,
        calls = ?,
        files = ?,
        history = ?,
        email = ?,
        name = ?,
        phone = ?,
        advisor = ?,
        service = ?,
        category = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(
      JSON.stringify(body.personal || {}),
      JSON.stringify(body.status || {}),
      JSON.stringify(body.reminder || {}),
      JSON.stringify(body.payment || {}),
      JSON.stringify(body.sales || {}),
      JSON.stringify(body.calls || []),
      JSON.stringify(body.files || []),
      JSON.stringify(body.history || []),
      body.email || body.personal?.email || "",
      body.name || body.personal?.name || "",
      body.phone || body.personal?.phone || "",
      body.advisor || body.status?.consultant || "",
      body.service || body.status?.services || "",
      body.category || body.status?.category || "",
      body.id
    );
    
    db.close();
    
    if (result.changes === 0) {
      return withCors(
        NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 }),
        request
      );
    }
    
    return withCors(
      NextResponse.json({ success: true }),
      request
    );
  } catch (error: any) {
    console.error("SQLite PUT error:", error);
    return withCors(
      NextResponse.json({ error: error.message }, { status: 500 }),
      request
    );
  }
}

// DELETE: Müşteri sil
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    
    if (!id) {
      return withCors(
        NextResponse.json({ error: "ID gerekli" }, { status: 400 }),
        request
      );
    }
    
    const db = new Database(dbPath);
    const stmt = db.prepare("DELETE FROM customers WHERE id = ?");
    const result = stmt.run(id);
    db.close();
    
    if (result.changes === 0) {
      return withCors(
        NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 }),
        request
      );
    }
    
    return withCors(
      NextResponse.json({ success: true }),
      request
    );
  } catch (error: any) {
    console.error("SQLite DELETE error:", error);
    return withCors(
      NextResponse.json({ error: error.message }, { status: 500 }),
      request
    );
  }
}
