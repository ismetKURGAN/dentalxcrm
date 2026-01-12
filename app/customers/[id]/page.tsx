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
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useI18n } from "../../components/I18nProvider";

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
    prePayments: {
      id: number;
      tripName: string;
      description: string;
      amount: string;
      currency: string;
    }[];
    prePaymentNotes: string;
    finalPayments: {
      costs: {
        id: number;
        category: string;
        amount: string;
        currency: string;
      }[];
      sales: {
        id: number;
        category: string;
        amount: string;
        currency: string;
      }[];
      notes: string;
    };
  };
  sales: {
    salesDate: string;
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
  files: { id: number; name: string; size: string; uploadedAt: string }[];
  history: {
    id: number;
    title: string;
    oldValue: string;
    newValue: string;
    date: string;
    user: string;
  }[];
  soldBy?: string;
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
    prePayments: [
      {
        id: Date.now(),
        tripName: "1. Seyahat",
        description: "",
        amount: "",
        currency: "",
      },
    ],
    prePaymentNotes: "",
    finalPayments: {
      costs: [
        {
          id: Date.now(),
          category: "1. Seyahat",
          amount: "",
          currency: "",
        },
      ],
      sales: [
        {
          id: Date.now() + 1,
          category: "1. Seyahat",
          amount: "",
          currency: "",
        },
      ],
      notes: "",
    },
  },
  sales: {
    salesDate: "",
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
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [serviceOptions, setServiceOptions] = useState<string[]>([]);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [doctorOptions, setDoctorOptions] = useState<string[]>([]);
  const [transferCompanyOptions, setTransferCompanyOptions] = useState<string[]>([]);
const [hotelOptions, setHotelOptions] = useState<string[]>([]);

  // --- VERİ ÇEKME ---
  useEffect(() => {
    const fetchData = async () => {
      if (!(params as any)?.id) return;
      try {
        // Kullanıcıları çek ve mevcut kullanıcının rolünü belirle
        const usersRes = await fetch("/api/users");
        if (usersRes.ok) {
          const users = await usersRes.json();
          const advisors = users
            .filter((u: any) => Array.isArray(u.roles) && (u.roles.includes("Danışman") || u.roles.includes("Acenta")))
            .map((u: any) => u.name)
            .filter(Boolean);
          setAdvisorOptions(advisors);
          
          // Mevcut kullanıcının rolünü belirle (localStorage'dan email al)
          const currentUserEmail = localStorage.getItem("userEmail");
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
        
        // Kategorileri çek
        const campaignsRes = await fetch("/api/campaigns");
        if (campaignsRes.ok) {
          const campaigns = await campaignsRes.json();
          const categories = campaigns.map((c: any) => c.name).filter(Boolean);
          setCategoryOptions(categories);
        }
        
        // Hizmetleri ayarla (sabit listeden)
        setServiceOptions(CRM_SERVICES);
        
        // Durumları API'den çek
        const statusesRes = await fetch("/api/statuses", { cache: "no-store" });
        if (statusesRes.ok) {
          const statusesData = await statusesRes.json();
          // Yeni format: [{id, tr, en}, ...] - sadece Türkçe isimleri al
          if (Array.isArray(statusesData) && statusesData.length > 0 && typeof statusesData[0] === 'object') {
            setStatusOptions(statusesData.map((s: any) => s.tr));
          } else {
            setStatusOptions(statusesData);
          }
        } else {
          // Hata durumunda varsayılan durumları kullan
          setStatusOptions(CRM_STATUSES);
        }
        
        // Doktorları çek
        const doctorsRes = await fetch("/api/doctors");
        if (doctorsRes.ok) {
          const doctors = await doctorsRes.json();
          const doctorNames = doctors.map((d: any) => d.name).filter(Boolean);
          setDoctorOptions(doctorNames);
        }
        
        // Transfer firmalarını çek (segments API'den)
        const segmentsRes = await fetch("/api/segments");
        if (segmentsRes.ok) {
          const segments = await segmentsRes.json();
          const transferCompanies = segments
            .filter((s: any) => s.type === "transfer")
            .map((s: any) => s.name)
            .filter(Boolean);
          setTransferCompanyOptions(transferCompanies);
        }
        
        // Otelleri çek
        const hotelsRes = await fetch("/api/hotels");
        if (hotelsRes.ok) {
          const hotels = await hotelsRes.json();
          const hotelNames = hotels.map((h: any) => h.name).filter(Boolean);
          setHotelOptions(hotelNames.sort());
        }
        
        const res = await fetch("/api/crm", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const found = data.find(
            (c: any) => String(c.id) === String((params as any).id)
          );

          if (found) {
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
              payment: found.payment || INITIAL_STATE.payment,
              sales: found.sales || INITIAL_STATE.sales,
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

  // Seyahat ekleme fonksiyonu
  const handleAddTrip = () => {
    const newTrip = {
      id: Date.now(),
      name: `${customer.sales.trips.length + 1}. Seyahat`,
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

  // Tedavi öncesi ödeme ekleme
  const handleAddPrePayment = () => {
    const newPayment = {
      id: Date.now(),
      tripName: `${customer.payment.prePayments.length + 1}. Seyahat`,
      description: "",
      amount: "",
      currency: "",
    };
    setCustomer((prev) => ({
      ...prev,
      payment: {
        ...prev.payment,
        prePayments: [...prev.payment.prePayments, newPayment],
      },
    }));
  };

  // Tedavi öncesi ödeme silme
  const handleRemovePrePayment = (paymentId: number) => {
    setCustomer((prev) => ({
      ...prev,
      payment: {
        ...prev.payment,
        prePayments: prev.payment.prePayments.filter((p) => p.id !== paymentId),
      },
    }));
  };

  // Maliyet ekleme
  const handleAddCost = () => {
    const newCost = {
      id: Date.now(),
      category: "1. Seyahat",
      amount: "",
      currency: "",
    };
    setCustomer((prev) => ({
      ...prev,
      payment: {
        ...prev.payment,
        finalPayments: {
          ...prev.payment.finalPayments,
          costs: [...prev.payment.finalPayments.costs, newCost],
        },
      },
    }));
  };

  // Maliyet silme
  const handleRemoveCost = (costId: number) => {
    setCustomer((prev) => ({
      ...prev,
      payment: {
        ...prev.payment,
        finalPayments: {
          ...prev.payment.finalPayments,
          costs: prev.payment.finalPayments.costs.filter((c) => c.id !== costId),
        },
      },
    }));
  };

  // Satış ekleme
  const handleAddSale = () => {
    const newSale = {
      id: Date.now(),
      category: "1. Seyahat",
      amount: "",
      currency: "",
    };
    setCustomer((prev) => ({
      ...prev,
      payment: {
        ...prev.payment,
        finalPayments: {
          ...prev.payment.finalPayments,
          sales: [...prev.payment.finalPayments.sales, newSale],
        },
      },
    }));
  };

  // Satış silme
  const handleRemoveSale = (saleId: number) => {
    setCustomer((prev) => ({
      ...prev,
      payment: {
        ...prev.payment,
        finalPayments: {
          ...prev.payment.finalPayments,
          sales: prev.payment.finalPayments.sales.filter((s) => s.id !== saleId),
        },
      },
    }));
  };

  // 8. SATIŞ (yalnızca durum "Satış" olduğunda gösterilecek sekme)
  const renderSalesTab = () => (
    <Stack spacing={3}>
      {/* Satış Bilgileri */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: "#374151" }}>
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

      {/* Müşteri Geri Bildirimleri */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: "#374151" }}>
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
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, color: "#374151" }}>
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
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, color: "#374151" }}>
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
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, color: "#374151" }}>
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
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, color: "#374151" }}>
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

  // --- KAYDETME ---
  const handleSave = async () => {
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
          bgcolor: customer.reminder.enabled ? "#eff6ff" : "#f9fafb",
          borderColor: customer.reminder.enabled ? "#bfdbfe" : "#e5e7eb",
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
          sx={{ bgcolor: "#374151", "&:hover": { bgcolor: "#4b5563" } }}
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
  const renderPaymentTab = () => (
    <Stack spacing={3}>
      {/* Tedavi Öncesi Ödeme Bilgileri */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ color: "#374151" }}>
            Tedavi Öncesi Ödeme Bilgileri
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAddPrePayment}
            sx={{ textTransform: 'none' }}
          >
            Ödeme Ekle
          </Button>
        </Stack>

        <Stack spacing={2}>
          {customer.payment.prePayments.map((payment, index) => (
            <Paper key={payment.id} variant="outlined" sx={{ p: 2, bgcolor: "#f9fafb" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="body2" fontWeight={600}>{payment.tripName}</Typography>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleRemovePrePayment(payment.id)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Autocomplete
                    size="small"
                    options={CRM_PAYMENT_CATEGORIES}
                    value={payment.description || null}
                    onChange={(_, newValue) => {
                      setCustomer((prev) => {
                        const prePayments = [...prev.payment.prePayments];
                        prePayments[index] = { ...prePayments[index], description: newValue || "" };
                        return { ...prev, payment: { ...prev.payment, prePayments } };
                      });
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Ödeme Türü" placeholder="Seçin..." />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    size="small"
                    label="Tutar"
                    fullWidth
                    type="number"
                    InputLabelProps={{ shrink: true }}
                    value={payment.amount}
                    onChange={(e) => {
                      setCustomer((prev) => {
                        const prePayments = [...prev.payment.prePayments];
                        prePayments[index] = { ...prePayments[index], amount: e.target.value };
                        return { ...prev, payment: { ...prev.payment, prePayments } };
                      });
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth size="small" required>
                    <InputLabel>Para Birimi *</InputLabel>
                    <Select
                      value={payment.currency}
                      label="Para Birimi *"
                      onChange={(e) => {
                        setCustomer((prev) => {
                          const prePayments = [...prev.payment.prePayments];
                          prePayments[index] = { ...prePayments[index], currency: e.target.value };
                          return { ...prev, payment: { ...prev.payment, prePayments } };
                        });
                      }}
                    >
                      {CRM_CURRENCIES.map((curr) => (
                        <MenuItem key={curr} value={curr}>{curr}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>
          ))}

          <TextField
            multiline
            minRows={9}
            maxRows={50}
            label="Notlar"
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            value={customer.payment.prePaymentNotes}
            onChange={(e) =>
              setCustomer((prev) => ({
                ...prev,
                payment: { ...prev.payment, prePaymentNotes: e.target.value },
              }))
            }
            placeholder="Ödeme ile ilgili notlar..."
          />
        </Stack>
      </Paper>

      {/* Tedavi Sonrası Kesin Ödeme Bilgileri - Sadece Admin ve Fiyatlandırma */}
      {(userRoles.includes("Admin") || userRoles.includes("Fiyatlandırma")) && (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: "#fef3c7", borderColor: "#fbbf24" }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: "#92400e" }}>
            Tedavi Sonrası Kesin Ödeme Bilgileri (Sadece Admin/Fiyatlandırma)
          </Typography>

          {/* Maliyet */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
              <Typography variant="body2" fontWeight={600}>Maliyet</Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddCost}
                sx={{ textTransform: 'none' }}
              >
                Maliyet Ekle
              </Button>
            </Stack>
            <Stack spacing={1.5}>
              {customer.payment.finalPayments.costs.map((cost, index) => (
                <Paper key={cost.id} variant="outlined" sx={{ p: 1.5, bgcolor: "#fff" }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Grid container spacing={1.5} sx={{ flex: 1 }}>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Kategori</InputLabel>
                          <Select
                            value={cost.category}
                            label="Kategori"
                            onChange={(e) => {
                              setCustomer((prev) => {
                                const costs = [...prev.payment.finalPayments.costs];
                                costs[index] = { ...costs[index], category: e.target.value };
                                return {
                                  ...prev,
                                  payment: {
                                    ...prev.payment,
                                    finalPayments: { ...prev.payment.finalPayments, costs },
                                  },
                                };
                              });
                            }}
                          >
                            {CRM_PAYMENT_CATEGORIES.map((cat) => (
                              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                          size="small"
                          label="Tutar"
                          fullWidth
                          type="number"
                          InputLabelProps={{ shrink: true }}
                          value={cost.amount}
                          onChange={(e) => {
                            setCustomer((prev) => {
                              const costs = [...prev.payment.finalPayments.costs];
                              costs[index] = { ...costs[index], amount: e.target.value };
                              return {
                                ...prev,
                                payment: {
                                  ...prev.payment,
                                  finalPayments: { ...prev.payment.finalPayments, costs },
                                },
                              };
                            });
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <FormControl fullWidth size="small" required>
                          <InputLabel>Para Birimi *</InputLabel>
                          <Select
                            value={cost.currency}
                            label="Para Birimi *"
                            onChange={(e) => {
                              setCustomer((prev) => {
                                const costs = [...prev.payment.finalPayments.costs];
                                costs[index] = { ...costs[index], currency: e.target.value };
                                return {
                                  ...prev,
                                  payment: {
                                    ...prev.payment,
                                    finalPayments: { ...prev.payment.finalPayments, costs },
                                  },
                                };
                              });
                            }}
                          >
                            {CRM_CURRENCIES.map((curr) => (
                              <MenuItem key={curr} value={curr}>{curr}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveCost(cost.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Box>

          {/* Satış */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
              <Typography variant="body2" fontWeight={600}>Satış</Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddSale}
                sx={{ textTransform: 'none' }}
              >
                Satış Ekle
              </Button>
            </Stack>
            <Stack spacing={1.5}>
              {customer.payment.finalPayments.sales.map((sale, index) => (
                <Paper key={sale.id} variant="outlined" sx={{ p: 1.5, bgcolor: "#fff" }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Grid container spacing={1.5} sx={{ flex: 1 }}>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Kategori</InputLabel>
                          <Select
                            value={sale.category}
                            label="Kategori"
                            onChange={(e) => {
                              setCustomer((prev) => {
                                const sales = [...prev.payment.finalPayments.sales];
                                sales[index] = { ...sales[index], category: e.target.value };
                                return {
                                  ...prev,
                                  payment: {
                                    ...prev.payment,
                                    finalPayments: { ...prev.payment.finalPayments, sales },
                                  },
                                };
                              });
                            }}
                          >
                            {CRM_PAYMENT_CATEGORIES.map((cat) => (
                              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                          size="small"
                          label="Tutar"
                          fullWidth
                          type="number"
                          InputLabelProps={{ shrink: true }}
                          value={sale.amount}
                          onChange={(e) => {
                            setCustomer((prev) => {
                              const sales = [...prev.payment.finalPayments.sales];
                              sales[index] = { ...sales[index], amount: e.target.value };
                              return {
                                ...prev,
                                payment: {
                                  ...prev.payment,
                                  finalPayments: { ...prev.payment.finalPayments, sales },
                                },
                              };
                            });
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <FormControl fullWidth size="small" required>
                          <InputLabel>Para Birimi *</InputLabel>
                          <Select
                            value={sale.currency}
                            label="Para Birimi *"
                            onChange={(e) => {
                              setCustomer((prev) => {
                                const sales = [...prev.payment.finalPayments.sales];
                                sales[index] = { ...sales[index], currency: e.target.value };
                                return {
                                  ...prev,
                                  payment: {
                                    ...prev.payment,
                                    finalPayments: { ...prev.payment.finalPayments, sales },
                                  },
                                };
                              });
                            }}
                          >
                            {CRM_CURRENCIES.map((curr) => (
                              <MenuItem key={curr} value={curr}>{curr}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveSale(sale.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Box>

          {/* Notlar */}
          <TextField
            multiline
            minRows={9}
            maxRows={50}
            label="Notlar"
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            value={customer.payment.finalPayments.notes}
            onChange={(e) =>
              setCustomer((prev) => ({
                ...prev,
                payment: {
                  ...prev.payment,
                  finalPayments: { ...prev.payment.finalPayments, notes: e.target.value },
                },
              }))
            }
            placeholder="Kesin ödeme ile ilgili notlar..."
          />
        </Paper>
      )}
    </Stack>
  );

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

    const newFiles = selectedFiles.map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      size: `${(file.size / 1024).toFixed(2)} KB`,
      uploadedAt: new Date().toLocaleString("tr-TR"),
    }));

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

  const renderFilesTab = () => (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />
      
      <Stack direction="row" spacing={2} mb={3}>
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
          borderColor: "#cbd5e1",
          borderRadius: 3,
          textAlign: "center",
          bgcolor: "#f8fafc",
          cursor: "pointer",
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <CloudUploadIcon sx={{ fontSize: 60, color: "#94a3b8", mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          {t("customerDetail.files.dropTitle")}
        </Typography>
        <Typography variant="body2" color="text.disabled">
          {t("customerDetail.files.dropSubtitle")}
        </Typography>
      </Paper>

      {customer.files.length > 0 && (
        <Box mt={3}>
          <Typography variant="subtitle1" gutterBottom fontWeight={600}>
            Yüklenen Dosyalar
          </Typography>
          <Stack spacing={1}>
            {customer.files.map((file) => {
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
                          }
                        }}
                        title="İndir"
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                      
                      {/* Silme Butonu */}
                      <IconButton
                        size="small"
                        color="error"
                        onClick={async () => {
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
        </Box>
      )}
    </Box>
  );

  // 7. GEÇMİŞ
  const renderHistoryTab = () => (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <AccessTimeIcon fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            24.11.2025 21:00 - Sistem
          </Typography>
        </Stack>
        <Typography fontWeight={600}>{t("customerDetail.history.systemSample")}</Typography>
        <Grid container spacing={2} mt={1}>
          <Grid xs={6}>
            <Paper sx={{ p: 1, bgcolor: "#fee2e2" }}>
              <Typography variant="caption" color="error">
                {t("customerDetail.history.old")}
              </Typography>
            </Paper>
          </Grid>
          <Grid xs={6}>
            <Paper sx={{ p: 1, bgcolor: "#dcfce7" }}>
              <Typography variant="caption" color="success">
                {t("customerDetail.history.new")}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Stack>
  );

  // 1. KİŞİSEL BİLGİLER
  const renderPersonalTab = () => (
    <Stack spacing={3}>
      {/* 1. Satır: Ad Soyad ve Telefon */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: "#374151" }}>
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
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: "#374151" }}>
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
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: "#374151" }}>
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
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: "#f8fafc" }}>
        <Stack direction="row" spacing={1} mb={2} alignItems="center">
          <FacebookIcon color="primary" />
          <Typography variant="subtitle2" fontWeight={600} color="#374151">
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
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: "#374151" }}>
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
              options={categoryOptions}
              value={customer.status.category || null}
              onChange={(_, newValue) => handleChange("status", "category", newValue || "")}
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
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: "#374151" }}>
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
                      severity: "warning"
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
        bgcolor: "#f3f4f6",
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
            ...(customer.status.status === "Satış" ? ["sales"] : []),
            "reminder",
            "calls",
            "payment",
            "files",
            "history",
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
                : "customerDetail.tabs.history";
            const label = t(labelKey);
            return (
            <ListItemButton
              key={key}
              onClick={() => setActiveTab(key)}
              sx={{
                pl: 3,
                py: 1.5,
                borderLeft:
                  activeTab === key
                    ? "4px solid #28C76F"
                    : "4px solid transparent",
                bgcolor:
                  activeTab === key
                    ? "rgba(255,255,255,0.05)"
                    : "transparent",
              }}
            >
              <ListItemIcon sx={{ color: "#e5e7eb", minWidth: 36 }}>
                {key === "personal" ? (
                  <PersonIcon />
                ) : key === "status" ? (
                  <FavoriteBorderIcon />
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
                ) : (
                  <HistoryIcon />
                )}
              </ListItemIcon>
              <ListItemText
                primary={label}
                primaryTypographyProps={{ fontSize: 14 }}
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
              bgcolor: "#22c55e",
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
            bgcolor: "white",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push("/customers")}
            sx={{ textTransform: "none", color: "#6b7280" }}
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
              bgcolor: "white",
              border: "1px solid #e5e7eb",
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
              bgcolor: "white",
              border: "1px solid #e5e7eb",
              minHeight: 400,
            }}
          >
            {renderContent()}
          </Paper>
        </Box>
      </Box>

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
                bgcolor: 'white',
                '&:hover': { bgcolor: '#f5f5f5' }
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
                bgcolor: 'white',
                '&:hover': { bgcolor: '#f5f5f5' }
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
