"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Box, Paper, Typography, Stack, Avatar, Button, Chip, IconButton, CircularProgress, List, ListItem, ListItemButton, ListItemIcon, ListItemText 
} from "@mui/material";

// İKONLAR (Hata buradaki eksiklerden kaynaklanıyordu, hepsi eklendi)
import GroupIcon from "@mui/icons-material/Group";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import DescriptionIcon from "@mui/icons-material/Description";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";     // <-- EKLENDİ
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward"; // <-- EKLENDİ
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import PhoneCallbackIcon from '@mui/icons-material/PhoneCallback';
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { useI18n } from "./components/I18nProvider";

// GRAFİK
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from "recharts";

// Üst kartlar için temel tanım (değerler runtime'da hesaplanır)
const BASE_STATS = [
  { key: "customers", titleKey: "dashboard.card.customers", icon: <GroupIcon sx={{ color: '#fff' }} />, color: '#2196F3' },
  { key: "sales", titleKey: "dashboard.card.sales", icon: <ShoppingCartIcon sx={{ color: '#fff' }} />, color: '#FF9800' },
  { key: "offers", titleKey: "dashboard.card.offers", icon: <DescriptionIcon sx={{ color: '#fff' }} />, color: '#4CAF50' },
  { key: "conversion", titleKey: "dashboard.card.conversion", icon: <TrendingUpIcon sx={{ color: '#fff' }} />, color: '#9C27B0' },
];

// Başlangıç için demo grafik verisi (gerçek veriler gelene kadar)
const INITIAL_CHART_DATA = [
  { name: 'Oca', musteri: 400, teklif: 240, satis: 20 }, { name: 'Şub', musteri: 300, teklif: 139, satis: 30 },
  { name: 'Mar', musteri: 500, teklif: 380, satis: 50 }, { name: 'Nis', musteri: 278, teklif: 190, satis: 40 },
  { name: 'May', musteri: 589, teklif: 280, satis: 60 }, { name: 'Haz', musteri: 439, teklif: 200, satis: 50 },
  { name: 'Tem', musteri: 549, teklif: 330, satis: 70 }, { name: 'Ağu', musteri: 400, teklif: 250, satis: 45 },
  { name: 'Eyl', musteri: 300, teklif: 180, satis: 30 }, { name: 'Eki', musteri: 600, teklif: 400, satis: 90 },
  { name: 'Kas', musteri: 800, teklif: 500, satis: 120 }, { name: 'Ara', musteri: 950, teklif: 600, satis: 150 },
];

const MONTH_LABELS_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

function buildChartData(customers: any[]): { name: string; musteri: number; teklif: number; satis: number }[] {
  const now = new Date();
  // Son 12 ay için boş yapı hazırla (en eski solda)
  const buckets: { name: string; musteri: number; teklif: number; satis: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const idx = d.getMonth();
    buckets.push({ name: MONTH_LABELS_TR[idx], musteri: 0, teklif: 0, satis: 0 });
  }

  const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1).getTime();

  customers.forEach((c: any) => {
    const created = c.createdAt ? new Date(c.createdAt).getTime() : NaN;
    if (!created || isNaN(created) || created < startDate) return;

    const d = new Date(created);
    const diffMonths = (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth());
    const indexFromEnd = 11 + diffMonths; // diffMonths negatif, 0 en eski, 11 en yeni
    if (indexFromEnd < 0 || indexFromEnd > 11) return;

    const bucket = buckets[indexFromEnd];
    bucket.musteri += 1;

    const status: string = (c.status || '').toString().toLowerCase();
    if (status.includes('teklif')) {
      bucket.teklif += 1;
    }
    if (status.includes('satış') || status.includes('satis') || status.includes('sale')) {
      bucket.satis += 1;
    }
  });

  return buckets;
}

