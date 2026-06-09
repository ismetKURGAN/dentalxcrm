---
description: Build the Next.js app and restart the Docker container
---

Build al ve Docker konteynerini yeniden başlat.

1. Build al:
   ```bash
   cd /opt/moon-crm && npm run build
   ```

2. Docker konteynerini yeniden başlat:
   ```bash
   docker restart moon-ui
   ```

// turbo
3. Konteyner durumunu kontrol et:
   ```bash
   docker ps --filter name=moon-ui --format "{{.Names}}: {{.Status}}"
   ```
