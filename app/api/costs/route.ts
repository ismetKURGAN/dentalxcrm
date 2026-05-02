import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";
import { sendTahsilatMail } from "@/app/api/lib/notify-mail";

const DB_PATH = path.join(process.cwd(), "crm.db");

function getDb() {
  return new Database(DB_PATH);
}

// GET: Liste veya tek kayıt
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type"); // patient | campaign | general
    const direction = searchParams.get("direction"); // expense | income
    const category = searchParams.get("category");
    const relatedId = searchParams.get("relatedId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const currency = searchParams.get("currency");

    const db = getDb();

    if (id) {
      const row = db.prepare("SELECT * FROM costs WHERE id = ?").get(id);
      db.close();
      if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(row);
    }

    const conditions: string[] = [];
    const params: any[] = [];

    if (type) { conditions.push("type = ?"); params.push(type); }
    if (direction) { conditions.push("direction = ?"); params.push(direction); }
    if (category) { conditions.push("category = ?"); params.push(category); }
    if (relatedId) { conditions.push("relatedId = ?"); params.push(relatedId); }
    if (currency) { conditions.push("currency = ?"); params.push(currency); }
    const visitGroup = searchParams.get("visitGroup");
    if (visitGroup !== null) { conditions.push("visitGroup = ?"); params.push(visitGroup); }
    if (dateFrom) { conditions.push("date >= ?"); params.push(dateFrom); }
    if (dateTo) { conditions.push("date <= ?"); params.push(dateTo); }

    const where = conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
    const rows = db.prepare(`SELECT * FROM costs${where} ORDER BY date DESC, createdAt DESC`).all(...params);
    db.close();

    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Yeni kayıt
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type, category, direction = "expense", amount, currency = "EUR",
      description, relatedId, relatedName, date, createdBy, salesAmount, visitGroup,
    } = body;

    if (!type || !category || amount === undefined) {
      return NextResponse.json({ error: "type, category ve amount zorunlu" }, { status: 400 });
    }

    const id = Date.now().toString();
    const now = new Date().toISOString();

    const db = getDb();
    db.prepare(`
      INSERT INTO costs (id, type, category, direction, amount, currency, description, relatedId, relatedName, date, createdBy, salesAmount, visitGroup, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, type, category, direction, Number(amount), currency, description || "", relatedId || "", relatedName || "", date ?? now.slice(0, 10), createdBy || "", Number(salesAmount || 0), visitGroup || "", now, now);
    db.close();

    // Tahsilat bildirimi (gelir kaydı + gerçek tutar + kart header değil)
    if (direction === "income" && Number(amount) > 0 && description !== "__CARD_HEADER__") {
      sendTahsilatMail({
        advisor: createdBy,
        customerName: relatedName,
        date: date && String(date).trim() ? date : undefined,
        amount: Number(amount),
        currency,
      }).catch(() => {});
    }

    return NextResponse.json({ id, success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: Güncelle
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, type, category, direction, amount, currency, description, relatedId, relatedName, date, createdBy, salesAmount, visitGroup } = body;

    if (!id) return NextResponse.json({ error: "id zorunlu" }, { status: 400 });

    const now = new Date().toISOString();
    const db = getDb();
    // Önceki kaydı oku (düzeltme maili tespiti için)
    const previous: any = db.prepare("SELECT * FROM costs WHERE id = ?").get(id);
    db.prepare(`
      UPDATE costs SET
        type = ?, category = ?, direction = ?, amount = ?, currency = ?,
        description = ?, relatedId = ?, relatedName = ?, date = ?, createdBy = ?, salesAmount = ?, visitGroup = ?, updatedAt = ?
      WHERE id = ?
    `).run(type, category, direction, Number(amount), currency, description || "", relatedId || "", relatedName || "", date, createdBy || "", Number(salesAmount || 0), visitGroup || "", now, id);
    db.close();

    // Tahsilat düzeltme maili (gelir kaydında ilgili alan değişmişse)
    if (direction === "income" && Number(amount) > 0 && description !== "__CARD_HEADER__" && previous) {
      const changed =
        Number(previous.amount) !== Number(amount) ||
        (previous.currency || "") !== (currency || "") ||
        (previous.date || "") !== (date || "") ||
        (previous.relatedName || "") !== (relatedName || "") ||
        (previous.description || "") !== (description || "");
      if (changed) {
        sendTahsilatMail({
          advisor: createdBy,
          customerName: relatedName,
          date: date && String(date).trim() ? date : undefined,
          amount: Number(amount),
          currency,
          isUpdate: true,
        }).catch(() => {});
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Sil
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id zorunlu" }, { status: 400 });

    const db = getDb();
    db.prepare("DELETE FROM costs WHERE id = ?").run(id);
    db.close();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
