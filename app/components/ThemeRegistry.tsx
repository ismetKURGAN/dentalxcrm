"use client";

import * as React from "react";
import createCache from "@emotion/cache";
import { useServerInsertedHTML } from "next/navigation";
import { CacheProvider } from "@emotion/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

// BYTNO MODERN TEMA (Daha Keskin & Ferah)
const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: '#6C5DD3' }, // Moon Moru
    secondary: { main: '#FF754C' }, // Turuncu
    background: { default: '#F4F5F7', paper: '#FFFFFF' },
    text: { primary: '#11142D', secondary: '#808191' },
  },
  shape: {
    borderRadius: 8, // DAHA AZ YUVARLAK (8px)
  },
  typography: {
    fontFamily: '"Inter", "Public Sans", sans-serif',
    fontSize: 14, // Yazı boyutu biraz artırıldı
    h6: { fontWeight: 700, fontSize: '1.1rem' },
    body1: { fontSize: '0.95rem' },
    body2: { fontSize: '0.85rem' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderRadius: 8, // 8px
          padding: '10px 20px', // Daha geniş butonlar
          '&:hover': { boxShadow: '0 4px 12px rgba(108, 93, 211, 0.2)' }, // Renkli gölge
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0px 4px 24px rgba(0, 0, 0, 0.04)', // Daha yumuşak, geniş gölge
          border: '1px solid #E4E4E4',
          borderRadius: 12, // Kartlar biraz daha yuvarlak kalabilir
        },
        elevation0: { boxShadow: 'none', border: '1px solid #E4E4E4' }
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small", // Inputlar hala küçük boyutta
        variant: "outlined",
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': { 
            borderRadius: 8,
            transition: 'all 0.2s',
            '&.Mui-focused fieldset': {
                borderColor: '#6C5DD3',
                boxShadow: '0 0 0 3px rgba(108, 93, 211, 0.1)', // Odaklanınca modern gölge
            }
          },
        }
      }
    },
    MuiSelect: {
      defaultProps: { size: "small" },
      styleOverrides: {
        root: { 
            borderRadius: 8,
            transition: 'all 0.2s',
            '&.Mui-focused': {
                borderColor: '#6C5DD3',
                boxShadow: '0 0 0 3px rgba(108, 93, 211, 0.1)',
            }
        },
        icon: { color: '#6C5DD3' } // Select ikonu renkli
      }
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 600 },
      }
    },
    MuiListItemButton: {
        styleOverrides: {
            root: {
                borderRadius: 8, // Liste elemanları 8px
            }
        }
    }
  },
});

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
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
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}