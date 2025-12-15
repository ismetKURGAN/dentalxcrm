"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";

export default function DoctorsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id: 0, name: "", specialty: "", notes: "" });

  const fetchDoctors = async () => {
    try {
      const res = await fetch("/api/doctors", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setRows(data);
    } catch (e) {
      console.error("Doktorlar alınırken hata", e);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleNew = () => {
    setForm({ id: Date.now(), name: "", specialty: "", notes: "" });
    setOpen(true);
  };

  const handleSave = () => {
    const method = rows.some((d) => d.id === form.id) ? "PUT" : "POST";

    fetch("/api/doctors", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then(() => fetchDoctors())
      .finally(() => setOpen(false));
  };

  const columns: GridColDef[] = [
    { field: "name", headerName: "Doktor Adı", flex: 1, minWidth: 220 },
    { field: "specialty", headerName: "Uzmanlık / Klinik", flex: 1, minWidth: 220 },
    { field: "notes", headerName: "Notlar / Etiketler", flex: 1, minWidth: 220 },
  ];

  return (
    <Box sx={{ width: "100%", height: "100%", p: 2, bgcolor: "#F3F4F6" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Doktorlar
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Doktor listesi ve özellikleri.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleNew}>
          Yeni Doktor
        </Button>
      </Stack>

      <Paper sx={{ height: 600, width: "100%", borderRadius: 2, boxShadow: 1 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSizeOptions={[10]}
          disableRowSelectionOnClick
        />
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Doktor Bilgisi</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Doktor Adı"
              fullWidth
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <TextField
              label="Uzmanlık / Klinik"
              fullWidth
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
            />
            <TextField
              label="Notlar / Etiketler"
              fullWidth
              multiline
              minRows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>İptal</Button>
          <Button onClick={handleSave} variant="contained">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
