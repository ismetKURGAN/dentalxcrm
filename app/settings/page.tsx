"use client";

import React from "react";
import { Box, Typography, Grid, Card, CardActionArea, CardContent, Stack } from "@mui/material";
import Link from "next/link";
import { useAuth } from "../components/AuthProvider";
import { useI18n } from "../components/I18nProvider";

type SettingsItem = { label: string; desc: string; href: string; adminOnly?: boolean };

const sections: { title: string; items: SettingsItem[] }[] = [
  {
    title: "İletişim Kanalları",
    items: [
      { label: "E-Posta Ayarları", desc: "E-posta göndermek için alan adınızı ekleyin ve ayarlayın.", href: "/settings/email" },
      { label: "SMS Ayarları", desc: "SMS sağlayıcınızı bağlayın ve gönderim ayarlarını yönetin.", href: "#" },
      { label: "WhatsApp Ayarları", desc: "WhatsApp mesajları için Waha / API ayarlarını yönetin.", href: "/settings/whatsapp" },
    ],
  },
  {
    title: "Otomasyon ve İş Akışları",
    items: [
      { label: "Lead Atama Stratejisi", desc: "Yeni leadlerin danışmanlara nasıl atanacağını belirleyin.", href: "/settings/lead-assignment" },
      { label: "Etiketler", desc: "Kategoriye göre danışman ve karşılama mesajı etiketlerini yönetin.", href: "/settings/labels" },
      { label: "Durum Yönetimi", desc: "Müşteri durumlarını ekleyin, düzenleyin veya silin.", href: "/settings/statuses", adminOnly: true },
      { label: "Servis Yönetimi", desc: "Hizmet/servis seçeneklerini ekleyin, düzenleyin veya silin.", href: "/settings/services", adminOnly: true },
      { label: "Kategori Yönetimi", desc: "Lead kategorilerini hiyerarşik yapıda yönetin.", href: "/settings/categories", adminOnly: true },
      { label: "Kullanıcı Bildirimleri", desc: "Yeni lead ve görev bildirimleri için kuralları tanımlayın.", href: "#" },
    ],
  },
  {
    title: "Bildirimler ve Raporlar",
    items: [
      { label: "Günlük Raporlar", desc: "E-posta / WhatsApp üzerinden günlük özet rapor ayarları.", href: "#" },
      { label: "Satış Bildirimleri", desc: "Satış gerçekleştiğinde ekibinize giden bildirimleri yönetin.", href: "#" },
      { label: "Satış e-postaları", desc: "Satış sonrası otomatik gönderilen e-posta şablonlarını düzenleyin.", href: "#" },
    ],
  },
  {
    title: "Kullanıcılar ve Roller",
    items: [
      { label: "Kullanıcı Yönetimi", desc: "Sisteme erişimi olan kullanıcıları ve oturumlarını yönetin.", href: "/users", adminOnly: true },
      { label: "Roller ve Yetkiler", desc: "Kullanıcı rol tanımları ve modül bazlı yetkiler.", href: "/settings/roles", adminOnly: true },
      { label: "Telefon Numaraları", desc: "Arama entegrasyonu için kullanılacak hatları ve numaraları yönetin.", href: "#" },
    ],
  },
  {
    title: "Operasyonel Ayarlar",
    items: [
      { label: "Doktorlar", desc: "Randevularda kullanılacak doktor listesini yönetin.", href: "/doctors", adminOnly: true },
      { label: "Oteller", desc: "Müşterilerin konaklayacağı otel listesini yönetin.", href: "/hotels", adminOnly: true },
    ],
  },
  {
    title: "Mesaj Şablonları",
    items: [
      { label: "E-posta Şablonları", desc: "Pazarlama ve bilgilendirme e-posta şablonlarını yönetin.", href: "#" },
      { label: "SMS Şablonları", desc: "Sık kullanılan SMS içeriklerini şablon olarak kaydedin.", href: "#" },
      { label: "WhatsApp Şablonları", desc: "WhatsApp mesaj şablonlarını yönetin.", href: "#" },
    ],
  },
  {
    title: "Entegrasyonlar",
    items: [
      { label: "Facebook Entegrasyonu", desc: "Facebook lead formlarını CRM'e bağlayın.", href: "#" },
      { label: "Zapier / Diğer", desc: "Dış servislerle entegrasyonlarınızı yönetin.", href: "#" },
      { label: "Web Formları", desc: "Web sitenizde kullanacağınız formları yönetin.", href: "#" },
      { label: "Kampanyalar / Kategoriler", desc: "Lead Form ID'lerini kaynak ve kampanya kategorileriyle eşleştirin.", href: "/settings/campaigns", adminOnly: true },
    ],
  },
];

export default function SettingsHubPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const isAdmin = user?.roles?.includes("Admin") || user?.roles?.includes("SuperAdmin");
  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          {t("settings.page.title")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("settings.page.subtitle")}
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {sections.map((section) => (
          <Grid key={section.title} item xs={12} md={6}>
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {section.title}
              </Typography>
            </Box>
            <Grid container spacing={2}>
              {section.items
                .filter((item) => !item.adminOnly || isAdmin)
                .map((item) => (
                <Grid key={item.label} item xs={12} md={6}>
                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: 3,
                      boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
                      height: "100%",
                    }}
                  >
                    <CardActionArea
                      component={item.href === "#" ? "div" : Link}
                      href={item.href === "#" ? undefined : item.href}
                      sx={{ height: "100%" }}
                    >
                      <CardContent sx={{ py: 2, px: 2.5 }}>
                        <Stack spacing={0.5}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {item.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.desc}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
