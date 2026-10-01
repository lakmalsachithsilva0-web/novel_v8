import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiTarget = process.env.API_PROXY_TARGET || "http://127.0.0.1:8000";
const apiProxy = {
  "/api": { target: apiTarget, changeOrigin: true },
  "/uploads": { target: apiTarget, changeOrigin: true },
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: [".trycloudflare.com"],
    proxy: apiProxy,
    headers: { "Cross-Origin-Opener-Policy": "same-origin-allow-popups" },
  },
  preview: {
    proxy: apiProxy,
    headers: { "Cross-Origin-Opener-Policy": "same-origin-allow-popups" },
  },
});
