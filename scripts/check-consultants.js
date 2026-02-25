const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'crm.db');
const db = new Database(dbPath);

try {
  // Toplam müşteri sayısı
  const total = db.prepare('SELECT COUNT(*) as count FROM customers').get();
  console.log('📊 Toplam müşteri:', total.count);

  // Status içinde consultant bilgisi kontrol et (try-catch ile)
  let withConsultant = 0;
  const allCustomers = db.prepare('SELECT status FROM customers').all();
  allCustomers.forEach(c => {
    try {
      const status = typeof c.status === 'string' ? JSON.parse(c.status) : c.status;
      if (status && status.consultant && status.consultant.trim() !== '') {
        withConsultant++;
      }
    } catch (e) {}
  });
  console.log('✅ Status.consultant olan:', withConsultant);

  // Advisor field'ında veri olan kayıtlar
  const withAdvisor = db.prepare(`
    SELECT COUNT(*) as count 
    FROM customers 
    WHERE advisor IS NOT NULL AND advisor != ''
  `).get();
  console.log('📋 Advisor field olan:', withAdvisor.count);

  // Örnek kayıtlar
  console.log('\n📝 Örnek 5 kayıt:');
  const samples = db.prepare(`
    SELECT id, name, advisor, status 
    FROM customers 
    LIMIT 5
  `).all();
  
  samples.forEach(c => {
    let statusObj = {};
    try {
      statusObj = typeof c.status === 'string' ? JSON.parse(c.status) : c.status;
    } catch (e) {}
    
    console.log(`ID: ${c.id}, İsim: ${c.name}, Advisor field: ${c.advisor || 'BOŞ'}, Status.consultant: ${statusObj.consultant || 'BOŞ'}`);
  });

  // Migration gerekli kayıtları say
  let needMigration = 0;
  const customersWithAdvisor = db.prepare('SELECT advisor, status FROM customers WHERE advisor IS NOT NULL AND advisor != ""').all();
  customersWithAdvisor.forEach(c => {
    try {
      const status = typeof c.status === 'string' ? JSON.parse(c.status) : c.status;
      if (!status || !status.consultant || status.consultant.trim() === '') {
        needMigration++;
      }
    } catch (e) {
      needMigration++;
    }
  });
  console.log(`\n⚠️  Migration gerekli kayıt: ${needMigration}`);

} catch (error) {
  console.error('❌ Hata:', error.message);
} finally {
  db.close();
}
