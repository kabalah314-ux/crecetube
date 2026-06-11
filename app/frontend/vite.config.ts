import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Puerto del backend: BACKEND_PORT del entorno (tests E2E usan 8002); defecto 8001 en dev normal.
const backend = `http://localhost:${process.env.BACKEND_PORT ?? "8001"}`;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": backend,
      "/uploads": backend,
    },
  },
});
