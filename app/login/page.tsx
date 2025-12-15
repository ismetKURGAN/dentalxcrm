"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Paper, Typography, Button, TextField, CircularProgress } from "@mui/material";
import { AppUser, useAuth } from "../components/AuthProvider";

type UserWithPassword = AppUser & { password?: string };

export default function LoginPage() {
  const [users, setUsers] = useState<UserWithPassword[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        setUsers(data || []);
      } catch (e) {
        setUsers([]);
      } finally {
        setInitialLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmedEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email?.toLowerCase() === trimmedEmail);
    if (!user || !user.password || user.password !== password) {
      setError("Kullanıcı adı veya şifre hatalı");
      return;
    }
    setLoading(true);
    login(user);
    router.push("/");
  };

  if (initialLoading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", backgroundColor: "#f4f6f8" }}>
      <Paper sx={{ p: 4, minWidth: 360 }}>
        <Typography variant="h6" sx={{ mb: 3, textAlign: "center" }}>
          Giriş Yap
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="E-posta"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Şifre"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3 }}
            disabled={loading}
          >
            Giriş Yap
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
