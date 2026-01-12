"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function HotelsPage() {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    stars: "",
    notes: "",
  });

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/hotels", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setHotels(data);
      }
    } catch (e) {
      console.error("Oteller yüklenemedi", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (hotel?: any) => {
    if (hotel) {
      setEditingHotel(hotel);
      setFormData({
        name: hotel.name || "",
        address: hotel.address || "",
        phone: hotel.phone || "",
        email: hotel.email || "",
        stars: hotel.stars || "",
        notes: hotel.notes || "",
      });
    } else {
      setEditingHotel(null);
      setFormData({
        name: "",
        address: "",
        phone: "",
        email: "",
        stars: "",
        notes: "",
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingHotel(null);
    setFormData({
      name: "",
      address: "",
      phone: "",
      email: "",
      stars: "",
      notes: "",
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("Otel adı zorunludur");
      return;
    }

    try {
      const method = editingHotel ? "PUT" : "POST";
      const payload = editingHotel
        ? { ...formData, id: editingHotel.id }
        : formData;

      const res = await fetch("/api/hotels", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchHotels();
        handleCloseModal();
      } else {
        alert("Kaydetme hatası");
      }
    } catch (e) {
      console.error("Kaydetme hatası", e);
      alert("Kaydetme hatası");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu oteli silmek istediğinize emin misiniz?")) return;

    try {
      const res = await fetch(`/api/hotels?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchHotels();
      } else {
        alert("Silme hatası");
      }
    } catch (e) {
      console.error("Silme hatası", e);
      alert("Silme hatası");
    }
  };

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 90 },
    { field: "name", headerName: "Otel Adı", flex: 1, minWidth: 200 },
    { field: "address", headerName: "Adres", flex: 1, minWidth: 200 },
    { field: "phone", headerName: "Telefon", width: 150 },
    { field: "email", headerName: "E-posta", width: 200 },
    { field: "stars", headerName: "Yıldız", width: 100 },
    {
      field: "actions",
      headerName: "İşlemler",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleOpenModal(params.row)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDelete(params.row.id)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ width: "100%", height: "100vh", p: 3 }}>
      <Paper sx={{ p: 3, height: "100%" }}>
        <Stack spacing={3} sx={{ height: "100%" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" fontWeight={600}>
              Oteller Yönetimi
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenModal()}
            >
              Yeni Otel Ekle
            </Button>
          </Stack>

          <Box sx={{ flexGrow: 1 }}>
            <DataGrid
              rows={hotels}
              columns={columns}
              loading={loading}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: { paginationModel: { pageSize: 25 } },
              }}
              disableRowSelectionOnClick
            />
          </Box>
        </Stack>
      </Paper>

      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingHotel ? "Otel Düzenle" : "Yeni Otel Ekle"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Otel Adı *"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="Adres"
              fullWidth
              multiline
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            <TextField
              label="Telefon"
              fullWidth
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <TextField
              label="E-posta"
              fullWidth
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <TextField
              label="Yıldız"
              fullWidth
              value={formData.stars}
              onChange={(e) => setFormData({ ...formData, stars: e.target.value })}
              placeholder="Örn: 5 Yıldız"
            />
            <TextField
              label="Notlar"
              fullWidth
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>İptal</Button>
          <Button variant="contained" onClick={handleSave}>
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
