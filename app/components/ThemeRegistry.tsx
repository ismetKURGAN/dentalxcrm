"use client";

import * as React from "react";
import createCache from "@emotion/cache";
import { useServerInsertedHTML } from "next/navigation";
import { CacheProvider } from "@emotion/react";
import { ThemeProvider, createTheme, PaletteMode } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

// Tema context'i
export const ThemeModeContext = React.createContext({
  toggleTheme: () => {},
  mode: "dark" as PaletteMode,
});

// Tema oluşturucu
const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    ...(mode === "dark"
      ? {
          // KOYU TEMA - Mor/Lacivert (Resim gibi)
          primary: { main: "#7C3AED", light: "#9F67FF", dark: "#6D28D9" },
          secondary: { main: "#10B981" },
          background: {
            default: "#1E1B3E",
            paper: "#2A2550",
          },
          text: {
            primary: "#FFFFFF",
            secondary: "rgba(255, 255, 255, 0.85)",
          },
          divider: "rgba(255, 255, 255, 0.05)",
          action: {
            hover: "rgba(124, 58, 237, 0.1)",
            selected: "rgba(124, 58, 237, 0.2)",
          },
        }
      : {
          // AÇIK TEMA
          primary: { main: "#6C5DD3", light: "#8b7de8", dark: "#5346b3" },
          secondary: { main: "#FF754C" },
          background: {
            default: "#F4F5F7",
            paper: "#FFFFFF",
          },
          text: {
            primary: "#11142D",
            secondary: "#808191",
          },
          divider: "rgba(0, 0, 0, 0.08)",
          action: {
            hover: "rgba(108, 93, 211, 0.08)",
            selected: "rgba(108, 93, 211, 0.16)",
          },
        }),
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Inter", "Public Sans", sans-serif',
    fontSize: 12,
    h4: { fontWeight: 700, fontSize: "1.5rem" },
    h5: { fontWeight: 700, fontSize: "1.1rem" },
    h6: { fontWeight: 600, fontSize: "0.9rem" },
    body1: { fontSize: "0.8rem" },
    body2: { fontSize: "0.75rem" },
    button: { textTransform: "none" as const, fontWeight: 600, fontSize: "0.8rem" },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          borderRadius: 10,
          padding: "10px 20px",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(108, 93, 211, 0.3)",
          },
        },
        contained: {
          background: "linear-gradient(135deg, #6C5DD3 0%, #5346b3 100%)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: 16,
          ...(mode === "dark"
            ? {
                background: "#252047",
                border: "1px solid rgba(124, 58, 237, 0.15)",
                boxShadow: "0 4px 24px rgba(0, 0, 0, 0.4)",
                color: "#FFFFFF",
              }
            : {
                border: "1px solid rgba(0, 0, 0, 0.06)",
                boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
              }),
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          ...(mode === "dark"
            ? {
                background: "#252047",
                border: "1px solid rgba(124, 58, 237, 0.15)",
                color: "#FFFFFF",
              }
            : {
                background: "#FFFFFF",
                border: "1px solid rgba(0, 0, 0, 0.06)",
              }),
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small" as const,
        variant: "outlined" as const,
      },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 10,
            transition: "all 0.2s",
            ...(mode === "dark" && {
              color: "#FFFFFF",
              "& fieldset": { borderColor: "rgba(124, 58, 237, 0.3)" },
              "&:hover fieldset": { borderColor: "rgba(124, 58, 237, 0.5)" },
            }),
            "&.Mui-focused fieldset": {
              borderColor: "#6C5DD3",
              boxShadow: "0 0 0 3px rgba(108, 93, 211, 0.15)",
            },
          },
          ...(mode === "dark" && {
            "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
            "& .MuiInputBase-input": { color: "#FFFFFF" },
            "& .MuiInputBase-input::placeholder": { color: "rgba(255,255,255,0.5)", opacity: 1 },
          }),
        },
      },
    },
    MuiSelect: {
      defaultProps: { size: "small" as const },
      styleOverrides: {
        root: {
          borderRadius: 10,
          ...(mode === "dark" && {
            color: "#FFFFFF",
            "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.7)" },
          }),
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        ...(mode === "dark" && {
          paper: {
            backgroundColor: "#2A2550",
            border: "1px solid rgba(124, 58, 237, 0.3)",
          },
          listbox: {
            "& .MuiAutocomplete-option": {
              color: "#FFFFFF",
              "&:hover": { backgroundColor: "rgba(124, 58, 237, 0.15)" },
              "&[aria-selected=\"true\"]": { backgroundColor: "rgba(124, 58, 237, 0.25)" },
            },
          },
          tag: {
            color: "#FFFFFF",
            backgroundColor: "rgba(124, 58, 237, 0.3)",
          },
          clearIndicator: { color: "rgba(255,255,255,0.7)" },
          popupIndicator: { color: "rgba(255,255,255,0.7)" },
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          ...(mode === "dark" && {
            borderColor: "rgba(124, 58, 237, 0.3)",
          }),
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          ...(mode === "dark" && {
            backgroundColor: "#1E1B3E",
            backgroundImage: "none",
            border: "1px solid rgba(124, 58, 237, 0.2)",
          }),
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          ...(mode === "dark" && { color: "#FFFFFF" }),
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          ...(mode === "dark" && {
            color: "rgba(255,255,255,0.9)",
            borderColor: "rgba(124, 58, 237, 0.15)",
          }),
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          ...(mode === "dark" && {
            color: "#FFFFFF",
            "&:hover": { backgroundColor: "rgba(124, 58, 237, 0.15)" },
            "&.Mui-selected": {
              backgroundColor: "rgba(124, 58, 237, 0.25)",
              "&:hover": { backgroundColor: "rgba(124, 58, 237, 0.3)" },
            },
          }),
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          ...(mode === "dark" && {
            backgroundColor: "#2A2550",
            border: "1px solid rgba(124, 58, 237, 0.3)",
          }),
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          ...(mode === "dark" && {
            color: "#FFFFFF",
          }),
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: "2px 8px",
          "&.Mui-selected": {
            backgroundColor: "rgba(108, 93, 211, 0.15)",
            "&:hover": {
              backgroundColor: "rgba(108, 93, 211, 0.2)",
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          ...(mode === "dark" && {
            color: "#FFFFFF",
            borderColor: "rgba(124, 58, 237, 0.15)",
          }),
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          ...(mode === "dark" && {
            backgroundColor: "#3D3570",
            color: "#FFFFFF",
          }),
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          ...(mode === "dark"
            ? {
                background: "linear-gradient(180deg, #2A2550 0%, #1E1B3E 100%)",
                borderRight: "1px solid rgba(124, 58, 237, 0.1)",
              }
            : {
                background: "#FFFFFF",
                borderRight: "1px solid rgba(0, 0, 0, 0.08)",
              }),
        },
      },
    },
  },
});

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  // Tema modu state'i - localStorage'dan oku veya varsayılan dark
  const [mode, setMode] = React.useState<PaletteMode>("dark");

  // Client-side'da localStorage'dan tema tercihini oku
  React.useEffect(() => {
    const savedMode = localStorage.getItem("themeMode") as PaletteMode;
    if (savedMode) {
      setMode(savedMode);
    }
  }, []);

  // Tema değiştirme fonksiyonu
  const themeContext = React.useMemo(
    () => ({
      toggleTheme: () => {
        setMode((prevMode) => {
          const newMode = prevMode === "light" ? "dark" : "light";
          localStorage.setItem("themeMode", newMode);
          return newMode;
        });
      },
      mode,
    }),
    [mode]
  );

  // Tema oluştur
  const theme = React.useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  const [{ cache, flush }] = React.useState(() => {
    const cache = createCache({ key: "mui" });
    cache.compat = true;
    const prevInsert = cache.insert;
    let inserted: string[] = [];
    cache.insert = (...args) => {
      const serialized = args[1];
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }
      return prevInsert(...args);
    };
    const flush = () => {
      const prevInserted = inserted;
      inserted = [];
      return prevInserted;
    };
    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) return null;
    let styles = "";
    for (const name of names) {
      styles += cache.inserted[name];
    }
    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(" ")}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return (
    <CacheProvider value={cache}>
      <ThemeModeContext.Provider value={themeContext}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </ThemeModeContext.Provider>
    </CacheProvider>
  );
}