"use client";

import React from "react";
import { Box, Typography, Grid, Card, CardActionArea, CardContent, Stack } from "@mui/material";
import Link from "next/link";
import { useAuth } from "../components/AuthProvider";
import { useI18n } from "../components/I18nProvider";

type SettingsItem = { label: string; desc: string; href: string; adminOnly?: boolean; superAdminOnly?: boolean };

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
      { label: "Web Formları", desc: "Web sitenizde kullanacağınız embed formları oluşturun.", href: "/settings/embed" },
      { label: "Kampanyalar / Kategoriler (ESKİ)", desc: "Eski kampanya sistemi - Sadece SuperAdmin.", href: "/settings/campaigns", superAdminOnly: true },
    ],
  },
];

export default function SettingsHubPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const isAdmin = user?.roles?.includes("Admin") || user?.roles?.includes("SuperAdmin");
  const isSuperAdmin = user?.roles?.includes("SuperAdmin");
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

      <Stack spacing={4}>
        {sections.map((section) => (
          <Box key={section.title}>
            <Box sx={{ mb: 2, pb: 1, borderBottom: '2px solid #e0e0e0' }}>
              <Typography variant="h6" fontWeight={700} color="primary.main">
                {section.title}
              </Typography>
            </Box>
            <Grid container spacing={2} sx={{ maxWidth: '100%' }}>
              {section.items
                .filter((item) => {
                  if (item.superAdminOnly) return isSuperAdmin;
                  if (item.adminOnly) return isAdmin;
                  return true;
                })
                .map((item) => (
                <Grid key={item.label} item xs={12} sm={6} md={4}>
                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: 2,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      height: '100%',
                      minHeight: 160,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                        transform: 'translateY(-2px)',
                        borderColor: 'primary.main',
                      },
                      border: '1px solid #e0e0e0',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <CardActionArea
                      component={item.href === "#" ? "div" : Link}
                      href={item.href === "#" ? undefined : item.href}
                      sx={{ 
                        height: "100%",
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        justifyContent: 'flex-start',
                      }}
                      disabled={item.href === "#"}
                    >
                      <CardContent sx={{ 
                        py: 2.5, 
                        px: 2.5,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        '&:last-child': {
                          pb: 2.5,
                        },
                      }}>
                        <Typography 
                          variant="subtitle2" 
                          fontWeight={700}
                          sx={{
                            fontSize: '0.95rem',
                            lineHeight: 1.3,
                            color: item.href === "#" ? 'text.disabled' : 'text.primary',
                            mb: 1,
                          }}
                        >
                          {item.label}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{
                            fontSize: '0.75rem',
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.desc}
                        </Typography>
                        {item.href === "#" && isSuperAdmin && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'warning.main',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              mt: 1,
                            }}
                          >
                            Yakında
                          </Typography>
                        )}
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
