"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";

import {
  Box,
  Button,
  Typography,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputLabel,
  Paper,
  Tooltip,
  FormControl,
  Select,
  MenuItem,
  Snackbar,
  Alert
} from "@mui/material";

import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
} from "@mui/x-data-grid";

// ICONS
import AddIcon from "@mui/icons-material/Add";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import CategoryIcon from "@mui/icons-material/Category";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { useI18n } from "../components/I18nProvider";
import { useAuth } from "../components/AuthProvider";

// =================== TAM LİSTELER ===================

const CRM_CATEGORIES = [
  "Facebook Lead Form", "Instagram DM", "WhatsApp Web", "Website Form", 
  "Landing Page Form", "Google Ads Form", 
  "Segment - İngiltere - Filtreli - 13", "Segment - Türkiye - VIP", "Segment - Almanya - Genel"
];

const CRM_SERVICES = [
  "Randevu",
  "Diğer",
  "Tüp Bebek IVF",
  "Onkoloji",
  "Beyin ve Sinir Cerrahisi (Nöroşirürji)",
  "Göğüs (Akciğer) Hastalıkları",
  "Göz Hastalıkları",
  "Ortopedi",
  "Obezite Cerrahisi",
  "Saç Ekimi",
  "Estetik Plastik ve Rekonstrüktif Cerrahi",
  "Check-Up",
  "Dental Simple Treatments",
  "Dental Veneers",
  "Dental Crowns",
  "Dental Implants&Crowns",
  "Dental All on 6",
  "Dental All on 5",
  "Dental All on 4",
  "Dental Smile Makeover"
];

const CRM_STATUSES = [
  "Randevu Onaylı",
  "Konsültasyon Ghost",
  "Randevuya Gelmedi",
  "Randevu İptal",
  "Konsültasyon Olumlu 2",
  "Sorunlu Hasta",
  "Potansiyel Satış ( Konsültasyon )",
  "Konsültasyon Olumlu 1",
  "Randevu",
  "Eski Data Özel",
  "Teklif Yollandı ( Özel )",
  "Fotoğraf Bekleniyor (Özel)",
  "Fotoğraf Bekleniyor 3",
  "Fotoğraf Bekleniyor 2",
  "Fiyat Olumsuz",
  "Ghost",
  "Teklif Yollandı 4",
  "Teklif Yollandı 3",
  "Teklif Yollandı 2",
  "Ön Bilgi 3",
  "Ön Bilgi 2",
  "Ulaşılamadı",
  "İlgisiz",
  "Cevap Vermedi",
  "Engelli/Spam",
  "Olumsuz",
  "Satış İptali",
  "Satış",
  "Bilet Bekliyor / Bilet Takip",
  "Olumlu",
  "Teklif Yollandı",
  "Teklif Bekliyor",
  "Fotoğraf Bekleniyor",
  "Ön Bilgi",
  "Yeni Form"
];

// Renk Fonksiyonu
const getStatusColor = (status: any) => {
  // Status bir obje ise string'e çevir
  const statusStr = typeof status === 'string' ? status : (status?.status || String(status || ''));
  
  if (statusStr?.includes("Olumlu") || statusStr?.includes("Randevu") || statusStr?.includes("Satış")) return { bg: "#ECFDF3", color: "#16A34A" };
  if (statusStr?.includes("Teklif")) return { bg: "#FFF3E0", color: "#EF6C00" };
  if (statusStr?.includes("Olumsuz") || statusStr?.includes("İptal") || statusStr?.includes("Spam")) return { bg: "#FEF2F2", color: "#DC2626" };
  if (statusStr?.includes("Yeni")) return { bg: "#E3F2FD", color: "#1E88E5" };
  return { bg: "#F5F5F5", color: "#616161" };
};

