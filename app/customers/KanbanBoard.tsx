"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, Paper, Typography, Chip, Avatar, Stack, ToggleButtonGroup, ToggleButton, Tooltip, TextField, IconButton } from "@mui/material";
import PhoneIcon from "@mui/icons-material/Phone";
import CategoryIcon from "@mui/icons-material/Category";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import PersonIcon from "@mui/icons-material/Person";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ViewStreamIcon from "@mui/icons-material/ViewStream";
import ViewWeekIcon from "@mui/icons-material/ViewWeek";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

const COLUMN_ORDER_KEY = "crm_kanban_column_order";
const ROW_LAYOUT_KEY = "crm_kanban_row_layout";
const COLUMN_WIDTH = 290;

export const getKanbanStatusColor = (status: any, isDark = false) => {
  const statusStr = typeof status === "string" ? status : (status?.status || String(status || ""));
  if (statusStr?.includes("Olumlu") || statusStr?.includes("Randevu") || statusStr?.includes("Satış"))
    return { bg: isDark ? "rgba(22, 163, 74, 0.15)" : "#ECFDF3", color: isDark ? "#4ADE80" : "#16A34A", solid: "#22C55E" };
  if (statusStr?.includes("Teklif"))
    return { bg: isDark ? "rgba(239, 108, 0, 0.15)" : "#FFF3E0", color: isDark ? "#FB923C" : "#EF6C00", solid: "#F59E0B" };
  if (statusStr?.includes("Olumsuz") || statusStr?.includes("İptal") || statusStr?.includes("Spam"))
    return { bg: isDark ? "rgba(220, 38, 38, 0.15)" : "#FEF2F2", color: isDark ? "#F87171" : "#DC2626", solid: "#EF4444" };
  if (statusStr?.includes("Yeni"))
    return { bg: isDark ? "rgba(30, 136, 229, 0.15)" : "#E3F2FD", color: isDark ? "#60A5FA" : "#1E88E5", solid: "#3B82F6" };
  return { bg: isDark ? "rgba(255,255,255,0.05)" : "#F5F5F5", color: isDark ? "rgba(255,255,255,0.6)" : "#616161", solid: "#9CA3AF" };
};

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarColor(seed: string) {
  const palette = ["#7C3AED", "#2563EB", "#DB2777", "#059669", "#D97706", "#0891B2", "#DC2626", "#4F46E5"];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

interface CustomerCardProps {
  row: any;
  mode: "light" | "dark";
  onCardClick: (id: any) => void;
  dragOverlay?: boolean;
}

function CustomerCard({ row, mode, onCardClick, dragOverlay }: CustomerCardProps) {
  const isDark = mode === "dark";
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: `card-${row.id}`, data: { row } });

  const statusColors = getKanbanStatusColor(row.status, isDark);

  const style: React.CSSProperties = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    opacity: isDragging && !dragOverlay ? 0.35 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <Paper
      ref={dragOverlay ? undefined : setNodeRef}
      data-kanban-card="true"
      {...(dragOverlay ? {} : attributes)}
      {...(dragOverlay ? {} : listeners)}
      onClick={() => !isDragging && onCardClick(row.id)}
      elevation={dragOverlay ? 8 : 0}
      sx={{
        position: "relative",
        p: 1.5,
        pl: 1.75,
        borderRadius: 2.5,
        cursor: dragOverlay ? "grabbing" : "grab",
        bgcolor: isDark ? "#2A2450" : "#FFFFFF",
        border: isDark ? "1px solid rgba(124, 58, 237, 0.15)" : "1px solid #EEF0F3",
        borderLeft: `4px solid ${statusColors.solid}`,
        boxShadow: dragOverlay
          ? "0 12px 28px rgba(0,0,0,0.28)"
          : isDark
          ? "0 1px 2px rgba(0,0,0,0.2)"
          : "0 1px 2px rgba(16,24,40,0.06)",
        transition: dragOverlay ? "none" : "box-shadow 0.15s ease, transform 0.15s ease",
        "&:hover": dragOverlay
          ? {}
          : {
              boxShadow: isDark ? "0 4px 14px rgba(0,0,0,0.35)" : "0 6px 16px rgba(16,24,40,0.12)",
              transform: "translateY(-1px)",
            },
        ...style,
      }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
          <Avatar sx={{ width: 28, height: 28, fontSize: "0.7rem", fontWeight: 700, bgcolor: avatarColor(row.name || String(row.id)) }}>
            {getInitials(row.name)}
          </Avatar>
          <Typography
            noWrap
            sx={{ fontWeight: 600, fontSize: "0.85rem", color: isDark ? "#FFFFFF" : "#111827", maxWidth: 150 }}
          >
            {row.name || "İsimsiz"}
          </Typography>
        </Stack>
        <DragIndicatorIcon sx={{ fontSize: 16, color: isDark ? "rgba(255,255,255,0.25)" : "#D1D5DB", flexShrink: 0 }} />
      </Stack>

      {row.phone && (
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.75 }}>
          <PhoneIcon sx={{ fontSize: 13, color: isDark ? "rgba(255,255,255,0.45)" : "#9CA3AF" }} />
          <Typography noWrap sx={{ fontSize: "0.72rem", color: isDark ? "rgba(255,255,255,0.6)" : "#6B7280" }}>
            {row.phone}
          </Typography>
        </Stack>
      )}

      {row.category && (
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.5 }}>
          <CategoryIcon sx={{ fontSize: 13, color: isDark ? "#A5B4FC" : "#6366F1" }} />
          <Typography noWrap sx={{ fontSize: "0.7rem", color: isDark ? "#A5B4FC" : "#6366F1", maxWidth: 190 }}>
            {row.category}
          </Typography>
        </Stack>
      )}

      {row.service && (
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.5 }}>
          <MedicalServicesIcon sx={{ fontSize: 13, color: isDark ? "#C4B5FD" : "#8B5CF6" }} />
          <Typography noWrap sx={{ fontSize: "0.7rem", color: isDark ? "#C4B5FD" : "#8B5CF6", maxWidth: 190 }}>
            {row.service}
          </Typography>
        </Stack>
      )}

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1, pt: 1, borderTop: isDark ? "1px solid rgba(124,58,237,0.12)" : "1px solid #F3F4F6" }}>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <PersonIcon sx={{ fontSize: 13, color: isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF" }} />
          <Typography noWrap sx={{ fontSize: "0.68rem", color: isDark ? "rgba(255,255,255,0.5)" : "#9CA3AF", maxWidth: 100 }}>
            {row.advisor || "Atanmadı"}
          </Typography>
        </Stack>
        <Typography sx={{ fontSize: "0.65rem", color: isDark ? "rgba(255,255,255,0.35)" : "#B0B7C3" }}>
          {row.date}
        </Typography>
      </Stack>
    </Paper>
  );
}

