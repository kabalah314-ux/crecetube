import { test } from "node:test";
import assert from "node:assert/strict";
import { boot, PERFIL_OK } from "./helpers.mjs";

test("export/import: ida y vuelta sin pérdida (08 §8.8)", async (t) => {
  const a = await boot();
  const b = await boot();
  t.after(async () => {
    await a.close();
    await b.close();
  });

  // estado en la instancia A
  await a.call("POST", "/api/profile", PERFIL_OK);
  const v = (await a.call("POST", "/api/videos", { tituloIdea: "Backup test", nicho: "tech" })).body;
  await a.call("PATCH", `/api/videos/${v.id}/estado`, { estado: "publicado", publishedAt: "2026-06-01T00:00:00Z" });
  await a.call("PATCH", "/api/curso/progreso/s1_a1", { completado: true });
  const copia = (await a.call("POST", "/api/plantillas", { duplicaDe: "tpl_guion_completo" })).body;
  await a.call("POST", "/api/metricas/snapshot", { videoProjectId: v.id, fecha: "2026-06-03", vistas: 100, ctr: 4, retencionMediaPct: 40 });

  const exportado = (await a.call("GET", "/api/export")).body;
  assert.equal(exportado.version, 1);
  assert.equal(exportado.videos.length, 1);
  assert.equal(exportado.plantillasPropias.length, 1);

  await t.test("versión incompatible → 422 IMPORT_VERSION_MISMATCH", async () => {
    const r = await b.call("POST", "/api/import", { replaceAll: true, data: { ...exportado, version: 99 } });
    assert.equal(r.status, 422);
    assert.equal(r.body.code, "IMPORT_VERSION_MISMATCH");
  });

  await t.test("import replaceAll reproduce el estado en BD limpia", async () => {
    const r = await b.call("POST", "/api/import", { replaceAll: true, data: exportado });
    assert.equal(r.body.ok, true);
    assert.equal(r.body.importado.videos, 1);

    const perfil = await b.call("GET", "/api/profile");
    assert.equal(perfil.body.canalNombre, PERFIL_OK.canalNombre);
    const video = await b.call("GET", `/api/videos/${v.id}`);
    assert.equal(video.body.estado, "publicado");
    const prog = await b.call("GET", "/api/curso/progreso");
    assert.equal(prog.body.length, 1);
    const tpls = await b.call("GET", "/api/plantillas");
    assert.equal(tpls.body.length, 26); // 25 precargadas + 1 propia
    assert.ok(tpls.body.find((x) => x.id === copia.id));
    const snaps = await b.call("GET", `/api/metricas/video/${v.id}`);
    assert.equal(snaps.body.length, 1);
  });
});
