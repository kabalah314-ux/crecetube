// Spec 01 — Onboarding completo (02 §2.2)
// Verifica que sin perfil cualquier ruta redirige a /onboarding,
// y que completar los 9 pasos crea el perfil y aterriza en /dashboard.
import { test, expect } from "@playwright/test";

test.describe("Onboarding — 9 pasos hasta el dashboard", () => {
  test("redirige a /onboarding cuando no hay perfil y completa el flujo", async ({ page }) => {
    // Sin perfil, cualquier ruta debe redirigir a onboarding
    await page.goto("/");
    await expect(page).toHaveURL(/\/onboarding/);

    // Paso 0 — Bienvenida: CTA "Empezar"
    await expect(page.getByTestId("onboarding-start")).toBeVisible();
    await page.getByTestId("onboarding-start").click();

    // Paso 1 — ¿Ya tienes canal? → seleccionar "Sí" y avanzar
    await expect(page.getByTestId("onboarding-has-channel-yes")).toBeVisible();
    await page.getByTestId("onboarding-has-channel-yes").click();
    // Avanzar con el botón "Siguiente" (testid onboarding-next)
    await page.getByTestId("onboarding-next").click();

    // Paso 2 — Nombre y URL del canal
    await expect(page.getByTestId("onboarding-channel-name")).toBeVisible();
    await page.getByTestId("onboarding-channel-name").fill("Canal de Pruebas E2E");
    // URL es opcional; la rellenamos igualmente para cubrir validación
    await page.getByTestId("onboarding-channel-url").fill("https://youtube.com/@pruebase2e");
    await page.getByTestId("onboarding-next").click();

    // Paso 3 — Nicho: elegir chip (slug normaliza tildes: "tecnología" → "tecnologia")
    await expect(page.getByTestId("onboarding-niche")).toBeVisible();
    await page.getByTestId("onboarding-niche-chip-tecnologia").click();
    await page.getByTestId("onboarding-next").click();

    // Paso 4 — Nivel: elegir Intermedio
    await expect(page.getByTestId("onboarding-level-intermedio")).toBeVisible();
    await page.getByTestId("onboarding-level-intermedio").click();
    await page.getByTestId("onboarding-next").click();

    // Paso 5 — Frecuencia objetivo: elegir semanal
    await expect(page.getByTestId("onboarding-frequency-semanal")).toBeVisible();
    await page.getByTestId("onboarding-frequency-semanal").click();
    await page.getByTestId("onboarding-next").click();

    // Paso 6 — Objetivo principal: elegir monetización
    await expect(page.getByTestId("onboarding-goal-monetizacion")).toBeVisible();
    await page.getByTestId("onboarding-goal-monetizacion").click();
    await page.getByTestId("onboarding-next").click();

    // Paso 7 — IA (opcional): saltar con "Configurar después"
    await expect(page.getByTestId("onboarding-ai-skip")).toBeVisible();
    await page.getByTestId("onboarding-ai-skip").click();

    // Paso 8 — Resumen: confirmar y crear perfil
    await expect(page.getByTestId("onboarding-submit")).toBeVisible();
    await page.getByTestId("onboarding-submit").click();

    // Debe aterrizar en el dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    // El dashboard debe mostrar el nombre del canal en el saludo
    await expect(page.getByRole("heading", { name: /Canal de Pruebas E2E/ })).toBeVisible();
  });
});
