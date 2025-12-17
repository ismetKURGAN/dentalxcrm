#!/bin/bash

# Moon CRM Otomatik Yedekleme Scripti
# Her hafta Pazar gece 03:00'te çalışır

BACKUP_DIR="/opt/moon-crm/backups"
SOURCE_DIR="/opt/moon-crm"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup klasörünü oluştur
mkdir -p "$BACKUP_DIR"

# Tüm veri dosyalarını yedekle
cp "$SOURCE_DIR/db.json" "$BACKUP_DIR/db_$DATE.json"
cp "$SOURCE_DIR/campaigns.json" "$BACKUP_DIR/campaigns_$DATE.json"
cp "$SOURCE_DIR/labels.json" "$BACKUP_DIR/labels_$DATE.json"
cp "$SOURCE_DIR/users.json" "$BACKUP_DIR/users_$DATE.json"
cp "$SOURCE_DIR/settings.json" "$BACKUP_DIR/settings_$DATE.json"
cp "$SOURCE_DIR/roles.json" "$BACKUP_DIR/roles_$DATE.json"
cp "$SOURCE_DIR/calendar.json" "$BACKUP_DIR/calendar_$DATE.json"
cp "$SOURCE_DIR/doctors.json" "$BACKUP_DIR/doctors_$DATE.json"
cp "$SOURCE_DIR/segments.json" "$BACKUP_DIR/segments_$DATE.json"

# 30 günden eski yedekleri sil (disk dolmasın)
find "$BACKUP_DIR" -name "*.json" -type f -mtime +30 -delete

echo "[$DATE] Yedekleme tamamlandı" >> "$BACKUP_DIR/backup.log"
