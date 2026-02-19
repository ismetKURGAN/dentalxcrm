const fs = require('fs');
const path = require('path');

console.log('=== Lead Kategori Atama Testi ===\n');

// Kategorileri oku
const categoriesPath = path.join(__dirname, '..', 'data', 'categories.json');
const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'));

// Test için bir kategori seç (leadFormId olan)
const testCategory = categories.find(c => c.leadFormId === '1967348777385854');

if (!testCategory) {
  console.log('Test kategorisi bulunamadı');
  process.exit(1);
}

console.log('Test Kategorisi:', testCategory.name);
console.log('Lead Form ID:', testCategory.leadFormId);
console.log('Top Parent:', testCategory.topParent);
console.log('Parent ID:', testCategory.parentId);
console.log('');

// Hiyerarşiyi oluştur
function buildCategoryHierarchy(category) {
  if (!category) return null;
  
  const hierarchy = [];
  let current = category;
  
  // Maksimum 10 seviye
  for (let i = 0; i < 10 && current; i++) {
    const categoryName = current.name || current.title || '';
    if (categoryName) {
      hierarchy.unshift(categoryName); // Başa ekle
    }
    
    // Parent'ı bul
    if (current.parentId) {
      current = categories.find(c => c.id === current.parentId);
    } else {
      break;
    }
  }
  
  return {
    fullPath: hierarchy.join(' > '),
    level1: hierarchy[0] || category.topParent || category.parent || '',
    level2: hierarchy[1] || '',
    level3: hierarchy[2] || '',
    level4: hierarchy[3] || '',
    level5: hierarchy[4] || hierarchy[hierarchy.length - 1] || '',
    leafCategory: hierarchy[hierarchy.length - 1] || category.name || category.title || ''
  };
}

const hierarchy = buildCategoryHierarchy(testCategory);

console.log('=== Oluşturulan Hiyerarşi ===');
console.log('Full Path:', hierarchy.fullPath);
console.log('Level 1 (Top Parent):', hierarchy.level1);
console.log('Level 2:', hierarchy.level2);
console.log('Level 3:', hierarchy.level3);
console.log('Level 4:', hierarchy.level4);
console.log('Level 5 (Leaf):', hierarchy.level5);
console.log('Leaf Category:', hierarchy.leafCategory);
console.log('');

console.log('=== Lead Geldiğinde Atanacak Değerler ===');
console.log('category:', hierarchy.leafCategory);
console.log('parentCategory:', hierarchy.level1);
console.log('categoryLevel1:', hierarchy.level1);
console.log('categoryLevel2:', hierarchy.level2);
console.log('categoryLevel3:', hierarchy.level3);
console.log('categoryLevel4:', hierarchy.level4);
console.log('categoryLevel5:', hierarchy.level5);
console.log('categoryFullPath:', hierarchy.fullPath);
console.log('');

// Birkaç örnek daha test et
console.log('=== Diğer Örnekler ===\n');
const examples = [
  '1822007558513942', // Telford 7-8 Mart Alpha Ashley
  '1209694810746010', // Ipswich 7-8 Mart Alpha Ashley
];

examples.forEach(leadFormId => {
  const cat = categories.find(c => c.leadFormId === leadFormId);
  if (cat) {
    const h = buildCategoryHierarchy(cat);
    console.log(`LeadFormId: ${leadFormId}`);
    console.log(`  Category: ${h.leafCategory}`);
    console.log(`  Full Path: ${h.fullPath}`);
    console.log('');
  }
});
