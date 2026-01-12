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

interface StatusItem {
  id: number;
  tr: string;
  en: string;
}

export default function StatusesSettingsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const isAdmin = user?.roles?.includes("Admin") || user?.roles?.includes("SuperAdmin");
  
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [newStatusTr, setNewStatusTr] = useState("");
  const [newStatusEn, setNewStatusEn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTr, setEditTr] = useState("");
  const [editEn, setEditEn] = useState("");

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/statuses", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setStatuses(data);
      }
    } catch (e) {
      console.error("Durumlar yüklenirken hata:", e);
      setError("Durumlar yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newStatusTr.trim()) {
      setError("Türkçe durum adı boş olamaz");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const res = await fetch("/api/statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tr: newStatusTr.trim(), en: newStatusEn.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setStatuses(data.statuses);
        setNewStatusTr("");
        setNewStatusEn("");
        setSuccess("Durum başarıyla eklendi");
      } else {
        const data = await res.json();
        setError(data.error || "Durum eklenemedi");
      }
    } catch (e) {
      console.error("Durum eklenirken hata:", e);
      setError("Durum eklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (status: StatusItem) => {
    setEditingId(status.id);
    setEditTr(status.tr);
    setEditEn(status.en);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTr("");
    setEditEn("");
  };

  const handleSaveEdit = async () => {
    if (!editTr.trim()) {
      setError("Türkçe durum adı boş olamaz");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const res = await fetch("/api/statuses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, tr: editTr.trim(), en: editEn.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setStatuses(data.statuses);
        setEditingId(null);
        setEditTr("");
        setEditEn("");
        setSuccess("Durum başarıyla güncellendi");
      } else {
        const data = await res.json();
        setError(data.error || "Durum güncellenemedi");
      }
    } catch (e) {
      console.error("Durum güncellenirken hata:", e);
      setError("Durum güncellenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (status: StatusItem) => {
    if (!confirm(`"${status.tr}" durumunu silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const res = await fetch("/api/statuses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: status.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setStatuses(data.statuses);
        setSuccess("Durum başarıyla silindi");
      } else {
        const data = await res.json();
        setError(data.error || "Durum silinemedi");
      }
    } catch (e) {
      console.error("Durum silinirken hata:", e);
      setError("Durum silinirken bir hata oluştu");
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
          Durum Yönetimi
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Müşteri durumlarını buradan ekleyebilir veya silebilirsiniz
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

        {/* Yeni Durum Ekleme */}
        <Paper variant="outlined" sx={{ p: 2, mb: 4, bgcolor: "#F9FAFB" }}>
          <Typography variant="subtitle2" fontWeight={600} mb={2}>
            Yeni Durum Ekle
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="flex-start">
            <TextField
              size="small"
              label="Türkçe"
              placeholder="Durum adı (Türkçe)..."
              value={newStatusTr}
              onChange={(e) => setNewStatusTr(e.target.value)}
              disabled={loading}
              sx={{ minWidth: 200 }}
            />
            <TextField
              size="small"
              label="İngilizce"
              placeholder="Status name (English)..."
              value={newStatusEn}
              onChange={(e) => setNewStatusEn(e.target.value)}
              disabled={loading}
              sx={{ minWidth: 200 }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              disabled={loading || !newStatusTr.trim()}
              sx={{ minWidth: 120 }}
            >
              Ekle
            </Button>
          </Stack>
        </Paper>

        {/* Durumlar Listesi */}
        {loading && statuses.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            <Typography variant="subtitle2" fontWeight={600} mb={2}>
              Mevcut Durumlar ({statuses.length})
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
                  {statuses.map((status) => (
                    <TableRow key={status.id} hover>
                      {editingId === status.id ? (
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
                          <TableCell>{status.tr}</TableCell>
                          <TableCell sx={{ color: status.en ? "inherit" : "#9CA3AF" }}>
                            {status.en || "(boş)"}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEdit(status)}
                              disabled={loading}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(status)}
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
