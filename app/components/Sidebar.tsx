"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation"; // URL kontrolü için
import Link from "next/link";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
// İkonlar
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import BarChartIcon from "@mui/icons-material/BarChart";
import DescriptionIcon from "@mui/icons-material/Description";
import FilterListIcon from "@mui/icons-material/FilterList";
import FlagIcon from "@mui/icons-material/Flag";
import GroupIcon from "@mui/icons-material/Group";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SettingsIcon from "@mui/icons-material/Settings";
import MenuIcon from "@mui/icons-material/Menu";
import HotelIcon from "@mui/icons-material/Hotel";
import { useAuth } from "./AuthProvider";
import { useI18n } from "./I18nProvider";

const drawerWidth = 260;

export default function Sidebar() {
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const { t } = useI18n();
  const [rolePermissions, setRolePermissions] = useState<any | null>(null);

  useEffect(() => {
    const loadPerms = async () => {
      if (!user?.roles || user.roles.length === 0) return;
      try {
        const res = await fetch("/api/roles", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const userRoles = user.roles;
        const perms: any = {};
        for (const rName of userRoles) {
          const roleDef = data.find((r: any) => r.name === rName);
          if (roleDef && roleDef.permissions) {
            Object.entries(roleDef.permissions).forEach(([key, value]) => {
              if (value) {
                perms[key] = true;
              }
            });
          }
        }
        setRolePermissions(perms);
      } catch (e) {
        // perms yoksa mevcut davranış devam etsin
      }
    };

    loadPerms();
  }, [user]);

  const hasPerm = (key: string, fallback: boolean) => {
    if (!rolePermissions) return fallback;
    if (key in rolePermissions) return !!rolePermissions[key];
    return fallback;
  };

  const allowedChatRoles = ["Admin", "Danışman", "Operasyon", "SuperAdmin", "Acenta"];
  const fallbackCanSeeChats = user?.roles?.some((r) => allowedChatRoles.includes(r)) ?? false;
  const canSeeChats = hasPerm("viewChats", fallbackCanSeeChats);
  const isAdmin = user?.roles?.includes("Admin") || user?.roles?.includes("SuperAdmin") || false;
  const isManager = user?.roles?.includes("Yönetici") || false;
  const isAdvisor = user?.roles?.includes("Danışman") || false;
  const isAgency = user?.roles?.includes("Acenta") || false;

  // --- MÜŞTERİ DETAY SAYFASINDA TAMAMEN GİZLE ---
  // Örn: /customers/123
  const isCustomerDetail =
    pathname.startsWith("/customers/") && pathname.split("/").length > 2;
  // -----------------------------------------------------

  const canViewAppointments = hasPerm("viewAppointments", !isAgency);

  const baseMenuItems = [
    { text: "ANA SAYFA", textKey: "sidebar.header.home", type: "header" },
    { text: "Kontrol Paneli", textKey: "sidebar.dashboard", icon: <DashboardIcon />, path: "/" },
    { text: "MÜŞTERİ İŞLEMLERİ", textKey: "sidebar.header.customers", type: "header" },
    { text: "Müşteriler", textKey: "sidebar.customers", icon: <PeopleIcon />, path: "/customers" },
    ...(
      canViewAppointments
        ? [{ text: "Randevular", textKey: "sidebar.appointments", icon: <CalendarMonthIcon />, path: "/appointments" }]
        : []
    ),
    { text: "WHATSAPP", textKey: "sidebar.header.whatsapp", type: "header" },
    ...(
      canSeeChats
        ? [{ text: "Sohbetler", textKey: "sidebar.chats", icon: <WhatsAppIcon color="success" />, path: "/whatsapp" }]
        : []
    ),
    ...(
      isAdmin
        ? [{ text: "Wazzup", textKey: "sidebar.wazzup", icon: <WhatsAppIcon color="primary" />, path: "/wazzup" }]
        : []
    ),
    { text: "RAPOR", textKey: "sidebar.header.reports", type: "header" },
    { text: "İstatistikler", textKey: "sidebar.stats", icon: <BarChartIcon />, path: "/stats" },
    { text: "Raporlar", textKey: "sidebar.reports", icon: <DescriptionIcon />, path: "/reports" },
    { text: "PAZARLAMA", textKey: "sidebar.header.marketing", type: "header" },
    { text: "Segmentler", textKey: "sidebar.segments", icon: <FilterListIcon />, path: "/segments" },
    { text: "Kampanya Durumları", textKey: "sidebar.campaignStatuses", icon: <FlagIcon />, path: "/campaign-status" },
    { text: "KULLANICI İŞLEMLERİ", textKey: "sidebar.header.users", type: "header" },
    ...(
      isAdmin
        ? [{ text: "Kullanıcılar", textKey: "sidebar.users", icon: <GroupIcon />, path: "/users" }]
        : []
    ),
    { text: "Mesai Takip", textKey: "sidebar.timesheets", icon: <AccessTimeIcon />, path: "/timesheets" },
    { text: "GENEL AYARLAR", textKey: "sidebar.header.settings", type: "header" },
    { text: "Ayarlar", textKey: "sidebar.settings", icon: <SettingsIcon />, path: "/settings" },
  ];

  // Danışmanlar ve Acenta için bazı sekmeleri tamamen gizle
  const menuItems = (() => {
    const items = [...baseMenuItems];

    // Admin / SuperAdmin / Yönetici rollerine hiçbir kısıtlama uygulama
    if (isAdmin || isManager) {
      return items;
    }

    // Acenta rolü: Sadece Dashboard, Müşteriler, Sohbetler ve Segmentler
    if (isAgency) {
      const allowedPaths = new Set(["/", "/customers", "/whatsapp", "/segments"]);
      const filtered = items.filter((item: any) => {
        if (!item.path) return true; // Header'ları geçici tut
        return allowedPaths.has(item.path);
      });
      
      // Boş header'ları temizle
      const result: any[] = [];
      for (let i = 0; i < filtered.length; i++) {
        const item = filtered[i] as any;
        if (item.type === "header") {
          const next = filtered[i + 1] as any | undefined;
          if (!next || next.type === "header") {
            continue;
          }
        }
        result.push(item);
      }
      return result;
    }

    // Danışmanlar için kısıtlamalar
    if (!isAdvisor) {
      return items;
    }

    const hiddenPaths = new Set([
      "/stats",
      "/reports",
      "/segments",
      "/campaign-status",
      "/users",
      "/timesheets",
      "/settings",
    ]);

    // İlk pass: path'e bağlı item'leri filtrele
    const filtered = items.filter((item: any) => {
      if (!item.path) return true;
      return !hiddenPaths.has(item.path);
    });

    // İkinci pass: altında hiç normal item kalmayan header'ları temizle
    const result: any[] = [];
    for (let i = 0; i < filtered.length; i++) {
      const item = filtered[i] as any;
      if (item.type === "header") {
        // Sonraki eleman bir header veya yoksa, bu header'ı atla
        const next = filtered[i + 1] as any | undefined;
        if (!next || next.type === "header") {
          continue;
        }
      }
      result.push(item);
    }

    return result;
  })();

  const drawerContent = (
    <>
      <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "center", height: 96 }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center" }}>
          <Box
            component="img"
            src="/xirtiz-logo.png"
            alt="Xirtiz CRM Logo"
            sx={{ height: 66, objectFit: "contain" }}
          />
        </Link>
      </Box>
      <Divider />
      <List sx={{ py: 1.5 }}>
        {menuItems.map((item, index) => {
          const label = (item as any).textKey ? t((item as any).textKey) : item.text;

          if (item.type === "header") {
            return (
              <Typography
                key={index}
                variant="caption"
                sx={{
                  display: "block",
                  color: "#999",
                  fontWeight: "bold",
                  mt: 2.5,
                  mb: 0.5,
                  px: 3,
                  fontSize: "0.68rem",
                  letterSpacing: 1,
                }}
              >
                {label}
              </Typography>
            );
          }
          return (
            <ListItem
              key={index}
              disablePadding
              sx={{
                position: "relative",
                "&:not(:last-of-type)::after": {
                  content: '""',
                  position: "absolute",
                  left: 24,
                  right: 24,
                  bottom: 0,
                  height: "1px",
                  background:
                    "linear-gradient(90deg, transparent, #e5e7eb, transparent)",
                },
              }}
            >
              <ListItemButton
                component={Link}
                href={item.path || "#"}
                sx={{ px: 3, py: 0.8 }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: "#666" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    color: "#444",
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </>
  );

  // Detay sayfasında sidebar'ı tamamen gizle
  if (isCustomerDetail) {
    return null;
  }

  return (
    <>
      {isMobile && (
        <IconButton
          onClick={() => setMobileOpen(true)}
          size="small"
          sx={{
            position: "fixed",
            top: 8,
            left: 8,
            zIndex: (theme) => theme.zIndex.drawer + 1,
            backgroundColor: "#ffffff",
            boxShadow: 1,
            "&:hover": { backgroundColor: "#f3f4f6" },
          }}
        >
          <MenuIcon fontSize="small" />
        </IconButton>
      )}

      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? mobileOpen : true}
        onClose={isMobile ? () => setMobileOpen(false) : undefined}
        ModalProps={isMobile ? { keepMounted: true } : undefined}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "#fff",
            borderRight: "1px solid #e0e0e0",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}