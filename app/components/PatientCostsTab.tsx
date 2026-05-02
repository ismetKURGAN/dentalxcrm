"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Paper, Typography, Button, IconButton, Chip, TextField, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Stack, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Snackbar, Alert, Collapse,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CreditCardIcon from "@mui/icons-material/CreditCard";

const COST_CATEGORIES = [
  { value: "transfer", label: "Transfer", icon: "✈️" },
  { value: "laboratory", label: "Laboratuvar", icon: "🧪" },
  { value: "hotel", label: "Otel", icon: "🏨" },
  { value: "clinic", label: "Klinik", icon: "🦷" },
  { value: "advertising", label: "Reklam", icon: "📣" },
  { value: "salary", label: "Personel", icon: "👥" },
  { value: "saleup", label: "Sale Up (Satış Yükseltme)", icon: "⬆️" },
  { value: "other", label: "Diğer", icon: "📦" },
];

const CURRENCIES = ["EUR", "GBP", "USD", "TRY", "PLN", "CHF", "SEK", "NOK", "DKK"];

const DEFAULT_RATES: Record<string, number> = {
  GBP: 1.17, USD: 0.92, TRY: 0.028, PLN: 0.23, CHF: 1.05, SEK: 0.088, NOK: 0.085, DKK: 0.134,
};

function loadRates(): Record<string, number> {
  if (typeof window === "undefined") return DEFAULT_RATES;
  try { return JSON.parse(localStorage.getItem("cost_rates") || "null") || DEFAULT_RATES; } catch { return DEFAULT_RATES; }
}

function toEUR(amount: number, currency: string, rates: Record<string, number>): number {
  if (currency === "EUR") return amount;
  return amount * (rates[currency] ?? DEFAULT_RATES[currency] ?? 1);
}

function getCategoryInfo(value: string) {
  return COST_CATEGORIES.find(c => c.value === value) || { value, label: value, icon: "📦" };
}

