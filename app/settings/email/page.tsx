"use client";

import React, { useEffect, useState } from "react";
import { Box, Typography, TextField, Stack, Switch, FormControlLabel, Button } from "@mui/material";

interface EmailSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromName: string;
  fromEmail: string;
}

const DEFAULT_SETTINGS: EmailSettings = {
  host: "",
  port: 587,
  secure: false,
  user: "",
  password: "",
  fromName: "",
  fromEmail: "",
};

export default function EmailSettingsPage() {
  const [settings, setSettings] = useState<EmailSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/email", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      }
    } catch (e) {
      console.error("E-posta ayarları yüklenemedi", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (key: keyof EmailSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedMessage("");
    try {
      const res = await fetch("/api/settings/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSavedMessage("Ayarlar kaydedildi.");
      }
    } catch (e) {
      console.error("E-posta ayarları kaydedilemedi", e);
    }
    setSaving(false);
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 720 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          E-Posta Ayarları
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sistemin kampanya ve bildirim e-postalarını göndermek için kullanacağı SMTP ayarlarını yapılandırın.
        </Typography>
      </Box>

      <Stack spacing={2.5}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            fullWidth
            label="SMTP Host"
            value={settings.host}
            onChange={(e) => handleChange("host", e.target.value)}
          />
          <TextField
            label="Port"
            type="number"
            value={settings.port}
            onChange={(e) => handleChange("port", Number(e.target.value) || 0)}
            sx={{ width: { xs: "100%", md: 140 } }}
          />
        </Stack>

        <FormControlLabel
          control={
            <Switch
              checked={settings.secure}
              onChange={(e) => handleChange("secure", e.target.checked)}
            />
          }
          label="TLS/SSL kullan (genellikle 465 için güvenli, 587 için kapalı)"
        />

        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Kullanıcı Adı"
            value={settings.user}
            onChange={(e) => handleChange("user", e.target.value)}
          />
          <TextField
            fullWidth
            label="Parola"
            type="password"
            value={settings.password}
            onChange={(e) => handleChange("password", e.target.value)}
          />
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            fullWidth
            label="Gönderici İsim (From Name)"
            value={settings.fromName}
            onChange={(e) => handleChange("fromName", e.target.value)}
          />
          <TextField
            fullWidth
            label="Gönderici Adres (From Email)"
            type="email"
            value={settings.fromEmail}
            onChange={(e) => handleChange("fromEmail", e.target.value)}
          />
        </Stack>

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
