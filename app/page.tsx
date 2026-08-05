"use client";

import React, { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Avatar,
  Button,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Card,
} from "@mui/material";

import GroupIcon from "@mui/icons-material/Group";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import DescriptionIcon from "@mui/icons-material/Description";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import PhoneCallbackIcon from "@mui/icons-material/PhoneCallback";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import { useI18n } from "./components/I18nProvider";
import { useAuth } from "./components/AuthProvider";
import { ThemeModeContext } from "./components/ThemeRegistry";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const BASE_STATS = [
  { key: "customers", titleKey: "dashboard.card.customers", icon: <GroupIcon />, color: "#6366f1", lightBg: "rgba(99, 102, 241, 0.1)" },
  { key: "sales", titleKey: "dashboard.card.sales", icon: <ShoppingCartIcon />, color: "#10b981", lightBg: "rgba(16, 185, 129, 0.1)" },
  { key: "offers", titleKey: "dashboard.card.offers", icon: <DescriptionIcon />, color: "#f59e0b", lightBg: "rgba(245, 158, 11, 0.1)" },
  { key: "conversion", titleKey: "dashboard.card.conversion", icon: <TrendingUpIcon />, color: "#ec4899", lightBg: "rgba(236, 72, 153, 0.1)" },
];

const DAILY_STATS = [
  { key: "dailyLeads", titleKey: "dashboard.card.dailyLeads", icon: <PersonAddIcon />, color: "#3b82f6", lightBg: "rgba(59, 130, 246, 0.1)" },
  { key: "dailyContacted", titleKey: "dashboard.card.dailyContacted", icon: <PhoneInTalkIcon />, color: "#14b8a6", lightBg: "rgba(20, 184, 166, 0.1)" },
  { key: "dailyOffers", titleKey: "dashboard.card.dailyOffers", icon: <DescriptionIcon />, color: "#f59e0b", lightBg: "rgba(245, 158, 11, 0.1)" },
  { key: "dailySales", titleKey: "dashboard.card.dailySales", icon: <ShoppingCartIcon />, color: "#10b981", lightBg: "rgba(16, 185, 129, 0.1)" },
];

const MONTH_LABELS_TR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

const EMPTY_CHART = MONTH_LABELS_TR.map((name) => ({ name, musteri: 0, teklif: 0, satis: 0 }));

/** Status kolonundan düz durum metnini çıkar (JSON string veya plain string) */
function normalizeStatus(c: any): string {
  const s = c?.status;
  if (!s) return "";
  if (typeof s === "object") return String(s.status || "").trim();
  const str = String(s).trim();
  if (str.startsWith("{")) {
    try {
      return String(JSON.parse(str).status || "").trim();
    } catch {
      return str;
    }
  }
  return str;
}

/** Gerçek satış: "Satış" / "Satış Kapalı". İptal ve Potansiyel Satış hariç. */
function isSaleStatus(status: string): boolean {
  const s = status.trim();
  return s === "Satış" || s === "Satış Kapalı";
}

/** Gönderilmiş teklif: "Teklif Yollandı*" — "Teklif Bekliyor" hariç */
function isOfferStatus(status: string): boolean {
  return status.toLowerCase().startsWith("teklif yolland");
}

/** Europe/Istanbul takvim günü (YYYY-MM-DD) */
function toTurkeyDateKey(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "";
  // Düz "YYYY-MM-DD" (salesDate)
  if (typeof dateInput === "string") {
    const plain = dateInput.match(/^(\d{4}-\d{2}-\d{2})/);
    if (plain && !dateInput.includes("T") && dateInput.length <= 10) return plain[1];
  }
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) {
    const m = String(dateInput).match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : "";
  }
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function isTodayTR(dateInput: string | Date | null | undefined): boolean {
  const key = toTurkeyDateKey(dateInput);
  return !!key && key === toTurkeyDateKey(new Date());
}

/** YYYY-MM anahtarı (Türkiye saati) */
function toTurkeyYearMonth(dateInput: string | Date | null | undefined): string {
  const key = toTurkeyDateKey(dateInput);
  return key ? key.slice(0, 7) : "";
}

