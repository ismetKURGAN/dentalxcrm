"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  Chip,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { useI18n } from "../components/I18nProvider";

const OFFER_KEYWORDS = ["Teklif"]; // Teklif statüleri
const SALE_KEYWORDS = ["Satış"]; // Satış statüleri
const CANCEL_KEYWORDS = ["Satış İptal", "Randevu İptal", "İptal"]; // İptal statüleri

function groupStatus(status: string | undefined) {
  if (!status) return "other";
  const s = status.toLowerCase();
  if (OFFER_KEYWORDS.some((k) => s.includes(k.toLowerCase()))) return "offer";
  if (SALE_KEYWORDS.some((k) => s.includes(k.toLowerCase()))) return "sale";
  if (CANCEL_KEYWORDS.some((k) => s.includes(k.toLowerCase()))) return "cancel";
  return "other";
}

export default function ReportsPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ totalContacts: 0, totalSales: 0, offerRate: 0, saleRate: 0, cancelRate: 0 });

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/crm", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();

      const byAdvisor: Record<string, { total: number; offer: number; sale: number; cancel: number }> = {};

      data.forEach((c: any) => {
        // Danışman bilgisini al (status objesinden veya direkt advisor alanından)
        let adv = "";
        if (typeof c.status === 'object' && c.status !== null) {
          adv = c.status.consultant || c.advisor || t("reports.advisor.defaultAdvisor");
        } else {
          adv = c.advisor || t("reports.advisor.defaultAdvisor");
        }
        
        if (!byAdvisor[adv]) {
          byAdvisor[adv] = { total: 0, offer: 0, sale: 0, cancel: 0 };
        }
        byAdvisor[adv].total += 1;
        
        // Status değerini al
        let statusValue = "";
        if (typeof c.status === 'object' && c.status !== null) {
          statusValue = c.status.status || "";
        } else if (typeof c.status === 'string') {
          statusValue = c.status;
        }
        
        const g = groupStatus(statusValue);
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

  const columns: GridColDef[] = [
    {
      field: "advisor",
      headerName: t("reports.advisor.table.advisor"),
      flex: 1,
      minWidth: 220,
      renderCell: (params) => (
        <Box
          sx={{
            px: 1.5,
            py: 0.75,
            borderRadius: 999,
            bgcolor: "#EEF2FF",
            color: "#3730A3",
            fontSize: "0.8rem",
            fontWeight: 600,
          }}
        >
          {params.value || "Diğer"}
        </Box>
      ),
    },
    {
      field: "total",
      headerName: t("reports.advisor.table.total"),
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{ bgcolor: "#EFF6FF", color: "#1D4ED8", fontWeight: 600, borderRadius: 999 }}
        />
      ),
    },
    {
      field: "offer",
      headerName: t("reports.advisor.table.offer"),
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{ bgcolor: "#F5F3FF", color: "#6D28D9", borderRadius: 999 }}
        />
      ),
    },
    {
      field: "offerPct",
      headerName: t("reports.advisor.table.offerPct"),
      width: 120,
      renderCell: (params) => (
        <Chip
          label={`${params.value}%`}
          size="small"
          sx={{ bgcolor: "#ECFDF3", color: "#15803D", borderRadius: 999 }}
        />
      ),
    },
    {
      field: "sale",
      headerName: t("reports.advisor.table.sale"),
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{ bgcolor: "#DCFCE7", color: "#166534", borderRadius: 999 }}
        />
      ),
    },
    {
      field: "salePct",
      headerName: t("reports.advisor.table.salePct"),
      width: 120,
      renderCell: (params) => (
        <Chip
          label={`${params.value}%`}
          size="small"
          sx={{ bgcolor: "#ECFDF3", color: "#15803D", borderRadius: 999 }}
        />
      ),
    },
    {
      field: "cancel",
      headerName: t("reports.advisor.table.cancel"),
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{ bgcolor: "#FEF2F2", color: "#B91C1C", borderRadius: 999 }}
        />
      ),
    },
    {
      field: "cancelPct",
      headerName: t("reports.advisor.table.cancelPct"),
      width: 140,
      renderCell: (params) => (
        <Chip
          label={`${params.value}%`}
          size="small"
          sx={{ bgcolor: "#FEF2F2", color: "B91C1C", borderRadius: 999 }}
        />
      ),
    },
  ];

  return (
    <Box sx={{ width: "100%", height: "100%", p: 2.5, bgcolor: "#F3F4F6" }}>
      {/* ÜST ÖZET KARTLAR */}
      <Stack spacing={2} mb={3}>
        <Typography variant="h5" fontWeight="bold">
          {t("reports.advisor.title")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("reports.advisor.subtitle")}
        </Typography>

        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Paper
            sx={{
              flex: 1,
              minWidth: 200,
              p: 2,
              borderRadius: 2,
              boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {t("reports.advisor.summary.totalContacts")}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {summary.totalContacts}
            </Typography>
          </Paper>

          <Paper
            sx={{
              flex: 1,
              minWidth: 200,
              p: 2,
              borderRadius: 2,
              boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {t("reports.advisor.summary.totalSales")}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {summary.totalSales}
            </Typography>
          </Paper>

          <Paper
            sx={{
              flex: 1,
              minWidth: 200,
              p: 2,
              borderRadius: 2,
              boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {t("reports.advisor.summary.offerRate")}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              %{summary.offerRate.toFixed(1)}
            </Typography>
          </Paper>

          <Paper
            sx={{
              flex: 1,
              minWidth: 200,
              p: 2,
              borderRadius: 2,
              boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {t("reports.advisor.summary.saleRate")}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              %{summary.saleRate.toFixed(1)}
            </Typography>
          </Paper>

          <Paper
            sx={{
              flex: 1,
              minWidth: 200,
              p: 2,
              borderRadius: 2,
              boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {t("reports.advisor.summary.cancelRate")}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              %{summary.cancelRate.toFixed(1)}
            </Typography>
          </Paper>
        </Stack>

        <Stack direction="row" justifyContent="flex-end">
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={exportToCSV}
          >
            {t("reports.advisor.actions.export")}
          </Button>
        </Stack>
      </Stack>

      {/* TABLO */}
      <Paper
        sx={{
          height: 650,
          width: "100%",
          borderRadius: 2,
          boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
          overflow: "hidden",
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          sx={{
            border: "none",
            "& .MuiDataGrid-columnHeaders": {
              bgcolor: "#F9FAFB",
              color: "#111827",
              fontWeight: 700,
              letterSpacing: 0.2,
            },
            "& .MuiDataGrid-cell": {
              borderBottom: "1px solid #F3F4F6",
              borderRight: "1px solid #E5E7EB",
              display: "flex",
              alignItems: "center",
            },
            "& .MuiDataGrid-columnHeader": {
              borderRight: "1px solid #E5E7EB",
            },
            "& .MuiDataGrid-row:hover": { bgcolor: "#F9FAFB" },
          }}
        />
      </Paper>
    </Box>
  );
}
