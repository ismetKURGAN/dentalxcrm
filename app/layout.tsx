import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeRegistry from "./components/ThemeRegistry"; // Tema sağlayıcı
import AppShell from "./components/AppShell";
import { I18nProvider } from "./components/I18nProvider";
import PWARegister from "./components/PWARegister";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bytno CRM",
  description: "Bytno - Customer Relationship Management",
  manifest: "/manifest.json",
  themeColor: "#F5A623",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bytno CRM",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

// HMR WebSocket hatasında sayfa yenilenmesini engelle
const hmrDisableScript = `
  if (typeof window !== 'undefined') {
    // WebSocket hatalarını yakala ve sayfa yenilenmesini engelle
    window.__NEXT_HMR_REFRESH_DISABLED__ = true;
    
    // Original WebSocket'i sakla
    const OriginalWebSocket = window.WebSocket;
    
    // WebSocket'i override et - HMR bağlantılarını engelle
    window.WebSocket = function(url, protocols) {
      if (url && url.includes('webpack-hmr')) {
        // HMR WebSocket'i için dummy obje döndür
        return {
          send: function() {},
          close: function() {},
          addEventListener: function() {},
          removeEventListener: function() {},
          readyState: 3, // CLOSED
          CONNECTING: 0,
          OPEN: 1,
          CLOSING: 2,
          CLOSED: 3
        };
      }
      return new OriginalWebSocket(url, protocols);
    };
    window.WebSocket.prototype = OriginalWebSocket.prototype;
    window.WebSocket.CONNECTING = 0;
    window.WebSocket.OPEN = 1;
    window.WebSocket.CLOSING = 2;
    window.WebSocket.CLOSED = 3;
  }
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script dangerouslySetInnerHTML={{ __html: hmrDisableScript }} />
      </head>
      <body className={inter.className} style={{ display: "flex", overflowX: "hidden" }}>
        <PWARegister />
        <ThemeRegistry>
          <I18nProvider>
            <AppShell>{children}</AppShell>
          </I18nProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}