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
  Grid,
  CircularProgress,
  Snackbar,
  Alert,
  Switch,
  IconButton,
  Fab,
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
const CRM_COUNTRIES = ["United Kingdom", "Turkey", "Germany", "France", "USA"];

const CRM_HOTELS = [
  "Adonis Hotel Antalya",
  "Akra Hotels Antalya",
  "Alp Paşa Hotel Kaleiçi Antalya",
  "Beyond Otel Konyaaltı / Antalya",
  "Cartoon Hotel İstanbul",
  "Cender Hotel",
  "Delphin Imperial Hotel",
  "Falcon Hotel Antalya",
  "Grand Park Lara Antalya",
  "HEDEF RESORT HOTEL&SPA ALANYA",
  "Hotel Lunay Antalya",
  "Hotel S White Antalya",
  "Kaya Otel Belek",
  "Lara Garden Otel",
  "Laren Family Hotel Spa Antalya",
  "Laren Seaside Hotel & Spa Antalya",
  "Let'stay Hotel Antalya",
  "Midmar Hotel Yenibosna İstanbul",
  "Mori Club Hotel Antalya",
  "Otel Belli Değil",
  "Oteli Kendi Belirleyecek",
  "Ramada By Wyndham Lara",
  "Ramada Hotel & Suites by Wyndham Istanbul Merter",
  "Ramada Plaza Antalya Hotel",
  "Ramada Plaza By Wyndham Istanbul Ataköy",
  "Regnum Carya Otel",
  "Renex Hotel Antalya",
  "Rodinn Park Hotel Antalya",
  "Route Hotel Kaleiçi Antalya",
  "Royal Holiday Palace Antalya",
  "Sealife Family Resort Hotel Antalya",
  "Sianji Well Being Resort Bodrum",
  "Sky Business Hotel & SPA",
  "Susesi Luxury Resort",
  "Swandor Hotels & Resorts",
  "The Corner Park Hotel Antalya",
  "The Marmara Antalya",
  "The Mill Hotel Bomonti",
  "Titanic Mardan Palace",
  "Wanda Vista Hotel İstanbul",
  "Wolf Of The City & Spa Antalya",
];