/**
 * Son 12 ay müşteri kazanımı grafiği.
 * - Müşteri: o ay oluşturulan lead sayısı (createdAt, TR saati)
 * - Teklif / Satış: aynı ayda oluşan lead'lerden şu an teklif/satış durumunda olanlar (kohort)
 *   Satışta salesDate varsa satış ayına yazılır (aktivite); yoksa lead oluşturma ayına düşer.
 */
function buildChartData(customers: any[]): { name: string; musteri: number; teklif: number; satis: number }[] {
  const nowKey = toTurkeyYearMonth(new Date()); // YYYY-MM
  if (!nowKey) return EMPTY_CHART;

  const [nowY, nowM] = nowKey.split("-").map(Number);
  const buckets: { key: string; name: string; musteri: number; teklif: number; satis: number }[] = [];

  for (let i = 11; i >= 0; i--) {
    // nowM is 1-12; go back i months
    let y = nowY;
    let m = nowM - i;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    const key = `${y}-${String(m).padStart(2, "0")}`;
    const shortYear = String(y).slice(2);
    buckets.push({
      key,
      name: `${MONTH_LABELS_TR[m - 1]} '${shortYear}`,
      musteri: 0,
      teklif: 0,
      satis: 0,
    });
  }

  const indexByKey = new Map(buckets.map((b, idx) => [b.key, idx]));
  const startKey = buckets[0].key;

  customers.forEach((c: any) => {
    const createdKey = toTurkeyYearMonth(c.createdAt);
    if (!createdKey || createdKey < startKey) return;

    const status = normalizeStatus(c);
    const offer = isOfferStatus(status);
    const sale = isSaleStatus(status);

    const createdIdx = indexByKey.get(createdKey);
    if (createdIdx !== undefined) {
      buckets[createdIdx].musteri += 1;
      if (offer) buckets[createdIdx].teklif += 1;
    }

    // Satış: mümkünse salesDate ayına yaz (gerçek satış zamanı)
    if (sale) {
      const salesDate = c.sales?.salesDate || "";
      const saleKey = salesDate ? toTurkeyYearMonth(salesDate) : createdKey;
      const saleIdx = indexByKey.get(saleKey);
      if (saleIdx !== undefined) {
        buckets[saleIdx].satis += 1;
      }
    }
  });

  return buckets.map(({ name, musteri, teklif, satis }) => ({ name, musteri, teklif, satis }));
}

