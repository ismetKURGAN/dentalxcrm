"use client";

import React, { useEffect, useState, useContext } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { useI18n } from "../components/I18nProvider";
import { ThemeModeContext } from "../components/ThemeRegistry";

function trLower(s: string): string {
  return s.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
}

const OFFER_KEYWORDS = [
  "Teklif", "Ön Bilgi", "Randevu", "Fotoğraf Bekleniyor",
  "Potansiyel Satış", "Konsültasyon Olumlu", "Olumlu",
  "Bilet", "Randevu Onaylı", "Randevuya Gelmedi",
];
const SALE_KEYWORDS = ["Satış"]; // Satış statüleri
const CANCEL_KEYWORDS = ["Satış İptal", "Satış İptali", "Randevu İptal", "İptal"]; // İptal statüleri

function groupStatus(status: string | undefined, service?: string) {
  const s = trLower(status || "");
  if (CANCEL_KEYWORDS.some((k) => s.includes(trLower(k)))) return "cancel";
  if (s.includes("potansiyel satis") || s.includes("potansiyel satış")) return "offer";
  if (SALE_KEYWORDS.some((k) => s.includes(trLower(k)))) return "sale";
  // Teklif kontrolü: hizmet seçili VEYA ilerlemeli durum varsa teklif say
  if ((service || "").toString().trim()) return "offer";
  if (OFFER_KEYWORDS.some((k) => s.includes(trLower(k)))) return "offer";
  return "other";
}

