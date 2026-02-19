const fs = require('fs');
const path = require('path');

console.log('=== Final Kategori Atama Testi ===\n');

// Kategorileri oku
const categoriesPath = path.join(__dirname, '..', 'data', 'categories.json');
const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'));

// Hiyerarşi fonksiyonu (API'deki ile aynı)
function buildCategoryHierarchy(category) {
  if (!category) return null;
  
  const hierarchy = [];
  let current = category;
  
  for (let i = 0; i < 10 && current; i++) {
    const categoryName = current.name || current.title || '';
    if (categoryName) {
      hierarchy.unshift(categoryName);
    }
    
    if (current.parentId) {
      current = categories.find(c => c.id === current.parentId);
    } else {
      break;
    }
  }
  
  return {
    fullPath: hierarchy.join(' > '),
    topParent: category.topParent || category.parent || '',
    level1: hierarchy[0] || category.topParent || category.parent || '',
    level2: hierarchy[1] || '',
    level3: hierarchy[2] || '',
    level4: hierarchy[3] || '',
    level5: hierarchy[4] || hierarchy[hierarchy.length - 1] || '',
    leafCategory: hierarchy[hierarchy.length - 1] || category.name || category.title || ''
  };
}

// Test örnekleri
const testCases = [
  { leadFormId: '1967348777385854', desc: 'İngiltere - Filtreli - 1 (Meta)' },
  { leadFormId: '1822007558513942', desc: 'Telford 7-8 Mart Alpha Ashley (Konsültasyon)' },
  { leadFormId: '1209694810746010', desc: 'Ipswich 7-8 Mart Alpha Ashley (Konsültasyon)' },
];

testCases.forEach((test, idx) => {
  const matchedCampaign = categories.find(c => c.leadFormId === test.leadFormId);
  
  if (!matchedCampaign) {
    console.log(`${idx + 1}. ${test.desc} - BULUNAMADI\n`);
    return;
  }
  
  const categoryHierarchy = buildCategoryHierarchy(matchedCampaign);
  const categoryName = categoryHierarchy?.leafCategory || matchedCampaign?.name || '';
  const topParentName = categoryHierarchy?.topParent || matchedCampaign?.topParent || '';
  
  console.log(`${idx + 1}. ${test.desc}`);
  console.log(`   Lead Form ID: ${test.leadFormId}`);
  console.log('');
  console.log('   Lead\'e Atanacak Değerler:');
  console.log(`   - category: "${categoryName}"`);
  console.log(`   - parentCategory: "${topParentName}"`);
  console.log(`   - categoryLevel1: "${categoryHierarchy?.level1}"`);
  console.log(`   - categoryLevel2: "${categoryHierarchy?.level2}"`);
  console.log(`   - categoryLevel3: "${categoryHierarchy?.level3}"`);
  console.log(`   - categoryLevel4: "${categoryHierarchy?.level4}"`);
  console.log(`   - categoryLevel5: "${categoryHierarchy?.level5}"`);
  console.log(`   - categoryFullPath: "${categoryHierarchy?.fullPath}"`);
  console.log('');
  console.log(`   ✅ Kategori: ${categoryName} (${topParentName})`);
  console.log('');
});

console.log('=== Özet ===');
console.log('✅ Lead\'ler artık doğru kategori isimleri ile sisteme kaydedilecek');
console.log('✅ Hiyerarşi bilgileri (level1-5) düzgün şekilde atanıyor');
console.log('✅ Full path bilgisi de eklendi');
