"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Menu,
  FormControlLabel,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import FlightLandIcon from "@mui/icons-material/FlightLand";
import HotelIcon from "@mui/icons-material/Hotel";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { useI18n } from "../components/I18nProvider";

// Basit yıl ve ay listeleri
const YEARS = [2024, 2025, 2026];
const MONTHS = [
  { value: 0, label: "Ocak" },
  { value: 1, label: "Şubat" },
  { value: 2, label: "Mart" },
  { value: 3, label: "Nisan" },
  { value: 4, label: "Mayıs" },
  { value: 5, label: "Haziran" },
  { value: 6, label: "Temmuz" },
  { value: 7, label: "Ağustos" },
  { value: 8, label: "Eylül" },
  { value: 9, label: "Ekim" },
  { value: 10, label: "Kasım" },
  { value: 11, label: "Aralık" },
];

const CRM_SERVICES = [
  "Dental İmplant",
  "Dental İmplant&Crowns",
  "Hollywood Smile",
  "Zirconium Crowns",
  "Laminate Veneer",
  "Teeth Whitening",
  "Gum Aesthetics",
  "Orthodontics",
  "Root Canal Treatment",
  "Dental Cleaning",
  "Tooth Extraction",
  "Dental Filling",
  "Dental Bridge",
  "Dental Bonding",
  "Dental Inlay/Onlay",
  "Dental Surgery",
  "Pediatric Dentistry",
  "Geriatric Dentistry",
  "Cosmetic Dentistry",
  "Restorative Dentistry",
  "Preventive Dentistry",
  "Emergency Dentistry",
  "Sedation Dentistry",
  "Laser Dentistry",
  "Digital Dentistry",
  "3D Dentistry",
  "CAD/CAM Dentistry",
  "Implantology",
  "Periodontology",
  "Endodontics",
  "Prosthodontics",
  "Oral Surgery",
  "Maxillofacial Surgery",
  "Oral Pathology",
  "Oral Radiology",
  "Oral Medicine",
  "Oral Biology",
  "Oral Anatomy",
  "Oral Histology",
  "Oral Physiology",
  "Oral Biochemistry",
  "Oral Microbiology",
  "Oral Immunology",
  "Oral Pharmacology",
  "Oral Pathology",
];

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "-";
  }
}

function formatTime(timeStr: string): string {
  if (!timeStr) return "-";
  return timeStr;
}

function formatDateTime(dateStr: string, timeStr: string): string {
  if (!dateStr) return "-";
  const date = formatDate(dateStr);
  const time = timeStr || "--:--";
  return `${date} ${time}`;
}

