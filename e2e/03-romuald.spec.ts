// Spec 03 — Capa Romuald: TipBanner, ContextPanel y checklists de grabacion/sprint
// Depende de que 01-onboarding y 02-wizard hayan creado perfil y vídeo en la BD compartida.
import { test, expect, type Page } from "@playwright/test";

// Navega a la lista de vídeos, hace clic en "Continuar" del primero y va a la etapa indicada
async function irAEtapa(page: Page, slug: string) {
  await page.goto("/videos");
  await expect(page.getByTestId("video-card-continue").first()).toBeVisible({ timeout: 10_000 });
  await page.getByTestId("video-card-continue").first().click();
  // El id es un UUID, no un número
  await expect(page).toHaveURL(/\/videos\/.+\/wizard\//, { timeout: 10_000 });
  await page.getByTestId(`wizard-step-${slug}`).click();
  await expect(page).toHaveURL(new RegExp(`/wizard/${slug}`));
}

test.describe("Capa Romuald — TipBanner, ContextPanel y checklists", () => {
  // (a) TipBanner de la etapa idea: descartar y reabrir
  test("(a) TipBanner — descartar colapsa y reabrir restaura; localStorage sincronizado", async ({ page }) => {
    await irAEtapa(page, "idea");

    // El banner expandido debe ser visible y tener clase tip-banner (no colapsado)
    const banner = page.getByTestId("tip-banner-idea");
    await expect(banner).toBeVisible();
    await expect(banner).toHaveClass(/\btip-banner\b/);
    await expect(banner).not.toHaveClass(/tip-banner-collapsed/);

    // Descartar: clic en el botón X (tip-banner-dismiss-idea)
    await page.getByTestId("tip-banner-dismiss-idea").click();

    // El banner ahora debe tener clase tip-banner-collapsed
    await expect(banner).toHaveClass(/tip-banner-collapsed/);

    // El localStorage debe registrar el descarte
    const valorLs = await page.evaluate(() => localStorage.getItem("ct.tipbanner.idea"));
    expect(valorLs).toBe("1");

    // El span de reapertura debe ser visible dentro del elemento colapsado
    await expect(page.getByTestId("tip-banner-reopen-idea")).toBeVisible();

    // Reabrir: clic en el span interior (data-testid="tip-banner-reopen-idea")
    await page.getByTestId("tip-banner-reopen-idea").click();

    // El banner vuelve a tener clase tip-banner (expandido), ya no colapsado
    await expect(banner).toHaveClass(/\btip-banner\b/);
    await expect(banner).not.toHaveClass(/tip-banner-collapsed/);

    // El localStorage debe haber limpiado la clave (borrarDescartado la elimina)
    const valorLsRe = await page.evaluate(() => localStorage.getItem("ct.tipbanner.idea"));
    expect(valorLsRe).toBeNull();
  });

  // (b) ContextPanel: consejo Romuald visible y glosario con exactamente 9 dt
  test("(b) ContextPanel — context-consejo-romuald visible y glosario con 9 dt", async ({ page }) => {
    await irAEtapa(page, "idea");

    // El panel contextual siempre está en el DOM
    const consejoRomuald = page.getByTestId("context-consejo-romuald");
    await expect(consejoRomuald).toBeVisible();

    // El glosario Romuald: <details> con data-testid="context-glosario-romuald"
    const glosario = page.getByTestId("context-glosario-romuald");
    await expect(glosario).toBeVisible();

    // Abrir el <details> haciendo clic en el <summary> para que los dt sean accesibles
    await glosario.locator("summary").click();

    // Debe haber exactamente 9 <dt> dentro del glosario (GLOSARIO_ROMUALD tiene 9 entradas)
    const dts = glosario.locator("dt");
    await expect(dts).toHaveCount(9);
  });

  // (c-1) Etapa grabacion: 8 checkboxes; el 6º es energia-camara con "Roturas de energía"
  test("(c-1) wizard-step-grabacion → 8 checkboxes; el 6º contiene 'Roturas de energía'", async ({ page }) => {
    await irAEtapa(page, "grabacion");

    // Contar todos los checkboxes del checklist de grabacion
    const checkboxes = page.locator("[data-testid^='checklist-grabacion-']");
    await expect(checkboxes).toHaveCount(8);

    // El 6º ítem (índice 5) es energia-camara: "Roturas de energía planificadas..."
    const cbxEnergia = page.getByTestId("checklist-grabacion-energia-camara");
    await expect(cbxEnergia).toBeVisible();
    // Verificar el texto del label que contiene ese checkbox
    await expect(cbxEnergia.locator("..")).toContainText("Roturas de energía");
  });

  // (c-2) Etapa sprint: 11 checkboxes y el primero contiene "Día 1"
  test("(c-2) wizard-step-sprint → 11 checkboxes y el 1º contiene 'Día 1'", async ({ page }) => {
    await irAEtapa(page, "sprint");

    // Contar todos los checkboxes del checklist de sprint
    const checkboxes = page.locator("[data-testid^='checklist-sprint-']");
    await expect(checkboxes).toHaveCount(11);

    // El primer ítem es sin-cambios-24h: "Día 1 · Sin tocar miniatura, título ni descripción durante 24h"
    const primerCbx = page.getByTestId("checklist-sprint-sin-cambios-24h");
    await expect(primerCbx).toBeVisible();
    await expect(primerCbx.locator("..")).toContainText("Día 1");
  });
});
