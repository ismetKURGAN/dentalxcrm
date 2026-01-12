const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../db.json');
const USERS_PATH = path.join(__dirname, '../users.json');

async function assignConsultants() {
  console.log('🚀 82 müşteriye danışman atama işlemi başlatılıyor...\n');
  
  try {
    // Kullanıcıları oku
    const users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf-8'));
    
    // Danışman rolü olanları filtrele
    const consultants = users.filter(u => 
      Array.isArray(u.roles) && u.roles.includes('Danışman')
    );
    
    console.log(`📋 Danışman listesi: ${consultants.length} kişi`);
    consultants.forEach(c => console.log(`  - ${c.name}`));
    console.log();
    
    // Müşterileri oku
    let customers = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    console.log(`📖 Toplam müşteri: ${customers.length}`);
    
    // soldBy olmayan müşteriler (bizim gerçek leadler)
    const ourLeads = customers.filter(c => !c.soldBy);
    console.log(`📊 Bizim leadler (soldBy yok): ${ourLeads.length}`);
    console.log();
    
    if (ourLeads.length === 0) {
      console.log('✅ Tüm müşterilere zaten danışman atanmış!');
      return;
    }
    
    let assigned = 0;
    let consultantIndex = 0;
    
    console.log('🔄 Danışman atama işlemi başlıyor...\n');
    
    // Her müşteri için
    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      
      // soldBy yoksa (bizim lead)
      if (!customer.soldBy) {
        // Round-robin ile danışman seç
        const consultant = consultants[consultantIndex % consultants.length];
        
        // Status objesini güncelle
        if (typeof customer.status === 'object' && customer.status !== null) {
          customer.status.consultant = consultant.name;
        } else {
          // Eski format (string) ise yeni formata çevir
          customer.status = {
            consultant: consultant.name,
            category: '',
            services: '',
            status: customer.status || 'Yeni Form'
          };
        }
        
        // WhatsApp mesajı gönderildi mi kontrol et (registerDate'e göre)
        // Eğer müşteri 18 Aralık'tan önce kaydedildiyse WhatsApp gönderilmiştir
        const registerDate = new Date(customer.createdAt || customer.personal?.registerDate);
        const cutoffDate = new Date('2025-12-18T00:00:00Z');
        
        if (registerDate < cutoffDate) {
          // WhatsApp gönderildi işareti ekle
          if (!customer.whatsappSent) {
            customer.whatsappSent = true;
            customer.whatsappSentAt = customer.createdAt || customer.personal?.registerDate;
          }
        }
        
        assigned++;
        consultantIndex++;
        
        if (assigned <= 10) {
          const name = customer.personal?.name || 'İsimsiz';
          console.log(`✓ ${assigned}. ${name} → ${consultant.name}`);
          if (customer.whatsappSent) {
            console.log(`   WhatsApp: Gönderildi (${customer.whatsappSentAt})`);
          }
        }
      }
    }
    
    if (assigned > 10) {
      console.log(`   ... ve ${assigned - 10} müşteri daha`);
    }
    
    // Veritabanını kaydet
    console.log('\n💾 Veritabanı kaydediliyor...');
    fs.writeFileSync(DB_PATH, JSON.stringify(customers, null, 2), 'utf-8');
    
    // Özet
    console.log('\n' + '='.repeat(50));
    console.log('✅ DANIŞMAN ATAMA İŞLEMİ TAMAMLANDI!');
    console.log('='.repeat(50));
    console.log(`📊 Toplam müşteri: ${customers.length}`);
    console.log(`✅ Danışman atanan: ${assigned}`);
    console.log(`👥 Kullanılan danışman: ${consultants.length}`);
    console.log('='.repeat(50));
    
    // Danışman başına dağılım
    console.log('\n📊 Danışman başına dağılım:');
    const distribution = {};
    consultants.forEach(c => {
      const count = customers.filter(customer => 
        typeof customer.status === 'object' && 
        customer.status?.consultant === c.name &&
        !customer.soldBy
      ).length;
      distribution[c.name] = count;
    });
    
    Object.entries(distribution)
      .sort((a, b) => b[1] - a[1])
      .forEach(([name, count]) => {
        console.log(`  ${name}: ${count} müşteri`);
      });
    
    console.log();
    
  } catch (error) {
    console.error('❌ HATA:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

assignConsultants();
