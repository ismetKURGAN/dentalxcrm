"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  Alert,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

export default function EmbedSettingsPage() {
  const [formId, setFormId] = useState("website-contact");
  const [copied, setCopied] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    // Mevcut URL'den base URL'i al
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const embedUrl = `${baseUrl}/embed/form?formId=${encodeURIComponent(formId)}`;

  const iframeCode = `<iframe 
  src="${embedUrl}"
  width="100%"
  height="500"
  frameborder="0"
  style="border: none; max-width: 450px;"
  title="İletişim Formu"
></iframe>`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 900 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Web Sitesi Form Entegrasyonu
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Harici web sitelerine eklenebilecek iletişim formu oluşturun. Form dolduran kişiler otomatik olarak CRM'e düşer.
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          1. Form ID Belirleyin
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Bu ID, gelen lead'lerin hangi kategoriye düşeceğini belirler. Otomasyon kategorilerinde bu ID ile eşleşen bir kategori varsa, lead o kategoriye atanır.
        </Typography>
        
        <TextField
          fullWidth
          label="Form ID"
          value={formId}
          onChange={(e) => setFormId(e.target.value.replace(/\s/g, "-"))}
          size="small"
          helperText="Boşluk kullanmayın. Örnek: website-contact, landing-page-1, dental-implant-form"
          sx={{ maxWidth: 400 }}
        />
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          2. Embed Kodu
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Bu kodu web sitesine ekleyin. Form otomatik olarak görünecektir.
        </Typography>

        <Box
          sx={{
            bgcolor: "#1e1e1e",
            borderRadius: 1,
            p: 2,
            position: "relative",
            fontFamily: "monospace",
            fontSize: "0.85rem",
            color: "#d4d4d4",
            overflow: "auto",
          }}
        >
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {iframeCode}
          </pre>
          <Tooltip title={copied ? "Kopyalandı!" : "Kopyala"}>
            <IconButton
              size="small"
              onClick={() => handleCopy(iframeCode)}
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                color: "white",
                bgcolor: "rgba(255,255,255,0.1)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
              }}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {copied && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Kod panoya kopyalandı!
          </Alert>
        )}
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          3. Doğrudan Link
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Formu ayrı bir sayfada açmak için bu linki kullanabilirsiniz.
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            fullWidth
            value={embedUrl}
            size="small"
            InputProps={{ readOnly: true }}
          />
          <Tooltip title="Kopyala">
            <IconButton onClick={() => handleCopy(embedUrl)}>
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Yeni sekmede aç">
            <IconButton
              component="a"
              href={embedUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <OpenInNewIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          4. Önizleme
        </Typography>
        <Divider sx={{ my: 2 }} />
        
        <Box
          sx={{
            border: "2px dashed #e0e0e0",
            borderRadius: 2,
            p: 2,
            display: "flex",
            justifyContent: "center",
            bgcolor: "#fafafa",
          }}
        >
          <iframe
            src={embedUrl}
            width="100%"
            height="520"
            style={{ border: "none", maxWidth: 450 }}
            title="Form Önizleme"
          />
        </Box>
      </Paper>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>İpucu:</strong> Gelen lead'lerin doğru danışmana atanması için:
          <ol style={{ margin: "8px 0 0 0", paddingLeft: 20 }}>
            <li>Ayarlar → Otomasyon → Kategoriler'de yeni kategori oluşturun</li>
            <li>Lead Form ID alanına yukarıdaki Form ID'yi girin (örn: {formId})</li>
            <li>Ayarlar → Etiketler'de bu kategoriyi seçip danışman atayın</li>
          </ol>
        </Typography>
      </Alert>
    </Box>
  );
}
