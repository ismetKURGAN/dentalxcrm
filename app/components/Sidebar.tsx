"use client";

import { useState, useEffect, useContext } from "react";
import { usePathname } from "next/navigation";
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
  Avatar,
  Stack,
  Badge,
  Tooltip,
  Chip,
} from "@mui/material";
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
import GridViewIcon from "@mui/icons-material/GridView";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LogoutIcon from "@mui/icons-material/Logout";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import { useAuth } from "./AuthProvider";
import { useI18n } from "./I18nProvider";
import { ThemeModeContext } from "./ThemeRegistry";

const drawerWidth = 220;

export default function Sidebar() {
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const { t } = useI18n();
  const { toggleTheme, mode } = useContext(ThemeModeContext);
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
    ...(
      (canSeeChats || isAdmin)
        ? [{ text: "WHATSAPP", textKey: "sidebar.header.whatsapp", type: "header" }]
        : []
    ),
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

  const isSelected = (path: string) => {
    return pathname === path || (path !== "/" && pathname.startsWith(path));
  };

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: mode === "dark" 
          ? "linear-gradient(180deg, #2A2550 0%, #1E1B3E 100%)" 
          : "#FFFFFF",
      }}
    >
      {/* Logo */}
      <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 1.5 }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center" }}>
          <Box
            component="img"
            src="/xirtiz-logo.png"
            alt="Xirtiz CRM Logo"
            sx={{ height: 36, objectFit: "contain", filter: mode === "dark" ? "brightness(1.2)" : "none" }}
          />
        </Link>
      </Box>



      {/* Menü */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 1.5, py: 2 }}>
        {menuItems.map((item, index) => {
          const label = (item as any).textKey ? t((item as any).textKey) : item.text;

          // Header'ları atla, sadece menü itemlarını göster
          if (item.type === "header") {
            return null;
          }

          const selected = isSelected(item.path || "#");

          return (
            <ListItemButton
              key={index}
              component={Link}
              href={item.path || "#"}
              sx={{
                px: 1.5,
                py: 0.8,
                mb: 0.3,
                mx: 1,
                borderRadius: 2,
                transition: "all 0.2s ease",
                background: selected
                  ? mode === "dark"
                    ? "linear-gradient(90deg, rgba(124, 58, 237, 0.2) 0%, rgba(124, 58, 237, 0.05) 100%)"
                    : "linear-gradient(135deg, rgba(108, 93, 211, 0.15) 0%, rgba(108, 93, 211, 0.08) 100%)"
                  : "transparent",
                "&:hover": {
                  background: mode === "dark"
                    ? "rgba(124, 58, 237, 0.1)"
                    : "rgba(108, 93, 211, 0.05)",
                  transform: "translateX(2px)",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 36,
                  color: selected
                    ? "#9F67FF"
                    : mode === "dark"
                    ? "rgba(255,255,255,0.7)"
                    : "rgba(0,0,0,0.5)",
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={label}
                primaryTypographyProps={{
                  fontSize: "0.8rem",
                  fontWeight: selected ? 600 : 500,
                  color: selected
                    ? mode === "dark"
                      ? "#FFFFFF"
                      : "#11142D"
                    : mode === "dark"
                    ? "rgba(255,255,255,0.85)"
                    : "rgba(0,0,0,0.7)",
                }}
              />
            </ListItemButton>
          );
        })}
      </Box>

      {/* Footer - Kullanıcı Bilgisi ve Tema Toggle */}
      <Box
        sx={{
          p: 2,
          mt: "auto",
        }}
      >
        {/* Tema Toggle */}
        <Box
          onClick={toggleTheme}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 1.5,
            py: 1,
            mb: 1.5,
            borderRadius: 1.5,
            background: mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
            cursor: "pointer",
            transition: "all 0.2s",
            "&:hover": {
              background: mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
            },
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  mode === "dark"
                    ? "linear-gradient(135deg, #7C3AED 0%, #9F67FF 100%)"
                    : "rgba(0,0,0,0.08)",
              }}
            >
              {mode === "dark" ? (
                <LightModeIcon sx={{ color: "#fff", fontSize: 14 }} />
              ) : (
                <DarkModeIcon sx={{ color: "#fff", fontSize: 14 }} />
              )}
            </Box>
            <Typography
              variant="caption"
              fontWeight={500}
              sx={{ color: mode === "dark" ? "rgba(255,255,255,0.9)" : "#374151", fontSize: "0.7rem" }}
            >
              {mode === "dark" ? "Açık Tema" : "Koyu Tema"}
            </Typography>
          </Stack>
          <Box
            sx={{
              width: 32,
              height: 16,
              borderRadius: 8,
              background:
                mode === "dark"
                  ? "linear-gradient(135deg, #7C3AED 0%, #9F67FF 100%)"
                  : "rgba(0,0,0,0.12)",
              position: "relative",
              transition: "all 0.2s",
            }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                bgcolor: "#fff",
                position: "absolute",
                top: 2,
                left: mode === "dark" ? 18 : 2,
                transition: "all 0.2s ease",
                boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
              }}
            />
          </Box>
        </Box>

        {/* Ayarlar ve Çıkış */}
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Ayarlar" arrow>
            <ListItemButton
              component={Link}
              href="/settings"
              sx={{
                flex: 1,
                px: 1.5,
                py: 0.8,
                borderRadius: 1.5,
                background: mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                justifyContent: "center",
                transition: "all 0.2s",
                "&:hover": {
                  background: mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                },
              }}
            >
              <SettingsIcon
                sx={{
                  color: mode === "dark" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)",
                  fontSize: 16,
                }}
              />
            </ListItemButton>
          </Tooltip>
          <Tooltip title="Çıkış Yap" arrow>
            <ListItemButton
              sx={{
                flex: 1,
                px: 1.5,
                py: 0.8,
                borderRadius: 1.5,
                background: "rgba(239, 68, 68, 0.08)",
                justifyContent: "center",
                transition: "all 0.2s",
                "&:hover": {
                  background: "rgba(239, 68, 68, 0.15)",
                },
              }}
            >
              <LogoutIcon sx={{ color: "#ef4444", fontSize: 16 }} />
            </ListItemButton>
          </Tooltip>
        </Stack>
      </Box>
    </Box>
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
            border: "none",
            background: "transparent",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}