// --- TİPLER ---
type CustomerState = {
  id: number;
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
  payment: { notes: string };
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
      name: string;
      appointmentDate: string;
      appointmentTime: string;
      doctor: string;
      service: string;
      hotel: string;
      transfer: boolean;
      roomType: string;
      peopleCount: string;
      travelNotes: string;
      arrivalDate: string;
      arrivalTime: string;
      departureDate: string;
      departureTime: string;
      returnPickupTime: string;
      ticketArrival: string;
      ticketDeparture: string;
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
  payment: { notes: "" },
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
    trips: [
      {
        name: "1. Seyahat",
        appointmentDate: "",
        appointmentTime: "",
        doctor: "",
        service: "",
        hotel: "",
        transfer: false,
        roomType: "",
        peopleCount: "",
        travelNotes: "",
        arrivalDate: "",
        arrivalTime: "",
        departureDate: "",
        departureTime: "",
        returnPickupTime: "",
        ticketArrival: "",
        ticketDeparture: "",
      },
      {
        name: "2. Seyahat",
        appointmentDate: "",
        appointmentTime: "",
        doctor: "",
        service: "",
        hotel: "",
        transfer: false,
        roomType: "",
        peopleCount: "",
        travelNotes: "",
        arrivalDate: "",
        arrivalTime: "",
        departureDate: "",
        departureTime: "",
        returnPickupTime: "",
        ticketArrival: "",
        ticketDeparture: "",
      },
    ],
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
  
  // Dinamik listeler
  const [advisorOptions, setAdvisorOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [serviceOptions, setServiceOptions] = useState<string[]>([]);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);

  // --- VERİ ÇEKME ---
  useEffect(() => {
    const fetchData = async () => {
      if (!(params as any)?.id) return;
      try {
        // Kullanıcıları çek
        const usersRes = await fetch("/api/users");
        if (usersRes.ok) {
          const users = await usersRes.json();
          const advisors = users
            .filter((u: any) => Array.isArray(u.roles) && u.roles.includes("Danışman"))
            .map((u: any) => u.name)
            .filter(Boolean);
          setAdvisorOptions(advisors);
        }
        
        // Kategorileri çek
        const campaignsRes = await fetch("/api/campaigns");
        if (campaignsRes.ok) {
          const campaigns = await campaignsRes.json();
          const categories = campaigns.map((c: any) => c.name).filter(Boolean);
          setCategoryOptions(categories);
        }
        
        // Hizmetleri ve durumları ayarla (sabit listelerden)
        setServiceOptions(CRM_SERVICES);
        setStatusOptions(CRM_STATUSES);
        
        const res = await fetch("/api/crm", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const found = data.find(
            (c: any) => String(c.id) === String((params as any).id)
          );

          if (found) {
            setCustomer({
              id: found.id,
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

  // 8. SATIŞ (yalnızca durum "Satış" olduğunda gösterilecek sekme)
  const renderSalesTab = () => (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          {t("customerDetail.sales.infoTitle")}
        </Typography>
        <Grid container spacing={2}>
          <Grid xs={12} md={4}>
            <TextField
              type="date"
              label={t("customerDetail.sales.date")}
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
          <Grid xs={12}>
            <TextField
              multiline
              rows={3}
              label={t("customerDetail.sales.healthNotes")}
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={customer.sales.healthNotes}
              onChange={(e) =>
                setCustomer((prev) => ({
                  ...prev,
                  sales: { ...prev.sales, healthNotes: e.target.value },
                }))
              }
              placeholder={t("customerDetail.sales.healthNotes.placeholder")}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          {t("customerDetail.sales.feedbackTitle")}
        </Typography>
        <Stack spacing={1}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography>{t("customerDetail.sales.feedback.trustpilot")}</Typography>
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
            <Typography>{t("customerDetail.sales.feedback.googleMaps")}</Typography>
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
            <Typography>{t("customerDetail.sales.feedback.survey")}</Typography>
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
            <Typography>{t("customerDetail.sales.feedback.warranty")}</Typography>
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
            <Typography>{t("customerDetail.sales.feedback.rpt")}</Typography>
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

      {customer.sales.trips.map((trip, index) => (
        <Paper key={index} variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            {trip.name}
          </Typography>
          <Grid container spacing={2}>
            <Grid xs={12} md={3}>
              <TextField
                type="date"
                label={t("customerDetail.sales.trip.appointmentDate")}
                fullWidth
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
            <Grid xs={12} md={3}>
              <TextField
                type="time"
                label={t("customerDetail.sales.trip.appointmentTime")}
                fullWidth
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
            <Grid xs={12} md={3}>
              <TextField
                label={t("customerDetail.sales.trip.doctor")}
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={trip.doctor}
                onChange={(e) =>
                  setCustomer((prev) => {
                    const trips = [...prev.sales.trips];
                    trips[index] = { ...trips[index], doctor: e.target.value };
                    return { ...prev, sales: { ...prev.sales, trips } };
                  })
                }
              />
            </Grid>
            <Grid xs={12} md={3}>
              <TextField
                label={t("customerDetail.sales.trip.service")}
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={trip.service}
                onChange={(e) =>
                  setCustomer((prev) => {
                    const trips = [...prev.sales.trips];
                    trips[index] = { ...trips[index], service: e.target.value };
                    return { ...prev, sales: { ...prev.sales, trips } };
                  })
                }
              />
            </Grid>

            <Grid xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel shrink>Otel</InputLabel>
                <Select
                  label={t("customerDetail.sales.trip.hotel")}
                  value={trip.hotel}
                  onChange={(e) =>
                    setCustomer((prev) => {
                      const trips = [...prev.sales.trips];
                      trips[index] = { ...trips[index], hotel: e.target.value as string };
                      return { ...prev, sales: { ...prev.sales, trips } };
                    })
                  }
                >
                  {CRM_HOTELS.map((h) => (
                    <MenuItem key={h} value={h}>
                      {h}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={12} md={3}>
              <TextField
                label={t("customerDetail.sales.trip.roomType")}
                fullWidth
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
            <Grid xs={12} md={3}>
              <TextField
                label={t("customerDetail.sales.trip.peopleCount")}
                fullWidth
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

            <Grid xs={12} md={3} sx={{ display: "flex", alignItems: "center" }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography>{t("customerDetail.sales.trip.transfer")}</Typography>
                <Switch
                  checked={trip.transfer}
                  onChange={(e) =>
                    setCustomer((prev) => {
                      const trips = [...prev.sales.trips];
                      trips[index] = { ...trips[index], transfer: e.target.checked };
                      return { ...prev, sales: { ...prev.sales, trips } };
                    })
                  }
                />
              </Stack>
            </Grid>

            <Grid xs={12} md={3}>
              <TextField
                type="date"
                label="Geliş Tarihi"
                fullWidth
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
            <Grid xs={12} md={3}>
              <TextField
                type="time"
                label="Geliş Saati"
                fullWidth
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
            <Grid xs={12} md={3}>
              <TextField
                type="date"
                label="Gidiş Tarihi"
                fullWidth
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
            <Grid xs={12} md={3}>
              <TextField
                type="time"
                label="Gidiş Saati"
                fullWidth
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

            <Grid xs={12} md={3}>
              <TextField
                type="time"
                label="Dönüş Alınma Saati"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={trip.returnPickupTime}
                onChange={(e) =>
                  setCustomer((prev) => {
                    const trips = [...prev.sales.trips];
                    trips[index] = { ...trips[index], returnPickupTime: e.target.value };
                    return { ...prev, sales: { ...prev.sales, trips } };
                  })
                }
              />
            </Grid>

            <Grid xs={12}>
              <TextField
                multiline
                rows={3}
                label={t("customerDetail.sales.trip.notes")}
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={trip.travelNotes}
                onChange={(e) =>
                  setCustomer((prev) => {
                    const trips = [...prev.sales.trips];
                    trips[index] = { ...trips[index], travelNotes: e.target.value };
                    return { ...prev, sales: { ...prev.sales, trips } };
                  })
                }
              />
            </Grid>

            <Grid xs={12} md={6}>
              <TextField
                label={t("customerDetail.sales.trip.ticketArrival")}
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={trip.ticketArrival}
                onChange={(e) =>
                  setCustomer((prev) => {
                    const trips = [...prev.sales.trips];
                    trips[index] = { ...trips[index], ticketArrival: e.target.value };
                    return { ...prev, sales: { ...prev.sales, trips } };
                  })
                }
              />
            </Grid>
            <Grid xs={12} md={6}>
              <TextField
                label={t("customerDetail.sales.trip.ticketDeparture")}
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={trip.ticketDeparture}
                onChange={(e) =>
                  setCustomer((prev) => {
                    const trips = [...prev.sales.trips];
                    trips[index] = { ...trips[index], ticketDeparture: e.target.value };
                    return { ...prev, sales: { ...prev.sales, trips } };
                  })
                }
              />
            </Grid>
          </Grid>
        </Paper>
      ))}
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
    <Stack spacing={2}>
      <TextField
        multiline
        rows={6}
        label={t("customerDetail.payment.notes")}
        fullWidth
        value={customer.payment.notes}
        onChange={(e) => handleChange("payment", "notes", e.target.value)}
        InputLabelProps={{ shrink: true }}
        placeholder={t("customerDetail.payment.placeholder")}
      />
    </Stack>
  );

  // 6. DOSYALAR
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            {customer.files.map((file) => (
              <Paper key={file.id} variant="outlined" sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {file.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {file.size} • {file.uploadedAt}
                    </Typography>
                  </Box>
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
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Paper>
            ))}
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
    <Grid container spacing={3}>
      <Grid xs={12} md={6}>
        <TextField
          label={t("customerDetail.personal.name")}
          fullWidth
          value={customer.personal.name}
          onChange={(e) => handleChange("personal", "name", e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid xs={12} md={6}>
        <TextField
          label={t("customerDetail.personal.email")}
          fullWidth
          value={customer.personal.email}
          onChange={(e) => handleChange("personal", "email", e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid xs={12} md={6}>
        <TextField
          label={t("customerDetail.personal.phone")}
          fullWidth
          value={customer.personal.phone}
          onChange={(e) => handleChange("personal", "phone", e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel shrink>{t("customerDetail.personal.country")}</InputLabel>
          <Select
            value={customer.personal.country}
            label={t("customerDetail.personal.country")}
            onChange={(e) =>
              handleChange("personal", "country", e.target.value)
            }
          >
            {CRM_COUNTRIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid xs={12}>
        <TextField
          fullWidth
          multiline
          rows={3}
          label={t("customerDetail.personal.notes")}
          value={customer.personal.notes}
          onChange={(e) => handleChange("personal", "notes", e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid xs={12}>
        <TextField
          label={t("customerDetail.personal.registerDate")}
          fullWidth
          value={customer.personal.registerDate}
          disabled
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid xs={12}>
        <Paper
          variant="outlined"
          sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2 }}
        >
          <Stack direction="row" spacing={1} mb={2} alignItems="center">
            <FacebookIcon color="primary" />
            <Typography variant="subtitle2" fontWeight="bold">
              {t("customerDetail.facebook.title")}
            </Typography>
          </Stack>
          <Grid container spacing={2}>
            <Grid xs={12} md={6}>
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
            <Grid xs={12} md={6}>
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
      </Grid>
    </Grid>
  );

  // 2. DURUM BİLGİLERİ
  const renderStatusTab = () => (
    <Grid container spacing={3}>
      <Grid xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel shrink>{t("customerDetail.status.consultant")}</InputLabel>
          <Select
            value={customer.status.consultant}
            label={t("customerDetail.status.consultant")}
            onChange={(e) =>
              handleChange("status", "consultant", e.target.value)
            }
            displayEmpty
            renderValue={(selected) => {
              if (!selected) {
                return <em style={{ color: "#9ca3af" }}>Danışman Seçiniz</em>;
              }
              return selected;
            }}
          >
            <MenuItem value="">
              <em>Danışman Seçiniz</em>
            </MenuItem>
            {advisorOptions.map((u) => (
              <MenuItem key={u} value={u}>
                {u}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel shrink>{t("customerDetail.status.category")}</InputLabel>
          <Select
            value={customer.status.category}
            label={t("customerDetail.status.category")}
            onChange={(e) =>
              handleChange("status", "category", e.target.value)
            }
            displayEmpty
            renderValue={(selected) => {
              if (!selected) {
                return <em style={{ color: "#9ca3af" }}>Kategori Seçiniz</em>;
              }
              return selected;
            }}
          >
            <MenuItem value="">
              <em>Kategori Seçiniz</em>
            </MenuItem>
            {categoryOptions.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid xs={12}>
        <FormControl fullWidth>
          <InputLabel shrink>{t("customerDetail.status.services")}</InputLabel>
          <Select
            value={customer.status.services}
            label={t("customerDetail.status.services")}
            onChange={(e) =>
              handleChange("status", "services", e.target.value)
            }
            displayEmpty
            renderValue={(selected) => {
              if (!selected) {
                return <em style={{ color: "#9ca3af" }}>Hizmet Seçiniz</em>;
              }
              return selected;
            }}
          >
            <MenuItem value="">
              <em>Hizmet Seçiniz</em>
            </MenuItem>
            {serviceOptions.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid xs={12}>
        <FormControl fullWidth>
          <InputLabel shrink>{t("customerDetail.status.status")}</InputLabel>
          <Select
            value={customer.status.status}
            label={t("customerDetail.status.status")}
            onChange={(e) =>
              handleChange("status", "status", e.target.value)
            }
            displayEmpty
            renderValue={(selected) => {
              if (!selected) {
                return <em style={{ color: "#9ca3af" }}>Durum Seçiniz</em>;
              }
              return selected;
            }}
          >
            <MenuItem value="">
              <em>Durum Seçiniz</em>
            </MenuItem>
            {statusOptions.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
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
    </Box>
  );
}
