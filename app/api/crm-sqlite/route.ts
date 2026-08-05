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
    const statusFilter = searchParams.get("status"); // "Satış" veya "Satış Kapalı" gibi
    const idParam = searchParams.get("id"); // Tek kayıt çekme
    
    // Tek kayıt çekme: ?id=xxx
    if (idParam) {
      const row = db.prepare("SELECT * FROM customers WHERE id = ?").get(idParam) as any;
      db.close();
      
      if (!row) {
        return withCors(NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 }), request);
      }
      
      // data kolonundan tam veriyi parse et
      let fullData: any = {};
      try {
        fullData = row.data ? JSON.parse(row.data) : {};
      } catch { fullData = {}; }
      
      // Status: fullData'daki obje formunu koru (consultant, category, services bilgisi için)
      // SQLite status kolonu eski kayıtlarda JSON string, yeni kayıtlarda düz string olabilir
      let statusValue: any = fullData.status || '';
      if (typeof statusValue === 'string' && row.status && row.status !== statusValue) {
        statusValue = row.status;
      }
      
      // Düz kolonlarla birleştir
      const result = {
        ...fullData,
        id: row.id,
        email: row.email || fullData.email || '',
        name: row.name || fullData.name || '',
        phone: row.phone || fullData.phone || '',
        advisor: row.advisor || fullData.advisor || '',
        category: row.category || fullData.category || '',
        service: row.service || fullData.service || '',
        status: statusValue,
        country: row.country || fullData.country || '',
        createdAt: row.createdAt || fullData.createdAt || '',
        updatedAt: row.updatedAt || fullData.updatedAt || '',
      };
      
      return withCors(NextResponse.json(result), request);
    }
    
    if (all) {
      // include: data | sales | files | reminder (virgülle birleştirilebilir)
      // Varsayılan: sadece düz kolonlar (performans)
      const includeParam = searchParams.get("include") || "";
      const includeParts = includeParam.split(",").map((s) => s.trim()).filter(Boolean);
      const includeData = includeParam === "data";
      const includeSales = includeParts.includes("sales");
      const includeFiles = includeParts.includes("files");
      const includeReminder = includeParts.includes("reminder");

      let columns: string;
      if (includeData) {
        columns = "*";
      } else {
        const extras: string[] = [];
        if (includeSales) extras.push("json_extract(data, '$.sales') as salesJson");
        if (includeFiles) extras.push("json_extract(data, '$.files') as filesJson");
        if (includeReminder) extras.push("json_extract(data, '$.reminder') as reminderJson");
        columns =
          "id, email, name, phone, advisor, category, service, status, country, createdAt, updatedAt, json_extract(data, '$.parentCategory') as parentCategory" +
          (extras.length ? ", " + extras.join(", ") : "");
      }
      
      let query = `SELECT ${columns} FROM customers`;
      const params: any[] = [];
      
      if (statusFilter) {
        const statuses = statusFilter.split(',').map(s => s.trim());
        const placeholders = statuses.map(() => '?').join(',');
        query += ` WHERE ((json_valid(status) AND json_extract(status, '$.status') IN (${placeholders})) OR status IN (${placeholders}))`;
        params.push(...statuses, ...statuses);
      }
      
      query += " ORDER BY createdAt DESC";
      const stmt = db.prepare(query);
      const customers = params.length > 0 ? stmt.all(...params) : stmt.all();
      
      const safeParse = (str: string, fallback: any) => {
        try {
          return str ? JSON.parse(str) : fallback;
        } catch {
          return fallback;
        }
      };
      
      const parsed = customers.map((c: any) => {
        // data kolonundan tüm veriyi parse et (varsa)
        const fullData = includeData ? safeParse(c.data, {}) : {};
        
        // Status: JSON obje veya düz string olabilir
        let statusStr = c.status || '';
        let advisorStr = c.advisor || '';
        let serviceStr = c.service || '';
        
        // Eski kayıtlarda status JSON formatında olabilir
        if (c.status && c.status.startsWith('{')) {
          try {
            const statusObj = JSON.parse(c.status);
            statusStr = statusObj.status || '';
            if (!advisorStr) advisorStr = statusObj.consultant || '';
            if (!serviceStr) serviceStr = statusObj.services || '';
          } catch {}
        }
        
        // fullData varsa birleştir
        const base = includeData ? (() => {
          const {status: _, advisor: __, service: ___, ...rest} = fullData;
          return rest;
        })() : {};
        
        // salesJson varsa parse et
        let salesData: any = undefined;
        if (includeSales && c.salesJson) {
          try { salesData = JSON.parse(c.salesJson); } catch {}
        }
        
        // filesJson varsa parse et
        let filesData: any = undefined;
        if (includeFiles && c.filesJson) {
          try { filesData = JSON.parse(c.filesJson); } catch {}
        }

        // reminderJson varsa parse et
        let reminderData: any = undefined;
        if (includeReminder && c.reminderJson) {
          try { reminderData = JSON.parse(c.reminderJson); } catch {}
        }
        
        return {
          ...base,
          id: c.id,
          email: c.email || fullData.email || '',
          name: c.name || fullData.name || '',
          phone: c.phone || fullData.phone || '',
          advisor: advisorStr,
          category: c.category || fullData.category || '',
          parentCategory: c.parentCategory || fullData.parentCategory || '',
          service: serviceStr,
          status: statusStr,
          country: c.country || fullData.country || '',
          createdAt: c.createdAt || fullData.createdAt || '',
          updatedAt: c.updatedAt || fullData.updatedAt || '',
          ...(salesData !== undefined ? { sales: salesData } : {}),
          ...(filesData !== undefined ? { files: filesData } : {}),
          ...(reminderData !== undefined ? { reminder: reminderData } : {}),
        };
      });
      
      db.close();
      return withCors(NextResponse.json(parsed), request);
    }
    
    // Pagination
    const offset = (page - 1) * limit;
    const searchQuery = searchParams.get("search")?.trim();
    
    // Server-side filtreler
    const advisorFilter = searchParams.get("advisor")?.trim();
    const advStatusFilter = searchParams.get("statuses")?.trim(); // Gelişmiş durum filtresi (virgülle ayrılmış)
    const advStatusOp = searchParams.get("statusOp") || "in"; // "in" veya "notIn"
    const categoryFilter = searchParams.get("categories")?.trim();
    const categoryOp = searchParams.get("categoryOp") || "in";
    const categoryParentId = searchParams.get("categoryParentId")?.trim();
    const serviceFilter = searchParams.get("services")?.trim();
    const serviceOp = searchParams.get("serviceOp") || "in";
    const countryFilter = searchParams.get("countries")?.trim();
    const countryOp = searchParams.get("countryOp") || "in";
    const advAdvisorFilter = searchParams.get("advisors")?.trim();
    const advAdvisorOp = searchParams.get("advisorOp") || "in";
    const parentCategoryFilter = searchParams.get("parentCategory")?.trim();
    
    // WHERE koşullarını birleştir
    const conditions: string[] = [];
    const params: any[] = [];
    
    // Rol bazlı danışman filtresi (danışman sadece kendi hastalarını görsün)
    if (advisorFilter) {
      conditions.push(`(advisor = ? OR (json_valid(status) AND json_extract(status, '$.consultant') = ?))`);
      params.push(advisorFilter, advisorFilter);
    }
    
    if (statusFilter) {
      const statuses = statusFilter.split(',').map(s => s.trim());
      const placeholders = statuses.map(() => '?').join(',');
      conditions.push(`((json_valid(status) AND json_extract(status, '$.status') IN (${placeholders})) OR status IN (${placeholders}))`);
      params.push(...statuses, ...statuses);
    }
    
    // Gelişmiş durum filtresi
    if (advStatusFilter) {
      const statuses = advStatusFilter.split(',').map(s => s.trim());
      const placeholders = statuses.map(() => '?').join(',');
      const statusCond = `((json_valid(status) AND json_extract(status, '$.status') IN (${placeholders})) OR status IN (${placeholders}))`;
      conditions.push(advStatusOp === "notIn" ? `NOT ${statusCond}` : statusCond);
      params.push(...statuses, ...statuses);
    }
    
    // Gelişmiş danışman filtresi
    if (advAdvisorFilter) {
      const advisors = advAdvisorFilter.split(',').map(s => s.trim());
      const placeholders = advisors.map(() => '?').join(',');
      const advCond = `(advisor IN (${placeholders}) OR (json_valid(status) AND json_extract(status, '$.consultant') IN (${placeholders})))`;
      conditions.push(advAdvisorOp === "notIn" ? `NOT ${advCond}` : advCond);
      params.push(...advisors, ...advisors);
    }
    
    // Kategori filtresi
    if (categoryFilter) {
      const cats = categoryFilter.split(',').map(s => s.trim());
      const placeholders = cats.map(() => '?').join(',');
      conditions.push(categoryOp === "notIn" ? `category NOT IN (${placeholders})` : `category IN (${placeholders})`);
      params.push(...cats);
    }
    
    // categoryParentId filtresi: categories.json'a göre belirlenen alt kategoriler
    // Client tarafından zaten expandedCats listesi gönderiliyor, bu yedek mekanizma
    if (categoryParentId && !categoryFilter) {
      // data JSON'undan parentCategory veya category ile eşleştir
      // Bu durumda client expandedCats göndermeli, burası fallback
    }
    
    // Hizmet filtresi
    if (serviceFilter) {
      const svcs = serviceFilter.split(',').map(s => s.trim());
      const placeholders = svcs.map(() => '?').join(',');
      const svcCond = `(service IN (${placeholders}) OR (json_valid(status) AND json_extract(status, '$.services') IN (${placeholders})))`;
      conditions.push(serviceOp === "notIn" ? `NOT ${svcCond}` : svcCond);
      params.push(...svcs, ...svcs);
    }
    
    // Ülke filtresi
    if (countryFilter) {
      const countries = countryFilter.split(',').map(s => s.trim());
      const placeholders = countries.map(() => '?').join(',');
      conditions.push(countryOp === "notIn" ? `country NOT IN (${placeholders})` : `country IN (${placeholders})`);
      params.push(...countries);
    }
    
    // Üst kategori filtresi (data JSON'dan)
    if (parentCategoryFilter) {
      const parents = parentCategoryFilter.split(',').map(s => s.trim());
      const placeholders = parents.map(() => '?').join(',');
      conditions.push(`json_extract(data, '$.parentCategory') IN (${placeholders})`);
      params.push(...parents);
    }
    
    if (searchQuery) {
      const likeTerm = `%${searchQuery}%`;
      conditions.push(`(name LIKE ? OR phone LIKE ? OR email LIKE ? OR advisor LIKE ? OR category LIKE ?)`);
      params.push(likeTerm, likeTerm, likeTerm, likeTerm, likeTerm);
    }
    
    const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
    
    // Toplam kayıt sayısı
    const countQuery = `SELECT COUNT(*) as total FROM customers${whereClause}`;
    const countStmt = db.prepare(countQuery);
    const { total } = (params.length > 0 ? countStmt.get(...params) : countStmt.get()) as { total: number };
    
    // Sayfalı veri (include parametresine göre kolonlar)
    const includeParam = searchParams.get("include");
    const includeSalesFiles = includeParam === "sales,files";
    
    let lightColumns = "id, email, name, phone, advisor, category, service, status, country, createdAt, updatedAt";
    if (includeSalesFiles) {
      lightColumns += ", json_extract(data, '$.sales') as salesJson, json_extract(data, '$.files') as filesJson";
    }
    
    const dataQuery = `SELECT ${lightColumns} FROM customers${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
    const stmt = db.prepare(dataQuery);
    const customers = stmt.all(...params, limit, offset);
    
    const parsed = customers.map((c: any) => {
      // Status: JSON obje veya düz string olabilir
      let statusStr = c.status || '';
      let advisorStr = c.advisor || '';
      let serviceStr = c.service || '';
      
      if (c.status && c.status.startsWith('{')) {
        try {
          const statusObj = JSON.parse(c.status);
          statusStr = statusObj.status || '';
          if (!advisorStr) advisorStr = statusObj.consultant || '';
          if (!serviceStr) serviceStr = statusObj.services || '';
        } catch {}
      }
      
      // salesJson ve filesJson parse et (null kontrolü önemli - json_extract null döndürürse)
      let salesData: any = undefined;
      let filesData: any = undefined;
      if (includeSalesFiles) {
        if (c.salesJson !== null && c.salesJson !== undefined) {
          try { salesData = JSON.parse(c.salesJson); } catch {}
        }
        if (c.filesJson !== null && c.filesJson !== undefined) {
          try { filesData = JSON.parse(c.filesJson); } catch {}
        }
      }
      
      return {
        id: c.id,
        email: c.email || '',
        name: c.name || '',
        phone: c.phone || '',
        advisor: advisorStr,
        category: c.category || '',
        service: serviceStr,
        status: statusStr,
        country: c.country || '',
        createdAt: c.createdAt || '',
        updatedAt: c.updatedAt || '',
        ...(salesData !== undefined ? { sales: salesData } : {}),
        ...(filesData !== undefined ? { files: filesData } : {}),
      };
    });
    
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

// POST: Filtreli müşteri listesi (kategori listesi çok uzunsa) VEYA yeni müşteri ekle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Eğer body'de "categories" array'i varsa bu bir filtre isteğidir
    if (Array.isArray(body.categories)) {
      const db = new Database(dbPath, { readonly: true });
      const searchParams = request.nextUrl.searchParams;
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "100");
      const offset = (page - 1) * limit;
      
      const cats = body.categories as string[];
      const categoryOp = body.categoryOp || "in";
      const conditions: string[] = [];
      const params: any[] = [];
      
      // Kategori filtresi
      const placeholders = cats.map(() => '?').join(',');
      conditions.push(categoryOp === "notIn" ? `category NOT IN (${placeholders})` : `category IN (${placeholders})`);
      params.push(...cats);
      
      // Diğer URL parametrelerini de işle
      const advisorFilter = searchParams.get("advisor")?.trim();
      if (advisorFilter) {
        conditions.push(`(advisor = ? OR (json_valid(status) AND json_extract(status, '$.consultant') = ?))`);
        params.push(advisorFilter, advisorFilter);
      }
      const advStatusFilter = searchParams.get("statuses")?.trim();
      const advStatusOp = searchParams.get("statusOp") || "in";
      if (advStatusFilter) {
        const statuses = advStatusFilter.split(',').map((s: string) => s.trim());
        const ph = statuses.map(() => '?').join(',');
        const statusCond = `((json_valid(status) AND json_extract(status, '$.status') IN (${ph})) OR status IN (${ph}))`;
        conditions.push(advStatusOp === "notIn" ? `NOT ${statusCond}` : statusCond);
        params.push(...statuses, ...statuses);
      }
      const advAdvisorFilter = searchParams.get("advisors")?.trim();
      const advAdvisorOp = searchParams.get("advisorOp") || "in";
      if (advAdvisorFilter) {
        const advisors = advAdvisorFilter.split(',').map((s: string) => s.trim());
        const ph = advisors.map(() => '?').join(',');
        const advCond = `(advisor IN (${ph}) OR (json_valid(status) AND json_extract(status, '$.consultant') IN (${ph})))`;
        conditions.push(advAdvisorOp === "notIn" ? `NOT ${advCond}` : advCond);
        params.push(...advisors, ...advisors);
      }
      const searchQuery = searchParams.get("search")?.trim();
      if (searchQuery) {
        const likeTerm = `%${searchQuery}%`;
        conditions.push(`(name LIKE ? OR phone LIKE ? OR email LIKE ? OR advisor LIKE ? OR category LIKE ?)`);
        params.push(likeTerm, likeTerm, likeTerm, likeTerm, likeTerm);
      }
      
      const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
      const { total } = db.prepare(`SELECT COUNT(*) as total FROM customers${whereClause}`).get(...params) as { total: number };
      const customers = db.prepare(`SELECT id, email, name, phone, advisor, category, service, status, country, createdAt, updatedAt FROM customers${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);
      
      const parsed = customers.map((c: any) => {
        let statusStr = c.status || '';
        let advisorStr = c.advisor || '';
        let serviceStr = c.service || '';
        if (c.status && c.status.startsWith('{')) {
          try {
            const obj = JSON.parse(c.status);
            statusStr = obj.status || '';
            if (!advisorStr) advisorStr = obj.consultant || '';
            if (!serviceStr) serviceStr = obj.services || '';
          } catch {}
        }
        return { id: c.id, email: c.email || '', name: c.name || '', phone: c.phone || '', advisor: advisorStr, category: c.category || '', service: serviceStr, status: statusStr, country: c.country || '', createdAt: c.createdAt || '', updatedAt: c.updatedAt || '' };
      });
      
      db.close();
      return withCors(NextResponse.json({ data: parsed, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }), request);
    }
    
    // Aksi halde yeni müşteri ekleme
    const db = new Database(dbPath);
    
    const id = body.id || Date.now();
    const createdAt = body.createdAt || new Date().toISOString();
    const updatedAt = body.updatedAt || new Date().toISOString();
    
    // Düz alanları çıkar
    const email = body.email || body.personal?.email || '';
    const name = body.name || body.personal?.name || '';
    const phone = body.phone || body.personal?.phone || '';
    const advisor = body.advisor || (typeof body.status === 'object' ? body.status?.consultant : '') || '';
    const category = body.category || (typeof body.status === 'object' ? body.status?.category : '') || '';
    const service = body.service || (typeof body.status === 'object' ? body.status?.services : '') || '';
    const status = typeof body.status === 'object' ? (body.status?.status || '') : (body.status || '');
    const country = body.country || body.personal?.country || '';
    const data = JSON.stringify(body);
    
    const stmt = db.prepare(`
      INSERT INTO customers (id, email, name, phone, advisor, category, service, status, country, createdAt, updatedAt, data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        email = excluded.email,
        name = excluded.name,
        phone = excluded.phone,
        advisor = excluded.advisor,
        category = excluded.category,
        service = excluded.service,
        status = excluded.status,
        country = excluded.country,
        updatedAt = excluded.updatedAt,
        data = excluded.data
    `);
    
    stmt.run(id, email, name, phone, advisor, category, service, status, country, createdAt, updatedAt, data);
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
    
    // Düz alanları çıkar
    const email = body.email || body.personal?.email || '';
    const name = body.name || body.personal?.name || '';
    const phone = body.phone || body.personal?.phone || '';
    const advisor = body.advisor || (typeof body.status === 'object' ? body.status?.consultant : '') || '';
    const category = body.category || (typeof body.status === 'object' ? body.status?.category : '') || '';
    const service = body.service || (typeof body.status === 'object' ? body.status?.services : '') || '';
    const status = typeof body.status === 'object' ? (body.status?.status || '') : (body.status || '');
    const country = body.country || body.personal?.country || '';
    const updatedAt = body.updatedAt || new Date().toISOString();
    const data = JSON.stringify(body);
    
    const stmt = db.prepare(`
      UPDATE customers SET
        email = ?,
        name = ?,
        phone = ?,
        advisor = ?,
        service = ?,
        category = ?,
        status = ?,
        country = ?,
        updatedAt = ?,
        data = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(
      email, name, phone, advisor, service, category, status, country, updatedAt, data,
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
