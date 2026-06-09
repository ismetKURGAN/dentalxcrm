import Database from "better-sqlite3";
import path from "path";

const SQLITE_DB_PATH = path.join(process.cwd(), "crm.db");

// Tüm müşterileri getir (lightweight - data kolonu yok)
export function getAllCustomersLight(): any[] {
  const db = new Database(SQLITE_DB_PATH, { readonly: true });
  const rows = db.prepare(
    "SELECT id, email, name, phone, advisor, category, service, status, country, createdAt, updatedAt FROM customers ORDER BY createdAt DESC"
  ).all();
  db.close();
  
  return rows.map((c: any) => {
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
    };
  });
}

// Tüm müşterileri getir (full data kolonu dahil)
export function getAllCustomersFull(): any[] {
  const db = new Database(SQLITE_DB_PATH, { readonly: true });
  const rows = db.prepare("SELECT * FROM customers ORDER BY createdAt DESC").all();
  db.close();
  
  return rows.map((c: any) => {
    let fullData: any = {};
    try { fullData = c.data ? JSON.parse(c.data) : {}; } catch { fullData = {}; }
    return { ...fullData, id: c.id, createdAt: c.createdAt };
  });
}

// Tek müşteri getir (full data)
export function getCustomerById(id: string | number): any | null {
  const db = new Database(SQLITE_DB_PATH, { readonly: true });
  const row = db.prepare("SELECT * FROM customers WHERE id = ?").get(id) as any;
  db.close();
  
  if (!row) return null;
  
  let fullData: any = {};
  try { fullData = row.data ? JSON.parse(row.data) : {}; } catch { fullData = {}; }
  
  // Status: fullData'daki obje formunu koru (consultant, category, services bilgisi için)
  // SQLite status kolonu sadece string tutar, obje bilgisi fullData'da
  let statusValue: any = fullData.status || '';
  if (typeof statusValue === 'string' && row.status && row.status !== statusValue) {
    // fullData.status string ama SQLite'taki farklıysa, SQLite'takini kullan
    statusValue = row.status;
  }
  
  return {
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
}

// Müşteri kaydet/güncelle (upsert)
export function upsertCustomer(customer: any): void {
  const db = new Database(SQLITE_DB_PATH);
  
  const id = customer.id;
  const email = customer.email || customer.personal?.email || '';
  const name = customer.name || customer.personal?.name || '';
  const phone = customer.phone || customer.personal?.phone || '';
  const advisor = customer.advisor || (typeof customer.status === 'object' ? customer.status?.consultant : '') || '';
  const category = customer.category || (typeof customer.status === 'object' ? customer.status?.category : '') || '';
  const service = customer.service || (typeof customer.status === 'object' ? customer.status?.services : '') || '';
  const status = typeof customer.status === 'object' ? (customer.status?.status || '') : (customer.status || '');
  const country = customer.country || customer.personal?.country || '';
  const createdAt = customer.createdAt || new Date().toISOString();
  const updatedAt = customer.updatedAt || new Date().toISOString();
  const data = JSON.stringify(customer);
  
  db.prepare(`
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
  `).run(id, email, name, phone, advisor, category, service, status, country, createdAt, updatedAt, data);
  
  db.close();
}

// Toplu müşteri güncelle (transaction ile)
export function upsertCustomersBatch(customers: any[]): void {
  const db = new Database(SQLITE_DB_PATH);
  
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
  
  const insertMany = db.transaction((items: any[]) => {
    for (const customer of items) {
      const id = customer.id;
      const email = customer.email || customer.personal?.email || '';
      const name = customer.name || customer.personal?.name || '';
      const phone = customer.phone || customer.personal?.phone || '';
      const advisor = customer.advisor || (typeof customer.status === 'object' ? customer.status?.consultant : '') || '';
      const category = customer.category || (typeof customer.status === 'object' ? customer.status?.category : '') || '';
      const service = customer.service || (typeof customer.status === 'object' ? customer.status?.services : '') || '';
      const status = typeof customer.status === 'object' ? (customer.status?.status || '') : (customer.status || '');
      const country = customer.country || customer.personal?.country || '';
      const createdAt = customer.createdAt || new Date().toISOString();
      const updatedAt = customer.updatedAt || new Date().toISOString();
      const data = JSON.stringify(customer);
      
      stmt.run(id, email, name, phone, advisor, category, service, status, country, createdAt, updatedAt, data);
    }
  });
  
  insertMany(customers);
  db.close();
}

// Aktif hatırlatıcısı olan müşterileri getir (check-reminders için optimize)
export function getCustomersWithActiveReminders(): any[] {
  const db = new Database(SQLITE_DB_PATH, { readonly: true });
  const rows = db.prepare(`
    SELECT id, name, phone, advisor, status, data 
    FROM customers 
    WHERE json_valid(data) 
      AND json_extract(data, '$.reminder.enabled') = 1 
      AND (json_extract(data, '$.reminder.sent') IS NULL OR json_extract(data, '$.reminder.sent') = 0)
  `).all();
  db.close();
  
  return rows.map((c: any) => {
    let fullData: any = {};
    try { fullData = c.data ? JSON.parse(c.data) : {}; } catch { fullData = {}; }
    return { ...fullData, id: c.id, createdAt: fullData.createdAt };
  });
}

// Müşteri sil
export function deleteCustomer(id: string | number): boolean {
  const db = new Database(SQLITE_DB_PATH);
  const result = db.prepare("DELETE FROM customers WHERE id = ?").run(id);
  db.close();
  return result.changes > 0;
}

// Aynı telefon numarasıyla kaç kez eklendiğini say
export function countDuplicatesByPhone(phone: string): number {
  const db = new Database(SQLITE_DB_PATH, { readonly: true });
  
  const cleanPhone = (phone || '').replace(/\D/g, '');
  const phoneLast9 = cleanPhone.length >= 6 ? cleanPhone.slice(-9) : '';
  
  if (!phoneLast9) {
    db.close();
    return 0;
  }
  
  // Son 9 rakam karşılaştırması
  const rows = db.prepare("SELECT phone FROM customers WHERE phone != '' AND length(phone) >= 6").all() as any[];
  const duplicates = rows.filter((r: any) => {
    const existingClean = (r.phone || '').replace(/\D/g, '');
    return existingClean.length >= 6 && existingClean.slice(-9) === phoneLast9;
  });
  
  db.close();
  return duplicates.length;
}

// Mükerrer kontrolü (email veya telefon)
export function findDuplicate(email: string, phone: string): any | null {
  const db = new Database(SQLITE_DB_PATH, { readonly: true });
  
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPhone = (phone || '').replace(/\D/g, '');
  const phoneLast9 = cleanPhone.length >= 6 ? cleanPhone.slice(-9) : '';
  
  let duplicate: any = null;
  
  if (cleanEmail) {
    duplicate = db.prepare("SELECT id, name, email, phone FROM customers WHERE LOWER(email) = ? LIMIT 1").get(cleanEmail) as any;
  }
  
  if (!duplicate && phoneLast9) {
    // Son 9 rakam karşılaştırması
    const rows = db.prepare("SELECT id, name, email, phone FROM customers WHERE phone != '' AND length(phone) >= 6").all() as any[];
    duplicate = rows.find((r: any) => {
      const existingClean = (r.phone || '').replace(/\D/g, '');
      return existingClean.length >= 6 && existingClean.slice(-9) === phoneLast9;
    });
  }
  
  db.close();
  return duplicate || null;
}