export default function CustomersPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });
  
  // Gelişmiş Filtre State'leri
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<Array<{
    field: string;
    operator: string;
    value: string;
  }>>([]);
  const [tempFilters, setTempFilters] = useState<Array<{
    field: string;
    operator: string;
    value: string;
  }>>([]);
  const isMountedRef = useRef(false);
  const [advisorOptions, setAdvisorOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  
  // Modal
  const [open, setOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "", phone: "", email: "", advisor: "", status: "Yeni Form", service: "", category: ""
  });

  // --- Verileri Çek ---
  const fetchCustomers = async () => {
    try {
      if (!isMountedRef.current) return;
      setLoading(true);
      const res = await fetch("/api/crm", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map((c: any) => ({
          ...c,
          date: c.date || new Date(c.createdAt).toLocaleDateString('tr-TR')
        }));
        if (!isMountedRef.current) return;
        setRows(formatted);
      }
    } catch (err) {
      console.error("Hata:", err);
    } finally {
      if (!isMountedRef.current) return;
      setLoading(false);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchCustomers();

    // Danışman listesi: users.json üzerinden, roles içinde "Danışman" olan kullanıcı adları
    const fetchAdvisors = async () => {
      try {
        const res = await fetch("/api/users", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const names = (data || [])
          .filter((u: any) => Array.isArray(u.roles) && u.roles.includes("Danışman"))
          .map((u: any) => u.name)
          .filter(Boolean);
        setAdvisorOptions(names);
      } catch (e) {
        console.error("Danışman listesi yüklenemedi", e);
      }
    };

    fetchAdvisors();

    // Kategori listesi: campaigns API'den çek
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/campaigns", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const names = (data || [])
          .map((c: any) => c.name || c.title)
          .filter(Boolean);
        setCategoryOptions(names);
      } catch (e) {
        console.error("Kategori listesi yüklenemedi", e);
      }
    };

    fetchCategories();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // --- Satır İçi Güncelleme (Inline Edit) ---
  const handleInlineUpdate = async (id: number, field: string, value: string) => {
    // 1. Önce arayüzü güncelle (Hızlı tepki için)
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

    // 2. Arka planda API'ye kaydet
    try {
      const res = await fetch("/api/crm", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [field]: value }),
      });

      if (res.ok) {
        setSnackbar({ open: true, message: t("customers.snackbar.updated") });
      } else {
        // Hata olursa geri al (Opsiyonel)
        console.error("Güncelleme başarısız");
      }
    } catch (error) {
      console.error("Bağlantı hatası", error);
    }
  };

  // --- Müşteri Ekle ---
  const handleCreateCustomer = async () => {
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomer),
      });
      
      if (res.ok) {
        await fetchCustomers();
        setOpen(false);
        setNewCustomer({ name: "", phone: "", email: "", advisor: "", status: "Yeni Form", service: "", category: "" });
        setSnackbar({ open: true, message: t("customers.snackbar.created") });
      } else if (res.status === 409) {
        // Mükerrer müşteri hatası
        const data = await res.json();
        const existingName = data.duplicate?.existingName || "Bilinmiyor";
        alert(`Bu müşteri zaten mevcut!\n\nMevcut kayıt: ${existingName}\nE-posta veya telefon numarası ile eşleşen bir müşteri bulundu.`);
      } else {
        alert("Kayıt hatası");
      }
    } catch (error) {
      alert("Kayıt hatası");
    }
  };

  // --- Müşteri Sil ---
  const handleDelete = async (id: number) => {
    if (!confirm(t("customers.confirm.delete"))) return;
    try {
      const res = await fetch(`/api/crm?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setRows((prev) => prev.filter((row) => row.id !== id));
        setSnackbar({ open: true, message: t("customers.snackbar.deleted") });
      }
    } catch (error) {
      alert("Hata oluştu");
    }
  };

  // --- Excel Export ---
  const exportToCSV = () => {
    const data = filteredRows;
    if (!data.length) return;
    const header = "ID,Ad Soyad,Telefon,Danışman,Durum\n";
    const body = data.map(r => `${r.id},"${r.name}","${r.phone}","${r.advisor}","${r.status}"`).join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "musteriler.csv"; a.click();
  };

  // ==================== KOLONLAR ====================
  const columns: GridColDef[] = [
    { field: "id", headerName: t("customers.columns.id"), width: 90 },
    { field: "date", headerName: t("customers.columns.date"), width: 150 },

    {
      field: "advisor", headerName: t("customers.columns.advisor"), width: 150,
      renderCell: (params) => (
        <FormControl fullWidth size="small" variant="standard">
            <Select
                value={params.value || ""}
                onChange={(e) => handleInlineUpdate(params.row.id, "advisor", e.target.value)}
                disableUnderline
                displayEmpty
                sx={{ fontSize: "0.875rem", bgcolor: "white", borderRadius: 1, px: 1 }}
            >
                <MenuItem value="" disabled>Seçiniz</MenuItem>
                {advisorOptions.map((u) => (
                  <MenuItem key={u} value={u}>
                    {u}
                  </MenuItem>
                ))}
            </Select>
        </FormControl>
      ),
    },

    {
      field: "name", headerName: t("customers.columns.name"), flex: 1, minWidth: 200,
      renderCell: (params) => (
        <Typography 
            onClick={() => router.push(`/customers/${params.row.id}`)}
            sx={{ 
                fontWeight: 500, 
                color: '#1f2937', 
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline', color: '#2563eb' }
            }}
        >
            {params.value}
        </Typography>
      ),
    },

    { field: "phone", headerName: t("customers.columns.phone"), width: 140 },

    {
        field: "category", headerName: t("customers.columns.category"), width: 180,
        renderCell: (params) => (
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1, py: 0.5, borderRadius: 2, bgcolor: "#F3F4FF", fontSize: "0.75rem", color: "#6366F1" }}>
            <CategoryIcon sx={{ fontSize: 14 }} />
            {params.value || "Genel"}
          </Box>
        ),
    },

    {
      field: "status", headerName: t("customers.columns.status"), width: 180,
      renderCell: (params) => {
        const style = getStatusColor(params.value || "");
        return (
            <FormControl fullWidth size="small" variant="standard">
                <Select
                    value={params.value || ""}
                    onChange={(e) => handleInlineUpdate(params.row.id, "status", e.target.value)}
                    disableUnderline
                    sx={{ 
                        fontSize: "0.75rem", 
                        fontWeight: 600,
                        bgcolor: style.bg, 
                        color: style.color, 
                        borderRadius: 4, 
                        px: 1.5,
                        textAlign: "center",
                        ".MuiSelect-select": { py: 0.5 }
                    }}
                >
                    {CRM_STATUSES.map(st => <MenuItem key={st} value={st}>{st}</MenuItem>)}
                </Select>
            </FormControl>
        );
      },
    },

    {
      field: "service", headerName: t("customers.columns.service"), width: 160,
      renderCell: (params) => (
        <FormControl fullWidth size="small" variant="standard">
            <Select
                value={params.value || ""}
                onChange={(e) => handleInlineUpdate(params.row.id, "service", e.target.value)}
                disableUnderline
                displayEmpty
                sx={{ 
                    fontSize: "0.8rem", 
                    bgcolor: "#EEF2FF", 
                    color: "#4F46E5", 
                    borderRadius: 1, 
                    px: 1,
                    ".MuiSelect-select": { py: 0.5 } 
                }}
            >
                <MenuItem value="" disabled>Seçiniz</MenuItem>
                {CRM_SERVICES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
        </FormControl>
      ),
    },

    // --- AKSİYONLAR ---
    {
      field: "actions", headerName: "", width: 100, sortable: false, filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={1}>
            <Tooltip title={t("customers.actions.detail")}>
                <IconButton 
                    size="small" 
                    sx={{ bgcolor: '#22c55e', color: 'white', '&:hover': { bgcolor: '#16a34a'} }}
                    onClick={() => router.push(`/customers/${params.row.id}`)}
                >
                    <EditIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title={t("customers.actions.delete")}>
                <IconButton 
                    size="small" 
                    sx={{ bgcolor: '#ef4444', color: 'white', '&:hover': { bgcolor: '#dc2626'} }}
                    onClick={() => handleDelete(params.row.id)}
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </Stack>
      ),
    },
  ];

  const filteredRows = useMemo(() => {
    if (!user) return rows;
    const roles = Array.isArray(user.roles) ? user.roles : [];
    
    let filtered = rows;
    
    // Rol bazlı filtreleme
    if (roles.includes("Danışman") && !roles.includes("Admin") && !roles.includes("Yönetici")) {
      filtered = filtered.filter((r) => r.advisor === user.name);
    }
    
    // Gelişmiş filtreler
    if (advancedFilters.length > 0) {
      filtered = filtered.filter((row) => {
        return advancedFilters.every((filter) => {
          const fieldValue = (row as any)[filter.field];
          const filterValue = filter.value.toLowerCase();
          const rowValue = String(fieldValue || "").toLowerCase();
          
          switch (filter.operator) {
            case "içinde":
              return rowValue.includes(filterValue);
            case "eşit":
              return rowValue === filterValue;
            case "başlar":
              return rowValue.startsWith(filterValue);
            case "biter":
              return rowValue.endsWith(filterValue);
            default:
              return true;
          }
        });
      });
    }
    
    return filtered;
  }, [rows, user, advancedFilters]);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        p: { xs: 1.5, md: 2 },
        bgcolor: "#F3F4F6",
      }}
    >
      
      {/* ÜST BUTONLAR */}
      <Paper
        sx={{
          p: { xs: 1.5, md: 2 },
          mb: 2,
          borderRadius: 2,
          display: 'flex',
          flexWrap: 'wrap',
          gap: { xs: 1.5, md: 2 },
          alignItems: { xs: 'stretch', md: 'center' },
        }}
      >
        <Button
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
          sx={{ textTransform: 'none', fontWeight: 600, width: { xs: '100%', sm: 'auto' } }}
        >
          {t("customers.actions.new")}
        </Button>
        <Button
          variant="outlined"
          startIcon={<FileDownloadIcon />}
          onClick={exportToCSV}
          sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' } }}
        >
          {t("customers.actions.export")}
        </Button>
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={() => {
            setTempFilters([...advancedFilters]);
            setFilterDialogOpen(true);
          }}
          sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' } }}
        >
          Gelişmiş Filtreler {advancedFilters.length > 0 && `(${advancedFilters.length})`}
        </Button>
        
        <Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }} />
        
        <TextField 
          placeholder={t("customers.search.placeholder")} 
          size="small" 
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} 
          sx={{
            bgcolor: '#F9FAFB',
            borderRadius: 1,
            width: { xs: '100%', sm: 260 },
          }}
        />
        <IconButton onClick={fetchCustomers} sx={{ ml: { xs: 0, sm: 0.5 } }}>
          <RefreshIcon />
        </IconButton>
      </Paper>

      {/* TABLO */}
      <Box sx={{ width: '100%', overflowX: 'auto' }}>
        <Paper
          sx={{
            height: { xs: 520, md: 650 },
            minWidth: 800,
            borderRadius: 2,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          }}
        >
          <DataGrid
            rows={filteredRows}
            columns={columns}
            checkboxSelection
            disableRowSelectionOnClick
            loading={loading}
            rowHeight={60}
            sx={{
              border: "none",
              "& .MuiDataGrid-columnHeaders": { bgcolor: "#F9FAFB", color: "#374151", fontWeight: 600 },
              "& .MuiDataGrid-cell": { borderBottom: "1px solid #F3F4F6", display: 'flex', alignItems: 'center' },
              "& .MuiDataGrid-row:hover": { bgcolor: "#F9FAFB" },
            }}
          />
        </Paper>
      </Box>

      {/* MODAL */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t("customers.modal.newTitle")}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label={t("customers.modal.name")} size="small" value={newCustomer.name} onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})} />
            <TextField label={t("customers.modal.phone")} size="small" value={newCustomer.phone} onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})} />
            <TextField label="E-posta" size="small" type="email" value={newCustomer.email} onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})} />
            
            <FormControl size="small"><InputLabel>{t("customers.modal.advisor")}</InputLabel>
                <Select
                  value={newCustomer.advisor}
                  label={t("customers.modal.advisor")}
                  onChange={(e) => setNewCustomer({ ...newCustomer, advisor: e.target.value })}
                >
                  {advisorOptions.map((u) => (
                    <MenuItem key={u} value={u}>
                      {u}
                    </MenuItem>
                  ))}
                </Select>
            </FormControl>
            <FormControl size="small"><InputLabel>{t("customers.modal.status")}</InputLabel>
                <Select value={newCustomer.status} label={t("customers.modal.status")} onChange={(e) => setNewCustomer({...newCustomer, status: e.target.value})}>
                    {CRM_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
            </FormControl>
            <FormControl size="small"><InputLabel>{t("customers.modal.service")}</InputLabel>
                <Select value={newCustomer.service} label={t("customers.modal.service")} onChange={(e) => setNewCustomer({...newCustomer, service: e.target.value})}>
                    {CRM_SERVICES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
            </FormControl>
            <FormControl size="small"><InputLabel>{t("customers.modal.category")}</InputLabel>
                <Select value={newCustomer.category} label={t("customers.modal.category")} onChange={(e) => setNewCustomer({...newCustomer, category: e.target.value})}>
                    {categoryOptions.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t("customers.modal.cancel")}</Button>
          <Button onClick={handleCreateCustomer} variant="contained" color="success">{t("customers.modal.save")}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={2000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity="success" variant="filled">{snackbar.message}</Alert>
      </Snackbar>

      {/* GELİŞMİŞ FİLTRE DIALOG */}
      <Dialog 
        open={filterDialogOpen} 
        onClose={() => setFilterDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h6" fontWeight={600}>Gelişmiş Filtreler</Typography>
            <Typography variant="caption" color="text.secondary">
              Verilerinizi filtrelemek için koşullar ekleyin
            </Typography>
          </Box>
          <IconButton onClick={() => setFilterDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Filtreler Arası Mantık
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button 
                  variant="contained" 
                  size="small"
                  sx={{ textTransform: "none", minWidth: 60 }}
                >
                  VE
                </Button>
                <Button 
                  variant="outlined" 
                  size="small"
                  sx={{ textTransform: "none", minWidth: 60 }}
                >
                  VEYA
                </Button>
              </Stack>
            </Box>

            {tempFilters.map((filter, index) => (
              <Paper key={index} sx={{ p: 2, bgcolor: "#f8f9fa" }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Alan</InputLabel>
                    <Select
                      value={filter.field}
                      label="Alan"
                      onChange={(e) => {
                        const newFilters = [...tempFilters];
                        newFilters[index].field = e.target.value;
                        setTempFilters(newFilters);
                      }}
                    >
                      <MenuItem value="name">Müşteri Adı</MenuItem>
                      <MenuItem value="phone">Telefon</MenuItem>
                      <MenuItem value="advisor">Danışman</MenuItem>
                      <MenuItem value="status">Durum</MenuItem>
                      <MenuItem value="service">Hizmet</MenuItem>
                      <MenuItem value="category">Kategori</MenuItem>
                      <MenuItem value="parentCategory">Üst Kategori</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Operatör</InputLabel>
                    <Select
                      value={filter.operator}
                      label="Operatör"
                      onChange={(e) => {
                        const newFilters = [...tempFilters];
                        newFilters[index].operator = e.target.value;
                        setTempFilters(newFilters);
                      }}
                    >
                      <MenuItem value="içinde">İçinde</MenuItem>
                      <MenuItem value="eşit">Eşit</MenuItem>
                      <MenuItem value="başlar">Başlar</MenuItem>
                      <MenuItem value="biter">Biter</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    size="small"
                    label="Değer"
                    value={filter.value}
                    onChange={(e) => {
                      const newFilters = [...tempFilters];
                      newFilters[index].value = e.target.value;
                      setTempFilters(newFilters);
                    }}
                    sx={{ flex: 1 }}
                  />

                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      const newFilters = tempFilters.filter((_, i) => i !== index);
                      setTempFilters(newFilters);
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Stack>
              </Paper>
            ))}

            <Button
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => {
                setTempFilters([...tempFilters, { field: "name", operator: "içinde", value: "" }]);
              }}
              sx={{ textTransform: "none", alignSelf: "flex-start" }}
            >
              + Filtre ekle
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => {
              setTempFilters([]);
              setAdvancedFilters([]);
              setFilterDialogOpen(false);
            }}
            sx={{ textTransform: "none" }}
          >
            Sıfırla
          </Button>
          <Button 
            onClick={() => {
              setAdvancedFilters([...tempFilters]);
              setFilterDialogOpen(false);
            }}
            variant="contained"
            sx={{ textTransform: "none" }}
          >
            Filtreleri Uygula
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}