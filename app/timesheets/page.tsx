"use client";

import React, { useEffect, useMemo, useState, useContext } from "react";
import {
  Box,
  Typography,
  Stack,
  Chip,
  Button,
  Grid,
  Avatar,
  Card,
  CardContent,
  IconButton,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import ViewAgendaIcon from "@mui/icons-material/ViewAgenda";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import { ThemeModeContext } from "../components/ThemeRegistry";

function getInitials(name: string) {
  if (!name) return "?";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function TimesheetsPage() {
  const { mode } = useContext(ThemeModeContext);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [strategy] = useState<"sequential" | "balanced">("sequential");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUsers(data || []);
      }
    } catch (e) {
      console.error("Kullanıcılar alınamadı", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const activeCount = useMemo(() => users.length, [users]);
  const now = useMemo(() => new Date(), [users.length]);
  const dayName = now.toLocaleDateString("tr-TR", { weekday: "long" });
  const timeStr = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  return (
    <Box sx={{ width: "100%", height: "100%", p: { xs: 1.5, md: 2 }, bgcolor: mode === "dark" ? "#1E1B3E" : "#F3F4F6", minHeight: "100vh" }}>
      {/* Header Container with Info Cards */}
      <Box
        sx={{
          width: "100%",
          mb: 4,
          px: { xs: 1.5, md: 2.5 },
          pt: 2.5,
          pb: 2.5,
          bgcolor: mode === "dark" ? "#252047" : "#F9FAFB",
          borderRadius: 3,
        }}
      >
        <Stack spacing={2.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Mesai Takip Sistemi
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Danışmanların çalışma durumlarını takip edin ve müşteri atama sırasını görün.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                variant="outlined"
                size="small"
                startIcon={strategy === "sequential" ? <ViewAgendaIcon /> : <ViewModuleIcon />}
              >
                Strateji: {strategy === "sequential" ? "Sıralı" : "Dengeli"}
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={load}
              >
                Yenile
              </Button>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={3} flexWrap="wrap">
            <Box sx={{ minWidth: 190, px: 3, py: 1.8, borderRadius: 2, bgcolor: "#1D4ED8", color: "white" }}>
              <Typography variant="subtitle2">Strateji</Typography>
              <Typography variant="h6" fontWeight="bold">
                {strategy === "sequential" ? "Sıralı" : "Dengeli"}
              </Typography>
            </Box>
            <Box sx={{ minWidth: 190, px: 3, py: 1.8, borderRadius: 2, bgcolor: "#16A34A", color: "white" }}>
              <Typography variant="subtitle2">Aktif Danışman</Typography>
              <Typography variant="h6" fontWeight="bold">
                {activeCount}/{users.length}
              </Typography>
            </Box>
            <Box sx={{ minWidth: 190, px: 3, py: 1.8, borderRadius: 2, bgcolor: "#F97316", color: "white" }}>
              <Typography variant="subtitle2">Güncel Saat</Typography>
              <Typography variant="h6" fontWeight="bold">
                {timeStr}
              </Typography>
            </Box>
            <Box sx={{ minWidth: 190, px: 3, py: 1.8, borderRadius: 2, bgcolor: "#8B5CF6", color: "white" }}>
              <Typography variant="subtitle2">Bugün</Typography>
              <Typography variant="h6" fontWeight="bold" sx={{ textTransform: "capitalize" }}>
                {dayName}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Box>

      {/* Users grid */}
      <Grid
        container
        spacing={4}
        sx={{ px: { xs: 0, md: 2 }, pb: 4, justifyContent: { xs: "flex-start", lg: "flex-start" } }}
      >
        {users.map((u) => (
          <Grid key={u.id} size={{ xs: 12, sm: 6, md: 6, lg: 4 }} sx={{ display: "flex", justifyContent: "center" }}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: mode === "dark" ? "rgba(124, 58, 237, 0.2)" : "#E5E7EB",
                bgcolor: mode === "dark" ? "#252047" : undefined,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                maxWidth: 360,
                width: "100%",
              }}
            >
              <CardContent sx={{ pt: 2.6, pb: 2.8, px: 2.4 }}>
                <Stack direction="row" spacing={2.2} alignItems="center" mb={2.2}>
                  <Avatar sx={{ bgcolor: mode === "dark" ? "#6366f1" : "#1D4ED8" }}>{getInitials(u.name)}</Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {u.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {u.email}
                    </Typography>
                  </Box>
                  <Box flexGrow={1} />
                  <Chip
                    label="Aktif"
                    color="success"
                    size="small"
                    sx={{ fontSize: 11, height: 22 }}
                  />
                </Stack>

                <Stack direction="row" spacing={1.4} mb={2}>
                  <Chip
                    label="Sırayla Atama"
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: 11, borderRadius: 9999 }}
                  />
                </Stack>

                <Box
                  sx={{
                    mt: 1.4,
                    p: 1.6,
                    borderRadius: 2,
                    bgcolor: mode === "dark" ? "rgba(16, 185, 129, 0.1)" : "#ECFDF3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="caption" sx={{ color: mode === "dark" ? "#6EE7B7" : "#15803D" }}>
                    Müşteri ataması yapılabilir
                  </Typography>
                  <IconButton size="small" sx={{ color: mode === "dark" ? "#4ADE80" : "#16A34A" }}>
                    <ViewAgendaIcon fontSize="inherit" />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {!loading && users.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <Box
              sx={{
                p: 4,
                textAlign: "center",
                borderRadius: 2,
                border: mode === "dark" ? "1px dashed rgba(124, 58, 237, 0.3)" : "1px dashed #E5E7EB",
                color: "text.secondary",
              }}
            >
              <Typography variant="body2">
                Henüz kullanıcı bulunmuyor. Önce Kullanıcılar ekranından danışman ekleyin.
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
