const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'crm.db');
const db = new Database(dbPath);

console.log('🔍 Hizmet Bilgisi Kontrol Ediliyor...\n');

try {
  const total = db.prepare('SELECT COUNT(*) as count FROM customers').get();
  console.log('📊 Toplam müşteri:', total.count);

  // Service column'unda veri var mı?
  const withService = db.prepare("SELECT COUNT(*) as count FROM customers WHERE service IS NOT NULL AND service != ''").get();
  console.log('✅ Service column dolu:', withService.count);

  // Data kolonunda service bilgisi kontrol et
  const samples = db.prepare('SELECT id, name, service, status, data FROM customers LIMIT 10').all();
  
  console.log('\n📝 Örnek 10 kayıt:\n');
  
  let foundInData = 0;
  let foundInStatusObj = 0;
  
  samples.forEach((c, idx) => {
    try {
      let fullData = {};
      if (c.data && typeof c.data === 'string') {
        fullData = JSON.parse(c.data);
      }

      let statusObj = {};
      if (c.status && typeof c.status === 'string') {
        statusObj = JSON.parse(c.status);
      }

      const serviceInColumn = c.service || '';
      const serviceInData = fullData.service || '';
      const serviceInStatus = statusObj.services || '';

      if (serviceInData) foundInData++;
      if (serviceInStatus) foundInStatusObj++;

      if (idx < 5) {
        console.log(`${idx + 1}. ${c.name}`);
        console.log(`   Service column: "${serviceInColumn}"`);
        console.log(`   Data.service: "${serviceInData}"`);
        console.log(`   Status.services: "${serviceInStatus}"`);
        console.log('');
      }
    } catch (e) {
      console.error(`Hata (ID: ${c.id}):`, e.message);
    }
  });

  console.log(`\n📊 İlk 10 kayıtta:`);
  console.log(`   Data.service bulunan: ${foundInData}`);
  console.log(`   Status.services bulunan: ${foundInStatusObj}`);

  // Tüm veritabanında service bilgisi olan kayıtları say
  const allCustomers = db.prepare('SELECT data, status FROM customers').all();
  let totalWithServiceInData = 0;
  let totalWithServiceInStatus = 0;

  allCustomers.forEach(c => {
    try {
      let fullData = {};
      if (c.data && typeof c.data === 'string') {
        fullData = JSON.parse(c.data);
      }
      if (fullData.service && fullData.service.trim() !== '') {
        totalWithServiceInData++;
      }

      let statusObj = {};
      if (c.status && typeof c.status === 'string') {
        statusObj = JSON.parse(c.status);
      }
      if (statusObj.services && statusObj.services.trim() !== '') {
        totalWithServiceInStatus++;
      }
    } catch (e) {}
  });

  console.log(`\n📊 Tüm veritabanında:`);
  console.log(`   Data.service olan: ${totalWithServiceInData}`);
  console.log(`   Status.services olan: ${totalWithServiceInStatus}`);

} catch (error) {
  console.error('❌ Hata:', error.message);
} finally {
  db.close();
}
