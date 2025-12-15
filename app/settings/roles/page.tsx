"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Chip,
  IconButton,
} from "@mui/material";
import { useAuth } from "../../components/AuthProvider";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const PERMISSION_DEFS: { key: string; label: string; group: string }[] = [
  { key: "viewCustomers", label: "Müşteri Görüntüle", group: "Müşteriler" },
  { key: "editCustomers", label: "Müşteri Düzenle", group: "Müşteriler" },
  { key: "viewAppointments", label: "Randevu Görüntüle", group: "Randevular" },
  { key: "editAppointments", label: "Randevu Düzenle", group: "Randevular" },
  { key: "viewStats", label: "İletişim İstatistikleri", group: "Raporlar" },
  { key: "viewReports", label: "Danışman Raporları", group: "Raporlar" },
  { key: "manageSegments", label: "Segment Yönetimi", group: "Kampanyalar" },
  { key: "sendCampaigns", label: "Toplu Kampanya Gönder", group: "Kampanyalar" },
  { key: "manageDoctors", label: "Doktor Yönetimi", group: "Tanımlar" },
  { key: "manageUsers", label: "Kullanıcı Yönetimi", group: "Tanımlar" },
  { key: "manageSettings", label: "Genel Ayarlar", group: "Tanımlar" },
  { key: "viewChats", label: "Sohbetler Sekmesi", group: "Menü / Sekmeler" },
];

export default function RolesSettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("Admin") || user?.roles?.includes("SuperAdmin");
  const [roles, setRoles] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editRole, setEditRole] = useState<any | null>(null);

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/roles", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setRoles(data);
    } catch (e) {
      console.error("Roller yüklenemedi", e);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const openNewModal = () => {
    const basePerms: any = {};
    PERMISSION_DEFS.forEach((p) => {
      basePerms[p.key] = false;
    });
    setEditRole({
      id: undefined,
      name: "",
      description: "",
      permissions: basePerms,
    });
    setOpenModal(true);
  };

  const openEditModal = (role: any) => {
    const basePerms: any = {};
    PERMISSION_DEFS.forEach((p) => {
      basePerms[p.key] = false;
    });
    setEditRole({
      ...role,
      permissions: { ...basePerms, ...(role.permissions || {}) },
    });
    setOpenModal(true);
  };

  const handleTogglePermission = (roleId: number, key: string, value: boolean) => {
    setRoles((prev) =>
      prev.map((r) =>
        r.id === roleId
          ? { ...r, permissions: { ...r.permissions, [key]: value } }
          : r
      )
    );
  };

  const handleSaveInline = async (role: any) => {
    try {
      const res = await fetch("/api/roles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(role),
      });
      if (!res.ok) return;
      const updated = await res.json();
      setRoles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (e) {
      console.error("Rol kaydedilemedi", e);
    }
  };

  const handleModalSave = async () => {
    if (!editRole) return;
    const isNew = !editRole.id;
    try {
      if (isNew) {
        const res = await fetch("/api/roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editRole),
        });
        if (res.ok) {
          const created = await res.json();
          setRoles((prev) => [...prev, created]);
        }
      } else {
        const res = await fetch("/api/roles", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editRole),
        });
        if (res.ok) {
          const updated = await res.json();
          setRoles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        }
      }
    } catch (e) {
      console.error("Rol kaydedilemedi", e);
    }
    setOpenModal(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Rolü silmek istediğinize emin misiniz?")) return;
    try {
      await fetch(`/api/roles?id=${id}`, { method: "DELETE" });
      setRoles((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      console.error("Rol silme hatası", e);
    }
  };

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "name", headerName: "Rol Adı", width: 180 },
    {
      field: "description",
      headerName: "Açıklama",
      flex: 1,
      minWidth: 200,
    },
    {
      field: "summary",
      headerName: "Özet Yetkiler",
      flex: 1,
      minWidth: 260,
      sortable: false,
      renderCell: (params) => {
        const perms = params.row.permissions || {};
        const active = PERMISSION_DEFS.filter((p) => perms[p.key]).slice(0, 4);
        const more = PERMISSION_DEFS.filter((p) => perms[p.key]).length - active.length;
        return (
          <Stack direction="row" spacing={0.5} flexWrap="wrap">
            {active.map((p) => (
              <Chip key={p.key} label={p.label} size="small" variant="outlined" />
            ))}
            {more > 0 && (
              <Chip label={`+${more}`} size="small" color="primary" />
            )}
          </Stack>
        );
      },
    },
    {
      field: "actions",
      headerName: "İşlemler",
      width: 140,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <IconButton size="small" onClick={() => openEditModal(params.row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Roller ve Yetkiler
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Kullanıcı rollerini ve modül bazlı yetkileri yönetin.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openNewModal}>
          Yeni Rol
        </Button>
      </Stack>

      <Box sx={{ height: 520, bgcolor: "white", borderRadius: 2, boxShadow: 1 }}>
        <DataGrid
          rows={roles}
          columns={columns}
          disableRowSelectionOnClick
          pageSizeOptions={[10]}
        />
      </Box>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="md">
        <DialogTitle>Rol Tanımı</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {editRole && (
            <Stack spacing={3} mt={1}>
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  label="Rol Adı"
                  value={editRole.name}
                  onChange={(e) => setEditRole({ ...editRole, name: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Açıklama"
                  value={editRole.description}
                  onChange={(e) => setEditRole({ ...editRole, description: e.target.value })}
                />
              </Stack>

              <Box>
                <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                  Yetkiler
                </Typography>

                <Stack direction="row" flexWrap="wrap" gap={3}>
                  {Array.from(new Set(PERMISSION_DEFS.map((p) => p.group))).map((group) => (
                    <Box key={group} sx={{ minWidth: 220 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {group}
                      </Typography>
                      <FormGroup>
                        {PERMISSION_DEFS.filter((p) => p.group === group).map((p) => (
                          <FormControlLabel
                            key={p.key}
                            control={
                              <Checkbox
                                checked={!!editRole.permissions?.[p.key]}
                                onChange={(e) =>
                                  setEditRole({
                                    ...editRole,
                                    permissions: {
                                      ...editRole.permissions,
                                      [p.key]: e.target.checked,
                                    },
                                  })
                                }
                              />
                            }
                            label={p.label}
                          />
                        ))}
                      </FormGroup>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>İptal</Button>
          <Button variant="contained" onClick={handleModalSave}>
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
