"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  IconButton,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import { useAuth } from "../../components/AuthProvider";
import { useI18n } from "../../components/I18nProvider";

interface ServiceItem {
  id: number;
  tr: string;
  en: string;
}

export default function ServicesSettingsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const isAdmin = user?.roles?.includes("Admin") || user?.roles?.includes("SuperAdmin");
  
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [newServiceTr, setNewServiceTr] = useState("");
  const [newServiceEn, setNewServiceEn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTr, setEditTr] = useState("");
  const [editEn, setEditEn] = useState("");

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/services", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (e) {
      console.error("Servisler yüklenirken hata:", e);
      setError("Servisler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newServiceTr.trim()) {
      setError("Türkçe servis adı boş olamaz");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tr: newServiceTr.trim(), en: newServiceEn.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setServices(data.services);
        setNewServiceTr("");
        setNewServiceEn("");
        setSuccess("Servis başarıyla eklendi");
      } else {
        const data = await res.json();
        setError(data.error || "Servis eklenemedi");
      }
    } catch (e) {
      console.error("Servis eklenirken hata:", e);
      setError("Servis eklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (service: ServiceItem) => {
    setEditingId(service.id);
    setEditTr(service.tr);
    setEditEn(service.en);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTr("");
    setEditEn("");
  };

  const handleSaveEdit = async () => {
    if (!editTr.trim()) {
      setError("Türkçe servis adı boş olamaz");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const res = await fetch("/api/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, tr: editTr.trim(), en: editEn.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setServices(data.services);
        setEditingId(null);
        setEditTr("");
        setEditEn("");
        setSuccess("Servis başarıyla güncellendi");
      } else {
        const data = await res.json();
        setError(data.error || "Servis güncellenemedi");
      }
    } catch (e) {
      console.error("Servis güncellenirken hata:", e);
      setError("Servis güncellenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (service: ServiceItem) => {
    if (!confirm(`"${service.tr}" servisini silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const res = await fetch("/api/services", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: service.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setServices(data.services);
        setSuccess("Servis başarıyla silindi");
      } else {
        const data = await res.json();
        setError(data.error || "Servis silinemedi");
      }
    } catch (e) {
      console.error("Servis silinirken hata:", e);
      setError("Servis silinirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Bu sayfaya erişim yetkiniz yok.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: "#F3F4F6", minHeight: "100vh" }}>
      <Paper sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
        <Typography variant="h5" fontWeight="bold" mb={1}>
          Servis Yönetimi
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Hizmet/servis seçeneklerini buradan ekleyebilir, düzenleyebilir veya silebilirsiniz
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
            {success}
          </Alert>
        )}

        {/* Yeni Servis Ekleme */}
        <Paper variant="outlined" sx={{ p: 2, mb: 4, bgcolor: "#F9FAFB" }}>
          <Typography variant="subtitle2" fontWeight={600} mb={2}>
            Yeni Servis Ekle
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="flex-start">
            <TextField
              size="small"
              label="Türkçe"
              placeholder="Servis adı (Türkçe)..."
              value={newServiceTr}
              onChange={(e) => setNewServiceTr(e.target.value)}
              disabled={loading}
              sx={{ minWidth: 200 }}
            />
            <TextField
              size="small"
              label="İngilizce"
              placeholder="Service name (English)..."
              value={newServiceEn}
              onChange={(e) => setNewServiceEn(e.target.value)}
              disabled={loading}
              sx={{ minWidth: 200 }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              disabled={loading || !newServiceTr.trim()}
              sx={{ minWidth: 120 }}
            >
              Ekle
            </Button>
          </Stack>
        </Paper>

        {/* Servisler Listesi */}
        {loading && services.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            <Typography variant="subtitle2" fontWeight={600} mb={2}>
              Mevcut Servisler ({services.length})
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#F3F4F6" }}>
                    <TableCell sx={{ fontWeight: 600 }}>Türkçe</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>İngilizce</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, width: 120 }}>İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id} hover>
                      {editingId === service.id ? (
                        <>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              value={editTr}
                              onChange={(e) => setEditTr(e.target.value)}
                              disabled={loading}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              value={editEn}
                              onChange={(e) => setEditEn(e.target.value)}
                              disabled={loading}
                              placeholder="(boş)"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={handleSaveEdit}
                              disabled={loading}
                            >
                              <SaveIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={handleCancelEdit}
                              disabled={loading}
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>{service.tr}</TableCell>
                          <TableCell sx={{ color: service.en ? "inherit" : "#9CA3AF" }}>
                            {service.en || "(boş)"}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEdit(service)}
                              disabled={loading}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(service)}
                              disabled={loading}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
