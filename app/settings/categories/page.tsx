"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  InputAdornment,
  Chip,
  TablePagination,
  Collapse,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import ViewListIcon from "@mui/icons-material/ViewList";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FolderIcon from "@mui/icons-material/Folder";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import CategoryIcon from "@mui/icons-material/Category";
import { useAuth } from "../../components/AuthProvider";
import { useI18n } from "../../components/I18nProvider";

// Sabit üst kategoriler (Level 1)
const TOP_PARENTS = [
  "Website",
  "Landing Page",
  "Şirket Hattı",
  "Meta",
  "TikTok",
  "Referans",
  "Acente",
  "Kurum İçi",
  "WhatClinic",
  "Ek Satış",
  "Influencer",
  "Konsültasyon",
  "Snapchat",
];

interface Category {
  id: string;
  name: string;
  topParent: string;
  parentId: string | null;
  leadFormId: string;
  firstContact: boolean;
  global: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TreeNode {
  category: Category;
  children: TreeNode[];
  level: number;
}

// Hiyerarşik Kategori Seçici Bileşeni
function TreeSelect({
  categories,
  topParent,
  value,
  onChange,
  excludeId,
}: {
  categories: Category[];
  topParent: string;
  value: string | null;
  onChange: (id: string | null) => void;
  excludeId?: string;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Sadece seçilen topParent altındaki kategorileri filtrele
  const filteredByTopParent = useMemo(() => {
    return categories.filter(c => c.topParent === topParent && c.id !== excludeId);
  }, [categories, topParent, excludeId]);

  // Ağaç yapısını oluştur
  const buildTree = (parentId: string | null, level: number): TreeNode[] => {
    return filteredByTopParent
      .filter(c => c.parentId === parentId)
      .map(c => ({
        category: c,
        children: buildTree(c.id, level + 1),
        level,
      }))
      .sort((a, b) => a.category.name.localeCompare(b.category.name));
  };

  const tree = useMemo(() => buildTree(null, 0), [filteredByTopParent]);

  // Arama sonuçlarını filtrele ve eşleşen parent'ları da göster
  const filterTree = (nodes: TreeNode[], query: string): TreeNode[] => {
    if (!query.trim()) return nodes;
    const lowerQuery = query.toLowerCase();
    
    const filterNode = (node: TreeNode): TreeNode | null => {
      const matchesName = node.category.name.toLowerCase().includes(lowerQuery);
      const filteredChildren = node.children.map(filterNode).filter((n): n is TreeNode => n !== null);
      
      if (matchesName || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }
      return null;
    };
    
    return nodes.map(filterNode).filter((n): n is TreeNode => n !== null);
  };

  const filteredTree = useMemo(() => filterTree(tree, searchQuery), [tree, searchQuery]);

  // Arama yapıldığında tüm parent'ları aç
  useEffect(() => {
    if (searchQuery.trim()) {
      const allIds = new Set<string>();
      const collectIds = (nodes: TreeNode[]) => {
        nodes.forEach(n => {
          allIds.add(n.category.id);
          collectIds(n.children);
        });
      };
      collectIds(filteredTree);
      setExpanded(allIds);
    }
  }, [searchQuery, filteredTree]);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelect = (id: string | null) => {
    onChange(id);
  };

  const getSelectedName = () => {
    if (!value) return "Üst kategori seçin (opsiyonel)";
    const cat = categories.find(c => c.id === value);
    return cat?.name || "Seçili kategori";
  };

  // Seçili kategoriyi bul ve path'ini göster
  const getSelectedPath = () => {
    if (!value) return null;
    const path: string[] = [];
    let current = categories.find(c => c.id === value);
    while (current) {
      path.unshift(current.name);
      current = current.parentId ? categories.find(c => c.id === current!.parentId) : undefined;
    }
    return path.join(" > ");
  };

  const renderNode = (node: TreeNode): React.ReactNode => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expanded.has(node.category.id);
    const isSelected = value === node.category.id;

    return (
      <Box key={node.category.id}>
        <ListItemButton
          onClick={() => handleSelect(node.category.id)}
          selected={isSelected}
          sx={{
            pl: 1 + node.level * 2,
            py: 0.5,
            borderRadius: 1,
            mb: 0.25,
            bgcolor: isSelected ? "primary.light" : "transparent",
            "&:hover": { bgcolor: isSelected ? "primary.light" : "action.hover" },
            minHeight: 36,
          }}
        >
          <Box 
            onClick={(e) => hasChildren && toggleExpand(node.category.id, e)}
            sx={{ display: "flex", alignItems: "center", mr: 0.5, cursor: hasChildren ? "pointer" : "default" }}
          >
            {hasChildren ? (
              isExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />
            ) : (
              <Box sx={{ width: 24 }} />
            )}
          </Box>
          <ListItemIcon sx={{ minWidth: 28 }}>
            {hasChildren ? (
              isExpanded ? <FolderOpenIcon fontSize="small" color="primary" /> : <FolderIcon fontSize="small" color="primary" />
            ) : (
              <CategoryIcon fontSize="small" color="action" />
            )}
          </ListItemIcon>
          <ListItemText 
            primary={node.category.name} 
            primaryTypographyProps={{ 
              variant: "body2",
              fontWeight: isSelected ? 600 : 400,
              fontSize: "0.85rem",
            }}
          />
        </ListItemButton>
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto">
            {node.children.map(child => renderNode(child))}
          </Collapse>
        )}
      </Box>
    );
  };

  if (!topParent) {
    return (
      <Paper variant="outlined" sx={{ p: 2, bgcolor: "#F9FAFB" }}>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Önce üst kategori grubu seçin
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {value && (
        <Box sx={{ mb: 1, p: 1, bgcolor: "#E3F2FD", borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="body2" color="primary.dark" sx={{ fontWeight: 500 }}>
            {getSelectedPath()}
          </Typography>
          <IconButton size="small" onClick={() => onChange(null)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
      
      <Paper variant="outlined" sx={{ maxHeight: 350, overflow: "auto" }}>
        <Box sx={{ p: 1, borderBottom: "1px solid #E0E0E0", position: "sticky", top: 0, bgcolor: "white", zIndex: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Kategori ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        <Box sx={{ p: 1 }}>
          {/* Üst kategori yok seçeneği */}
          <ListItemButton
            onClick={() => handleSelect(null)}
            selected={value === null}
            sx={{
              py: 0.5,
              borderRadius: 1,
              mb: 0.5,
              bgcolor: value === null ? "success.light" : "transparent",
              minHeight: 36,
            }}
          >
            <Box sx={{ width: 24, mr: 0.5 }} />
            <ListItemIcon sx={{ minWidth: 28 }}>
              <CategoryIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText 
              primary={`Direkt "${topParent}" altında (Seviye 2)`}
              primaryTypographyProps={{ 
                variant: "body2",
                fontWeight: value === null ? 600 : 400,
                fontSize: "0.85rem",
              }}
            />
          </ListItemButton>

          {filteredTree.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ px: 1, py: 0.5, display: "block" }}>
              veya mevcut bir kategorinin altına ekle:
            </Typography>
          )}

          <List dense disablePadding>
            {filteredTree.map(node => renderNode(node))}
          </List>
          
          {filteredTree.length === 0 && searchQuery && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
              Kategori bulunamadı
            </Typography>
          )}
          
          {filteredTree.length === 0 && !searchQuery && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
              Bu grupta henüz kategori yok
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

export default function CategoriesSettingsPage() {
  const { user } = useAuth();
  const { t, language } = useI18n();
  const isAdmin = user?.roles?.includes("Admin") || user?.roles?.includes("SuperAdmin");
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "tree">("tree");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedTopParent, setSelectedTopParent] = useState<string>("Meta");
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Form state
  const [form, setForm] = useState({
    name: "",
    topParent: "Meta",
    parentId: null as string | null,
    leadFormId: "",
    firstContact: false,
    global: false,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/categories", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (e) {
      console.error("Kategoriler yüklenirken hata:", e);
      setError("Kategoriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  // Seçili topParent'a göre filtrele
  const filteredByTopParent = useMemo(() => {
    return categories.filter(c => c.topParent === selectedTopParent);
  }, [categories, selectedTopParent]);

  // Hiyerarşik görünüm için ağaç yapısı
  const buildTreeData = (parentId: string | null, level: number): { category: Category; level: number; children: any[] }[] => {
    return filteredByTopParent
      .filter(c => c.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(c => ({
        category: c,
        level,
        children: buildTreeData(c.id, level + 1),
      }));
  };

  const treeData = useMemo(() => buildTreeData(null, 0), [filteredByTopParent]);

  // Düz liste halinde ağaç (render için)
  const flattenTree = (tree: any[], expandedSet: Set<string>): { category: Category; level: number; hasChildren: boolean }[] => {
    const result: { category: Category; level: number; hasChildren: boolean }[] = [];
    const walk = (nodes: any[]) => {
      nodes.forEach(node => {
        const hasChildren = node.children?.length > 0;
        result.push({ category: node.category, level: node.level, hasChildren });
        if (hasChildren && expandedSet.has(node.category.id)) {
          walk(node.children);
        }
      });
    };
    walk(tree);
    return result;
  };

  // Arama filtresi
  const searchFilteredTree = useMemo(() => {
    if (!searchQuery.trim()) return treeData;
    const query = searchQuery.toLowerCase();
    
    const filterNode = (node: any): any | null => {
      const matchesName = node.category.name.toLowerCase().includes(query);
      const filteredChildren = node.children.map(filterNode).filter((n: any) => n !== null);
      
      if (matchesName || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }
      return null;
    };
    
    return treeData.map(filterNode).filter((n: any) => n !== null);
  }, [treeData, searchQuery]);

  const toggleRowExpand = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Tümünü aç/kapa
  const expandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (nodes: any[]) => {
      nodes.forEach(n => {
        if (n.children?.length > 0) {
          allIds.add(n.category.id);
          collectIds(n.children);
        }
      });
    };
    collectIds(treeData);
    setExpandedRows(allIds);
  };

  const collapseAll = () => {
    setExpandedRows(new Set());
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditing(category);
      setForm({
        name: category.name,
        topParent: category.topParent,
        parentId: category.parentId,
        leadFormId: category.leadFormId || "",
        firstContact: category.firstContact || false,
        global: category.global || false,
      });
    } else {
      setEditing(null);
      setForm({
        name: "",
        topParent: selectedTopParent,
        parentId: null,
        leadFormId: "",
        firstContact: false,
        global: false,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Kategori adı boş olamaz");
      return;
    }
    if (!form.topParent) {
      setError("Üst kategori grubu seçilmeli");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const method = editing ? "PUT" : "POST";
      const body = {
        ...(editing && { id: editing.id }),
        name: form.name.trim(),
        topParent: form.topParent,
        parentId: form.parentId,
        leadFormId: form.leadFormId.trim(),
        firstContact: form.firstContact,
        global: form.global,
      };

      const res = await fetch("/api/categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchCategories();
        handleCloseDialog();
        setSuccess(editing ? "Kategori güncellendi" : "Kategori eklendi");
      } else {
        const data = await res.json();
        setError(data.error || "İşlem başarısız");
      }
    } catch (e) {
      console.error("Kategori kaydedilirken hata:", e);
      setError("Kategori kaydedilemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (category: Category) => {
    const hasChildren = categories.some(c => c.parentId === category.id);
    if (hasChildren) {
      setError("Bu kategorinin alt kategorileri var. Önce alt kategorileri silin.");
      return;
    }

    if (!confirm(`"${category.name}" kategorisini silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const res = await fetch(`/api/categories?id=${category.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchCategories();
        setSuccess("Kategori silindi");
      } else {
        const data = await res.json();
        setError(data.error || "Kategori silinemedi");
      }
    } catch (e) {
      console.error("Kategori silinirken hata:", e);
      setError("Kategori silinemedi");
    } finally {
      setLoading(false);
    }
  };

  const getParentPath = (parentId: string | null): string => {
    if (!parentId) return "-";
    const path: string[] = [];
    let current = categories.find(c => c.id === parentId);
    while (current) {
      path.unshift(current.name);
      current = current.parentId ? categories.find(c => c.id === current!.parentId) : undefined;
    }
    return path.join(" > ");
  };

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Bu sayfaya erişim yetkiniz yok.</Alert>
      </Box>
    );
  }

  const displayCategories = flattenTree(searchFilteredTree, expandedRows);

  const paginatedCategories = displayCategories.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // TopParent başına kategori sayısı
  const countByTopParent = useMemo(() => {
    const counts: Record<string, number> = {};
    TOP_PARENTS.forEach(tp => {
      counts[tp] = categories.filter(c => c.topParent === tp).length;
    });
    return counts;
  }, [categories]);

  return (
    <Box sx={{ p: 3, bgcolor: "#F3F4F6", minHeight: "100vh" }}>
      <Paper sx={{ p: 3, maxWidth: 1400, mx: "auto" }}>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight="bold" mb={0.5}>
              Kategori Yönetimi
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Kategorileri buradan yönetebilirsiniz. Toplam: {categories.length} kategori
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ bgcolor: "#3b82f6", "&:hover": { bgcolor: "#2563eb" } }}
          >
            Kategori Ekle
          </Button>
        </Box>

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

        {/* Top Parent Tabs */}
        <Box sx={{ mb: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
          {TOP_PARENTS.map(tp => (
            <Chip
              key={tp}
              label={`${tp} (${countByTopParent[tp] || 0})`}
              onClick={() => { setSelectedTopParent(tp); setPage(0); }}
              color={selectedTopParent === tp ? "primary" : "default"}
              variant={selectedTopParent === tp ? "filled" : "outlined"}
              sx={{ fontWeight: selectedTopParent === tp ? 600 : 400 }}
            />
          ))}
        </Box>

        {/* Toolbar */}
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <TextField
            size="small"
            placeholder="Kategori ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
          />
          <Button size="small" onClick={expandAll}>Tümünü Aç</Button>
          <Button size="small" onClick={collapseAll}>Tümünü Kapat</Button>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {displayCategories.length} kategori gösteriliyor
          </Typography>
        </Stack>

        {/* Table */}
        {loading && categories.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#F9FAFB" }}>
                    <TableCell sx={{ fontWeight: 600, width: 400 }}>Kategori Adı</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Lead Form ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Tarih</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, width: 100 }}>İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedCategories.map(({ category, level, hasChildren }) => (
                    <TableRow key={category.id} hover>
                      <TableCell>
                        <Box sx={{ pl: level * 3, display: "flex", alignItems: "center", gap: 0.5 }}>
                          {hasChildren ? (
                            <IconButton size="small" onClick={() => toggleRowExpand(category.id)} sx={{ p: 0.25 }}>
                              {expandedRows.has(category.id) ? (
                                <ExpandMoreIcon fontSize="small" />
                              ) : (
                                <ChevronRightIcon fontSize="small" />
                              )}
                            </IconButton>
                          ) : (
                            <Box sx={{ width: 24 }} />
                          )}
                          {hasChildren ? (
                            expandedRows.has(category.id) ? <FolderOpenIcon fontSize="small" color="primary" /> : <FolderIcon fontSize="small" color="primary" />
                          ) : (
                            <CategoryIcon fontSize="small" color="action" />
                          )}
                          <Typography variant="body2" fontWeight={hasChildren ? 600 : 400} sx={{ ml: 0.5 }}>
                            {category.name}
                          </Typography>
                          {category.firstContact && (
                            <Chip label="İlk İletişim" size="small" color="primary" variant="outlined" sx={{ ml: 1, height: 20 }} />
                          )}
                          {category.global && (
                            <Chip label="Global" size="small" color="success" variant="outlined" sx={{ ml: 0.5, height: 20 }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                          {category.leadFormId || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
                          {new Date(category.createdAt).toLocaleString("tr-TR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0} justifyContent="flex-end">
                          <IconButton size="small" onClick={() => handleOpenDialog(category)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(category)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {displayCategories.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          {searchQuery ? "Kategori bulunamadı" : `"${selectedTopParent}" altında henüz kategori yok`}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              component="div"
              count={displayCategories.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50, 100]}
              labelRowsPerPage="Sayfa başına:"
            />
          </>
        )}
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {editing ? "Kategori Düzenle" : "Yeni Kategori Ekle"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {editing ? "Kategori bilgilerini güncelleyin." : "Yeni kategori oluşturun."}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleCloseDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {/* Kategori Adı */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
                Kategori Adı
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Kategori Adı"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Box>

            {/* Üst Kategori Grubu (Level 1) */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
                Üst Kategori Grubu
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={form.topParent}
                  onChange={(e) => setForm({ ...form, topParent: e.target.value, parentId: null })}
                >
                  {TOP_PARENTS.map(tp => (
                    <MenuItem key={tp} value={tp}>{tp}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary">
                Meta, TikTok, Acente gibi ana grup
              </Typography>
            </Box>

            {/* Üst Kategori (Level 2+) */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
                Üst Kategori (Opsiyonel)
              </Typography>
              <TreeSelect
                categories={categories}
                topParent={form.topParent}
                value={form.parentId}
                onChange={(id) => setForm({ ...form, parentId: id })}
                excludeId={editing?.id}
              />
            </Box>

            {/* İlk İletişim */}
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "#F9FAFB" }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.firstContact}
                    onChange={(e) => setForm({ ...form, firstContact: e.target.checked })}
                    size="small"
                  />
                }
                label={
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>İlk İletişim</Typography>
                    <Typography variant="caption" color="text.secondary">Bu kategori için iletişim tanımlayın</Typography>
                  </Box>
                }
                sx={{ m: 0, width: "100%", justifyContent: "space-between" }}
                labelPlacement="start"
              />
            </Paper>

            {/* Lead Form ID */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
                Lead Form ID
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Lead Form ID"
                value={form.leadFormId}
                onChange={(e) => setForm({ ...form, leadFormId: e.target.value })}
              />
              <Typography variant="caption" color="text.secondary">
                Facebook Lead Form ID'yi manuel olarak girebilirsiniz.
              </Typography>
            </Box>

            {/* Global */}
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "#F9FAFB" }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.global}
                    onChange={(e) => setForm({ ...form, global: e.target.checked })}
                    size="small"
                  />
                }
                label={
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>Global</Typography>
                    <Typography variant="caption" color="text.secondary">Bu kategori global olarak kullanılsın mı?</Typography>
                  </Box>
                }
                sx={{ m: 0, width: "100%", justifyContent: "space-between" }}
                labelPlacement="start"
              />
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog} variant="outlined">İptal</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={loading || !form.name.trim() || !form.topParent}
            sx={{ bgcolor: "#3b82f6", "&:hover": { bgcolor: "#2563eb" } }}
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
