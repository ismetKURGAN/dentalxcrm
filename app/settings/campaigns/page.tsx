"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "../../components/AuthProvider";
import { useI18n } from "../../components/I18nProvider";

const PARENT_OPTIONS = [
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

interface Campaign {
  id: string;
  // New tree model fields
  name: string; // klasör / kategori ismi
  type: "folder" | "category"; // klasör mü kategori mi
  topParent: string; // en üst parent (Website, Meta, TikTok ...)
  parentId?: string | null; // hangi node'un altında
  leadFormId?: string; // sadece category için anlamlı

  // Legacy fields for backward compatibility
  title?: string;
  parent?: string; // eski üst kategori alanı
  createdAt?: string;
  updatedAt?: string;
}

export default function CampaignSettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("Admin") || user?.roles?.includes("SuperAdmin");
  const { t } = useI18n();

  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);

  const [form, setForm] = useState<Campaign>({
    id: "",
    name: "",
    type: "category",
    topParent: "",
    parentId: null,
    leadFormId: "",
  });

  // Yardımcı: API'den gelen ham veriyi Campaign modeline normalize et
  const normalizeCampaign = (raw: any): Campaign => {
    const id = (raw.id ?? "").toString();
    const topParent = (raw.topParent || raw.parent || "").toString();
    const name = (raw.name || raw.title || "").toString();
    const type: "folder" | "category" =
      raw.type === "folder" || raw.type === "category" ? raw.type : "category";
    const parentId =
      typeof raw.parentId === "string" && raw.parentId.trim() !== ""
        ? raw.parentId
        : null;
    const leadFormId =
      typeof raw.leadFormId === "string" && raw.leadFormId.trim() !== ""
        ? raw.leadFormId
        : undefined;

    return {
      id,
      name,
      type,
      topParent,
      parentId,
      leadFormId,
      // legacy mirror fields
      title: name,
      parent: topParent,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  };

  // Ağaç yapısını oluşturmak için yardımcı tip ve hesaplama
  interface TreeNode extends Campaign {
    children: TreeNode[];
    level: number;
  }

  const treeByTopParent = useMemo(() => {
    const normalized = items.map(normalizeCampaign);

    const byId: Record<string, TreeNode> = {};
    const rootsByTopParent: Record<string, TreeNode[]> = {};

    normalized.forEach((c) => {
      const node: TreeNode = {
        ...c,
        children: [],
        level: 0,
      };
      byId[c.id] = node;
    });

    Object.values(byId).forEach((node) => {
      const topParent = node.topParent || node.parent || "Diğer";
      if (!rootsByTopParent[topParent]) rootsByTopParent[topParent] = [];

      if (node.parentId && byId[node.parentId]) {
        node.level = byId[node.parentId].level + 1;
        byId[node.parentId].children.push(node);
      } else {
        node.level = 0;
        rootsByTopParent[topParent].push(node);
      }
    });

    // çocukları ve kökleri isimlerine göre sırala
    const sortTree = (nodes: TreeNode[]): TreeNode[] => {
      nodes.forEach((n) => {
        if (n.children?.length) {
          n.children = sortTree(n.children);
        }
      });
      return nodes.sort((a, b) => a.name.localeCompare(b.name));
    };

    Object.keys(rootsByTopParent).forEach((key) => {
      rootsByTopParent[key] = sortTree(rootsByTopParent[key]);
    });

    return rootsByTopParent;
  }, [items]);

  // Belirli bir topParent için parent seçimi dropdown'u için düz liste çıkar
  const buildParentOptionsFor = (topParent: string): { id: string | null; label: string }[] => {
    const list: { id: string | null; label: string }[] = [];
    if (!topParent) return list;

    list.push({ id: null, label: "Üst düzey (sadece üst kategori altında)" });

    const roots = treeByTopParent[topParent] || [];

    const walk = (nodes: TreeNode[]) => {
      nodes.forEach((n) => {
        const indent = "".padStart(n.level * 2, " ");
        list.push({ id: n.id, label: `${indent}${n.name}` });
        if (n.children?.length) walk(n.children);
      });
    };

    walk(roots);
    return list;
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/campaigns", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const arr = Array.isArray(data) ? data : [];
        setItems(arr);
      }
    } catch (e) {
      console.error("Kampanyalar yüklenemedi", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      load();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          {t("campaigns.accessDenied.title")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("campaigns.accessDenied.message")}
        </Typography>
      </Box>
    );
  }

  const openNewDialog = () => {
    setEditing(null);
    setForm({
      id: "",
      name: "",
      type: "category",
      topParent: "",
      parentId: null,
      leadFormId: "",
    } as Campaign);
    setDialogOpen(true);
  };

  const openEditDialog = (item: Campaign) => {
    const normalized = normalizeCampaign(item);
    setEditing(item);
    setForm({
      id: normalized.id,
      name: normalized.name,
      type: normalized.type,
      topParent: normalized.topParent,
      parentId: normalized.parentId ?? null,
      leadFormId: normalized.leadFormId,
    } as Campaign);
    setDialogOpen(true);
  };

  const handleFormChange = (field: keyof Campaign, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDelete = async (item: Campaign) => {
    if (!item.id) return;
    const ok = window.confirm(`"${item.title}" kampanyasını silmek istediğinize emin misiniz?`);
    if (!ok) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/campaigns?id=${encodeURIComponent(item.id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await load();
      }
    } catch (e) {
      console.error("Kampanya silinemedi", e);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.topParent) return;
    if (form.type === "category" && !form.leadFormId) return;

    setSaving(true);
    try {
      const method = editing ? "PUT" : "POST";
      const body: any = {
        id: editing?.id || undefined,
        // new model fields
        name: form.name,
        type: form.type,
        topParent: form.topParent,
        parentId: form.parentId ?? null,
        leadFormId: form.leadFormId,
        // legacy mirror fields (CRM ve eski kod için)
        title: form.name,
        parent: form.topParent,
      };

      const res = await fetch("/api/campaigns", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await load();
        setDialogOpen(false);
      }
    } catch (e) {
      console.error("Kampanya kaydedilemedi", e);
    }
    setSaving(false);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            {t("campaigns.page.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("campaigns.page.subtitle")}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openNewDialog}
          disabled={loading}
        >
          {t("campaigns.page.new")}
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t("campaigns.table.parent")}</TableCell>
              <TableCell>{t("campaigns.table.name")}</TableCell>
              <TableCell>{t("campaigns.table.leadFormId")}</TableCell>
              <TableCell width={64} align="right">
                {t("campaigns.table.edit")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(() => {
              const rows: React.ReactNode[] = [];

              const renderNodeRow = (node: TreeNode, topParentLabel: string) => {
                rows.push(
                  <TableRow key={node.id} hover>
                    <TableCell />
                    <TableCell>
                      <Box sx={{ pl: (node.level + 1) * 2 }}>
                        <Typography
                          variant="body2"
                          fontWeight={node.type === "folder" ? 600 : 400}
                          sx={{ display: "inline" }}
                        >
                          {node.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{node.type === "category" ? node.leadFormId : ""}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <IconButton size="small" onClick={() => openEditDialog(node)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(node)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );

                if (node.children?.length) {
                  node.children.forEach((child) => renderNodeRow(child, topParentLabel));
                }
              };

              const allTopParents = new Set<string>();
              PARENT_OPTIONS.forEach((p) => allTopParents.add(p));
              Object.keys(treeByTopParent).forEach((p) => allTopParents.add(p));

              const orderedTopParents = Array.from(allTopParents).filter(Boolean);
              orderedTopParents.sort((a, b) => {
                const ai = PARENT_OPTIONS.indexOf(a);
                const bi = PARENT_OPTIONS.indexOf(b);
                if (ai === -1 && bi === -1) return a.localeCompare(b);
                if (ai === -1) return 1;
                if (bi === -1) return -1;
                return ai - bi;
              });

              orderedTopParents.forEach((topParent) => {
                const nodes = treeByTopParent[topParent] || [];

                rows.push(
                  <TableRow key={`header-${topParent}`} sx={{ bgcolor: "#F9FAFB" }}>
                    <TableCell colSpan={4}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        sx={{ color: "text.secondary" }}
                      >
                        {topParent}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );

                nodes.forEach((node) => renderNodeRow(node, topParent));
              });

              return rows;
            })()}
            {items.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    {t("campaigns.table.empty")}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {editing ? t("campaigns.dialog.editTitle") : t("campaigns.dialog.newTitle")}
          </Typography>
          <IconButton size="small" onClick={() => setDialogOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} mt={1}>
            <TextField
              fullWidth
              select
              label={t("campaigns.dialog.topParent")}
              value={form.topParent || ""}
              onChange={(e) => {
                const val = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  topParent: val,
                  parentId: null, // üst kategori değişince parentId sıfırlansın
                }));
              }}
              size="small"
            >
              {PARENT_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </TextField>

            <FormControlLabel
              control={
                <Switch
                  checked={form.type === "folder"}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      type: e.target.checked ? "folder" : "category",
                    }))
                  }
                  color="primary"
                />
              }
              label={form.type === "folder" ? t("campaigns.dialog.nodeType.folder") : t("campaigns.dialog.nodeType.category")}
            />

            {form.topParent && (
              <TextField
                fullWidth
                select
                label={t("campaigns.dialog.parentNode")}
                value={form.parentId ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    parentId: val === "" ? null : val,
                  }));
                }}
                size="small"
              >
                {buildParentOptionsFor(form.topParent).map((opt) => (
                  <MenuItem key={opt.id ?? "root"} value={opt.id ?? ""}>
                    {opt.id === null ? t("campaigns.dialog.rootOption") : opt.label}
                  </MenuItem>
                ))}
              </TextField>
            )}

            <TextField
              fullWidth
              label={form.type === "folder" ? t("campaigns.dialog.folderName") : t("campaigns.dialog.categoryName")}
              value={form.name}
              onChange={(e) => handleFormChange("name", e.target.value)}
              size="small"
            />

            {form.type === "category" && (
              <TextField
                fullWidth
                label={t("campaigns.dialog.leadFormId")}
                value={form.leadFormId || ""}
                onChange={(e) => handleFormChange("leadFormId", e.target.value)}
                size="small"
                helperText={t("campaigns.dialog.leadFormId.help")}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t("campaigns.dialog.cancel")}</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={
              saving ||
              !form.name ||
              !form.topParent ||
              (form.type === "category" && !form.leadFormId)
            }
          >
            {saving ? "..." : t("campaigns.dialog.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
