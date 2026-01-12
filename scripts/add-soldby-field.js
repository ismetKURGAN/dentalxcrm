const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../db.json');
const USERS_PATH = path.join(__dirname, '../users.json');

async function addSoldByField() {
  console.log('🚀 soldBy alanı ekleme işlemi başlatılıyor...\n');
  
  try {
    // Kullanıcıları oku
    const users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf-8'));
    const userMap = {};
    users.forEach(u => {
      userMap[u.name] = u.email;
    });
    
    console.log('📖 Kullanıcılar yüklendi:', Object.keys(userMap).length);
    
    // Müşterileri oku
    let customers = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    console.log('📖 Müşteriler yüklendi:', customers.length);
    console.log();
    
    let updated = 0;
    let alreadyHas = 0;
    let noConsultant = 0;
    let consultantNotFound = [];
    
    // Her müşteri için soldBy ekle
    for (let customer of customers) {
      // Zaten soldBy varsa atla
      if (customer.soldBy) {
        alreadyHas++;
        continue;
      }
      
      // Danışman bilgisini al
      let consultant = null;
      
      if (typeof customer.status === 'object' && customer.status.consultant) {
        consultant = customer.status.consultant;
      } else if (typeof customer.status === 'string') {
        // Eski formatta status string ise, consultant bilgisi yok
        // Bu durumda soldBy boş bırakılabilir veya varsayılan değer verilebilir
        noConsultant++;
        continue;
      }
      
      if (!consultant) {
        noConsultant++;
        continue;
      }
      
      // Danışmanın email'ini bul
      const consultantEmail = userMap[consultant];
      
      if (!consultantEmail) {
        consultantNotFound.push({ id: customer.id, consultant });
        continue;
      }
      
      // soldBy ekle
      customer.soldBy = consultantEmail;
      updated++;
    }
    
    // Veritabanını kaydet
    console.log('💾 Veritabanı kaydediliyor...');
    fs.writeFileSync(DB_PATH, JSON.stringify(customers, null, 2), 'utf-8');
    
    // Özet
    console.log('\n' + '='.repeat(50));
    console.log('✅ soldBy ALANI EKLEME İŞLEMİ TAMAMLANDI!');
    console.log('='.repeat(50));
    console.log(`📊 Toplam müşteri: ${customers.length}`);
    console.log(`✅ soldBy eklendi: ${updated}`);
    console.log(`⏭️  Zaten var: ${alreadyHas}`);
    console.log(`⚠️  Danışman bilgisi yok: ${noConsultant}`);
    console.log(`❌ Danışman bulunamadı: ${consultantNotFound.length}`);
    console.log('='.repeat(50));
    
    if (consultantNotFound.length > 0) {
      console.log('\n⚠️  Bulunamayan danışmanlar (ilk 10):');
      consultantNotFound.slice(0, 10).forEach((item, idx) => {
        console.log(`  ${idx + 1}. Müşteri ID: ${item.id}, Danışman: ${item.consultant}`);
      });
    }
    
    console.log();
    
  } catch (error) {
    console.error('❌ HATA:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

addSoldByField();
