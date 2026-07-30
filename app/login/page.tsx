"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { AppUser, useAuth } from "../components/AuthProvider";
import * as THREE from "three";

type UserWithPassword = AppUser & { password?: string };

function ParticleBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Particles
    const particleCount = 1800;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities: { vx: number; vy: number; vz: number }[] = [];

    const colorPalette = [
      new THREE.Color("#7C3AED"),
      new THREE.Color("#9F67FF"),
      new THREE.Color("#5346b3"),
      new THREE.Color("#a78bfa"),
      new THREE.Color("#c4b5fd"),
    ];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

      const c = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      velocities.push({
        vx: (Math.random() - 0.5) * 0.003,
        vy: (Math.random() - 0.5) * 0.003,
        vz: (Math.random() - 0.5) * 0.001,
      });
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.3;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.3;
    };
    window.addEventListener("mousemove", onMouseMove);

    // Resize
    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // Animation loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      const pos = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        pos[i * 3] += velocities[i].vx;
        pos[i * 3 + 1] += velocities[i].vy;
        pos[i * 3 + 2] += velocities[i].vz;

        // Wrap around bounds
        if (pos[i * 3] > 10) pos[i * 3] = -10;
        if (pos[i * 3] < -10) pos[i * 3] = 10;
        if (pos[i * 3 + 1] > 10) pos[i * 3 + 1] = -10;
        if (pos[i * 3 + 1] < -10) pos[i * 3 + 1] = 10;
      }
      geometry.attributes.position.needsUpdate = true;

      // Subtle camera drift following mouse
      camera.position.x += (mouseX - camera.position.x) * 0.02;
      camera.position.y += (-mouseY - camera.position.y) * 0.02;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <Box
      ref={mountRef}
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
      }}
    />
  );
}

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2.5,
    bgcolor: "#F7F7FB",
    "& fieldset": { borderColor: "transparent" },
    "&:hover fieldset": { borderColor: "#D8D4F0" },
    "&.Mui-focused fieldset": { borderColor: "#7C3AED", borderWidth: 1.5 },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "#7C3AED" },
};

export default function LoginPage() {
  const [users, setUsers] = useState<UserWithPassword[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", bgcolor: "#1E1B3E" }}>
        <CircularProgress sx={{ color: "#7C3AED" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        bgcolor: "#fff",
      }}
    >
      {/* Sol Panel - Marka / Görsel */}
      <Box
        sx={{
          position: "relative",
          flex: 1,
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "center",
          px: 8,
          overflow: "hidden",
          background: "linear-gradient(135deg, #6D5BF6 0%, #7C3AED 45%, #9F67FF 100%)",
        }}
      >
        <ParticleBackground />

        <Box sx={{ position: "relative", zIndex: 1, maxWidth: 520 }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1.2,
              mb: 6,
              bgcolor: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 3,
              px: 1.5,
              py: 0.8,
              backdropFilter: "blur(6px)",
            }}
          >
            <Box component="img" src="/icon.svg" alt="Bytno" sx={{ height: 26, width: 26, borderRadius: 1 }} />
            <Typography sx={{ color: "#fff", fontWeight: 700, letterSpacing: 0.5 }}>Bytno CRM</Typography>
          </Box>

          <Typography variant="h3" sx={{ color: "#fff", fontWeight: 800, lineHeight: 1.2, mb: 2 }}>
            Müşteri İlişkileri
            <br />
            Yönetiminde{" "}
            <Box component="span" sx={{ color: "#E4D9FF" }}>
              Yeni Nesil
            </Box>{" "}
            Yaklaşım
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.8)", fontSize: "1.05rem", maxWidth: 420 }}>
            Lead yönetimi, randevu takibi ve raporlama — hepsi tek panelde, tek tıkla erişiminizde.
          </Typography>
        </Box>

        <Box
          sx={{
            position: "absolute",
            bottom: -120,
            right: -120,
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: -80,
            left: -80,
            width: 260,
            height: 260,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
          }}
        />
      </Box>

      {/* Sağ Panel - Giriş Formu */}
      <Box
        sx={{
          width: { xs: "100%", md: 460 },
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#fff",
          px: 4,
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 340 }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2.5,
                background: "linear-gradient(135deg, #7C3AED 0%, #5346b3 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
                boxShadow: "0 8px 24px rgba(124, 58, 237, 0.35)",
              }}
            >
              <Box component="img" src="/icon.svg" alt="Bytno" sx={{ height: 32, width: 32 }} />
            </Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: "#1E1B3E" }}>
              Hoş Geldiniz
            </Typography>
            <Typography variant="body2" sx={{ color: "#8A8AA3", mt: 0.5, textAlign: "center" }}>
              Bytno CRM&apos;e erişmek için giriş yapın
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="E-posta"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={fieldSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon sx={{ color: "#A6A6C1", fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Şifre"
              type={showPassword ? "text" : "password"}
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={fieldSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: "#A6A6C1", fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((s) => !s)} edge="end" size="small">
                      {showPassword ? (
                        <VisibilityOffIcon sx={{ fontSize: 19, color: "#A6A6C1" }} />
                      ) : (
                        <VisibilityIcon sx={{ fontSize: 19, color: "#A6A6C1" }} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {error && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              endIcon={!loading ? <ArrowForwardIcon /> : undefined}
              sx={{
                mt: 3,
                py: 1.4,
                borderRadius: 2.5,
                textTransform: "none",
                fontSize: "1rem",
                background: "linear-gradient(135deg, #7C3AED 0%, #5346b3 100%)",
                fontWeight: 700,
                boxShadow: "0 8px 20px rgba(124, 58, 237, 0.3)",
                "&:hover": {
                  background: "linear-gradient(135deg, #9F67FF 0%, #7C3AED 100%)",
                  boxShadow: "0 8px 24px rgba(124, 58, 237, 0.45)",
                },
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : "Giriş Yap"}
            </Button>
          </Box>

          <Typography sx={{ textAlign: "center", color: "#B7B7CC", fontSize: "0.75rem", mt: 5 }}>
            © {new Date().getFullYear()} Bytno CRM · Tüm hakları saklıdır
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
