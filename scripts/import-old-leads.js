const fs = require('fs');
const path = require('path');

// Dosya yolları
const OLD_LEADS_PATH = path.join(__dirname, '../app/old_leads.json');
const DB_PATH = path.join(__dirname, '../db.json');
const LOG_PATH = path.join(__dirname, '../import-log.json');

// Ülke kodlarından ülke ismi çıkarma
const COUNTRY_CODES = {
  '44': 'United Kingdom',
  '358': 'Finland',
  '49': 'Germany',
  '996': 'Kyrgyzstan',
  '90': 'Turkey',
  '1': 'USA/Canada',
  '48': 'Poland',
  '370': 'Lithuania',
  '371': 'Latvia',
  '372': 'Estonia',
  '46': 'Sweden',
  '47': 'Norway',
  '45': 'Denmark',
  '31': 'Netherlands',
  '32': 'Belgium',
  '33': 'France',
  '34': 'Spain',
  '39': 'Italy',
  '41': 'Switzerland',
  '43': 'Austria',
};

function getCountryFromPhone(phone) {
  const phoneStr = String(phone);
  
  // 3 haneli kodları kontrol et
  for (let i = 3; i >= 1; i--) {
    const code = phoneStr.substring(0, i);
    if (COUNTRY_CODES[code]) {
      return COUNTRY_CODES[code];
    }
  }
  
  return 'Unknown';
}

function formatPhone(phone) {
  const phoneStr = String(phone);
  
  // Eğer + ile başlamıyorsa ekle
  if (!phoneStr.startsWith('+')) {
    return '+' + phoneStr;
  }
  
  return phoneStr;
}

function parseDate(dateStr) {
  try {
    // Format: "11/28/2025 11:21"
    const [datePart, timePart] = dateStr.split(' ');
    const [month, day, year] = datePart.split('/');
    
    if (timePart) {
      const [hour, minute] = timePart.split(':');
      return new Date(year, month - 1, day, hour, minute).toISOString();
    }
    
    return new Date(year, month - 1, day).toISOString();
  } catch (e) {
    return new Date().toISOString();
  }
}

function convertOldLeadToNewFormat(oldLead, newId) {
  const phone = formatPhone(oldLead['48514201539']);
  const country = getCountryFromPhone(oldLead['48514201539']);
  
  return {
    id: newId,
    personal: {
      name: oldLead['Karol Kujaszewski'] || '',
      phone: phone,
      email: '',
      country: country,
      notes: 'Eski sistemden aktarıldı',
      registerDate: parseDate(oldLead['11/30/2025 18:49'] || ''),
      facebook: {
        adName: '',
        adGroupName: '',
        campaignName: '',
        leadFormId: '',
      },
    },
    status: {
      consultant: oldLead['Lejla'] || '',
      category: '',
      services: '',
      status: 'Satış',
    },
    reminder: {
      enabled: false,
      datetime: '',
      notes: '',
    },
    payment: {
      prePayments: [
        {
          id: Date.now(),
          tripName: '1. Seyahat',
          description: '',
          amount: '',
          currency: '',
        },
      ],
      prePaymentNotes: '',
      finalPayments: {
        costs: [
          {
            id: Date.now(),
            category: '1. Seyahat',
            amount: '',
            currency: '',
          },
        ],
        sales: [
          {
            id: Date.now() + 1,
            category: '1. Seyahat',
            amount: '',
            currency: '',
          },
        ],
        notes: '',
      },
    },
    sales: {
      date: '',
      healthNotes: '',
      feedback: {
        trustpilotReview: false,
        googleReview: false,
        satisfactionSurvey: false,
        guaranteeSent: false,
        rpt: false,
      },
      trips: [],
    },
    calls: [],
    files: [],
    createdAt: parseDate(oldLead['11/30/2025 18:49'] || ''),
    updatedAt: new Date().toISOString(),
  };
}

