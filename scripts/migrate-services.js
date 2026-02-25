const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'crm.db');
const db = new Database(dbPath);

console.log('🚀 Hizmet Migration Başlıyor...\n');

try {
  db.prepare('BEGIN').run();

  const customers = db.prepare('SELECT id, data, status FROM customers').all();
  console.log(`📊 Toplam ${customers.length} müşteri bulundu`);

  let updated = 0;
  let foundServices = 0;
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

      // data kolonundaki service bilgisini al
      let fullData = {};
      if (customer.data && typeof customer.data === 'string') {
        try {
          fullData = JSON.parse(customer.data);
        } catch (e) {
          fullData = {};
        }
      }

      const serviceFromData = fullData.service || '';

      // Eğer data'da service varsa ve status.services boşsa
      if (serviceFromData && serviceFromData.trim() !== '') {
        if (!statusObj.services || statusObj.services === '') {
          statusObj.services = serviceFromData;
          updateStmt.run(JSON.stringify(statusObj), customer.id);
          updated++;
          foundServices++;

          if (updated <= 5) {
            console.log(`✅ Örnek: ID ${customer.id} → "${serviceFromData}"`);
          }
        }
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
  console.log(`   • Hizmet bulunan: ${foundServices}`);

  // Kontrol - En yaygın hizmetler
  console.log('\n🔍 En yaygın hizmetler:');
  const serviceCounts = db.prepare(`
    SELECT 
      json_extract(status, '$.services') as service_value,
      COUNT(*) as count
    FROM customers
    WHERE json_extract(status, '$.services') IS NOT NULL
    AND json_extract(status, '$.services') != ''
    GROUP BY service_value
    ORDER BY count DESC
    LIMIT 15
  `).all();

  serviceCounts.forEach(s => {
    const serviceName = s.service_value || 'BOŞ';
    console.log(`   ${serviceName.substring(0, 50)}: ${s.count}`);
  });

} catch (error) {
  console.error('❌ FATAL ERROR:', error.message);
  db.prepare('ROLLBACK').run();
} finally {
  db.close();
}