interface KanbanColumnProps {
  status: string;
  rows: any[];
  mode: "light" | "dark";
  onCardClick: (id: any) => void;
  isPanning: boolean;
  sortable?: boolean;
  editable?: boolean;
  onRename?: (oldName: string, newName: string) => void;
}

function KanbanColumn({ status, rows, mode, onCardClick, isPanning, sortable = true, editable = false, onRename }: KanbanColumnProps) {
  const isDark = mode === "dark";
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(status);

  const startEdit = () => {
    setEditValue(status);
    setIsEditing(true);
  };

  const commitEdit = () => {
    const trimmed = editValue.trim();
    setIsEditing(false);
    if (trimmed && trimmed !== status && onRename) {
      onRename(status, trimmed);
    }
  };

  const cancelEdit = () => {
    setEditValue(status);
    setIsEditing(false);
  };

  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `col-${status}`, data: { status } });
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging: isColumnDragging,
  } = useSortable({ id: `colhandle-${status}`, disabled: !sortable });
  const statusColors = getKanbanStatusColor(status, isDark);

  const columnStyle: React.CSSProperties = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
    opacity: isColumnDragging ? 0.4 : 1,
    zIndex: isColumnDragging ? 40 : "auto",
  };

  return (
    <Paper
      ref={setSortableRef}
      elevation={0}
      sx={{
        display: "flex",
        flexDirection: "column",
        minWidth: COLUMN_WIDTH,
        maxWidth: COLUMN_WIDTH,
        height: "100%",
        borderRadius: 3,
        bgcolor: isDark ? "#241F45" : "#F3F4F6",
        border: isDark ? "1px solid rgba(124,58,237,0.12)" : "1px solid #E5E7EB",
        overflow: "hidden",
        flexShrink: 0,
        ...columnStyle,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 1.75,
          py: 1.25,
          borderBottom: isDark ? "1px solid rgba(124,58,237,0.15)" : "1px solid #E5E7EB",
          bgcolor: isDark ? "#2A2450" : "#FFFFFF",
        }}
      >
        <Stack
          {...(isEditing ? {} : attributes)}
          {...(isEditing ? {} : listeners)}
          data-kanban-column-handle={isEditing ? undefined : "true"}
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{
            minWidth: 0,
            flex: 1,
            cursor: isEditing ? "default" : sortable ? (isColumnDragging ? "grabbing" : "grab") : "default",
            userSelect: "none",
            touchAction: isEditing ? "auto" : "none",
          }}
        >
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: statusColors.solid, flexShrink: 0 }} />
          {isEditing ? (
            <TextField
              autoFocus
              size="small"
              variant="standard"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); commitEdit(); }
                if (e.key === "Escape") { e.preventDefault(); cancelEdit(); }
              }}
              onBlur={commitEdit}
              InputProps={{ disableUnderline: false }}
              sx={{
                flex: 1,
                "& .MuiInput-input": {
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: isDark ? "#FFFFFF" : "#1F2937",
                  py: 0,
                },
              }}
            />
          ) : (
            <Typography noWrap sx={{ fontWeight: 700, fontSize: "0.78rem", color: isDark ? "#FFFFFF" : "#1F2937" }}>
              {status}
            </Typography>
          )}
        </Stack>
        <Stack direction="row" spacing={0.25} alignItems="center" sx={{ flexShrink: 0, ml: 0.5 }}>
          {isEditing ? (
            <>
              <IconButton
                size="small"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); commitEdit(); }}
                sx={{ p: 0.4, color: "#22C55E" }}
              >
                <CheckIcon sx={{ fontSize: 15 }} />
              </IconButton>
              <IconButton
                size="small"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); cancelEdit(); }}
                sx={{ p: 0.4, color: "#EF4444" }}
              >
                <CloseIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </>
          ) : (
            <>
              {editable && (
                <IconButton
                  size="small"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); startEdit(); }}
                  sx={{
                    p: 0.4,
                    color: isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF",
                    "&:hover": { color: isDark ? "#FFFFFF" : "#374151" },
                  }}
                >
                  <EditIcon sx={{ fontSize: 14 }} />
                </IconButton>
              )}
              <Chip
                label={rows.length}
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  bgcolor: statusColors.bg,
                  color: statusColors.color,
                }}
              />
            </>
          )}
        </Stack>
      </Stack>

      <Box
        ref={setDropRef}
        data-kanban-column-body="true"
        sx={{
          flexGrow: 1,
          minHeight: 0,
          overflowY: "auto",
          p: 1.25,
          display: "flex",
          flexDirection: "column",
          gap: 1.1,
          cursor: isPanning ? "grabbing" : "grab",
          userSelect: "none",
          transition: "background-color 0.15s ease",
          bgcolor: isOver ? (isDark ? "rgba(124,58,237,0.12)" : "rgba(99,102,241,0.06)") : "transparent",
          outline: isOver ? `2px dashed ${statusColors.solid}` : "2px dashed transparent",
          outlineOffset: "-4px",
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-thumb": { bgcolor: isDark ? "rgba(124,58,237,0.3)" : "#D1D5DB", borderRadius: 3 },
        }}
      >
        {rows.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography sx={{ fontSize: "0.72rem", color: isDark ? "rgba(255,255,255,0.3)" : "#B0B7C3" }}>
              Müşteri yok
            </Typography>
          </Box>
        ) : (
          rows.map((row) => <CustomerCard key={row.id} row={row} mode={mode} onCardClick={onCardClick} />)
        )}
      </Box>
    </Paper>
  );
}

