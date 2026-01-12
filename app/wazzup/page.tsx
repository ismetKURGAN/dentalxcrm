"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import { useAuth } from "../components/AuthProvider";
import SendIcon from "@mui/icons-material/Send";
import RefreshIcon from "@mui/icons-material/Refresh";

const WAZZUP_API_KEY = "cd33745b85b1449daf90957be902a5f5";
const WAZZUP_API_BASE = "https://api.wazzup24.com/v3";

interface Channel {
  id: string;
  name: string;
  transport: string;
  state: string;
}

export default function WazzupPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("");

  const allowedRoles = ["Admin", "SuperAdmin", "Operasyon"];
  const canAccess = user?.roles?.some((r) => allowedRoles.includes(r)) ?? false;

  const fetchChannels = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/wazzup/channels");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API Hatası: ${response.status}`);
      }

      const data = await response.json();
      console.log("Channels API Response:", data);
      
      if (Array.isArray(data)) {
        setChannels(data);
      } else if (data.channels && Array.isArray(data.channels)) {
        setChannels(data.channels);
      } else if (data.data && Array.isArray(data.data)) {
        setChannels(data.data);
      } else {
        console.error("Unexpected API response format:", data);
        setChannels([]);
      }
    } catch (e: any) {
      setError(e.message || "Kanallar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const sendTestMessage = async () => {
    if (!testPhone || !testMessage) {
      setError("Telefon numarası ve mesaj gerekli");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const channelId = channels[0]?.id;
      if (!channelId) {
        throw new Error("Aktif kanal bulunamadı");
      }

      const response = await fetch(`${WAZZUP_API_BASE}/message`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${WAZZUP_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channelId: channelId,
          chatId: testPhone,
          chatType: "whatsapp",
          text: testMessage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API Hatası: ${response.status}`);
      }

      setSuccess("Mesaj başarıyla gönderildi!");
      setTestMessage("");
    } catch (e: any) {
      setError(e.message || "Mesaj gönderilirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess) {
      fetchChannels();
    }
  }, [canAccess]);

  if (!canAccess) {
    return (
      <Box
        sx={{
          height: "calc(100vh - 100px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Erişim Reddedildi
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Bu sayfaya erişim yetkiniz bulunmamaktadır.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "calc(100vh - 100px)", p: 3 }}>
      <Paper sx={{ p: 3, height: "100%", overflow: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Wazzup24 WhatsApp Entegrasyonu
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Wazzup24 API test ve yönetim paneli (3 günlük deneme hesabı)
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchChannels}
            disabled={loading}
          >
            Yenile
          </Button>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Bağlı Kanallar
                </Typography>
                {loading && channels.length === 0 ? (
                  <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                    <CircularProgress size={32} />
                  </Box>
                ) : channels.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Henüz bağlı kanal bulunamadı.
                  </Typography>
                ) : (
                  <Box sx={{ mt: 2 }}>
                    {channels.map((channel) => (
                      <Paper key={channel.id} sx={{ p: 2, mb: 2, bgcolor: "#f5f5f5" }}>
                        <Typography variant="body2" fontWeight="bold">
                          {channel.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {channel.id}
                        </Typography>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          Tür: {channel.transport} | Durum: {channel.state}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Test Mesajı Gönder
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  WhatsApp üzerinden test mesajı gönderin
                </Typography>

                <TextField
                  fullWidth
                  label="Telefon Numarası"
                  placeholder="905xxxxxxxxx"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  sx={{ mb: 2 }}
                  helperText="Ülke kodu ile birlikte (örn: 905xxxxxxxxx)"
                />

                <TextField
                  fullWidth
                  label="Mesaj"
                  multiline
                  rows={4}
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  sx={{ mb: 2 }}
                  placeholder="Test mesajınızı buraya yazın..."
                />

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                  onClick={sendTestMessage}
                  disabled={loading || !testPhone || !testMessage || channels.length === 0}
                >
                  {loading ? "Gönderiliyor..." : "Mesaj Gönder"}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  API Bilgileri
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>API Base URL:</strong> https://api.wazzup24.com/v3
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>API Key:</strong> cd33745b...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Hesap Durumu:</strong> 3 günlük deneme hesabı aktif
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
