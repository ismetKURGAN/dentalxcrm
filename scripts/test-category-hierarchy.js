const fs = require('fs');
const path = require('path');

const categoriesPath = path.join(__dirname, '..', 'data', 'categories.json');
const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'));

// Bir kategori seç
const cat = categories.find(c => c.leadFormId === '1967348777385854');
if (!cat) {
  console.log('Kategori bulunamadı');
  process.exit(0);
}

console.log('=== Kategori Hiyerarşisi Testi ===\n');
console.log('Seçilen Kategori:', cat.name);
console.log('Lead Form ID:', cat.leadFormId);
console.log('Top Parent:', cat.topParent);
console.log('Parent ID:', cat.parentId);
console.log('');

// Parent kategorisini bul
if (cat.parentId) {
  const parent = categories.find(c => c.id === cat.parentId);
  if (parent) {
    console.log('Parent Kategori:', parent.name);
    console.log('Parent Top Parent:', parent.topParent);
    
    // Parent'ın parent'ını bul
    if (parent.parentId) {
      const grandParent = categories.find(c => c.id === parent.parentId);
      if (grandParent) {
        console.log('GrandParent Kategori:', grandParent.name);
      }
    }
  }
}

console.log('\n=== Lead Geldiğinde Atanacak Bilgiler ===');
console.log('category:', cat.name);
console.log('parentCategory:', cat.topParent);
console.log('categoryLevel1:', cat.topParent);
console.log('categoryLevel5:', cat.name);
