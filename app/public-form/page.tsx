"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Stack,
  Alert,
  FormControl,
  Select,
  MenuItem,
  FormLabel,
} from "@mui/material";

export default function PublicContactFormPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState("");
  const [note, setNote] = useState("");
  const [countryCode, setCountryCode] = useState("+90");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError("Please fill in name, email and phone.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        phone: `${countryCode} ${phone.trim()}`,
        email: email.trim(),
        service: service.trim(),
        note: note.trim(),
        status: "Yeni Form",
        category: "Web Form",
        source: "dentalxturkey.com",
      };

      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Form gönderilemedi");
      }

      setSuccess("We received your request. We will contact you as soon as possible.");
      setName("");
      setPhone("");
      setEmail("");
      setService("");
      setNote("");
    } catch (err) {
      setError("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f4f6f8", // CRM ana arka plan rengi
        py: 6,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 3,
            bgcolor: "#ffffff",
          }}
        >
          <Typography
            variant="h5"
            sx={{ mb: 1, fontWeight: 600, color: "#111827" }}
          >
            Contact Form
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: "#6b7280" }}>
            Please fill in the form and we will contact you shortly.
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2.5}>
              {success && <Alert severity="success">{success}</Alert>}
              {error && <Alert severity="error">{error}</Alert>}

              <TextField
                label="Name - Surname"
                variant="outlined"
                size="small"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Mail Address"
                variant="outlined"
                size="small"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <FormControl component="fieldset" fullWidth>
                <FormLabel
                  component="legend"
                  sx={{
                    mb: 1,
                    fontSize: "0.8rem",
                    color: "#374151",
                  }}
                >
                  Phone Number
                </FormLabel>
                <Stack direction="row" spacing={1.5}>
                  <FormControl sx={{ minWidth: 110 }} size="small">
                    <Select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value as string)}
                    >
                      <MenuItem value={"+90"}>🇹🇷 +90</MenuItem>
                      <MenuItem value={"+44"}>🇬🇧 +44</MenuItem>
                      <MenuItem value={"+1"}>🇺🇸 +1</MenuItem>
                      <MenuItem value={"+49"}>🇩🇪 +49</MenuItem>
                      <MenuItem value={"+48"}>🇵🇱 +48</MenuItem>
                      <MenuItem value={"+40"}>🇷🇴 +40</MenuItem>
                      <MenuItem value={"+7"}>🇷🇺 +7</MenuItem>
                      <MenuItem value={"+33"}>🇫🇷 +33</MenuItem>
                      <MenuItem value={"+39"}>🇮🇹 +39</MenuItem>
                      <MenuItem value={"+34"}>🇪🇸 +34</MenuItem>
                      <MenuItem value={"+31"}>🇳🇱 +31</MenuItem>
                      <MenuItem value={"+32"}>🇧🇪 +32</MenuItem>
                      <MenuItem value={"+41"}>🇨🇭 +41</MenuItem>
                      <MenuItem value={"+43"}>🇦🇹 +43</MenuItem>
                      <MenuItem value={"+46"}>🇸🇪 +46</MenuItem>
                      <MenuItem value={"+47"}>🇳🇴 +47</MenuItem>
                      <MenuItem value={"+45"}>🇩🇰 +45</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    variant="outlined"
                    size="small"
                    required
                    fullWidth
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </Stack>
              </FormControl>
              <TextField
                label="Requested Treatment"
                variant="outlined"
                size="small"
                value={service}
                onChange={(e) => setService(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Notes"
                variant="outlined"
                size="small"
                multiline
                minRows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 1,
                  bgcolor: "#003c96", // koyu mavi, örnekteki gibi
                  ":hover": { bgcolor: "#002f75" },
                  textTransform: "none",
                  fontWeight: 600,
                }}
                fullWidth
              >
                {loading ? "Sending..." : "Send"}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
