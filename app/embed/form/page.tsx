"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#2563eb",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

interface FormData {
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
}

export default function EmbedFormPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    service: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [formId, setFormId] = useState<string>("");
  const [services, setServices] = useState<string[]>([]);

  useEffect(() => {
    // URL'den formId parametresini al
    const params = new URLSearchParams(window.location.search);
    const id = params.get("formId") || params.get("id") || "website-contact";
    setFormId(id);

    // Servisleri yükle
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const res = await fetch("/api/settings/services");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setServices(data.map((s: any) => s.name || s).filter(Boolean));
        }
      }
    } catch (e) {
      console.error("Servisler yüklenemedi", e);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      setError("Lütfen adınızı ve telefon numaranızı girin.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/embed/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          formId,
          source: "website-embed",
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({
          name: "",
          email: "",
          phone: "",
          service: "",
          message: "",
        });
      } else {
        const data = await response.json();
        setError(data.error || "Bir hata oluştu. Lütfen tekrar deneyin.");
      }
    } catch (e) {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
            bgcolor: "transparent",
          }}
        >
          <Box
            sx={{
              maxWidth: 400,
              width: "100%",
              textAlign: "center",
              p: 4,
              bgcolor: "white",
              borderRadius: 2,
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            }}
          >
            <Typography variant="h5" fontWeight={600} color="success.main" gutterBottom>
              ✓ Teşekkürler!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Bilgileriniz başarıyla alındı. En kısa sürede sizinle iletişime geçeceğiz.
            </Typography>
            <Button
              variant="outlined"
              sx={{ mt: 3 }}
              onClick={() => setSuccess(false)}
            >
              Yeni Form Gönder
            </Button>
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
          bgcolor: "transparent",
        }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            maxWidth: 420,
            width: "100%",
            p: 3,
            bgcolor: "white",
            borderRadius: 2,
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          }}
        >
          <Typography variant="h6" fontWeight={600} gutterBottom textAlign="center">
            İletişim Formu
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
            Bilgilerinizi bırakın, size ulaşalım
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Adınız Soyadınız *"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            size="small"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="E-posta"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            size="small"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Telefon Numarası *"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            size="small"
            sx={{ mb: 2 }}
            placeholder="+90 5XX XXX XX XX"
          />

          {services.length > 0 && (
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>İlgilendiğiniz Hizmet</InputLabel>
              <Select
                value={formData.service}
                label="İlgilendiğiniz Hizmet"
                onChange={(e) => handleChange("service", e.target.value)}
              >
                <MenuItem value="">Seçiniz</MenuItem>
                {services.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField
            fullWidth
            label="Mesajınız"
            multiline
            rows={3}
            value={formData.message}
            onChange={(e) => handleChange("message", e.target.value)}
            size="small"
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{
              py: 1.5,
              fontWeight: 600,
              textTransform: "none",
              fontSize: "1rem",
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Gönder"}
          </Button>

          <Typography variant="caption" color="text.secondary" textAlign="center" display="block" mt={2}>
            Bilgileriniz gizli tutulacaktır.
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
