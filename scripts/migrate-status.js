const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'crm.db');
const db = new Database(dbPath);

console.log('🚀 Status Migration Başlıyor...\n');

try {
  db.prepare('BEGIN').run();

  // Tüm müşterileri getir
  const customers = db.prepare('SELECT id, data, status FROM customers').all();
  console.log(`📊 Toplam ${customers.length} müşteri bulundu`);

  let updated = 0;
  let hasOldStatus = 0;
  let noStatus = 0;
  const updateStmt = db.prepare('UPDATE customers SET status = ? WHERE id = ?');

  customers.forEach((customer, index) => {
    try {
      // Mevcut status objesini parse et
      let statusObj = {};
      if (customer.status && typeof customer.status === 'string') {
        try {
          statusObj = JSON.parse(customer.status);
        } catch (e) {
          statusObj = {};
        }
      }

      // data kolonundaki tüm veriyi parse et
      let fullData = {};
      if (customer.data && typeof customer.data === 'string') {
        try {
          fullData = JSON.parse(customer.data);
        } catch (e) {
          fullData = {};
        }
      }

      // Eski status bilgisini bul
      let oldStatus = '';
      
      // 1. fullData.status string ise
      if (fullData.status && typeof fullData.status === 'string') {
        oldStatus = fullData.status;
      }
      // 2. fullData.status.status varsa
      else if (fullData.status && typeof fullData.status === 'object' && fullData.status.status) {
        oldStatus = fullData.status.status;
      }

      // Eğer eski status bulunduysa ve şu anki "Seçiniz" ise
      if (oldStatus && oldStatus !== '' && oldStatus !== 'Seçiniz') {
        statusObj.status = oldStatus;
        updateStmt.run(JSON.stringify(statusObj), customer.id);
        updated++;
        hasOldStatus++;

        if (updated <= 5) {
          console.log(`✅ Örnek: ID ${customer.id} → "${oldStatus}"`);
        }
      } else if (!oldStatus || oldStatus === '') {
        noStatus++;
      }

      if ((index + 1) % 500 === 0) {
        console.log(`⏳ İşlenen: ${index + 1}/${customers.length}`);
      }
    } catch (error) {
      console.error(`❌ Hata (ID: ${customer.id}):`, error.message);
    }
  });

  db.prepare('COMMIT').run();

  console.log('\n✅ Migration Tamamlandı!');
  console.log(`   • Güncellenen: ${updated}`);
  console.log(`   • Eski status bulunan: ${hasOldStatus}`);
  console.log(`   • Status olmayan: ${noStatus}`);

  // Kontrol
  console.log('\n🔍 Status dağılımı:');
  const statusCounts = db.prepare(`
    SELECT 
      json_extract(status, '$.status') as status_value,
      COUNT(*) as count
    FROM customers
    GROUP BY status_value
    ORDER BY count DESC
    LIMIT 10
  `).all();

  statusCounts.forEach(s => {
    console.log(`   ${s.status_value || 'BOŞ'}: ${s.count}`);
  });

} catch (error) {
  console.error('❌ FATAL ERROR:', error.message);
  db.prepare('ROLLBACK').run();
} finally {
  db.close();
}
