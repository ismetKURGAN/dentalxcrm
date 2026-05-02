import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "crm.db");

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const db = new Database(DB_PATH, { readonly: true });

    // Kampanya bazlı maliyet toplamları
    let costWhere = `type = 'campaign'`;
    const costParams: any[] = [];
    if (dateFrom) { costWhere += ` AND date >= ?`; costParams.push(dateFrom); }
    if (dateTo)   { costWhere += ` AND date <= ?`; costParams.push(dateTo); }

    const campaignCosts: any[] = db.prepare(`
      SELECT
        relatedName,
        relatedId,
        SUM(CASE WHEN direction='expense' THEN amount ELSE 0 END) as totalExpense,
        SUM(CASE WHEN direction='income'  THEN amount ELSE 0 END) as totalIncome,
        COUNT(*) as entryCount,
        currency
      FROM costs
      WHERE ${costWhere}
      GROUP BY relatedName, relatedId, currency
    `).all(...costParams) as any[];

    // Her kampanya için CRM'den satış sayısı ve gelir (payment data)
    const result = campaignCosts.map((cc: any) => {
      const name = cc.relatedName || "";
      if (!name) return { ...cc, salesCount: 0 };

      // Satış statüsündeki müşteri sayısı (category LIKE %campaignName%)
      const salesRow: any = db.prepare(`
        SELECT COUNT(*) as cnt FROM customers
        WHERE (status = 'Satış' OR (json_valid(status) AND json_extract(status,'$.status') = 'Satış'))
        AND category LIKE ?
      `).get(`%${name}%`);

      // Tüm satış statüsündeki müşteri sayısı (toplam leads)
      const leadsRow: any = db.prepare(`
        SELECT COUNT(*) as cnt FROM customers WHERE category LIKE ?
      `).get(`%${name}%`);

      return {
        ...cc,
        salesCount: salesRow?.cnt ?? 0,
        totalLeads: leadsRow?.cnt ?? 0,
        conversionRate: leadsRow?.cnt > 0 ? ((salesRow?.cnt ?? 0) / leadsRow.cnt * 100).toFixed(1) : "0",
      };
    });

    db.close();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
