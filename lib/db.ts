import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'crm.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better performance
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  if (!db) return;

  // Customers tablosu
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY,
      email TEXT,
      name TEXT,
      phone TEXT,
      advisor TEXT,
      category TEXT,
      service TEXT,
      status TEXT,
      country TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT,
      data TEXT NOT NULL -- JSON olarak tüm veriyi sakla (geriye uyumluluk için)
    );

    -- Index'ler (hızlı arama için)
    CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
    CREATE INDEX IF NOT EXISTS idx_customers_advisor ON customers(advisor);
    CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
    CREATE INDEX IF NOT EXISTS idx_customers_category ON customers(category);
    CREATE INDEX IF NOT EXISTS idx_customers_createdAt ON customers(createdAt DESC);
  `);
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
