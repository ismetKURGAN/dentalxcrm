const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'crm.db');
const db = new Database(dbPath);

console.log('🚀 Danışman Migration Başlıyor...\n');

try {
  // Transaction başlat
  db.prepare('BEGIN').run();

  // Tüm müşterileri getir
  const customers = db.prepare('SELECT id, advisor, status FROM customers').all();
  console.log(`📊 Toplam ${customers.length} müşteri bulundu`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  const updateStmt = db.prepare('UPDATE customers SET status = ? WHERE id = ?');

  customers.forEach((customer, index) => {
    try {
      // Advisor varsa migrate et
      if (customer.advisor && customer.advisor.trim() !== '') {
        // Mevcut status objesini parse et
        let statusObj = {};
        try {
          statusObj = typeof customer.status === 'string' 
            ? JSON.parse(customer.status) 
            : (customer.status || {});
        } catch (e) {
          statusObj = {};
        }

        // Status.consultant'ı güncelle
        statusObj.consultant = customer.advisor;

        // Veritabanına yaz
        const statusJson = JSON.stringify(statusObj);
        updateStmt.run(statusJson, customer.id);
        updated++;

        if ((index + 1) % 100 === 0) {
          console.log(`⏳ İşlenen: ${index + 1}/${customers.length}`);
        }
      } else {
        skipped++;
      }
    } catch (error) {
      console.error(`❌ Hata (ID: ${customer.id}):`, error.message);
      errors++;
    }
  });

  // Transaction commit
  db.prepare('COMMIT').run();

  console.log('\n✅ Migration Tamamlandı!');
  console.log(`   • Güncellenen: ${updated}`);
  console.log(`   • Atlanan: ${skipped}`);
  console.log(`   • Hata: ${errors}`);

  // Kontrol et
  console.log('\n🔍 Kontrol ediliyor...');
  let verified = 0;
  const verifyCustomers = db.prepare('SELECT status FROM customers').all();
  verifyCustomers.forEach(c => {
    try {
      const status = typeof c.status === 'string' ? JSON.parse(c.status) : c.status;
      if (status && status.consultant && status.consultant.trim() !== '') {
        verified++;
      }
    } catch (e) {}
  });
  console.log(`✅ Status.consultant olan müşteri: ${verified}/${customers.length}`);

} catch (error) {
  console.error('❌ FATAL ERROR:', error.message);
  db.prepare('ROLLBACK').run();
} finally {
  db.close();
}
