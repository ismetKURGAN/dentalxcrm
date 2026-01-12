"use client";

import React, { useEffect, useState } from "react";
import { 
  Box, Typography, Button, Card, CardContent, Grid, Chip, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack, IconButton,
  Select, MenuItem, FormControl, InputLabel, Paper, Divider
} from "@mui/material";

// İKONLAR
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PeopleIcon from "@mui/icons-material/People";
import EditIcon from "@mui/icons-material/Edit"; // Kalem İkonu
import DeleteIcon from "@mui/icons-material/Delete"; // Silme İkonu
import AddIcon from "@mui/icons-material/Add"; // Ekle İkonu
import EmailIcon from "@mui/icons-material/Email";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";

// --- TİPLER VE SAHTE VERİLER ---

interface FilterRule {
    id: number;
    field: string;
    operator: string;
    value: string;
}

interface Segment {
    id: number;
    title: string;
    count: number;
    status: string;
    language: string;
    connector: string;
    rules: FilterRule[];
}

const MOCK_SEGMENTS: Segment[] = [
    { 
        id: 1, title: "Helsinki RM Fince", count: 48, status: "Hazır", 
        language: "Finnish", connector: "VE",
        rules: [
            { id: 1, field: "Kategoriler", operator: "İçinde", value: "Fince Helsinki 29 30 Kasım" },
            { id: 2, field: "Durumlar", operator: "İçinde", value: "5 adet seçildi" }
        ]
    },
    { 
        id: 2, title: "Aberdeen Online RM", count: 16, status: "Hazır",
        language: "English", connector: "VE",
        rules: []
    },
    { 
        id: 3, title: "Rusça Dental Teklif", count: 120, status: "Beklemede",
        language: "Russian", connector: "VE",
        rules: [] 
    },
    { 
        id: 4, title: "Lehçe Remarketing", count: 38, status: "Tamamlandı",
        language: "Polish", connector: "VE",
        rules: [] 
    },
];

// Mock Seçenekler (Dropdownlar için)
const FIELD_OPTIONS = ["Kategoriler", "Durumlar", "Kaynak", "Danışman", "Oluşturma Tarihi"];
const OPERATOR_OPTIONS = ["İçinde", "Eşittir", "Eşit Değildir", "Boş", "Dolu"];
const LANG_OPTIONS = ["Turkish", "English", "Finnish", "German", "Russian"];

// --- WAHA & YARDIMCI FONKSİYONLAR ---

function normalizePhone(value: string | undefined | null): string {
    if (!value) return "";
    let digits = String(value).replace(/\D/g, "");

    // Zaten 90..., 44... gibi ülke kodu ile başlıyorsa dokunma
    if (digits.startsWith("90") || digits.startsWith("44")) {
        return digits;
    }

    // TR mobil: 05xxxxxxxxx → 905xxxxxxxxx (sadece baştaki 0'ı at)
    if (digits.length === 11 && digits.startsWith("05")) {
        return `90${digits.slice(1)}`;
    }

    // TR mobil: 5xxxxxxxxx → 905xxxxxxxxx
    if (digits.length === 10 && digits.startsWith("5")) {
        return `90${digits}`;
    }

    // UK mobil: 07xxxxxxxxx → 447xxxxxxxxx
    if (digits.length === 11 && digits.startsWith("07")) {
        return `44${digits.slice(1)}`;
    }

    // UK mobil: 7xxxxxxxxx → 447xxxxxxxxx
    if (digits.length === 10 && digits.startsWith("7")) {
        return `44${digits}`;
    }

    return digits;
}

async function sendWahaMessage(session: string, phone: string, text: string) {
    const normalized = normalizePhone(phone);
    if (!normalized) return;
    const chatId = `${normalized}@c.us`;
    try {
        const res = await fetch("/api/waha/api/sendText", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session, chatId, text })
        });
        const body = await res.text();
        console.log("[segments:waha]", res.status, body);
    } catch (e) {
        console.error("[segments:waha] gönderim hatası", e);
    }
}

