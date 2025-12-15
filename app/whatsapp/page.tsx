"use client";

import { useState } from "react";
import { Box, Paper, Typography, Tabs, Tab, Button, CircularProgress } from "@mui/material";
import { useAuth } from "../components/AuthProvider";
import { useI18n } from "../components/I18nProvider";

export default function WhatsAppPage() {
  const { user } = useAuth();
  const { t } = useI18n();

  const allowedRoles = ["Admin", "Danışman", "Operasyon", "SuperAdmin"];
  const canAccess = user?.roles?.some((r) => allowedRoles.includes(r)) ?? false;

  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const session = user?.session;

  const handleChangeTab = (_event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const handleLoadQr = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    setQr(null);
    try {
      const res = await fetch(`/api/evo/qr?session=${encodeURIComponent(session)}`);
      if (!res.ok) {
        setError(t("whatsapp.qr.error.fetch"));
        return;
      }
      const data = await res.json();
      if (!data.image) {
        setError(t("whatsapp.qr.error.invalid"));
        return;
      }
      setQr(data.image as string);
    } catch (e) {
      setError(t("whatsapp.qr.error.server"));
    } finally {
      setLoading(false);
    }
  };

  if (!canAccess) {
    return (
      <Box sx={{ height: "calc(100vh - 100px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {t("whatsapp.accessDenied.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("whatsapp.accessDenied.body")}
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "calc(100vh - 100px)", display: "flex" }}>
      <Paper
        sx={{
          flexGrow: 1,
          height: "100%",
          borderRadius: 2,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            p: 0,
            bgcolor: "white",
            borderBottom: "1px solid #e0e0e0",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box sx={{ px: 2, pt: 2, pb: 1 }}>
            <Typography variant="h6" fontWeight="bold">
              {t("whatsapp.title")}
            </Typography>
          </Box>
          <Tabs value={tab} onChange={handleChangeTab} indicatorColor="primary" textColor="primary" sx={{ px: 2 }}>
            <Tab label={t("whatsapp.tab.chat")} />
            <Tab label={t("whatsapp.tab.qr")} />
          </Tabs>
        </Box>

        <Box sx={{ flexGrow: 1, p: 2 }}>
          {tab === 0 && (
            <Box sx={{ height: "100%" }}>
              <iframe
                src="https://chat.dentalxturkey.com/app/accounts/1/inbox-view"
                title="WhatsApp Panel"
                style={{ border: "none", width: "100%", height: "100%" }}
              />
            </Box>
          )}

          {tab === 1 && (
            <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Paper sx={{ p: 3, maxWidth: 420, width: "100%", textAlign: "center" }}>
                {!session && (
                  <>
                    <Typography variant="h6" gutterBottom>
                      {t("whatsapp.noSession.title")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t("whatsapp.noSession.body")}
                    </Typography>
                  </>
                )}

                {session && (
                  <>
                    <Typography variant="h6" gutterBottom>
                      {t("whatsapp.qr.title")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {t("whatsapp.qr.session")} <strong>{session}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      {t("whatsapp.qr.helper")}
                    </Typography>

                    {!qr && !loading && (
                      <Button variant="contained" onClick={handleLoadQr}>
                        {t("whatsapp.qr.button")}
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
                  </>
                )}
              </Paper>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}