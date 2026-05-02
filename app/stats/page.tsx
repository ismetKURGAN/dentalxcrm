"use client";

import React, { useEffect, useMemo, useState, useContext } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  Chip,
  TextField,
  MenuItem,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
  Card,
  CardContent,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { useI18n } from "../components/I18nProvider";
import { ThemeModeContext } from "../components/ThemeRegistry";

const SALE_KEYWORDS = ["Satış"];
const CANCEL_KEYWORDS = ["Randevu İptal", "Satış İptal", "Satış İptali", "İptal"];

// Türkçe İ/i uyumlu lowercase
function trLower(s: string): string {
  return s.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
}

function formatPercent(n: number): string {
  return n.toFixed(1);
}

const TOP_PARENT_CATEGORIES = [
  "Landing Page",
  "Şirket Hattı",
  "Meta",
  "TikTok",
  "Acente",
  "Kurum İçi",
  "WhatClinic",
  "Ek Satış",
  "Influencer",
  "Konsültasyon",
  "Snapchat",
  "Boş",
  "Eski Data",
];

type Category = {
  id: string;
  name: string;
  topParent: string;
  parentId: string | null;
  leadFormId?: string;
  firstContact?: boolean;
  global?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type StatusGroup = "offer" | "sale" | "cancel" | "other";

type Customer = {
  id: number | string;
  createdAt?: string;
  parentCategory?: string;
  category?: string;
  advisor?: string;
  status?: any;
  service?: string;
};

type User = {
  id: number | string;
  name: string;
  roles?: string[];
};

type AggRow = {
  key: string;
  parentCategory?: string;
  category?: string;
  advisor?: string;
  total: number;
  offer: number;
  sale: number;
  cancel: number;
  categoryId?: string;
  level?: number;
  parentCategoryId?: string | null;
};

function groupStatusFromValue(statusValue: any, customer?: Customer): StatusGroup {
  const raw = (typeof statusValue === "string" ? statusValue : statusValue?.status || "").toString();
  const s = trLower(raw);
  
  // Önce iptal kontrolü ("Randevu İptal", "Satış İptal" vs.)
  if (CANCEL_KEYWORDS.some((k) => s.includes(trLower(k)))) return "cancel";
  // Potansiyel Satış → teklif (satış sayılmaz)
  if (s.includes("potansiyel satis") || s.includes("potansiyel satış")) return "offer";
  // Satış kontrolü
  if (SALE_KEYWORDS.some((k) => s.includes(trLower(k)))) return "sale";
  // Teklif kontrolü: sadece hizmet seçiliyse teklif say
  const service = (customer?.service || "").toString().trim();
  if (service) return "offer";
  
  return "other";
}

function toDateOnly(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export default function StatsPage() {
  const { t } = useI18n();
  const { mode } = useContext(ThemeModeContext);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [categoriesData, setCategoriesData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [parentFilter, setParentFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [advisorFilter, setAdvisorFilter] = useState<string>("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [crmRes, usersRes, categoriesRes] = await Promise.all([
        fetch("/api/crm-sqlite?all=true", { cache: "no-store" }),
        fetch("/api/users", { cache: "no-store" }),
        fetch("/api/categories", { cache: "no-store" }),
      ]);

      if (crmRes.ok) {
        const response = await crmRes.json();
        const data = Array.isArray(response) ? response : (response.data || response);
        setCustomers(Array.isArray(data) ? data : []);
      }
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(Array.isArray(data) ? data : []);
      }
      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategoriesData(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("İstatistikler yüklenemedi", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resolveAdvisorName = (c: Customer): string => {
    const raw =
      (c.advisor || (c as any).status?.consultant || "").toString().trim();
    if (!raw) return "Diğer";

    const match = users.find(
      (u) => u.name && u.name.toLowerCase() === raw.toLowerCase()
    );
    return match?.name || raw || "Diğer";
  };

  // category adından topParent bulmak için map
  const categoryToParentMap = useMemo(() => {
    const map: Record<string, string> = {};
    categoriesData.forEach((cat) => {
      if (cat.name && cat.topParent) {
        map[cat.name] = cat.topParent;
      }
    });
    return map;
  }, [categoriesData]);

  const resolveParentCategory = (c: Customer): string => {
    // 1) Önce parentCategory alanına bak
    const raw = (c.parentCategory || "").toString().trim();
    if (raw) {
      const match = TOP_PARENT_CATEGORIES.find(
        (p) => trLower(p) === trLower(raw)
      );
      if (match) return match;
    }
    
    // 2) parentCategory yoksa, category adından categories.json ile topParent bul
    const catName = (c.category || "").toString().trim();
    if (catName && categoryToParentMap[catName]) {
      const topParent = categoryToParentMap[catName];
      const match = TOP_PARENT_CATEGORIES.find(
        (p) => trLower(p) === trLower(topParent)
      );
      if (match) return match;
    }
    
    // 3) Hiç kategori yoksa "Boş"
    if (!raw && !catName) return "Boş";
    
    return "Diğer";
  };

  const parentCategories = useMemo(
    () => [...TOP_PARENT_CATEGORIES],
    []
  );

  const categories = useMemo(() => {
    // Kategorileri hiyerarşik olarak al
    const filtered = categoriesData.filter(cat => 
      parentFilter ? cat.topParent === parentFilter : true
    );
    
    // Kategori isimlerini döndür
    return filtered.map(cat => cat.name).sort();
  }, [categoriesData, parentFilter]);

  const advisors = useMemo(() => {
    // Danışman filtre seçenekleri: sadece sistemde kayıtlı kullanıcı adları
    const names = users
      .map((u) => u.name)
      .filter((x): x is string => !!x && typeof x === "string");
    return Array.from(new Set(names)).sort();
  }, [users]);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const date = toDateOnly(c.createdAt);
      if (dateFrom && date && date < dateFrom) return false;
      if (dateTo && date && date > dateTo) return false;

      const parent = resolveParentCategory(c);
      if (parentFilter && parent !== parentFilter) return false;

      const cat = c.category || "Diğer";
      if (categoryFilter && cat !== categoryFilter) return false;

      const resolvedAdvisor = resolveAdvisorName(c);
      if (advisorFilter && resolvedAdvisor !== advisorFilter) return false;

      return true;
    });
  }, [customers, dateFrom, dateTo, parentFilter, categoryFilter, advisorFilter]);

  const totals = useMemo(() => {
    let total = 0;
    let offer = 0;
    let sale = 0;
    let cancel = 0;

    filtered.forEach((c) => {
      total += 1;
      const g = groupStatusFromValue(c.status, c);
      if (g === "offer") offer += 1;
      if (g === "sale") sale += 1;
      if (g === "cancel") cancel += 1;
    });

    return { total, offer, sale, cancel };
  }, [filtered]);

  const byParent: AggRow[] = useMemo(() => {
    const map: Record<string, AggRow> = {};
    filtered.forEach((c) => {
      const parent = resolveParentCategory(c);
      if (!map[parent]) {
        map[parent] = {
          key: parent,
          parentCategory: parent,
          total: 0,
          offer: 0,
          sale: 0,
          cancel: 0,
        };
      }
      const g = groupStatusFromValue(c.status, c);
      map[parent].total += 1;
      if (g === "offer") map[parent].offer += 1;
      if (g === "sale") map[parent].sale += 1;
      if (g === "cancel") map[parent].cancel += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filtered]);

  // Helper to get category level
  const getCategoryLevel = (catId: string, allCats: Category[]): number => {
    const cat = allCats.find(c => c.id === catId);
    if (!cat || !cat.parentId) return 0;
    return 1 + getCategoryLevel(cat.parentId, allCats);
  };

  // Helper to get full category path for sorting
  const getCategoryPath = (catId: string, allCats: Category[]): string => {
    const cat = allCats.find(c => c.id === catId);
    if (!cat) return '';
    if (!cat.parentId) return cat.name;
    return getCategoryPath(cat.parentId, allCats) + ' > ' + cat.name;
  };

  const byCategory: AggRow[] = useMemo(() => {
    const catById: Record<string, Category> = {};
    categoriesData.forEach(c => { catById[c.id] = c; });

    const map: Record<string, AggRow> = {};

    const ensureRow = (cat: Category) => {
      if (map[cat.id]) return;
      map[cat.id] = {
        key: cat.id,
        parentCategory: cat.topParent,
        category: cat.name,
        categoryId: cat.id,
        parentCategoryId: cat.parentId,
        level: getCategoryLevel(cat.id, categoriesData),
        total: 0,
        offer: 0,
        sale: 0,
        cancel: 0,
      };
    };

    // Tüm kategoriler için başlangıç satırı oluştur
    categoriesData.forEach(ensureRow);

    // Müşterileri say — leaf'e ve tüm üst parent'lara bubble up
    filtered.forEach((c) => {
      const catName = c.category || "";
      if (!catName) return;

      const topParent = resolveParentCategory(c);
      const matchingCat =
        categoriesData.find(cat => cat.name === catName && cat.topParent === topParent) ||
        categoriesData.find(cat => cat.name === catName);

      if (!matchingCat) return;

      const g = groupStatusFromValue(c.status, c);

      // Leaf'ten başlayarak tüm üst parent'lara sayıyı ekle
      let current: Category | undefined = matchingCat;
      while (current) {
        ensureRow(current);
        map[current.id].total += 1;
        if (g === "offer") map[current.id].offer += 1;
        if (g === "sale") map[current.id].sale += 1;
        if (g === "cancel") map[current.id].cancel += 1;
        current = current.parentId ? catById[current.parentId] : undefined;
      }
    });

    // Hiyerarşik sıraya göre sırala
    return Object.values(map).sort((a, b) => {
      if (a.parentCategory !== b.parentCategory) {
        return (a.parentCategory || '').localeCompare(b.parentCategory || '');
      }
      const pathA = a.categoryId ? getCategoryPath(a.categoryId, categoriesData) : a.category || '';
      const pathB = b.categoryId ? getCategoryPath(b.categoryId, categoriesData) : b.category || '';
      return pathA.localeCompare(pathB);
    });
  }, [filtered, categoriesData]);

  const byAdvisor: AggRow[] = useMemo(() => {
    const map: Record<string, AggRow> = {};
    filtered.forEach((c) => {
      const advName = resolveAdvisorName(c) || "Diğer";
      const isKnownUser = users.some(
        (u) => u.name && u.name.toLowerCase() === advName.toLowerCase()
      );
      const key = isKnownUser ? advName : "Diğer";
      if (!map[key]) {
        map[key] = {
          key,
          advisor: key,
          total: 0,
          offer: 0,
          sale: 0,
          cancel: 0,
        };
      }
      const g = groupStatusFromValue(c.status, c);
      map[key].total += 1;
      if (g === "offer") map[key].offer += 1;
      if (g === "sale") map[key].sale += 1;
      if (g === "cancel") map[key].cancel += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filtered]);

  const maxParentTotal = byParent.reduce((m, r) => Math.max(m, r.total), 0) || 1;

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(new Set());

  const toggleCategory = (parent: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(parent)) {
        newSet.delete(parent);
      } else {
        newSet.add(parent);
      }
      return newSet;
    });
  };

  const toggleCategoryById = (categoryId: string) => {
    setExpandedCategoryIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const exportCsv = () => {
    const header =
      "Tip,Anahtar,Üst Kategori,Kategori,Danışman,Toplam,Teklif,Satış,İptal\n";
    const rows: string[] = [];

    byParent.forEach((r) => {
      rows.push(
        `parent,"${r.parentCategory}","${r.parentCategory}",,,${r.total},${r.offer},${r.sale},${r.cancel}`
      );
    });
    byCategory.forEach((r) => {
      rows.push(
        `category,"${r.category}","${r.parentCategory}","${r.category}",,${r.total},${r.offer},${r.sale},${r.cancel}`
      );
    });
    byAdvisor.forEach((r) => {
      rows.push(
        `advisor,"${r.advisor}",,,"${r.advisor}",${r.total},${r.offer},${r.sale},${r.cancel}`
      );
    });

    const blob = new Blob([header + rows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "istatistikler.csv";
    a.click();
  };

  return (
    <Box sx={{ width: "100%", height: "100%", p: { xs: 1.5, md: 2 }, bgcolor: mode === "dark" ? "#1E1B3E" : "#F3F4F6" }}>
      {/* Başlık ve aksiyonlar */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={2.5}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            İstatistikler
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Kaynak türlerine göre detaylı istatistik raporu
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="text"
            size="small"
            sx={{ textTransform: "none" }}
          >
            Genel Bakış
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownloadIcon />}
            onClick={exportCsv}
            sx={{ textTransform: "none" }}
          >
            Excel'e Aktar
          </Button>
          <Button
            variant={showFilters ? "contained" : "outlined"}
            size="small"
            sx={{ textTransform: "none" }}
            onClick={() => setShowFilters((v) => !v)}
          >
            Filtrele
          </Button>
          <Button
            variant="contained"
            size="small"
            sx={{ textTransform: "none" }}
            onClick={fetchData}
          >
            Yenile
          </Button>
        </Stack>
      </Stack>

      {/* Özet İstatistikler */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={2.5}>
        {[
          { label: 'Toplam Lead', value: filtered.length, pct: '100', color: '#6366f1', iconBg: mode === 'dark' ? 'rgba(99,102,241,0.15)' : '#e3f2fd' },
          { label: 'Teklif', value: totals.offer, pct: filtered.length ? formatPercent((totals.offer / filtered.length) * 100) : '0.0', color: '#f59e0b', iconBg: mode === 'dark' ? 'rgba(245,158,11,0.15)' : '#fff3e0' },
          { label: 'Satış', value: totals.sale, pct: filtered.length ? formatPercent((totals.sale / filtered.length) * 100) : '0.0', color: '#10b981', iconBg: mode === 'dark' ? 'rgba(16,185,129,0.15)' : '#e8f5e9' },
          { label: 'İptal', value: totals.cancel, pct: filtered.length ? formatPercent((totals.cancel / filtered.length) * 100) : '0.0', color: '#ef4444', iconBg: mode === 'dark' ? 'rgba(239,68,68,0.15)' : '#ffebee' },
          { label: 'Dönüşüm', value: null, pct: totals.offer ? formatPercent((totals.sale / totals.offer) * 100) : '0.0', color: '#8b5cf6', iconBg: mode === 'dark' ? 'rgba(139,92,246,0.15)' : '#f3e5f5' },
        ].map((stat) => (
          <Card key={stat.label} sx={{ flex: 1 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    {stat.label}
                  </Typography>
                  <Typography variant="h4" fontWeight={700} mt={0.5} sx={{ color: stat.color }}>
                    {stat.value !== null ? stat.value.toLocaleString() : `%${stat.pct}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" mt={0.5}>
                    {stat.value !== null ? `%${stat.pct}` : 'Teklif → Satış'}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: stat.iconBg, p: 1, borderRadius: 1 }}>
                  <TrendingUpIcon sx={{ color: stat.color }} />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Filtreler - gizli */}
      <Paper
        sx={{
          mb: 2.5,
          p: 2,
          borderRadius: 2,
          display: showFilters ? "block" : "none",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <TextField
              label="Başlangıç Tarihi"
              type="date"
              size="small"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 170 }}
            />
            <TextField
              label="Bitiş Tarihi"
              type="date"
              size="small"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 170 }}
            />
          </Stack>

          <Divider flexItem orientation="vertical" sx={{ display: { xs: "none", md: "block" } }} />

          <Stack direction="row" spacing={2} flexWrap="wrap" flex={1}>
            <TextField
              select
              size="small"
              label={t("stats.filters.parent")}
              value={parentFilter}
              onChange={(e) => {
                setParentFilter(e.target.value);
                setCategoryFilter("");
              }}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">{t("stats.filters.all")}</MenuItem>
              {parentCategories.map((p) => (
                <MenuItem key={p} value={p}>
                  {p}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label={t("stats.filters.category")}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              sx={{ minWidth: 220 }}
              disabled={!categories.length}
            >
              <MenuItem value="">Tümü</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label={t("stats.filters.advisor")}
              value={advisorFilter}
              onChange={(e) => setAdvisorFilter(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Tümü</MenuItem>
              {advisors.map((a) => (
                <MenuItem key={a} value={a}>
                  {a}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Stack>
      </Paper>

      {/* Duplicate özet kartları kaldırıldı */}

      {/* Kaynak Türü Bazında Detaylı İstatistikler */}
      <Paper sx={{ p: 2.5, borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
          Kaynak Türü Bazında Detaylı İstatistikler
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
          Her kaynak türü için iletişim, teklif, satış ve iptal istatistikleri
        </Typography>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: mode === "dark" ? "#2D2757" : "#f8f9fa" }}>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", color: mode === "dark" ? "rgba(255,255,255,0.9)" : undefined }}>Kaynak Türü</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: "0.75rem", color: mode === "dark" ? "rgba(255,255,255,0.9)" : undefined }}>İletişimler / Tüm</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: "0.75rem", color: mode === "dark" ? "rgba(255,255,255,0.9)" : undefined }}>Teklifler / Tüm</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: "0.75rem", color: mode === "dark" ? "rgba(255,255,255,0.9)" : undefined }}>Satışlar / Tüm</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: "0.75rem", color: mode === "dark" ? "rgba(255,255,255,0.9)" : undefined }}>İptal Edilen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(() => {
                // byParent'taki tüm satırları göster — TOP_PARENT_CATEGORIES sırasıyla + geri kalanlar
                const knownParents = TOP_PARENT_CATEGORIES;
                const extraParents = byParent
                  .map(r => r.parentCategory)
                  .filter((p): p is string => !!p && !knownParents.includes(p));
                const allParents = [...knownParents, ...extraParents];
                return allParents.map((parent) => {
                const isExpanded = expandedCategories.has(parent);
                const childCategories = byCategory.filter(c => c.parentCategory === parent);
                // Üst satır sayısı byParent'tan gelir (tüm müşterileri kapsar)
                const parentData = byParent.find(r => r.parentCategory === parent) || {
                  total: 0, offer: 0, sale: 0, cancel: 0
                };
                const grandTotal = filtered.length || 1;
                const totalPct = formatPercent((parentData.total / grandTotal) * 100);
                const offerPct = parentData.total ? formatPercent((parentData.offer / parentData.total) * 100) : "0.0";
                const salePct = parentData.offer ? formatPercent((parentData.sale / parentData.offer) * 100) : "0.0";
                const cancelPct = parentData.total ? formatPercent((parentData.cancel / parentData.total) * 100) : "0.0";

                return (
                  <React.Fragment key={parent}>
                    <TableRow hover sx={{ bgcolor: isExpanded ? (mode === "dark" ? "#2A2450" : "#f8f9fa") : "transparent" }}>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <IconButton
                            size="small"
                            onClick={() => toggleCategory(parent)}
                            disabled={childCategories.length === 0}
                          >
                            {isExpanded ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
                          </IconButton>
                          <Typography variant="body2" fontWeight={600}>
                            {parent}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={600}>{parentData.total}</Typography>
                        <Typography variant="caption" color="text.secondary">%{totalPct}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={600}>{parentData.offer}</Typography>
                        <Typography variant="caption" color="text.secondary">%{offerPct}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={600}>{parentData.sale}</Typography>
                        <Typography variant="caption" color="text.secondary">%{salePct}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={600}>{parentData.cancel}</Typography>
                        <Typography variant="caption" color="text.secondary">%{cancelPct}</Typography>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (() => {
                      // Render hierarchical categories
                      const renderCategory = (cat: AggRow, depth: number = 0): React.ReactNode[] => {
                        const catTotalPct = formatPercent((cat.total / grandTotal) * 100);
                        const catOfferPct = cat.total ? formatPercent((cat.offer / cat.total) * 100) : "0.0";
                        const catSalePct = cat.offer ? formatPercent((cat.sale / cat.offer) * 100) : "0.0";
                        const catCancelPct = cat.total ? formatPercent((cat.cancel / cat.total) * 100) : "0.0";
                        
                        const children = cat.categoryId 
                          ? childCategories.filter(c => c.parentCategoryId === cat.categoryId)
                          : [];
                        const hasChildren = children.length > 0;
                        const isCatExpanded = cat.categoryId ? expandedCategoryIds.has(cat.categoryId) : false;
                        const paddingLeft = 4 + (depth * 3);

                        const rows: React.ReactNode[] = [
                          <TableRow key={cat.key} sx={{ bgcolor: depth === 0 ? (mode === "dark" ? "#2D2757" : "#fafbfc") : (mode === "dark" ? "#322C5E" : "#f5f5f5") }}>
                            <TableCell sx={{ pl: paddingLeft }}>
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                {hasChildren && (
                                  <IconButton
                                    size="small"
                                    onClick={() => cat.categoryId && toggleCategoryById(cat.categoryId)}
                                    sx={{ p: 0.25 }}
                                  >
                                    {isCatExpanded ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
                                  </IconButton>
                                )}
                                {!hasChildren && <Box sx={{ width: 24 }} />}
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: depth === 0 ? 500 : 400 }}>
                                  {cat.category}
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2">{cat.total}</Typography>
                              <Typography variant="caption" color="text.secondary">%{catTotalPct}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2">{cat.offer}</Typography>
                              <Typography variant="caption" color="text.secondary">%{catOfferPct}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2">{cat.sale}</Typography>
                              <Typography variant="caption" color="text.secondary">%{catSalePct}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2">{cat.cancel}</Typography>
                              <Typography variant="caption" color="text.secondary">%{catCancelPct}</Typography>
                            </TableCell>
                          </TableRow>
                        ];

                        // Recursively render children if expanded
                        if (isCatExpanded && hasChildren) {
                          children.forEach(child => {
                            rows.push(...renderCategory(child, depth + 1));
                          });
                        }

                        return rows;
                      };

                      // Only render top-level categories (those without parentCategoryId)
                      const topLevelCategories = childCategories.filter(c => !c.parentCategoryId);
                      return topLevelCategories.flatMap(cat => renderCategory(cat, 0));
                    })()}
                  </React.Fragment>
                );
              });
              })()}
              {/* Toplam Satırı */}
              <TableRow sx={{ bgcolor: mode === "dark" ? "#2D2757" : "#f0f0f0" }}>
                <TableCell>
                  <Typography variant="body2" fontWeight={700} sx={{ pl: 4.5 }}>
                    TOPLAM
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2" fontWeight={700}>{totals.total}</Typography>
                  <Typography variant="caption" color="text.secondary">%100</Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2" fontWeight={700}>{totals.offer}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    %{totals.total ? formatPercent((totals.offer / totals.total) * 100) : "0.0"}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2" fontWeight={700} sx={{ color: "#10b981" }}>{totals.sale}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    %{totals.offer ? formatPercent((totals.sale / totals.offer) * 100) : "0.0"}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2" fontWeight={700} sx={{ color: "#ef4444" }}>{totals.cancel}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    %{totals.total ? formatPercent((totals.cancel / totals.total) * 100) : "0.0"}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
