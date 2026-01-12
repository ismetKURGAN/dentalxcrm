const fs = require('fs');
const path = require('path');

// Dosya yolları
const MANUEL_LEADS_PATH = path.join(__dirname, '../app/manuel-leads.txt');
const DB_PATH = path.join(__dirname, '../db.json');
const LOG_PATH = path.join(__dirname, '../import-manuel-log.json');

// Ülke kodlarından ülke ismi çıkarma
const COUNTRY_CODES = {
  '44': 'United Kingdom',
  '358': 'Finland',
  '49': 'Germany',
  '996': 'Kyrgyzstan',
  '998': 'Uzbekistan',
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
  '40': 'Romania',
  '41': 'Switzerland',
  '43': 'Austria',
  '380': 'Ukraine',
  '359': 'Bulgaria',
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
  const phoneStr = String(phone).trim();
  
  // Eğer + ile başlamıyorsa ekle
  if (!phoneStr.startsWith('+')) {
    return '+' + phoneStr;
  }
  
  return phoneStr;
}

function parseDate(dateStr) {
  try {
    // Format: "30-11-25 18:49" (DD-MM-YY HH:MM)
    const [datePart, timePart] = dateStr.split(' ');
    const [day, month, year] = datePart.split('-');
    
    // 2025 yılı olarak kabul et
    const fullYear = '20' + year;
    
    if (timePart) {
      const [hour, minute] = timePart.split(':');
      return new Date(fullYear, month - 1, day, hour, minute).toISOString();
    }
    
    return new Date(fullYear, month - 1, day).toISOString();
  } catch (e) {
    return new Date().toISOString();
  }
}

function convertManuelLeadToNewFormat(parts, newId) {
  // Format: ID, Tarih, Danışman, İsim, Telefon, Durum1, Durum2
  const [oldId, date, consultant, name, phone, status1, status2] = parts;
  
  const formattedPhone = formatPhone(phone);
  const country = getCountryFromPhone(phone);
  
  return {
    id: newId,
    personal: {
      name: name.trim(),
      phone: formattedPhone,
      email: '',
      country: country,
      notes: 'Manuel sistemden aktarıldı',
      registerDate: parseDate(date),
      facebook: {
        adName: '',
        adGroupName: '',
        campaignName: '',
        leadFormId: '',
      },
    },
    status: {
      consultant: consultant.trim(),
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
    createdAt: parseDate(date),
    updatedAt: new Date().toISOString(),
  };
}

async function importManuelLeads() {
  console.log('🚀 Manuel lead import işlemi başlatılıyor...\n');
  
  const log = {
    startTime: new Date().toISOString(),
    totalLines: 0,
    validRecords: 0,
    imported: 0,
    skipped: 0,
    errors: [],
    duplicates: [],
  };
  
  try {
    // Manuel lead dosyasını oku
    console.log('📖 Manuel lead dosyası okunuyor...');
    const content = fs.readFileSync(MANUEL_LEADS_PATH, 'utf-8');
    const lines = content.split('\n');
    log.totalLines = lines.length;
    
    // Geçerli satırları filtrele (boş olmayanlar)
    const validLines = lines.filter(line => line.trim().length > 0);
    
    // Her satırı parse et
    const records = [];
    for (const line of validLines) {
      const parts = line.split('\t').map(p => p.trim());
      
      // 7 alan olmalı: ID, Tarih, Danışman, İsim, Telefon, Durum1, Durum2
      if (parts.length >= 5 && parts[0] && parts[4]) {
        records.push(parts);
      }
    }
    
    log.validRecords = records.length;
    console.log(`✅ ${log.validRecords} geçerli kayıt bulundu (${log.totalLines} toplam satır)\n`);
    
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
    
    for (let i = 0; i < records.length; i++) {
      const parts = records[i];
      
      try {
        const phone = formatPhone(parts[4]);
        
        // Duplicate kontrolü
        if (existingPhones.has(phone)) {
          log.duplicates.push({
            name: parts[3],
            phone: phone,
            reason: 'Telefon numarası zaten mevcut',
          });
          log.skipped++;
          continue;
        }
        
        // Yeni formata dönüştür
        const newLead = convertManuelLeadToNewFormat(parts, nextId);
        
        // Ekle
        existingData.push(newLead);
        existingPhones.add(phone);
        
        log.imported++;
        nextId++;
        
        // İlerleme göster
        if ((i + 1) % 50 === 0 || i === records.length - 1) {
          console.log(`  ✓ ${i + 1}/${records.length} kayıt işlendi`);
        }
      } catch (error) {
        log.errors.push({
          record: parts,
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
    console.log('✅ MANUEL İMPORT İŞLEMİ TAMAMLANDI!');
    console.log('='.repeat(50));
    console.log(`📊 Toplam satır: ${log.totalLines}`);
    console.log(`✅ Geçerli kayıt: ${log.validRecords}`);
    console.log(`➕ Eklenen: ${log.imported}`);
    console.log(`⏭️  Atlanan (duplicate): ${log.skipped}`);
    console.log(`❌ Hata: ${log.errors.length}`);
    console.log(`📁 Yeni toplam: ${existingData.length}`);
    console.log('='.repeat(50));
    
    if (log.duplicates.length > 0) {
      console.log(`\n⚠️  Duplicate kayıtlar: ${log.duplicates.length} adet`);
      console.log('İlk 10:');
      log.duplicates.slice(0, 10).forEach((dup, idx) => {
        console.log(`  ${idx + 1}. ${dup.name} - ${dup.phone}`);
      });
      if (log.duplicates.length > 10) {
        console.log(`  ... ve ${log.duplicates.length - 10} tane daha`);
      }
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
importManuelLeads();
