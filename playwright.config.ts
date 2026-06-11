// playwright.config.ts — configuración E2E para CRECETUBE Assistant.
// Puertos propios (8002/5174) para no chocar con el dev normal (8001/5173).
// BD temporal por ejecución (nunca la real app/backend/data/crecetube.db).
import { defineConfig, devices } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

// Directorio de BD temporal bajo node_modules/.cache/e2e/ — creado si no existe
const cachDir = resolve(__dirname, "node_modules/.cache/e2e");
mkdirSync(cachDir, { recursive: true });
const dbUrl = `file:${cachDir}/run-${Date.now()}.db`.replace(/\\/g, "/");

export default defineConfig({
  testDir: "e2e",

  // Los 3 specs comparten estado en orden: 01 crea perfil, 02 crea vídeo, 03 usa ese vídeo.
  fullyParallel: false,
  workers: 1,

  reporter: "list",

  use: {
    baseURL: "http://localhost:5174",
    // Conservar traza en caso de fallo para diagnóstico
    trace: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Levantar backend y frontend antes de los tests, detenerlos al terminar
  webServer: [
    {
      // Backend Express en puerto 8002 con BD temporal
      command: "node app/backend/src/server.js",
      url: "http://localhost:8002/api/health",
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        PORT: "8002",
        DB_URL: dbUrl,
      },
    },
    {
      // Frontend Vite en puerto 5174 apuntando al backend de tests
      command: "npm run dev -w app/frontend -- --port 5174 --strictPort",
      url: "http://localhost:5174",
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        BACKEND_PORT: "8002",
      },
    },
  ],
});
