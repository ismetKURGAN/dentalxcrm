const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../db.json');
const USERS_PATH = path.join(__dirname, '../users.json');

async function fixOldCustomers() {
  console.log('🚀 Eski müşteri formatını düzeltme işlemi başlatılıyor...\n');
  
  try {
    // Kullanıcıları oku
    const users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf-8'));
    const emailToName = {};
    users.forEach(u => {
      emailToName[u.email] = u.name;
    });
    
    console.log('📖 Kullanıcılar yüklendi:', users.length);
    
    // Müşterileri oku
    let customers = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    console.log('📖 Müşteriler yüklendi:', customers.length);
    console.log();
    
    let fixed = 0;
    let alreadyOk = 0;
    let errors = [];
    
    // Her müşteri için kontrol et
    for (let customer of customers) {
      // Status string ise (eski format)
      if (typeof customer.status === 'string') {
        const oldStatus = customer.status;
        const soldBy = customer.soldBy;
        
        // soldBy'dan danışman adını çıkar
        let consultant = '';
        if (soldBy && emailToName[soldBy]) {
          consultant = emailToName[soldBy];
        }
        
        // Status'u dict formatına çevir
        customer.status = {
          consultant: consultant,
          category: '',
          services: '',
          status: 'Satış', // Eski hastalar satış olarak işaretle
        };
        
        // soldBy yoksa ekle
        if (!customer.soldBy && consultant) {
          // Danışman varsa email'ini bul
          const user = users.find(u => u.name === consultant);
          if (user) {
            customer.soldBy = user.email;
          }
        }
        
        fixed++;
        
        if (fixed <= 5) {
          console.log(`✓ Düzeltildi: ID ${customer.id}`);
          console.log(`  Eski status: "${oldStatus}"`);
          console.log(`  Yeni status: "Satış"`);
          console.log(`  Danışman: "${consultant}"`);
          console.log(`  SoldBy: "${customer.soldBy || 'YOK'}"`);
          console.log();
        }
      } else if (typeof customer.status === 'object') {
        // Zaten dict formatında
        alreadyOk++;
        
        // Ama soldBy varsa ve consultant yoksa, soldBy'dan danışman ata
        if (customer.soldBy && !customer.status.consultant) {
          const consultantName = emailToName[customer.soldBy];
          if (consultantName) {
            customer.status.consultant = consultantName;
            fixed++;
          }
        }
        
        // soldBy varsa ve status "Satış" değilse, "Satış" yap
        if (customer.soldBy && customer.status.status !== 'Satış') {
          customer.status.status = 'Satış';
          fixed++;
        }
      }
    }
    
    // Veritabanını kaydet
    console.log('💾 Veritabanı kaydediliyor...');
    fs.writeFileSync(DB_PATH, JSON.stringify(customers, null, 2), 'utf-8');
    
    // Özet
    console.log('\n' + '='.repeat(50));
    console.log('✅ ESKİ MÜŞTERİ DÜZELTME İŞLEMİ TAMAMLANDI!');
    console.log('='.repeat(50));
    console.log(`📊 Toplam müşteri: ${customers.length}`);
    console.log(`✅ Düzeltilen: ${fixed}`);
    console.log(`⏭️  Zaten doğru: ${alreadyOk}`);
    console.log(`❌ Hata: ${errors.length}`);
    console.log('='.repeat(50));
    
    if (errors.length > 0) {
      console.log('\n❌ Hatalar:');
      errors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. ${err}`);
      });
    }
    
    console.log();
    
  } catch (error) {
    console.error('❌ HATA:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixOldCustomers();
