// Spec 01 — Onboarding completo (02 §2.2 + multicanal de T017 + bifurcación de T021)
// Verifica que sin perfil cualquier ruta redirige a /onboarding,
// y que completar los 10 pasos crea el perfil y aterriza en /dashboard.
import { test, expect } from "@playwright/test";

// Rama sin canal (T021): se salta el paso multicanal y acepta "Todavía no" / "Aún no lo sé".
// Va PRIMERO y limpia la BD al terminar (import replaceAll) para que el test de la rama
// con canal parta de cero y deje el perfil que esperan los specs 02 y 03.
test.describe("Onboarding — rama sin canal", () => {
  test.afterEach(async ({ request }) => {
    // Reset del usuario "local": borra perfil/vídeos/canales; las plantillas precargadas se conservan
    const r = await request.post("/api/import", { data: { replaceAll: true, data: { version: 1 } } });
    expect(r.ok()).toBeTruthy();
  });

  test("salta multicanal, acepta 'no lo sé' y saluda como creador genérico", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/onboarding/);

    // Paso 0 — Bienvenida
    await page.getByTestId("onboarding-start").click();

    // Paso 1 — "Todavía no" tengo canal
    await page.getByTestId("onboarding-has-channel-no").click();
    await page.getByTestId("onboarding-next").click();

    // El paso multicanal NO aparece: se aterriza directamente en la pregunta del nombre
    await expect(page.getByTestId("onboarding-channel-name")).toBeVisible();
    await expect(page.getByTestId("onboarding-multichannel-single")).toHaveCount(0);

    // Nombre — "Todavía no" (canalNombre = null) avanza directamente
    await page.getByTestId("onboarding-nombre-todavia-no").click();

    // Nicho — "Aún no lo sé" (nicho = null)
    await expect(page.getByTestId("onboarding-niche")).toBeVisible();
    await page.getByTestId("onboarding-nicho-no-se").click();
    await page.getByTestId("onboarding-next").click();

    // Nivel
    await page.getByTestId("onboarding-level-principiante").click();
    await page.getByTestId("onboarding-next").click();

    // Frecuencia — "Aún no lo sé" (frecuenciaObjetivo = null)
    await page.getByTestId("onboarding-frequency-no-se").click();
    await page.getByTestId("onboarding-next").click();

    // Objetivo
    await page.getByTestId("onboarding-goal-suscriptores").click();
    await page.getByTestId("onboarding-next").click();

    // IA — saltar
    await page.getByTestId("onboarding-ai-skip").click();

    // Resumen — crear perfil
    await page.getByTestId("onboarding-submit").click();

    // T025 — sin canal todavía: el primer paso del método es validar que hay hueco,
    // así que se aterriza en /viabilidad con la pantalla de propuesta (no en /dashboard).
    await expect(page).toHaveURL(/\/viabilidad/, { timeout: 15_000 });
    await expect(page.getByTestId("viabilidad-propuesta")).toBeVisible();

    // "Ahora no": salta el estudio (saltado: true) y va al dashboard
    await page.getByTestId("viabilidad-saltar").click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    // Cerrar el tutorial de OpenRouter si aparece (perfil sin clave IA)
    const tutorialClose = page.getByTestId("openrouter-tutorial-close");
    if (await tutorialClose.isVisible()) {
      await tutorialClose.click();
    }

    // Saludo genérico (canalNombre null)
    await expect(page.getByRole("heading", { name: /Hola, creador/ })).toBeVisible();
    // T025 — tras saltar el estudio (saltado: true) el banner de viabilidad NO reaparece
    await expect(page.getByTestId("dashboard-card-viabilidad")).toHaveCount(0);
  });
});

test.describe("Onboarding — 10 pasos hasta el dashboard", () => {
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

    // Paso 2 — ¿Un canal o varios? → "Un canal" (gestionMulticanal = false)
    await expect(page.getByTestId("onboarding-multichannel-single")).toBeVisible();
    await page.getByTestId("onboarding-multichannel-single").click();
    await page.getByTestId("onboarding-next").click();

    // Paso 3 — Nombre y URL del canal
    await expect(page.getByTestId("onboarding-channel-name")).toBeVisible();
    await page.getByTestId("onboarding-channel-name").fill("Canal de Pruebas E2E");
    // URL es opcional; la rellenamos igualmente para cubrir validación
    await page.getByTestId("onboarding-channel-url").fill("https://youtube.com/@pruebase2e");
    await page.getByTestId("onboarding-next").click();

    // Paso 4 — Nicho: elegir chip (slug normaliza tildes: "tecnología" → "tecnologia")
    await expect(page.getByTestId("onboarding-niche")).toBeVisible();
    await page.getByTestId("onboarding-niche-chip-tecnologia").click();
    await page.getByTestId("onboarding-next").click();

    // Paso 5 — Nivel: elegir Intermedio
    await expect(page.getByTestId("onboarding-level-intermedio")).toBeVisible();
    await page.getByTestId("onboarding-level-intermedio").click();
    await page.getByTestId("onboarding-next").click();

    // Paso 6 — Frecuencia objetivo: elegir semanal
    await expect(page.getByTestId("onboarding-frequency-semanal")).toBeVisible();
    await page.getByTestId("onboarding-frequency-semanal").click();
    await page.getByTestId("onboarding-next").click();

    // Paso 7 — Objetivo principal: elegir monetización
    await expect(page.getByTestId("onboarding-goal-monetizacion")).toBeVisible();
    await page.getByTestId("onboarding-goal-monetizacion").click();
    await page.getByTestId("onboarding-next").click();

    // Paso 8 — IA (opcional): saltar con "Configurar después"
    await expect(page.getByTestId("onboarding-ai-skip")).toBeVisible();
    await page.getByTestId("onboarding-ai-skip").click();

    // Paso 9 — Resumen: confirmar y crear perfil
    await expect(page.getByTestId("onboarding-submit")).toBeVisible();
    await page.getByTestId("onboarding-submit").click();

    // Debe aterrizar en el dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    // Si aparece el tutorial de OpenRouter (perfil sin clave IA), cerrarlo antes de continuar
    const tutorialClose = page.getByTestId("openrouter-tutorial-close");
    if (await tutorialClose.isVisible()) {
      await tutorialClose.click();
    }

    // El dashboard debe mostrar el nombre del canal en el saludo
    await expect(page.getByRole("heading", { name: /Canal de Pruebas E2E/ })).toBeVisible();
  });
});
