"use client";

import { ReactNode, useContext } from "react";
import { Box } from "@mui/material";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { AuthProvider } from "./AuthProvider";
import { ThemeModeContext } from "./ThemeRegistry";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { mode } = useContext(ThemeModeContext);
  const isLogin = pathname === "/login";

  if (isLogin) {
    return (
      <AuthProvider>
        <Box component="main" sx={{ flexGrow: 1, minHeight: "100vh", backgroundColor: mode === "dark" ? "#1E1B3E" : "#f4f6f8" }}>
          {children}
        </Box>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <Sidebar />
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, backgroundColor: mode === "dark" ? "#1E1B3E" : "#f4f6f8", minHeight: "100vh" }}
      >
        <TopBar />
        {children}
      </Box>
    </AuthProvider>
  );
}
