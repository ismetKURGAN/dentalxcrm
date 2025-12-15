"use client";

import React, { useEffect, useState } from "react";
import { Box, Typography, TextField, Stack, Button } from "@mui/material";
import { useAuth } from "../../components/AuthProvider";

interface WhatsappSettings {
  baseUrl: string;
  defaultSession: string;
  apiKey: string;
  sendDelayMs: number;
}

const DEFAULT_SETTINGS: WhatsappSettings = {
  baseUrl: "",
  defaultSession: "",
  apiKey: "",
  sendDelayMs: 1500,
};

export default function WhatsappSettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("Admin") || user?.roles?.includes("SuperAdmin");
  const [settings, setSettings] = useState<WhatsappSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/whatsapp", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      }
    } catch (e) {
      console.error("WhatsApp ayarları yüklenemedi", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Yetkisiz Erişim
        </Typography>
        <Typography variant="body2" color="text.secondary">
          WhatsApp oturum ve bağlantı ayarları sadece Admin ve SuperAdmin kullanıcılar tarafından görüntülenebilir ve değiştirilebilir.
        </Typography>
      </Box>
    );
  }

  const handleChange = (key: keyof WhatsappSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedMessage("");
    try {
      const res = await fetch("/api/settings/whatsapp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSavedMessage("Ayarlar kaydedildi.");
      }
    } catch (e) {
      console.error("WhatsApp ayarları kaydedilemedi", e);
    }
    setSaving(false);
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 720 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          WhatsApp Ayarları
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Waha / WhatsApp entegrasyonu için temel bağlantı ayarlarını yapılandırın.
        </Typography>
      </Box>

      <Stack spacing={2.5}>
        <TextField
          fullWidth
          label="Waha Base URL (ör: http://waha:3000/api)"
          value={settings.baseUrl}
          onChange={(e) => handleChange("baseUrl", e.target.value)}
        />

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            fullWidth
            label="Varsayılan Oturum (default session name)"
            value={settings.defaultSession}
            onChange={(e) => handleChange("defaultSession", e.target.value)}
          />
          <TextField
            fullWidth
            label="API Key (varsa)"
            value={settings.apiKey}
            onChange={(e) => handleChange("apiKey", e.target.value)}
          />
        </Stack>

        <TextField
          label="Toplu Gönderim Gecikmesi (ms)"
          type="number"
          helperText="Toplu WhatsApp kampanyalarında iki mesaj arası beklenecek süre."
          value={settings.sendDelayMs}
          onChange={(e) => handleChange("sendDelayMs", Number(e.target.value) || 0)}
          sx={{ width: { xs: "100%", md: 260 } }}
        />

        <Stack direction="row" spacing={2} alignItems="center" mt={1}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
          {savedMessage && (
            <Typography variant="caption" color="success.main">
              {savedMessage}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
