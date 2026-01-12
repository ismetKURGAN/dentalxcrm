const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../db.json');

async function markExistingCustomers() {
  console.log('🚀 Mevcut müşterileri işaretleme işlemi başlatılıyor...\n');
  
  try {
    // Müşterileri oku
    let customers = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    console.log(`📖 Toplam müşteri: ${customers.length}`);
    
    // soldBy olmayan müşteriler (bizim gerçek leadler - 82 kişi)
    const ourLeads = customers.filter(c => !c.soldBy);
    console.log(`📊 Bizim leadler (soldBy yok): ${ourLeads.length}`);
    console.log();
    
    let marked = 0;
    
    console.log('🔄 İşaretleme başlıyor...\n');
    
    // Her müşteri için
    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      
      // soldBy yoksa (bizim lead) ve henüz işaretlenmemişse
      if (!customer.soldBy && !customer.noAutoWelcome) {
        // Otomatik karşılama mesajı gönderilmesin
        customer.noAutoWelcome = true;
        customer.markedAt = new Date().toISOString();
        
        marked++;
        
        if (marked <= 10) {
          const name = customer.personal?.name || 'İsimsiz';
          console.log(`✓ ${marked}. ${name} - Karşılama mesajı devre dışı`);
        }
      }
    }
    
    if (marked > 10) {
      console.log(`   ... ve ${marked - 10} müşteri daha`);
    }
    
    // Veritabanını kaydet
    console.log('\n💾 Veritabanı kaydediliyor...');
    fs.writeFileSync(DB_PATH, JSON.stringify(customers, null, 2), 'utf-8');
    
    // Özet
    console.log('\n' + '='.repeat(50));
    console.log('✅ İŞARETLEME İŞLEMİ TAMAMLANDI!');
    console.log('='.repeat(50));
    console.log(`📊 Toplam müşteri: ${customers.length}`);
    console.log(`✅ İşaretlenen: ${marked}`);
    console.log(`📝 Bu müşterilere elle danışman atandığında karşılama mesajı GİTMEYECEK`);
    console.log('='.repeat(50));
    console.log();
    
  } catch (error) {
    console.error('❌ HATA:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

markExistingCustomers();
