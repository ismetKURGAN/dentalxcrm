"use client";

import { useState, useEffect, useMemo, useContext, useCallback } from "react";
import {
  Box, Paper, Typography, Button, IconButton, Chip, TextField, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tooltip, Stack, Divider, Snackbar, Alert, Autocomplete, Collapse,
  LinearProgress, Badge, InputAdornment,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CampaignIcon from "@mui/icons-material/Campaign";
import PersonIcon from "@mui/icons-material/Person";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
import BarChartIcon from "@mui/icons-material/BarChart";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import SyncIcon from "@mui/icons-material/Sync";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import PrintIcon from "@mui/icons-material/Print";
import SearchIcon from "@mui/icons-material/Search";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip, Legend, ResponsiveContainer,
} from "recharts";
import { ThemeModeContext } from "../components/ThemeRegistry";
import { useAuth } from "../components/AuthProvider";
import { useRouter } from "next/navigation";

const COST_TYPES = [
  { value: "patient", label: "Hasta Bazlı", icon: <PersonIcon fontSize="small" /> },
  { value: "campaign", label: "Kampanya Bazlı", icon: <CampaignIcon fontSize="small" /> },
  { value: "general", label: "Genel", icon: <BusinessCenterIcon fontSize="small" /> },
  { value: "saleup", label: "Sale Up (Satış Yükseltme)", icon: <TrendingUpIcon fontSize="small" /> },
];

const COST_CATEGORIES = [
  { value: "transfer", label: "Transfer", icon: "✈️" },
  { value: "laboratory", label: "Laboratuvar", icon: "🧪" },
  { value: "hotel", label: "Otel", icon: "🏨" },
  { value: "clinic", label: "Klinik", icon: "🦷" },
  { value: "advertising", label: "Reklam / Kampanya", icon: "📣" },
  { value: "salary", label: "Maaş / Personel", icon: "👥" },
  { value: "saleup", label: "Sale Up (Satış Yükseltme)", icon: "⬆️" },
  { value: "other", label: "Diğer", icon: "📦" },
];

const CURRENCIES = ["EUR", "GBP", "USD", "TRY", "PLN", "CHF", "SEK", "NOK", "DKK"];

const DIRECTION_COLORS: Record<string, any> = {
  expense: { bg: "rgba(239,68,68,0.12)", color: "#ef4444", label: "Gider" },
  income: { bg: "rgba(34,197,94,0.12)", color: "#22c55e", label: "Gelir" },
};

function getCategoryInfo(value: string) {
  return COST_CATEGORIES.find(c => c.value === value) || { value, label: value, icon: "📦" };
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount);
}

// Pie chart colors
const PIE_COLORS = ["#7C3AED","#2563EB","#0891B2","#16A34A","#CA8A04","#DC2626","#9333EA","#0EA5E9"];

// Default exchange rates (EUR base)
const DEFAULT_RATES: Record<string, number> = {
  EUR: 1, GBP: 1.17, USD: 0.92, TRY: 0.028, PLN: 0.23, CHF: 1.04, SEK: 0.087, NOK: 0.086, DKK: 0.134,
};

// Package templates
const TEMPLATES = [
  { label: "Dental Transfer Paketi", items: [
    { category: "transfer", amount: 150, currency: "EUR", description: "Transfer (Havalimanı-Klinik-Otel)" },
    { category: "hotel", amount: 200, currency: "EUR", description: "2 Gece Otel" },
    { category: "laboratory", amount: 120, currency: "EUR", description: "Laboratuvar" },
  ]},
  { label: "Sadece Transfer", items: [
    { category: "transfer", amount: 80, currency: "EUR", description: "Transfer" },
  ]},
  { label: "Otel + Transfer", items: [
    { category: "hotel", amount: 180, currency: "EUR", description: "Otel" },
    { category: "transfer", amount: 80, currency: "EUR", description: "Transfer" },
  ]},
  { label: "Kampanya Reklamı", items: [
    { category: "advertising", amount: 500, currency: "EUR", description: "Reklam Harcaması" },
  ]},
];

const emptyForm = {
  type: "patient",
  category: "transfer",
  direction: "expense",
  amount: "",
  salesAmount: "",
  currency: "EUR",
  description: "",
  relatedId: "",
  relatedName: "",
  date: new Date().toISOString().slice(0, 10),
};