async function importOldLeads() {
  console.log('🚀 Eski lead import işlemi başlatılıyor...\n');
  
  const log = {
    startTime: new Date().toISOString(),
    totalRecords: 0,
    validRecords: 0,
    imported: 0,
    skipped: 0,
    errors: [],
    duplicates: [],
  };
  
  try {
    // Eski lead dosyasını oku
    console.log('📖 Eski lead dosyası okunuyor...');
    let oldLeadsContent = fs.readFileSync(OLD_LEADS_PATH, 'utf-8').trim();
    
    // JSON array formatına dönüştür
    if (!oldLeadsContent.startsWith('[')) {
      oldLeadsContent = '[' + oldLeadsContent;
    }
    if (!oldLeadsContent.endsWith(']')) {
      oldLeadsContent = oldLeadsContent + ']';
    }
    
    const oldLeads = JSON.parse(oldLeadsContent);
    log.totalRecords = oldLeads.length;
    
    // Geçerli kayıtları filtrele
    const validLeads = oldLeads.filter(
      (item) => item !== null && typeof item === 'object' && Object.keys(item).length > 0
    );
    log.validRecords = validLeads.length;
    
    console.log(`✅ ${log.validRecords} geçerli kayıt bulundu (${log.totalRecords} toplam)\n`);
    
    // Mevcut db.json'ı oku
    console.log('📖 Mevcut veritabanı okunuyor...');
    let existingData = [];
    if (fs.existsSync(DB_PATH)) {
      existingData = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    }
    
    console.log(`📊 Mevcut kayıt sayısı: ${existingData.length}\n`);
    
    // Yeni ID hesapla
    let nextId = existingData.length > 0 
      ? Math.max(...existingData.map(item => item.id)) + 1 
      : 1;
    
    // Duplicate kontrolü için telefon listesi
    const existingPhones = new Set(
      existingData.map(item => item.personal.phone)
    );
    
    // Her kaydı dönüştür ve ekle
    console.log('🔄 Kayıtlar dönüştürülüyor ve ekleniyor...\n');
    
    for (let i = 0; i < validLeads.length; i++) {
      const oldLead = validLeads[i];
      
      try {
        const phone = formatPhone(oldLead['48514201539']);
        
        // Duplicate kontrolü
        if (existingPhones.has(phone)) {
          log.duplicates.push({
            name: oldLead['Karol Kujaszewski'],
            phone: phone,
            reason: 'Telefon numarası zaten mevcut',
          });
          log.skipped++;
          continue;
        }
        
        // Yeni formata dönüştür
        const newLead = convertOldLeadToNewFormat(oldLead, nextId);
        
        // Ekle
        existingData.push(newLead);
        existingPhones.add(phone);
        
        log.imported++;
        nextId++;
        
        // İlerleme göster
        if ((i + 1) % 50 === 0 || i === validLeads.length - 1) {
          console.log(`  ✓ ${i + 1}/${validLeads.length} kayıt işlendi`);
        }
      } catch (error) {
        log.errors.push({
          record: oldLead,
          error: error.message,
        });
      }
    }
    
    // Veritabanını kaydet
    console.log('\n💾 Veritabanı kaydediliyor...');
    fs.writeFileSync(DB_PATH, JSON.stringify(existingData, null, 2), 'utf-8');
    
    log.endTime = new Date().toISOString();
    
    // Log dosyasını kaydet
    fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2), 'utf-8');
    
    // Özet
    console.log('\n' + '='.repeat(50));
    console.log('✅ İMPORT İŞLEMİ TAMAMLANDI!');
    console.log('='.repeat(50));
    console.log(`📊 Toplam kayıt: ${log.totalRecords}`);
    console.log(`✅ Geçerli kayıt: ${log.validRecords}`);
    console.log(`➕ Eklenen: ${log.imported}`);
    console.log(`⏭️  Atlanan (duplicate): ${log.skipped}`);
    console.log(`❌ Hata: ${log.errors.length}`);
    console.log(`📁 Yeni toplam: ${existingData.length}`);
    console.log('='.repeat(50));
    
    if (log.duplicates.length > 0) {
      console.log('\n⚠️  Duplicate kayıtlar (ilk 10):');
      log.duplicates.slice(0, 10).forEach((dup, idx) => {
        console.log(`  ${idx + 1}. ${dup.name} - ${dup.phone}`);
      });
    }
    
    if (log.errors.length > 0) {
      console.log('\n❌ Hatalar:');
      log.errors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. ${err.error}`);
      });
    }
    
    console.log(`\n📄 Detaylı log: ${LOG_PATH}\n`);
    
  } catch (error) {
    console.error('❌ HATA:', error.message);
    log.errors.push({ error: error.message, stack: error.stack });
    fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2), 'utf-8');
    process.exit(1);
  }
}

// Scripti çalıştır
importOldLeads();
