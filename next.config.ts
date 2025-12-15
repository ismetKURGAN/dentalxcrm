import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PUBLIC IP'den gelen istekleri kabul et
  experimental: {
    serverActions: {
      allowedOrigins: ["http://91.151.95.34:4001", "https://crm.dentalxturkey.com"],
    },
  },
  
  // HMR için izin verilen originler
  allowedDevOrigins: ["http://91.151.95.34:4001", "https://crm.dentalxturkey.com", "crm.dentalxturkey.com"],

  // API değişkenleri burada
  env: {
    CRM_URL: process.env.CRM_URL,
    CRM_API_KEY: process.env.CRM_API_KEY,
    CRM_ENTITY: process.env.CRM_ENTITY,
  },
};

export default nextConfig;
