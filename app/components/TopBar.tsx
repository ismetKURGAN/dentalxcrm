"use client";

import { useState, useEffect, useContext, useRef } from "react";
import {
  Box,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  Divider,
  Avatar,
  useTheme,
  Badge,
  Popover,
  List,
  ListItem,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import SettingsIcon from "@mui/icons-material/Settings";
import { useAuth } from "./AuthProvider";
import { useI18n } from "./I18nProvider";
import { ThemeModeContext } from "./ThemeRegistry";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { PickersDay, PickersDayProps } from "@mui/x-date-pickers/PickersDay";
import { format, isSameDay } from "date-fns";

type CalendarEventType = "appointment" | "reminder";

type CalendarEventSource = "calendar" | "crm";

type CalendarEvent = {
  id: number;
  type: CalendarEventType;
  date: Date;
  time: string; // HH:mm
  title: string;
  customerId?: number;
  source: CalendarEventSource;
};

interface CustomDayProps extends Omit<PickersDayProps, 'day'> {
  day: Date;
  events?: CalendarEvent[];
}

function CustomDay(props: CustomDayProps) {
  const { day, outsideCurrentMonth, events = [], ...other } = props;
  const dayEvents = events.filter((e) => isSameDay(e.date, day));

  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      <PickersDay
        day={day}
        outsideCurrentMonth={outsideCurrentMonth}
        {...other}
        sx={{
          ...other.sx,
          width: "100%",
          height: 64,
          alignItems: "flex-start",
          pt: 0.5,
          px: 0.5,
          borderRadius: 1,
        }}
      />
      {dayEvents.length > 0 && (
        <Box
          sx={{
            position: "absolute",
            left: 4,
            right: 4,
            bottom: 4,
            display: "flex",
            flexDirection: "column",
            gap: 0.25,
          }}
        >
          {dayEvents.slice(0, 2).map((ev) => (
            <Box
              key={ev.id}
              sx={{
                borderRadius: 0.5,
                px: 0.5,
                py: 0.1,
                bgcolor: ev.type === "appointment" ? "#E3F2FD" : "#FFF8E1",
              }}
            >
              <Typography
                component="span"
                sx={{ fontSize: "0.6rem", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              >
                {ev.time} · {ev.title}
              </Typography>
            </Box>
          ))}
          {dayEvents.length > 2 && (
            <Typography component="span" sx={{ fontSize: "0.6rem", color: "text.secondary" }}>
              +{dayEvents.length - 2} daha
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}

const PRICE_APPROVERS = ["Kemal Tahir", "Emre", "Buse", "Busenur", "Buse Nur"];

export default function TopBar() {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useI18n();
  const theme = useTheme();
  const { mode } = useContext(ThemeModeContext);
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [type, setType] = useState<CalendarEventType>("appointment");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Fiyat değişiklik talepleri
  const [priceRequests, setPriceRequests] = useState<any[]>([]);
  const [notifAnchorEl, setNotifAnchorEl] = useState<HTMLElement | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const notifOpen = Boolean(notifAnchorEl);

  const canApprove =
    user?.roles?.includes("SuperAdmin") ||
    PRICE_APPROVERS.includes(user?.name || "");

  const fetchPriceRequests = async () => {
    if (!canApprove) return;
    try {
      const res = await fetch("/api/price-change-requests?status=pending", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setPriceRequests(Array.isArray(data) ? data : []);
      }
    } catch {}
  };

  useEffect(() => {
    if (!canApprove) return;
    fetchPriceRequests();
    const interval = setInterval(fetchPriceRequests, 30000);
    return () => clearInterval(interval);
  }, [canApprove]);

  const handleResolve = async (id: number, action: "approve" | "reject") => {
    setResolvingId(id);
    try {
      const res = await fetch("/api/price-change-requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, resolvedBy: user?.name }),
      });
      if (res.ok) {
        setPriceRequests((prev) => prev.filter((r) => r.id !== id));
      }
    } catch {}
    setResolvingId(null);
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Takvim açıldığında hem calendar.json'daki eventleri, hem de CRM'deki aktif hatırlatıcıları yükle
  useEffect(() => {
    if (!open) return;

    const loadEvents = async () => {
      try {
        const [calendarRes, crmRes] = await Promise.all([
          fetch("/api/calendar", { cache: "no-store" }).catch(() => null),
          fetch("/api/crm", { cache: "no-store" }).catch(() => null),
        ]);

        const loadedEvents: CalendarEvent[] = [];

        // 1) Takvim özel eventleri (calendar.json)
        if (calendarRes && calendarRes.ok) {
          const data = await calendarRes.json();
          if (Array.isArray(data)) {
            for (const raw of data) {
              if (!raw.date || !raw.time) continue;
              const d = new Date(raw.date);
              if (isNaN(d.getTime())) continue;
              loadedEvents.push({
                id: raw.id,
                type: (raw.type === "reminder" ? "reminder" : "appointment") as CalendarEventType,
                date: d,
                time: raw.time,
                title: raw.title || "",
                customerId: raw.customerId,
                source: "calendar",
              });
            }
          }
        }

        // 2) CRM'deki aktif hatırlatıcılar (read-only)
        if (crmRes && crmRes.ok) {
          const customers = await crmRes.json();
          if (Array.isArray(customers)) {
            for (const c of customers) {
              const r = c.reminder;
              if (!r || !r.enabled || !r.datetime) continue;
              const d = new Date(r.datetime);
              if (isNaN(d.getTime())) continue;
              loadedEvents.push({
                id: c.id,
                type: "reminder",
                date: d,
                time: format(d, "HH:mm"),
                title: r.notes || c.name || "Hatırlatıcı",
                customerId: c.id,
                source: "crm",
              });
            }
          }
        }

        setEvents(loadedEvents);
      } catch (e) {
        console.error("Takvim eventleri yüklenemedi", e);
      }
    };

    loadEvents();
  }, [open]);

  const handleAddOrUpdate = () => {
    if (!selectedDate || !title.trim() || !time) return;

    const persist = async () => {
      try {
        if (editingId !== null) {
          // Sadece calendar kaynaklı kayıtlar güncellenebilir
          const current = events.find((e) => e.id === editingId);
          if (current && current.source === "calendar") {
            const payload = {
              id: editingId,
              type,
              date: selectedDate.toISOString(),
              time,
              title,
              customerId: current.customerId,
            };
            const res = await fetch("/api/calendar", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (res.ok) {
              const updated = await res.json();
              const d = new Date(updated.date);
              setEvents((prev) =>
                prev.map((e) =>
                  e.id === editingId
                    ? {
                        ...e,
                        type,
                        title,
                        time,
                        date: d,
                      }
                    : e
                )
              );
            }
          }
        } else {
          const payload = {
            type,
            date: selectedDate.toISOString(),
            time,
            title,
          };
          const res = await fetch("/api/calendar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            const created = await res.json();
            const d = new Date(created.date);
            const newEvent: CalendarEvent = {
              id: created.id,
              type,
              date: d,
              time,
              title,
              source: "calendar",
            };
            setEvents((prev) => [...prev, newEvent]);
          }
        }
      } catch (e) {
        console.error("Takvim kaydı eklenemedi/güncellenemedi", e);
      } finally {
        setTitle("");
        setTime("09:00");
        setEditingId(null);
      }
    };

    void persist();
  };

  const handleEdit = (event: CalendarEvent) => {
    setSelectedDate(event.date);
    setTitle(event.title);
    setTime(event.time);
    setType(event.type);
    setEditingId(event.id);
  };

  const handleDelete = (id: number) => {
    const run = async () => {
      const target = events.find((e) => e.id === id);
      // CRM'den gelen eventler şimdilik sadece okunur; calendar kaynaklı olanları silelim
      if (target && target.source === "calendar") {
        try {
          await fetch(`/api/calendar?id=${id}`, { method: "DELETE" });
        } catch (e) {
          console.error("Takvim kaydı silinemedi", e);
        }
      }

      setEvents((prev) => prev.filter((e) => e.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setTitle("");
        setTime("09:00");
      }
    };

    void run();
  };

  const eventsForSelectedDay = selectedDate
    ? events.filter((e) => isSameDay(e.date, selectedDate))
    : [];

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        px: 2.5,
        py: 1,
        gap: 2,
        position: "sticky",
        top: 0,
        zIndex: 10,
        backgroundColor: mode === "dark" ? "#2A2550" : "background.paper",
        borderBottom: "1px solid",
        borderColor: mode === "dark" ? "rgba(124, 58, 237, 0.1)" : "divider",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Sol Taraf - Boş */}
      <Box />
      
      {/* Sağ Taraf - Kullanıcı Bilgileri */}
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Tooltip title="Takvim">
          <IconButton 
            onClick={handleOpen} 
            size="small"
            sx={{
              color: mode === "dark" ? "rgba(255,255,255,0.9)" : "inherit",
              "&:hover": { bgcolor: mode === "dark" ? "rgba(124, 58, 237, 0.1)" : "action.hover" },
            }}
          >
            <CalendarMonthIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Bildirimler">
          <IconButton
            size="small"
            onClick={(e) => setNotifAnchorEl(e.currentTarget)}
            sx={{
              color: mode === "dark" ? "rgba(255,255,255,0.9)" : "inherit",
              "&:hover": { bgcolor: mode === "dark" ? "rgba(124, 58, 237, 0.1)" : "action.hover" },
            }}
          >
            <Badge badgeContent={priceRequests.length} color="error" invisible={priceRequests.length === 0}>
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        <Popover
          open={notifOpen}
          anchorEl={notifAnchorEl}
          onClose={() => setNotifAnchorEl(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{ sx: { width: 420, maxHeight: 520, borderRadius: 2, boxShadow: 6 } }}
        >
          <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
            <Typography fontWeight={700} fontSize="0.95rem">Fiyat Değişiklik Talepleri</Typography>
          </Box>
          {!canApprove ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography color="text.secondary" fontSize="0.85rem">Bu bölüme erişim yetkiniz yok.</Typography>
            </Box>
          ) : priceRequests.length === 0 ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography color="text.secondary" fontSize="0.85rem">Bekleyen talep yok.</Typography>
            </Box>
          ) : (
            <List disablePadding sx={{ maxHeight: 420, overflowY: "auto" }}>
              {priceRequests.map((req, i) => (
                <ListItem
                  key={req.id}
                  divider={i < priceRequests.length - 1}
                  sx={{ flexDirection: "column", alignItems: "flex-start", gap: 1, py: 1.5, px: 2 }}
                >
                  <Stack direction="row" justifyContent="space-between" width="100%" alignItems="center">
                    <Typography fontWeight={600} fontSize="0.85rem">{req.customerName}</Typography>
                    <Chip label="Bekliyor" size="small" sx={{ bgcolor: "#fef3c7", color: "#92400e", fontWeight: 600, fontSize: "0.7rem" }} />
                  </Stack>
                  <Typography fontSize="0.78rem" color="text.secondary">
                    {req.requesterName} → <strong>{req.currentPrice} {req.currentCurrency}</strong> yerine <strong style={{ color: "#16a34a" }}>{req.newPrice} {req.newCurrency}</strong>
                  </Typography>
                  <Typography fontSize="0.75rem" color="text.secondary">Sebep: {req.reason}</Typography>
                  <Typography fontSize="0.7rem" color="text.secondary">{new Date(req.createdAt).toLocaleString("tr-TR")}</Typography>
                  <Stack direction="row" spacing={1} width="100%">
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={resolvingId === req.id ? <CircularProgress size={12} /> : <CheckCircleIcon />}
                      disabled={resolvingId === req.id}
                      onClick={() => handleResolve(req.id, "approve")}
                      sx={{ flex: 1, textTransform: "none", fontSize: "0.75rem" }}
                    >
                      Onayla
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={resolvingId === req.id ? <CircularProgress size={12} /> : <CancelIcon />}
                      disabled={resolvingId === req.id}
                      onClick={() => handleResolve(req.id, "reject")}
                      sx={{ flex: 1, textTransform: "none", fontSize: "0.75rem" }}
                    >
                      Reddet
                    </Button>
                    <Tooltip title="Hastayı Aç">
                      <IconButton size="small" onClick={() => window.open(`/customers/${req.customerId}`, "_blank")}>
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </ListItem>
              ))}
            </List>
          )}
        </Popover>

        <Divider orientation="vertical" flexItem sx={{ borderColor: mode === "dark" ? "rgba(124, 58, 237, 0.2)" : "divider" }} />

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            sx={{
              width: 32,
              height: 32,
              background: "linear-gradient(135deg, #7C3AED 0%, #9F67FF 100%)",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </Avatar>
          <Box>
            <Typography 
              variant="body2" 
              fontWeight={600}
              sx={{ color: mode === "dark" ? "#FFFFFF" : "#11142D", lineHeight: 1.2, fontSize: "0.8rem" }}
            >
              {user?.name || "Kullanıcı"}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ color: mode === "dark" ? "rgba(255,255,255,0.8)" : "text.secondary", lineHeight: 1, fontSize: "0.65rem" }}
            >
              {user?.roles?.[0] || "Kullanıcı"}
            </Typography>
          </Box>
        </Stack>

        <Tooltip title="Çıkış">
          <IconButton 
            onClick={logout} 
            size="small"
            sx={{
              color: "#ef4444",
              "&:hover": { bgcolor: "rgba(239, 68, 68, 0.1)" },
            }}
          >
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Takvim</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">Takvim özelliği yakında eklenecek.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
