"use client";

import { useState, useEffect } from "react";
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
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useAuth } from "./AuthProvider";
import { useI18n } from "./I18nProvider";
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

export default function TopBar() {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useI18n();
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [type, setType] = useState<CalendarEventType>("appointment");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

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
    <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mb: 2, pr: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        {/* Dil seçici */}
        <Box sx={{ display: "flex", alignItems: "center", borderRadius: 999, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <Button
            size="small"
            onClick={() => setLanguage("tr")}
            variant={language === "tr" ? "contained" : "text"}
            sx={{
              minWidth: 36,
              px: 1,
              fontSize: "0.7rem",
              borderRadius: 0,
            }}
          >
            TR
          </Button>
          <Button
            size="small"
            onClick={() => setLanguage("en")}
            variant={language === "en" ? "contained" : "text"}
            sx={{
              minWidth: 36,
              px: 1,
              fontSize: "0.7rem",
              borderRadius: 0,
            }}
          >
            EN
          </Button>
        </Box>

        {user && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <AccountCircleIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {user.name}
            </Typography>
          </Box>
        )}

        <Tooltip title="Takvim / Randevular">
          <IconButton color="primary" onClick={handleOpen}>
            <CalendarMonthIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Çıkış yap">
          <IconButton color="error" onClick={logout}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Dialog open={open} onClose={handleClose} fullScreen>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">Takvim</Typography>
          <Button onClick={handleClose}>Kapat</Button>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: 3,
                height: "calc(100vh - 140px)",
              }}
            >
              {/* SOL: BÜYÜK AY TAKVİMİ */}
              <Box
                sx={{
                  flex: 1.3,
                  minWidth: 420,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <DateCalendar
                  value={selectedDate}
                  onChange={(newValue) => setSelectedDate(newValue)}
                  slots={{ day: CustomDay as any }}
                  slotProps={{ day: { events } as any }}
                />
              </Box>

              <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", md: "block" } }} />

              {/* SAĞ: SEÇİLİ GÜN İÇİN FORM + LİSTE */}
              <Box
                sx={{
                  flex: 1,
                  minWidth: 360,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1" fontWeight="bold">
                    Seçili Gün
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedDate
                      ? format(selectedDate, "d MMMM yyyy, EEEE", { locale: undefined })
                      : "Tarih seçilmedi"}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={2}>
                  <Button
                    variant={type === "appointment" ? "contained" : "outlined"}
                    onClick={() => setType("appointment")}
                  >
                    Randevu
                  </Button>
                  <Button
                    variant={type === "reminder" ? "contained" : "outlined"}
                    onClick={() => setType("reminder")}
                  >
                    Hatırlatıcı
                  </Button>
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label={type === "appointment" ? "Randevu Başlığı" : "Hatırlatıcı Notu"}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Saat"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: { xs: "100%", sm: 140 } }}
                  />
                </Stack>

                <Button
                  variant="contained"
                  onClick={handleAddOrUpdate}
                  disabled={!selectedDate || !title.trim() || !time}
                  sx={{ alignSelf: "flex-start" }}
                >
                  {editingId ? "Güncelle" : "Ekle"}
                </Button>

                <Box sx={{ flexGrow: 1, mt: 1, overflowY: "auto" }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Bu gün için randevu / hatırlatıcılar
                  </Typography>
                  {eventsForSelectedDay.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Kayıt yok.
                    </Typography>
                  ) : (
                    <Stack spacing={1} mt={1}>
                      {eventsForSelectedDay.map((ev) => (
                        <Box
                          key={ev.id}
                          sx={{
                            p: 1,
                            borderRadius: 1,
                            bgcolor: ev.type === "appointment" ? "#E3F2FD" : "#FFF8E1",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1,
                          }}
                        >
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {ev.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {ev.type === "appointment" ? "Randevu" : "Hatırlatıcı"} • {ev.time}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Button size="small" variant="outlined" onClick={() => handleEdit(ev)}>
                              Düzenle
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              variant="text"
                              onClick={() => handleDelete(ev.id)}
                            >
                              Sil
                            </Button>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
              </Box>
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
            Bu ekran, randevu ve hatırlatıcılar için genel takvim hub'ı olacak.
          </Typography>
          <Button onClick={handleClose}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