export default function CostsPage() {
  const { mode } = useContext(ThemeModeContext);
  const { user } = useAuth();
  const router = useRouter();
  const isDark = mode === "dark";

  const [costs, setCosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  // Filters
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDirection, setFilterDirection] = useState("");
  const [filterCurrency, setFilterCurrency] = useState("");
  const [filterNoDate, setFilterNoDate] = useState(false);

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [noDate, setNoDate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Patient search autocomplete
  const [patients, setPatients] = useState<any[]>([]);
  const [patientSearch, setPatientSearch] = useState("");

  // Exchange rates (EUR base, stored in localStorage)
  const [showRates, setShowRates] = useState(false);
  const [rates, setRates] = useState<Record<string, number>>(() => {
    if (typeof window !== "undefined") {
      try { return JSON.parse(localStorage.getItem("cost_rates") || "null") || DEFAULT_RATES; } catch { return DEFAULT_RATES; }
    }
    return DEFAULT_RATES;
  });

  // Campaign ROI data from CRM
  const [campaignStats, setCampaignStats] = useState<any[]>([]);
  const [loadingCampaignStats, setLoadingCampaignStats] = useState(false);

  // Template dialog
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templatePatient, setTemplatePatient] = useState("");
  const [templatePatientId, setTemplatePatientId] = useState("");
  const [templatePatients, setTemplatePatients] = useState<any[]>([]);

  // Categories for campaign autocomplete
  const [categories, setCategories] = useState<any[]>([]);

  // Campaign ROI filter
  const [filterCampaignName, setFilterCampaignName] = useState("");

  // Satış hastaları - kategori bazlı listeleme için
  const [salesCustomers, setSalesCustomers] = useState<any[]>([]);

  // Expanded rows in Campaign ROI
  const [expandedCampRows, setExpandedCampRows] = useState<Set<string>>(new Set());

  // Appointment sync
  const [syncing, setSyncing] = useState(false);

  // Hasta Bazlı sıralama + arama
  const [patientSortBy, setPatientSortBy] = useState<"net" | "name" | "date">("net");
  const [patientNameFilter, setPatientNameFilter] = useState("");

  // Export
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFilters, setExportFilters] = useState({ dateFrom: "", dateTo: "", patientName: "", type: "" });

  // Snackbar
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false, message: "", severity: "success",
  });

  const cardBg = isDark ? "rgba(42, 37, 80, 0.7)" : "#fff";
  const tableBg = isDark ? "rgba(30, 27, 62, 0.8)" : "#fff";
  const headerBg = isDark ? "rgba(124, 58, 237, 0.15)" : "#F3F4F6";

  // --- Fetch costs ---
  const fetchCosts = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/api/costs?";
      if (filterDateFrom) url += `dateFrom=${filterDateFrom}&`;
      if (filterDateTo) url += `dateTo=${filterDateTo}&`;
      if (filterType) url += `type=${filterType}&`;
      if (filterDirection) url += `direction=${filterDirection}&`;
      if (filterCurrency) url += `currency=${filterCurrency}&`;
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const raw = await res.json();
        const data = raw.filter((c: any) => c.description !== "__CARD_HEADER__");
        setCosts(data.sort((a: any, b: any) => {
          const da = a.date || ""; const db = b.date || "";
          if (!da && !db) return 0;
          if (!da) return 1;
          if (!db) return -1;
          return da.localeCompare(db);
        }));
      }
    } finally {
      setLoading(false);
    }
  }, [filterDateFrom, filterDateTo, filterType, filterDirection, filterCurrency]);

  // --- Fetch campaign ROI stats ---
  const fetchCampaignStats = useCallback(async () => {
    setLoadingCampaignStats(true);
    try {
      let url = "/api/costs/campaign-stats?";
      if (filterDateFrom) url += `dateFrom=${filterDateFrom}&`;
      if (filterDateTo) url += `dateTo=${filterDateTo}&`;
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) setCampaignStats(await res.json());
    } finally {
      setLoadingCampaignStats(false);
    }
  }, [filterDateFrom, filterDateTo]);

  // --- Fetch patients for autocomplete ---
  const fetchPatients = async (search: string) => {
    if (!search || search.length < 2) return;
    const res = await fetch(`/api/crm-sqlite?search=${encodeURIComponent(search)}&limit=20`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setPatients((data.data || data).map((p: any) => ({ id: p.id, name: p.name, phone: p.phone })));
    }
  };

  // --- Sync appointments → costs ---
  const syncAppointments = async () => {
    setSyncing(true);
    try {
      const [apptRes, costsRes] = await Promise.all([
        fetch("/api/crm-sqlite?all=true&include=sales&status=Sat%C4%B1%C5%9F,Sat%C4%B1%C5%9F%20Kapal%C4%B1", { cache: "no-store" }),
        fetch("/api/costs?type=patient", { cache: "no-store" }),
      ]);
      if (!apptRes.ok) return;
      const apptJson = await apptRes.json();
      const customers: any[] = apptJson.data || apptJson || [];
      const existingCosts: any[] = costsRes.ok ? await costsRes.json() : [];
      const existingIds = new Set(existingCosts.map((c: any) => String(c.relatedId)));
      let created = 0;
      for (const c of customers) {
        const trips: any[] = c.sales?.trips || [];
        const hasAppt = trips.some((t: any) => t.appointmentDate);
        if (!hasAppt) continue;
        if (existingIds.has(String(c.id))) continue;
        const trip = trips.find((t: any) => t.appointmentDate) || trips[0];
        await fetch("/api/costs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "patient", category: "clinic", direction: "expense",
            amount: 0, currency: "EUR",
            description: `Randevu – ${trip?.tripName || "Seyahat 1"} / ${c.service || ""}`.trim().replace(/\/$/, ""),
            relatedId: String(c.id), relatedName: c.name || "",
            date: trip?.appointmentDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
            createdBy: user?.name || "", salesAmount: 0,
          }),
        });
        existingIds.add(String(c.id));
        created++;
      }
      setSnack({ open: true, message: created > 0 ? `${created} hasta eklendi` : "Yeni eklenecek hasta yok", severity: "success" });
      fetchCosts();
    } catch {
      setSnack({ open: true, message: "Senkronizasyon hatası", severity: "error" });
    } finally {
      setSyncing(false);
    }
  };

  // --- Save exchange rates ---
  const saveRates = (newRates: Record<string, number>) => {
    setRates(newRates);
    localStorage.setItem("cost_rates", JSON.stringify(newRates));
    setSnack({ open: true, message: "Kurlar kaydedildi", severity: "success" });
  };

  useEffect(() => { fetchCosts(); }, [fetchCosts]);

  useEffect(() => {
    fetch("/api/categories", { cache: "no-store" })
      .then(r => r.ok ? r.json() : [])
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
    fetch("/api/crm-sqlite?all=true&status=Sat%C4%B1%C5%9F,Sat%C4%B1%C5%9F%20Kapal%C4%B1", { cache: "no-store" })
      .then(r => r.ok ? r.json() : [])
      .then(data => setSalesCustomers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);
  useEffect(() => { if (tab === 2) fetchCampaignStats(); }, [tab, fetchCampaignStats]);

  // --- toEUR helper using exchange rates ---
  const toEUR = useCallback((amount: number, currency: string) => {
    const rate = rates[currency] ?? 1;
    return amount * rate;
  }, [rates]);

  // --- Summary calculations (EUR equivalent using exchange rates) ---
  const { totalExpenseEUR, totalIncomeEUR, netEUR, byCurrency } = useMemo(() => {
    const byCur: Record<string, { expense: number; income: number }> = {};
    let expEUR = 0, incEUR = 0;
    costs.forEach(c => {
      if (!byCur[c.currency]) byCur[c.currency] = { expense: 0, income: 0 };
      if (c.direction === "expense") { byCur[c.currency].expense += c.amount; expEUR += toEUR(c.amount, c.currency); }
      else { byCur[c.currency].income += c.amount; incEUR += toEUR(c.amount, c.currency); }
    });
    return { totalExpenseEUR: expEUR, totalIncomeEUR: incEUR, netEUR: incEUR - expEUR, byCurrency: byCur };
  }, [costs, toEUR]);

  // --- Grouped data ---
  // Hasta Bazlı: filtre aralığında hareket eden hastaları listele,
  // ve sadece seçili tarih aralığındaki kayıtlardan toplam net karı hesapla.
  const byPatient = useMemo(() => {
    const filteredPatientCosts = costs.filter(c => c.type === "patient");
    // Toplam kar hesabı için kaynak veri: sadece filtrelenmiş kayıtlar
    const aggregationSource = filteredPatientCosts;

    const map: Record<string, { id: string; name: string; items: any[]; expense: Record<string, number>; income: Record<string, number>; netEUR: number; latestDate: string }> = {};
    aggregationSource.forEach(c => {
      const key = c.relatedId || c.relatedName || "Belirtilmemiş";
      if (!map[key]) map[key] = { id: c.relatedId, name: c.relatedName || key, items: [], expense: {}, income: {}, netEUR: 0, latestDate: "" };
      map[key].items.push(c);
      const bucket = c.direction === "expense" ? map[key].expense : map[key].income;
      bucket[c.currency] = (bucket[c.currency] || 0) + c.amount;
      map[key].netEUR += (c.direction === "income" ? 1 : -1) * toEUR(c.amount, c.currency);
      if (!map[key].latestDate || (c.date && c.date > map[key].latestDate)) map[key].latestDate = c.date || "";
    });
    const arr = Object.values(map);
    if (patientSortBy === "name") return arr.sort((a, b) => a.name.localeCompare(b.name, "tr"));
    if (patientSortBy === "date") return arr.sort((a, b) => b.latestDate.localeCompare(a.latestDate));
    return arr.sort((a, b) => b.netEUR - a.netEUR);
  }, [costs, toEUR, patientSortBy, filterDateFrom, filterDateTo]);

  const filteredByPatient = useMemo(() => {
    if (!patientNameFilter.trim()) return byPatient;
    const q = patientNameFilter.toLowerCase();
    return byPatient.filter(p => p.name.toLowerCase().includes(q));
  }, [byPatient, patientNameFilter]);

  const byCampaign = useMemo(() => {
    const map: Record<string, { name: string; items: any[]; expense: Record<string, number>; income: Record<string, number>; expenseEUR: number; incomeEUR: number }> = {};
    costs.filter(c => c.type === "campaign").forEach(c => {
      const key = c.relatedName || c.relatedId || "Belirtilmemiş";
      if (!map[key]) map[key] = { name: key, items: [], expense: {}, income: {}, expenseEUR: 0, incomeEUR: 0 };
      map[key].items.push(c);
      const bucket = c.direction === "expense" ? map[key].expense : map[key].income;
      bucket[c.currency] = (bucket[c.currency] || 0) + c.amount;
      if (c.direction === "expense") map[key].expenseEUR += toEUR(c.amount, c.currency);
      else map[key].incomeEUR += toEUR(c.amount, c.currency);
    });
    return Object.values(map).sort((a, b) => b.expenseEUR - a.expenseEUR);
  }, [costs, toEUR]);

  // --- Customers grouped by their CRM category field ---
  const customersByCategory = useMemo(() => {
    const map: Record<string, any[]> = {};
    salesCustomers.forEach(c => {
      const key = c.category || "Belirtilmemiş";
      if (!map[key]) map[key] = [];
      map[key].push(c);
    });
    return map;
  }, [salesCustomers]);

  // --- All campaign rows: union of cost entries + customer categories ---
  const allCampaignRows = useMemo(() => {
    const keys = new Set<string>();
    byCampaign.forEach(c => keys.add(c.name));
    Object.keys(customersByCategory).forEach(k => keys.add(k));
    return Array.from(keys).map(key => ({
      name: key,
      costs: byCampaign.find(c => c.name === key) || null,
      customers: customersByCategory[key] || [],
    })).filter(r => r.costs || r.customers.length > 0)
      .sort((a, b) => {
        const ae = a.costs?.expenseEUR ?? 0;
        const be = b.costs?.expenseEUR ?? 0;
        if (be !== ae) return be - ae;
        return b.customers.length - a.customers.length;
      });
  }, [byCampaign, customersByCategory]);

  // --- Monthly chart data ---
  const monthlyData = useMemo(() => {
    const map: Record<string, { month: string; expense: number; income: number }> = {};
    costs.forEach(c => {
      const month = (c.date || "").slice(0, 7);
      if (!month) return;
      if (!map[month]) map[month] = { month, expense: 0, income: 0 };
      const eurVal = toEUR(c.amount, c.currency);
      if (c.direction === "expense") map[month].expense += eurVal;
      else map[month].income += eurVal;
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  }, [costs, toEUR]);

  // --- Category pie data ---
  const categoryPieData = useMemo(() => {
    const map: Record<string, number> = {};
    costs.filter(c => c.direction === "expense").forEach(c => {
      const cat = getCategoryInfo(c.category).label;
      map[cat] = (map[cat] || 0) + toEUR(c.amount, c.currency);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [costs, toEUR]);

  // --- By category breakdown (for Maliyet Kalemleri tab) ---
  const byCategory = useMemo(() => {
    return COST_CATEGORIES.map(cat => {
      const items = costs.filter(c => c.category === cat.value && c.direction === "expense");
      const totalEUR = items.reduce((s, c) => s + toEUR(c.amount, c.currency), 0);
      const patientIds = [...new Set(items.filter(c => c.relatedId).map(c => c.relatedId))];
      const avgPerEntry = items.length > 0 ? totalEUR / items.length : 0;
      const avgPerPatient = patientIds.length > 0 ? totalEUR / patientIds.length : 0;
      // breakdown by currency
      const byCur: Record<string, number> = {};
      items.forEach(c => { byCur[c.currency] = (byCur[c.currency] || 0) + c.amount; });
      return { ...cat, items, totalEUR, patientIds, patientCount: patientIds.length, avgPerEntry, avgPerPatient, byCur };
    }).filter(c => c.items.length > 0)
      .sort((a, b) => b.totalEUR - a.totalEUR);
  }, [costs, toEUR]);

  // --- Handlers ---
  const openAdd = () => {
    setEditingId(null);
    setNoDate(false);
    setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10) });
    setPatientSearch("");
    setDialogOpen(true);
  };

  const openEdit = (cost: any) => {
    setEditingId(cost.id);
    setForm({
      type: cost.type,
      category: cost.category,
      direction: cost.direction,
      amount: cost.amount.toString(),
      salesAmount: (cost.salesAmount || 0).toString(),
      currency: cost.currency,
      description: cost.description || "",
      relatedId: cost.relatedId || "",
      relatedName: cost.relatedName || "",
      date: cost.date || new Date().toISOString().slice(0, 10),
    });
    setNoDate(!cost.date);
    setPatientSearch(cost.relatedName || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.amount || Number(form.amount) <= 0) {
      setSnack({ open: true, message: "Geçerli bir tutar giriniz", severity: "error" });
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount), salesAmount: Number(form.salesAmount || 0), createdBy: user?.name || "", date: noDate ? "" : form.date };
      const res = editingId
        ? await fetch("/api/costs", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, id: editingId }) })
        : await fetch("/api/costs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

      if (res.ok) {
        setSnack({ open: true, message: editingId ? "Güncellendi" : "Kayıt eklendi", severity: "success" });
        setDialogOpen(false);
        fetchCosts();
      } else {
        setSnack({ open: true, message: "Hata oluştu", severity: "error" });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/costs?id=${id}`, { method: "DELETE" });
    setDeleteConfirm(null);
    setSnack({ open: true, message: "Silindi", severity: "success" });
    fetchCosts();
  };

  const getExportFiltered = () => costs.filter(c => {
    if (exportFilters.dateFrom && c.date < exportFilters.dateFrom) return false;
    if (exportFilters.dateTo && c.date > exportFilters.dateTo) return false;
    if (exportFilters.type && c.type !== exportFilters.type) return false;
    if (exportFilters.patientName && !c.relatedName?.toLowerCase().includes(exportFilters.patientName.toLowerCase())) return false;
    return true;
  });

  const handleExportCSV = () => {
    const filtered = getExportFiltered();
    const headers = ["Tarih", "Tür", "Kategori", "Gider/Gelir", "İlgili", "Açıklama", "Tutar", "Para Birimi", "EUR Eşd.", "Satış Tutarı", "Ekleyen"];
    const rows = filtered.map(c => [
      c.date || "",
      COST_TYPES.find(t => t.value === c.type)?.label || c.type || "",
      getCategoryInfo(c.category).label || "",
      c.direction === "expense" ? "Gider" : "Gelir",
      c.relatedName || "",
      c.description || "",
      c.amount,
      c.currency,
      toEUR(c.amount, c.currency).toFixed(2),
      c.salesAmount || 0,
      c.createdBy || "",
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `maliyetler_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportDialogOpen(false);
  };

  const handleExportPDF = () => {
    const filtered = getExportFiltered();
    const totalExp = filtered.filter(c => c.direction === "expense").reduce((s, c) => s + toEUR(c.amount, c.currency), 0);
    const totalInc = filtered.filter(c => c.direction === "income").reduce((s, c) => s + toEUR(c.amount, c.currency), 0);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Maliyet Raporu</title>
<style>body{font-family:Arial,sans-serif;font-size:11px;margin:20px}h2{color:#7C3AED;margin-bottom:8px}.summary{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px}.summary div{background:#f3f4f6;padding:6px 14px;border-radius:6px;font-size:11px}table{width:100%;border-collapse:collapse;margin-top:8px}th{background:#7C3AED;color:white;padding:6px 8px;text-align:left;font-size:10px}td{padding:5px 8px;border-bottom:1px solid #e5e7eb;font-size:10px}tr:nth-child(even){background:#f9fafb}.expense{color:#ef4444}.income{color:#22c55e}.footer{margin-top:16px;font-size:10px;color:#6b7280}@media print{button{display:none}}</style></head>
<body><h2>💰 Maliyet Raporu</h2>
<div class="summary"><div><strong>Toplam Gider:</strong> € ${totalExp.toFixed(0)}</div><div><strong>Toplam Gelir:</strong> € ${totalInc.toFixed(0)}</div><div><strong>Net:</strong> € ${(totalInc - totalExp).toFixed(0)}</div><div><strong>Kayıt:</strong> ${filtered.length}</div>${exportFilters.dateFrom || exportFilters.dateTo ? `<div><strong>Dönem:</strong> ${exportFilters.dateFrom || "—"} / ${exportFilters.dateTo || "—"}</div>` : ""}</div>
<table><thead><tr><th>Tarih</th><th>Tür</th><th>Kategori</th><th>G/G</th><th>İlgili</th><th>Açıklama</th><th>Tutar</th><th>EUR</th><th>Satış</th></tr></thead><tbody>
${filtered.map(c => `<tr><td>${c.date||""}</td><td>${COST_TYPES.find(t=>t.value===c.type)?.label||c.type}</td><td>${getCategoryInfo(c.category).label}</td><td class="${c.direction}">${c.direction==="expense"?"Gider":"Gelir"}</td><td>${c.relatedName||""}</td><td>${c.description||""}</td><td>${c.amount} ${c.currency}</td><td>€ ${toEUR(c.amount,c.currency).toFixed(0)}</td><td>${c.salesAmount?`${c.salesAmount} ${c.currency}`:""}</td></tr>`).join("")}
</tbody></table><div class="footer">Oluşturulma: ${new Date().toLocaleString("tr-TR")}</div>
<script>window.onload=function(){window.print()}<\/script></body></html>`;
    const pw = window.open("", "_blank");
    if (pw) { pw.document.write(html); pw.document.close(); }
    setExportDialogOpen(false);
  };

  // --- Apply template ---
  const applyTemplate = async (tpl: typeof TEMPLATES[0]) => {
    const date = new Date().toISOString().slice(0, 10);
    for (const item of tpl.items) {
      await fetch("/api/costs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "patient", category: item.category, direction: "expense",
          amount: item.amount, currency: item.currency, description: item.description,
          relatedId: templatePatientId, relatedName: templatePatient,
          date, createdBy: user?.name || "", salesAmount: 0,
        }),
      });
    }
    setTemplateDialogOpen(false);
    setTemplatePatient(""); setTemplatePatientId("");
    setSnack({ open: true, message: `${tpl.label} uygulandı (${tpl.items.length} kayıt)`, severity: "success" });
    fetchCosts();
  };

  // --- Currency summary chips ---
  const renderCurrencyBadges = (map: Record<string, number>) =>
    Object.entries(map).map(([cur, amt]) => (
      <Chip key={cur} label={formatAmount(amt, cur)} size="small"
        sx={{ fontSize: "0.7rem", height: 20, bgcolor: isDark ? "rgba(124,58,237,0.2)" : "#EDE9FE", color: isDark ? "#C4B5FD" : "#7C3AED" }} />
    ));

  const summaryCardSx = {
    p: 2.5, borderRadius: 2, bgcolor: cardBg,
    border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB"}`,
  };

  return (
    <Box sx={{ width: "100%", height: "100%", p: { xs: 1.5, md: 2 }, bgcolor: isDark ? "#1E1B3E" : "#F3F4F6", overflowY: "auto" }}>

      {/* BAŞLIK */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: isDark ? "#fff" : "#11142D" }}>
            💰 Maliyet Yönetimi
          </Typography>
          <Typography variant="caption" sx={{ color: isDark ? "rgba(255,255,255,0.5)" : "#6B7280" }}>
            {costs.length} kayıt
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button variant="outlined" startIcon={syncing ? <SyncIcon sx={{ animation: "spin 1s linear infinite", "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } } }} /> : <CalendarMonthIcon />}
            onClick={syncAppointments} disabled={syncing}
            sx={{ textTransform: "none", fontWeight: 600 }}>
            {syncing ? "Yükleniyor..." : "Randevuları Yükle"}
          </Button>
          <Button variant="outlined" startIcon={<AutoAwesomeIcon />} onClick={() => setTemplateDialogOpen(true)}
            sx={{ textTransform: "none", fontWeight: 600 }}>
            Şablon Uygula
          </Button>
          <Button variant="outlined" startIcon={<CurrencyExchangeIcon />}
            onClick={() => setShowRates(v => !v)}
            endIcon={showRates ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ textTransform: "none", fontWeight: 600 }}>
            Kur Ayarları
          </Button>
          <Button variant="outlined" startIcon={<SaveAltIcon />} onClick={() => setExportDialogOpen(true)}
            sx={{ textTransform: "none", fontWeight: 600 }}>
            Dışa Aktar
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}
            sx={{ textTransform: "none", fontWeight: 600, background: "linear-gradient(135deg, #7C3AED, #9F67FF)" }}>
            Yeni Kayıt
          </Button>
        </Stack>
      </Box>

      {/* KUR AYARLARI PANELİ */}
      <Collapse in={showRates}>
        <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: `1px solid ${isDark ? "rgba(124,58,237,0.3)" : "#DDD6FE"}` }}>
          <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
            <CurrencyExchangeIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle" }} />
            Kur Tablosu (EUR = 1.00 baz)
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
            {CURRENCIES.filter(c => c !== "EUR").map(cur => (
              <TextField key={cur} label={`1 ${cur} = EUR`} type="number" size="small"
                value={rates[cur] ?? DEFAULT_RATES[cur] ?? 1}
                onChange={e => setRates(r => ({ ...r, [cur]: Number(e.target.value) }))}
                sx={{ width: 130 }} inputProps={{ step: 0.001, min: 0.0001 }} />
            ))}
          </Box>
          <Stack direction="row" spacing={1} mt={1.5}>
            <Button variant="contained" size="small" onClick={() => saveRates(rates)} sx={{ textTransform: "none" }}>Kaydet</Button>
            <Button size="small" onClick={() => setRates(DEFAULT_RATES)} sx={{ textTransform: "none" }}>Varsayılana Dön</Button>
          </Stack>
        </Paper>
      </Collapse>

      {/* FİLTRELER */}
      <Paper sx={{ p: 1.5, mb: 2, borderRadius: 2, display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
        <FilterListIcon sx={{ color: isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF", fontSize: 20 }} />
        <TextField select label="Tür" size="small" value={filterType}
          onChange={e => setFilterType(e.target.value)} sx={{ minWidth: 130 }}>
          <MenuItem value="">Tümü</MenuItem>
          {COST_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
        </TextField>
        <TextField select label="Gider/Gelir" size="small" value={filterDirection}
          onChange={e => setFilterDirection(e.target.value)} sx={{ minWidth: 120 }}>
          <MenuItem value="">Tümü</MenuItem>
          <MenuItem value="expense">Gider</MenuItem>
          <MenuItem value="income">Gelir</MenuItem>
        </TextField>
        <TextField
          select
          label="Ay"
          size="small"
          value={(() => {
            if (!filterDateFrom || !filterDateTo) return "";
            const ym = filterDateFrom.slice(0, 7);
            const lastDay = new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), 0).getDate();
            const expectedTo = `${ym}-${String(lastDay).padStart(2, "0")}`;
            return filterDateFrom === `${ym}-01` && filterDateTo === expectedTo ? ym : "";
          })()}
          onChange={e => {
            const ym = e.target.value;
            if (!ym) { setFilterDateFrom(""); setFilterDateTo(""); return; }
            const [y, m] = ym.split("-").map(Number);
            const last = new Date(y, m, 0).getDate();
            setFilterDateFrom(`${ym}-01`);
            setFilterDateTo(`${ym}-${String(last).padStart(2, "0")}`);
          }}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">Tümü</MenuItem>
          {(() => {
            const opts: { value: string; label: string }[] = [];
            const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
            const today = new Date();
            for (let i = 0; i < 24; i++) {
              const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
              const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
              opts.push({ value: ym, label: `${months[d.getMonth()]} ${d.getFullYear()}` });
            }
            return opts.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>);
          })()}
        </TextField>
        <TextField label="Başlangıç" type="date" size="small" value={filterDateFrom}
          onChange={e => setFilterDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 140 }} />
        <TextField label="Bitiş" type="date" size="small" value={filterDateTo}
          onChange={e => setFilterDateTo(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 140 }} />
        <Button
          size="small"
          variant={filterNoDate ? "contained" : "outlined"}
          onClick={() => setFilterNoDate(v => !v)}
          sx={{
            textTransform: "none", fontWeight: 600, whiteSpace: "nowrap",
            ...(filterNoDate
              ? { background: "linear-gradient(135deg,#7C3AED,#9F67FF)", color: "#fff", border: "none" }
              : { borderColor: "#7C3AED", color: "#7C3AED" }),
          }}
        >
          📅 Tarihi Belli Olmayanlar
        </Button>
        {(filterDateFrom || filterDateTo || filterType || filterDirection || filterNoDate) && (
          <Button size="small" onClick={() => { setFilterDateFrom(""); setFilterDateTo(""); setFilterType(""); setFilterDirection(""); setFilterNoDate(false); }} sx={{ textTransform: "none" }}>
            Temizle
          </Button>
        )}
      </Paper>

      {/* ÖZET KARTLAR */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {[
          { label: "Toplam Gider (EUR)", value: totalExpenseEUR, color: "#ef4444", icon: <TrendingDownIcon sx={{ color: "#ef4444", fontSize: 22 }} />, bg: "rgba(239,68,68,0.12)" },
          { label: "Toplam Gelir (EUR)", value: totalIncomeEUR, color: "#22c55e", icon: <TrendingUpIcon sx={{ color: "#22c55e", fontSize: 22 }} />, bg: "rgba(34,197,94,0.12)" },
          { label: "Net (EUR)", value: netEUR, color: netEUR >= 0 ? "#6366f1" : "#ef4444", icon: <AccountBalanceWalletIcon sx={{ color: netEUR >= 0 ? "#6366f1" : "#ef4444", fontSize: 22 }} />, bg: netEUR >= 0 ? "rgba(99,102,241,0.12)" : "rgba(239,68,68,0.12)" },
          { label: "Toplam Kayıt", value: null, color: "#7C3AED", icon: <AttachMoneyIcon sx={{ color: "#7C3AED", fontSize: 22 }} />, bg: "rgba(124,58,237,0.12)", count: costs.length },
        ].map((card, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
            <Paper sx={{ ...summaryCardSx }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: card.bg }}>{card.icon}</Box>
                <Box>
                  <Typography variant="caption" sx={{ color: isDark ? "rgba(255,255,255,0.5)" : "#6B7280" }}>{card.label}</Typography>
                  <Typography variant="h6" fontWeight={700} sx={{ color: card.color }}>
                    {card.count !== undefined ? card.count : `€ ${card.value!.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* PER-CURRENCY SUMMARY */}
      {Object.keys(byCurrency).length > 0 && (
        <Paper sx={{ p: 1.5, mb: 2, borderRadius: 2, display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
          {(filterDateFrom || filterDateTo) && (
            <Chip size="small" icon={<FilterListIcon sx={{ fontSize: "14px !important" }} />}
              label={`${filterDateFrom ? filterDateFrom.split("-").reverse().join(".") : "—"}  →  ${filterDateTo ? filterDateTo.split("-").reverse().join(".") : "—"}`}
              sx={{ fontSize: "0.72rem", height: 22, bgcolor: "rgba(124,58,237,0.15)", color: "#9F67FF", fontWeight: 700, mr: 0.5 }} />
          )}
          <Typography variant="caption" fontWeight={600} sx={{ color: isDark ? "rgba(255,255,255,0.5)" : "#6B7280", mr: 0.5 }}>Para Birimi Bazlı Net:</Typography>
          {Object.entries(byCurrency).map(([cur, val]) => {
            const net = val.income - val.expense;
            return (
              <Chip key={cur} size="small"
                label={`${cur}: ${net >= 0 ? "+" : ""}${formatAmount(net, cur)}`}
                sx={{ fontSize: "0.72rem", height: 22, bgcolor: net >= 0 ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", color: net >= 0 ? "#22c55e" : "#ef4444", fontWeight: 600 }} />
            );
          })}
        </Paper>
      )}

      {/* MAIN TABS */}
      <Paper sx={{ borderRadius: 2, overflow: "hidden", bgcolor: tableBg }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`, px: 2 }}>
          <Tab label="Tüm Kayıtlar" sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.82rem" }} />
          <Tab label={`Hasta Bazlı (${patientNameFilter ? `${filteredByPatient.length}/${byPatient.length}` : byPatient.length})`} sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.82rem" }} />
          <Tab label={`Kampanya ROI (${byCampaign.length})`} sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.82rem" }} />
          <Tab label="Maliyet Kalemleri" sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.82rem" }} />
          <Tab label="Grafikler" icon={<BarChartIcon fontSize="small" />} iconPosition="start" sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.82rem" }} />
        </Tabs>

        {/* TAB 0: Tüm Kayıtlar */}
        {tab === 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: headerBg }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Tarih</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Tür</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Kategori</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>G/G</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>İlgili</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Açıklama</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }} align="right">Tutar</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }} align="right">EUR Eşd.</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }} align="center">İşlem</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} sx={{ p: 0 }}><LinearProgress /></TableCell></TableRow>
                ) : costs.length === 0 ? (
                  <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5, color: isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF" }}>Henüz kayıt yok. "Yeni Kayıt" butonuyla başlayın.</TableCell></TableRow>
                ) : costs.filter(c => !filterNoDate || !c.date).map(cost => {
                  const cat = getCategoryInfo(cost.category);
                  const dir = DIRECTION_COLORS[cost.direction] || DIRECTION_COLORS.expense;
                  const typeLabel = COST_TYPES.find(t => t.value === cost.type)?.label || cost.type;
                  const eurEq = toEUR(cost.amount, cost.currency);
                  return (
                    <TableRow key={cost.id} hover>
                      <TableCell sx={{ fontSize: "0.78rem" }}>{cost.date}</TableCell>
                      <TableCell sx={{ fontSize: "0.75rem", color: isDark ? "rgba(255,255,255,0.6)" : "#6B7280" }}>{typeLabel}</TableCell>
                      <TableCell>
                        <Chip label={`${cat.icon} ${cat.label}`} size="small"
                          sx={{ fontSize: "0.7rem", height: 20, bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6" }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={dir.label} size="small"
                          sx={{ fontSize: "0.7rem", height: 20, bgcolor: dir.bg, color: dir.color, fontWeight: 600 }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.78rem", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {cost.relatedName || "-"}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.78rem", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {cost.description || "-"}
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={700} fontSize="0.82rem" sx={{ color: cost.direction === "expense" ? "#ef4444" : "#22c55e" }}>
                          {cost.direction === "expense" ? "−" : "+"}{formatAmount(cost.amount, cost.currency)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: "0.72rem", color: isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF" }}>
                        {cost.currency !== "EUR" ? `€ ${eurEq.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}` : "—"}
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="Düzenle"><IconButton size="small" onClick={() => openEdit(cost)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Sil"><IconButton size="small" onClick={() => setDeleteConfirm(cost.id)} sx={{ color: "#ef4444" }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* TAB 1: Hasta Bazlı */}
        {tab === 1 && (
          <>
            <Box sx={{ p: 2, borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
              <TextField
                size="small"
                placeholder="Hasta adı ara..."
                value={patientNameFilter}
                onChange={e => setPatientNameFilter(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: "text.secondary" }} /></InputAdornment> }}
                sx={{ minWidth: 220 }}
              />
              <TextField select size="small" label="Sıralama" value={patientSortBy}
                onChange={e => setPatientSortBy(e.target.value as any)} sx={{ minWidth: 170 }}>
                <MenuItem value="net">Net (EUR)</MenuItem>
                <MenuItem value="name">İsim (A → Z)</MenuItem>
                <MenuItem value="date">Tarih (Yeni → Eski)</MenuItem>
              </TextField>
              {patientNameFilter && (
                <Button size="small" onClick={() => setPatientNameFilter("")} sx={{ textTransform: "none" }}>Temizle</Button>
              )}
              {(filterDateFrom || filterDateTo) && (
                <Tooltip title="Tarih filtresi: seçili aralıkta kaydı olan hastaları listeler. Net kar sütunu ise her hastanın TÜM kayıtlarından hesaplanır.">
                  <Chip size="small" label="ℹ️ Net: tüm kayıtlar üzerinden"
                    sx={{ fontSize: "0.7rem", height: 22, bgcolor: "rgba(124,58,237,0.12)", color: "#7C3AED", fontWeight: 600 }} />
                </Tooltip>
              )}
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: headerBg }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Hasta</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }} align="center">Kayıt</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Giderler</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Gelirler</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }} align="right">Net (EUR)</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Kategoriler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredByPatient.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5, color: isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF" }}>
                      {patientNameFilter ? `"${patientNameFilter}" için kayıt bulunamadı` : "Hasta bazlı kayıt yok"}
                    </TableCell></TableRow>
                  ) : filteredByPatient.map((p, i) => (
                    <TableRow key={i} hover>
                      <TableCell>
                        <Typography
                          fontWeight={600}
                          fontSize="0.82rem"
                          sx={{
                            cursor: p.id ? "pointer" : "default",
                            color: p.id ? "#7C3AED" : "inherit",
                            "&:hover": p.id ? { textDecoration: "underline" } : {},
                          }}
                          onClick={() => p.id && router.push(`/customers/${p.id}`)}
                        >
                          {p.name}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ fontSize: "0.78rem" }}>{p.items.length}</TableCell>
                      <TableCell>
                        <Stack direction="row" flexWrap="wrap" gap={0.5}>
                          {renderCurrencyBadges(p.expense)}
                          {Object.keys(p.expense).length === 0 && <Typography variant="caption" sx={{ color: "rgba(150,150,150,0.5)" }}>-</Typography>}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" flexWrap="wrap" gap={0.5}>
                          {renderCurrencyBadges(p.income)}
                          {Object.keys(p.income).length === 0 && <Typography variant="caption" sx={{ color: "rgba(150,150,150,0.5)" }}>-</Typography>}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={700} fontSize="0.82rem" sx={{ color: p.netEUR >= 0 ? "#22c55e" : "#ef4444" }}>
                          {p.netEUR >= 0 ? "+" : ""}€ {p.netEUR.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" flexWrap="wrap" gap={0.5}>
                          {[...new Set(p.items.map((x: any) => x.category))].map((cat: any) => {
                            const c = getCategoryInfo(cat);
                            return <Chip key={cat} label={`${c.icon} ${c.label}`} size="small"
                              sx={{ fontSize: "0.68rem", height: 18, bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6" }} />;
                          })}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {/* TAB 2: Kampanya ROI */}
        {tab === 2 && (
          <>
            {loadingCampaignStats && <LinearProgress />}
            {/* Kampanya filtresi */}
            <Box sx={{ p: 2, borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
              <Autocomplete
                freeSolo
                options={categories}
                getOptionLabel={(o: any) => typeof o === "string" ? o : `${o.topParent ? o.topParent + " - " : ""}${o.name}`}
                inputValue={filterCampaignName}
                onInputChange={(_, val, reason) => { if (reason !== "reset") setFilterCampaignName(val); }}
                onChange={(_, val: any) => {
                  if (val && typeof val === "object") setFilterCampaignName(val.name);
                  else if (!val) setFilterCampaignName("");
                }}
                sx={{ flex: 1, minWidth: 260, maxWidth: 420 }}
                renderInput={(params) => (
                  <TextField {...params} size="small" label="Kampanya Ara" placeholder="Kategori filtrele... (\u00f6r: Leh\u00e7e Polonya)" />
                )}
              />
              {filterCampaignName && (
                <Button size="small" variant="outlined" startIcon={<AddIcon />}
                  onClick={() => {
                    setEditingId(null);
                    setForm({ ...emptyForm, type: "campaign", relatedName: filterCampaignName, category: "advertising", date: new Date().toISOString().slice(0, 10) });
                    setPatientSearch("");
                    setDialogOpen(true);
                  }}
                  sx={{ textTransform: "none", fontWeight: 600, whiteSpace: "nowrap" }}>
                  Gider / Gelir Ekle
                </Button>
              )}
              {filterCampaignName && (
                <Button size="small" onClick={() => setFilterCampaignName("")} sx={{ textTransform: "none" }}>Temizle</Button>
              )}
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: headerBg }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", width: 32 }} />
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Kampanya / Kategori</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }} align="right">Gider (EUR)</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }} align="right">Gelir (EUR)</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }} align="right">Net (EUR)</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }} align="right">Satış Hasta</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }} align="right">Başına Maliyet</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    const filtered = filterCampaignName
                      ? allCampaignRows.filter(r => r.name.toLowerCase().includes(filterCampaignName.toLowerCase()))
                      : allCampaignRows;
                    if (filtered.length === 0) return (
                      <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF" }}>
                        {filterCampaignName
                          ? `"${filterCampaignName}" için kayıt yok — yukarıdaki butona tıklayarak ekleyebilirsiniz.`
                          : "Henüz kayıt yok."}
                      </TableCell></TableRow>
                    );
                    return filtered.map((row) => {
                      const camp = row.costs;
                      const customers = row.customers;
                      const campItems: any[] = camp?.items || [];
                      const expenseEUR = camp?.expenseEUR ?? 0;
                      const incomeEUR = camp?.incomeEUR ?? 0;
                      const netEUR = incomeEUR - expenseEUR;
                      const costPerSale = customers.length > 0 && expenseEUR > 0 ? expenseEUR / customers.length : null;
                      const hasDetails = customers.length > 0 || campItems.length > 0;
                      const isExpanded = expandedCampRows.has(row.name);
                      return (
                        <>
                          <TableRow key={row.name} hover
                            sx={{ cursor: hasDetails ? "pointer" : "default",
                              bgcolor: isExpanded ? (isDark ? "rgba(124,58,237,0.08)" : "rgba(124,58,237,0.04)") : "inherit" }}
                            onClick={() => {
                              if (!hasDetails) return;
                              setExpandedCampRows(prev => {
                                const next = new Set(prev);
                                next.has(row.name) ? next.delete(row.name) : next.add(row.name);
                                return next;
                              });
                            }}>
                            <TableCell sx={{ py: 0.5 }}>
                              {hasDetails
                                ? (isExpanded ? <ExpandLessIcon sx={{ fontSize: 16, color: "#7C3AED" }} /> : <ExpandMoreIcon sx={{ fontSize: 16, color: "text.secondary" }} />)
                                : null}
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography fontWeight={600} fontSize="0.82rem">{row.name}</Typography>
                                {customers.length > 0 && (
                                  <Chip label={`${customers.length} hasta`} size="small"
                                    sx={{ fontSize: "0.68rem", height: 18, bgcolor: "rgba(34,197,94,0.12)", color: "#22c55e", fontWeight: 600 }} />
                                )}
                              </Stack>
                            </TableCell>
                            <TableCell align="right">
                              <Typography fontWeight={700} fontSize="0.82rem" sx={{ color: expenseEUR > 0 ? "#ef4444" : "text.secondary" }}>
                                {expenseEUR > 0 ? `€ ${expenseEUR.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}` : "—"}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography fontWeight={700} fontSize="0.82rem" sx={{ color: incomeEUR > 0 ? "#22c55e" : "text.secondary" }}>
                                {incomeEUR > 0 ? `€ ${incomeEUR.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}` : "—"}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography fontWeight={700} fontSize="0.82rem"
                                sx={{ color: expenseEUR === 0 && incomeEUR === 0 ? "text.secondary" : netEUR >= 0 ? "#6366f1" : "#ef4444" }}>
                                {expenseEUR === 0 && incomeEUR === 0 ? "—" : `${netEUR >= 0 ? "+" : ""}€ ${netEUR.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}`}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography fontWeight={700} fontSize="0.82rem" sx={{ color: "#22c55e" }}>
                                {customers.length > 0 ? customers.length : "—"}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              {costPerSale !== null
                                ? <Typography fontSize="0.82rem" fontWeight={700} sx={{ color: "#7C3AED" }}>€ {costPerSale.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}</Typography>
                                : <Typography fontSize="0.75rem" sx={{ color: "text.secondary" }}>—</Typography>}
                            </TableCell>
                          </TableRow>
                          {/* Expanded: maliyet kayıtları + hasta listesi */}
                          {isExpanded && hasDetails && (
                            <TableRow key={`${row.name}-expand`}>
                              <TableCell colSpan={7} sx={{ p: 0 }}>
                                <Box sx={{ bgcolor: isDark ? "rgba(124,58,237,0.05)" : "rgba(124,58,237,0.03)", px: 3, py: 1.5 }}>
                                  {campItems.length > 0 && (
                                    <>
                                      <Typography variant="caption" fontWeight={700} sx={{ color: "#ef4444", mb: 0.5, display: "block" }}>
                                        Maliyet Kayıtları
                                      </Typography>
                                      <Stack spacing={0.5} mb={1.5}>
                                        {campItems.map((ci: any) => (
                                          <Stack key={ci.id} direction="row" alignItems="center" spacing={1}
                                            sx={{ py: 0.5, px: 1, borderRadius: 1, bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#fff",
                                              border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB"}` }}>
                                            <Typography fontSize="0.72rem" sx={{ color: "text.secondary", minWidth: 80 }}>{ci.date || "—"}</Typography>
                                            <Chip label={`${ci.direction === "income" ? "💰" : "💸"} ${getCategoryInfo(ci.category).label}`} size="small"
                                              sx={{ fontSize: "0.65rem", height: 16, bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6" }} />
                                            <Typography fontSize="0.78rem" fontWeight={600}
                                              sx={{ color: ci.direction === "income" ? "#22c55e" : "#ef4444" }}>
                                              {formatAmount(ci.amount, ci.currency)}
                                            </Typography>
                                            <Typography fontSize="0.72rem" sx={{ color: "text.secondary", flex: 1 }}>{ci.description || ""}</Typography>
                                            <IconButton size="small" onClick={e => { e.stopPropagation(); openEdit(ci); }}
                                              sx={{ p: 0.3 }}><EditIcon sx={{ fontSize: 13 }} /></IconButton>
                                            <IconButton size="small" onClick={e => { e.stopPropagation(); setDeleteConfirm(ci.id); }}
                                              sx={{ p: 0.3, color: "#ef4444" }}><DeleteIcon sx={{ fontSize: 13 }} /></IconButton>
                                          </Stack>
                                        ))}
                                      </Stack>
                                    </>
                                  )}
                                  {customers.length > 0 && (
                                    <>
                                      <Typography variant="caption" fontWeight={700} sx={{ color: "#7C3AED", mb: 0.5, display: "block" }}>
                                        Satış Hastaları
                                      </Typography>
                                      <Stack spacing={0.5}>
                                        {customers.map((c: any) => (
                                          <Stack key={c.id} direction="row" alignItems="center" spacing={2}
                                            sx={{ py: 0.5, px: 1, borderRadius: 1, bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#fff",
                                              border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB"}` }}>
                                            <PersonIcon sx={{ fontSize: 14, color: "#9CA3AF" }} />
                                            <Typography fontSize="0.8rem" fontWeight={600} sx={{ minWidth: 160 }}>{c.name || "—"}</Typography>
                                            <Typography fontSize="0.75rem" sx={{ color: "text.secondary", minWidth: 120 }}>{c.phone || "—"}</Typography>
                                            <Typography fontSize="0.75rem" sx={{ color: "text.secondary" }}>{c.service || "—"}</Typography>
                                            <Chip label={c.status || "Satış"} size="small"
                                              sx={{ fontSize: "0.65rem", height: 16, bgcolor: "rgba(34,197,94,0.12)", color: "#22c55e", ml: "auto" }} />
                                          </Stack>
                                        ))}
                                      </Stack>
                                    </>
                                  )}
                                </Box>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    });
                  })()}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {/* TAB 3: Maliyet Kalemleri */}
        {tab === 3 && (
          <Box sx={{ p: 2 }}>
            {byCategory.length === 0 ? (
              <Typography variant="body2" sx={{ py: 5, textAlign: "center", color: isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF" }}>
                Henüz gider kaydı yok.
              </Typography>
            ) : (
              <>
                {/* Özet kart satırı */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {byCategory.map(cat => (
                    <Grid key={cat.value} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                      <Paper sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? "rgba(42,37,80,0.7)" : "#fff",
                        border: `1px solid ${isDark ? "rgba(124,58,237,0.2)" : "#E5E7EB"}` }}>
                        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                          <Typography fontSize="1.3rem">{cat.icon}</Typography>
                          <Typography fontWeight={700} fontSize="0.9rem">{cat.label}</Typography>
                        </Stack>
                        <Typography fontWeight={800} fontSize="1.1rem" sx={{ color: "#ef4444" }}>
                          € {cat.totalEUR.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.5}>
                          {Object.entries(cat.byCur).map(([cur, amt]) => (
                            <Chip key={cur} size="small" label={`${formatAmount(amt, cur)}`}
                              sx={{ fontSize: "0.65rem", height: 16, bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6" }} />
                          ))}
                        </Stack>
                        <Divider sx={{ my: 1 }} />
                        <Stack spacing={0.3}>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography fontSize="0.72rem" sx={{ color: "text.secondary" }}>Kayıt sayısı</Typography>
                            <Typography fontSize="0.72rem" fontWeight={600}>{cat.items.length}</Typography>
                          </Stack>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography fontSize="0.72rem" sx={{ color: "text.secondary" }}>Kayıt başı ort.</Typography>
                            <Typography fontSize="0.72rem" fontWeight={600} sx={{ color: "#7C3AED" }}>
                              € {cat.avgPerEntry.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
                            </Typography>
                          </Stack>
                          {cat.patientCount > 0 && (
                            <Stack direction="row" justifyContent="space-between">
                              <Typography fontSize="0.72rem" sx={{ color: "text.secondary" }}>Kişi başı ort.</Typography>
                              <Typography fontSize="0.72rem" fontWeight={700} sx={{ color: "#6366f1" }}>
                                € {cat.avgPerPatient.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
                              </Typography>
                            </Stack>
                          )}
                          {cat.patientCount > 0 && (
                            <Stack direction="row" justifyContent="space-between">
                              <Typography fontSize="0.72rem" sx={{ color: "text.secondary" }}>Hasta sayısı</Typography>
                              <Typography fontSize="0.72rem" fontWeight={600}>{cat.patientCount}</Typography>
                            </Stack>
                          )}
                        </Stack>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>

                {/* Detay tablosu */}
                <Typography variant="subtitle2" fontWeight={700} mb={1.5} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  📋 Kalem Detayları
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: headerBg }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Tarih</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Kategori</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>İlgili</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Açıklama</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }} align="right">Tutar</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }} align="right">EUR Eşd.</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }} align="center">İşlem</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {byCategory.flatMap(cat =>
                        cat.items.map((cost: any) => (
                          <TableRow key={cost.id} hover>
                            <TableCell sx={{ fontSize: "0.78rem" }}>{cost.date || "—"}</TableCell>
                            <TableCell>
                              <Chip label={`${cat.icon} ${cat.label}`} size="small"
                                sx={{ fontSize: "0.68rem", height: 18, bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6" }} />
                            </TableCell>
                            <TableCell sx={{ fontSize: "0.78rem" }}>{cost.relatedName || "—"}</TableCell>
                            <TableCell sx={{ fontSize: "0.78rem", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {cost.description || "—"}
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: "0.82rem", fontWeight: 600 }}>
                              {formatAmount(cost.amount, cost.currency)}
                            </TableCell>
                            <TableCell align="right">
                              <Typography fontSize="0.82rem" fontWeight={700} sx={{ color: "#ef4444" }}>
                                € {toEUR(cost.amount, cost.currency).toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Stack direction="row" spacing={0.5} justifyContent="center">
                                <Tooltip title="Düzenle"><IconButton size="small" onClick={() => openEdit(cost)} sx={{ p: 0.5 }}><EditIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
                                <Tooltip title="Sil"><IconButton size="small" onClick={() => setDeleteConfirm(cost.id)} sx={{ p: 0.5, color: "#ef4444" }}><DeleteIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Box>
        )}

        {/* TAB 4: Grafikler */}
        {tab === 4 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Aylık Trend */}
              <Grid size={{ xs: 12, md: 7 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={2}>📈 Aylık Gider / Gelir Trendi (EUR)</Typography>
                {monthlyData.length === 0 ? (
                  <Typography variant="body2" sx={{ color: isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF", py: 4, textAlign: "center" }}>Henüz veri yok</Typography>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke={isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF"} />
                      <YAxis tick={{ fontSize: 11 }} stroke={isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF"} tickFormatter={v => `€${v}`} />
                      <RechartTooltip formatter={(v: any) => [`€ ${Number(v).toFixed(0)}`, ""]} />
                      <Legend />
                      <Bar dataKey="expense" name="Gider" fill="#ef4444" radius={[3,3,0,0]} />
                      <Bar dataKey="income" name="Gelir" fill="#22c55e" radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Grid>
              {/* Kategori Dağılımı */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={2}>🥧 Gider Kategori Dağılımı (EUR)</Typography>
                {categoryPieData.length === 0 ? (
                  <Typography variant="body2" sx={{ color: isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF", py: 4, textAlign: "center" }}>Henüz veri yok</Typography>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={categoryPieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                        {categoryPieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartTooltip formatter={(v: any) => [`€ ${Number(v).toFixed(0)}`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Grid>
              {/* Line chart for net trend */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={2}>📊 Net Trend (EUR)</Typography>
                {monthlyData.length === 0 ? (
                  <Typography variant="body2" sx={{ color: isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF", py: 2, textAlign: "center" }}>Henüz veri yok</Typography>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={monthlyData.map(d => ({ ...d, net: d.income - d.expense }))} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke={isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF"} />
                      <YAxis tick={{ fontSize: 11 }} stroke={isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF"} tickFormatter={v => `€${v}`} />
                      <RechartTooltip formatter={(v: any) => [`€ ${Number(v).toFixed(0)}`, "Net"]} />
                      <Line type="monotone" dataKey="net" name="Net" stroke="#7C3AED" strokeWidth={2} dot={{ r: 4, fill: "#7C3AED" }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* ADD / EDIT DIALOG */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {editingId ? "Kaydı Düzenle" : "Yeni Maliyet Kaydı"}
          <IconButton size="small" onClick={() => setDialogOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select label="Tür" fullWidth size="small" value={form.type}
                onChange={e => {
                  const newType = e.target.value;
                  setForm(f => ({ ...f, type: newType, ...(newType === "saleup" ? { category: "saleup", direction: "expense" } : {}) }));
                }}>
                {COST_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select label="Gider / Gelir" fullWidth size="small" value={form.direction}
                onChange={e => setForm(f => ({ ...f, direction: e.target.value }))}>
                <MenuItem value="expense">💸 Gider</MenuItem>
                <MenuItem value="income">💰 Gelir</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              {form.type === "campaign" ? (
                <Autocomplete
                  freeSolo
                  options={categories}
                  getOptionLabel={(o: any) => typeof o === "string" ? o : `${o.topParent ? o.topParent + " - " : ""}${o.name}`}
                  inputValue={form.relatedName}
                  onInputChange={(_, val, reason) => {
                    if (reason !== "reset") setForm(f => ({ ...f, relatedName: val, relatedId: "", category: "advertising" }));
                  }}
                  onChange={(_, val: any) => {
                    if (val && typeof val === "object") {
                      setForm(f => ({ ...f, relatedName: val.name, relatedId: val.id?.toString() || "", category: "advertising" }));
                    } else if (!val) {
                      setForm(f => ({ ...f, relatedName: "", relatedId: "" }));
                    }
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Kampanya Kategorisi" size="small" fullWidth placeholder="Kategori ara... (ör: Lehçe Polonya)" />
                  )}
                />
              ) : form.type === "saleup" ? (
                <TextField label="Kategori" fullWidth size="small" value="⬆️ Sale Up (Satış Yükseltme)" disabled />
              ) : (
                <TextField select label="Kategori" fullWidth size="small" value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {COST_CATEGORIES.map(c => <MenuItem key={c.value} value={c.value}>{c.icon} {c.label}</MenuItem>)}
                </TextField>
              )}
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              {noDate ? (
                <TextField key="no-date" label="Tarih" size="small" fullWidth value="Tarihi belli değil"
                  disabled InputLabelProps={{ shrink: true }} />
              ) : (
                <TextField key="with-date" label="Tarih" type="date" fullWidth size="small" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  InputLabelProps={{ shrink: true }} />
              )}
              <Button
                size="small"
                variant={noDate ? "contained" : "text"}
                onClick={() => setNoDate(v => !v)}
                sx={{ mt: 0.5, textTransform: "none", fontSize: "0.72rem", p: "2px 8px",
                  ...(noDate
                    ? { background: "#7C3AED", color: "#fff", "&:hover": { background: "#6D28D9" } }
                    : { color: "#6B7280" }) }}
              >
                {noDate ? "✓ Tarihi belli değil" : "Tarihi belli değil"}
              </Button>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="Tutar" type="number" fullWidth size="small" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                inputProps={{ min: 0, step: 0.01 }}
                helperText={form.currency !== "EUR" && Number(form.amount) > 0 ? `≈ € ${toEUR(Number(form.amount), form.currency).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : " "} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField select label="Para Birimi" fullWidth size="small" value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                {CURRENCIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="Satış Tutarı (gelir)" type="number" fullWidth size="small" value={form.salesAmount}
                onChange={e => setForm(f => ({ ...f, salesAmount: e.target.value }))}
                helperText="Gelir/satış varsa girin" inputProps={{ min: 0, step: 0.01 }} />
            </Grid>
            {form.currency !== "EUR" && Number(form.amount) > 0 && (
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center", p: 1, bgcolor: isDark ? "rgba(124,58,237,0.08)" : "#F5F3FF", borderRadius: 1.5 }}>
                  <Typography variant="caption" fontWeight={600} sx={{ color: isDark ? "rgba(255,255,255,0.6)" : "#6B7280" }}>EUR Karlşılığı:</Typography>
                  <Chip size="small"
                    label={`Tutar: € ${toEUR(Number(form.amount), form.currency).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    sx={{ fontSize: "0.72rem", height: 20, bgcolor: "rgba(239,68,68,0.12)", color: "#ef4444", fontWeight: 600 }} />
                  {Number(form.salesAmount) > 0 && (
                    <Chip size="small"
                      label={`Satış: € ${toEUR(Number(form.salesAmount), form.currency).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      sx={{ fontSize: "0.72rem", height: 20, bgcolor: "rgba(34,197,94,0.12)", color: "#22c55e", fontWeight: 600 }} />
                  )}
                  <Chip size="small"
                    label={`Toplam: € ${(toEUR(Number(form.amount), form.currency) + toEUR(Number(form.salesAmount) || 0, form.currency)).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    sx={{ fontSize: "0.72rem", height: 20, bgcolor: "rgba(99,102,241,0.12)", color: "#6366f1", fontWeight: 700 }} />
                </Box>
              </Grid>
            )}
            <Grid size={{ xs: 12 }}>
              {form.type === "patient" ? (
                <Autocomplete
                  freeSolo
                  options={patients}
                  getOptionLabel={(o: any) => typeof o === "string" ? o : `${o.name} (${o.phone || ""})`}
                  inputValue={patientSearch}
                  onInputChange={(_, val) => {
                    setPatientSearch(val);
                    setForm(f => ({ ...f, relatedName: val }));
                    fetchPatients(val);
                  }}
                  onChange={(_, val: any) => {
                    if (val && typeof val === "object") {
                      setForm(f => ({ ...f, relatedId: val.id?.toString() || "", relatedName: val.name }));
                      setPatientSearch(val.name);
                    }
                  }}
                  renderInput={(params) => <TextField {...params} label="Hasta Adı" size="small" fullWidth placeholder="Hasta adı ara..." />}
                />
              ) : form.type !== "campaign" ? (
                <TextField label="İlgili (Opsiyonel)" fullWidth size="small" value={form.relatedName}
                  onChange={e => setForm(f => ({ ...f, relatedName: e.target.value, relatedId: "" }))} />
              ) : null}
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Açıklama" fullWidth size="small" multiline rows={2} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: "none" }}>İptal</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}
            sx={{ textTransform: "none", background: "linear-gradient(135deg, #7C3AED, #9F67FF)" }}>
            {saving ? "Kaydediliyor..." : editingId ? "Güncelle" : "Kaydet"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* TEMPLATE DIALOG */}
      <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          ⚡ Şablon Uygula
          <IconButton size="small" onClick={() => setTemplateDialogOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2, color: isDark ? "rgba(255,255,255,0.6)" : "#6B7280" }}>
            Şablon uygulanacak hasta adını girin, ardından şablon seçin:
          </Typography>
          <Autocomplete
            freeSolo
            options={templatePatients}
            getOptionLabel={(o: any) => typeof o === "string" ? o : `${o.name} (${o.phone || ""})`}
            inputValue={templatePatient}
            onInputChange={(_, val) => {
              setTemplatePatient(val);
              if (val.length >= 2) {
                fetch(`/api/crm-sqlite?search=${encodeURIComponent(val)}&limit=15`).then(r => r.json()).then(d => {
                  setTemplatePatients((d.data || d).map((p: any) => ({ id: p.id, name: p.name, phone: p.phone })));
                });
              }
            }}
            onChange={(_, val: any) => {
              if (val && typeof val === "object") {
                setTemplatePatientId(val.id?.toString() || "");
                setTemplatePatient(val.name);
              }
            }}
            renderInput={(params) => <TextField {...params} label="Hasta Adı (opsiyonel)" size="small" fullWidth sx={{ mb: 2 }} />}
          />
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={1.5}>
            {TEMPLATES.map((tpl, i) => (
              <Paper key={i} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, cursor: "pointer", "&:hover": { bgcolor: isDark ? "rgba(124,58,237,0.1)" : "#F5F3FF" } }}
                onClick={() => applyTemplate(tpl)}>
                <Typography fontWeight={600} fontSize="0.85rem" mb={0.5}>{tpl.label}</Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.5}>
                  {tpl.items.map((item, j) => {
                    const cat = getCategoryInfo(item.category);
                    return (
                      <Chip key={j} size="small"
                        label={`${cat.icon} ${cat.label}: ${item.amount} ${item.currency}`}
                        sx={{ fontSize: "0.7rem", height: 20 }} />
                    );
                  })}
                </Stack>
              </Paper>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialogOpen(false)} sx={{ textTransform: "none" }}>Kapat</Button>
        </DialogActions>
      </Dialog>

      {/* EXPORT DIALOG */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          📤 Dışa Aktar
          <IconButton size="small" onClick={() => setExportDialogOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2, color: isDark ? "rgba(255,255,255,0.6)" : "#6B7280" }}>
            Filtreleme yapıp istediğiniz veriyi Excel veya PDF olarak dışa aktarın:
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Başlangıç Tarihi" type="date" fullWidth size="small"
                value={exportFilters.dateFrom}
                onChange={e => setExportFilters(f => ({ ...f, dateFrom: e.target.value }))}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Bitiş Tarihi" type="date" fullWidth size="small"
                value={exportFilters.dateTo}
                onChange={e => setExportFilters(f => ({ ...f, dateTo: e.target.value }))}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Müşteri / Hasta Adı" fullWidth size="small"
                placeholder="Tümü"
                value={exportFilters.patientName}
                onChange={e => setExportFilters(f => ({ ...f, patientName: e.target.value }))} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select label="Tür" fullWidth size="small"
                value={exportFilters.type}
                onChange={e => setExportFilters(f => ({ ...f, type: e.target.value }))}>
                <MenuItem value="">Tümü</MenuItem>
                {COST_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Box sx={{ p: 1.5, bgcolor: isDark ? "rgba(124,58,237,0.08)" : "#F5F3FF", borderRadius: 1.5 }}>
                <Typography variant="caption" sx={{ color: isDark ? "rgba(255,255,255,0.6)" : "#6B7280" }}>
                  Seçili filtreyle{" "}
                  <strong>{getExportFiltered().length}</strong> kayıt aktarılacak.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setExportDialogOpen(false)} sx={{ textTransform: "none" }}>İptal</Button>
          <Button variant="outlined" startIcon={<SaveAltIcon />} onClick={handleExportCSV}
            sx={{ textTransform: "none", fontWeight: 600 }}>
            Excel (CSV)
          </Button>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={handleExportPDF}
            sx={{ textTransform: "none", fontWeight: 600, background: "linear-gradient(135deg, #7C3AED, #9F67FF)" }}>
            PDF (Yazdır)
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE CONFIRM */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Kaydı Sil</DialogTitle>
        <DialogContent>
          <Typography>Bu maliyet kaydını silmek istediğinizden emin misiniz?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)} sx={{ textTransform: "none" }}>İptal</Button>
          <Button variant="contained" color="error" onClick={() => handleDelete(deleteConfirm!)} sx={{ textTransform: "none" }}>Sil</Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR */}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