// Sürükleme sırasında DragOverlay içinde gösterilen, dnd-kit hook'ları kullanmayan
// sade önizleme (aynı id ile ikinci bir draggable/droppable kaydı oluşmasın diye).
function KanbanColumnGhost({ status, rows, mode }: { status: string; rows: any[]; mode: "light" | "dark" }) {
  const isDark = mode === "dark";
  const statusColors = getKanbanStatusColor(status, isDark);
  return (
    <Paper
      elevation={8}
      sx={{
        display: "flex",
        flexDirection: "column",
        width: COLUMN_WIDTH,
        maxHeight: 420,
        borderRadius: 3,
        overflow: "hidden",
        bgcolor: isDark ? "#241F45" : "#F3F4F6",
        border: isDark ? "1px solid rgba(124,58,237,0.25)" : "1px solid #E5E7EB",
        boxShadow: "0 16px 32px rgba(0,0,0,0.28)",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 1.75,
          py: 1.25,
          bgcolor: isDark ? "#2A2450" : "#FFFFFF",
          borderBottom: isDark ? "1px solid rgba(124,58,237,0.15)" : "1px solid #E5E7EB",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: statusColors.solid, flexShrink: 0 }} />
          <Typography noWrap sx={{ fontWeight: 700, fontSize: "0.78rem", color: isDark ? "#FFFFFF" : "#1F2937" }}>
            {status}
          </Typography>
        </Stack>
        <Chip
          label={rows.length}
          size="small"
          sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700, bgcolor: statusColors.bg, color: statusColors.color }}
        />
      </Stack>
      <Box sx={{ p: 1.5, opacity: 0.5 }}>
        <Typography sx={{ fontSize: "0.72rem", color: isDark ? "rgba(255,255,255,0.5)" : "#9CA3AF" }}>
          {rows.length} müşteri taşınıyor...
        </Typography>
      </Box>
    </Paper>
  );
}

