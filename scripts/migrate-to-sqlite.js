const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'crm.db');
const JSON_PATH = path.join(process.cwd(), 'db.json');

console.log('🚀 SQLite Migration Başlıyor...\n');

// Veritabanını aç
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Şema oluştur
console.log('📋 Veritabanı şeması oluşturuluyor...');
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
    data TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
  CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
  CREATE INDEX IF NOT EXISTS idx_customers_advisor ON customers(advisor);
  CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
  CREATE INDEX IF NOT EXISTS idx_customers_category ON customers(category);
  CREATE INDEX IF NOT EXISTS idx_customers_createdAt ON customers(createdAt DESC);
`);

console.log('✅ Şema oluşturuldu\n');

// JSON dosyasını oku
console.log('📖 db.json okunuyor...');
const jsonData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
console.log(`✅ ${jsonData.length} kayıt bulundu\n`);

// Prepared statement
const insert = db.prepare(`
  INSERT OR REPLACE INTO customers (
    id, email, name, phone, advisor, category, service, status, country, createdAt, updatedAt, data
  ) VALUES (
    @id, @email, @name, @phone, @advisor, @category, @service, @status, @country, @createdAt, @updatedAt, @data
  )
`);

// Transaction ile toplu insert (çok daha hızlı)
console.log('💾 Veriler SQLite\'a aktarılıyor...');
const insertMany = db.transaction((customers) => {
  for (const customer of customers) {
    // Status objesinden string çıkar
    let advisor = '';
    let status = '';
    let service = '';
    
    if (typeof customer.status === 'object' && customer.status !== null) {
      advisor = customer.status.consultant || '';
      status = customer.status.status || '';
      service = customer.status.services || customer.service || '';
    } else if (typeof customer.status === 'string') {
      status = customer.status;
      service = customer.service || '';
    }
    
    // Advisor düz alandan da gelebilir
    if (!advisor && customer.advisor) {
      advisor = customer.advisor;
    }

    insert.run({
      id: customer.id,
      email: customer.email || customer.personal?.email || null,
      name: customer.name || customer.personal?.name || null,
      phone: customer.phone || customer.personal?.phone || null,
      advisor: advisor || null,
      category: customer.category || null,
      service: service || null,
      status: status || null,
      country: customer.personal?.country || customer.country || null,
      createdAt: customer.createdAt || new Date().toISOString(),
      updatedAt: customer.updatedAt || null,
      data: JSON.stringify(customer) // Tüm veriyi JSON olarak sakla
    });
  }
});

try {
  insertMany(jsonData);
  console.log('✅ Tüm veriler başarıyla aktarıldı!\n');
} catch (error) {
  console.error('❌ Hata:', error);
  process.exit(1);
}

// İstatistikler
const count = db.prepare('SELECT COUNT(*) as count FROM customers').get();
const size = fs.statSync(DB_PATH).size;
const jsonSize = fs.statSync(JSON_PATH).size;

console.log('📊 İstatistikler:');
console.log(`   Toplam kayıt: ${count.count}`);
console.log(`   SQLite boyutu: ${(size / 1024 / 1024).toFixed(2)} MB`);
console.log(`   JSON boyutu: ${(jsonSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`   Tasarruf: ${(((jsonSize - size) / jsonSize) * 100).toFixed(1)}%\n`);

db.close();
console.log('✅ Migration tamamlandı! 🎉');
