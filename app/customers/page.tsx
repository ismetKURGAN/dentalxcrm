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
  Alert,
  Autocomplete,
  Card,
  CardContent,
  Chip,
  useMediaQuery,
  useTheme
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
import { useI18n, translateValue } from "../components/I18nProvider";
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
  const { t, language } = useI18n();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });
  const [statusObjects, setStatusObjects] = useState<{id: number; tr: string; en: string}[]>([]);
  const [serviceObjects, setServiceObjects] = useState<{id: number; tr: string; en: string}[]>([]);
  const [serviceNames, setServiceNames] = useState<string[]>(CRM_SERVICES);
  const [statuses, setStatuses] = useState<string[]>(CRM_STATUSES);
  
  // Gelişmiş Filtre State'leri
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filterLogic, setFilterLogic] = useState<"VE" | "VEYA">("VE");
  const [advancedFilters, setAdvancedFilters] = useState<{
    categories: string[];
    advisors: string[];
    statuses: string[];
    services: string[];
    countries: string[];
    trustpilot: string | null;
    googleReview: string | null;
    satisfactionSurvey: string | null;
    guaranteeSent: string | null;
    rpt: string | null;
    salesDateFrom: string;
    salesDateTo: string;
    registerDateFrom: string;
    registerDateTo: string;
    editDateFrom: string;
    editDateTo: string;
    categoryOperator: "içinde" | "içinde değil";
    advisorOperator: "içinde" | "içinde değil";
    statusOperator: "içinde" | "içinde değil";
    serviceOperator: "içinde" | "içinde değil";
    countryOperator: "içinde" | "içinde değil";
  }>({
    categories: [],
    advisors: [],
    statuses: [],
    services: [],
    countries: [],
    trustpilot: null,
    googleReview: null,
    satisfactionSurvey: null,
    guaranteeSent: null,
    rpt: null,
    salesDateFrom: "",
    salesDateTo: "",
    registerDateFrom: "",
    registerDateTo: "",
    editDateFrom: "",
    editDateTo: "",
    categoryOperator: "içinde",
    advisorOperator: "içinde",
    statusOperator: "içinde",
    serviceOperator: "içinde",
    countryOperator: "içinde",
  });
  const [tempFilters, setTempFilters] = useState(advancedFilters);
  const [tempFilterLogic, setTempFilterLogic] = useState<"VE" | "VEYA">("VE");
  const isMountedRef = useRef(false);
  const [advisorOptions, setAdvisorOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  
  // Modal
  const [open, setOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "", phone: "", email: "", advisor: "", status: "Yeni Form", service: "", category: "", country: "", registerDate: ""
  });
  
  // Arama state'i
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination state'leri
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(100);

  // --- Durumları Çek ---
  const fetchStatuses = async () => {
    try {
      const res = await fetch("/api/statuses", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          if (typeof data[0] === "object") {
            setStatusObjects(data);
            setStatuses(data.map((s: any) => s.tr).filter(Boolean));
          } else {
            setStatuses(data);
          }
        }
      }
    } catch (e) {
      console.error("Durumlar yüklenirken hata:", e);
      setStatuses(CRM_STATUSES);
    }
  };

  // Dile göre durum adını getir
  const getStatusLabel = (statusTr: string): string => {
    if (!statusTr) return "";
    const found = statusObjects.find(s => s.tr === statusTr);
    if (found && language === "en" && found.en) {
      return found.en;
    }
    return statusTr;
  };

  // --- Servisleri Çek ---
  const fetchServices = async () => {
    try {
      const res = await fetch("/api/services", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          if (typeof data[0] === "object") {
            setServiceObjects(data);
            setServiceNames(data.map((s: any) => s.tr).filter(Boolean));
          } else {
            setServiceNames(data);
          }
        }
      }
    } catch (e) {
      console.error("Servisler yüklenirken hata:", e);
      setServiceNames(CRM_SERVICES);
    }
  };

  // Dile göre servis adını getir
  const getServiceLabel = (serviceTr: string): string => {
    if (!serviceTr) return "";
    const found = serviceObjects.find(s => s.tr === serviceTr);
    if (found && language === "en" && found.en) {
      return found.en;
    }
    return serviceTr;
  };

  // --- Verileri Çek (Pagination Destekli) ---
  const fetchCustomers = async (pageNum: number = page) => {
    try {
      if (!isMountedRef.current) return;
      setLoading(true);
      const res = await fetch(`/api/crm?page=${pageNum}&limit=${pageSize}`, { cache: "no-store" });
      if (res.ok) {
        const response = await res.json();
        const data = response.data || response; // Yeni format: {data, pagination} veya eski format: array
        const pagination = response.pagination;
        
        // Pagination bilgilerini güncelle
        if (pagination) {
          setTotalPages(pagination.totalPages);
          setTotalRecords(pagination.total);
          setPage(pagination.page);
        }
        
        // Acenta = Danışman ile aynı, filtreleme yok
        let filteredData = data;

        const formatted = filteredData.map((c: any) => {
          const createdDate = new Date(c.createdAt);
          
          // Status bilgisini düzelt - hem eski (string) hem yeni (object) formatı destekle
          let advisor = '';
          let status = '';
          let service = '';
          
          if (typeof c.status === 'object' && c.status !== null) {
            advisor = c.status.consultant || '';
            status = c.status.status || '';
            service = c.status.services || c.service || '';
          } else if (typeof c.status === 'string') {
            status = c.status;
            service = c.service || '';
          }
          
          return {
            ...c,
            advisor: advisor,
            status: status,
            service: service,
            date: c.date || createdDate.toLocaleString('tr-TR', {
              day: '2-digit',
              month: '2-digit', 
              year: 'numeric'
            }),
            time: `${String(createdDate.getHours()).padStart(2, '0')}:${String(createdDate.getMinutes()).padStart(2, '0')}`
          };
        });
        if (!isMountedRef.current) return;
        
        // Eğer sayfa 1'den büyükse, mevcut verilere ekle (Load More)
        if (pageNum > 1) {
          setRows(prev => [...prev, ...formatted]);
        } else {
          setRows(formatted);
        }
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
    fetchCustomers(1); // İlk sayfa
    fetchStatuses();
    fetchServices();

    // Danışman listesi: users.json üzerinden, roles içinde "Danışman" olan kullanıcı adları
    const fetchAdvisors = async () => {
      try {
        const res = await fetch("/api/users", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const names = (data || [])
          .filter((u: any) => Array.isArray(u.roles) && (u.roles.includes("Danışman") || u.roles.includes("Acenta")))
          .map((u: any) => u.name)
          .filter(Boolean);
        setAdvisorOptions(names);
      } catch (e) {
        console.error("Danışman listesi yüklenemedi", e);
      }
    };

    fetchAdvisors();

    // Kategori listesi: categories API'den çek (hiyerarşik yapıyı düzleştir)
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        
        // Hiyerarşik yapıyı düz listeye çevir
        const flattenCategories = (cats: any[], prefix = ''): string[] => {
          let result: string[] = [];
          for (const cat of cats) {
            const title = cat.title || cat.name || '';
            if (title) {
              result.push(title);
            }
            if (cat.children && cat.children.length > 0) {
              result = result.concat(flattenCategories(cat.children, title));
            }
          }
          return result;
        };
        
        const names = flattenCategories(data || []);
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
    // Teklif aşamalarına geçmeden önce hizmet kontrolü
    const TEKLIF_STAGES = [
      "Teklif Yollandı",
      "Teklif Yollandı 2",
      "Teklif Yollandı 3",
      "Teklif Yollandı 4",
      "Teklif Yollandı 5",
      "Satış",
      "Satış Kapalı"
    ];
    
    if (field === 'status' && TEKLIF_STAGES.includes(value)) {
      // İlgili müşteriyi bul
      const customer = rows.find((r) => r.id === id);
      const hasService = customer?.service && customer.service.trim() !== '';
      
      if (!hasService) {
        setSnackbar({ 
          open: true, 
          message: "⚠️ Önce hizmet seçmelisiniz! Teklif aşamalarına geçmek için hizmet alanı zorunludur.",
          severity: "warning"
        });
        return;
      }
    }
    
    // 1. Önce arayüzü güncelle (Hızlı tepki için)
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

    // 2. Arka planda API'ye kaydet
    try {
      // advisor ve status alanları için özel işlem
      let updateData: any = { id };
      
      if (field === 'advisor') {
        // advisor güncellenirken status.consultant olarak kaydet
        updateData.status = { consultant: value };
      } else if (field === 'status') {
        // status güncellenirken status.status olarak kaydet
        updateData.status = { status: value };
      } else if (field === 'service') {
        // Hizmet seçildiğinde otomatik olarak durumu "Teklif Yollandı" yap
        const customer = rows.find((r) => r.id === id);
        const currentStatus = customer?.status || '';
        
        // Eğer durum "Yeni Form" veya boşsa, otomatik "Teklif Yollandı" yap
        if (!currentStatus || currentStatus === 'Yeni Form' || currentStatus === 'Seçiniz') {
          updateData.service = value;
          updateData.status = 'Teklif Yollandı';
          // UI'da da durumu güncelle
          setRows((prev) => prev.map((r) => 
            r.id === id ? { ...r, service: value, status: 'Teklif Yollandı' } : r
          ));
        } else {
          // Sadece hizmeti güncelle
          updateData.service = value;
        }
      } else {
        // Diğer alanlar direkt kaydedilir
        updateData[field] = value;
      }
      
      const res = await fetch("/api/crm", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        // API'den güncel veriyi çek
        await fetchCustomers();
        setSnackbar({ open: true, message: t("customers.snackbar.updated") });
      } else {
        // Hata olursa geri al
        await fetchCustomers();
        console.error("Güncelleme başarısız");
      }
    } catch (error) {
      // Hata olursa geri al
      await fetchCustomers();
      console.error("Bağlantı hatası", error);
    }
  };

  // --- Müşteri Ekle ---
  const handleCreateCustomer = async () => {
    try {
      // newCustomer'daki advisor ve status'u doğru formata çevir
      const customerData = {
        ...newCustomer,
        status: {
          consultant: newCustomer.advisor,
          category: newCustomer.category || '',
          services: newCustomer.service || '',
          status: newCustomer.status || 'Yeni Form'
        }
      };
      
      // Kullanıcının seçtiği kayıt tarihini createdAt olarak ayarla
      if (newCustomer.registerDate) {
        (customerData as any).createdAt = new Date(newCustomer.registerDate).toISOString();
      }
      
      // Gereksiz alanları temizle (advisor ve category'yi silme - hem üst seviyede hem status içinde olmalı)
      delete (customerData as any).service;
      delete (customerData as any).registerDate;
      
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      });
      
      if (res.ok) {
        await fetchCustomers();
        setOpen(false);
        setNewCustomer({ name: "", phone: "", email: "", advisor: "", status: "Yeni Form", service: "", category: "", country: "", registerDate: "" });
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
    { 
      field: "date", 
      headerName: t("customers.columns.date"), 
      width: 200,
      renderCell: (params) => {
        if (!params.row.createdAt) return null;
        const d = new Date(params.row.createdAt);
        if (isNaN(d.getTime())) return null;
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#111827" }}>
              {`${day}.${month}.${year}`}
            </Typography>
            <Typography sx={{ fontSize: "0.8rem", color: "#6b7280" }}>
              -
            </Typography>
            <Typography sx={{ fontSize: "0.8rem", color: "#6b7280" }}>
              {`${hours}:${minutes}`}
            </Typography>
          </Box>
        );
      },
    },

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
      field: "name", headerName: t("customers.columns.name"), width: 160,
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
        field: "category", headerName: t("customers.columns.category"), width: 220, flex: 1,
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
            <Autocomplete
                size="small"
                options={statuses}
                value={params.value || ""}
                onChange={(_, newValue) => {
                  if (newValue) handleInlineUpdate(params.row.id, "status", newValue);
                }}
                disableClearable
                getOptionLabel={(option) => getStatusLabel(option)}
                renderInput={(inputParams) => (
                  <TextField
                    {...inputParams}
                    variant="standard"
                    InputProps={{
                      ...inputParams.InputProps,
                      disableUnderline: true,
                    }}
                    sx={{ 
                      fontSize: "0.7rem", 
                      fontWeight: 600,
                      bgcolor: style.bg, 
                      color: style.color, 
                      borderRadius: 4, 
                      px: 1.5,
                      "& input": { py: 0.5, fontSize: "0.7rem", fontWeight: 600, color: style.color }
                    }}
                  />
                )}
                ListboxProps={{
                  sx: {
                    maxHeight: "400px",
                    "& .MuiAutocomplete-option": {
                      fontSize: "0.7rem",
                      borderBottom: "1px solid #F3F4F6",
                      "&:last-child": {
                        borderBottom: "none"
                      }
                    }
                  }
                }}
                sx={{ width: "100%" }}
            />
        );
      },
    },

    {
      field: "service", headerName: t("customers.columns.service"), width: 160,
      renderCell: (params) => (
        <Autocomplete
            size="small"
            options={serviceNames}
            value={params.value || ""}
            onChange={(_, newValue) => {
              if (newValue) handleInlineUpdate(params.row.id, "service", newValue);
            }}
            getOptionLabel={(option) => getServiceLabel(option)}
            renderInput={(inputParams) => (
              <TextField
                {...inputParams}
                variant="standard"
                placeholder={t("common.select")}
                InputProps={{
                  ...inputParams.InputProps,
                  disableUnderline: true,
                }}
                sx={{ 
                  fontSize: "0.7rem",
                  color: params.value ? "#8B5CF6" : "#9CA3AF",
                  "& input": { 
                    fontSize: "0.7rem",
                    color: params.value ? "#8B5CF6" : "#9CA3AF",
                    fontWeight: 500
                  },
                  "& input::placeholder": {
                    color: "#9CA3AF",
                    opacity: 1
                  }
                }}
              />
            )}
            ListboxProps={{
              sx: {
                maxHeight: "400px",
                "& .MuiAutocomplete-option": {
                  fontSize: "0.7rem",
                  borderBottom: "1px solid #F3F4F6",
                  "&:last-child": {
                    borderBottom: "none"
                  }
                }
              }
            }}
            sx={{ width: "100%" }}
        />
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
    if ((roles.includes("Danışman") || roles.includes("Acenta")) && !roles.includes("Admin") && !roles.includes("Yönetici")) {
      filtered = filtered.filter((r) => r.advisor === user.name);
    }
    
    // Arama filtresi (isim, telefon, email)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((row) => {
        const name = String(row.name || "").toLowerCase();
        const phone = String(row.phone || "").toLowerCase();
        const email = String(row.email || "").toLowerCase();
        return name.includes(query) || phone.includes(query) || email.includes(query);
      });
    }
    
    // Gelişmiş filtreler
    const hasActiveFilters = 
      advancedFilters.categories.length > 0 ||
      advancedFilters.advisors.length > 0 ||
      advancedFilters.statuses.length > 0 ||
      advancedFilters.services.length > 0 ||
      advancedFilters.countries.length > 0 ||
      advancedFilters.trustpilot !== null ||
      advancedFilters.googleReview !== null ||
      advancedFilters.satisfactionSurvey !== null ||
      advancedFilters.guaranteeSent !== null ||
      advancedFilters.rpt !== null ||
      advancedFilters.salesDateFrom ||
      advancedFilters.salesDateTo ||
      advancedFilters.registerDateFrom ||
      advancedFilters.registerDateTo ||
      advancedFilters.editDateFrom ||
      advancedFilters.editDateTo;

    if (hasActiveFilters) {
      filtered = filtered.filter((row) => {
        const conditions: boolean[] = [];

        // Kategori filtresi
        if (advancedFilters.categories.length > 0) {
          const rowCategory = String(row.category || "").toLowerCase();
          const match = advancedFilters.categories.some(c => rowCategory.includes(c.toLowerCase()));
          conditions.push(advancedFilters.categoryOperator === "içinde" ? match : !match);
        }

        // Danışman filtresi
        if (advancedFilters.advisors.length > 0) {
          const rowAdvisor = String(row.advisor || "").toLowerCase();
          const match = advancedFilters.advisors.some(a => rowAdvisor === a.toLowerCase());
          conditions.push(advancedFilters.advisorOperator === "içinde" ? match : !match);
        }

        // Durum filtresi
        if (advancedFilters.statuses.length > 0) {
          const rowStatus = String(row.status || "").toLowerCase();
          const match = advancedFilters.statuses.some(s => rowStatus === s.toLowerCase());
          conditions.push(advancedFilters.statusOperator === "içinde" ? match : !match);
        }

        // Hizmet filtresi
        if (advancedFilters.services.length > 0) {
          const rowService = String(row.service || "").toLowerCase();
          const match = advancedFilters.services.some(s => rowService === s.toLowerCase());
          conditions.push(advancedFilters.serviceOperator === "içinde" ? match : !match);
        }

        // Ülke filtresi
        if (advancedFilters.countries.length > 0) {
          const rowCountry = String(row.country || "").toLowerCase();
          const match = advancedFilters.countries.some(c => rowCountry === c.toLowerCase());
          conditions.push(advancedFilters.countryOperator === "içinde" ? match : !match);
        }

        // Boolean filtreler (Evet/Hayır)
        if (advancedFilters.trustpilot !== null) {
          const hasValue = !!row.trustpilotReview;
          conditions.push(advancedFilters.trustpilot === "Evet" ? hasValue : !hasValue);
        }
        if (advancedFilters.googleReview !== null) {
          const hasValue = !!row.googleReview;
          conditions.push(advancedFilters.googleReview === "Evet" ? hasValue : !hasValue);
        }
        if (advancedFilters.satisfactionSurvey !== null) {
          const hasValue = !!row.satisfactionSurvey;
          conditions.push(advancedFilters.satisfactionSurvey === "Evet" ? hasValue : !hasValue);
        }
        if (advancedFilters.guaranteeSent !== null) {
          const hasValue = !!row.guaranteeSent;
          conditions.push(advancedFilters.guaranteeSent === "Evet" ? hasValue : !hasValue);
        }
        if (advancedFilters.rpt !== null) {
          const hasValue = !!row.rpt;
          conditions.push(advancedFilters.rpt === "Evet" ? hasValue : !hasValue);
        }

        // Tarih filtreleri
        const rowCreatedAt = row.createdAt ? new Date(row.createdAt) : null;
        const rowSalesDate = row.salesDate ? new Date(row.salesDate) : null;
        const rowUpdatedAt = row.updatedAt ? new Date(row.updatedAt) : null;

        // Kayıt Tarihi
        if (advancedFilters.registerDateFrom) {
          const fromDate = new Date(advancedFilters.registerDateFrom);
          conditions.push(rowCreatedAt ? rowCreatedAt >= fromDate : false);
        }
        if (advancedFilters.registerDateTo) {
          const toDate = new Date(advancedFilters.registerDateTo);
          toDate.setHours(23, 59, 59, 999);
          conditions.push(rowCreatedAt ? rowCreatedAt <= toDate : false);
        }

        // Satış Tarihi
        if (advancedFilters.salesDateFrom) {
          const fromDate = new Date(advancedFilters.salesDateFrom);
          conditions.push(rowSalesDate ? rowSalesDate >= fromDate : false);
        }
        if (advancedFilters.salesDateTo) {
          const toDate = new Date(advancedFilters.salesDateTo);
          toDate.setHours(23, 59, 59, 999);
          conditions.push(rowSalesDate ? rowSalesDate <= toDate : false);
        }

        // Düzenleme Tarihi
        if (advancedFilters.editDateFrom) {
          const fromDate = new Date(advancedFilters.editDateFrom);
          conditions.push(rowUpdatedAt ? rowUpdatedAt >= fromDate : false);
        }
        if (advancedFilters.editDateTo) {
          const toDate = new Date(advancedFilters.editDateTo);
          toDate.setHours(23, 59, 59, 999);
          conditions.push(rowUpdatedAt ? rowUpdatedAt <= toDate : false);
        }

        // VE / VEYA mantığı
        if (conditions.length === 0) return true;
        return filterLogic === "VE" 
          ? conditions.every(c => c) 
          : conditions.some(c => c);
      });
    }
    
    return filtered;
  }, [rows, user, advancedFilters, searchQuery, filterLogic]);

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
        {(user?.roles?.includes("SuperAdmin") || user?.name?.toLowerCase() === "seref") && (
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={exportToCSV}
            sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' } }}
          >
            {t("customers.actions.export")}
          </Button>
        )}
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={() => {
            setTempFilters({...advancedFilters});
            setTempFilterLogic(filterLogic);
            setFilterDialogOpen(true);
          }}
          sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' } }}
        >
          Gelişmiş Filtreler {(advancedFilters.categories.length + advancedFilters.advisors.length + advancedFilters.statuses.length + advancedFilters.services.length + advancedFilters.countries.length) > 0 && `(${advancedFilters.categories.length + advancedFilters.advisors.length + advancedFilters.statuses.length + advancedFilters.services.length + advancedFilters.countries.length})`}
        </Button>
        
        <Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }} />
        
        <TextField 
          placeholder={t("customers.search.placeholder")} 
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* TABLO - Masaüstü */}
      {!isMobile && (
        <Paper
          sx={{
            width: '100%',
            height: pageSize === 100 ? 'calc(100vh - 200px)' : pageSize === 50 ? 700 : pageSize === 25 ? 520 : 400,
            minHeight: 400,
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
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 50 } },
            }}
            onPaginationModelChange={(model) => setPageSize(model.pageSize)}
            columnVisibilityModel={{
              id: false,
            }}
            sx={{
              border: "none",
              fontSize: "0.8rem",
              "& .MuiDataGrid-columnHeaders": { bgcolor: "#F9FAFB", color: "#374151", fontWeight: 600, fontSize: "0.75rem", borderBottom: "1px solid #E5E7EB" },
              "& .MuiDataGrid-cell": { 
                borderBottom: "1px solid #F3F4F6", 
                borderRight: "1px solid #F3F4F6",
                display: 'flex', 
                alignItems: 'center', 
                fontSize: "0.8rem" 
              },
              "& .MuiDataGrid-row:hover": { bgcolor: "#F9FAFB" },
              "& .MuiDataGrid-columnSeparator": { display: "none" },
            }}
          />
        </Paper>
      )}

      {/* Load More Butonu */}
      {!isMobile && page < totalPages && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            variant="outlined"
            size="large"
            onClick={() => {
              const nextPage = page + 1;
              fetchCustomers(nextPage);
            }}
            disabled={loading}
            sx={{
              textTransform: 'none',
              px: 4,
              py: 1.5,
              borderRadius: 2,
              fontWeight: 600
            }}
          >
            {loading ? 'Yüklüyor...' : `Daha Fazla Göster (${rows.length} / ${totalRecords})`}
          </Button>
        </Box>
      )}

      {/* KART GÖRÜNÜMÜ - Mobil */}
      {isMobile && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {loading ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography>Yükleniyor...</Typography>
            </Paper>
          ) : filteredRows.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography>Müşteri bulunamadı</Typography>
            </Paper>
          ) : (
            filteredRows.slice(0, pageSize).map((row) => {
              const statusColors = getStatusColor(row.status);
              return (
                <Card 
                  key={row.id}
                  sx={{ 
                    borderRadius: 2,
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    '&:active': { bgcolor: '#F9FAFB' }
                  }}
                  onClick={() => router.push(`/customers/${row.id}`)}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Stack spacing={1.5}>
                      {/* Başlık - İsim ve Tarih */}
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1 }}>
                          {row.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', ml: 1 }}>
                          {row.date}
                        </Typography>
                      </Stack>

                      {/* Telefon */}
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>
                          Telefon:
                        </Typography>
                        <Typography variant="body2">
                          {row.phone || '-'}
                        </Typography>
                      </Stack>

                      {/* Danışman */}
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>
                          Danışman:
                        </Typography>
                        <Typography variant="body2">
                          {row.advisor || '-'}
                        </Typography>
                      </Stack>

                      {/* Durum ve Hizmet */}
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip 
                          label={row.status}
                          size="small"
                          sx={{ 
                            bgcolor: statusColors.bg,
                            color: statusColors.color,
                            fontWeight: 500,
                            fontSize: '0.75rem'
                          }}
                        />
                        {row.service && (
                          <Chip 
                            label={row.service}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        )}
                      </Stack>

                      {/* Kategori */}
                      {row.category && (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>
                            Kategori:
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                            {row.category}
                          </Typography>
                        </Stack>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              );
            })
          )}
          
          {/* Sayfalama Bilgisi */}
          {filteredRows.length > 0 && (
            <Paper sx={{ p: 2, textAlign: 'center', mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Toplam {filteredRows.length} müşteri gösteriliyor
              </Typography>
            </Paper>
          )}
          
          {/* Load More Butonu - Mobil */}
          {page < totalPages && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={() => {
                  const nextPage = page + 1;
                  fetchCustomers(nextPage);
                }}
                disabled={loading}
                sx={{
                  textTransform: 'none',
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600
                }}
              >
                {loading ? 'Yüklüyor...' : `Daha Fazla Göster (${rows.length} / ${totalRecords})`}
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* MODAL - Yeni Müşteri Ekle */}
      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 0.5 }}>
          <Typography variant="h6" fontWeight={600}>Yeni Müşteri Ekle</Typography>
          <Typography variant="body2" color="text.secondary">
            Yeni müşteriyi burada oluşturun. İşlem tamamlandığında kaydet'e tıklayın.
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            {/* Ad Soyad */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>Ad Soyad</Typography>
              <TextField 
                placeholder="Ad Soyad" 
                size="small" 
                fullWidth
                value={newCustomer.name} 
                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})} 
              />
            </Box>

            {/* E-Posta */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>E-Posta</Typography>
              <TextField 
                placeholder="ornek@email.com" 
                size="small" 
                fullWidth
                type="email" 
                value={newCustomer.email} 
                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})} 
              />
            </Box>

            {/* Telefon */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>Telefon</Typography>
              <TextField 
                placeholder="+90" 
                size="small" 
                fullWidth
                value={newCustomer.phone} 
                onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})} 
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box component="span" sx={{ fontSize: '1.2rem' }}>🇹🇷</Box>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Ülke */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>Ülke</Typography>
              <Autocomplete
                size="small"
                options={["Türkiye", "United Kingdom", "Germany", "France", "Netherlands", "Belgium", "Austria", "Switzerland", "Poland", "Denmark", "Sweden", "Norway", "Ireland", "Italy", "Spain", "Portugal", "Greece", "USA", "Canada", "Australia", "Other"]}
                value={newCustomer.country || null}
                onChange={(_, newValue) => setNewCustomer({...newCustomer, country: newValue || ""})}
                renderInput={(params) => <TextField {...params} placeholder="Ülke seçin" />}
              />
            </Box>

            {/* Danışman */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>Danışman</Typography>
              <Autocomplete
                size="small"
                options={advisorOptions}
                value={newCustomer.advisor || null}
                onChange={(_, newValue) => setNewCustomer({...newCustomer, advisor: newValue || ""})}
                renderInput={(params) => <TextField {...params} placeholder="Danışman seçin" />}
              />
            </Box>

            {/* Kategori */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>Kategori</Typography>
              <Autocomplete
                size="small"
                options={categoryOptions}
                value={newCustomer.category || null}
                onChange={(_, newValue) => setNewCustomer({...newCustomer, category: newValue || ""})}
                renderInput={(params) => <TextField {...params} placeholder="Kategori seçin" />}
              />
            </Box>

            {/* Hizmetler */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>Hizmetler</Typography>
              <Autocomplete
                size="small"
                options={serviceNames}
                value={newCustomer.service || null}
                onChange={(_, newValue) => setNewCustomer({...newCustomer, service: newValue || ""})}
                renderInput={(params) => <TextField {...params} placeholder="Hizmet seçin" />}
              />
            </Box>

            {/* Durum */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>Durum</Typography>
              <Autocomplete
                size="small"
                options={statuses}
                value={newCustomer.status || null}
                onChange={(_, newValue) => setNewCustomer({...newCustomer, status: newValue || "Yeni Form"})}
                renderInput={(params) => <TextField {...params} placeholder="Durum seçin" />}
              />
            </Box>

            {/* Kayıt Tarihi */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>Kayıt Tarihi</Typography>
              <TextField 
                type="datetime-local"
                size="small" 
                fullWidth
                value={newCustomer.registerDate} 
                onChange={(e) => setNewCustomer({...newCustomer, registerDate: e.target.value})} 
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => setOpen(false)}
            sx={{ textTransform: 'none', color: 'text.secondary' }}
          >
            İptal
          </Button>
          <Button 
            onClick={handleCreateCustomer} 
            variant="contained" 
            sx={{ 
              textTransform: 'none', 
              bgcolor: '#3b82f6', 
              '&:hover': { bgcolor: '#2563eb' },
              px: 3
            }}
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={2000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity="success" variant="filled">{snackbar.message}</Alert>
      </Snackbar>

      {/* GELİŞMİŞ FİLTRE DIALOG */}
      <Dialog 
        open={filterDialogOpen} 
        onClose={() => setFilterDialogOpen(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{ sx: { maxHeight: '90vh' } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h6" fontWeight={600}>Gelişmiş Filtreler</Typography>
            <Typography variant="caption" color="text.secondary">
              Verilerinizi filtrelemek için koşullar seçin
            </Typography>
          </Box>
          <IconButton onClick={() => setFilterDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            {/* VE / VEYA Mantığı */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Filtreler Arası Mantık
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button 
                  variant={tempFilterLogic === "VE" ? "contained" : "outlined"}
                  size="small"
                  onClick={() => setTempFilterLogic("VE")}
                  sx={{ textTransform: "none", minWidth: 60 }}
                >
                  VE
                </Button>
                <Button 
                  variant={tempFilterLogic === "VEYA" ? "contained" : "outlined"}
                  size="small"
                  onClick={() => setTempFilterLogic("VEYA")}
                  sx={{ textTransform: "none", minWidth: 60 }}
                >
                  VEYA
                </Button>
              </Stack>
            </Box>

            {/* Kategoriler */}
            <Box>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ minWidth: 120 }}>Kategoriler</Typography>
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <Select
                    value={tempFilters.categoryOperator}
                    onChange={(e) => setTempFilters({...tempFilters, categoryOperator: e.target.value as any})}
                  >
                    <MenuItem value="içinde">İçinde</MenuItem>
                    <MenuItem value="içinde değil">İçinde Değil</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              <Autocomplete
                multiple
                size="small"
                options={categoryOptions}
                value={tempFilters.categories}
                onChange={(_, newValue) => setTempFilters({...tempFilters, categories: newValue})}
                renderInput={(params) => <TextField {...params} placeholder="Kategori seçin..." />}
              />
            </Box>

            {/* Danışmanlar */}
            <Box>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ minWidth: 120 }}>Danışmanlar</Typography>
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <Select
                    value={tempFilters.advisorOperator}
                    onChange={(e) => setTempFilters({...tempFilters, advisorOperator: e.target.value as any})}
                  >
                    <MenuItem value="içinde">İçinde</MenuItem>
                    <MenuItem value="içinde değil">İçinde Değil</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              <Autocomplete
                multiple
                size="small"
                options={advisorOptions}
                value={tempFilters.advisors}
                onChange={(_, newValue) => setTempFilters({...tempFilters, advisors: newValue})}
                renderInput={(params) => <TextField {...params} placeholder="Danışman seçin..." />}
              />
            </Box>

            {/* Durum */}
            <Box>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ minWidth: 120 }}>Durum</Typography>
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <Select
                    value={tempFilters.statusOperator}
                    onChange={(e) => setTempFilters({...tempFilters, statusOperator: e.target.value as any})}
                  >
                    <MenuItem value="içinde">İçinde</MenuItem>
                    <MenuItem value="içinde değil">İçinde Değil</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              <Autocomplete
                multiple
                size="small"
                options={statuses}
                value={tempFilters.statuses}
                onChange={(_, newValue) => setTempFilters({...tempFilters, statuses: newValue})}
                renderInput={(params) => <TextField {...params} placeholder="Durum seçin..." />}
              />
            </Box>

            {/* Hizmetler */}
            <Box>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ minWidth: 120 }}>Hizmetler</Typography>
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <Select
                    value={tempFilters.serviceOperator}
                    onChange={(e) => setTempFilters({...tempFilters, serviceOperator: e.target.value as any})}
                  >
                    <MenuItem value="içinde">İçinde</MenuItem>
                    <MenuItem value="içinde değil">İçinde Değil</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              <Autocomplete
                multiple
                size="small"
                options={serviceNames}
                value={tempFilters.services}
                onChange={(_, newValue) => setTempFilters({...tempFilters, services: newValue})}
                renderInput={(params) => <TextField {...params} placeholder="Hizmet seçin..." />}
              />
            </Box>

            {/* Ülkeler */}
            <Box>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ minWidth: 120 }}>Ülkeler</Typography>
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <Select
                    value={tempFilters.countryOperator}
                    onChange={(e) => setTempFilters({...tempFilters, countryOperator: e.target.value as any})}
                  >
                    <MenuItem value="içinde">İçinde</MenuItem>
                    <MenuItem value="içinde değil">İçinde Değil</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              <Autocomplete
                multiple
                size="small"
                options={["Türkiye", "United Kingdom", "Germany", "France", "Netherlands", "Belgium", "Austria", "Switzerland", "Poland", "Denmark", "Sweden", "Norway", "Ireland", "Italy", "Spain", "Portugal", "Greece", "USA", "Canada", "Australia", "Other"]}
                value={tempFilters.countries}
                onChange={(_, newValue) => setTempFilters({...tempFilters, countries: newValue})}
                renderInput={(params) => <TextField {...params} placeholder="Ülke seçin..." />}
              />
            </Box>

            {/* Evet/Hayır Filtreleri */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
              {/* Trustpilot */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Trustpilot İncelemesi</Typography>
                <Stack direction="row" spacing={1}>
                  <Button 
                    variant={tempFilters.trustpilot === "Evet" ? "contained" : "outlined"} 
                    size="small"
                    onClick={() => setTempFilters({...tempFilters, trustpilot: tempFilters.trustpilot === "Evet" ? null : "Evet"})}
                    sx={{ textTransform: "none", flex: 1 }}
                  >
                    Evet
                  </Button>
                  <Button 
                    variant={tempFilters.trustpilot === "Hayır" ? "contained" : "outlined"} 
                    size="small"
                    onClick={() => setTempFilters({...tempFilters, trustpilot: tempFilters.trustpilot === "Hayır" ? null : "Hayır"})}
                    sx={{ textTransform: "none", flex: 1 }}
                  >
                    Hayır
                  </Button>
                </Stack>
              </Box>

              {/* Google İncelemesi */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Google İncelemesi</Typography>
                <Stack direction="row" spacing={1}>
                  <Button 
                    variant={tempFilters.googleReview === "Evet" ? "contained" : "outlined"} 
                    size="small"
                    onClick={() => setTempFilters({...tempFilters, googleReview: tempFilters.googleReview === "Evet" ? null : "Evet"})}
                    sx={{ textTransform: "none", flex: 1 }}
                  >
                    Evet
                  </Button>
                  <Button 
                    variant={tempFilters.googleReview === "Hayır" ? "contained" : "outlined"} 
                    size="small"
                    onClick={() => setTempFilters({...tempFilters, googleReview: tempFilters.googleReview === "Hayır" ? null : "Hayır"})}
                    sx={{ textTransform: "none", flex: 1 }}
                  >
                    Hayır
                  </Button>
                </Stack>
              </Box>

              {/* Memnuniyet Anketi */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Memnuniyet Anketi</Typography>
                <Stack direction="row" spacing={1}>
                  <Button 
                    variant={tempFilters.satisfactionSurvey === "Evet" ? "contained" : "outlined"} 
                    size="small"
                    onClick={() => setTempFilters({...tempFilters, satisfactionSurvey: tempFilters.satisfactionSurvey === "Evet" ? null : "Evet"})}
                    sx={{ textTransform: "none", flex: 1 }}
                  >
                    Evet
                  </Button>
                  <Button 
                    variant={tempFilters.satisfactionSurvey === "Hayır" ? "contained" : "outlined"} 
                    size="small"
                    onClick={() => setTempFilters({...tempFilters, satisfactionSurvey: tempFilters.satisfactionSurvey === "Hayır" ? null : "Hayır"})}
                    sx={{ textTransform: "none", flex: 1 }}
                  >
                    Hayır
                  </Button>
                </Stack>
              </Box>

              {/* Garanti Gönderildi */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Garanti Gönderildi</Typography>
                <Stack direction="row" spacing={1}>
                  <Button 
                    variant={tempFilters.guaranteeSent === "Evet" ? "contained" : "outlined"} 
                    size="small"
                    onClick={() => setTempFilters({...tempFilters, guaranteeSent: tempFilters.guaranteeSent === "Evet" ? null : "Evet"})}
                    sx={{ textTransform: "none", flex: 1 }}
                  >
                    Evet
                  </Button>
                  <Button 
                    variant={tempFilters.guaranteeSent === "Hayır" ? "contained" : "outlined"} 
                    size="small"
                    onClick={() => setTempFilters({...tempFilters, guaranteeSent: tempFilters.guaranteeSent === "Hayır" ? null : "Hayır"})}
                    sx={{ textTransform: "none", flex: 1 }}
                  >
                    Hayır
                  </Button>
                </Stack>
              </Box>

              {/* RPT */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>RPT</Typography>
                <Stack direction="row" spacing={1}>
                  <Button 
                    variant={tempFilters.rpt === "Evet" ? "contained" : "outlined"} 
                    size="small"
                    onClick={() => setTempFilters({...tempFilters, rpt: tempFilters.rpt === "Evet" ? null : "Evet"})}
                    sx={{ textTransform: "none", flex: 1 }}
                  >
                    Evet
                  </Button>
                  <Button 
                    variant={tempFilters.rpt === "Hayır" ? "contained" : "outlined"} 
                    size="small"
                    onClick={() => setTempFilters({...tempFilters, rpt: tempFilters.rpt === "Hayır" ? null : "Hayır"})}
                    sx={{ textTransform: "none", flex: 1 }}
                  >
                    Hayır
                  </Button>
                </Stack>
              </Box>
            </Box>

            {/* Tarih Filtreleri */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
              {/* Kayıt Tarihi */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Kayıt Tarihi</Typography>
                <Stack direction="row" spacing={1}>
                  <TextField
                    type="date"
                    size="small"
                    label="Başlangıç"
                    value={tempFilters.registerDateFrom}
                    onChange={(e) => setTempFilters({...tempFilters, registerDateFrom: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                  <TextField
                    type="date"
                    size="small"
                    label="Bitiş"
                    value={tempFilters.registerDateTo}
                    onChange={(e) => setTempFilters({...tempFilters, registerDateTo: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Stack>
              </Box>

              {/* Satış Tarihi */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Satış Tarihi</Typography>
                <Stack direction="row" spacing={1}>
                  <TextField
                    type="date"
                    size="small"
                    label="Başlangıç"
                    value={tempFilters.salesDateFrom}
                    onChange={(e) => setTempFilters({...tempFilters, salesDateFrom: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                  <TextField
                    type="date"
                    size="small"
                    label="Bitiş"
                    value={tempFilters.salesDateTo}
                    onChange={(e) => setTempFilters({...tempFilters, salesDateTo: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Stack>
              </Box>

              {/* Düzenleme Tarihi */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Düzenleme Tarihi</Typography>
                <Stack direction="row" spacing={1}>
                  <TextField
                    type="date"
                    size="small"
                    label="Başlangıç"
                    value={tempFilters.editDateFrom}
                    onChange={(e) => setTempFilters({...tempFilters, editDateFrom: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                  <TextField
                    type="date"
                    size="small"
                    label="Bitiş"
                    value={tempFilters.editDateTo}
                    onChange={(e) => setTempFilters({...tempFilters, editDateTo: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Stack>
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => {
              const emptyFilters = {
                categories: [],
                advisors: [],
                statuses: [],
                services: [],
                countries: [],
                trustpilot: null,
                googleReview: null,
                satisfactionSurvey: null,
                guaranteeSent: null,
                rpt: null,
                salesDateFrom: "",
                salesDateTo: "",
                registerDateFrom: "",
                registerDateTo: "",
                editDateFrom: "",
                editDateTo: "",
                categoryOperator: "içinde" as const,
                advisorOperator: "içinde" as const,
                statusOperator: "içinde" as const,
                serviceOperator: "içinde" as const,
                countryOperator: "içinde" as const,
              };
              setTempFilters(emptyFilters);
              setAdvancedFilters(emptyFilters);
              setFilterLogic("VE");
              setTempFilterLogic("VE");
              setFilterDialogOpen(false);
            }}
            sx={{ textTransform: "none" }}
          >
            Sıfırla
          </Button>
          <Button 
            onClick={() => {
              setAdvancedFilters({...tempFilters});
              setFilterLogic(tempFilterLogic);
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