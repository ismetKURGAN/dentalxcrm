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
  name?: string;
  type?: string;
  topParent?: string;
  parent?: string;
  parentId?: string;
}

interface Category {
  id: string;
  name: string;
  topParent: string;
  parentId: string | null;
  leadFormId?: string;
  firstContact?: boolean;
  global?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// TOP_PARENTS artık campaigns API'sinden dinamik olarak çekiliyor

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const [tempCategoryId, setTempCategoryId] = useState<string>("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["Meta"]));

  // Kampanyalardan dinamik olarak topParent listesi oluştur
  const TOP_PARENTS = useMemo(() => {
    const parents = new Set<string>();
    campaigns.forEach((c) => {
      const topParent = c.topParent || c.parent;
      if (topParent) parents.add(topParent);
    });
    // Alfabetik sırala
    return Array.from(parents).sort((a, b) => a.localeCompare(b));
  }, [campaigns]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LabelConfig | null>(null);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [labelsRes, campaignsRes, categoriesRes, usersRes] = await Promise.all([
          fetch("/api/settings/labels", { cache: "no-store" }),
          fetch("/api/campaigns", { cache: "no-store" }),
          fetch("/api/categories", { cache: "no-store" }),
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
        if (categoriesRes.ok) {
          const data = await categoriesRes.json();
          setCategories(data || []);
        }
        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers((data || []).filter((u: any) => (u.roles || []).includes("Danışman") || (u.roles || []).includes("Acenta")));
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
    
    // Helper to get full path
    const getPath = (cat: Category): string => {
      if (!cat.parentId) return `${cat.topParent} / ${cat.name}`;
      const parent = categories.find(c => c.id === cat.parentId);
      if (!parent) return `${cat.topParent} / ${cat.name}`;
      return getPath(parent) + ` / ${cat.name}`;
    };
    
    categories.forEach((c) => {
      if (!c || !c.id) return;
      map.set(c.id, getPath(c));
    });
    return map;
  }, [categories]);

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
      valueGetter: (params: any) => categoryMap.get(params.value as string) || params.value,
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
                  open={selectOpen}
                  onOpen={() => {
                    setSelectOpen(true);
                    setTempCategoryId(editing.categoryId);
                  }}
                  onClose={() => {
                    setSelectOpen(false);
                    setTempCategoryId("");
                  }}
                  label="Kategori"
                  value={tempCategoryId}
                  onChange={(e) => setTempCategoryId(e.target.value as string)}
                  displayEmpty
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 450,
                        '& .MuiMenuItem-root': {
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                          whiteSpace: 'pre',
                        }
                      }
                    },
                    autoFocus: false
                  }}
                >
                  <MenuItem value="">
                    <em>Kategori Seçiniz</em>
                  </MenuItem>
                  
                  {(() => {
                    const getLevel = (cat: Category): number => {
                      if (!cat.parentId) return 0;
                      const parent = categories.find(c => c.id === cat.parentId);
                      if (!parent) return 0;
                      return 1 + getLevel(parent);
                    };
                    
                    const getPath = (cat: Category): string => {
                      if (!cat.parentId) return cat.name;
                      const parent = categories.find(c => c.id === cat.parentId);
                      if (!parent) return cat.name;
                      return getPath(parent) + ' > ' + cat.name;
                    };
                    
                    const options: Array<{ value: string; label: string; level: number; topParent: string; isDivider?: boolean; isExpanded?: boolean }> = [];
                    
                    TOP_PARENTS.forEach(topParent => {
                      const catsInGroup = categories.filter(c => c.topParent === topParent);
                      const isExpanded = expandedGroups.has(topParent);
                      
                      options.push({
                        value: `divider-${topParent}`,
                        label: topParent,
                        level: -1,
                        topParent,
                        isDivider: true,
                        isExpanded
                      });
                      
                      if (isExpanded && catsInGroup.length > 0) {
                        const sorted = [...catsInGroup].sort((a, b) => {
                          const pathA = getPath(a);
                          const pathB = getPath(b);
                          return pathA.localeCompare(pathB);
                        });
                        
                        sorted.forEach(cat => {
                          const level = getLevel(cat);
                          const indent = '  '.repeat(level);
                          options.push({
                            value: cat.id,
                            label: indent + cat.name,
                            level,
                            topParent: cat.topParent
                          });
                        });
                      }
                    });
                    
                    return options.map(opt => {
                      if (opt.isDivider) {
                        return (
                          <MenuItem 
                            key={opt.value}
                            autoFocus={false}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const newExpanded = new Set(expandedGroups);
                              if (newExpanded.has(opt.topParent)) {
                                newExpanded.delete(opt.topParent);
                              } else {
                                newExpanded.add(opt.topParent);
                              }
                              setExpandedGroups(newExpanded);
                            }}
                            sx={{ 
                              fontWeight: 700, 
                              bgcolor: '#f5f5f5',
                              color: '#1976d2',
                              fontSize: '0.8rem',
                              py: 0.5,
                              borderTop: '1px solid #e0e0e0',
                              borderBottom: '1px solid #e0e0e0',
                              cursor: 'pointer',
                              '&:hover': {
                                bgcolor: '#e3f2fd'
                              },
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}
                          >
                            {opt.isExpanded ? '▼' : '▶'} {opt.label}
                          </MenuItem>
                        );
                      }
                      return (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      );
                    });
                  })()}
                  
                  <MenuItem
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEditing({ ...editing, categoryId: tempCategoryId });
                      setSelectOpen(false);
                      setTempCategoryId("");
                    }}
                    sx={{
                      position: 'sticky',
                      bottom: 0,
                      bgcolor: '#f5f5f5',
                      borderTop: '1px solid #e0e0e0',
                      justifyContent: 'flex-end',
                      py: 0.75,
                      px: 2,
                      '&:hover': {
                        bgcolor: '#f5f5f5'
                      }
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: '#4caf50',
                        color: 'white',
                        px: 2,
                        py: 0.75,
                        borderRadius: 1,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        '&:hover': {
                          bgcolor: '#45a049'
                        }
                      }}
                    >
                      ✓ Onayla
                    </Box>
                  </MenuItem>
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
