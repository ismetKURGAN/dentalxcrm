"use client";

import React, { useEffect, useMemo, useState } from "react";
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

const OFFER_KEYWORDS = ["Teklif"];
const SALE_KEYWORDS = ["Satış"];
const CANCEL_KEYWORDS = ["Satış İptal", "Randevu İptal", "İptal"];

function formatPercent(n: number): string {
  return n.toFixed(1);
}

const TOP_PARENT_CATEGORIES = [
  "Website",
  "Landing Page",
  "Şirket Hattı",
  "Meta",
  "TikTok",
  "Referans",
  "Acente",
  "Kurum İçi",
  "WhatClinic",
  "Ek Satış",
  "Influencer",
  "Konsültasyon",
  "Snapchat",
];

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
};

function groupStatusFromValue(statusValue: any, customer?: Customer): StatusGroup {
  // Önce iptal kontrolü
  const raw =
    typeof statusValue === "string"
      ? statusValue
      : statusValue?.status || "";
  if (!raw) return "other";
  const s = raw.toLowerCase();
  if (CANCEL_KEYWORDS.some((k) => s.includes(k.toLowerCase()))) return "cancel";
  
  // Satış kontrolü
  if (SALE_KEYWORDS.some((k) => s.includes(k.toLowerCase()))) return "sale";
  
  // Teklif kontrolü: Hizmetler sekmesinde herhangi bir seçim varsa teklif sayılır
  if (customer) {
    const services = typeof customer.status === "object" 
      ? customer.status?.services 
      : customer.service;
    if (services && services.trim() && services !== "Hizmetler") {
      return "offer";
    }
  }
  
  // Eski yöntem: durum içinde "Teklif" kelimesi varsa
  if (OFFER_KEYWORDS.some((k) => s.includes(k.toLowerCase()))) return "offer";
  
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
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
      const [crmRes, usersRes, campaignsRes] = await Promise.all([
        fetch("/api/crm", { cache: "no-store" }),
        fetch("/api/users", { cache: "no-store" }),
        fetch("/api/campaigns", { cache: "no-store" }),
      ]);

      if (crmRes.ok) {
        const data = await crmRes.json();
        setCustomers(data || []);
      }
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(Array.isArray(data) ? data : []);
      }
      if (campaignsRes.ok) {
        const data = await campaignsRes.json();
        setCampaigns(Array.isArray(data) ? data : []);
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

  const resolveParentCategory = (c: Customer): string => {
    const raw = (c.parentCategory || "").toString().trim();
    const match = TOP_PARENT_CATEGORIES.find(
      (p) => p.toLowerCase() === raw.toLowerCase()
    );
    return match || "Diğer";
  };

  const parentCategories = useMemo(
    () => [...TOP_PARENT_CATEGORIES],
    []
  );

  const categories = useMemo(() => {
    const list = customers
      .filter((c) =>
        parentFilter ? resolveParentCategory(c) === parentFilter : true
      )
      .map((c) => c.category || "Diğer");
    return Array.from(new Set(list)).sort();
  }, [customers, parentFilter]);

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
  }, [filtered, users]);

  const byCategory: AggRow[] = useMemo(() => {
    const map: Record<string, AggRow> = {};
    
    // Önce kampanyalardan tüm kategorileri al ve başlangıç değerleri oluştur
    campaigns.forEach((campaign) => {
      const cat = campaign.name || campaign.title;
      if (!cat) return;
      
      const parent = campaign.topParent || campaign.parent || resolveParentCategory({ category: cat } as Customer);
      const key = `${parent}:::${cat}`;
      
      if (!map[key]) {
        map[key] = {
          key,
          parentCategory: parent,
          category: cat,
          total: 0,
          offer: 0,
          sale: 0,
          cancel: 0,
        };
      }
    });
    
    // Müşterileri say
    filtered.forEach((c) => {
      const cat = c.category || "Diğer";
      const parent = resolveParentCategory(c);
      const key = `${parent}:::${cat}`;
      
      if (!map[key]) {
        map[key] = {
          key,
          parentCategory: parent,
          category: cat,
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
    
    // Kampanya sırasına göre sırala
    const categoryOrder = campaigns.map(c => c.name || c.title);
    return Object.values(map).sort((a, b) => {
      const indexA = categoryOrder.indexOf(a.category);
      const indexB = categoryOrder.indexOf(b.category);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [filtered, campaigns]);

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
    <Box sx={{ width: "100%", height: "100%", p: 3, bgcolor: "#f8f9fa" }}>
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
            variant="text"
            size="small"
            sx={{ textTransform: "none" }}
          >
            Filtrele
          </Button>
          <Button
            variant="contained"
            size="small"
            sx={{ textTransform: "none" }}
          >
            Yenile
          </Button>
        </Stack>
      </Stack>

      {/* Filtreler - gizli */}
      <Paper
        sx={{
          mb: 2.5,
          p: 2,
          borderRadius: 2,
          display: "none",
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

      {/* Özet kutuları */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        mb={3}
      >
        <Card sx={{ flex: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                  Toplam Başvuru
                </Typography>
                <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
                  {totals.total.toLocaleString()}
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                  <Typography variant="caption" sx={{ color: "#22c55e", fontSize: "0.7rem" }}>
                    Yükselen lead sayısı
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                  %4.3 önceki aya göre
                </Typography>
              </Box>
              <Box sx={{ bgcolor: "#f0f9ff", p: 1, borderRadius: 1 }}>
                <TrendingUpIcon sx={{ color: "#3b82f6" }} />
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                  Toplam Teklif
                </Typography>
                <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
                  {totals.offer.toLocaleString()}
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                  <Typography variant="caption" sx={{ color: "#ef4444", fontSize: "0.7rem" }}>
                    Düşen teklif sayısı
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                  %-3.2 önceki aya göre
                </Typography>
              </Box>
              <Box sx={{ bgcolor: "#fef2f2", p: 1, borderRadius: 1 }}>
                <TrendingDownIcon sx={{ color: "#ef4444" }} />
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                  Toplam Satış
                </Typography>
                <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
                  {totals.sale.toLocaleString()}
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                  <Typography variant="caption" sx={{ color: "#22c55e", fontSize: "0.7rem" }}>
                    Yükselen satış sayısı
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                  %13.4 kapanışa oran
                </Typography>
              </Box>
              <Box sx={{ bgcolor: "#f0fdf4", p: 1, borderRadius: 1 }}>
                <TrendingUpIcon sx={{ color: "#22c55e" }} />
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                  İptal Edilen
                </Typography>
                <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
                  {totals.cancel.toLocaleString()}
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                  <Typography variant="caption" sx={{ color: "#ef4444", fontSize: "0.7rem" }}>
                    İptal edilen lead sayısı
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                  %1.1 iptal oranı
                </Typography>
              </Box>
              <Box sx={{ bgcolor: "#fef2f2", p: 1, borderRadius: 1 }}>
                <TrendingDownIcon sx={{ color: "#ef4444" }} />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      {/* Kaynak Türü Bazında Detaylı İstatistikler */}
      <Paper sx={{ p: 2.5, borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
          Kaynak Türü Bazında Detaylı İstatistikler
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
          Her kaynak türü için iletişim, teklif, satış ve iptal istatistikleri
        </Typography>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8f9fa" }}>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Kaynak Türü</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: "0.75rem" }}>İletişimler / Tüm</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Teklifler / Tüm</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Satışlar / Tüm</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: "0.75rem" }}>İptal Edilen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {TOP_PARENT_CATEGORIES.map((parent) => {
                const parentData = byParent.find(r => r.parentCategory === parent) || {
                  total: 0,
                  offer: 0,
                  sale: 0,
                  cancel: 0
                };
                const isExpanded = expandedCategories.has(parent);
                const childCategories = byCategory.filter(c => c.parentCategory === parent);
                const offerPct = parentData.total ? formatPercent((parentData.offer / parentData.total) * 100) : "0.0";
                const salePct = parentData.total ? formatPercent((parentData.sale / parentData.total) * 100) : "0.0";
                const cancelPct = parentData.total ? formatPercent((parentData.cancel / parentData.total) * 100) : "0.0";

                return (
                  <React.Fragment key={parent}>
                    <TableRow hover sx={{ bgcolor: isExpanded ? "#f8f9fa" : "transparent" }}>
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
                        <Typography variant="caption" color="text.secondary">%100</Typography>
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

                    {isExpanded && childCategories.map((cat) => {
                      const catOfferPct = cat.total ? formatPercent((cat.offer / cat.total) * 100) : "0.0";
                      const catSalePct = cat.total ? formatPercent((cat.sale / cat.total) * 100) : "0.0";
                      const catCancelPct = cat.total ? formatPercent((cat.cancel / cat.total) * 100) : "0.0";

                      return (
                        <TableRow key={cat.key} sx={{ bgcolor: "#fafbfc" }}>
                          <TableCell sx={{ pl: 8 }}>
                            <Typography variant="body2" color="text.secondary">
                              {cat.category}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">{cat.total}</Typography>
                            <Typography variant="caption" color="text.secondary">%100</Typography>
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
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
