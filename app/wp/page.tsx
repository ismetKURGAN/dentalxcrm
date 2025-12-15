"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Badge,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import InsertPhotoIcon from "@mui/icons-material/InsertPhoto";
import SendIcon from "@mui/icons-material/Send";
import CheckIcon from "@mui/icons-material/Check";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { useAuth } from "../components/AuthProvider";



function StatusTicks({ status }: { status: "sent" | "delivered" | "seen" }) {
  const color =
    status === "seen" ? "#4f46e5" : status === "delivered" ? "#9ca3af" : "#9ca3af";

  if (status === "sent") {
    return <CheckIcon sx={{ fontSize: 16, color }} />;
  }
  return <DoneAllIcon sx={{ fontSize: 16, color }} />;
}

export default function WpPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("SuperAdmin");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [selectedChat, setSelectedChat] = useState(MOCK_CHATS[0]);
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Yetkisiz Erişim
        </Typography>
        <Typography variant="body2" color="text.secondary">
          WhatsApp oturumlarına sadece Admin ve SuperAdmin kullanıcılar erişebilir.
        </Typography>
      </Box>
    );
  }

  const filteredChats = MOCK_CHATS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.id.toString().includes(search)
  );

  // Seçili sohbet değiştiğinde backend'den mesajları yükle
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const params = new URLSearchParams({
          instance_name: "dep-te",
          remote_jid: selectedChat.id,
        });
        const res = await fetch(`/api/wp/messages?${params.toString()}`);
        if (!res.ok) return; // Hata durumunda mock veriler kalır

        const data = await res.json();
        if (!Array.isArray(data)) return;

        const mapped = data.map((m: any) => {
          const created = m.created_at ? new Date(m.created_at) : new Date();
          const time = created.toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
          });
          const fromMe = !!m.from_me;
          const status: "sent" | "delivered" | "seen" = fromMe ? "seen" : "delivered";
          return {
            id: m.id ?? Date.now(),
            fromMe,
            text: m.message_body ?? "",
            time,
            status,
          };
        });

        setMessages(mapped);
      } catch (e) {
        console.error("Mesajlar yüklenemedi", e);
      }
    };

    loadMessages();
  }, [selectedChat.id]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;

    const newMessage = {
      id: Date.now(),
      fromMe: true as const,
      text,
      time: new Date().toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "sent" as const,
    };

    setMessages((prev) => [...prev, newMessage]);
    setDraft("");

    // Backend'e gönderim – şimdilik hata yakalayıp konsola logluyoruz
    try {
      await fetch("/api/wp/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instance_name: "dep-te",
          remote_jid: selectedChat.id,
          message_body: text,
        }),
      });
    } catch (e) {
      console.error("Mesaj gönderilemedi", e);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100vh",
        display: "flex",
        bgcolor: "#0a1014",
      }}
    >
      {/* Ortadaki ana kart – WhatsApp Web'e benzer */}
      <Box
        sx={{
          flexGrow: 1,
          m: { xs: 0, md: 2 },
          borderRadius: { xs: 0, md: 3 },
          overflow: "hidden",
          display: "flex",
          boxShadow: { xs: "none", md: "0 6px 20px rgba(0,0,0,0.35)" },
          bgcolor: "#111b21",
        }}
      >
        {/* SOL: Sohbet listesi */}
        <Box
          sx={{
            width: { xs: isMobile ? 0 : 360, md: 360 },
            borderRight: "1px solid #202c33",
            display: { xs: isMobile ? (selectedChat ? "none" : "flex") : "flex" },
            flexDirection: "column",
            bgcolor: "#111b21",
          }}
        >
          {/* Üst bar */}
          <Box
            sx={{
              height: 64,
              px: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: "#202c33",
            }}
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: "#22c55e" }}>X</Avatar>
              <Typography variant="subtitle2" color="#e5e7eb" fontWeight={600}>
                Xirtiz WP
              </Typography>
            </Box>
            <Box>
              <IconButton size="small" sx={{ color: "#aebac1" }}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Arama kutusu */}
          <Box sx={{ p: 1.5, bgcolor: "#111b21" }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Sohbetlerde ara"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: "#667781" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                bgcolor: "#202c33",
                borderRadius: 999,
                "& .MuiInputBase-input": { color: "#e9edef", fontSize: 14 },
              }}
            />
          </Box>

          <Divider sx={{ borderColor: "#202c33" }} />

          {/* Sohbet listesi */}
          <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
            <List disablePadding>
              {filteredChats.map((chat) => {
                const isActive = chat.id === selectedChat.id;
                return (
                  <ListItem
                    key={chat.id}
                    button
                    onClick={() => setSelectedChat(chat)}
                    sx={{
                      px: 2,
                      py: 1.5,
                      bgcolor: isActive ? "#202c33" : "#111b21",
                      "&:hover": { bgcolor: "#202c33" },
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        color="success"
                        overlap="circular"
                        variant={chat.unread > 0 ? "dot" : "standard"}
                        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                      >
                        <Avatar sx={{ bgcolor: chat.avatarColor }}>
                          {chat.name.charAt(0).toUpperCase()}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography
                            variant="subtitle2"
                            sx={{ color: "#e9edef", fontWeight: chat.unread ? 700 : 500 }}
                            noWrap
                          >
                            {chat.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "#8696a0", ml: 1, flexShrink: 0 }}
                          >
                            {chat.lastTime}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography
                            variant="body2"
                            sx={{ color: "#8696a0", fontSize: 13 }}
                            noWrap
                          >
                            {chat.lastMessage}
                          </Typography>
                          {chat.unread > 0 && (
                            <Box
                              sx={{
                                minWidth: 20,
                                height: 20,
                                borderRadius: 10,
                                bgcolor: "#25d366",
                                color: "#111b21",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                                ml: 1.5,
                              }}
                            >
                              {chat.unread}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          </Box>
        </Box>

        {/* SAĞ: Aktif sohbet */}
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            bgcolor: "#0b141a",
          }}
        >
          {/* Üst bar */}
          <Box
            sx={{
              height: 64,
              px: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: "#202c33",
              borderLeft: "1px solid #202c33",
            }}
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              {isMobile && (
                <IconButton
                  onClick={() => {}}
                  sx={{ color: "#e9edef", mr: 1, display: { md: "none" } }}
                >
                  {/* Burada ileride geri ikon eklenebilir */}
                </IconButton>
              )}
              <Avatar sx={{ bgcolor: selectedChat.avatarColor }}>
                {selectedChat.name.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" sx={{ color: "#e9edef", fontWeight: 600 }}>
                  {selectedChat.name}
                </Typography>
                <Typography variant="caption" sx={{ color: "#8696a0" }}>
                  çevrimiçi
                </Typography>
              </Box>
            </Box>
            <Box>
              <IconButton size="small" sx={{ color: "#aebac1" }}>
                <SearchIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" sx={{ color: "#aebac1" }}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Mesajlar */}
          <Box
            sx={{
              flexGrow: 1,
              p: 2.5,
              display: "flex",
              flexDirection: "column",
              gap: 1,
              overflowY: "auto",
              backgroundImage:
                "url('https://static.whatsapp.net/rsrc.php/v3/yP/r/rYZqPCBaG70.png')",
              backgroundRepeat: "repeat",
              backgroundSize: "contain",
            }}
          >
            {messages.map((m) => {
              const isMe = m.fromMe;
              return (
                <Box
                  key={m.id}
                  sx={{
                    display: "flex",
                    justifyContent: isMe ? "flex-end" : "flex-start",
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: "75%",
                      bgcolor: isMe ? "#005c4b" : "#202c33",
                      color: "#e9edef",
                      px: 1.5,
                      py: 1,
                      borderRadius: 2,
                      boxShadow: "0 1px 0.5px rgba(0,0,0,0.3)",
                      borderTopRightRadius: isMe ? 2 : 0.75,
                      borderTopLeftRadius: isMe ? 0.75 : 2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 14 }}
                    >
                      {m.text}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: 0.5,
                        mt: 0.25,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ color: "#8696a0", fontSize: 11 }}
                      >
                        {m.time}
                      </Typography>
                      {isMe && <StatusTicks status={m.status} />}
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* Mesaj giriş alanı */}
          <Box
            sx={{
              height: 72,
              px: 2,
              py: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              bgcolor: "#202c33",
            }}
          >
            <Tooltip title="Dosya ekle">
              <IconButton sx={{ color: "#aebac1" }}>
                <AttachFileIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Resim gönder">
              <IconButton sx={{ color: "#aebac1" }}>
                <InsertPhotoIcon />
              </IconButton>
            </Tooltip>

            <TextField
              fullWidth
              size="small"
              placeholder="Bir mesaj yazın"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              multiline
              maxRows={3}
              sx={{
                bgcolor: "#2a3942",
                borderRadius: 2,
                "& .MuiInputBase-input": {
                  color: "#e9edef",
                  fontSize: 14,
                  lineHeight: 1.4,
                },
              }}
            />

            <IconButton
              onClick={handleSend}
              sx={{ color: draft.trim() ? "#25d366" : "#aebac1" }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
