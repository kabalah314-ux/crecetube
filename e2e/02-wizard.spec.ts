// Spec 02 — Wizard: creación perezosa, autosave y checklist manual (02 §2.3, §2.4.1)
// Depende de que 01-onboarding haya creado el perfil (BD compartida en el mismo run).
import { test, expect } from "@playwright/test";

test.describe("Wizard — creación perezosa y persistencia", () => {
  test("crear vídeo desde /videos/nuevo, verificar autosave y persistencia del título", async ({ page }) => {
    // Ir a la ruta de nuevo vídeo (requiere perfil en la BD, creado por 01)
    await page.goto("/videos/nuevo");
    await expect(page.getByTestId("field-titulo-idea")).toBeVisible({ timeout: 10_000 });

    // Escribir el título — la creación perezosa se dispara al presionar Enter
    const titulo = "Cómo grabar audio profesional sin equipo caro";
    await page.getByTestId("field-titulo-idea").fill(titulo);
    await page.getByTestId("field-titulo-idea").press("Enter");

    // La URL debe cambiar a /videos/:id/wizard/idea (creación perezosa: POST /api/videos)
    // El id es un UUID, no un número
    await expect(page).toHaveURL(/\/videos\/.+\/wizard\/idea/, { timeout: 15_000 });

    // Editar el campo en el wizard para disparar el autosave (debounce 800ms)
    // El campo ya tiene el título de la creación; modificarlo y esperar "Guardado ✓"
    await expect(page.getByTestId("field-titulo-idea")).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("field-titulo-idea").fill(titulo + " — versión editada");

    // Esperar a que aparezca el indicador de guardado
    await expect(page.getByTestId("autosave-indicator")).toContainText("Guardado", { timeout: 10_000 });

    // Guardar la URL para volver después de recargar
    const url = page.url();

    // Recargar la página y verificar que el título persiste
    await page.reload();
    await expect(page).toHaveURL(url);

    // El campo tituloIdea debe contener el título guardado
    await expect(page.getByTestId("field-titulo-idea")).toHaveValue(titulo + " — versión editada", { timeout: 10_000 });
  });

  test("marcar un ítem manual del checklist y verificar que persiste tras recarga", async ({ page }) => {
    // Navegar a la lista de vídeos y continuar con el primero
    await page.goto("/videos");
    await expect(page.getByTestId("video-card-continue").first()).toBeVisible({ timeout: 10_000 });

    // Obtener la URL del wizard antes de hacer clic
    await page.getByTestId("video-card-continue").first().click();
    // El id es un UUID, no un número
    await expect(page).toHaveURL(/\/videos\/.+\/wizard\//, { timeout: 10_000 });

    // Navegar explícitamente a la etapa idea (tiene un ítem manual: "idea-validada-3-fuentes")
    await page.getByTestId("wizard-step-idea").click();
    await expect(page).toHaveURL(/\/wizard\/idea/);

    const checkboxTestId = "checklist-idea-idea-validada-3-fuentes";
    const checkbox = page.getByTestId(checkboxTestId);
    await expect(checkbox).toBeVisible();

    // Asegurarnos de que parte sin marcar
    await expect(checkbox).not.toBeChecked();

    // Marcar el ítem manual y esperar la respuesta del servidor (PATCH /api/videos/:id/checklist)
    const patchPromesa = page.waitForResponse((resp) => resp.url().includes("/checklist") && resp.request().method() === "PATCH");
    await checkbox.check();
    await expect(checkbox).toBeChecked();
    await patchPromesa;

    // Guardar la URL para volver después de recargar
    const url = page.url();

    // Recargar y verificar persistencia
    await page.reload();
    await expect(page).toHaveURL(url);
    await expect(page.getByTestId(checkboxTestId)).toBeChecked({ timeout: 10_000 });
  });
});
