const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'crm.db');
const db = new Database(dbPath);

console.log('🚀 Varsayılan Status Ekleniyor...\n');

try {
  db.prepare('BEGIN').run();

  const customers = db.prepare('SELECT id, status FROM customers').all();
  console.log(`📊 Toplam ${customers.length} müşteri bulundu`);

  let updated = 0;
  const updateStmt = db.prepare('UPDATE customers SET status = ? WHERE id = ?');

  customers.forEach((customer, index) => {
    try {
      let statusObj = {};
      
      // Mevcut status'u parse et
      if (customer.status && typeof customer.status === 'string') {
        try {
          statusObj = JSON.parse(customer.status);
        } catch (e) {
          statusObj = {};
        }
      }

      // Eğer status.status yoksa varsayılan ekle
      if (!statusObj.status || statusObj.status === '') {
        statusObj.status = 'Seçiniz';
        
        // Güncelle
        updateStmt.run(JSON.stringify(statusObj), customer.id);
        updated++;
      }

      if ((index + 1) % 500 === 0) {
        console.log(`⏳ İşlenen: ${index + 1}/${customers.length}`);
      }
    } catch (error) {
      console.error(`❌ Hata (ID: ${customer.id}):`, error.message);
    }
  });

  db.prepare('COMMIT').run();

  console.log(`\n✅ Tamamlandı!`);
  console.log(`   • Güncellenen: ${updated}`);
  console.log(`   • Değişmeden kalan: ${customers.length - updated}`);

} catch (error) {
  console.error('❌ FATAL ERROR:', error.message);
  db.prepare('ROLLBACK').run();
} finally {
  db.close();
}
