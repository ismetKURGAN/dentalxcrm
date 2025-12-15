"use client";

import { useState } from "react";
import { Box, Paper, Typography, Button, CircularProgress } from "@mui/material";
import { useAuth } from "../components/AuthProvider";

export default function MyWhatsappPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const session = user?.session;

  const handleLoadQr = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    setQr(null);
    try {
      const res = await fetch(`/api/evo/qr?session=${encodeURIComponent(session)}`);
      if (!res.ok) {
        setError("QR kodu alınamadı");
        return;
      }
      const data = await res.json();
      if (!data.image) {
        setError("Geçersiz QR yanıtı");
        return;
      }
      setQr(data.image as string);
    } catch (e) {
      setError("Sunucu hatası oluştu");
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "calc(100vh - 100px)" }}>
        <Paper sx={{ p: 4, maxWidth: 420 }}>
          <Typography variant="h6" gutterBottom>
            WhatsApp Oturumu Tanımlı Değil
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Bu kullanıcı için Evolution içinde tanımlı bir WhatsApp oturumu (session) bulunamadı. Lütfen sistem yöneticinize
            başvurun.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "calc(100vh - 100px)" }}>
      <Paper sx={{ p: 4, maxWidth: 480, textAlign: "center" }}>
        <Typography variant="h6" gutterBottom>
          WhatsApp Bağlantısı
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Oturum: <strong>{session}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Telefonunuzdaki WhatsApp Business uygulamasından bu QR kodu tarayarak hattınızı Evolution'a bağlayın.
        </Typography>

        {!qr && !loading && (
          <Button variant="contained" onClick={handleLoadQr}>
            QR Kodunu Göster
          </Button>
        )}

        {loading && <CircularProgress size={32} />}

        {error && (
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}

        {qr && (
          <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
            <Box
              component="img"
              src={qr}
              alt="WhatsApp QR"
              sx={{ width: 260, height: 260, borderRadius: 2, border: "1px solid #e5e7eb" }}
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
}