export default function SegmentsPage() {
    const [segments, setSegments] = useState<Segment[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    
    // --- KAMPANYA YÜRÜTME STATE ---
    const [activeCampaign, setActiveCampaign] = useState<Segment | null>(null);
    const [campaignMessage, setCampaignMessage] = useState("");
    const [campaignIntervalSec, setCampaignIntervalSec] = useState(90);
    const [campaignSession, setCampaignSession] = useState("default");
    const [availableSessions, setAvailableSessions] = useState<string[]>(["default"]);
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [activeTargets, setActiveTargets] = useState<any[]>([]);

    // --- DÜZENLEME (EDİTÖR) STATE ---
    const [editSegment, setEditSegment] = useState<Segment | null>(null); // Şu an düzenlenen segment
    const [isEditOpen, setIsEditOpen] = useState(false);

    // --- E-POSTA KAMPANYASI STATE ---
    const [emailSegment, setEmailSegment] = useState<Segment | null>(null);
    const [emailTargets, setEmailTargets] = useState<any[]>([]);
    const [emailTemplate, setEmailTemplate] = useState("");
    const [emailIntervalSec, setEmailIntervalSec] = useState(90);

    // --- SEGMENTLERİ VE MÜŞTERİLERİ YÜKLE ---
    useEffect(() => {
        const fetchAll = async () => {
            try {
                setLoadingCustomers(true);

                const [segRes, custRes, wahaRes] = await Promise.all([
                    fetch("/api/segments", { cache: "no-store" }),
                    fetch("/api/crm", { cache: "no-store" }),
                    fetch("/api/settings/whatsapp", { cache: "no-store" }),
                ]);

                if (segRes.ok) {
                    const segData = await segRes.json();
                    setSegments(segData);
                } else {
                    setSegments(MOCK_SEGMENTS);
                }

                if (custRes.ok) {
                    const data = await custRes.json();
                    setCustomers(data);
                }

                if (wahaRes.ok) {
                    const wcfg = await wahaRes.json();
                    if (wcfg.defaultSession) {
                        setCampaignSession(wcfg.defaultSession);
                    }
                    if (typeof wcfg.sendDelayMs === "number" && wcfg.sendDelayMs > 0) {
                        setCampaignIntervalSec(Math.round(wcfg.sendDelayMs / 1000));
                    }

                    // Session listesi: varsa wcfg.sessions, yoksa defaultSession üzerinden oluştur
                    if (Array.isArray(wcfg.sessions) && wcfg.sessions.length > 0) {
                        setAvailableSessions(wcfg.sessions);
                    } else {
                        const def = wcfg.defaultSession || "default";
                        setAvailableSessions([def]);
                    }
                }
            } catch (e) {
                console.error("Segmentler veya müşteriler alınamadı", e);
                setSegments(MOCK_SEGMENTS);
            } finally {
                setLoadingCustomers(false);
            }
        };
        fetchAll();
    }, []);

    // --- DÜZENLEME FONKSİYONLARI ---
    const handleEditClick = (seg: Segment) => {
        // Deep copy alıyoruz ki iptal edince asıl veri bozulmasın
        setEditSegment(JSON.parse(JSON.stringify(seg)));
        setIsEditOpen(true);
    };

    const handleSaveSegment = async () => {
        if (!editSegment) return;
        const exists = segments.some(s => s.id === editSegment.id);
        try {
            if (exists) {
                // Update
                const res = await fetch("/api/segments", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(editSegment),
                });
                if (res.ok) {
                    const updated = await res.json();
                    setSegments(prev => prev.map(s => (s.id === updated.id ? updated : s)));
                }
            } else {
                // Create
                const res = await fetch("/api/segments", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(editSegment),
                });
                if (res.ok) {
                    const created = await res.json();
                    setSegments(prev => [...prev, created]);
                }
            }
        } catch (e) {
            console.error("Segment kaydetme hatası", e);
        }
        setIsEditOpen(false);
        alert("Segment başarıyla kaydedildi!");
    };

    // Filtre Ekleme
    const addRule = () => {
        if (!editSegment) return;
        const newRule = { id: Date.now(), field: "Kategoriler", operator: "İçinde", value: "" };
        setEditSegment({ ...editSegment, rules: [...editSegment.rules, newRule] });
    };

    // Filtre Silme
    const removeRule = (ruleId: number) => {
        if (!editSegment) return;
        setEditSegment({ ...editSegment, rules: editSegment.rules.filter(r => r.id !== ruleId) });
    };

    // Filtre Değeri Güncelleme
    const updateRule = (ruleId: number, key: keyof FilterRule, value: string) => {
        if (!editSegment) return;
        setEditSegment({
            ...editSegment,
            rules: editSegment.rules.map(r => r.id === ruleId ? { ...r, [key]: value } : r)
        });
    };

    // --- SEGMENT FİLTRELEME ---
    const getFieldValue = (c: any, field: string): string => {
        switch (field) {
            case "Kategoriler":
                return c.category || "";
            case "Durumlar":
                // Status obje veya string olabilir
                if (typeof c.status === "object" && c.status !== null) {
                    return c.status.status || "";
                }
                return c.status || "";
            case "Hizmetler":
                return c.service || "";
            case "Danışman":
                return c.advisor || "";
            case "Kaynak":
                return c.category || "";
            default:
                return "";
        }
    };

    const matchesRule = (c: any, rule: FilterRule): boolean => {
        const raw = getFieldValue(c, rule.field) || "";
        const value = rule.value || "";
        // raw ve value string olmayabilir, güvenli dönüşüm yap
        const vLower = String(value).toLowerCase();
        const rLower = String(raw).toLowerCase();

        switch (rule.operator) {
            case "İçinde":
                return vLower ? rLower.includes(vLower) : false;
            case "Eşittir":
                return rLower === vLower;
            case "Eşit Değildir":
                return rLower !== vLower;
            case "Boş":
                return !raw;
            case "Dolu":
                return !!raw;
            default:
                return true;
        }
    };

    const filterCustomersForSegment = (seg: Segment, allCustomers: any[]): any[] => {
        if (!seg.rules || seg.rules.length === 0) return allCustomers;
        const connector = seg.connector || "VE";
        return allCustomers.filter((c) => {
            const results = seg.rules.map((r) => matchesRule(c, r));
            return connector === "VE" ? results.every(Boolean) : results.some(Boolean);
        });
    };

    // --- KAMPANYA FONKSİYONLARI ---
    const startCampaign = async () => {
        if (!activeCampaign) return;
        if (!campaignMessage) return;

        const targets = activeTargets;
        if (!targets.length) {
            alert("Bu segmente uyan müşteri bulunamadı.");
            return;
        }

        // Kampanya kaydını oluştur
        let campaignId: string | undefined;
        try {
            const res = await fetch("/api/campaigns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "whatsapp",
                    segmentId: activeCampaign.id,
                    segmentTitle: activeCampaign.title,
                    totalTargets: targets.length,
                    sent: 0,
                    status: "running",
                }),
            });
            if (res.ok) {
                const data = await res.json();
                campaignId = data.id;
            }
        } catch (e) {
            console.error("Kampanya kaydı oluşturulamadı", e);
        }

        setIsRunning(true);
        setProgress(0);

        const delayMs = Math.max(5, campaignIntervalSec) * 1000;
        let sentCount = 0;

        for (let i = 0; i < targets.length; i++) {
            const t = targets[i];
            const phone = t.phone || t.personal?.phone;
            await sendWahaMessage(campaignSession, phone, campaignMessage);
            sentCount += 1;
            setProgress(((i + 1) / targets.length) * 100);

            if (campaignId) {
                try {
                    await fetch("/api/campaigns", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: campaignId, sent: sentCount }),
                    });
                } catch (e) {
                    console.error("Kampanya güncelleme hatası", e);
                }
            }

            if (i < targets.length - 1) {
                await new Promise((r) => setTimeout(r, delayMs));
            }
        }

        if (campaignId) {
            try {
                await fetch("/api/campaigns", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: campaignId, status: "completed" }),
                });
            } catch (e) {
                console.error("Kampanya tamamlama hatası", e);
            }
        }

        setIsRunning(false);
        setActiveCampaign(null);
        setActiveTargets([]);
        alert("Kampanya tamamlandı!");
    };

    return (
        <Box>
            <Typography variant="h5" fontWeight="bold" mb={3} color="#111827">Pazarlama Segmentleri</Typography>

            <Paper sx={{ p: 2, mb: 2, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{ textTransform: 'none' }}
                    onClick={() => {
                        const now = Date.now();
                        setEditSegment({
                            id: now,
                            title: "",
                            count: 0,
                            status: "Hazır",
                            language: "",
                            connector: "VE",
                            rules: [],
                        });
                        setIsEditOpen(true);
                    }}
                >
                    Yeni Segment
                </Button>
                <TextField
                    size="small"
                    placeholder="Search..."
                    sx={{ width: 260, bgcolor: '#F9FAFB', borderRadius: 1 }}
                />
            </Paper>

            <Paper sx={{ borderRadius: 2, boxShadow: 1 }}>
                <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #E5E7EB' }}>
                    <Typography variant="subtitle1" fontWeight="bold">Segmentler</Typography>
                </Box>

                <Box sx={{ width: '100%', overflowX: 'auto' }}>
                    <Box sx={{ minWidth: 900 }}>
                        <Stack direction="row" sx={{ px: 2, py: 1, bgcolor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', fontSize: '0.8rem', fontWeight: 600, color: '#6B7280' }}>
                            <Box sx={{ width: 80 }}>ID</Box>
                            <Box sx={{ flex: 1 }}>Başlık</Box>
                            <Box sx={{ width: 140 }}>Müşteri Sayısı</Box>
                            <Box sx={{ width: 220 }}>Toplu İletişim</Box>
                            <Box sx={{ width: 160 }}>İşlemler</Box>
                        </Stack>

                        {segments.map((seg) => {
                            const targets = filterCustomersForSegment(seg, customers);
                            const count = targets.length;
                            return (
                                <Stack
                                    key={seg.id}
                                    direction="row"
                                    alignItems="center"
                                    sx={{ px: 2, py: 1.25, borderBottom: '1px solid #F3F4F6', '&:hover': { bgcolor: '#F9FAFB' } }}
                                >
                                    <Box sx={{ width: 80, fontSize: '0.8rem', color: '#6B7280' }}>{seg.id}</Box>
                                    <Box sx={{ flex: 1, fontSize: '0.9rem', fontWeight: 500 }}>{seg.title}</Box>
                                    <Box sx={{ width: 140, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <PeopleIcon sx={{ fontSize: 16, color: '#6B7280' }} />
                                        <Typography variant="body2" fontWeight="bold">
                                            {loadingCustomers ? 'Yükleniyor...' : count}
                                        </Typography>
                                    </Box>

                                    {/* Toplu İletişim Butonları */}
                                    <Box sx={{ width: 220, display: 'flex', gap: 1 }}>
                                        <IconButton
                                            size="small"
                                            sx={{ bgcolor: '#22C55E', color: 'white', '&:hover': { bgcolor: '#16A34A' } }}
                                            onClick={() => { setActiveCampaign(seg); setActiveTargets(targets); }}
                                            disabled={seg.status === 'Tamamlandı' || loadingCustomers}
                                        >
                                            <WhatsAppIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            sx={{ bgcolor: '#0EA5E9', color: 'white', '&:hover': { bgcolor: '#0284C7' } }}
                                            onClick={() => { setEmailSegment(seg); setEmailTargets(targets); }}
                                            disabled={loadingCustomers}
                                        >
                                            <EmailIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            sx={{ bgcolor: '#F97316', color: 'white', '&:hover': { bgcolor: '#EA580C' } }}
                                        >
                                            <VisibilityIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </Box>

                                    {/* İşlemler */}
                                    <Box sx={{ width: 160, display: 'flex', gap: 1 }}>
                                        <IconButton
                                            size="small"
                                            sx={{ bgcolor: '#22C55E', color: 'white', '&:hover': { bgcolor: '#16A34A' } }}
                                            onClick={() => handleEditClick(seg)}
                                        >
                                            <EditIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            sx={{ bgcolor: '#EF4444', color: 'white', '&:hover': { bgcolor: '#DC2626' } }}
                                            onClick={async () => {
                                                if (!confirm("Bu segmenti silmek istediğinize emin misiniz?")) return;
                                                try {
                                                    await fetch(`/api/segments?id=${seg.id}`, { method: "DELETE" });
                                                    setSegments(prev => prev.filter(s => s.id !== seg.id));
                                                } catch (e) {
                                                    console.error("Segment silme hatası", e);
                                                }
                                            }}
                                        >
                                            <DeleteIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </Box>
                                </Stack>
                            );
                        })}
                    </Box>
                </Box>
            </Paper>

            {/* --- SEGMENT DÜZENLEME MODALI --- */}
            <Dialog open={isEditOpen} onClose={() => setIsEditOpen(false)} fullWidth maxWidth="lg">
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                    <Typography variant="h6" fontWeight="bold">Segment Düzenle</Typography>
                    <IconButton onClick={() => setIsEditOpen(false)}><CloseIcon /></IconButton>
                </DialogTitle>
                
                <DialogContent sx={{ bgcolor: '#f8f9fa', p: 3 }}>
                    {editSegment && (
                        <Stack spacing={3}>
                            {/* KISIM 1: GENEL BİLGİLER */}
                            <Paper sx={{ p: 3, borderRadius: 2 }}>
                                <Typography variant="subtitle1" fontWeight="bold" mb={2}>Segment Bilgileri</Typography>
                                <Grid container spacing={2}>
                                    <Grid xs={12}>
                                        <TextField 
                                            label="Başlık" fullWidth size="small" 
                                            value={editSegment.title} 
                                            onChange={(e) => setEditSegment({...editSegment, title: e.target.value})}
                                        />
                                    </Grid>
                                    <Grid xs={12} md={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Dil</InputLabel>
                                            <Select 
                                                value={editSegment.language || ''} 
                                                label="Dil"
                                                onChange={(e) => setEditSegment({...editSegment, language: e.target.value})}
                                            >
                                                {LANG_OPTIONS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid xs={12} md={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Koşul Bağlacı</InputLabel>
                                            <Select 
                                                value={editSegment.connector || 'VE'} 
                                                label="Koşul Bağlacı"
                                                onChange={(e) => setEditSegment({...editSegment, connector: e.target.value})}
                                            >
                                                <MenuItem value="VE">VE (Tüm koşullar sağlanmalı)</MenuItem>
                                                <MenuItem value="VEYA">VEYA (Herhangi biri yeterli)</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            </Paper>

                            {/* KISIM 2: FİLTRE KOŞULLARI (DİNAMİK) */}
                            <Paper sx={{ p: 3, borderRadius: 2 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="subtitle1" fontWeight="bold">Filtre Koşulları</Typography>
                                    <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={addRule}>
                                        Koşul Ekle
                                    </Button>
                                </Stack>

                                {editSegment.rules.length === 0 ? (
                                    <Typography color="text.secondary" align="center" py={2}>Henüz filtre eklenmemiş.</Typography>
                                ) : (
                                    <Stack spacing={2}>
                                        {editSegment.rules.map((rule, index) => (
                                            <Box key={rule.id}>
                                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                                                    <FormControl fullWidth size="small">
                                                        <Select 
                                                            value={rule.field} 
                                                            onChange={(e) => updateRule(rule.id, 'field', e.target.value)}
                                                        >
                                                            {FIELD_OPTIONS.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                                                        </Select>
                                                    </FormControl>

                                                    <FormControl fullWidth size="small">
                                                        <Select 
                                                            value={rule.operator} 
                                                            onChange={(e) => updateRule(rule.id, 'operator', e.target.value)}
                                                        >
                                                            {OPERATOR_OPTIONS.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                                                        </Select>
                                                    </FormControl>

                                                    <TextField 
                                                        fullWidth size="small" placeholder="Değer girin..." 
                                                        value={rule.value} 
                                                        onChange={(e) => updateRule(rule.id, 'value', e.target.value)}
                                                    />

                                                    <Button 
                                                        startIcon={<DeleteIcon />} 
                                                        color="error" 
                                                        sx={{ minWidth: 'auto', px: 2 }}
                                                        onClick={() => removeRule(rule.id)}
                                                    >
                                                        Sil
                                                    </Button>
                                                </Stack>
                                                
                                                {/* "VE" bağlacı görseli */}
                                                {index < editSegment.rules.length - 1 && (
                                                    <Divider sx={{ my: 2 }}>
                                                        <Chip label={editSegment.connector} size="small" />
                                                    </Divider>
                                                )}
                                            </Box>
                                        ))}
                                    </Stack>
                                )}
                            </Paper>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ bgcolor: '#f8f9fa', p: 2, borderTop: '1px solid #eee' }}>
                    <Button onClick={() => setIsEditOpen(false)} color="inherit">İptal</Button>
                    <Button onClick={handleSaveSegment} variant="contained" startIcon={<SaveIcon />}>
                        Kaydet
                    </Button>
                </DialogActions>
            </Dialog>

            {/* KAMPANYA BAŞLATMA MODALI */}
            <Dialog open={!!activeCampaign} onClose={() => !isRunning && setActiveCampaign(null)} fullWidth>
                <DialogTitle>Kampanya Başlat: {activeCampaign?.title}</DialogTitle>
                <DialogContent>
                    {!isRunning ? (
                        <>
                            <Typography gutterBottom>
                                Bu segmentteki <b>{activeTargets.length}</b> kişiye mesaj gönderilecektir.
                            </Typography>
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={2}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>WhatsApp Oturumu</InputLabel>
                                    <Select
                                        label="WhatsApp Oturumu"
                                        value={campaignSession}
                                        onChange={(e) => setCampaignSession(e.target.value)}
                                    >
                                        {availableSessions.map((s) => (
                                            <MenuItem key={s} value={s}>{s}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <TextField
                                    label="Mesaj Gönderme Aralığı (saniye)"
                                    type="number"
                                    size="small"
                                    value={campaignIntervalSec}
                                    onChange={(e) => setCampaignIntervalSec(Number(e.target.value) || 0)}
                                />
                            </Stack>
                            <TextField
                                label="Kampanya Mesajı" multiline rows={4} fullWidth margin="dense"
                                value={campaignMessage} onChange={(e) => setCampaignMessage(e.target.value)}
                            />
                        </>
                    ) : (
                        <Box py={3} textAlign="center">
                            <Typography variant="h6" gutterBottom>Kampanya Yürütülüyor...</Typography>
                            <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 5, mb: 2 }} />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    {!isRunning && (
                        <>
                            <Button onClick={() => setActiveCampaign(null)}>İptal</Button>
                            <Button onClick={startCampaign} variant="contained" color="success" startIcon={<PlayArrowIcon />} disabled={!campaignMessage || !activeTargets.length}>Başlat</Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>

            {/* E-POSTA KAMPANYA MODALI */}
            <Dialog open={!!emailSegment} onClose={() => setEmailSegment(null)} fullWidth maxWidth="md">
                <DialogTitle>E-posta Kampanyası Oluştur</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                        Seçili Segment: {emailSegment?.title}
                    </Typography>

                    <Stack spacing={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>E-posta Şablonu</InputLabel>
                            <Select
                                label="E-posta Şablonu"
                                value={emailTemplate}
                                onChange={(e) => setEmailTemplate(e.target.value)}
                            >
                                <MenuItem value="">Bir şablon seçin</MenuItem>
                                <MenuItem value="welcome">Hoş geldiniz</MenuItem>
                                <MenuItem value="offer">Teklif / Kampanya</MenuItem>
                                <MenuItem value="reminder">Hatırlatma</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            label="Mesaj Gönderme Aralığı (saniye)"
                            type="number"
                            size="small"
                            value={emailIntervalSec}
                            onChange={(e) => setEmailIntervalSec(Number(e.target.value) || 0)}
                        />

                        <Paper sx={{ p: 3, bgcolor: '#F9FAFB', borderRadius: 2, textAlign: 'center', color: '#6B7280', fontSize: '0.9rem' }}>
                            Önizleme için bir şablon seçin
                        </Paper>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEmailSegment(null)}>İptal</Button>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<EmailIcon />}
                        disabled={!emailTemplate || !emailTargets.length}
                        onClick={async () => {
                            try {
                                await fetch("/api/email-campaign", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        segmentId: emailSegment?.id,
                                        template: emailTemplate,
                                        intervalSec: emailIntervalSec,
                                        targets: emailTargets.map(t => ({ id: t.id, email: t.email, name: t.name })),
                                    }),
                                });
                                alert("E-posta kampanyası tetiklendi (log'a yazıldı).");
                            } catch (e) {
                                console.error("E-posta kampanya hatası", e);
                            } finally {
                                setEmailSegment(null);
                            }
                        }}
                    >
                        E-postaları Gönder
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}