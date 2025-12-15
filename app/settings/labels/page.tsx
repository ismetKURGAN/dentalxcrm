"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Checkbox,
  ListItemText,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

import type { LabelConfig } from "../../api/settings/labels/route";

interface CampaignNode {
  id: string;
  title: string;
  type?: string;
  topParent?: string;
  parentId?: string;
}

interface UserItem {
  id: number;
  name: string;
  roles?: string[];
}

const LANGUAGE_OPTIONS = [
  "English",
  "German",
  "Finnish",
  "Russian",
  "French",
  "Arabic",
  "Persian",
  "Bulgarian",
  "Romanian",
  "Polish",
  "Croatian",
  "Turkish",
];

export default function LabelsSettingsPage() {
  const [labels, setLabels] = useState<LabelConfig[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignNode[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LabelConfig | null>(null);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [labelsRes, campaignsRes, usersRes] = await Promise.all([
          fetch("/api/settings/labels", { cache: "no-store" }),
          fetch("/api/campaigns", { cache: "no-store" }),
          fetch("/api/users", { cache: "no-store" }),
        ]);

        if (labelsRes.ok) {
          const data = await labelsRes.json();
          setLabels(data || []);
        }
        if (campaignsRes.ok) {
          const data = await campaignsRes.json();
          setCampaigns(data || []);
        }
        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers((data || []).filter((u: any) => (u.roles || []).includes("Danışman")));
        }
      } catch (e) {
        console.error("Etiketler veya kampanyalar yüklenemedi", e);
      }
      setLoading(false);
    };
    loadAll();
  }, []);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    campaigns.forEach((c) => {
      if (!c || !c.id) return;
      const parts: string[] = [];
      if (c.topParent) parts.push(c.topParent);
      if (c.title) parts.push(c.title);
      map.set(c.id, parts.join(" / ") || c.title || c.id);
    });
    return map;
  }, [campaigns]);

  const advisorNames = useMemo(
    () => users.map((u) => u.name).filter(Boolean),
    [users]
  );

  const handleOpenNew = () => {
    setEditing({
      id: 0,
      title: "",
      categoryId: "",
      advisors: [],
      language: "English",
      message: "",
      active: true,
    });
    setDialogOpen(true);
  };

  const handleEdit = (row: LabelConfig) => {
    setEditing(row);
    setDialogOpen(true);
  };

  const handleDelete = async (row: LabelConfig) => {
    if (!confirm("Bu etiketi silmek istediğinize emin misiniz?")) return;
    try {
      await fetch(`/api/settings/labels?id=${row.id}`, { method: "DELETE" });
      setLabels((prev) => prev.filter((l) => l.id !== row.id));
    } catch (e) {
      console.error("Etiket silinemedi", e);
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    const payload = { ...editing };
    try {
      if (!editing.id) {
        const res = await fetch("/api/settings/labels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setLabels((prev) => [...prev, created]);
        }
      } else {
        const res = await fetch("/api/settings/labels", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setLabels((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
        }
      }
    } catch (e) {
      console.error("Etiket kaydedilemedi", e);
    }
    setDialogOpen(false);
  };

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 90 },
    { field: "title", headerName: "Başlık", flex: 1, minWidth: 200 },
    {
      field: "categoryId",
      headerName: "Kategori",
      flex: 1,
      minWidth: 220,
      valueGetter: (params) => categoryMap.get(params.value as string) || params.value,
    },
    {
      field: "advisors",
      headerName: "Danışmanlar",
      width: 220,
      renderCell: (params) => {
        const list = ((params.row as any).advisors || []) as string[];
        const text = list.length ? list.join(", ") : "(round-robin)";
        return <Typography variant="body2">{text}</Typography>;
      },
    },
    {
      field: "language",
      headerName: "Dil",
      width: 140,
    },
    {
      field: "active",
      headerName: "Aktif",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? "Aktif" : "Pasif"}
          color={params.value ? "success" : "default"}
          size="small"
        />
      ),
    },
    {
      field: "actions",
      headerName: "İşlemler",
      width: 140,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <IconButton size="small" onClick={() => handleEdit(params.row)} sx={{ bgcolor: "#22c55e", color: "white", "&:hover": { bgcolor: "#16a34a" } }}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => handleDelete(params.row)} sx={{ bgcolor: "#ef4444", color: "white", "&:hover": { bgcolor: "#dc2626" } }}>
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
            Etiketler
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Kategoriye göre danışman ataması ve otomatik karşılama mesajlarını yönetin.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenNew}
        >
          Yeni Etiket
        </Button>
      </Stack>

      <Box sx={{ width: "100%", overflowX: "auto" }}>
        <Paper
          sx={{
            height: 620,
            minWidth: 800,
            borderRadius: 2,
          }}
        >
          <DataGrid
            rows={labels}
            columns={columns}
            disableRowSelectionOnClick
            loading={loading}
            pageSizeOptions={[10, 25, 50]}
          />
        </Paper>
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Etiket Bilgileri</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {editing && (
            <Stack spacing={2} mt={1}>
              <TextField
                label="Başlık"
                fullWidth
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              />

              <FormControl fullWidth size="small">
                <InputLabel>Kategori</InputLabel>
                <Select
                  label="Kategori"
                  value={editing.categoryId}
                  onChange={(e) => setEditing({ ...editing, categoryId: e.target.value as string })}
                >
                  {campaigns
                    .filter((c) => c.type === "category")
                    .map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {categoryMap.get(c.id) || c.title}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Danışmanlar (boş bırakılırsa round-robin)</InputLabel>
                <Select
                  multiple
                  label="Danışmanlar (boş bırakılırsa round-robin)"
                  value={(editing.advisors || []) as string[]}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      advisors:
                        typeof e.target.value === "string"
                          ? e.target.value.split(",").filter(Boolean)
                          : (e.target.value as string[]),
                    })
                  }
                  renderValue={(selected) => (selected as string[]).join(", ")}
                >
                  {advisorNames.map((name) => (
                    <MenuItem key={name} value={name}>
                      <Checkbox
                        checked={((editing.advisors || []) as string[]).indexOf(name) > -1}
                      />
                      <ListItemText primary={name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Dil</InputLabel>
                <Select
                  label="Dil"
                  value={editing.language}
                  onChange={(e) => setEditing({ ...editing, language: e.target.value as string })}
                >
                  {LANGUAGE_OPTIONS.map((l) => (
                    <MenuItem key={l} value={l}>
                      {l}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Karşılama Mesajı"
                multiline
                minRows={6}
                fullWidth
                value={editing.message}
                onChange={(e) => setEditing({ ...editing, message: e.target.value })}
                helperText="{name}, {user}, {category} ve {language} placeholder'larını kullanabilirsiniz."
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>İptal</Button>
          <Button onClick={handleSave} variant="contained">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
