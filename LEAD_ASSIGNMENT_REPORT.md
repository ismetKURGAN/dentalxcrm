# Lead Atama ve Kategori Sistemi Raporu

**Tarih:** 2026-01-28  
**Durum:** ✅ Tamamlandı ve Test Edildi

---

## 1. Kategori Sistemi Migration

### Yapılan İşlemler:
- ✅ **62 kategori** eski sistemden (`campaigns.json`) yeni sisteme (`data/categories.json`) taşındı
- ✅ Backup oluşturuldu: `categories.json.backup_1769595773120`
- ✅ Toplam kategori sayısı: **415 → 477**

### Lead Form ID Durumu:
| Sistem | Önceki | Sonraki | Durum |
|--------|--------|---------|-------|
| Eski (campaigns.json) | 133 | 133 | Korundu (SuperAdmin için) |
| Yeni (data/categories.json) | 73 | 135 | ✅ Tüm leadFormId'ler eklendi |

### Taşınan Kategoriler:
- Konsültasyon kampanyaları (Krakow, Varşova, Hereford, Kidderminster, Chester, Shrewsbury, Warrington, Birkenhead)
- Health kampanyaları (Ortopedi, Göğüs Cerrahisi)
- Almaty kampanyaları

---

## 2. Eski Kampanya Sistemi Erişim Kısıtlaması

### Değişiklikler:
- ✅ `/settings/campaigns` sayfası **sadece SuperAdmin** görebilir
- ✅ Ayarlar sayfasında "Kampanyalar / Kategoriler (ESKİ)" olarak işaretlendi
- ✅ Admin ve diğer kullanıcılar bu sayfayı göremez

### Kod Değişiklikleri:
```typescript
// Önceki: isAdmin kontrolü
const isAdmin = user?.roles?.includes("Admin") || user?.roles?.includes("SuperAdmin");

// Yeni: isSuperAdmin kontrolü
const isSuperAdmin = user?.roles?.includes("SuperAdmin");
```

---

## 3. Lead Atama Stratejisi

### Mevcut Konfigürasyon:
```json
{
  "strategy": "sequential",
  "advisors": [
    { "name": "Sadık", "active": true },
    { "name": "Buse", "active": true },
    { "name": "Lejla", "active": true },
    { "name": "Leila", "active": true },
    { "name": "Anastasia", "active": true },
    { "name": "Anna", "active": true },
    { "name": "Michal", "active": true },
    { "name": "Acenta 1", "active": true }
  ],
  "lastAssignedIndex": 4
}
```

### Çalışma Mantığı:

#### Adım 1: Lead Gelir
```
Zapier/Facebook → leadFormId ile lead gelir
```

#### Adım 2: Kategori Bulunur
```javascript
// Önce yeni sistemde ara (data/categories.json)
const matchedCampaign = findCampaignByLeadFormId(leadFormId);

// Bulunamazsa eski sistemde ara (campaigns.json) - geriye uyumluluk
```

#### Adım 3: Etiket Kontrolü
```javascript
// Kategoriye özel etiket var mı?
const matchedLabel = findActiveLabelForCategory(matchedCampaign.id);
```

#### Adım 4: Danışman Ataması (Öncelik Sırası)
```javascript
advisor = pickAdvisorFromLabel(matchedLabel)  // 1. Etiket bazlı
       || pickAdvisorForNewLead()             // 2. Global round-robin
       || body.advisor;                       // 3. Manuel atama
```

### Test Sonuçları:

**Son Atanan:** Anastasia (index: 4)

**Sıradaki 5 Lead Ataması:**
1. Lead 1 → Anna
2. Lead 2 → Michal
3. Lead 3 → Acenta 1
4. Lead 4 → Sadık
5. Lead 5 → Buse

✅ **Round-robin stratejisi düzgün çalışıyor!**

---

## 4. Lead Tanıma Parametreleri

### Lead'ler Nasıl Tanınıyor?

Lead'ler **`leadFormId`** parametresine göre tanınır:

