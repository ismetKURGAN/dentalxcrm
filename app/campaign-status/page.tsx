"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Chip,
} from "@mui/material";

interface Campaign {
  id: string;
  type: "whatsapp" | "email";
  segmentId?: number;
  segmentTitle?: string;
  totalTargets: number;
  sent?: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export default function CampaignStatusPage() {
  const [tab, setTab] = useState<"email" | "whatsapp">("whatsapp");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/campaigns", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setCampaigns(data);
      } catch (e) {
        console.error("Kampanyalar okunamadı", e);
      }
    };
    fetchData();
  }, []);

  const filtered = useMemo(
    () =>
      campaigns.filter((c) => {
        if (c.type !== tab) return false;
        if (!search) return true;
        const key = `${c.id} ${c.segmentTitle || ""}`.toLowerCase();
        return key.includes(search.toLowerCase());
      }),
    [campaigns, tab, search]
  );

  const current = filtered[0];

  return (
    <Box sx={{ width: "100%", height: "100%", p: 2.5, bgcolor: "#F3F4F6" }}>
      <Paper sx={{ p: 2.5, borderRadius: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="E-posta Kampanyaları" value="email" />
          <Tab label="Whatsapp Kampanyaları" value="whatsapp" />
        </Tabs>

        <Typography variant="subtitle1" fontWeight="bold" mb={1}>
          {tab === "whatsapp" ? "WhatsApp Mesaj Durumu" : "E-posta Kampanya Durumu"}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Kampanya durumlarını takip edin
        </Typography>

        <Stack direction="row" spacing={1} mb={3}>
          <TextField
            fullWidth
            size="small"
            placeholder="Kampanya anahtarını girin (ID veya başlık)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button variant="contained">Ara</Button>
        </Stack>

        {current ? (
          <Stack spacing={3}>
            <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: "#F9FAFB" }}>
              <Typography variant="subtitle2" color="text.secondary" mb={1}>
                Kampanya Detayları
              </Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Segment
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {current.segmentTitle || "Bilinmiyor"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Toplam Müşteri
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {current.totalTargets}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Gönderilen
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {current.sent ?? 0}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Durum
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Chip
                      label={current.status}
                      size="small"
                      color={current.status === "completed" ? "success" : current.status === "running" ? "warning" : "default"}
                    />
                  </Stack>
                </Box>
              </Stack>
            </Paper>

            <Box>
              <Typography variant="subtitle2" mb={1}>
                Son Kampanyalar
              </Typography>
              <Paper sx={{ borderRadius: 2 }}>
                <Box sx={{ px: 2, py: 1, bgcolor: "#F9FAFB", borderBottom: "1px solid #E5E7EB", display: "flex", fontSize: "0.8rem", fontWeight: 600, color: "#6B7280" }}>
                  <Box sx={{ flex: 1 }}>Segment</Box>
                  <Box sx={{ width: 140 }}>Tür</Box>
                  <Box sx={{ width: 160 }}>Toplam</Box>
                  <Box sx={{ width: 160 }}>Gönderilen</Box>
                  <Box sx={{ width: 200 }}>Tarih</Box>
                </Box>
                {filtered.map((c) => (
                  <Box
                    key={c.id}
                    sx={{
                      px: 2,
                      py: 1.25,
                      borderBottom: "1px solid #F3F4F6",
                      display: "flex",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      "&:hover": { bgcolor: "#F9FAFB" },
                    }}
                    onClick={() => setSearch(c.id)}
                  >
                    <Box sx={{ flex: 1 }}>{c.segmentTitle || c.id}</Box>
                    <Box sx={{ width: 140 }}>{c.type}</Box>
                    <Box sx={{ width: 160 }}>{c.totalTargets}</Box>
                    <Box sx={{ width: 160 }}>{c.sent ?? 0}</Box>
                    <Box sx={{ width: 200 }}>{new Date(c.createdAt).toLocaleString()}</Box>
                  </Box>
                ))}
                {!filtered.length && (
                  <Box sx={{ p: 3, textAlign: "center", color: "#9CA3AF", fontSize: "0.9rem" }}>
                    Henüz bu türde kampanya kaydı yok.
                  </Box>
                )}
              </Paper>
            </Box>
          </Stack>
        ) : (
          <Paper sx={{ p: 4, borderRadius: 2, textAlign: "center", color: "#9CA3AF" }}>
            <Typography variant="subtitle1" fontWeight="bold" mb={1}>
              Kampanya Seçilmedi
            </Typography>
            <Typography variant="body2">Detayları görüntülemek için bir kampanya seçin veya anahtar girin.</Typography>
          </Paper>
        )}
      </Paper>
    </Box>
  );
}
