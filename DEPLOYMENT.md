# Moon CRM — Proje & Deployment Kılavuzu

## Proje Hakkında

**Moon CRM**, Next.js 16 tabanlı bir diş kliniği CRM uygulamasıdır. Lead yönetimi, randevu takibi, istatistikler ve WhatsApp entegrasyonu içerir.

- **URL:** https://crm.dentalxturkey.com
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Veritabanı:** SQLite (`/opt/moon-crm/crm.db`)
- **Dil:** TypeScript

---

## Sunucu & Altyapı

| Bileşen | Detay |
|---|---|
| Uygulama container | `moon-ui` (Docker) |
| Port | `4001` → container içi `3000` |
| Volume mount | `/opt/moon-crm` → `/app` (read/write) |
| Reverse proxy | Nginx (`crm.dentalxturkey.com`) |
| Diğer containerlar | `chatwoot-*` (ayrı servis), `evolution-api` (PM2) |

---

## Deployment Adımları

### 1. Kod Değişikliklerini Uygula

Değişiklikler `/opt/moon-crm` altında doğrudan yapılır — volume mount sayesinde container anında görür.

### 2. Production Build Al

```bash
docker exec moon-ui sh -c "cd /app && npm run build"
```

Build ~30-60 saniye sürer. Başarılı sonuç:
```
✓ Compiled successfully
✓ Generating static pages (60/60)
```

### 3. Container'ı Restart Et

```bash
docker restart moon-ui
```

> **Not:** Restart sonrası uygulama ~5-10 saniye içinde hazır olur.

---

## Geliştirme Ortamı

Yerel geliştirme için:

```bash
cd /opt/moon-crm
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışır.

---

## Önemli Dosya & Dizinler

| Yol | Açıklama |
|---|---|
| `/opt/moon-crm/crm.db` | SQLite veritabanı (tüm müşteri verileri) |
| `/opt/moon-crm/data/categories.json` | Kategori tanımları (477 kategori) |
| `/opt/moon-crm/campaigns.json` | Eski kampanya tanımları (fallback) |
| `/opt/moon-crm/app/api/lib/sqlite-customers.ts` | Merkezi SQLite helper fonksiyonları |
| `/opt/moon-crm/.env.local` | Ortam değişkenleri (gizli) |
| `/opt/moon-crm/backups/archive/` | Eski db.json yedekleri |

---

## Temel API Endpoint'leri

| Endpoint | Metod | Açıklama |
|---|---|---|
| `/api/crm` | GET/POST/PUT/DELETE | Müşteri CRUD |
| `/api/crm-sqlite` | GET | Sayfalandırmalı/filtrelenmiş listeleme |
| `/api/users` | GET/POST | Kullanıcı yönetimi |
| `/api/categories` | GET/POST | Kategori yönetimi |
| `/api/doctors` | GET/POST | Doktor listesi |
| `/api/settings/lead-assignment` | GET/PUT | Lead atama ayarları |
| `/api/check-reminders` | GET | Hatırlatıcı kontrolü |
| `/api/embed/submit` | POST | Dış form lead girişi |

---

## Docker Komutları

```bash
# Container durumunu gör
docker ps

# Logları izle
docker logs -f moon-ui

# Container içine gir
docker exec -it moon-ui sh

# Container'ı durdur / başlat
docker stop moon-ui
docker start moon-ui
```

---

## Veritabanı

SQLite doğrudan sunucu üzerinde `/opt/moon-crm/crm.db` konumundadır.

```bash
# DB'ye bağlan
sqlite3 /opt/moon-crm/crm.db

# Örnek sorgular
sqlite3 /opt/moon-crm/crm.db "SELECT COUNT(*) FROM customers;"
sqlite3 /opt/moon-crm/crm.db ".schema customers"
```

**Yedekleme:**
```bash
cp /opt/moon-crm/crm.db /opt/moon-crm/backups/crm-$(date +%Y%m%d).db
```

---

## Notlar

- `db.json` kaldırılmıştır (Şubat 2026). Tüm veriler SQLite'tadır.
- Lead atama stratejisi: Sequential (round-robin), `settings.json` içindeki `lastAssignedIndex` ile takip edilir.
- Soft delete için `deleted-customers.json` hâlâ kullanılmaktadır.
 