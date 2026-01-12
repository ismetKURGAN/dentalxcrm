"use client";

import React, { useEffect, useState } from "react";
import { 
  Box, Button, Typography, Chip, Stack, 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Select, MenuItem, FormControl, InputLabel,
  IconButton, Checkbox, ListItemText
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SecurityIcon from "@mui/icons-material/Security";
import { useAuth } from "../components/AuthProvider";

// Roller ve diller için basit listeler (roller artık /api/roles'ten dinamik geliyor)
type RoleDef = { id: number; name: string };
const LANGUAGE_OPTIONS = ["Turkish", "English", "German", "Russian", "Finnish"];

// WAHA'daki Mevcut Oturumlar (Bunu normalde API'den çekeriz)
const AVAILABLE_SESSIONS = ["default", "sales_1", "sales_2", "finance", "support"];

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [roleOptions, setRoleOptions] = useState<RoleDef[]>([]);
  const [editUser, setEditUser] = useState<any>(null); // Düzenlenen / yeni kullanıcı
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [usersRes, rolesRes] = await Promise.all([
          fetch("/api/users", { cache: "no-store" }),
          fetch("/api/roles", { cache: "no-store" }),
        ]);

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData);
        }

        if (rolesRes.ok) {
          const rolesData = await rolesRes.json();
          setRoleOptions(
            (rolesData || []).map((r: any) => ({ id: r.id, name: r.name }))
          );
        }
      } catch (e) {
        console.error("Kullanıcılar veya roller yüklenemedi", e);
      }
    };
    fetchAll();
  }, []);

  // Düzenleme butonuna basınca
  const handleEditClick = (user: any) => {
    setEditUser({ ...user, roles: user.roles || [user.role].filter(Boolean), languages: user.languages || [] });
    setOpenModal(true);
  };

  const handleNewClick = () => {
    setEditUser({
      id: undefined,
      name: "",
      email: "",
      password: "",
      roles: ["Danışman"],
      languages: ["Turkish"],
      session: "default",
    });
    setOpenModal(true);
  };

  // Kaydet butonuna basınca
  const handleSave = async () => {
    if (!editUser) return;
    const isNew = !editUser.id;
    try {
      if (isNew) {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editUser),
        });
        if (res.ok) {
          const created = await res.json();
          setUsers((prev) => [...prev, created]);
        }
      } else {
        const res = await fetch("/api/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editUser),
        });
        if (res.ok) {
          const updated = await res.json();
          setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        }
      }
    } catch (e) {
      console.error("Kullanıcı kaydedilemedi", e);
    }
    setOpenModal(false);
  };

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "name", headerName: "Ad Soyad", width: 220, flex: 1 },
    { field: "email", headerName: "E-Posta", width: 240 },
    { 
      field: "roles", headerName: "Roller", width: 180,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} flexWrap="wrap">
          {(params.value || []).map((r: string) => (
            <Chip
              key={r}
              icon={r === 'Admin' ? <SecurityIcon sx={{ fontSize: 14 }} /> : undefined}
              label={r}
              size="small"
              color={r === 'Admin' ? 'primary' : r === 'Yönetici' ? 'secondary' : 'default'}
              variant="outlined"
            />
          ))}
        </Stack>
      )
    },
    {
      field: "languages",
      headerName: "Diller",
      width: 200,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} flexWrap="wrap">
          {(params.value || []).map((l: string) => (
            <Chip key={l} label={l} size="small" color="success" variant="outlined" />
          ))}
        </Stack>
      ),
    },
    { 
      field: "session", headerName: "Atanan WhatsApp", width: 180,
      renderCell: (params) => (
        <Chip label={params.value} color="success" size="small" />
      )
    },
    {
      field: "actions", headerName: "İşlemler", width: 140,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <IconButton size="small" onClick={() => handleEditClick(params.row)} sx={{ bgcolor: "#22C55E", color: "white", '&:hover': { bgcolor: "#16A34A" } }}>
            <EditIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton
            size="small"
            sx={{ bgcolor: "#EF4444", color: "white", '&:hover': { bgcolor: "#DC2626" } }}
            onClick={async () => {
              if (!confirm("Kullanıcıyı silmek istediğinize emin misiniz?")) return;
              try {
                await fetch(`/api/users?id=${params.row.id}`, { method: "DELETE" });
                setUsers((prev) => prev.filter((u) => u.id !== params.row.id));
              } catch (e) {
                console.error("Kullanıcı silme hatası", e);
              }
            }}
          >
            <DeleteIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      )
    }
  ];

  const isAdmin = user?.roles?.includes("Admin") || user?.roles?.includes("SuperAdmin");

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Yetkisiz Erişim
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Kullanıcı ekleme ve yetki yönetimi sadece Admin kullanıcılar tarafından yapılabilir.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
            <Typography variant="h5" fontWeight="bold">Kullanıcılar</Typography>
            <Typography variant="body2" color="text.secondary">Sisteme erişimi olan personelleri yönetin.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleNewClick}>Yeni Kullanıcı</Button>
      </Stack>

      <Box sx={{ height: 600, width: '100%', bgcolor: 'white', borderRadius: 2, boxShadow: 1 }}>
        <DataGrid
          rows={users.filter((u) => u.email !== "admin@bytno.com")}
          columns={columns}
          pageSizeOptions={[10]}
          disableRowSelectionOnClick
        />
      </Box>

      {/* DÜZENLEME MODALI */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>Kullanıcı Bilgileri</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
            {editUser && (
                <Stack spacing={2} mt={1}>
                    <TextField label="Ad Soyad" fullWidth value={editUser.name} onChange={(e) => setEditUser({...editUser, name: e.target.value})} />
                    <TextField label="E-Posta" type="email" fullWidth value={editUser.email} onChange={(e) => setEditUser({...editUser, email: e.target.value})} />
                    {isAdmin && (
                      <TextField 
                        label="Şifre" 
                        type="password" 
                        fullWidth 
                        value={editUser.password || ""} 
                        onChange={(e) => setEditUser({...editUser, password: e.target.value})}
                        placeholder={editUser.id ? "Değiştirmek için yeni şifre girin" : "Şifre belirleyin"}
                        helperText={editUser.id ? "Boş bırakırsanız mevcut şifre korunur" : "Kullanıcı için şifre belirleyin"}
                        required={!editUser.id}
                      />
                    )}
                    <TextField 
                      label="Telefon" 
                      fullWidth 
                      value={editUser.phone || ""} 
                      onChange={(e) => setEditUser({...editUser, phone: e.target.value})}
                      placeholder="WhatsApp bildirimleri için"
                    />
                    
                    <FormControl fullWidth>
                        <InputLabel>Roller</InputLabel>
                        <Select
                            multiple
                            value={editUser.roles || []}
                            label="Roller"
                            onChange={(e) => setEditUser({...editUser, roles: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value})}
                            renderValue={(selected) => (selected as string[]).join(', ')}
                        >
                            {roleOptions.map(r => (
                              <MenuItem key={r.id} value={r.name}>
                                <Checkbox checked={(editUser.roles || []).indexOf(r.name) > -1} />
                                <ListItemText primary={r.name} />
                              </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel>Diller</InputLabel>
                        <Select
                            multiple
                            value={editUser.languages || []}
                            label="Diller"
                            onChange={(e) => setEditUser({...editUser, languages: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value})}
                            renderValue={(selected) => (selected as string[]).join(', ')}
                        >
                            {LANGUAGE_OPTIONS.map(l => (
                              <MenuItem key={l} value={l}>
                                <Checkbox checked={(editUser.languages || []).indexOf(l) > -1} />
                                <ListItemText primary={l} />
                              </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel>Atanan WhatsApp Oturumu</InputLabel>
                        <Select
                            value={editUser.session}
                            label="Atanan WhatsApp Oturumu"
                            onChange={(e) => setEditUser({...editUser, session: e.target.value})}
                        >
                            {AVAILABLE_SESSIONS.map(s => (
                                <MenuItem key={s} value={s}>{s}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>
            )}
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setOpenModal(false)}>İptal</Button>
            <Button onClick={handleSave} variant="contained">Kaydet</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}