function StatCard({
  title,
  value,
  icon,
  color,
  lightBg,
  mode,
  trendLabel,
  isPositive,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  lightBg: string;
  mode: string;
  trendLabel?: string;
  isPositive?: boolean;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        background:
          mode === "dark"
            ? `linear-gradient(145deg, ${color}20 0%, ${color}10 100%)`
            : lightBg,
        border: mode === "dark" ? `1px solid ${color}30` : `1px solid ${color}20`,
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow:
            mode === "dark" ? `0 8px 24px ${color}40` : `0 8px 24px ${color}30`,
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography
            variant="body2"
            sx={{
              color: mode === "dark" ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.6)",
              mb: 1,
              fontWeight: 500,
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{ color: mode === "dark" ? "#F9FAFB" : "#11142D" }}
          >
            {value}
          </Typography>
          {trendLabel !== undefined && (
            <Chip
              icon={isPositive ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
              label={trendLabel}
              size="small"
              sx={{
                mt: 1.5,
                bgcolor: isPositive
                  ? mode === "dark"
                    ? "rgba(16, 185, 129, 0.2)"
                    : "rgba(16, 185, 129, 0.15)"
                  : mode === "dark"
                    ? "rgba(239, 68, 68, 0.2)"
                    : "rgba(239, 68, 68, 0.15)",
                color: isPositive ? "#10b981" : "#ef4444",
                fontWeight: 600,
                borderRadius: 2,
              }}
            />
          )}
        </Box>
        <Avatar
          sx={{
            bgcolor: color,
            width: 48,
            height: 48,
            boxShadow: `0 2px 10px ${color}50`,
            color: "#fff",
          }}
        >
          {icon}
        </Avatar>
      </Stack>
    </Card>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { t } = useI18n();
  const { user } = useAuth();
  const { mode } = useContext(ThemeModeContext);
  // Admin / SuperAdmin / Yönetici → toplam; Danışmanlar → sadece kendi
  const canViewAllStats =
    !!user?.roles?.includes("Admin") ||
    !!user?.roles?.includes("SuperAdmin") ||
    !!user?.roles?.includes("Yönetici");

  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(EMPTY_CHART);
  const [hiddenSeries, setHiddenSeries] = useState<{ [key: string]: boolean }>({});
  const [statsValues, setStatsValues] = useState({
    customers: 0,
    offers: 0,
    sales: 0,
    conversion: 0,
  });
  const [dailyStats, setDailyStats] = useState({
    dailyLeads: 0,
    dailyContacted: 0,
    dailyOffers: 0,
    dailySales: 0,
  });
  const [statsTrends, setStatsTrends] = useState({
    customers: 0,
    offers: 0,
    sales: 0,
    conversion: 0,
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/crm-sqlite?all=true&include=sales,reminder", {
          cache: "no-store",
        });
        if (!res.ok) return;

        const response = await res.json();
        let data = Array.isArray(response) ? response : response.data || response;

        if (!canViewAllStats && user?.name) {
          data = data.filter((c: any) => c.advisor === user.name);
        }

        const list = Array.isArray(data) ? data : [];

        // Hatırlatıcılar
        const active = list.filter((c: any) => c.reminder && c.reminder.enabled === true);
        active.sort((a: any, b: any) => {
          const dateA = new Date(a.reminder.datetime).getTime() || 0;
          const dateB = new Date(b.reminder.datetime).getTime() || 0;
          return dateA - dateB;
        });
        setReminders(active);

        // Grafik
        try {
          const computed = buildChartData(list);
          setChartData(computed);

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
            const prevConv = prev.teklif > 0 ? (prev.satis / prev.teklif) * 100 : 0;
            const lastConv = last.teklif > 0 ? (last.satis / last.teklif) * 100 : 0;
            const conversionTrend =
              prevConv === 0 ? (lastConv > 0 ? 100 : 0) : ((lastConv - prevConv) / prevConv) * 100;

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

        // Toplam + günlük
        try {
          let offers = 0;
          let sales = 0;
          let dailyLeads = 0;
          let dailyContacted = 0;
          let dailyOffers = 0;
          let dailySales = 0;

          for (const c of list) {
            const status = normalizeStatus(c);
            const createdToday = isTodayTR(c.createdAt);
            const sale = isSaleStatus(status);
            const offer = isOfferStatus(status);

            if (offer) offers += 1;
            if (sale) sales += 1;

            if (createdToday) {
              dailyLeads += 1;
              if (status && status !== "Yeni Form") dailyContacted += 1;
              if (offer) dailyOffers += 1;
            }

            if (sale) {
              const salesDate = c.sales?.salesDate || "";
              if (salesDate ? isTodayTR(salesDate) : createdToday) {
                dailySales += 1;
              }
            }
          }

          setStatsValues({
            customers: list.length,
            offers,
            sales,
            conversion: offers > 0 ? (sales / offers) * 100 : 0,
          });
          setDailyStats({ dailyLeads, dailyContacted, dailyOffers, dailySales });
        } catch (e) {
          console.error("Stats hesaplanırken hata", e);
        }
      } catch (error) {
        console.error("Hata:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [canViewAllStats, user]);

  return (
    <Box
      sx={{
        flexGrow: 1,
        p: 2.5,
        background: mode === "dark" ? "#1E1B3E" : "#F4F5F7",
        minHeight: "100vh",
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          fontWeight="bold"
          gutterBottom
          sx={{ color: mode === "dark" ? "#F9FAFB" : "#11142D" }}
        >
          Bytno CRM
        </Typography>
      </Box>

      {/* TOPLAM KARTLAR */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: { xs: 2, md: 3 },
          mb: { xs: 2, md: 2 },
          width: "100%",
        }}
      >
        {BASE_STATS.map((stat) => {
          const value = (() => {
            switch (stat.key) {
              case "customers":
                return statsValues.customers.toLocaleString("tr-TR");
              case "sales":
                return statsValues.sales.toLocaleString("tr-TR");
              case "offers":
                return statsValues.offers.toLocaleString("tr-TR");
              case "conversion":
                return `%${statsValues.conversion.toFixed(1)}`;
              default:
                return "-";
            }
          })();
          const rawTrend =
            stat.key === "customers"
              ? statsTrends.customers
              : stat.key === "sales"
                ? statsTrends.sales
                : stat.key === "offers"
                  ? statsTrends.offers
                  : statsTrends.conversion;
          const isPositive = rawTrend >= 0;
          return (
            <StatCard
              key={stat.key}
              title={t(stat.titleKey)}
              value={loading ? "…" : value}
              icon={stat.icon}
              color={stat.color}
              lightBg={stat.lightBg}
              mode={mode}
              trendLabel={`${Math.abs(rawTrend).toFixed(1)}% ${
                isPositive
                  ? t("dashboard.card.trend.increase")
                  : t("dashboard.card.trend.decrease")
              }`}
              isPositive={isPositive}
            />
          );
        })}
      </Box>

      {/* GÜNLÜK KARTLAR */}
      <Typography
        variant="subtitle1"
        fontWeight={700}
        sx={{ mb: 1.5, color: mode === "dark" ? "#E5E7EB" : "#374151" }}
      >
        {t("dashboard.daily.title")}
        {!canViewAllStats && user?.name ? ` — ${user.name}` : ""}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: { xs: 2, md: 3 },
          mb: { xs: 2, md: 3 },
          width: "100%",
        }}
      >
        {DAILY_STATS.map((stat) => {
          const value =
            stat.key === "dailyLeads"
              ? dailyStats.dailyLeads
              : stat.key === "dailyContacted"
                ? dailyStats.dailyContacted
                : stat.key === "dailyOffers"
                  ? dailyStats.dailyOffers
                  : dailyStats.dailySales;
          return (
            <StatCard
              key={stat.key}
              title={t(stat.titleKey)}
              value={loading ? "…" : value.toLocaleString("tr-TR")}
              icon={stat.icon}
              color={stat.color}
              lightBg={stat.lightBg}
              mode={mode}
            />
          );
        })}
      </Box>

      {/* GRAFİK + HATIRLATICILAR */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 3,
          width: "100%",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 2.5 },
            borderRadius: 3,
            background: mode === "dark" ? "rgba(42, 37, 80, 0.4)" : "#FFFFFF",
            border:
              mode === "dark"
                ? "1px solid rgba(124, 58, 237, 0.2)"
                : "1px solid rgba(0, 0, 0, 0.06)",
            backdropFilter: mode === "dark" ? "blur(10px)" : "none",
            height: { xs: 360, md: 500 },
            display: "flex",
            flexDirection: "column",
            flex: { xs: "1 1 100%", md: "2 1 0" },
            minWidth: 0,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ color: mode === "dark" ? "#F9FAFB" : "#11142D" }}
            >
              {t("dashboard.chart.title")}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              sx={{
                borderRadius: 2,
                textTransform: "none",
                borderColor: mode === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
                color: mode === "dark" ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.7)",
              }}
              endIcon={<CalendarTodayIcon fontSize="small" />}
            >
              {t("dashboard.chart.last12Months")}
            </Button>
          </Stack>
          <Box sx={{ flexGrow: 1, width: "100%", minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorMusteri" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2196F3" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2196F3" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorTeklif" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSatis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF9800" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FF9800" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9e9e9e", fontSize: 10 }}
                  interval={0}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9e9e9e", fontSize: 12 }}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
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
                    return <span style={{ opacity: isHidden ? 0.4 : 1 }}>{value}</span>;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="musteri"
                  name={t("dashboard.chart.series.customers")}
                  stroke="#2196F3"
                  strokeWidth={3}
                  fillOpacity={hiddenSeries["musteri"] ? 0 : 1}
                  strokeOpacity={hiddenSeries["musteri"] ? 0 : 1}
                  fill="url(#colorMusteri)"
                />
                <Area
                  type="monotone"
                  dataKey="teklif"
                  name={t("dashboard.chart.series.offers")}
                  stroke="#4CAF50"
                  strokeWidth={3}
                  fillOpacity={hiddenSeries["teklif"] ? 0 : 1}
                  strokeOpacity={hiddenSeries["teklif"] ? 0 : 1}
                  fill="url(#colorTeklif)"
                />
                <Area
                  type="monotone"
                  dataKey="satis"
                  name={t("dashboard.chart.series.sales")}
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

        <Paper
          elevation={0}
          sx={{
            p: 0,
            borderRadius: 3,
            background: mode === "dark" ? "rgba(42, 37, 80, 0.4)" : "#FFFFFF",
            border:
              mode === "dark"
                ? "1px solid rgba(124, 58, 237, 0.2)"
                : "1px solid rgba(0, 0, 0, 0.06)",
            backdropFilter: mode === "dark" ? "blur(10px)" : "none",
            height: { xs: 360, md: 500 },
            display: "flex",
            flexDirection: "column",
            flex: { xs: "1 1 100%", md: "1 1 0" },
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              p: 2,
              borderBottom:
                mode === "dark" ? "1px solid rgba(255,255,255,0.08)" : "1px solid #f3f4f6",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box
              sx={{
                p: 1,
                borderRadius: "50%",
                bgcolor: mode === "dark" ? "rgba(99, 102, 241, 0.2)" : "#eff6ff",
                color: "#6366f1",
              }}
            >
              <NotificationsActiveIcon fontSize="small" />
            </Box>
            <Typography
              fontWeight={600}
              sx={{ color: mode === "dark" ? "#F9FAFB" : "#374151" }}
            >
              {t("dashboard.reminders.title")}
            </Typography>
            <Chip
              label={reminders.length}
              size="small"
              sx={{
                ml: "auto",
                height: 20,
                fontSize: 11,
                bgcolor:
                  mode === "dark" ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.1)",
                color: "#6366f1",
              }}
            />
          </Box>

          <Box sx={{ overflowY: "auto", flexGrow: 1 }}>
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
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <CalendarTodayIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                <Typography variant="body2">{t("dashboard.reminders.empty")}</Typography>
              </Box>
            ) : (
              <List disablePadding>
                {reminders.map((item) => {
                  const dateObj = new Date(item.reminder.datetime);
                  const isValidDate = !isNaN(dateObj.getTime());
                  const isPast = isValidDate && dateObj < new Date();
                  const isPhoneCall =
                    item.reminder.notes?.toLowerCase().includes("telefon") ||
                    item.reminder.notes?.toLowerCase().includes("görüşme");

                  return (
                    <ListItem
                      key={item.id}
                      disablePadding
                      divider
                      sx={{ borderColor: "divider" }}
                    >
                      <ListItemButton
                        onClick={() => router.push(`/customers/${item.id}`)}
                        sx={{
                          "&:hover": { bgcolor: "action.hover" },
                          bgcolor: isPast
                            ? mode === "dark"
                              ? "rgba(239, 68, 68, 0.1)"
                              : "#fef2f2"
                            : "transparent",
                          opacity: isPast ? 0.85 : 1,
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          {isPhoneCall ? (
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: "rgba(16, 185, 129, 0.15)",
                                color: "primary.main",
                              }}
                            >
                              <PhoneCallbackIcon fontSize="small" />
                            </Avatar>
                          ) : (
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: "rgba(99, 102, 241, 0.15)",
                                color: "#6366F1",
                              }}
                            >
                              {item.name?.charAt(0).toUpperCase() || "?"}
                            </Avatar>
                          )}
                        </ListItemIcon>

                        <ListItemText
                          primary={
                            <Box display="flex" justifyContent="space-between">
                              <Typography
                                variant="subtitle2"
                                fontWeight="600"
                                color="text.primary"
                              >
                                {item.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color={isPast ? "error" : "primary"}
                                fontWeight={500}
                              >
                                {isValidDate
                                  ? dateObj.toLocaleString("tr-TR", {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
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
                              sx={{ maxWidth: "250px", fontSize: "0.85rem" }}
                            >
                              {item.reminder.notes || t("dashboard.reminders.noNote")}
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
