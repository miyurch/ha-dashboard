import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "./",
  root: ".",
  build: {
    outDir: path.resolve(rootDir, "../custom_components/dashboard_builder/www"),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(rootDir, "index.html"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api/websocket": {
        target: "ws://localhost:8123",
        ws: true,
        changeOrigin: true,
      },
      "/api": {
        target: "http://localhost:8123",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