export default function ReportsPage() {
  const { t } = useI18n();
  const { mode } = useContext(ThemeModeContext);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ totalContacts: 0, totalSales: 0, offerRate: 0, saleRate: 0, cancelRate: 0 });

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/crm-sqlite?all=true", { cache: "no-store" });
      if (!res.ok) return;
      const response = await res.json();
      const data = Array.isArray(response) ? response : (response.data || response);

      const byAdvisor: Record<string, { total: number; offer: number; sale: number; cancel: number }> = {};

      data.forEach((c: any) => {
        const adv = (c.advisor || "").toString().trim() || t("reports.advisor.defaultAdvisor");
        
        if (!byAdvisor[adv]) {
          byAdvisor[adv] = { total: 0, offer: 0, sale: 0, cancel: 0 };
        }
        byAdvisor[adv].total += 1;
        
        const statusValue = (c.status || "").toString();
        const g = groupStatus(statusValue, c.service);
        if (g === "offer") byAdvisor[adv].offer += 1;
        if (g === "sale") byAdvisor[adv].sale += 1;
        if (g === "cancel") byAdvisor[adv].cancel += 1;
      });

      const advisorRows = Object.entries(byAdvisor).map(([advisor, v], idx) => {
        const offerPct = v.total ? (v.offer / v.total) * 100 : 0;
        const salePct = v.total ? (v.sale / v.total) * 100 : 0;
        const cancelPct = v.total ? (v.cancel / v.total) * 100 : 0;
        return {
          id: idx + 1,
          advisor,
          total: v.total,
          offer: v.offer,
          offerPct: offerPct.toFixed(1),
          sale: v.sale,
          salePct: salePct.toFixed(1),
          cancel: v.cancel,
          cancelPct: cancelPct.toFixed(1),
        };
      });

      const totalContacts = data.length;
      const totalSales = advisorRows.reduce((sum, r) => sum + r.sale, 0);
      const totalOffers = advisorRows.reduce((sum, r) => sum + r.offer, 0);
      const totalCancels = advisorRows.reduce((sum, r) => sum + r.cancel, 0);

      setSummary({
        totalContacts,
        totalSales,
        offerRate: totalContacts ? (totalOffers / totalContacts) * 100 : 0,
        saleRate: totalContacts ? (totalSales / totalContacts) * 100 : 0,
        cancelRate: totalContacts ? (totalCancels / totalContacts) * 100 : 0,
      });

      setRows(advisorRows);
    } catch (e) {
      console.error("Danışman raporları hesaplanırken hata", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const exportToCSV = () => {
    if (!rows.length) return;
    const header = "Danışman,Toplam, Teklif, Teklif %, Satış, Satış %, İptal, İptal %\n";
    const body = rows
      .map((r) =>
        `"${r.advisor}",${r.total},${r.offer},${r.offerPct},${r.sale},${r.salePct},${r.cancel},${r.cancelPct}`
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "danisman_raporlari.csv";
    a.click();
  };

  const summaryCards = [
    {
      label: t("reports.advisor.summary.totalContacts"),
      value: summary.totalContacts,
      isPercent: false,
      color: "#6366f1",
      bg: mode === "dark" ? "rgba(99,102,241,0.12)" : "#EEF2FF",
      icon: "👥",
    },
    {
      label: t("reports.advisor.summary.totalSales"),
      value: summary.totalSales,
      isPercent: false,
      color: "#10b981",
      bg: mode === "dark" ? "rgba(16,185,129,0.12)" : "#DCFCE7",
      icon: "💰",
    },
    {
      label: t("reports.advisor.summary.offerRate"),
      value: summary.offerRate,
      isPercent: true,
      color: "#f59e0b",
      bg: mode === "dark" ? "rgba(245,158,11,0.12)" : "#FEF9C3",
      icon: "📋",
    },
    {
      label: t("reports.advisor.summary.saleRate"),
      value: summary.saleRate,
      isPercent: true,
      color: "#10b981",
      bg: mode === "dark" ? "rgba(16,185,129,0.12)" : "#DCFCE7",
      icon: "📈",
    },
    {
      label: t("reports.advisor.summary.cancelRate"),
      value: summary.cancelRate,
      isPercent: true,
      color: "#ef4444",
      bg: mode === "dark" ? "rgba(239,68,68,0.12)" : "#FEE2E2",
      icon: "❌",
    },
  ];

  const maxTotal = Math.max(...rows.map((r) => r.total), 1);

  return (
    <Box sx={{ width: "100%", height: "100%", p: { xs: 1.5, md: 2.5 }, bgcolor: mode === "dark" ? "#1E1B3E" : "#F3F4F6" }}>

      {/* HEADER */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: mode === "dark" ? "#fff" : "#111827" }}>
            {t("reports.advisor.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {t("reports.advisor.subtitle")}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownloadIcon />}
            onClick={exportToCSV}
            sx={{ textTransform: "none" }}
          >
            {t("reports.advisor.actions.export")}
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={fetchStats}
            sx={{ textTransform: "none" }}
          >
            Yenile
          </Button>
        </Stack>
      </Stack>

      {/* ÖZET KARTLAR */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3} flexWrap="wrap">
        {summaryCards.map((card) => (
          <Paper
            key={card.label}
            sx={{
              flex: 1,
              minWidth: 160,
              p: 2.5,
              borderRadius: 3,
              border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.06)" : "#E5E7EB"}`,
              boxShadow: mode === "dark" ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
              bgcolor: mode === "dark" ? "#252047" : "#fff",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: 12,
                right: 14,
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: card.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
              {card.icon}
            </Box>
            <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
              {card.label}
            </Typography>
            <Typography variant="h4" fontWeight={700} mt={0.5} sx={{ color: card.color }}>
              {card.isPercent ? `%${card.value.toFixed(1)}` : card.value.toLocaleString()}
            </Typography>
            <Box sx={{ mt: 1.5, height: 4, borderRadius: 99, bgcolor: mode === "dark" ? "rgba(255,255,255,0.06)" : "#F3F4F6", overflow: "hidden" }}>
              <Box sx={{
                height: "100%",
                width: card.isPercent ? `${Math.min(card.value, 100)}%` : `${Math.min((card.value / (summary.totalContacts || 1)) * 100, 100)}%`,
                bgcolor: card.color,
                borderRadius: 99,
                transition: "width 0.6s ease",
              }} />
            </Box>
          </Paper>
        ))}
      </Stack>

      {/* DANIŞMAN TABLOSU */}
      <Paper sx={{
        borderRadius: 3,
        overflow: "hidden",
        border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.06)" : "#E5E7EB"}`,
        boxShadow: mode === "dark" ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
        bgcolor: mode === "dark" ? "#252047" : "#fff",
      }}>
        {/* Tablo başlığı */}
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.06)" : "#F3F4F6"}` }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Danışman Bazlı Performans
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {rows.length} danışman
          </Typography>
        </Box>

        {/* Tablo header */}
        <Box sx={{
          display: "grid",
          gridTemplateColumns: "1fr 100px 120px 120px 120px 120px",
          px: 2.5,
          py: 1.2,
          bgcolor: mode === "dark" ? "#2D2757" : "#F9FAFB",
          borderBottom: `1px solid ${mode === "dark" ? "rgba(124,58,237,0.2)" : "#E5E7EB"}`,
        }}>
          {["Danışman", "Toplam", "Teklif", "Satış", "İptal", "Dönüşüm"].map((h) => (
            <Typography key={h} variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
              {h}
            </Typography>
          ))}
        </Box>

        {/* Tablo satırları */}
        {loading ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">Yükleniyor...</Typography>
          </Box>
        ) : rows.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">Veri bulunamadı</Typography>
          </Box>
        ) : (
          [...rows].sort((a, b) => b.total - a.total).map((row, idx) => (
            <Box
              key={row.id}
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 100px 120px 120px 120px 120px",
                px: 2.5,
                py: 1.5,
                alignItems: "center",
                borderBottom: `1px solid ${mode === "dark" ? "rgba(124,58,237,0.07)" : "#F3F4F6"}`,
                bgcolor: idx % 2 === 0
                  ? (mode === "dark" ? "#252047" : "#fff")
                  : (mode === "dark" ? "#2A2450" : "#FAFAFA"),
                "&:hover": { bgcolor: mode === "dark" ? "#322C5E" : "#F5F3FF" },
                "&:last-child": { borderBottom: "none" },
                transition: "background 0.15s",
              }}
            >
              {/* Danışman */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{
                  width: 34, height: 34, borderRadius: "50%",
                  bgcolor: mode === "dark" ? "rgba(99,102,241,0.2)" : "#EEF2FF",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.85rem", fontWeight: 700, color: "#6366f1", flexShrink: 0,
                }}>
                  {row.advisor.charAt(0).toUpperCase()}
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={600}>{row.advisor}</Typography>
                  {/* Lead bar */}
                  <Box sx={{ mt: 0.4, height: 3, width: 80, borderRadius: 99, bgcolor: mode === "dark" ? "rgba(255,255,255,0.08)" : "#E5E7EB", overflow: "hidden" }}>
                    <Box sx={{ height: "100%", width: `${(row.total / maxTotal) * 100}%`, bgcolor: "#6366f1", borderRadius: 99 }} />
                  </Box>
                </Box>
              </Box>

              {/* Toplam */}
              <Typography variant="body2" fontWeight={700} sx={{ color: mode === "dark" ? "#93C5FD" : "#1D4ED8" }}>
                {row.total}
              </Typography>

              {/* Teklif */}
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ color: mode === "dark" ? "#C4B5FD" : "#7C3AED" }}>
                  {row.offer} <Typography component="span" variant="caption" color="text.secondary">(%{row.offerPct})</Typography>
                </Typography>
              </Box>

              {/* Satış */}
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ color: mode === "dark" ? "#4ADE80" : "#16a34a" }}>
                  {row.sale} <Typography component="span" variant="caption" color="text.secondary">(%{row.salePct})</Typography>
                </Typography>
              </Box>

              {/* İptal */}
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ color: mode === "dark" ? "#FCA5A5" : "#DC2626" }}>
                  {row.cancel} <Typography component="span" variant="caption" color="text.secondary">(%{row.cancelPct})</Typography>
                </Typography>
              </Box>

              {/* Dönüşüm (satış/teklif) */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{
                  px: 1, py: 0.3, borderRadius: 99, fontSize: "0.75rem", fontWeight: 700,
                  bgcolor: row.offer > 0 && (row.sale / row.offer) >= 0.5
                    ? (mode === "dark" ? "rgba(16,185,129,0.2)" : "#DCFCE7")
                    : (mode === "dark" ? "rgba(245,158,11,0.2)" : "#FEF9C3"),
                  color: row.offer > 0 && (row.sale / row.offer) >= 0.5
                    ? (mode === "dark" ? "#4ADE80" : "#16a34a")
                    : (mode === "dark" ? "#FCD34D" : "#92400E"),
                }}>
                  %{row.offer > 0 ? ((row.sale / row.offer) * 100).toFixed(1) : "0.0"}
                </Box>
              </Box>
            </Box>
          ))
        )}
      </Paper>
    </Box>
  );
}
