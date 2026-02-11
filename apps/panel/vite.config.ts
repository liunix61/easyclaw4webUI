import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@openclaw/reasoning-tags": resolve(__dirname, "../../vendor/openclaw/src/shared/text/reasoning-tags.ts"),
    },
  },
  server: {
    port: 5180,
    proxy: {
      "/api": {
        target: "http://localhost:3210",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
  },
});
