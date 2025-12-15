"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

export type AppUser = {
  id?: number;
  name: string;
  email: string;
  roles: string[];
  languages?: string[];
  session?: string;
};

export type AuthContextValue = {
  user: AppUser | null;
  login: (user: AppUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "mooncrm_current_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as AppUser;
        setUser(parsed);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    const publicPaths = ["/login", "/public-form"]; // Giriş gerektirmeyen sayfalar
    if (!initializing && !user && !publicPaths.includes(pathname)) {
      router.push("/login");
    }
  }, [user, pathname, router, initializing]);

  const login = (u: AppUser) => {
    setUser(u);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    router.push("/login");
  };

  const publicPaths = ["/login", "/public-form"]; // Render için de kullan
  const isPublicPath = publicPaths.includes(pathname);

  // İlk yüklenirken hiçbir içerik göstermeyelim (flash engelleme)
  if (initializing) {
    return null;
  }

  // Kullanıcı yok ve korumalı sayfa ise, redirect olurken içerik göstermeyelim
  if (!user && !isPublicPath) {
    return (
      <AuthContext.Provider value={{ user, login, logout }}>
        {null}
      </AuthContext.Provider>
    );
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
