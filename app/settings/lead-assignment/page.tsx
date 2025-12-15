"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Checkbox,
  FormControlLabel,
  Paper,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

interface AdvisorCfg {
  name: string;
  active: boolean;
}

interface LeadAssignmentSettings {
  strategy: "sequential" | "balanced";
  advisors: AdvisorCfg[];
  lastAssignedIndex: number;
}

const DEFAULT_SETTINGS: LeadAssignmentSettings = {
  strategy: "sequential",
  advisors: [],
  lastAssignedIndex: -1,
};

export default function LeadAssignmentSettingsPage() {
  const [settings, setSettings] = useState<LeadAssignmentSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/lead-assignment", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      }
    } catch (e) {
      console.error("Lead atama ayarları yüklenemedi", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateAdvisor = (index: number, patch: Partial<AdvisorCfg>) => {
    setSettings((prev) => {
      const copy = [...prev.advisors];
      copy[index] = { ...copy[index], ...patch };
      return { ...prev, advisors: copy };
    });
  };

  const moveAdvisor = (index: number, dir: -1 | 1) => {
    setSettings((prev) => {
      const copy = [...prev.advisors];
      const newIndex = index + dir;
      if (newIndex < 0 || newIndex >= copy.length) return prev;
      const tmp = copy[index];
      copy[index] = copy[newIndex];
      copy[newIndex] = tmp;
      return { ...prev, advisors: copy };
    });
  };

  const removeAdvisor = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      advisors: prev.advisors.filter((_, i) => i !== index),
    }));
  };

  const addAdvisor = () => {
    setSettings((prev) => ({
      ...prev,
      advisors: [...prev.advisors, { name: "", active: true }],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedMessage("");
    try {
      const res = await fetch("/api/settings/lead-assignment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSavedMessage("Ayarlar kaydedildi.");
      }
    } catch (e) {
      console.error("Lead atama ayarları kaydedilemedi", e);
    }
    setSaving(false);
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 900 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Lead Atama Stratejisi
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Yeni gelen leadlerin hangi danışmana hangi sırayla atanacağını buradan yönetin.
        </Typography>
      </Box>

      <Stack spacing={3}>
        <FormControl sx={{ width: { xs: "100%", md: 260 } }} size="small">
          <InputLabel>Strateji</InputLabel>
          <Select
            label="Strateji"
            value={settings.strategy}
            onChange={(e) => setSettings({ ...settings, strategy: e.target.value as LeadAssignmentSettings["strategy"] })}
          >
            <MenuItem value="sequential">Sıralı (Round-robin)</MenuItem>
            <MenuItem value="balanced" disabled>Dengeli (yakında)</MenuItem>
          </Select>
        </FormControl>

        <Paper sx={{ p: 2.5, borderRadius: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" fontWeight="bold">
              Danışman Sırası
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              size="small"
              onClick={addAdvisor}
            >
              Danışman Ekle
            </Button>
          </Stack>

          {settings.advisors.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Henüz danışman eklenmemiş. Aşağıdaki sıraya göre leadler atanacaktır.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {settings.advisors.map((a, index) => (
                <Stack
                  key={index}
                  direction={{ xs: "column", md: "row" }}
                  spacing={1.5}
                  alignItems="center"
                >
                  <TextField
                    fullWidth
                    size="small"
                    label="Danışman Adı"
                    value={a.name}
                    onChange={(e) => updateAdvisor(index, { name: e.target.value })}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={a.active}
                        onChange={(e) => updateAdvisor(index, { active: e.target.checked })}
                      />
                    }
                    label="Aktif"
                  />
                  <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" onClick={() => moveAdvisor(index, -1)}>
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => moveAdvisor(index, 1)}>
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => removeAdvisor(index)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          )}
        </Paper>

        <Stack direction="row" spacing={2} alignItems="center">
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