export default function Dashboard() {
  const router = useRouter();
  const { t, language } = useI18n();
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(INITIAL_CHART_DATA);
  const [hiddenSeries, setHiddenSeries] = useState<{ [key: string]: boolean }>({});
  const [statsValues, setStatsValues] = useState({
    customers: 0,
    offers: 0,
    sales: 0,
    conversion: 0,
  });
  const [statsTrends, setStatsTrends] = useState({
    customers: 0,
    offers: 0,
    sales: 0,
    conversion: 0,
  });

  // --- CANLI HATIRLATICI VERİSİ ---
  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const res = await fetch("/api/crm", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();

          // Filtreleme: Reminder objesi var mı ve enabled true mu?
          const active = data.filter((c: any) => c.reminder && c.reminder.enabled === true);

          // Sıralama (Tarih formatını güvenli parse ediyoruz)
          active.sort((a: any, b: any) => {
            const dateA = new Date(a.reminder.datetime).getTime() || 0;
            const dateB = new Date(b.reminder.datetime).getTime() || 0;
            return dateA - dateB; // Yakın tarih üstte
          });

          setReminders(active);

          // Grafik için son 12 ayı hesapla
          try {
            const computed = buildChartData(data);
            setChartData(computed);

            // Son 2 ay üzerinden trend yüzdeleri (müşteri, teklif, satış, dönüşüm)
            if (computed.length >= 2) {
              const prev = computed[computed.length - 2];
              const last = computed[computed.length - 1];

              const pct = (current: number, previous: number) => {
                if (previous <= 0) return current > 0 ? 100 : 0;
                return ((current - previous) / previous) * 100;
              };

              const customersTrend = pct(last.musteri, prev.musteri);
              const offersTrend = pct(last.teklif, prev.teklif);
              const salesTrend = pct(last.satis, prev.satis);

              const prevConvBase = prev.teklif || 0;
              const lastConvBase = last.teklif || 0;
              const prevConv = prevConvBase > 0 ? (prev.satis / prevConvBase) * 100 : 0;
              const lastConv = lastConvBase > 0 ? (last.satis / lastConvBase) * 100 : 0;
              const conversionTrend = prevConv === 0 ? (lastConv > 0 ? 100 : 0) : ((lastConv - prevConv) / prevConv) * 100;

              setStatsTrends({
                customers: customersTrend,
                offers: offersTrend,
                sales: salesTrend,
                conversion: conversionTrend,
              });
            }
          } catch (e) {
            console.error("Chart data hesaplanırken hata", e);
          }

          // Üst kartlar için gerçek istatistikler
          try {
            const totalCustomers = Array.isArray(data) ? data.length : 0;
            const offers = Array.isArray(data)
              ? data.filter((c: any) => (c.status || '').toString().toLowerCase().includes('teklif')).length
              : 0;
            const sales = Array.isArray(data)
              ? data.filter((c: any) => {
                  const s = (c.status || '').toString().toLowerCase();
                  return s.includes('satış') || s.includes('satis') || s.includes('sale');
                }).length
              : 0;
            const conversion = offers > 0 ? (sales / offers) * 100 : 0;

            setStatsValues({
              customers: totalCustomers,
              offers,
              sales,
              conversion,
            });
          } catch (e) {
            console.error("Stats hesaplanırken hata", e);
          }
        }
      } catch (error) {
        console.error("Hata:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReminders();
  }, []);

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
        p: { xs: 2, md: 3 },
        bgcolor: "#f3f4f6",
        minHeight: "100vh",
      }}
    >
      
      {/* İSTATİSTİK KARTLARI (GERÇEK VERİLERLE) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: { xs: 2, md: 3 },
          mb: { xs: 2, md: 3 },
          width: '100%',
        }}
      >
        {BASE_STATS.map((stat) => {
          const value = (() => {
            switch (stat.key) {
              case 'customers':
                return statsValues.customers.toLocaleString('tr-TR');
              case 'sales':
                return statsValues.sales.toLocaleString('tr-TR');
              case 'offers':
                return statsValues.offers.toLocaleString('tr-TR');
              case 'conversion':
                return `%${statsValues.conversion.toFixed(1)}`;
              default:
                return '-';
            }
          })();

          const rawTrend = (() => {
            switch (stat.key) {
              case 'customers':
                return statsTrends.customers;
              case 'sales':
                return statsTrends.sales;
              case 'offers':
                return statsTrends.offers;
              case 'conversion':
                return statsTrends.conversion;
              default:
                return 0;
            }
          })();

          const isPositive = rawTrend >= 0;
          const percentLabel = `${Math.abs(rawTrend).toFixed(1)}% ${isPositive ? t('dashboard.card.trend.increase') : t('dashboard.card.trend.decrease')}`;

          return (
          <Paper key={stat.key} elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E0E0E0', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="subtitle2" color="text.secondary" fontWeight="600" gutterBottom>{t(stat.titleKey)}</Typography>
                <Typography variant="h4" fontWeight="800" sx={{ color: '#111827', my: 1 }}>{value}</Typography>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  {isPositive ? <ArrowUpwardIcon sx={{ fontSize: 16, color: 'success.main' }} /> : <ArrowDownwardIcon sx={{ fontSize: 16, color: 'error.main' }} />}
                  <Typography variant="body2" fontWeight="bold" sx={{ color: isPositive ? 'success.main' : 'error.main' }}>{percentLabel}</Typography>
                </Stack>
              </Box>
              <Avatar variant="rounded" sx={{ bgcolor: stat.color, width: 56, height: 56, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>{stat.icon}</Avatar>
            </Stack>
          </Paper>
        );
        })}
      </Box>

      {/* ALT KISIM: GRAFİK VE HATIRLATICILAR */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, width: '100%' }}>
        
        {/* GRAFİK */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: 4,
            border: '1px solid #E0E0E0',
            height: { xs: 360, md: 500 },
            display: 'flex',
            flexDirection: 'column',
            flex: { xs: '1 1 100%', md: '2 1 0' },
            minWidth: 0,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" fontWeight="bold">{t('dashboard.chart.title')}</Typography>
            <Button size="small" variant="outlined" color="inherit" sx={{ borderRadius: 2, textTransform: 'none' }} endIcon={<CalendarTodayIcon fontSize="small"/>}>{t('dashboard.chart.last12Months')}</Button>
          </Stack>
          <Box sx={{ flexGrow: 1, width: '100%', minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorMusteri" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2196F3" stopOpacity={0.3}/><stop offset="95%" stopColor="#2196F3" stopOpacity={0}/></linearGradient>
                  <linearGradient id="colorTeklif" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4CAF50" stopOpacity={0.3}/><stop offset="95%" stopColor="#4CAF50" stopOpacity={0}/></linearGradient>
                  <linearGradient id="colorSatis" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FF9800" stopOpacity={0.3}/><stop offset="95%" stopColor="#FF9800" stopOpacity={0}/></linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9e9e9e', fontSize: 10}} interval={0} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9e9e9e', fontSize: 12}} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ top: -10 }}
                  onClick={(e: any) => {
                    if (!e || !e.dataKey) return;
                    setHiddenSeries((prev) => ({ ...prev, [e.dataKey]: !prev[e.dataKey] }));
                  }}
                  formatter={(value: any, entry: any) => {
                    const key = entry?.dataKey as string;
                    const isHidden = !!hiddenSeries[key];
                    return (
                      <span style={{ opacity: isHidden ? 0.4 : 1 }}>{value}</span>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="musteri"
                  name={t('dashboard.chart.series.customers')}
                  stroke="#2196F3"
                  strokeWidth={3}
                  fillOpacity={hiddenSeries["musteri"] ? 0 : 1}
                  strokeOpacity={hiddenSeries["musteri"] ? 0 : 1}
                  fill="url(#colorMusteri)"
                />
                <Area
                  type="monotone"
                  dataKey="teklif"
                  name={t('dashboard.chart.series.offers')}
                  stroke="#4CAF50"
                  strokeWidth={3}
                  fillOpacity={hiddenSeries["teklif"] ? 0 : 1}
                  strokeOpacity={hiddenSeries["teklif"] ? 0 : 1}
                  fill="url(#colorTeklif)"
                />
                <Area
                  type="monotone"
                  dataKey="satis"
                  name={t('dashboard.chart.series.sales')}
                  stroke="#FF9800"
                  strokeWidth={3}
                  fillOpacity={hiddenSeries["satis"] ? 0 : 1}
                  strokeOpacity={hiddenSeries["satis"] ? 0 : 1}
                  fill="url(#colorSatis)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        {/* HATIRLATICILAR */}
        <Paper
          elevation={0}
          sx={{
            p: 0,
            borderRadius: 4,
            border: '1px solid #E0E0E0',
            height: { xs: 360, md: 500 },
            display: 'flex',
            flexDirection: 'column',
            flex: { xs: '1 1 100%', md: '1 1 0' },
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 2, borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 1, bgcolor: "#fff" }}>
            <Box sx={{ p: 1, borderRadius: "50%", bgcolor: "#eff6ff", color: "#3b82f6" }}><NotificationsActiveIcon fontSize="small" /></Box>
            <Typography fontWeight={600} color="#374151">{t('dashboard.reminders.title')}</Typography>
            <Chip label={reminders.length} size="small" color="primary" sx={{ ml: "auto", height: 20, fontSize: 11 }} />
          </Box>
          
          <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
                <CircularProgress size={30} />
              </Box>
            ) : reminders.length === 0 ? (
              <Box
                sx={{
                  p: 4,
                  textAlign: "center",
                  color: "#9ca3af",
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <CalendarTodayIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                <Typography variant="body2">{t('dashboard.reminders.empty')}</Typography>
              </Box>
            ) : (
              <List disablePadding>
                {reminders.map((item) => {
                  const dateObj = new Date(item.reminder.datetime);
                  const isValidDate = !isNaN(dateObj.getTime());
                  const isPast = isValidDate && dateObj < new Date();

                  // Not içinde "Telefon Görüşmesi" geçiyor mu?
                  const isPhoneCall =
                    item.reminder.notes?.toLowerCase().includes("telefon") ||
                    item.reminder.notes?.toLowerCase().includes("görüşme");

                  return (
                    <ListItem key={item.id} disablePadding divider>
                      <ListItemButton
                        onClick={() => router.push(`/customers/${item.id}`)}
                        sx={{
                          '&:hover': { bgcolor: "#f9fafb" },
                          bgcolor: isPast ? '#fef2f2' : 'white', // Geçmişse hafif kırmızı
                          opacity: isPast ? 0.8 : 1,
                        }}
                      >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {isPhoneCall ? (
                          <Avatar sx={{ width: 32, height: 32, bgcolor: "#ecfdf5", color: "#10b981" }}>
                            <PhoneCallbackIcon fontSize="small" />
                          </Avatar>
                        ) : (
                          <Avatar sx={{ width: 32, height: 32, bgcolor: "#e0e7ff", color: "#4f46e5" }}>
                            {item.name?.charAt(0).toUpperCase() || "?"}
                          </Avatar>
                        )}
                      </ListItemIcon>

                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="subtitle2" fontWeight={600} color="#1f2937">
                              {item.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color={isPast ? "error" : "primary"}
                              fontWeight={500}
                            >
                              {isValidDate
                                ? dateObj.toLocaleString('tr-TR', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : "Tarih Yok"}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                            sx={{ maxWidth: '250px', fontSize: '0.85rem' }}
                          >
                            {item.reminder.notes || t('dashboard.reminders.noNote')}
                          </Typography>
                        }
                      />
                      <ArrowForwardIosIcon sx={{ fontSize: 14, color: "#d1d5db" }} />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Box>
        </Paper>

      </Box>
    </Box>
  );
}