```javascript
// Facebook/Zapier'dan gelen lead
{
  "personal": {
    "facebook": {
      "leadFormId": "1822007558513942"  // ← Bu parametre ile kategori bulunur
    }
  }
}
```

### Eşleştirme Algoritması:

```javascript
function findCampaignByLeadFormId(leadFormId) {
  // 1. ÖNCELİK: Yeni otomasyon kategorileri (data/categories.json)
  const automationMatch = automationCategories.find(
    c => c.leadFormId === leadFormId
  );
  if (automationMatch) return automationMatch;
  
  // 2. FALLBACK: Eski kampanya sistemi (campaigns.json)
  const campaignMatch = campaigns.find(
    c => c.leadFormId === leadFormId
  );
  return campaignMatch;
}
```

---

## 5. İki Kategori Sistemi

### Yeni Sistem (ÖNCELİKLİ) ✅
- **Dosya:** `/data/categories.json`
- **Boyut:** 4629 satır, ~130KB
- **Arayüz:** `/settings/categories` (Tüm Admin'ler)
- **API:** `/api/categories`
- **Lead Form ID:** 135 adet
- **Kullanım:** Aktif - tüm yeni lead'ler buradan eşleşir

### Eski Sistem (FALLBACK) ⚠️
- **Dosya:** `/campaigns.json`
- **Boyut:** 66KB
- **Arayüz:** `/settings/campaigns` (Sadece SuperAdmin)
- **API:** `/api/campaigns`
- **Lead Form ID:** 133 adet
- **Kullanım:** Geriye uyumluluk - yeni sistemde bulunamazsa buraya bakar

---

## 6. Öneriler

### Kısa Vadede (Şimdi):
- ✅ Yeni sistem kullanılıyor
- ✅ Eski sistem SuperAdmin için erişilebilir
- ✅ Lead atama stratejisi çalışıyor

### Orta Vadede (1-2 hafta sonra):
- [ ] Yeni sistemdeki kategorilerin `parentId` değerlerini düzenle
- [ ] Tüm lead'lerin doğru kategoriye atandığını doğrula
- [ ] Etiket (label) sistemini kategorilerle eşleştir

### Uzun Vadede (1 ay sonra):
- [ ] Eski `campaigns.json` sistemini tamamen kaldır
- [ ] Kod'dan `campaigns.json` referanslarını temizle
- [ ] Sadece `data/categories.json` kullan

---

## 7. Dosya Konumları

### Kategori Dosyaları:
- `/opt/moon-crm/data/categories.json` (YENİ - Aktif)
- `/opt/moon-crm/campaigns.json` (ESKİ - Fallback)
- `/opt/moon-crm/data/categories.json.backup_1769595773120` (Backup)

### Ayar Dosyaları:
- `/opt/moon-crm/settings.json` (Lead atama ayarları)
- `/opt/moon-crm/labels.json` (Etiket bazlı atama)

### Kod Dosyaları:
- `/opt/moon-crm/app/api/crm/route.ts` (Lead oluşturma ve atama)
- `/opt/moon-crm/app/api/categories/route.ts` (Yeni kategori API)
- `/opt/moon-crm/app/api/campaigns/route.ts` (Eski kampanya API)
- `/opt/moon-crm/app/settings/categories/page.tsx` (Yeni kategori UI)
- `/opt/moon-crm/app/settings/campaigns/page.tsx` (Eski kampanya UI - SuperAdmin)

---

## 8. Test Komutları

### Lead Form ID Sayısını Kontrol Et:
```bash
# Yeni sistem
grep -o '"leadFormId":\s*"[^"]*"' data/categories.json | grep -v '""' | grep -v '"0"' | wc -l

# Eski sistem
grep -o '"leadFormId":\s*"[^"]*"' campaigns.json | grep -v '""' | grep -v '"0"' | wc -l
```

### Lead Atama Stratejisini Kontrol Et:
```bash
node -e "const fs = require('fs'); const data = JSON.parse(fs.readFileSync('settings.json', 'utf-8')); console.log(JSON.stringify(data.leadAssignment, null, 2));"
```

---

**Hazırlayan:** Cascade AI  
**Onaylayan:** İsmet Kurgan