export default function AppointmentsPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState<number | "all">(2025);
  const [month, setMonth] = useState<number | "all">("all");
  const [doctors, setDoctors] = useState<any[]>([]);
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [advisorFilter, setAdvisorFilter] = useState<string | "all">("all");
  const [doctorFilter, setDoctorFilter] = useState<string | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "name",
    "appointmentDate",
    "tripName",
    "doctor",
    "service",
    "status",
    "arrivalDate",
    "departureDate",
    "hotel",
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formAdvisor, setFormAdvisor] = useState("");
  const [formDoctor, setFormDoctor] = useState("");
  const [formVisit, setFormVisit] = useState("");
  const [formStatus, setFormStatus] = useState("");
  const [formNote, setFormNote] = useState("");
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);

  const handleVisibleColumnsChange = (value: unknown) => {
    if (typeof value === "string") {
      setVisibleColumns(value.split(","));
    } else {
      setVisibleColumns(value as string[]);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/crm", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();

      setAllCustomers(data || []);

      // Satış durumundaki müşterilerin trip verilerini randevu olarak göster
      const mapped: any[] = [];
      
      data.forEach((c: any) => {
        // Status bilgisini düzelt - hem eski (string) hem yeni (object) formatı destekle
        let statusValue = '';
        let advisorValue = '';
        let categoryValue = '';
        let serviceValue = '';
        
        if (typeof c.status === 'object' && c.status !== null) {
          statusValue = c.status.status || '';
          advisorValue = c.status.consultant || '';
          categoryValue = c.status.category || '';
          serviceValue = c.status.services || c.service || '';
        } else if (typeof c.status === 'string') {
          statusValue = c.status;
          advisorValue = c.advisor || '';
          categoryValue = c.category || '';
          serviceValue = c.service || '';
        }
        
        // Sadece "Satış" veya "Satış Kapalı" durumundaki müşterileri al
        if (statusValue === "Satış" || statusValue === "Satış Kapalı") {
          const trips = c.sales?.trips || [];
          
          trips.forEach((trip: any, tripIndex: number) => {
            if (trip.appointmentDate) {
              mapped.push({
                id: `${c.id}-trip-${tripIndex}`,
                customerId: c.id,
                name: c.name || c.personal?.name || "-",
                advisor: advisorValue || "-",
                status: statusValue || "-",
                category: categoryValue || "-",
                tripName: trip.name || `${tripIndex + 1}. Seyahat`,
                appointmentDate: trip.appointmentDate,
                appointmentTime: trip.appointmentTime || "",
                doctor: trip.doctor || "",
                service: serviceValue || trip.service || "",
                arrivalDate: trip.arrivalDate || "",
                arrivalTime: trip.arrivalTime || "",
                departureDate: trip.departureDate || "",
                departureTime: trip.departureTime || "",
                returnPickupTime: trip.returnPickupTime || "",
                hotel: trip.hotel || "",
                roomType: trip.roomType || "",
                peopleCount: trip.peopleCount || "",
                transfer: trip.transfer || false,
                travelNotes: trip.travelNotes || "",
              });
            }
          });
        }
      });

      setRows(mapped);
    } catch (e) {
      console.error("Randevular çekilirken hata", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch("/api/doctors", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setDoctors(data);
    } catch (e) {
      console.error("Doktor listesi alınırken hata", e);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();

    // Otomatik yenileme - her 30 saniyede bir
    const interval = setInterval(() => {
      fetchAppointments();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleInlineUpdate = async (id: string, field: string, value: any) => {
    // Önce UI'da güncelle
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

    try {
      // id formatı: "${customerId}-trip-${tripIndex}"
      const parts = String(id).split('-trip-');
      if (parts.length !== 2) {
        console.error("Geçersiz randevu ID formatı:", id);
        return;
      }
      
      const customerId = parseInt(parts[0]);
      const tripIndex = parseInt(parts[1]);
      
      // İlgili müşteriyi bul
      const customer = allCustomers.find((c: any) => c.id === customerId);
      if (!customer) {
        console.error("Müşteri bulunamadı:", customerId);
        return;
      }
      
      // Trip'i güncelle
      const updatedCustomer = { ...customer };
      if (!updatedCustomer.sales) updatedCustomer.sales = {};
      if (!updatedCustomer.sales.trips) updatedCustomer.sales.trips = [];
      
      if (updatedCustomer.sales.trips[tripIndex]) {
        updatedCustomer.sales.trips[tripIndex] = {
          ...updatedCustomer.sales.trips[tripIndex],
          [field]: value
        };
      }
      
      // API'ye gönder
      await fetch("/api/crm", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: customerId,
          sales: updatedCustomer.sales
        }),
      });
      
      // allCustomers state'ini güncelle
      setAllCustomers((prev: any[]) => 
        prev.map((c: any) => c.id === customerId ? updatedCustomer : c)
      );
    } catch (e) {
      console.error("Randevu alanı güncellenirken hata", e);
    }
  };

  const filteredRows = rows.filter((r) => {
    if (!r.appointmentDate) return false;
    
    try {
      const d = new Date(r.appointmentDate);
      if (isNaN(d.getTime())) return false;
      
      if (year !== "all" && d.getFullYear() !== year) return false;
      if (month !== "all" && d.getMonth() !== month) return false;
    } catch {
      return false;
    }
    
    if (advisorFilter !== "all" && r.advisor !== advisorFilter) return false;
    if (doctorFilter !== "all" && r.doctor !== doctorFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    return true;
  });

  const exportToCSV = () => {
    if (!filteredRows.length) return;
    const header = "Müşteri Adı,Randevu Tarihi,Seyahat,Doktor,Hizmet,Geliş Tarihi,Gidiş Tarihi,Otel,Danışman,Durum\n";
    const body = filteredRows
      .map((r) =>
        `"${r.name}","${formatDate(r.appointmentDate)} ${r.appointmentTime}","${r.tripName}","${r.doctor}","${r.service}","${formatDateTime(r.arrivalDate, r.arrivalTime)}","${formatDateTime(r.departureDate, r.departureTime)}","${r.hotel}","${r.advisor}","${r.status}"`
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "randevular.csv";
    a.click();
  };

  const openNewAppointmentModal = () => {
    setEditingRow(null);
    setSelectedCustomer(null);
    setFormDate("");
    setFormTime("");
    setFormAdvisor("");
    setFormDoctor("");
    setFormVisit("");
    setFormStatus("");
    setFormNote("");
    setModalOpen(true);
  };

  const handleSaveAppointment = async () => {
    if (!selectedCustomer) {
      alert("Lütfen bir müşteri seçin");
      return;
    }

    try {
      const base = selectedCustomer;
      const name = base.name || base.personal?.name || "";
      const phone = base.phone || base.personal?.phone || "";
      const advisor = formAdvisor || base.advisor || "";
      const category = base.category || "";

      let reminder: any = undefined;
      if (formDate && formTime) {
        const dt = new Date(`${formDate}T${formTime}`);
        if (!isNaN(dt.getTime())) {
          reminder = {
            enabled: true,
            datetime: dt.toISOString(),
            notes: formNote,
            sent: false,
          };
        }
      }

      const payload: any = {
        name,
        phone,
        advisor,
        service: "Randevu",
        status: formStatus || base.status || "Yeni Randevu",
        category,
        doctor: formDoctor,
        visit: formVisit,
      };

      if (reminder) {
        payload.reminder = reminder;
      }

      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error("Yeni randevu kaydedilemedi", await res.text());
        return;
      }

      setModalOpen(false);
      await fetchAppointments();
    } catch (e) {
      console.error("Randevu kaydedilirken hata", e);
    }
  };

  const columns: GridColDef[] = [
    { 
      field: "name", 
      headerName: t("appointments.columns.name"), 
      flex: 1, 
      minWidth: 180,
      renderCell: (params) => (
        <Box 
          sx={{ 
            cursor: "pointer", 
            color: "#000", 
            fontWeight: 400,
            display: "flex",
            alignItems: "center",
            gap: 1
          }}
          onClick={() => window.location.href = `/customers/${params.row.customerId}`}
        >
          <Box component="span" sx={{ color: "#6c757d" }}>👤</Box>
          {params.value}
        </Box>
      ),
    },
    { 
      field: "appointmentDate", 
      headerName: t("appointments.columns.appointmentDate"), 
      width: 150,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <CalendarTodayIcon sx={{ color: "#6c757d", fontSize: 16 }} />
          <Stack spacing={0.3}>
            <Typography variant="body2" sx={{ color: "#000", fontSize: "0.875rem" }}>
              {formatDate(params.value)}
            </Typography>
            <Typography variant="caption" sx={{ color: "#6c757d", fontSize: "0.75rem" }}>
              {params.row.appointmentTime || "--:--"}
            </Typography>
          </Stack>
        </Stack>
      ),
    },
    { 
      field: "tripName", 
      headerName: t("appointments.columns.tripName"), 
      width: 120,
      renderCell: (params) => {
        const tripNumber = params.value?.match(/\d+/)?.[0] || "1";
        const colors: Record<string, string> = {
          "1": "#3b82f6", // Mavi
          "2": "#22c55e", // Yeşil
          "3": "#f59e0b", // Turuncu
        };
        const bgColor = colors[tripNumber] || "#6b7280";
        
        return (
          <Box sx={{ 
            display: "inline-block",
            bgcolor: bgColor, 
            color: "#fff", 
            px: 0.5, 
            py: 0.3, 
            borderRadius: 0.3,
            fontSize: "0.65rem",
            fontWeight: 500,
            whiteSpace: "nowrap",
            lineHeight: 1.2
          }}>
            {params.value}
          </Box>
        );
      },
    },
    { 
      field: "doctor", 
      headerName: t("appointments.columns.doctor"), 
      width: 200,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: "#000", fontSize: "0.875rem" }}>
          {params.value}
        </Typography>
      ),
    },
    { 
      field: "service", 
      headerName: t("appointments.columns.service"), 
      width: 200,
      renderCell: (params) => (
        <Typography sx={{ fontSize: "0.875rem", color: "#111827" }}>
          {params.value || "-"}
        </Typography>
      ),
    },
    { 
      field: "arrivalDate", 
      headerName: t("appointments.columns.arrivalDate"), 
      width: 140,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <FlightLandIcon sx={{ color: "#22c55e", fontSize: 18 }} />
          <Stack spacing={0.3}>
            <Typography variant="body2" sx={{ color: "#22c55e", fontSize: "0.75rem", fontWeight: 500 }}>
              {formatDate(params.value).split(" ")[0]}
            </Typography>
            <Typography variant="caption" sx={{ color: "#22c55e", fontSize: "0.7rem" }}>
              {params.row.arrivalTime || "--:--"}
            </Typography>
          </Stack>
        </Stack>
      ),
    },
    { 
      field: "departureDate", 
      headerName: t("appointments.columns.departureDate"), 
      width: 140,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <FlightTakeoffIcon sx={{ color: "#ef4444", fontSize: 18 }} />
          <Stack spacing={0.3}>
            <Typography variant="body2" sx={{ color: "#ef4444", fontSize: "0.75rem", fontWeight: 500 }}>
              {formatDate(params.value).split(" ")[0]}
            </Typography>
            <Typography variant="caption" sx={{ color: "#ef4444", fontSize: "0.7rem" }}>
              {params.row.departureTime || "--:--"}
            </Typography>
          </Stack>
        </Stack>
      ),
    },
    { 
      field: "returnPickupTime", 
      headerName: t("appointments.columns.returnPickupTime"), 
      width: 180,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <AccessTimeIcon sx={{ color: "#6c757d", fontSize: 16 }} />
          <Typography variant="body2" sx={{ color: "#6c757d", fontSize: "0.875rem" }}>
            {params.value || "--:--"}
          </Typography>
        </Stack>
      ),
    },
    { 
      field: "hotel", 
      headerName: t("appointments.columns.hotel"), 
      flex: 1, 
      minWidth: 220,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <HotelIcon sx={{ color: "#6c757d", fontSize: 16 }} />
          <Typography variant="body2" sx={{ color: "#000", fontSize: "0.875rem" }}>
            {params.value || "-"}
          </Typography>
        </Stack>
      ),
    },
    { 
      field: "status", 
      headerName: t("appointments.columns.status"), 
      width: 150,
      renderCell: (params) => {
        const statusColors: Record<string, { bg: string; color: string }> = {
          "Satış": { bg: "#dcfce7", color: "#16a34a" },
          "Satış Kapalı": { bg: "#fee2e2", color: "#dc2626" },
        };
        const style = statusColors[params.value] || { bg: "#f3f4f6", color: "#6b7280" };
        
        return (
          <Box sx={{ 
            display: "inline-block",
            bgcolor: style.bg, 
            color: style.color, 
            px: 1.5, 
            py: 0.5, 
            borderRadius: 1,
            fontSize: "0.75rem",
            fontWeight: 600,
            whiteSpace: "nowrap"
          }}>
            {params.value || "-"}
          </Box>
        );
      },
    },
  ];

  const columnVisibilityModel = columns.reduce<Record<string, boolean>>((acc, col) => {
    acc[col.field] = visibleColumns.includes(col.field as string);
    return acc;
  }, {});

  return (
    <Box sx={{ 
      width: "100%", 
      maxWidth: "100vw",
      height: "calc(100vh - 80px)", 
      p: 3, 
      bgcolor: "#f8f9fa",
      overflow: "hidden",
      position: "relative"
    }}>
      <Stack spacing={2} sx={{ maxWidth: "100%", overflow: "hidden" }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h5" fontWeight={700} color="#000">
              {t("appointments.page.title")}
            </Typography>
            <Typography variant="body2" color="#6c757d" sx={{ mt: 0.5 }}>
              {t("appointments.page.title")}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<FileDownloadIcon />} 
              onClick={exportToCSV}
              sx={{ 
                textTransform: "none",
                fontWeight: 500,
                color: "#000",
                borderColor: "#dee2e6",
                "&:hover": {
                  borderColor: "#adb5bd",
                  bgcolor: "#f8f9fa"
                }
              }}
            >
              Excel'e Aktar
            </Button>
            <Button 
              variant="contained" 
              size="small"
              onClick={openNewAppointmentModal}
              sx={{ 
                textTransform: "none",
                fontWeight: 600,
                bgcolor: "#0d6efd",
                "&:hover": {
                  bgcolor: "#0b5ed7"
                }
              }}
            >
              Yenile
            </Button>
          </Stack>
        </Stack>

        {/* Filters */}
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Ara..."
            sx={{ width: 200, bgcolor: "#fff" }}
          />

          <FormControl size="small" sx={{ width: 120, bgcolor: "#fff" }}>
            <InputLabel>Aralık</InputLabel>
            <Select label="Aralık" value="all">
              <MenuItem value="all">Tümü</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ width: 100, bgcolor: "#fff" }}>
            <InputLabel>Yıl</InputLabel>
            <Select
              label="Yıl"
              value={year}
              onChange={(e) => setYear(e.target.value as any)}
            >
              <MenuItem value="all">Tümü</MenuItem>
              {YEARS.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ width: 110, bgcolor: "#fff" }}>
            <InputLabel>Ay</InputLabel>
            <Select
              label="Ay"
              value={month}
              onChange={(e) => setMonth(e.target.value as any)}
            >
              <MenuItem value="all">Tümü</MenuItem>
              {MONTHS.map((m) => (
                <MenuItem key={m.value} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ width: 140, bgcolor: "#fff" }}>
            <InputLabel>Danışman</InputLabel>
            <Select
              label="Danışman"
              value={advisorFilter}
              onChange={(e) => setAdvisorFilter(e.target.value as any)}
            >
              <MenuItem value="all">Tümü</MenuItem>
              {Array.from(new Set(rows.map((r) => r.advisor).filter(Boolean))).map((a) => (
                <MenuItem key={a} value={a}>{a}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ width: 140, bgcolor: "#fff" }}>
            <InputLabel>Doktor</InputLabel>
            <Select
              label="Doktor"
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value as any)}
            >
              <MenuItem value="all">Tümü</MenuItem>
              {Array.from(new Set(rows.map((r) => r.doctor).filter(Boolean))).map((d) => (
                <MenuItem key={d} value={d}>{d}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ width: 120, bgcolor: "#fff" }}>
            <InputLabel>Durum</InputLabel>
            <Select
              label="Durum"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <MenuItem value="all">Tümü</MenuItem>
              {Array.from(new Set(rows.map((r) => r.status).filter(Boolean))).map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button 
            variant="text" 
            size="small"
            startIcon={<span>🔍</span>}
            onClick={(e) => setColumnMenuAnchor(e.currentTarget)}
            sx={{ 
              textTransform: "none",
              color: "#6c757d",
              "&:hover": {
                bgcolor: "#f8f9fa"
              }
            }}
          >
            Görünüm
          </Button>
          
          <Menu
            anchorEl={columnMenuAnchor}
            open={Boolean(columnMenuAnchor)}
            onClose={() => setColumnMenuAnchor(null)}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 200,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
              }
            }}
          >
            <Box sx={{ px: 2, py: 1, borderBottom: "1px solid #e9ecef" }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Sütün Görünümü
              </Typography>
            </Box>
            {columns.map((col) => (
              <MenuItem 
                key={col.field} 
                onClick={() => {
                  const field = col.field as string;
                  setVisibleColumns(prev => 
                    prev.includes(field) 
                      ? prev.filter(f => f !== field)
                      : [...prev, field]
                  );
                }}
                sx={{ py: 0.5 }}
              >
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={visibleColumns.includes(col.field as string)}
                      size="small"
                    />
                  }
                  label={col.headerName}
                  sx={{ m: 0, width: "100%" }}
                />
              </MenuItem>
            ))}
          </Menu>
        </Stack>

        {/* Table */}
        <Paper sx={{ 
          height: "calc(100vh - 240px)", 
          width: "100%",
          maxWidth: "100%",
          bgcolor: "#fff",
          borderRadius: 1,
          overflow: "hidden",
          border: "1px solid #dee2e6"
        }}>
          <DataGrid
            rows={filteredRows}
            columns={columns}
            loading={loading}
            columnVisibilityModel={columnVisibilityModel}
            disableRowSelectionOnClick
            disableColumnResize
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            sx={{
              border: "none",
              "& .MuiDataGrid-columnHeaders": {
                bgcolor: "#f8f9fa",
                color: "#495057",
                fontWeight: 600,
                fontSize: "0.75rem",
                borderBottom: "1px solid #dee2e6",
                minHeight: "48px !important",
                maxHeight: "48px !important",
              },
              "& .MuiDataGrid-columnHeader": {
                padding: "0 12px",
              },
              "& .MuiDataGrid-columnHeaderTitle": {
                fontWeight: 600,
              },
              "& .MuiDataGrid-cell": {
                borderBottom: "1px solid #f1f3f5",
                py: 1,
              },
              "& .MuiDataGrid-row": {
                bgcolor: "#fff",
                "&:hover": { 
                  bgcolor: "#f8f9fa",
                  cursor: "pointer"
                },
              },
              "& .MuiDataGrid-footerContainer": {
                borderTop: "1px solid #dee2e6",
                bgcolor: "#f8f9fa",
              },
            }}
          />
        </Paper>
      </Stack>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni Randevu</DialogTitle>
        <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <Autocomplete
            options={allCustomers}
            getOptionLabel={(option: any) =>
              option
                ? `${option.name || option.personal?.name || ""}${
                    option.phone || option.personal?.phone
                      ? " - " + (option.phone || option.personal?.phone)
                      : ""
                  }`
                : ""
            }
            value={selectedCustomer}
            onChange={(_, value) => setSelectedCustomer(value)}
            renderInput={(params) => <TextField {...params} label="Müşteri" size="small" />}
          />

          <Stack direction="row" spacing={2}>
            <TextField
              label="Tarih"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
            />
            <TextField
              label="Saat"
              type="time"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formTime}
              onChange={(e) => setFormTime(e.target.value)}
            />
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField
              label="Danışman"
              size="small"
              fullWidth
              value={formAdvisor}
              onChange={(e) => setFormAdvisor(e.target.value)}
              placeholder={selectedCustomer?.advisor || ""}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Doktor</InputLabel>
              <Select
                label="Doktor"
                value={formDoctor}
                onChange={(e) => setFormDoctor(e.target.value as string)}
              >
                <MenuItem value="">
                  <em>Seçiniz</em>
                </MenuItem>
                {doctors.map((d) => (
                  <MenuItem key={d.id} value={d.name}>
                    {d.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Stack direction="row" spacing={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Seyahat</InputLabel>
              <Select
                label="Seyahat"
                value={formVisit}
                onChange={(e) => setFormVisit(e.target.value as string)}
              >
                <MenuItem value="">
                  <em>Seçiniz</em>
                </MenuItem>
                <MenuItem value="1. Seyahat">1. Seyahat</MenuItem>
                <MenuItem value="2. Seyahat">2. Seyahat</MenuItem>
                <MenuItem value="3. Seyahat">3. Seyahat</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Durum"
              size="small"
              fullWidth
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value)}
              placeholder={selectedCustomer?.status || "Yeni Randevu"}
            />
          </Stack>

          <TextField
            label="Not"
            size="small"
            fullWidth
            multiline
            minRows={2}
            value={formNote}
            onChange={(e) => setFormNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>İptal</Button>
          <Button variant="contained" onClick={handleSaveAppointment}>
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
