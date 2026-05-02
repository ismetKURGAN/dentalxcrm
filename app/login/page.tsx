"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Paper, Typography, Button, TextField, CircularProgress } from "@mui/material";
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
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", bgcolor: "#1E1B3E" }}>
        <CircularProgress sx={{ color: "#7C3AED" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        overflow: "hidden",
        background: "linear-gradient(135deg, #1E1B3E 0%, #2A2550 50%, #1a1535 100%)",
      }}
    >
      <ParticleBackground />

      <Paper
        sx={{
          position: "relative",
          zIndex: 1,
          p: 4,
          minWidth: 380,
          background: "rgba(37, 32, 71, 0.85)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(124, 58, 237, 0.25)",
          boxShadow: "0 8px 48px rgba(0,0,0,0.5)",
        }}
      >
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography variant="h5" fontWeight={700} sx={{ color: "#fff", letterSpacing: 0.5 }}>
            Hoş Geldiniz
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", mt: 0.5 }}>
            Devam etmek için giriş yapın
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
            fullWidth
            sx={{
              mt: 3,
              py: 1.4,
              background: "linear-gradient(135deg, #7C3AED 0%, #5346b3 100%)",
              fontWeight: 600,
              fontSize: "0.95rem",
              "&:hover": {
                background: "linear-gradient(135deg, #9F67FF 0%, #7C3AED 100%)",
                boxShadow: "0 4px 20px rgba(124, 58, 237, 0.5)",
              },
            }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : "Giriş Yap"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