function fmt(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

const CARD_HEADER_DESC = "__CARD_HEADER__";

const emptyForm = {
  category: "transfer",
  direction: "expense",
  amount: "",
  salesAmount: "",
  currency: "EUR",
  description: "",
  date: new Date().toISOString().slice(0, 10),
  visitGroup: "",
};

interface Props { patientId: string; patientName: string; }

export default function PatientCostsTab({ patientId, patientName }: Props) {
  const [costs, setCosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [noDate, setNoDate] = useState(false);
  const [saving, setSaving] = useState(false);

  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [newCardName, setNewCardName] = useState("");
  const [cardSaving, setCardSaving] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "cost" | "card"; id: string } | null>(null);
  const [rates] = useState<Record<string, number>>(() => loadRates());
  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "error" }>({ open: false, msg: "", sev: "success" });

  const fetchCosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/costs?relatedId=${patientId}`, { cache: "no-store" });
      if (res.ok) setCosts(await res.json());
    } finally { setLoading(false); }
  }, [patientId]);

  useEffect(() => { fetchCosts(); }, [fetchCosts]);

  // Derive cards from __CARD_HEADER__ records + any orphan visitGroups
  const cards = useMemo(() => {
    const headers = costs
      .filter(c => c.description === CARD_HEADER_DESC)
      .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));

    const headerGroupNames = new Set(headers.map(h => h.visitGroup));

    const orphanGroups = [
      ...new Set(
        costs
          .filter(c => c.visitGroup && c.description !== CARD_HEADER_DESC)
          .map(c => c.visitGroup)
      ),
    ].filter(g => !headerGroupNames.has(g));

    return [
      ...headers.map(h => ({ id: h.id, name: h.visitGroup })),
      ...orphanGroups.map(g => ({ id: `orphan_${g}`, name: g as string })),
    ];
  }, [costs]);

  // Auto-expand newly appeared cards
  useEffect(() => {
    setExpandedCards(prev => {
      const next = { ...prev };
      cards.forEach(c => { if (!(c.id in next)) next[c.id] = true; });
      return next;
    });
  }, [cards]);

  // Real costs (exclude __CARD_HEADER__ records)
  const realCosts = useMemo(() => costs.filter(c => c.description !== CARD_HEADER_DESC), [costs]);

  const totalExpense = useMemo(() =>
    realCosts.filter(c => c.direction === "expense").reduce((s, c) => s + toEUR(c.amount, c.currency, rates), 0),
    [realCosts, rates]);
  const totalIncome = useMemo(() =>
    realCosts.filter(c => c.direction === "income").reduce((s, c) => s + toEUR(c.amount, c.currency, rates), 0),
    [realCosts, rates]);
  const net = totalIncome - totalExpense;

  const groupedCosts = useMemo(() => {
    const map: Record<string, any[]> = { "": [] };
    realCosts.forEach(c => {
      const g = c.visitGroup || "";
      if (!map[g]) map[g] = [];
      map[g].push(c);
    });
    return map;
  }, [realCosts]);

  const openAddCard = () => {
    const nextNum = cards.length + 1;
    setNewCardName(`${nextNum}. Visit`);
    setCardDialogOpen(true);
  };

  const handleSaveCard = async () => {
    if (!newCardName.trim()) return;
    setCardSaving(true);
    try {
      const res = await fetch("/api/costs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "patient",
          category: "other",
          direction: "expense",
          amount: 0,
          currency: "EUR",
          description: CARD_HEADER_DESC,
          visitGroup: newCardName.trim(),
          relatedId: patientId,
          relatedName: patientName,
          date: "",
        }),
      });
      if (res.ok) {
        setCardDialogOpen(false);
        setNewCardName("");
        fetchCosts();
      } else {
        setSnack({ open: true, msg: "Kart oluşturulamadı", sev: "error" });
      }
    } finally { setCardSaving(false); }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!cardId.startsWith("orphan_")) {
      await fetch(`/api/costs?id=${cardId}`, { method: "DELETE" });
    }
    setDeleteConfirm(null);
    setSnack({ open: true, msg: "Kart silindi", sev: "success" });
    fetchCosts();
  };

  const openAdd = (visitGroup = "") => {
    setEditingId(null);
    setNoDate(false);
    setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10), visitGroup });
    setDialogOpen(true);
  };

  const openEdit = (c: any) => {
    setEditingId(c.id);
    const hasDate = !!c.date;
    setNoDate(!hasDate);
    setForm({
      category: c.category, direction: c.direction, amount: c.amount.toString(),
      salesAmount: (c.salesAmount || 0).toString(), currency: c.currency,
      description: c.description || "", date: hasDate ? c.date : new Date().toISOString().slice(0, 10),
      visitGroup: c.visitGroup || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.amount || Number(form.amount) <= 0) {
      setSnack({ open: true, msg: "Geçerli bir tutar girin", sev: "error" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form, type: "patient", amount: Number(form.amount),
        salesAmount: Number(form.salesAmount || 0),
        relatedId: patientId, relatedName: patientName,
        visitGroup: form.visitGroup || "",
        date: noDate ? "" : form.date,
      };
      const res = editingId
        ? await fetch("/api/costs", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, id: editingId }) })
        : await fetch("/api/costs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        setSnack({ open: true, msg: editingId ? "Güncellendi" : "Eklendi", sev: "success" });
        setDialogOpen(false);
        fetchCosts();
      } else {
        setSnack({ open: true, msg: "Hata oluştu", sev: "error" });
      }
    } finally { setSaving(false); }
  };

  const handleDeleteCost = async (id: string) => {
    await fetch(`/api/costs?id=${id}`, { method: "DELETE" });
    setDeleteConfirm(null);
    setSnack({ open: true, msg: "Silindi", sev: "success" });
    fetchCosts();
  };

  const cardTotals = (costList: any[]) => {
    const exp = costList.filter(c => c.direction === "expense").reduce((s, c) => s + toEUR(c.amount, c.currency, rates), 0);
    const inc = costList.filter(c => c.direction === "income").reduce((s, c) => s + toEUR(c.amount, c.currency, rates), 0);
    return { exp, inc, net: inc - exp };
  };

  const renderCostRows = (costList: any[]) =>
    costList.map(c => {
      const cat = getCategoryInfo(c.category);
      return (
        <TableRow key={c.id} hover>
          <TableCell sx={{ fontSize: "0.75rem" }}>{c.date || "—"}</TableCell>
          <TableCell>
            <Chip label={`${cat.icon} ${cat.label}`} size="small"
              sx={{ fontSize: "0.68rem", height: 18, bgcolor: "#F3F4F6" }} />
          </TableCell>
          <TableCell>
            <Chip label={c.direction === "expense" ? "Gider" : "Gelir"} size="small"
              sx={{ fontSize: "0.68rem", height: 18, fontWeight: 600,
                bgcolor: c.direction === "expense" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                color: c.direction === "expense" ? "#ef4444" : "#22c55e" }} />
          </TableCell>
          <TableCell sx={{ fontSize: "0.75rem", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {c.description || "—"}
          </TableCell>
          <TableCell align="right">
            <Typography fontWeight={700} fontSize="0.8rem"
              sx={{ color: c.direction === "expense" ? "#ef4444" : "#22c55e" }}>
              {c.direction === "expense" ? "−" : "+"}{fmt(c.amount, c.currency)}
            </Typography>
            {c.currency !== "EUR" && (
              <Typography fontSize="0.68rem" color="text.secondary">
                ≈ € {toEUR(c.amount, c.currency, rates).toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
              </Typography>
            )}
          </TableCell>
          <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
            <Tooltip title="Düzenle">
              <IconButton size="small" onClick={() => openEdit(c)}><EditIcon sx={{ fontSize: 14 }} /></IconButton>
            </Tooltip>
            <Tooltip title="Sil">
              <IconButton size="small" onClick={() => setDeleteConfirm({ type: "cost", id: c.id })} sx={{ color: "#ef4444" }}>
                <DeleteIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          </TableCell>
        </TableRow>
      );
    });

  const costTableHead = (
    <TableHead>
      <TableRow sx={{ bgcolor: "#F9FAFB" }}>
        <TableCell sx={{ fontWeight: 600, fontSize: "0.72rem" }}>Tarih</TableCell>
        <TableCell sx={{ fontWeight: 600, fontSize: "0.72rem" }}>Kategori</TableCell>
        <TableCell sx={{ fontWeight: 600, fontSize: "0.72rem" }}>Tür</TableCell>
        <TableCell sx={{ fontWeight: 600, fontSize: "0.72rem" }}>Açıklama</TableCell>
        <TableCell sx={{ fontWeight: 600, fontSize: "0.72rem" }} align="right">Tutar</TableCell>
        <TableCell sx={{ fontWeight: 600, fontSize: "0.72rem" }} align="center">İşlem</TableCell>
      </TableRow>
    </TableHead>
  );

  return (
    <Box>
      {/* ÖZET */}
      <Stack direction="row" spacing={2} mb={2} flexWrap="wrap">
        {[
          { label: "Toplam Gider (EUR)", value: totalExpense, color: "#ef4444", icon: <TrendingDownIcon sx={{ color: "#ef4444", fontSize: 18 }} />, bg: "rgba(239,68,68,0.08)" },
          { label: "Toplam Gelir (EUR)", value: totalIncome, color: "#22c55e", icon: <TrendingUpIcon sx={{ color: "#22c55e", fontSize: 18 }} />, bg: "rgba(34,197,94,0.08)" },
          { label: "Net (EUR)", value: net, color: net >= 0 ? "#6366f1" : "#ef4444", icon: <AccountBalanceWalletIcon sx={{ color: net >= 0 ? "#6366f1" : "#ef4444", fontSize: 18 }} />, bg: "rgba(99,102,241,0.08)" },
        ].map((card, i) => (
          <Paper key={i} variant="outlined" sx={{ p: 1.5, borderRadius: 2, display: "flex", alignItems: "center", gap: 1, minWidth: 160 }}>
            <Box sx={{ p: 0.75, borderRadius: 1, bgcolor: card.bg }}>{card.icon}</Box>
            <Box>
              <Typography variant="caption" color="text.secondary">{card.label}</Typography>
              <Typography fontWeight={700} fontSize="0.9rem" sx={{ color: card.color }}>{fmt(card.value, "EUR")}</Typography>
            </Box>
          </Paper>
        ))}
      </Stack>

      {/* BUTONLAR */}
      <Stack direction="row" spacing={1} mb={2}>
        <Button variant="outlined" size="small" startIcon={<CreditCardIcon />} onClick={openAddCard}
          sx={{ textTransform: "none", fontWeight: 600, borderColor: "#7C3AED", color: "#7C3AED",
            "&:hover": { borderColor: "#7C3AED", bgcolor: "rgba(124,58,237,0.06)" } }}>
          Kart Ekle
        </Button>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => openAdd()}
          sx={{ textTransform: "none", background: "linear-gradient(135deg, #7C3AED, #9F67FF)" }}>
          Genel Maliyet Ekle
        </Button>
      </Stack>

      {loading && <LinearProgress sx={{ mb: 1, borderRadius: 1 }} />}

      {/* VİZİT KARTLARI */}
      {cards.map(card => {
        const cardCosts = groupedCosts[card.name] || [];
        const totals = cardTotals(cardCosts);
        const isExpanded = expandedCards[card.id] !== false;

        return (
          <Paper key={card.id} variant="outlined" sx={{ mb: 2, borderRadius: 2, overflow: "hidden" }}>
            <Box sx={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              px: 2, py: 1.5, bgcolor: "rgba(124,58,237,0.06)",
              borderBottom: isExpanded ? "1px solid rgba(124,58,237,0.12)" : "none",
            }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <CreditCardIcon sx={{ fontSize: 16, color: "#7C3AED" }} />
                <Typography fontWeight={700} fontSize="0.9rem" sx={{ color: "#7C3AED" }}>{card.name}</Typography>
                <Chip size="small" label={`${cardCosts.length} kayıt`}
                  sx={{ fontSize: "0.65rem", height: 18, bgcolor: "rgba(124,58,237,0.12)", color: "#7C3AED" }} />
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                {cardCosts.length > 0 && (
                  <>
                    <Chip size="small" label={`Gider: € ${totals.exp.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}`}
                      sx={{ fontSize: "0.65rem", height: 18, bgcolor: "rgba(239,68,68,0.1)", color: "#ef4444", fontWeight: 600 }} />
                    {totals.inc > 0 && (
                      <Chip size="small" label={`Gelir: € ${totals.inc.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}`}
                        sx={{ fontSize: "0.65rem", height: 18, bgcolor: "rgba(34,197,94,0.1)", color: "#22c55e", fontWeight: 600 }} />
                    )}
                  </>
                )}
                <Tooltip title="Bu karta maliyet ekle">
                  <IconButton size="small" onClick={() => openAdd(card.name)} sx={{ color: "#7C3AED" }}>
                    <AddIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Kartı sil">
                  <IconButton size="small" onClick={() => setDeleteConfirm({ type: "card", id: card.id })} sx={{ color: "#ef4444" }}>
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                <IconButton size="small" onClick={() => setExpandedCards(prev => ({ ...prev, [card.id]: !isExpanded }))}>
                  {isExpanded ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
                </IconButton>
              </Stack>
            </Box>

            <Collapse in={isExpanded}>
              {cardCosts.length === 0 ? (
                <Box sx={{ p: 3, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary" mb={1}>Bu karta henüz maliyet eklenmedi.</Typography>
                  <Button size="small" startIcon={<AddIcon />} onClick={() => openAdd(card.name)}
                    sx={{ textTransform: "none", color: "#7C3AED" }}>
                    Maliyet Ekle
                  </Button>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    {costTableHead}
                    <TableBody>{renderCostRows(cardCosts)}</TableBody>
                  </Table>
                </TableContainer>
              )}
            </Collapse>
          </Paper>
        );
      })}

      {/* GENEL MALİYETLER */}
      {(groupedCosts[""] || []).length > 0 && (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", mb: 2 }}>
          <Box sx={{ px: 2, py: 1.5, bgcolor: "#F9FAFB", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <Typography fontWeight={700} fontSize="0.85rem" color="text.secondary">
              📋 Genel Maliyetler ({(groupedCosts[""] || []).length} kayıt)
            </Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              {costTableHead}
              <TableBody>{renderCostRows(groupedCosts[""] || [])}</TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* BOŞ DURUM */}
      {realCosts.length === 0 && cards.length === 0 && !loading && (
        <Paper variant="outlined" sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
          <Typography color="text.secondary" variant="body2">
            Henüz kayıt yok. "Kart Ekle" veya "Genel Maliyet Ekle" ile başlayın.
          </Typography>
        </Paper>
      )}

      {/* KART EKLEME MODAL */}
      <Dialog open={cardDialogOpen} onClose={() => setCardDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Kart Ekle
          <IconButton size="small" onClick={() => setCardDialogOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Kart Adı" fullWidth size="small" autoFocus
            value={newCardName}
            onChange={e => setNewCardName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleSaveCard(); }}
            placeholder="ör: 1. Visit, 2. Visit, Ön Ödeme..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCardDialogOpen(false)} sx={{ textTransform: "none" }}>İptal</Button>
          <Button variant="contained" onClick={handleSaveCard} disabled={!newCardName.trim() || cardSaving}
            sx={{ textTransform: "none", background: "linear-gradient(135deg, #7C3AED, #9F67FF)" }}>
            {cardSaving ? "Oluşturuluyor..." : "Oluştur"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* MALİYET EKLEME/DÜZENLEME MODAL */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <span>{editingId ? "Kaydı Düzenle" : "Maliyet Ekle"}</span>
            {form.visitGroup && (
              <Chip size="small" label={form.visitGroup}
                sx={{ fontSize: "0.72rem", height: 20, bgcolor: "rgba(124,58,237,0.12)", color: "#7C3AED" }} />
            )}
          </Stack>
          <IconButton size="small" onClick={() => setDialogOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <Stack direction="row" spacing={2}>
              <TextField select label="Kategori" size="small" fullWidth value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {COST_CATEGORIES.map(c => <MenuItem key={c.value} value={c.value}>{c.icon} {c.label}</MenuItem>)}
              </TextField>
              <TextField select label="Tür" size="small" fullWidth value={form.direction}
                onChange={e => setForm(f => ({ ...f, direction: e.target.value }))}>
                <MenuItem value="expense">💸 Gider</MenuItem>
                <MenuItem value="income">💰 Gelir</MenuItem>
              </TextField>
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Tutar" type="number" size="small" fullWidth value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                inputProps={{ min: 0, step: 0.01 }}
                helperText={form.currency !== "EUR" && Number(form.amount) > 0
                  ? `≈ € ${toEUR(Number(form.amount), form.currency, rates).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : " "} />
              <TextField select label="Para Birimi" size="small" fullWidth value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                {CURRENCIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <TextField label="Satış Tutarı (opsiyonel)" type="number" size="small" fullWidth
                value={form.salesAmount}
                onChange={e => setForm(f => ({ ...f, salesAmount: e.target.value }))}
                inputProps={{ min: 0, step: 0.01 }} />
              <Box sx={{ flex: 1 }}>
                {noDate ? (
                  <TextField key="no-date" label="Tarih" size="small" fullWidth value="Tarihi belli değil"
                    disabled InputLabelProps={{ shrink: true }} />
                ) : (
                  <TextField key="with-date" label="Tarih" type="date" size="small" fullWidth value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    InputLabelProps={{ shrink: true }} />
                )}
                <Button
                  size="small"
                  variant={noDate ? "contained" : "text"}
                  onClick={() => setNoDate(v => !v)}
                  sx={{ mt: 0.5, textTransform: "none", fontSize: "0.72rem", p: "2px 8px",
                    ...(noDate
                      ? { background: "#7C3AED", color: "#fff", "&:hover": { background: "#6D28D9" } }
                      : { color: "#6B7280" }) }}
                >
                  {noDate ? "✓ Tarihi belli değil" : "Tarihi belli değil"}
                </Button>
              </Box>
            </Stack>
            <TextField label="Açıklama" size="small" fullWidth multiline rows={2} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: "none" }}>İptal</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}
            sx={{ textTransform: "none", background: "linear-gradient(135deg, #7C3AED, #9F67FF)" }}>
            {saving ? "Kaydediliyor..." : editingId ? "Güncelle" : "Ekle"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SİLME ONAY */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>
          {deleteConfirm?.type === "card" ? "Kartı Sil" : "Kaydı Sil"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {deleteConfirm?.type === "card"
              ? "Bu kartı silmek istediğinizden emin misiniz? Karttaki maliyet kayıtları silinmez, genel bölümde görünür."
              : "Bu maliyet kaydını silmek istediğinizden emin misiniz?"}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteConfirm(null)} sx={{ textTransform: "none" }}>İptal</Button>
          <Button variant="contained" color="error" sx={{ textTransform: "none" }}
            onClick={() => {
              if (!deleteConfirm) return;
              if (deleteConfirm.type === "card") handleDeleteCard(deleteConfirm.id);
              else handleDeleteCost(deleteConfirm.id);
            }}>
            Sil
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.sev} onClose={() => setSnack(s => ({ ...s, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
