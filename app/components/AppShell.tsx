"use client";

import { ReactNode } from "react";
import { Box } from "@mui/material";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { AuthProvider } from "./AuthProvider";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  if (isLogin) {
    return (
      <AuthProvider>
        <Box component="main" sx={{ flexGrow: 1, minHeight: "100vh", backgroundColor: "#f4f6f8" }}>
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
        sx={{ flexGrow: 1, p: 3, backgroundColor: "#f4f6f8", minHeight: "100vh" }}
      >
        <TopBar />
        {children}
      </Box>
    </AuthProvider>
  );
}
