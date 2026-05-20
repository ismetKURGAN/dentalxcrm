"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";

import {
  Box,
  Paper,
  Typography,
  Stack,
  Avatar,
  TextField,
  Button,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Snackbar,
  Alert,
  Switch,
  IconButton,
  Fab,
  Autocomplete,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

// ICONS
import PersonIcon from "@mui/icons-material/Person";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import PhoneIcon from "@mui/icons-material/Phone";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import HistoryIcon from "@mui/icons-material/History";
import EmailIcon from "@mui/icons-material/Email";
import SaveIcon from "@mui/icons-material/Save";
import FacebookIcon from "@mui/icons-material/Facebook";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import DeleteIcon from "@mui/icons-material/Delete";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import HealingIcon from "@mui/icons-material/Healing";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import LockIcon from "@mui/icons-material/Lock";
import { useI18n } from "../../components/I18nProvider";
import PatientCostsTab from "../../components/PatientCostsTab";

// SEÇENEKLER
const CRM_USERS = [
  "Sonege",
  "Admin",
  "İsmet Kurgan",
  "Burcu",
  "Mehmet",
  "Ahmet",
  "Sadık",
  "Connor",
  "Lejla",
];
const CRM_CATEGORIES = [
  "Facebook Lead Form",
  "Instagram DM",
  "WhatsApp Web",
  "Website Form",
  "Segment - İngiltere - Filtreli - 13",
  "Segment - Türkiye - VIP",
  "Segment - Almanya - Genel",
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
const CRM_COUNTRIES = [
  "Türkiye", "United Kingdom", "Germany", "France", "Netherlands", "Belgium", 
  "Austria", "Switzerland", "Poland", "Denmark", "Sweden", "Norway", "Ireland", 
  "Italy", "Spain", "Portugal", "Greece", "USA", "Canada", "Australia", 
  "Iran", "Iraq", "Saudi Arabia", "UAE", "Qatar", "Kuwait", "Bahrain", "Oman",
  "Russia", "Ukraine", "Romania", "Bulgaria", "Czech Republic", "Hungary",
  "Scotland", "Kazakhstan", "Turkmenistan", "Kyrgyzstan", "Uzbekistan",
  "Other"
];
const CRM_CURRENCIES = ["EUR", "USD", "GBP", "TRY"];
const CRM_PAYMENT_CATEGORIES = ["1. Seyahat", "2. Seyahat", "3. Seyahat", "Otel", "Diğer"];


// --- TİPLER ---
type CustomerState = {
  id: number;
  createdAt?: string;
  personal: {
    name: string;
    email: string;
    phone: string;
    country: string;
    notes: string;
    registerDate: string;
    facebook: {
      adName: string;
      adGroupName: string;
      campaignName: string;
      leadFormId: string;
    };
  };
  status: {
    consultant: string;
    category: string;
    services: string;
    status: string;
  };
  reminder: { enabled: boolean; datetime: string; notes: string };
  payment: {
    trips: {
      id: number;
      name: string;
      completed: boolean;
      costs: {
        treatment: string; treatmentCurrency: string;
        transfer: string; transferCurrency: string;
        laboratory: string; laboratoryCurrency: string;
        hotel: string; hotelCurrency: string;
        advertising: string; advertisingCurrency: string;
        other: string; otherCurrency: string;
      };
      sales: { amount: string; currency: string; };
      notes: string;
    }[];
  };
  sales: {
    salesDate: string;
    price: string;
    priceCurrency: string;
    priceLocked?: boolean;
    priceLockedAt?: string;
    deposit: string;
    depositCurrency: string;
    depositPaid: boolean;
    healthNotes: string;
    feedback: {
      trustpilot: boolean;
      googleMaps: boolean;
      survey: boolean;
      warrantySent: boolean;
      rpt: boolean;
    };
    trips: {
      id: number;
      name: string;
      dateUndetermined: boolean;
      appointmentDate: string;
      appointmentTime: string;
      doctor: string;
      service: string;
      hotel: string;
      transferCompany: string;
      roomType: string;
      peopleCount: string;
      travelNotes: string;
      arrivalDate: string;
      arrivalTime: string;
      arrivalFlightCode: string;
      departureDate: string;
      departureTime: string;
      departureFlightCode: string;
    }[];
  };
  calls: { id: number; title: string; date: string; notes: string }[];
  files: { id: number; name: string; size: string; uploadedAt: string; url?: string; category?: "passport" | "ticket" | "proposal" | "other" }[];
  history: {
    id: number;
    action: string; // "created" | "updated" | "status_changed" | "note_added" | "file_uploaded" | "call_added" | "trip_added" | etc.
    section: string; // "personal" | "status" | "sales" | "files" | "calls" | "notes" | etc.
    field?: string; // Değişen alan adı
    oldValue: string;
    newValue: string;
    date: string;
    user: string;
    details?: string; // Ek detaylar
  }[];
  soldBy?: string;
  consultationNotes: { id: number; date: string; note: string }[];
  treatmentNotes: { note: string };
};

// Başlangıç Şablonu
const INITIAL_STATE: CustomerState = {
  id: 0,
  personal: {
    name: "",
    email: "",
    phone: "",
    country: "United Kingdom",
    notes: "",
    registerDate: "",
    facebook: {
      adName: "",
      adGroupName: "",
      campaignName: "",
      leadFormId: "",
    },
  },
  status: { consultant: "", category: "", services: "", status: "" },
  reminder: { enabled: false, datetime: "", notes: "" },
  payment: {
    trips: [
      {
        id: 1,
        name: "1. Seyahat",
        completed: false,
        costs: {
          treatment: "", treatmentCurrency: "GBP",
          transfer: "", transferCurrency: "GBP",
          laboratory: "", laboratoryCurrency: "GBP",
          hotel: "", hotelCurrency: "GBP",
          advertising: "", advertisingCurrency: "GBP",
          other: "", otherCurrency: "GBP",
        },
        sales: { amount: "", currency: "GBP" },
        notes: "",
      },
    ],
  },
  sales: {
    salesDate: "",
    price: "",
    priceCurrency: "GBP",
    priceLocked: false,
    priceLockedAt: "",
    deposit: "",
    depositCurrency: "GBP",
    depositPaid: false,
    healthNotes: "",
    feedback: {
      trustpilot: false,
      googleMaps: false,
      survey: false,
      warrantySent: false,
      rpt: false,
    },
    trips: [],
  },
  consultationNotes: [],
  treatmentNotes: { note: "" },
  calls: [],
  files: [],
  history: [],
};

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<string>("personal");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const [customer, setCustomer] = useState<CustomerState>(INITIAL_STATE);
  const [userRole, setUserRole] = useState<string>("");
  const [userRoles, setUserRoles] = useState<string[]>([]);
  
  // Dinamik listeler
  const [advisorOptions, setAdvisorOptions] = useState<string[]>([]);
  const [categoriesData, setCategoriesData] = useState<any[]>([]);
  const [serviceOptions, setServiceOptions] = useState<string[]>([]);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [doctorOptions, setDoctorOptions] = useState<string[]>([]);
  const [transferCompanyOptions, setTransferCompanyOptions] = useState<string[]>([]);
  const [hotelOptions, setHotelOptions] = useState<string[]>([]);
  
  // Fiyat değişiklik talebi için
  const [priceChangeDialogOpen, setPriceChangeDialogOpen] = useState(false);
  const [priceChangeRequest, setPriceChangeRequest] = useState({ newPrice: "", reason: "" });
  
  // Zorunlu alan kontrolü için
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Dosya kategorisi seçimi için
  const [fileCategory, setFileCategory] = useState<"passport" | "ticket" | "proposal" | "other">("other");
  
  // Sayfa ayrılma uyarısı için
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  
  // History log ekleme fonksiyonu
  const addHistoryLog = (action: string, section: string, field: string, oldValue: string, newValue: string, details?: string) => {
    const userEmail = typeof window !== 'undefined' ? localStorage.getItem("userEmail") : "Sistem";
    const newLog = {
      id: Date.now(),
      action,
      section,
      field,
      oldValue,
      newValue,
      date: new Date().toLocaleString("tr-TR"),
      user: userEmail || "Sistem",
      details
    };
    
    setCustomer(prev => ({
      ...prev,
      history: [newLog, ...prev.history]
    }));
  };

  // --- VERİ ÇEKME ---
  useEffect(() => {
    const fetchData = async () => {
      if (!(params as any)?.id) return;
      try {
        // Tüm API çağrılarını paralel yap (performans için)
        const currentUserEmail = typeof window !== 'undefined' ? localStorage.getItem("userEmail") : null;
        
        const [usersRes, categoriesRes, statusesRes, doctorsRes, segmentsRes, hotelsRes, customerRes] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/categories", { cache: "no-store" }),
          fetch("/api/statuses", { cache: "no-store" }),
          fetch("/api/doctors"),
          fetch("/api/segments"),
          fetch("/api/hotels"),
          fetch(`/api/crm-sqlite?id=${(params as any).id}`, { cache: "no-store" }),
        ]);

        // Kullanıcılar
        if (usersRes.ok) {
          const users = await usersRes.json();
          const advisors = users
            .filter((u: any) => Array.isArray(u.roles) && (u.roles.includes("Danışman") || u.roles.includes("Acenta")))
            .map((u: any) => u.name)
            .filter(Boolean);
          setAdvisorOptions(advisors);
          
          const currentUser = users.find((u: any) => u.email === currentUserEmail);
          if (currentUser && Array.isArray(currentUser.roles)) {
            setUserRoles(currentUser.roles);
            if (currentUser.roles.includes("Admin")) {
              setUserRole("Admin");
            } else if (currentUser.roles.includes("Fiyatlandırma")) {
              setUserRole("Fiyatlandırma");
            }
          }
        }
        
        // Kategoriler
        if (categoriesRes.ok) {
          const cats = await categoriesRes.json();
          setCategoriesData(Array.isArray(cats) ? cats : []);
        }
        
        // Hizmetler
        setServiceOptions(CRM_SERVICES);
        
        // Durumlar
        if (statusesRes.ok) {
          const statusesData = await statusesRes.json();
          if (Array.isArray(statusesData) && statusesData.length > 0 && typeof statusesData[0] === 'object') {
            setStatusOptions(statusesData.map((s: any) => s.tr));
          } else {
            setStatusOptions(statusesData);
          }
        } else {
          setStatusOptions(CRM_STATUSES);
        }
        
        // Doktorlar
        if (doctorsRes.ok) {
          const doctors = await doctorsRes.json();
          const doctorNames = doctors.map((d: any) => d.name).filter(Boolean);
          setDoctorOptions(doctorNames);
        }
        
        // Transfer firmaları
        if (segmentsRes.ok) {
          const segments = await segmentsRes.json();
          const transferCompanies = segments
            .filter((s: any) => s.type === "transfer")
            .map((s: any) => s.name)
            .filter(Boolean);
          setTransferCompanyOptions(transferCompanies);
        }
        
        // Oteller
        if (hotelsRes.ok) {
          const hotels = await hotelsRes.json();
          const hotelNames = hotels.map((h: any) => h.name).filter(Boolean);
          setHotelOptions(hotelNames.sort());
        }
        
        // Müşteri verisi (tek kayıt - ?id=xxx)
        if (customerRes.ok) {
          const found = await customerRes.json();

          if (found && found.id) {
            setCustomer({
              id: found.id,
              createdAt: found.createdAt,
              personal: {
                name: found.personal?.name || found.name || "",
                email: found.personal?.email || found.email || "",
                phone: found.personal?.phone || found.phone || "",
                country:
                  found.personal?.country || found.country || "United Kingdom",
                notes: found.personal?.notes || found.notes || "",
                registerDate:
                  found.personal?.registerDate ||
                  new Date(found.createdAt).toLocaleString(),
                facebook:
                  found.personal?.facebook || {
                    adName: "",
                    adGroupName: "",
                    campaignName: "",
                    leadFormId: "",
                  },
              },
              status: {
                consultant: found.status?.consultant || found.advisor || "",
                status: found.status?.status || found.status || "",
                services: found.status?.services || found.service || "",
                category: found.status?.category || found.category || "",
              },
              reminder: found.reminder || INITIAL_STATE.reminder,
              payment: found.payment?.trips ? found.payment : INITIAL_STATE.payment,
              sales: found.sales || INITIAL_STATE.sales,
              consultationNotes: found.consultationNotes || [],
              treatmentNotes: found.treatmentNotes || { note: "" },
              calls: found.calls || [],
              files: found.files || [],
              history: found.history || [],
            });
          }
        }
      } catch (err) {
        console.error("Hata:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params]);

  // Sayfa ayrılma uyarısı - browser tab/window kapatma
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!checkRequiredFields()) {
        e.preventDefault();
        e.returnValue = "Zorunlu alanlar doldurulmamış. Sayfadan ayrılırsanız bilgileriniz kaybedilecek.";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [customer]);

  // Seyahat ekleme fonksiyonu
  const handleAddTrip = () => {
    const tripNumber = customer.sales.trips.length + 1;
    const newTrip = {
      id: Date.now(),
      name: `${tripNumber}. Seyahat`,
      dateUndetermined: false,
      appointmentDate: "",
      appointmentTime: "",
      doctor: "",
      service: "",
      hotel: "",
      transferCompany: "",
      roomType: "",
      peopleCount: "",
      travelNotes: "",
      arrivalDate: "",
      arrivalTime: "",
      arrivalFlightCode: "",
      departureDate: "",
      departureTime: "",
      departureFlightCode: "",
    };
    setCustomer((prev) => ({
      ...prev,
      sales: { ...prev.sales, trips: [...prev.sales.trips, newTrip] },
    }));
    
    // History log ekle
    addHistoryLog(
      "trip_added",
      "sales",
      "Seyahat",
      "",
      `${tripNumber}. Seyahat`,
      "Yeni seyahat planı eklendi"
    );
  };

  // Seyahat silme fonksiyonu
  const handleRemoveTrip = (tripId: number) => {
    setCustomer((prev) => ({
      ...prev,
      sales: {
        ...prev.sales,
        trips: prev.sales.trips.filter((t) => t.id !== tripId),
      },
    }));
  };

  // Ödeme seyahati ekleme
  const handleAddPaymentTrip = () => {
    const n = (customer.payment.trips?.length || 0) + 1;
    const newTrip = {
      id: Date.now(),
      name: `${n}. Seyahat`,
      completed: false,
      costs: {
        treatment: "", treatmentCurrency: "GBP",
        transfer: "", transferCurrency: "GBP",
        laboratory: "", laboratoryCurrency: "GBP",
        hotel: "", hotelCurrency: "GBP",
        advertising: "", advertisingCurrency: "GBP",
        other: "", otherCurrency: "GBP",
      },
      sales: { amount: "", currency: "GBP" },
      notes: "",
    };
    setCustomer((prev) => ({
      ...prev,
      payment: { trips: [...(prev.payment.trips || []), newTrip] },
    }));
  };

  // Ödeme seyahati silme
  const handleRemovePaymentTrip = (tripId: number) => {
    setCustomer((prev) => ({
      ...prev,
      payment: { trips: prev.payment.trips.filter((t) => t.id !== tripId) },
    }));
  };

  // Ödeme seyahati güncelleme
  const updatePaymentTrip = (tripIndex: number, updater: (t: any) => any) => {
    setCustomer((prev) => {
      const trips = [...prev.payment.trips];
      trips[tripIndex] = updater(trips[tripIndex]);
      return { ...prev, payment: { trips } };
    });
  };

  // Fiyat değişiklik talebi gönder
  const handlePriceChangeRequest = async () => {
    if (!priceChangeRequest.newPrice || !priceChangeRequest.reason) {
      setSnackbar({ open: true, message: "Lütfen yeni fiyat ve sebep giriniz", severity: "error" });
      return;
    }

    try {
      const emailBody = {
        to: "rapor@xirtiz.com",
        subject: `Fiyat Değişiklik Talebi - ${customer.personal.name}`,
        html: `
          <h2>Fiyat Değişiklik Talebi</h2>
          <p><strong>Hasta:</strong> ${customer.personal.name}</p>
          <p><strong>Hasta ID:</strong> ${customer.id}</p>
          <p><strong>Mevcut Fiyat:</strong> ${customer.sales.price} ${customer.sales.priceCurrency}</p>
          <p><strong>Talep Edilen Fiyat:</strong> ${priceChangeRequest.newPrice} ${customer.sales.priceCurrency}</p>
          <p><strong>Sebep:</strong> ${priceChangeRequest.reason}</p>
          <p><strong>Talep Eden:</strong> ${typeof window !== 'undefined' ? localStorage.getItem("userEmail") : "Bilinmiyor"}</p>
          <p><strong>Tarih:</strong> ${new Date().toLocaleString("tr-TR")}</p>
        `,
      };

      const res = await fetch("/api/settings/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailBody),
      });

      if (res.ok) {
        setSnackbar({ open: true, message: "Fiyat değişiklik talebi gönderildi", severity: "success" });
        setPriceChangeDialogOpen(false);
        setPriceChangeRequest({ newPrice: "", reason: "" });
      } else {
        throw new Error("Email gönderilemedi");
      }
    } catch (error) {
      setSnackbar({ open: true, message: "Talep gönderilemedi", severity: "error" });
    }
  };

  // 8. SATIŞ (yalnızca durum "Satış" olduğunda gösterilecek sekme)
  const renderSalesTab = () => (
    <Stack spacing={3}>
      {/* Satış Bilgileri */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: "text.primary" }}>
          Satış Bilgileri
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              type="date"
              label="Satış Tarihi"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={customer.sales.salesDate}
              onChange={(e) =>
                setCustomer((prev) => ({
                  ...prev,
                  sales: { ...prev.sales, salesDate: e.target.value },
                }))
              }
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              multiline
              rows={5}
              label="Sağlık Notları"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={customer.sales.healthNotes}
              onChange={(e) =>
                setCustomer((prev) => ({
                  ...prev,
                  sales: { ...prev.sales, healthNotes: e.target.value },
                }))
              }
              placeholder="Hastanın sağlık durumu, alerjiler, özel notlar..."
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Fiyat & Depozito */}
      {(() => {
        const SALE_CURRENCIES = [
          { value: "TRY", label: "₺ TL" },
          { value: "EUR", label: "€ Euro" },
          { value: "USD", label: "$ Dolar" },
          { value: "GBP", label: "£ GBP" },
        ];
        const balance = parseFloat(customer.sales.price || "0") - parseFloat(customer.sales.deposit || "0");
        return (
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, borderColor: "#22c55e", borderWidth: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
              <Box sx={{ width: 6, height: 24, bgcolor: "#22c55e", borderRadius: 1 }} />
              <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                Fiyat &amp; Depozito
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              {/* Satış Fiyatı */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Satış Fiyatı
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {customer.sales.priceLocked && (
                      <Typography variant="caption" sx={{ color: "#f59e0b", fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5 }}>
                        🔒 Kilitli
                      </Typography>
                    )}
                    {customer.sales.priceLocked && userRoles.includes("Admin") && (
                      <IconButton
                        size="small"
                        onClick={() => {
                          setCustomer((prev) => ({
                            ...prev,
                            sales: { ...prev.sales, priceLocked: false, priceLockedAt: "" }
                          }));
                          setSnackbar({ open: true, message: "Fiyat kilidi açıldı", severity: "success" });
                        }}
                        sx={{ 
                          color: "#22c55e",
                          '&:hover': { bgcolor: "rgba(34,197,94,0.08)" }
                        }}
                        title="Kilidi Aç (Admin)"
                      >
                        <LockOpenIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Stack>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <TextField
                    size="small"
                    label="Tutar"
                    type="number"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={customer.sales.price}
                    disabled={customer.sales.priceLocked}
                    onChange={(e) => {
                      const newPrice = e.target.value;
                      setCustomer((prev) => ({ 
                        ...prev, 
                        sales: { 
                          ...prev.sales, 
                          price: newPrice,
                          // Fiyat kilitleme işlemi kaldırıldı - manuel kilitleme yapılacak
                          priceLocked: prev.sales.priceLocked,
                          priceLockedAt: prev.sales.priceLockedAt
                        } 
                      }));
                    }}
                    placeholder="0"
                    sx={{
                      '& .MuiInputBase-input.Mui-disabled': {
                        WebkitTextFillColor: 'rgba(0, 0, 0, 0.6)',
                        cursor: 'not-allowed'
                      }
                    }}
                  />
                  {!customer.sales.priceLocked && customer.sales.price && (
                    <IconButton
                      size="small"
                      onClick={() => {
                        setCustomer((prev) => ({
                          ...prev,
                          sales: { 
                            ...prev.sales, 
                            priceLocked: true, 
                            priceLockedAt: new Date().toISOString() 
                          }
                        }));
                        setSnackbar({ open: true, message: "Fiyat kilitlendi", severity: "success" });
                      }}
                      sx={{ 
                        color: "#f59e0b",
                        '&:hover': { bgcolor: "rgba(245,158,11,0.08)" }
                      }}
                      title="Fiyatı Kilitle"
                    >
                      <LockIcon fontSize="small" />
                    </IconButton>
                  )}
                  <FormControl size="small" sx={{ minWidth: 110 }}>
                    <InputLabel shrink>Para Birimi</InputLabel>
                    <Select
                      value={customer.sales.priceCurrency}
                      label="Para Birimi"
                      notched
                      disabled={customer.sales.priceLocked}
                      onChange={(e) =>
                        setCustomer((prev) => ({ ...prev, sales: { ...prev.sales, priceCurrency: e.target.value } }))
                      }
                    >
                      {SALE_CURRENCIES.map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                  {customer.sales.priceLocked && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setPriceChangeDialogOpen(true)}
                      sx={{ 
                        textTransform: "none", 
                        whiteSpace: "nowrap",
                        borderColor: "#f59e0b",
                        color: "#f59e0b",
                        '&:hover': { borderColor: "#d97706", bgcolor: "rgba(245,158,11,0.08)" }
                      }}
                    >
                      Değiştir
                    </Button>
                  )}
                </Stack>
              </Grid>

              {/* Depozito */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1, display: "block", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Depozito
                </Typography>
                <Stack direction="row" spacing={1}>
                  <TextField
                    size="small"
                    label="Tutar"
                    type="number"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={customer.sales.deposit}
                    onChange={(e) =>
                      setCustomer((prev) => ({ ...prev, sales: { ...prev.sales, deposit: e.target.value } }))
                    }
                    placeholder="0"
                  />
                  <FormControl size="small" sx={{ minWidth: 110 }}>
                    <InputLabel shrink>Para Birimi</InputLabel>
                    <Select
                      value={customer.sales.depositCurrency}
                      label="Para Birimi"
                      notched
                      onChange={(e) =>
                        setCustomer((prev) => ({ ...prev, sales: { ...prev.sales, depositCurrency: e.target.value } }))
                      }
                    >
                      {SALE_CURRENCIES.map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Stack>
              </Grid>

              {/* Depozito Durumu */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between"
                  sx={{ borderRadius: 1.5, px: 2, py: 1, border: "1px solid", borderColor: customer.sales.depositPaid ? "#22c55e" : "#f59e0b",
                    bgcolor: customer.sales.depositPaid ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)" }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: customer.sales.depositPaid ? "#22c55e" : "#f59e0b" }} />
                    <Typography variant="body2" fontWeight={600} color={customer.sales.depositPaid ? "success.main" : "warning.main"}>
                      {customer.sales.depositPaid ? "Depozito Ödendi" : "Depozito Bekleniyor"}
                    </Typography>
                  </Stack>
                  <Switch
                    size="small"
                    checked={customer.sales.depositPaid}
                    onChange={(e) =>
                      setCustomer((prev) => ({ ...prev, sales: { ...prev.sales, depositPaid: e.target.checked } }))
                    }
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: 'success.main' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: 'success.main' } }}
                  />
                </Stack>
              </Grid>

              {/* Kalan Bakiye */}
              {customer.sales.price && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between"
                    sx={{ borderRadius: 1.5, px: 2, py: 1, border: "1px solid", borderColor: "#6366f1", bgcolor: "rgba(99,102,241,0.08)" }}
                  >
                    <Typography variant="body2" color="text.secondary">Kalan Bakiye</Typography>
                    <Typography variant="body1" fontWeight={700} color="#6366f1">
                      {balance.toLocaleString("tr-TR", { minimumFractionDigits: 0 })} {SALE_CURRENCIES.find(c => c.value === customer.sales.priceCurrency)?.label.split(" ")[1] || customer.sales.priceCurrency}
                    </Typography>
                  </Stack>
                </Grid>
              )}
            </Grid>
          </Paper>
        );
      })()}

      {/* Müşteri Geri Bildirimleri */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: "text.primary" }}>
          Müşteri Geri Bildirimleri
        </Typography>
        <Stack spacing={1}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography>Trustpilot İncelemesi</Typography>
            <Switch
              checked={customer.sales.feedback.trustpilot}
              onChange={(e) =>
                setCustomer((prev) => ({
                  ...prev,
                  sales: {
                    ...prev.sales,
                    feedback: { ...prev.sales.feedback, trustpilot: e.target.checked },
                  },
                }))
              }
            />
          </Stack>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography>Google İncelemesi</Typography>
            <Switch
              checked={customer.sales.feedback.googleMaps}
              onChange={(e) =>
                setCustomer((prev) => ({
                  ...prev,
                  sales: {
                    ...prev.sales,
                    feedback: { ...prev.sales.feedback, googleMaps: e.target.checked },
                  },
                }))
              }
            />
          </Stack>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography>Memnuniyet Anketi</Typography>
            <Switch
              checked={customer.sales.feedback.survey}
              onChange={(e) =>
                setCustomer((prev) => ({
                  ...prev,
                  sales: {
                    ...prev.sales,
                    feedback: { ...prev.sales.feedback, survey: e.target.checked },
                  },
                }))
              }
            />
          </Stack>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography>Garanti Gönderildi</Typography>
            <Switch
              checked={customer.sales.feedback.warrantySent}
              onChange={(e) =>
                setCustomer((prev) => ({
                  ...prev,
                  sales: {
                    ...prev.sales,
                    feedback: { ...prev.sales.feedback, warrantySent: e.target.checked },
                  },
                }))
              }
            />
          </Stack>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography>RPT</Typography>
            <Switch
              checked={customer.sales.feedback.rpt}
              onChange={(e) =>
                setCustomer((prev) => ({
                  ...prev,
                  sales: {
                    ...prev.sales,
                    feedback: { ...prev.sales.feedback, rpt: e.target.checked },
                  },
                }))
              }
            />
          </Stack>
        </Stack>
      </Paper>

{/* Seyahatler Bölümü */}
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>Seyahatler</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddTrip}
            sx={{ textTransform: 'none', bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
          >
            Seyahat Ekle
          </Button>
        </Stack>

        {customer.sales.trips.length === 0 && (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderStyle: 'dashed' }}>
            <Typography color="text.secondary">
              Henüz seyahat eklenmemiş. Seyahat eklemek için yukarıdaki butona tıklayın.
            </Typography>
          </Paper>
        )}

        {customer.sales.trips.map((trip, index) => (
          <Paper key={trip.id} variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>{trip.name}</Typography>
              <Stack direction="row" spacing={1}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <Select
                    value={trip.dateUndetermined ? "undetermined" : "determined"}
                    onChange={(e) => {
                      const isUndetermined = e.target.value === "undetermined";
                      setCustomer((prev) => {
                        const trips = [...prev.sales.trips];
                        trips[index] = { ...trips[index], dateUndetermined: isUndetermined };
                        return { ...prev, sales: { ...prev.sales, trips } };
                      });
                    }}
                  >
                    <MenuItem value="determined">Seyahat Tarihi Belli</MenuItem>
                    <MenuItem value="undetermined">Seyahat Tarihi Belli Değil</MenuItem>
                  </Select>
                </FormControl>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => {
                    if (confirm(`${trip.name} silinecek. Emin misiniz?`)) {
                      handleRemoveTrip(trip.id);
                    }
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
            </Stack>

            {trip.dateUndetermined && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Bu seyahat için tarih henüz belirlenmemiş. Notlar bölümünü kullanabilirsiniz.
              </Alert>
            )}

            <Stack spacing={2.5}>
              {/* Randevu Bilgileri */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, color: "text.primary" }}>
                  Randevu Bilgileri
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      type="date"
                      label="Randevu Tarihi"
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={trip.appointmentDate}
                      onChange={(e) =>
                        setCustomer((prev) => {
                          const trips = [...prev.sales.trips];
                          trips[index] = { ...trips[index], appointmentDate: e.target.value };
                          return { ...prev, sales: { ...prev.sales, trips } };
                        })
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      type="time"
                      label="Randevu Saati"
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={trip.appointmentTime}
                      onChange={(e) =>
                        setCustomer((prev) => {
                          const trips = [...prev.sales.trips];
                          trips[index] = { ...trips[index], appointmentTime: e.target.value };
                          return { ...prev, sales: { ...prev.sales, trips } };
                        })
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Autocomplete
                      size="small"
                      options={doctorOptions}
                      value={trip.doctor || null}
                      onChange={(_, newValue) =>
                        setCustomer((prev) => {
                          const trips = [...prev.sales.trips];
                          trips[index] = { ...trips[index], doctor: newValue || "" };
                          return { ...prev, sales: { ...prev.sales, trips } };
                        })
                      }
                      renderInput={(params) => (
                        <TextField {...params} label="Doktor" placeholder="Doktor seçin..." />
                      )}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Otel ve Transfer */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, color: "text.primary" }}>
                  Otel ve Transfer
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Autocomplete
                      size="small"
                      options={hotelOptions}
                      value={trip.hotel || null}
                      onChange={(_, newValue) =>
                        setCustomer((prev) => {
                          const trips = [...prev.sales.trips];
                          trips[index] = { ...trips[index], hotel: newValue || "" };
                          return { ...prev, sales: { ...prev.sales, trips } };
                        })
                      }
                      freeSolo
                      renderInput={(params) => (
                        <TextField {...params} label="Otel" placeholder="Otel seçin veya yazın..." />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      label="Oda Tipi"
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={trip.roomType}
                      onChange={(e) =>
                        setCustomer((prev) => {
                          const trips = [...prev.sales.trips];
                          trips[index] = { ...trips[index], roomType: e.target.value };
                          return { ...prev, sales: { ...prev.sales, trips } };
                        })
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      label="Kişi Sayısı"
                      fullWidth
                      size="small"
                      type="number"
                      InputLabelProps={{ shrink: true }}
                      value={trip.peopleCount}
                      onChange={(e) =>
                        setCustomer((prev) => {
                          const trips = [...prev.sales.trips];
                          trips[index] = { ...trips[index], peopleCount: e.target.value };
                          return { ...prev, sales: { ...prev.sales, trips } };
                        })
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Autocomplete
                      size="small"
                      options={transferCompanyOptions}
                      value={trip.transferCompany || null}
                      onChange={(_, newValue) =>
                        setCustomer((prev) => {
                          const trips = [...prev.sales.trips];
                          trips[index] = { ...trips[index], transferCompany: newValue || "" };
                          return { ...prev, sales: { ...prev.sales, trips } };
                        })
                      }
                      renderInput={(params) => (
                        <TextField {...params} label="Transfer Firması" placeholder="Firma seçin..." />
                      )}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Geliş ve Gidiş Bilgileri */}
              {!trip.dateUndetermined && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, color: "text.primary" }}>
                    Geliş ve Gidiş Bilgileri
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        type="date"
                        label="Geliş Tarihi"
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        value={trip.arrivalDate}
                        onChange={(e) =>
                          setCustomer((prev) => {
                            const trips = [...prev.sales.trips];
                            trips[index] = { ...trips[index], arrivalDate: e.target.value };
                            return { ...prev, sales: { ...prev.sales, trips } };
                          })
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        type="time"
                        label="Geliş Saati"
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        value={trip.arrivalTime}
                        onChange={(e) =>
                          setCustomer((prev) => {
                            const trips = [...prev.sales.trips];
                            trips[index] = { ...trips[index], arrivalTime: e.target.value };
                            return { ...prev, sales: { ...prev.sales, trips } };
                          })
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        label="Uçak Kodu (Geliş)"
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        value={trip.arrivalFlightCode}
                        onChange={(e) =>
                          setCustomer((prev) => {
                            const trips = [...prev.sales.trips];
                            trips[index] = { ...trips[index], arrivalFlightCode: e.target.value };
                            return { ...prev, sales: { ...prev.sales, trips } };
                          })
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        type="date"
                        label="Dönüş Tarihi"
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        value={trip.departureDate}
                        onChange={(e) =>
                          setCustomer((prev) => {
                            const trips = [...prev.sales.trips];
                            trips[index] = { ...trips[index], departureDate: e.target.value };
                            return { ...prev, sales: { ...prev.sales, trips } };
                          })
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        type="time"
                        label="Dönüş Saati"
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        value={trip.departureTime}
                        onChange={(e) =>
                          setCustomer((prev) => {
                            const trips = [...prev.sales.trips];
                            trips[index] = { ...trips[index], departureTime: e.target.value };
                            return { ...prev, sales: { ...prev.sales, trips } };
                          })
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        label="Uçak Kodu (Dönüş)"
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        value={trip.departureFlightCode}
                        onChange={(e) =>
                          setCustomer((prev) => {
                            const trips = [...prev.sales.trips];
                            trips[index] = { ...trips[index], departureFlightCode: e.target.value };
                            return { ...prev, sales: { ...prev.sales, trips } };
                          })
                        }
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Notlar */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, color: "text.primary" }}>
                  Notlar
                </Typography>
                <TextField
                  multiline
                  rows={4}
                  label="Seyahat Notları"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={trip.travelNotes}
                  onChange={(e) =>
                    setCustomer((prev) => {
                      const trips = [...prev.sales.trips];
                      trips[index] = { ...trips[index], travelNotes: e.target.value };
                      return { ...prev, sales: { ...prev.sales, trips } };
                    })
                  }
                  placeholder="Seyahat ile ilgili özel notlar, talepler..."
                />
              </Box>
            </Stack>
          </Paper>
        ))}
      </Box>
    </Stack>
  );

  // Zorunlu alan kontrolü (SADECE satış zorunlu - kayıt için)
  const checkRequiredFields = () => {
    const errors: string[] = [];
    
    // Sadece Satış durumundaysa satış bilgileri zorunlu
    const isSalesStatus = customer.status.status === "Satış" || customer.status.status === "Satış Kapalı" || 
        (typeof customer.status.status === "string" && customer.status.status.startsWith("Satış"));
    
    if (isSalesStatus) {
      // Fiyat kontrolü
      if (!customer.sales.price || customer.sales.price.trim() === "") {
        errors.push("sales");
      }
      
      // Seyahat kontrolü
      if (!customer.sales.trips || customer.sales.trips.length === 0) {
        errors.push("sales");
      } else {
        // Tarihi girilmiş seyahatleri bul
        const tripsWithDates = customer.sales.trips.filter(trip => 
          !trip.dateUndetermined && trip.appointmentDate && trip.appointmentDate.trim() !== ""
        );
        
        // Hiç tarih girilmemişse hata
        if (tripsWithDates.length === 0) {
          errors.push("sales");
        } else if (tripsWithDates.length === customer.sales.trips.length) {
          // Tüm seyahatlerin tarihi girilmişse OK (geçmiş/gelecek fark etmez)
        } else {
          // Bazı seyahatlerin tarihi girilmemişse: Gelecek tarihli olmalı
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const upcomingTrips = tripsWithDates.filter(trip => {
            const tripDate = new Date(trip.appointmentDate);
            return tripDate >= today;
          });
          
          // Gelecek tarihli seyahat yoksa hata
          if (upcomingTrips.length === 0) {
            errors.push("sales");
          }
        }
      }
    }
    
    // NOT: Görüşme Notları, Tedavi Notları ve Dosyalar artık zorunlu DEĞİL
    // Kırmızı uyarılar isTabComplete fonksiyonunda gösterilmeye devam ediyor
    
    setValidationErrors(errors);
    return errors.length === 0;
  };
  
  // Sekme doldurulma durumu kontrolü
  const isTabComplete = (tabKey: string) => {
    if (tabKey === "consultationNotes") {
      return customer.consultationNotes && customer.consultationNotes.length > 0;
    }
    if (tabKey === "treatmentNotes") {
      return customer.treatmentNotes?.note && customer.treatmentNotes.note.trim() !== "";
    }
    if (tabKey === "sales") {
      // Fiyat kontrolü
      if (!customer.sales.price || customer.sales.price.trim() === "") {
        return false;
      }
      
      // Seyahat kontrolü - en az 1 seyahat olmalı
      if (!customer.sales.trips || customer.sales.trips.length === 0) {
        return false;
      }
      
      // Tarihi girilmiş seyahatleri bul
      const tripsWithDates = customer.sales.trips.filter(trip => 
        !trip.dateUndetermined && trip.appointmentDate && trip.appointmentDate.trim() !== ""
      );
      
      // Hiç tarih girilmemişse kırmızı
      if (tripsWithDates.length === 0) {
        return false;
      }
      
      // Tüm seyahatlerin tarihi girilmişse yeşil (geçmiş/gelecek fark etmez)
      // Sadece bazı seyahatlerin tarihi girilmişse kontrol et
      if (tripsWithDates.length === customer.sales.trips.length) {
        // Tüm seyahatlerin tarihi girilmiş → YEŞİL
        return true;
      }
      
      // Bazı seyahatlerin tarihi girilmemişse, gelecek tarihli olmalı
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const upcomingTrips = tripsWithDates.filter(trip => {
        const tripDate = new Date(trip.appointmentDate);
        return tripDate >= today;
      });
      
      return upcomingTrips.length > 0;
    }
    if (tabKey === "files") {
      if (!customer.files || customer.files.length === 0) return false;
      
      // Pasaport, Bilet ve Teklif Formu zorunlu
      const hasPassport = customer.files.some(f => f.category === "passport");
      const hasTicket = customer.files.some(f => f.category === "ticket");
      const hasProposal = customer.files.some(f => f.category === "proposal");
      
      return hasPassport && hasTicket && hasProposal;
    }
    return true; // Diğer sekmeler zorunlu değil
  };

  // --- KAYDETME ---
  const handleSave = async () => {
    // Zorunlu alanları kontrol et
    if (!checkRequiredFields()) {
      setSnackbar({
        open: true,
        message: "Satış durumundaki hastalar için fiyat ve gelecek tarihli seyahat bilgisi zorunludur",
        severity: "error",
      });
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        ...customer,
        // Ana liste için düz alanlar
        name: customer.personal.name,
        phone: customer.personal.phone,
        email: customer.personal.email,
        advisor: customer.status.consultant,
        status: customer.status.status,
        service: customer.status.services,
        category: customer.status.category,
        sales: customer.sales,
      };

      const res = await fetch("/api/crm", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok)
        setSnackbar({
          open: true,
          message: t("customerDetail.snackbar.saved"),
          severity: "success",
        });
      else throw new Error("Hata");
    } catch (error) {
      setSnackbar({
        open: true,
        message: t("customerDetail.snackbar.error"),
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  // Helper
  const handleChange = (
    section: keyof CustomerState,
    field: string,
    value: any
  ) => {
    setCustomer((prev) => ({
      ...prev,
      [section]: { ...(prev[section] as any), [field]: value },
    }));
  };

  // Hatırlatıcı input formatı
  const formatReminderInput = (isoString: string) => {
    if (!isoString) return "";
    if (isoString.includes("T") && isoString.length >= 16)
      return isoString.slice(0, 16);

    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return "";
      const offset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    } catch {
      return "";
    }
  };

  // 3. HATIRLATICI SEKMESİ
  const renderReminderTab = () => (
    <Stack spacing={3}>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "background.paper",
          borderColor: "divider",
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <NotificationsNoneIcon
            color={customer.reminder.enabled ? "primary" : "action"}
          />
          <Box>
            <Typography
              fontWeight={500}
              color={customer.reminder.enabled ? "primary" : "text.primary"}
            >
              {t("customerDetail.reminder.status.title")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {customer.reminder.enabled
                ? t("customerDetail.reminder.status.active")
                : t("customerDetail.reminder.status.passive")}
            </Typography>
          </Box>
        </Box>
        <Switch
          checked={customer.reminder.enabled}
          onChange={(e) =>
            handleChange("reminder", "enabled", e.target.checked)
          }
          color="primary"
        />
      </Paper>

      <TextField
        type="datetime-local"
        label={t("customerDetail.reminder.datetime")}
        fullWidth
        value={formatReminderInput(customer.reminder.datetime)}
        onChange={(e) => handleChange("reminder", "datetime", e.target.value)}
        InputLabelProps={{ shrink: true }}
        disabled={!customer.reminder.enabled}
        helperText={t("customerDetail.reminder.datetime.helper")}
      />

      <TextField
        multiline
        rows={4}
        label={t("customerDetail.reminder.message")}
        fullWidth
        value={customer.reminder.notes}
        onChange={(e) => handleChange("reminder", "notes", e.target.value)}
        InputLabelProps={{ shrink: true }}
        disabled={!customer.reminder.enabled}
        placeholder={t("customerDetail.reminder.message.placeholder")}
      />
    </Stack>
  );

  // 4. TELEFON GÖRÜŞMELERİ
  const renderCallsTab = () => (
    <Box>
      <Paper
        sx={{
          p: 5,
          bgcolor: "#1A2035",
          color: "white",
          borderRadius: 3,
          textAlign: "center",
          minHeight: 250,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <Box
          sx={{
            p: 2,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.1)",
            mb: 2,
          }}
        >
          <PhoneIcon sx={{ fontSize: 40 }} />
        </Box>
        <Typography variant="h6" fontWeight="bold">
          {t("customerDetail.calls.title")}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.7, mb: 3 }}>
          {t("customerDetail.calls.subtitle")}
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ bgcolor: "grey.700", "&:hover": { bgcolor: "grey.600" } }}
          onClick={() => {
            const now = new Date();
            const newCall = {
              id: customer.calls.length + 1,
              title: "Telefon Görüşmesi",
              date: now.toLocaleString("tr-TR"),
              notes: "Dashboard'dan takip edilecek.",
            };

            const newReminder = {
              enabled: true,
              datetime: now.toISOString(),
              notes: "Telefon Görüşmesi Yapıldı/Planlandı",
            };

            setCustomer((prev) => ({
              ...prev,
              calls: [newCall, ...prev.calls],
              reminder: newReminder,
            }));

            setSnackbar({
              open: true,
              message: t("customerDetail.snackbar.callAddedFull"),
              severity: "success",
            });
          }}
        >
          {t("customerDetail.calls.button.full")}
        </Button>

        <Fab
          color="success"
          size="small"
          sx={{ position: "absolute", top: 20, right: 20 }}
          onClick={() => {
            const now = new Date();
            const newCall = {
              id: customer.calls.length + 1,
              title: "Telefon Görüşmesi",
              date: now.toLocaleString("tr-TR"),
              notes: "",
            };
            const newReminder = {
              enabled: true,
              datetime: now.toISOString(),
              notes: "Telefon Görüşmesi (Hızlı Ekleme)",
            };

            setCustomer((prev) => ({
              ...prev,
              calls: [newCall, ...prev.calls],
              reminder: newReminder,
            }));
            setSnackbar({
              open: true,
              message: t("customerDetail.snackbar.callAddedQuick"),
              severity: "success",
            });
          }}
        >
          <AddIcon />
        </Fab>
      </Paper>

      {customer.calls.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t("customerDetail.calls.past")}
          </Typography>
          <Stack spacing={1}>
            {customer.calls.map((call, idx) => (
              <Paper key={idx} variant="outlined" sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography fontWeight={600}>{call.title}</Typography>
                  <Typography variant="caption">{call.date}</Typography>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );

  // 5. ÖDEME
  const renderPaymentTab = () => {
    if (!userRoles.includes("Admin")) {
      return (
        <Box sx={{ p: 6, textAlign: "center" }}>
          <Typography color="text.secondary">Bu sekmeye erişim yetkiniz bulunmuyor.</Typography>
        </Box>
      );
    }

    const trips = customer.payment.trips || [];

    // Toplam hesaplama (para birimi bazında)
    const totalCostByCurrency: Record<string, number> = {};
    const totalSalesByCurrency: Record<string, number> = {};
    trips.forEach((trip) => {
      const costRows = [
        { v: trip.costs.treatment, c: trip.costs.treatmentCurrency },
        { v: trip.costs.transfer, c: trip.costs.transferCurrency },
        { v: trip.costs.laboratory, c: trip.costs.laboratoryCurrency },
        { v: trip.costs.hotel, c: trip.costs.hotelCurrency },
        { v: trip.costs.advertising, c: trip.costs.advertisingCurrency },
        { v: trip.costs.other, c: trip.costs.otherCurrency },
      ];
      costRows.forEach(({ v, c }) => {
        const n = parseFloat(v); if (!isNaN(n) && n && c) totalCostByCurrency[c] = (totalCostByCurrency[c] || 0) + n;
      });
      const sn = parseFloat(trip.sales.amount);
      if (!isNaN(sn) && sn && trip.sales.currency) totalSalesByCurrency[trip.sales.currency] = (totalSalesByCurrency[trip.sales.currency] || 0) + sn;
    });

    const costSummary = Object.entries(totalCostByCurrency).map(([c, v]) => `${v.toLocaleString("tr-TR")} ${c}`).join(" + ") || "—";
    const salesSummary = Object.entries(totalSalesByCurrency).map(([c, v]) => `${v.toLocaleString("tr-TR")} ${c}`).join(" + ") || "—";

    const COST_ROWS = [
      { key: "treatment", currKey: "treatmentCurrency", label: "Tedavi Tutarı" },
      { key: "transfer", currKey: "transferCurrency", label: "Transfer Maliyeti" },
      { key: "laboratory", currKey: "laboratoryCurrency", label: "Laboratuvar" },
      { key: "hotel", currKey: "hotelCurrency", label: "Otel" },
      { key: "advertising", currKey: "advertisingCurrency", label: "Reklam Maliyeti" },
      { key: "other", currKey: "otherCurrency", label: "Diğer" },
    ];

    return (
    <Stack spacing={3}>
      {/* Toplam Özet */}
      <Paper variant="outlined" sx={{ p: 0, borderRadius: 2, overflow: "hidden", borderColor: "divider" }}>
        <Box sx={{ px: 2.5, py: 1.5, bgcolor: "#1e293b" }}>
          <Typography variant="subtitle2" fontWeight={700} color="common.white">Toplam Özet</Typography>
        </Box>
        <Grid container>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ px: 2.5, py: 2, borderRight: { md: "1px solid", borderColor: "divider" } }}>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>Toplam Maliyet</Typography>
              <Typography variant="h6" fontWeight={700} color="error.main" sx={{ mt: 0.5 }}>{costSummary}</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ px: 2.5, py: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>Toplam Satış</Typography>
              <Typography variant="h6" fontWeight={700} color="success.main" sx={{ mt: 0.5 }}>{salesSummary}</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Seyahat Ekle */}
      <Stack direction="row" justifyContent="flex-end">
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddPaymentTrip}
          sx={{ textTransform: "none", bgcolor: "#3b82f6", "&:hover": { bgcolor: "#2563eb" } }}>
          Seyahat Ekle
        </Button>
      </Stack>

      {/* Seyahatler */}
      {trips.map((trip, tripIndex) => {
        const tripCost = [
          { v: trip.costs.treatment, c: trip.costs.treatmentCurrency },
          { v: trip.costs.transfer, c: trip.costs.transferCurrency },
          { v: trip.costs.laboratory, c: trip.costs.laboratoryCurrency },
          { v: trip.costs.hotel, c: trip.costs.hotelCurrency },
          { v: trip.costs.advertising, c: trip.costs.advertisingCurrency },
          { v: trip.costs.other, c: trip.costs.otherCurrency },
        ].reduce((s, { v, c }) => { const n = parseFloat(v); return isNaN(n) ? s : s + n; }, 0);
        const tripSales = parseFloat(trip.sales.amount) || 0;

        return (
          <Paper key={trip.id} variant="outlined" sx={{
            borderRadius: 2, overflow: "hidden",
            borderColor: trip.completed ? "success.light" : "divider",
            opacity: trip.completed ? 0.85 : 1,
          }}>
            {/* Trip Header */}
            <Stack direction="row" alignItems="center" justifyContent="space-between"
              sx={{ px: 2.5, py: 1.5, bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider" }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{ width: 6, height: 24, bgcolor: trip.completed ? "success.main" : "primary.main", borderRadius: 1 }} />
                <Typography variant="subtitle1" fontWeight={700}>{trip.name}</Typography>
                {trip.completed && <Box sx={{ px: 1, py: 0.25, bgcolor: "success.main", borderRadius: 1, fontSize: 11, color: "success.contrastText", fontWeight: 600 }}>✓ Gerçekleşti</Box>}
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">Gerçekleşti</Typography>
                  <Switch size="small" checked={trip.completed}
                    onChange={(e) => updatePaymentTrip(tripIndex, (t) => ({ ...t, completed: e.target.checked }))}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: 'success.main' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: 'success.main' } }}
                  />
                </Stack>
                <IconButton size="small" color="error"
                  onClick={() => { if (confirm(`${trip.name} silinecek. Emin misiniz?`)) handleRemovePaymentTrip(trip.id); }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>

            <Box sx={{ p: 2.5 }}>
              <Grid container spacing={2.5}>
                {/* Sol: Maliyet */}
                <Grid size={{ xs: 12, md: 7 }}>
                  <Typography variant="caption" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, color: "error.main", mb: 1, display: "block" }}>
                    Maliyet
                  </Typography>
                  <Stack spacing={1}>
                    {COST_ROWS.map(({ key, currKey, label }) => (
                      <Stack key={key} direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2" sx={{ width: 130, flexShrink: 0, color: "text.primary" }}>{label}</Typography>
                        <TextField size="small" type="number" placeholder="0"
                          sx={{ flex: 1 }} InputLabelProps={{ shrink: true }}
                          value={(trip.costs as any)[key]}
                          onChange={(e) => updatePaymentTrip(tripIndex, (t) => ({ ...t, costs: { ...t.costs, [key]: e.target.value } }))}
                        />
                        <FormControl size="small" sx={{ minWidth: 80 }}>
                          <Select value={(trip.costs as any)[currKey]}
                            onChange={(e) => updatePaymentTrip(tripIndex, (t) => ({ ...t, costs: { ...t.costs, [currKey]: e.target.value } }))}>
                            {CRM_CURRENCIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                          </Select>
                        </FormControl>
                      </Stack>
                    ))}
                  </Stack>
                  {tripCost > 0 && (
                    <Box sx={{ mt: 1.5, px: 1.5, py: 0.75, bgcolor: "error.main", borderRadius: 1, display: "inline-block" }}>
                      <Typography variant="caption" fontWeight={700} color="error.contrastText">Toplam: {tripCost.toLocaleString("tr-TR")}</Typography>
                    </Box>
                  )}
                </Grid>

                {/* Sağ: Satış + Not */}
                <Grid size={{ xs: 12, md: 5 }}>
                  <Typography variant="caption" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, color: "success.main", mb: 1, display: "block" }}>
                    Satış
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <TextField size="small" type="number" label="Tutar" placeholder="0" fullWidth InputLabelProps={{ shrink: true }}
                      value={trip.sales.amount}
                      onChange={(e) => updatePaymentTrip(tripIndex, (t) => ({ ...t, sales: { ...t.sales, amount: e.target.value } }))}
                    />
                    <FormControl size="small" sx={{ minWidth: 80 }}>
                      <InputLabel>Döviz</InputLabel>
                      <Select value={trip.sales.currency} label="Döviz"
                        onChange={(e) => updatePaymentTrip(tripIndex, (t) => ({ ...t, sales: { ...t.sales, currency: e.target.value } }))}>
                        {CRM_CURRENCIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Stack>
                  {tripSales > 0 && (
                    <Box sx={{ mb: 2, px: 1.5, py: 0.75, bgcolor: "success.main", borderRadius: 1, display: "inline-block" }}>
                      <Typography variant="caption" fontWeight={700} color="success.contrastText">Satış: {tripSales.toLocaleString("tr-TR")} {trip.sales.currency}</Typography>
                    </Box>
                  )}

                  <Typography variant="caption" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary", mb: 1, display: "block" }}>
                    Not
                  </Typography>
                  <TextField multiline minRows={4} fullWidth size="small" placeholder="Bu seyahat için notlar..."
                    InputLabelProps={{ shrink: true }}
                    value={trip.notes}
                    onChange={(e) => updatePaymentTrip(tripIndex, (t) => ({ ...t, notes: e.target.value }))}
                  />
                </Grid>
              </Grid>
            </Box>
          </Paper>
        );
      })}
    </Stack>
    );
  };


  // 6. DOSYALAR
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<{ open: boolean; url: string; name: string }>({
    open: false,
    url: "",
    name: ""
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setSelectedFiles(Array.from(files));
    }
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) {
      alert("Lütfen dosya seçin");
      return;
    }

    // Convert files to base64 data URLs
    const filePromises = selectedFiles.map((file, index) => {
      return new Promise<any>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            id: Date.now() + index,
            name: file.name,
            size: `${(file.size / 1024).toFixed(2)} KB`,
            uploadedAt: new Date().toLocaleString("tr-TR"),
            url: e.target?.result as string, // Store the base64 data URL
            category: fileCategory, // Seçili kategori
          });
        };
        reader.readAsDataURL(file);
      });
    });

    const newFiles = await Promise.all(filePromises);

    const updatedCustomer = {
      ...customer,
      files: [...customer.files, ...newFiles],
    };

    setCustomer(updatedCustomer);

    // API'ye kaydet
    try {
      const response = await fetch("/api/crm", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCustomer),
      });

      if (response.ok) {
        // History log ekle
        newFiles.forEach(file => {
          addHistoryLog(
            "file_uploaded",
            "files",
            file.category || "other",
            "",
            file.name,
            `${file.category === "passport" ? "📘 Pasaport" : file.category === "ticket" ? "✈️ Bilet" : file.category === "proposal" ? "📋 Teklif Formu" : "📎 Diğer"} kategorisinde dosya yüklendi`
          );
        });
        
        setSnackbar({
          open: true,
          message: `${selectedFiles.length} dosya yüklendi ve kaydedildi`,
          severity: "success",
        });
      } else {
        throw new Error("Kayıt başarısız");
      }
    } catch (error) {
      console.error("Dosya kaydetme hatası:", error);
      setSnackbar({
        open: true,
        message: "Dosyalar kaydedilemedi",
        severity: "error",
      });
    }

    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileClear = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files) {
      setSelectedFiles(Array.from(files));
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const renderFilesTab = () => {
    const fileCategories = [
      { value: "passport", label: "📘 Pasaport", required: true },
      { value: "ticket", label: "✈️ Bilet", required: true },
      { value: "proposal", label: "📋 Teklif Formu", required: true },
      { value: "other", label: "📎 Diğer", required: false },
    ] as const;

    const getFilesByCategory = (category: string) => {
      if (category === "other") {
        // Diğer: kategorisi olmayan VEYA "other" olan dosyalar
        return customer.files.filter(f => !f.category || f.category === "other");
      }
      return customer.files.filter(f => f.category === category);
    };

    return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />
      
      <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
          Dosya Yükle
        </Typography>
        
        <Stack spacing={2}>
          <FormControl size="small" fullWidth>
            <InputLabel>Dosya Kategorisi</InputLabel>
            <Select
              value={fileCategory}
              label="Dosya Kategorisi"
              onChange={(e) => setFileCategory(e.target.value as any)}
            >
              {fileCategories.map((cat) => (
                <MenuItem key={cat.value} value={cat.value}>
                  {cat.label} {cat.required && <Typography component="span" color="error">*</Typography>}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ bgcolor: "#6366F1" }}
              onClick={() => fileInputRef.current?.click()}
            >
              {t("customerDetail.files.select")}
            </Button>
            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              sx={{ bgcolor: "#818CF8" }}
              onClick={handleFileUpload}
              disabled={selectedFiles.length === 0}
            >
              {t("customerDetail.files.upload")} {selectedFiles.length > 0 && `(${selectedFiles.length})`}
            </Button>
            <Button 
              variant="outlined" 
              color="error"
              onClick={handleFileClear}
              disabled={selectedFiles.length === 0}
            >
              {t("customerDetail.files.cancel")}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {selectedFiles.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Seçilen Dosyalar ({selectedFiles.length})
          </Typography>
          <Stack spacing={1}>
            {selectedFiles.map((file, index) => (
              <Typography key={index} variant="body2" color="text.secondary">
                • {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </Typography>
            ))}
          </Stack>
        </Paper>
      )}

      <Paper
        variant="outlined"
        sx={{
          p: 6,
          borderStyle: "dashed",
          borderWidth: 2,
          borderColor: "divider",
          borderRadius: 3,
          textAlign: "center",
          bgcolor: "background.paper",
          cursor: "pointer",
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <CloudUploadIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          {t("customerDetail.files.dropTitle")}
        </Typography>
        <Typography variant="body2" color="text.disabled">
          {t("customerDetail.files.dropSubtitle")}
        </Typography>
      </Paper>

      {/* Kategorilere Göre Dosyalar */}
      <Stack spacing={3} mt={3}>
        {fileCategories.map((category) => {
          const categoryFiles = getFilesByCategory(category.value);
          const hasFiles = categoryFiles.length > 0;
          
          return (
            <Paper 
              key={category.value} 
              variant="outlined" 
              sx={{ 
                p: 2.5, 
                borderRadius: 2,
                borderColor: category.required && !hasFiles ? "#ef4444" : hasFiles ? "#22c55e" : "divider",
                borderWidth: category.required ? 2 : 1,
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {category.label}
                  </Typography>
                  {category.required && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: hasFiles ? "#22c55e" : "#ef4444",
                        fontWeight: 700,
                        fontSize: 12
                      }}
                    >
                      {hasFiles ? "✓" : "*"}
                    </Typography>
                  )}
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {categoryFiles.length} dosya
                </Typography>
              </Stack>
              
              {categoryFiles.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                  {category.required ? "Zorunlu - Dosya yüklenmemiş" : "Dosya yüklenmemiş"}
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {categoryFiles.map((file) => {
              const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(file.name);
              
              return (
                <Paper key={file.id} variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box 
                      sx={{ 
                        flex: 1,
                        cursor: isImage ? 'pointer' : 'default',
                        '&:hover': isImage ? { opacity: 0.7 } : {}
                      }}
                      onClick={() => {
                        if (isImage && file.url) {
                          setImagePreview({ open: true, url: file.url, name: file.name });
                        }
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        {isImage && <VisibilityIcon fontSize="small" color="primary" />}
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {file.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {file.size} • {file.uploadedAt}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      {/* İndirme Butonu */}
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => {
                          if (file.url) {
                            const link = document.createElement('a');
                            link.href = file.url;
                            link.download = file.name;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          } else {
                            alert('Bu dosya indirilemez. Dosya içeriği kaydedilmemiş. Lütfen dosyayı yeniden yükleyin.');
                          }
                        }}
                        title="İndir"
                        disabled={!file.url}
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                      
                      {/* Silme Butonu */}
                      <IconButton
                        size="small"
                        color="error"
                        onClick={async () => {
                          const fileToDelete = file;
                          const updatedCustomer = {
                            ...customer,
                            files: customer.files.filter((f) => f.id !== file.id),
                          };
                          
                          setCustomer(updatedCustomer);
                          
                          // API'ye kaydet
                          try {
                            await fetch("/api/crm", {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(updatedCustomer),
                            });
                            
                            // History log ekle
                            addHistoryLog(
                              "file_deleted",
                              "files",
                              fileToDelete.category || "other",
                              fileToDelete.name,
                              "",
                              `${fileToDelete.category === "passport" ? "📘 Pasaport" : fileToDelete.category === "ticket" ? "✈️ Bilet" : fileToDelete.category === "proposal" ? "📋 Teklif Formu" : "📎 Diğer"} kategorisinden dosya silindi`
                            );
                            
                            setSnackbar({
                              open: true,
                              message: "Dosya silindi",
                              severity: "success",
                            });
                          } catch (error) {
                            console.error("Dosya silme hatası:", error);
                            setSnackbar({
                              open: true,
                              message: "Dosya silinemedi",
                              severity: "error",
                            });
                          }
                        }}
                        title="Sil"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Paper>
              );
            })}
                </Stack>
              )}
            </Paper>
          );
        })}
      </Stack>
    </Box>
    );
  };

  // 9. MALİYETLER
  const renderCostsTab = () => (
    <PatientCostsTab patientId={(params as any)?.id?.toString()} patientName={customer.personal.name} />
  );

  // 7. GEÇMİŞ
  const renderHistoryTab = () => {
    const getActionIcon = (action: string) => {
      switch (action) {
        case "created": return "🆕";
        case "updated": return "✏️";
        case "status_changed": return "🔄";
        case "note_added": return "📝";
        case "file_uploaded": return "📎";
        case "file_deleted": return "🗑️";
        case "call_added": return "📞";
        case "trip_added": return "✈️";
        case "trip_updated": return "🛫";
        case "price_locked": return "🔒";
        case "price_change_requested": return "💰";
        default: return "📋";
      }
    };

    const getActionColor = (action: string) => {
      switch (action) {
        case "created": return "#22c55e";
        case "updated": return "#3b82f6";
        case "status_changed": return "#f59e0b";
        case "note_added": return "#8b5cf6";
        case "file_uploaded": return "#06b6d4";
        case "file_deleted": return "#ef4444";
        case "call_added": return "#ec4899";
        case "trip_added": return "#14b8a6";
        case "price_locked": return "#f59e0b";
        default: return "#6b7280";
      }
    };

    const getSectionLabel = (section: string) => {
      const labels: Record<string, string> = {
        personal: "Kişisel Bilgiler",
        status: "Durum Bilgileri",
        sales: "Satış Bilgileri",
        files: "Dosyalar",
        calls: "Aramalar",
        consultationNotes: "Görüşme Notları",
        treatmentNotes: "Tedavi Notları",
        payment: "Ödeme Bilgileri",
        reminder: "Hatırlatıcı",
      };
      return labels[section] || section;
    };

    return (
      <Stack spacing={2}>
        {customer.history.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Henüz değişiklik kaydı bulunmuyor
            </Typography>
          </Paper>
        ) : (
          customer.history.map((log) => (
            <Paper 
              key={log.id} 
              variant="outlined" 
              sx={{ 
                p: 2.5, 
                borderRadius: 2,
                borderLeft: `4px solid ${getActionColor(log.action)}`,
                transition: "all 0.2s",
                '&:hover': {
                  boxShadow: 2,
                  transform: "translateX(4px)"
                }
              }}
            >
              {/* Header */}
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography fontSize={20}>{getActionIcon(log.action)}</Typography>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ color: getActionColor(log.action) }}>
                    {getSectionLabel(log.section)}
                  </Typography>
                  {log.field && (
                    <Typography variant="caption" sx={{ 
                      bgcolor: "rgba(0,0,0,0.05)", 
                      px: 1, 
                      py: 0.5, 
                      borderRadius: 1,
                      fontWeight: 600
                    }}>
                      {log.field}
                    </Typography>
                  )}
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <AccessTimeIcon fontSize="small" sx={{ color: "text.secondary", fontSize: 16 }} />
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    {log.date}
                  </Typography>
                </Stack>
              </Stack>

              {/* User */}
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1.5 }}>
                <Avatar sx={{ width: 20, height: 20, fontSize: 10, bgcolor: getActionColor(log.action) }}>
                  {log.user.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="caption" color="text.secondary">
                  {log.user}
                </Typography>
              </Stack>

              {/* Details */}
              {log.details && (
                <Typography variant="body2" sx={{ mb: 1.5, fontStyle: "italic", color: "text.secondary" }}>
                  {log.details}
                </Typography>
              )}

              {/* Old/New Values */}
              {(log.oldValue || log.newValue) && (
                <Grid container spacing={2}>
                  {log.oldValue && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Paper sx={{ p: 1.5, bgcolor: "rgba(239, 68, 68, 0.1)", borderRadius: 1 }}>
                        <Typography variant="caption" fontWeight={600} color="error.main" sx={{ display: "block", mb: 0.5 }}>
                          Eski Değer
                        </Typography>
                        <Typography variant="body2" color="text.primary">
                          {log.oldValue || "-"}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                  {log.newValue && (
                    <Grid size={{ xs: 12, md: log.oldValue ? 6 : 12 }}>
                      <Paper sx={{ p: 1.5, bgcolor: "rgba(34, 197, 94, 0.1)", borderRadius: 1 }}>
                        <Typography variant="caption" fontWeight={600} color="success.main" sx={{ display: "block", mb: 0.5 }}>
                          Yeni Değer
                        </Typography>
                        <Typography variant="body2" color="text.primary">
                          {log.newValue || "-"}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              )}
            </Paper>
          ))
        )}
      </Stack>
    );
  };

  // 1. KİŞİSEL BİLGİLER
  const renderPersonalTab = () => (
    <Stack spacing={3}>
      {/* 1. Satır: Ad Soyad ve Telefon */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: "text.primary" }}>
          İletişim Bilgileri
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label={t("customerDetail.personal.name")}
              fullWidth
              value={customer.personal.name}
              onChange={(e) => handleChange("personal", "name", e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label={t("customerDetail.personal.phone")}
              fullWidth
              value={customer.personal.phone}
              onChange={(e) => {
                const phone = e.target.value;
                handleChange("personal", "phone", phone);
                
                // Telefon numarasından ülke tespiti
                if (phone) {
                  const digits = phone.replace(/\D/g, "");
                  let detectedCountry = "";
                  
                  if (digits.startsWith("90")) detectedCountry = "Türkiye";
                  else if (digits.startsWith("44")) detectedCountry = "United Kingdom";
                  else if (digits.startsWith("49")) detectedCountry = "Germany";
                  else if (digits.startsWith("33")) detectedCountry = "France";
                  else if (digits.startsWith("31")) detectedCountry = "Netherlands";
                  else if (digits.startsWith("32")) detectedCountry = "Belgium";
                  else if (digits.startsWith("43")) detectedCountry = "Austria";
                  else if (digits.startsWith("41")) detectedCountry = "Switzerland";
                  else if (digits.startsWith("48")) detectedCountry = "Poland";
                  else if (digits.startsWith("45")) detectedCountry = "Denmark";
                  else if (digits.startsWith("46")) detectedCountry = "Sweden";
                  else if (digits.startsWith("47")) detectedCountry = "Norway";
                  else if (digits.startsWith("353")) detectedCountry = "Ireland";
                  else if (digits.startsWith("39")) detectedCountry = "Italy";
                  else if (digits.startsWith("34")) detectedCountry = "Spain";
                  else if (digits.startsWith("351")) detectedCountry = "Portugal";
                  else if (digits.startsWith("30")) detectedCountry = "Greece";
                  else if (digits.startsWith("1")) detectedCountry = "USA";
                  else if (digits.startsWith("61")) detectedCountry = "Australia";
                  else if (digits.startsWith("98")) detectedCountry = "Iran";
                  else if (digits.startsWith("964")) detectedCountry = "Iraq";
                  else if (digits.startsWith("966")) detectedCountry = "Saudi Arabia";
                  else if (digits.startsWith("971")) detectedCountry = "UAE";
                  else if (digits.startsWith("974")) detectedCountry = "Qatar";
                  else if (digits.startsWith("965")) detectedCountry = "Kuwait";
                  else if (digits.startsWith("973")) detectedCountry = "Bahrain";
                  else if (digits.startsWith("968")) detectedCountry = "Oman";
                  else if (digits.startsWith("77")) detectedCountry = "Kazakhstan";
                  else if (digits.startsWith("993")) detectedCountry = "Turkmenistan";
                  else if (digits.startsWith("996")) detectedCountry = "Kyrgyzstan";
                  else if (digits.startsWith("998")) detectedCountry = "Uzbekistan";
                  else if (digits.startsWith("7")) detectedCountry = "Russia";
                  else if (digits.startsWith("380")) detectedCountry = "Ukraine";
                  else if (digits.startsWith("40")) detectedCountry = "Romania";
                  else if (digits.startsWith("359")) detectedCountry = "Bulgaria";
                  else if (digits.startsWith("420")) detectedCountry = "Czech Republic";
                  else if (digits.startsWith("36")) detectedCountry = "Hungary";
                  else if (digits.startsWith("358")) detectedCountry = "Other"; // Finlandiya
                  
                  if (detectedCountry && !customer.personal.country) {
                    handleChange("personal", "country", detectedCountry);
                  }
                }
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* 2. Satır: E-posta ve Ülke */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label={t("customerDetail.personal.email")}
              fullWidth
              value={customer.personal.email}
              onChange={(e) => handleChange("personal", "email", e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Autocomplete
              options={CRM_COUNTRIES}
              value={customer.personal.country || null}
              onChange={(_, newValue) => handleChange("personal", "country", newValue || "")}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label={t("customerDetail.personal.country")}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* 3. Satır: Kayıt Tarihi ve Saati */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: "text.primary" }}>
          Kayıt Bilgileri
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 12 }}>
            <TextField
              type="datetime-local"
              label="Kayıt Tarihi ve Saati"
              fullWidth
              value={customer.createdAt ? 
                (() => {
                  try {
                    const d = new Date(customer.createdAt);
                    if (isNaN(d.getTime())) return "";
                    return d.toISOString().slice(0, 16);
                  } catch { return ""; }
                })() : ""
              }
              onChange={(e) => {
                const newDateTime = e.target.value;
                if (newDateTime) {
                  const isoString = new Date(newDateTime).toISOString();
                  setCustomer((prev) => ({
                    ...prev,
                    createdAt: isoString,
                  }));
                }
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* 4. Satır: Notlar */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: "text.primary" }}>
          Notlar
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={3}
          label={t("customerDetail.personal.notes")}
          value={customer.personal.notes}
          onChange={(e) => handleChange("personal", "notes", e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Paper>

      {/* 5. Satır: Reklam Bilgileri (Facebook) */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Stack direction="row" spacing={1} mb={2} alignItems="center">
          <FacebookIcon color="primary" />
          <Typography variant="subtitle2" fontWeight={600} color="text.primary">
            {t("customerDetail.facebook.title")}
          </Typography>
        </Stack>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              label={t("customerDetail.facebook.adName")}
              value={customer.personal.facebook.adName}
              onChange={(e) =>
                setCustomer((p) => ({
                  ...p,
                  personal: {
                    ...p.personal,
                    facebook: {
                      ...p.personal.facebook,
                      adName: e.target.value,
                    },
                  },
                }))
              }
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="Reklam Grubu"
              value={customer.personal.facebook.adGroupName}
              onChange={(e) =>
                setCustomer((p) => ({
                  ...p,
                  personal: {
                    ...p.personal,
                    facebook: {
                      ...p.personal.facebook,
                      adGroupName: e.target.value,
                    },
                  },
                }))
              }
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="Kampanya Adı"
              value={customer.personal.facebook.campaignName}
              onChange={(e) =>
                setCustomer((p) => ({
                  ...p,
                  personal: {
                    ...p.personal,
                    facebook: {
                      ...p.personal.facebook,
                      campaignName: e.target.value,
                    },
                  },
                }))
              }
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              label={t("customerDetail.facebook.formId")}
              value={customer.personal.facebook.leadFormId}
              disabled
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>
    </Stack>
  );

  // 2. DURUM BİLGİLERİ
  const renderStatusTab = () => (
    <Stack spacing={3}>
      {/* 1. Satır: Danışman ve Kategori */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: "text.primary" }}>
          Atama Bilgileri
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Autocomplete
              options={advisorOptions}
              value={customer.status.consultant || null}
              onChange={(_, newValue) => handleChange("status", "consultant", newValue || "")}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label={t("customerDetail.status.consultant")}
                  placeholder="Danışman seçin..."
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Autocomplete
              options={(() => {
                const catById: Record<string, any> = {};
                categoriesData.forEach((c: any) => { catById[c.id] = c; });
                const getPath = (cat: any): string => {
                  if (!cat.parentId) return cat.name;
                  const parent = catById[cat.parentId];
                  if (!parent) return cat.name;
                  return getPath(parent) + ' > ' + cat.name;
                };
                return [...categoriesData].sort((a: any, b: any) => {
                  const ta = a.topParent || '';
                  const tb = b.topParent || '';
                  if (ta !== tb) return ta.localeCompare(tb);
                  return getPath(a).localeCompare(getPath(b));
                });
              })()}
              groupBy={(option: any) => option.topParent || ''}
              getOptionLabel={(option: any) => {
                if (typeof option === 'string') return option;
                const catById: Record<string, any> = {};
                categoriesData.forEach((c: any) => { catById[c.id] = c; });
                const getDepth = (cat: any, d = 0): number => cat.parentId && catById[cat.parentId] ? getDepth(catById[cat.parentId], d + 1) : d;
                const depth = getDepth(option);
                return '  '.repeat(depth) + option.name;
              }}
              value={categoriesData.find((c: any) => c.name === customer.status.category) || null}
              onChange={(_, newValue: any) => handleChange("status", "category", newValue?.name || "")}
              isOptionEqualToValue={(option: any, value: any) => option.id === value?.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t("customerDetail.status.category")}
                  placeholder="Kategori seçin..."
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* 2. Satır: Hizmet ve Durum */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: "text.primary" }}>
          Hizmet ve Durum Bilgileri
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Autocomplete
              options={serviceOptions}
              value={customer.status.services || null}
              onChange={(_, newValue) => {
                handleChange("status", "services", newValue || "");
                // Hizmet seçildiğinde ve durum "Yeni Form" veya boşsa, otomatik "Teklif Yollandı" yap
                if (newValue && (!customer.status.status || customer.status.status === 'Yeni Form' || customer.status.status === 'Seçiniz')) {
                  handleChange("status", "status", "Teklif Yollandı");
                }
              }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label={t("customerDetail.status.services")}
                  placeholder="Hizmet seçin..."
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Autocomplete
              options={statusOptions}
              value={customer.status.status || null}
              onChange={(_, newValue) => {
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
                
                if (newValue && TEKLIF_STAGES.includes(newValue)) {
                  const hasService = customer.status.services && customer.status.services.trim() !== '';
                  if (!hasService) {
                    setSnackbar({
                      open: true,
                      message: "⚠️ Önce hizmet seçmelisiniz! Teklif aşamalarına geçmek için hizmet alanı zorunludur.",
                      severity: "error"
                    });
                    return;
                  }
                }
                
                handleChange("status", "status", newValue || "");
              }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label={t("customerDetail.status.status")}
                  placeholder="Durum seçin..."
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>
        </Grid>
      </Paper>
    </Stack>
  );

  // 10. HASTA GÖRÜŞME NOTLARI
  const renderConsultationNotesTab = () => (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" fontWeight={600}>Hasta Görüşme Notları</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            const newNote = { id: Date.now(), date: new Date().toISOString().slice(0, 10), note: "" };
            setCustomer((prev) => ({
              ...prev,
              consultationNotes: [newNote, ...prev.consultationNotes],
            }));
            
            // History log ekle
            addHistoryLog(
              "note_added",
              "consultationNotes",
              "Görüşme Notu",
              "",
              new Date().toLocaleDateString("tr-TR"),
              "Yeni görüşme notu eklendi"
            );
          }}
          sx={{ textTransform: "none", bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" } }}
        >
          Yeni Not Ekle
        </Button>
      </Stack>

      {customer.consultationNotes.length === 0 && (
        <Paper variant="outlined" sx={{ p: 4, textAlign: "center", borderStyle: "dashed" }}>
          <Typography color="text.secondary">Henüz görüşme notu eklenmemiş.</Typography>
        </Paper>
      )}

      {customer.consultationNotes.map((cn, index) => (
        <Paper key={cn.id} variant="outlined" sx={{ p: 2.5, borderRadius: 2, borderLeft: "4px solid #6366f1" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
            <TextField
              type="date"
              label="Tarih"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={cn.date}
              onChange={(e) =>
                setCustomer((prev) => {
                  const notes = [...prev.consultationNotes];
                  notes[index] = { ...notes[index], date: e.target.value };
                  return { ...prev, consultationNotes: notes };
                })
              }
              sx={{ width: 180 }}
            />
            <IconButton
              size="small"
              color="error"
              onClick={() =>
                setCustomer((prev) => ({
                  ...prev,
                  consultationNotes: prev.consultationNotes.filter((n) => n.id !== cn.id),
                }))
              }
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
          <TextField
            multiline
            minRows={3}
            maxRows={10}
            label="Not"
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            value={cn.note}
            onChange={(e) =>
              setCustomer((prev) => {
                const notes = [...prev.consultationNotes];
                notes[index] = { ...notes[index], note: e.target.value };
                return { ...prev, consultationNotes: notes };
              })
            }
            placeholder="Görüşme detayları, hasta talepleri, konuşulan konular..."
          />
        </Paper>
      ))}
    </Stack>
  );

  // 11. TEDAVİ NOTLARI
  const renderTreatmentNotesTab = () => (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box sx={{ width: 6, height: 28, bgcolor: "#f59e0b", borderRadius: 1 }} />
        <Typography variant="h6" fontWeight={600}>Tedavi Notları</Typography>
      </Stack>
      <Paper
        variant="outlined"
        sx={{ p: 2.5, borderRadius: 2, borderColor: "#fcd34d" }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block", fontStyle: "italic" }}>
          Bu bölüm ilerleyen süreçte geliştirilecektir.
        </Typography>
        <TextField
          multiline
          minRows={10}
          maxRows={30}
          label="Tedavi Notları"
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={customer.treatmentNotes.note}
          onChange={(e) =>
            setCustomer((prev) => ({
              ...prev,
              treatmentNotes: { note: e.target.value },
            }))
          }
          placeholder="Tedavi planı, uygulanan prosedürler, özel notlar..."
          sx={{ borderRadius: 1 }}
        />
      </Paper>
    </Stack>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "personal":
        return renderPersonalTab();
      case "status":
        return renderStatusTab();
      case "reminder":
        return renderReminderTab();
      case "calls":
        return renderCallsTab();
      case "payment":
        return renderPaymentTab();
      case "files":
        return renderFilesTab();
      case "history":
        return renderHistoryTab();
      case "sales":
        return renderSalesTab();
      case "costs":
        return renderCostsTab();
      case "consultationNotes":
        return renderConsultationNotesTab();
      case "treatmentNotes":
        return renderTreatmentNotesTab();
      default:
        return null;
    }
  };

  if (loading)
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        bgcolor: "background.default",
        overflow: "hidden",
      }}
    >
      {/* Sidebar */}
      <Box
        sx={{
          width: 280,
          bgcolor: "#151827",
          color: "#e5e7eb",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: "#6c5dd3",
              fontSize: "2rem",
              fontWeight: "bold",
              mb: 1.5,
              mx: "auto",
            }}
          >
            {customer.personal.name
              ? customer.personal.name.charAt(0).toUpperCase()
              : "?"}
          </Avatar>
          <Typography sx={{ fontWeight: 600 }}>
            {customer.personal.name}
          </Typography>
          <Stack
            spacing={0.5}
            mt={1.5}
            sx={{ fontSize: 12, opacity: 0.8 }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 1,
              }}
            >
              <EmailIcon fontSize="small" />{" "}
              {customer.personal.email || "-"}
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 1,
              }}
            >
              <PhoneIcon fontSize="small" />{" "}
              {customer.personal.phone || "-"}
            </Box>
          </Stack>
        </Box>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
        <List sx={{ mt: 1 }}>
          {[
            "personal",
            "status",
            "consultationNotes",
            "treatmentNotes",
            ...((customer.status.status === "Satış" || customer.status.status === "Satış Kapalı" || (typeof customer.status.status === "string" && customer.status.status.startsWith("Satış"))) ? ["sales"] : []),
            "reminder",
            "calls",
            ...(userRoles.includes("Admin") ? ["payment"] : []),
            "files",
            "history",
            "costs",
          ].map((key) => {
            const labelKey =
              key === "personal"
                ? "customerDetail.tabs.personal"
                : key === "status"
                ? "customerDetail.tabs.status"
                : key === "sales"
                ? "customerDetail.tabs.sales"
                : key === "reminder"
                ? "customerDetail.tabs.reminder"
                : key === "calls"
                ? "customerDetail.tabs.calls"
                : key === "payment"
                ? "customerDetail.tabs.payment"
                : key === "files"
                ? "customerDetail.tabs.files"
                : key === "costs"
                ? "customerDetail.tabs.costs"
                : key === "consultationNotes"
                ? "customerDetail.tabs.consultationNotes"
                : key === "treatmentNotes"
                ? "customerDetail.tabs.treatmentNotes"
                : "customerDetail.tabs.history";
            const label = t(labelKey);
            const isComplete = isTabComplete(key);
            const isRequired = ["consultationNotes", "treatmentNotes", "sales", "files"].includes(key);
            const shouldShowSales = customer.status.status === "Satış" || customer.status.status === "Satış Kapalı" || 
                                    (typeof customer.status.status === "string" && customer.status.status.startsWith("Satış"));
            const isRequiredAndVisible = isRequired && (key !== "sales" || shouldShowSales);
            
            return (
            <ListItemButton
              key={key}
              onClick={() => {
                // Sekme değiştirirken uyarı gösterme, direkt geçiş yap
                setActiveTab(key);
              }}
              sx={{
                pl: 3,
                py: 1.5,
                borderLeft:
                  activeTab === key
                    ? "4px solid #28C76F"
                    : isRequiredAndVisible && !isComplete
                    ? "4px solid #ef4444"
                    : isRequiredAndVisible && isComplete
                    ? "4px solid #22c55e"
                    : "4px solid transparent",
                bgcolor:
                  activeTab === key
                    ? "rgba(255,255,255,0.05)"
                    : "transparent",
              }}
            >
              <ListItemIcon sx={{ 
                color: isRequiredAndVisible && !isComplete ? "#ef4444" : isRequiredAndVisible && isComplete ? "#22c55e" : "#e5e7eb", 
                minWidth: 36 
              }}>
                {key === "personal" ? (
                  <PersonIcon />
                ) : key === "status" ? (
                  <FavoriteBorderIcon />
                ) : key === "consultationNotes" ? (
                  <ChatBubbleOutlineIcon />
                ) : key === "treatmentNotes" ? (
                  <HealingIcon />
                ) : key === "sales" ? (
                  <ShoppingCartIcon />
                ) : key === "reminder" ? (
                  <NotificationsNoneIcon />
                ) : key === "calls" ? (
                  <PhoneIcon />
                ) : key === "payment" ? (
                  <CreditCardIcon />
                ) : key === "files" ? (
                  <FolderOpenIcon />
                ) : key === "costs" ? (
                  <AttachMoneyIcon />
                ) : (
                  <HistoryIcon />
                )}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography fontSize={14}>{label}</Typography>
                    {isRequiredAndVisible && (
                      <Typography 
                        fontSize={10} 
                        sx={{ 
                          color: isComplete ? "#22c55e" : "#ef4444",
                          fontWeight: 700
                        }}
                      >
                        {isComplete ? "✓" : "*"}
                      </Typography>
                    )}
                  </Stack>
                }
              />
            </ListItemButton>
          );})}
        </List>
        <Box sx={{ mt: "auto", p: 3 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
            sx={{
              bgcolor: "success.main",
              py: 1,
              "&:hover": { bgcolor: "#16a34a" },
            }}
          >
            {saving
              ? t("customerDetail.sidebar.save.saving")
              : t("customerDetail.sidebar.save.idle")}
          </Button>
        </Box>
      </Box>

      {/* Sağ Taraf */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflowY: "auto",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 2,
            px: 3,
            bgcolor: "background.paper",
            borderBottom: "1px solid", borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => {
              if (!checkRequiredFields()) {
                setPendingNavigation("/customers");
                setShowExitWarning(true);
              } else {
                router.push("/customers");
              }
            }}
            sx={{ textTransform: "none", color: "text.secondary" }}
          >
            {t("customerDetail.header.back")}
          </Button>
          <Typography variant="caption" color="text.secondary">
            ID: {(params as any)?.id}
          </Typography>
        </Paper>
        <Box sx={{ p: 4, maxWidth: 1200, mx: "auto", width: "100%" }}>
          <Paper
            elevation={0}
            sx={{
              mb: 2,
              p: 2,
              borderRadius: 3,
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                bgcolor: "#f3f4ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#6366f1",
              }}
            >
              {activeTab === "reminder" ? (
                <NotificationsNoneIcon />
              ) : (
                <PersonIcon />
              )}
            </Box>
            <Box>
              <Typography fontWeight={600}>
                {activeTab === "personal"
                  ? t("customerDetail.tabs.personal")
                  : activeTab === "status"
                  ? t("customerDetail.tabs.status")
                  : activeTab === "sales"
                  ? t("customerDetail.tabs.sales")
                  : activeTab === "reminder"
                  ? t("customerDetail.tabs.reminder")
                  : activeTab === "calls"
                  ? t("customerDetail.tabs.calls")
                  : activeTab === "payment"
                  ? t("customerDetail.tabs.payment")
                  : activeTab === "files"
                  ? t("customerDetail.tabs.files")
                  : activeTab === "costs"
                  ? "Maliyetler"
                  : activeTab === "consultationNotes"
                  ? "Hasta Görüşme Notları"
                  : activeTab === "treatmentNotes"
                  ? "Tedavi Notları"
                  : t("customerDetail.tabs.history")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t("customerDetail.header.helper")}
              </Typography>
            </Box>
          </Paper>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              minHeight: 400,
            }}
          >
            {renderContent()}
          </Paper>
        </Box>
      </Box>

      {/* Sayfa Ayrılma Uyarısı Dialog */}
      <Dialog
        open={showExitWarning}
        onClose={() => setShowExitWarning(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#ef4444" }}>
          ⚠️ Zorunlu Alanlar Eksik
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Doldurulması zorunlu alanları tamamlamadan sayfadan ayrılırsanız <strong>bilgileriniz kaybedilecektir</strong>.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Eksik alanlar:
          </Typography>
          <Stack spacing={0.5} sx={{ mt: 1, pl: 2 }}>
            {!customer.consultationNotes || customer.consultationNotes.length === 0 ? (
              <Typography variant="body2" color="error">• Görüşme Notları</Typography>
            ) : null}
            {!customer.treatmentNotes?.note || customer.treatmentNotes.note.trim() === "" ? (
              <Typography variant="body2" color="error">• Tedavi Notları</Typography>
            ) : null}
            {(customer.status.status === "Satış" || customer.status.status === "Satış Kapalı" || 
              (typeof customer.status.status === "string" && customer.status.status.startsWith("Satış"))) && 
              !isTabComplete("sales") ? (
              <Typography variant="body2" color="error">• Satış (Fiyat + Seyahat)</Typography>
            ) : null}
            {!isTabComplete("files") ? (
              <Typography variant="body2" color="error">• Dosyalar (Pasaport + Bilet + Teklif Formu)</Typography>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => {
              setShowExitWarning(false);
              if (pendingNavigation) {
                // Eğer URL ise router.push, sekme ise setActiveTab kullan
                if (pendingNavigation.startsWith('/')) {
                  router.push(pendingNavigation);
                } else {
                  setActiveTab(pendingNavigation);
                }
                setPendingNavigation(null);
              }
            }}
            variant="outlined"
            color="error"
            sx={{ textTransform: "none" }}
          >
            Yine de Ayrıl
          </Button>
          <Button
            onClick={() => {
              setShowExitWarning(false);
              setPendingNavigation(null);
            }}
            variant="contained"
            sx={{ 
              textTransform: "none",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              '&:hover': { background: "linear-gradient(135deg, #16a34a, #15803d)" }
            }}
          >
            Kaldım, Dolduracağım
          </Button>
        </DialogActions>
      </Dialog>

      {/* Fiyat Değişiklik Talebi Dialog */}
      <Dialog 
        open={priceChangeDialogOpen} 
        onClose={() => setPriceChangeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #E5E7EB" }}>
          Fiyat Değişiklik Talebi
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Mevcut Fiyat: <strong>{customer.sales.price} {customer.sales.priceCurrency}</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Fiyat kilitlenmiştir. Değişiklik için talep gönderebilirsiniz.
              </Typography>
            </Box>
            
            <TextField
              label="Yeni Fiyat"
              type="number"
              fullWidth
              value={priceChangeRequest.newPrice}
              onChange={(e) => setPriceChangeRequest({ ...priceChangeRequest, newPrice: e.target.value })}
              InputLabelProps={{ shrink: true }}
              placeholder={customer.sales.price}
            />
            
            <TextField
              label="Değişiklik Sebebi"
              multiline
              rows={4}
              fullWidth
              value={priceChangeRequest.reason}
              onChange={(e) => setPriceChangeRequest({ ...priceChangeRequest, reason: e.target.value })}
              InputLabelProps={{ shrink: true }}
              placeholder="Fiyat değişikliği neden gerekli?"
            />
            
            <Alert severity="info" sx={{ fontSize: "0.85rem" }}>
              Talebiniz <strong>rapor@xirtiz.com</strong> adresine gönderilecektir. Admin onayından sonra fiyat güncellenebilir.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #E5E7EB" }}>
          <Button 
            onClick={() => {
              setPriceChangeDialogOpen(false);
              setPriceChangeRequest({ newPrice: "", reason: "" });
            }}
            sx={{ textTransform: "none" }}
          >
            İptal
          </Button>
          <Button 
            onClick={handlePriceChangeRequest}
            variant="contained"
            sx={{ 
              textTransform: "none",
              background: "linear-gradient(135deg, #7C3AED, #9F67FF)",
              '&:hover': { background: "linear-gradient(135deg, #6D28D9, #8B5CF6)" }
            }}
          >
            Talep Gönder
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Resim Önizleme Modal */}
      <Box
        sx={{
          display: imagePreview.open ? 'flex' : 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(0, 0, 0, 0.9)',
          zIndex: 9999,
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
        onClick={() => setImagePreview({ open: false, url: '', name: '' })}
      >
        <Box
          sx={{
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: 0,
              display: 'flex',
              gap: 1
            }}
          >
            <IconButton
              sx={{ 
                bgcolor: "background.paper",
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => {
                if (imagePreview.url) {
                  const link = document.createElement('a');
                  link.href = imagePreview.url;
                  link.download = imagePreview.name;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              }}
              title="İndir"
            >
              <DownloadIcon />
            </IconButton>
            <IconButton
              sx={{ 
                bgcolor: "background.paper",
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => setImagePreview({ open: false, url: '', name: '' })}
              title="Kapat"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
          <img
            src={imagePreview.url}
            alt={imagePreview.name}
            style={{
              maxWidth: '100%',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: '8px'
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color: 'white',
              bgcolor: 'rgba(0, 0, 0, 0.7)',
              px: 2,
              py: 1,
              borderRadius: 1
            }}
          >
            {imagePreview.name}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
