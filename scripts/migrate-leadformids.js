const fs = require('fs');
const path = require('path');

console.log('=== Lead Form ID Migration Script ===\n');

// Eski sistemi oku (campaigns.json)
const campaignsPath = path.join(__dirname, '..', 'campaigns.json');
const campaigns = JSON.parse(fs.readFileSync(campaignsPath, 'utf-8'));
const oldLeadFormIds = new Set();
campaigns.forEach(c => {
  if (c.leadFormId && c.leadFormId.trim() !== '' && c.leadFormId !== '0') {
    oldLeadFormIds.add(c.leadFormId);
  }
});

// Yeni sistemi oku (data/categories.json)
const categoriesPath = path.join(__dirname, '..', 'data', 'categories.json');
const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'));
const newLeadFormIds = new Set();
categories.forEach(c => {
  if (c.leadFormId && c.leadFormId.trim() !== '' && c.leadFormId !== '0') {
    newLeadFormIds.add(c.leadFormId);
  }
});

// Eksik olanları bul
const missingLeadFormIds = Array.from(oldLeadFormIds).filter(id => !newLeadFormIds.has(id));
console.log('Eski sistemdeki toplam leadFormId:', oldLeadFormIds.size);
console.log('Yeni sistemdeki toplam leadFormId:', newLeadFormIds.size);
console.log('Eksik leadFormId sayısı:', missingLeadFormIds.length);
console.log('');

// Eksik leadFormId'ye sahip kampanyaları bul
const missingCampaigns = campaigns.filter(c => 
  c.leadFormId && missingLeadFormIds.includes(c.leadFormId)
);

console.log('--- Taşınacak Kampanyalar ---');
missingCampaigns.forEach((c, idx) => {
  console.log(`${idx + 1}. ${c.name || c.title}`);
  console.log(`   LeadFormId: ${c.leadFormId}`);
  console.log(`   TopParent: ${c.topParent || 'N/A'}`);
  console.log(`   Parent: ${c.parent || 'N/A'}`);
  console.log('');
});

// Yeni kategorilere dönüştür
const newCategories = missingCampaigns.map(c => {
  const now = new Date().toISOString();
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: c.name || c.title || 'Unknown',
    topParent: c.topParent || 'Meta',
    parentId: null, // Önce null olarak ekle, sonra manuel düzenlenebilir
    leadFormId: c.leadFormId || '',
    firstContact: c.firstContact || false,
    global: c.global || false,
    createdAt: now,
    updatedAt: now,
    // Eski kampanya bilgilerini not olarak ekle
    _migratedFrom: {
      campaignId: c.id,
      parent: c.parent,
      type: c.type
    }
  };
});

console.log(`\n✓ ${newCategories.length} kategori oluşturuldu`);

// Mevcut kategorilere ekle
const updatedCategories = [...categories, ...newCategories];

// Backup oluştur
const backupPath = path.join(__dirname, '..', 'data', `categories.json.backup_${Date.now()}`);
fs.writeFileSync(backupPath, JSON.stringify(categories, null, 2));
console.log(`✓ Backup oluşturuldu: ${path.basename(backupPath)}`);

// Yeni dosyayı kaydet
fs.writeFileSync(categoriesPath, JSON.stringify(updatedCategories, null, 2));
console.log(`✓ Yeni kategoriler data/categories.json'a eklendi`);

// Özet rapor
console.log('\n=== Migration Tamamlandı ===');
console.log(`Toplam kategori sayısı: ${categories.length} → ${updatedCategories.length}`);
console.log(`Eklenen kategori: ${newCategories.length}`);
console.log('');
console.log('⚠️  NOT: Yeni eklenen kategorilerin parentId değerleri null olarak ayarlandı.');
console.log('   Gerekirse Ayarlar > Kategoriler sayfasından düzenleyebilirsiniz.');