interface KanbanBoardProps {
  rows: any[];
  statuses: string[];
  mode: "light" | "dark";
  onStatusChange: (id: any, newStatus: string) => void;
  onCardClick: (id: any) => void;
  onRenameStatus?: (oldName: string, newName: string) => void;
  loading?: boolean;
}

export default function KanbanBoard({ rows, statuses, mode, onStatusChange, onCardClick, onRenameStatus, loading }: KanbanBoardProps) {
  const [activeRow, setActiveRow] = useState<any | null>(null);
  const [activeColumnStatus, setActiveColumnStatus] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [rowLayout, setRowLayout] = useState<1 | 2>(1);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const panState = useRef<{
    startX: number;
    startY: number;
    boardScrollLeft: number;
    columnEl: HTMLElement | null;
    columnScrollTop: number;
    pointerId: number;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  // Geçerli durum kolonları (ayarlardaki sıra + veride bulunan ekstra durumlar)
  const columns = useMemo(() => {
    const known = new Set(statuses);
    const extra = Array.from(
      new Set(rows.map((r) => (r.status || "").trim()).filter((s) => s && !known.has(s)))
    );
    return [...statuses, ...extra];
  }, [statuses, rows]);

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    columns.forEach((s) => (map[s] = []));
    const noStatus: any[] = [];
    rows.forEach((r) => {
      const s = (r.status || "").trim();
      if (s && map[s]) map[s].push(r);
      else noStatus.push(r);
    });
    if (noStatus.length > 0) map["Belirsiz"] = noStatus;
    return map;
  }, [columns, rows]);

  const hasUnassigned = !!grouped["Belirsiz"];

  // Kayıtlı kolon sırasını yükle / yeni kolonlarla birleştir
  useEffect(() => {
    let saved: string[] = [];
    try {
      const raw = localStorage.getItem(COLUMN_ORDER_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch {}
    const colSet = new Set(columns);
    const merged = [
      ...saved.filter((s) => colSet.has(s)),
      ...columns.filter((s) => !saved.includes(s)),
    ];
    setColumnOrder(merged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify([...columns].sort())]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ROW_LAYOUT_KEY);
      if (saved === "2") setRowLayout(2);
    } catch {}
  }, []);

  const orderedColumns = useMemo(() => {
    const base = columnOrder.length > 0 ? columnOrder : columns;
    return hasUnassigned ? [...base, "Belirsiz"] : base;
  }, [columnOrder, columns, hasUnassigned]);

  const sortableColumnIds = useMemo(
    () => (columnOrder.length > 0 ? columnOrder : columns).map((s) => `colhandle-${s}`),
    [columnOrder, columns]
  );

  const handleRowLayoutChange = (val: 1 | 2) => {
    setRowLayout(val);
    try { localStorage.setItem(ROW_LAYOUT_KEY, String(val)); } catch {}
  };

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    if (id.startsWith("card-")) {
      setActiveRow(event.active.data.current?.row || null);
    } else if (id.startsWith("colhandle-")) {
      setActiveColumnStatus(id.replace("colhandle-", ""));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveRow(null);
    setActiveColumnStatus(null);
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId.startsWith("card-")) {
      const overStatus = overId.replace(/^col-/, "");
      const activeRowData = active.data.current?.row;
      if (!activeRowData) return;
      const currentStatus = (activeRowData.status || "").trim();
      if (overStatus && overStatus !== currentStatus && overStatus !== "Belirsiz") {
        onStatusChange(activeRowData.id, overStatus);
      }
      return;
    }

    if (activeId.startsWith("colhandle-") && overId.startsWith("colhandle-") && activeId !== overId) {
      setColumnOrder((prev) => {
        const base = prev.length > 0 ? prev : columns;
        const activeStatus = activeId.replace("colhandle-", "");
        const overStatus = overId.replace("colhandle-", "");
        const oldIndex = base.indexOf(activeStatus);
        const newIndex = base.indexOf(overStatus);
        if (oldIndex === -1 || newIndex === -1) return prev;
        const newOrder = arrayMove(base, oldIndex, newIndex);
        try { localStorage.setItem(COLUMN_ORDER_KEY, JSON.stringify(newOrder)); } catch {}
        return newOrder;
      });
    }
  };

  // --- Boş alanlardan tutup sürükleyerek kaydırma (pan) ---
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-kanban-card="true"]')) return;
    if (target.closest('[data-kanban-column-handle="true"]')) return; // liste sürükleme dnd-kit'e ait
    const boardEl = boardRef.current;
    if (!boardEl) return;
    const columnEl = target.closest('[data-kanban-column-body="true"]') as HTMLElement | null;

    panState.current = {
      startX: e.clientX,
      startY: e.clientY,
      boardScrollLeft: boardEl.scrollLeft,
      columnEl,
      columnScrollTop: columnEl ? columnEl.scrollTop : 0,
      pointerId: e.pointerId,
    };
    setIsPanning(true);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = panState.current;
    const boardEl = boardRef.current;
    if (!state || !boardEl) return;
    e.preventDefault();
    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    boardEl.scrollLeft = state.boardScrollLeft - dx;
    if (state.columnEl) {
      state.columnEl.scrollTop = state.columnScrollTop - dy;
    }
  };

  const endPan = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!panState.current) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(panState.current.pointerId);
    } catch {}
    panState.current = null;
    setIsPanning(false);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
        <ToggleButtonGroup
          value={rowLayout}
          exclusive
          onChange={(_, val) => { if (val) handleRowLayoutChange(val); }}
          size="small"
          sx={{
            bgcolor: mode === "dark" ? "#241F45" : "#F3F4F6",
            borderRadius: 2,
            p: 0.4,
            "& .MuiToggleButton-root": {
              border: "none",
              borderRadius: 1.5,
              px: 1.25,
              py: 0.4,
              color: mode === "dark" ? "rgba(255,255,255,0.6)" : "#6B7280",
              "&.Mui-selected": {
                bgcolor: mode === "dark" ? "#7C3AED" : "#FFFFFF",
                color: mode === "dark" ? "#FFFFFF" : "#111827",
                boxShadow: mode === "dark" ? "none" : "0 1px 3px rgba(0,0,0,0.12)",
              },
              "&.Mui-selected:hover": { bgcolor: mode === "dark" ? "#7C3AED" : "#FFFFFF" },
            },
          }}
        >
          <ToggleButton value={1}>
            <Tooltip title="Tek Sıra"><ViewStreamIcon fontSize="small" /></Tooltip>
          </ToggleButton>
          <ToggleButton value={2}>
            <Tooltip title="Çift Sıra"><ViewWeekIcon fontSize="small" /></Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Box
        ref={boardRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        onPointerLeave={endPan}
        sx={{
          display: rowLayout === 1 ? "flex" : "grid",
          ...(rowLayout === 1
            ? { gap: 1.75 }
            : {
                gridTemplateRows: "repeat(2, minmax(0, 1fr))",
                gridAutoFlow: "column",
                gridAutoColumns: `${COLUMN_WIDTH}px`,
                columnGap: 1.75 * 8,
                rowGap: 1.75 * 8,
              }),
          overflowX: "auto",
          overflowY: "hidden",
          height: "calc(100vh - 300px)",
          minHeight: 480,
          pb: 1,
          touchAction: "none",
          "&::-webkit-scrollbar": { height: 8 },
          "&::-webkit-scrollbar-thumb": { bgcolor: mode === "dark" ? "rgba(124,58,237,0.3)" : "#D1D5DB", borderRadius: 4 },
        }}
      >
        <SortableContext items={sortableColumnIds} strategy={rectSortingStrategy}>
          {orderedColumns.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              rows={grouped[status] || []}
              mode={mode}
              onCardClick={onCardClick}
              isPanning={isPanning}
              sortable={status !== "Belirsiz"}
              editable={statuses.includes(status)}
              onRename={onRenameStatus}
            />
          ))}
        </SortableContext>
      </Box>

      <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
        {activeRow ? (
          <Box sx={{ width: 262 }}>
            <CustomerCard row={activeRow} mode={mode} onCardClick={() => {}} dragOverlay />
          </Box>
        ) : activeColumnStatus ? (
          <KanbanColumnGhost status={activeColumnStatus} rows={grouped[activeColumnStatus] || []} mode={mode} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
