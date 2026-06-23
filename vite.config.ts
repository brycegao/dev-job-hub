import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.svg", "icon/*.png"],
      manifest: {
        name: "程序员求职作战台",
        short_name: "求职作战台",
        description: "面向中国开发者的本地优先求职管理工具",
        theme_color: "#0f766e",
        background_color: "#f5f7fb",
        display: "standalone",
        start_url: "./",
        icons: [
          { src: "icon/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  base: "./",
});
