// demo.test.mjs — T023: cuenta demo sandbox (POST /api/auth/demo), aislamiento y purga.
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./helpers.mjs";
import { purgeDemoUsers } from "../src/db.js";

const cookieDe = (r) => r.setCookie.split(";")[0];

test("demo: cuenta sandbox con datos sembrados", async (t) => {
  const { call, close } = await boot();
  t.after(close);
  let cookie;
  let videos;

  await t.test("POST /api/auth/demo crea usuario efímero con sesión", async () => {
    const r = await call("POST", "/api/auth/demo");
    assert.equal(r.status, 201);
    assert.ok(r.body.id.startsWith("demo-"));
    assert.equal(r.body.nombre, "Cuenta demo");
    assert.equal(r.body.email, null);
    assert.equal(r.body.modo, "cuenta");
    assert.equal(r.body.esDemo, true);
    assert.ok(r.setCookie?.includes("ct_session="));
    cookie = cookieDe(r);
  });

  await t.test("GET /api/auth/me expone esDemo", async () => {
    const me = await call("GET", "/api/auth/me", undefined, { cookie });
    assert.equal(me.status, 200);
    assert.equal(me.body.esDemo, true);
    assert.equal(me.body.modo, "cuenta");
    const local = await call("GET", "/api/auth/me");
    assert.equal(local.body.esDemo, false);
  });

  await t.test("perfil listo (sin onboarding) con el canal del seed", async () => {
    const r = await call("GET", "/api/profile", undefined, { cookie });
    assert.equal(r.status, 200);
    assert.equal(r.body.canalNombre, "Recetas en 15");
    assert.equal(r.body.nicho, "cocina rápida para gente sin tiempo");
    assert.equal(r.body.tieneCanalYa, true);
    assert.equal(r.body.gestionMulticanal, true);
  });

  await t.test("2 canales: principal por defecto + secundario", async () => {
    const r = await call("GET", "/api/canales", undefined, { cookie });
    assert.equal(r.status, 200);
    assert.equal(r.body.length, 2);
    assert.equal(r.body[0].nombre, "Recetas en 15");
    assert.equal(r.body[0].esPorDefecto, true);
    assert.equal(r.body[1].nombre, "Repostería fácil");
  });

  await t.test("6 vídeos en etapas variadas y reparto por canal", async () => {
    const r = await call("GET", "/api/videos", undefined, { cookie });
    assert.equal(r.status, 200);
    assert.equal(r.body.length, 6);
    videos = r.body;
    const estados = videos.map((v) => v.estado).sort();
    assert.deepEqual(estados, ["guion", "guion", "idea", "optimizacion", "publicado", "publicado"]);
    const canales = new Set(videos.map((v) => v.canalId));
    assert.equal(canales.size, 2);
    const publicados = videos.filter((v) => v.publishedAt);
    assert.equal(publicados.length, 3);
  });

  await t.test("snapshots de métricas sembrados (> 0, con progresión)", async () => {
    const resumen = await call("GET", "/api/metricas/resumen", undefined, { cookie });
    assert.ok(resumen.body.videosConMetricas >= 2);
    assert.ok(resumen.body.vistasTotales > 0);
    const publicado = videos.find((v) => v.estado === "publicado" && v.metricasIds.length >= 3);
    const serie = await call("GET", `/api/metricas/video/${publicado.id}`, undefined, { cookie });
    assert.ok(serie.body.length >= 2);
    assert.ok(serie.body.at(-1).vistas > serie.body[0].vistas);
  });

  await t.test("progreso del curso y viabilidad completados", async () => {
    const progreso = await call("GET", "/api/curso/progreso", undefined, { cookie });
    const completadas = progreso.body.filter((p) => p.completado);
    assert.ok(completadas.length >= 6);
    assert.ok(completadas.some((p) => p.notaPersonal.length > 0));
    const viab = await call("GET", "/api/viabilidad", undefined, { cookie });
    assert.equal(viab.body.completado, true);
  });

  await t.test("aislamiento: cada demo tiene sus datos; el modo local no ve nada", async () => {
    const otra = await call("POST", "/api/auth/demo");
    assert.equal(otra.status, 201);
    assert.notEqual(otra.body.id, undefined);
    const cookie2 = cookieDe(otra);
    const videos2 = await call("GET", "/api/videos", undefined, { cookie: cookie2 });
    assert.equal(videos2.body.length, 6);
    const ids1 = new Set(videos.map((v) => v.id));
    for (const v of videos2.body) assert.ok(!ids1.has(v.id), "los vídeos de cada demo son distintos");
    const locales = await call("GET", "/api/videos");
    assert.equal(locales.body.length, 0);
  });
});

test("demo: purga de cuentas con más de 7 días", async (t) => {
  const { call, app, close } = await boot();
  t.after(close);
  const db = app.locals.db;

  const vieja = await call("POST", "/api/auth/demo");
  const nueva = await call("POST", "/api/auth/demo");
  const idVieja = vieja.body.id;
  const idNueva = nueva.body.id;

  // Envejecer la primera cuenta 8 días.
  const hace8dias = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
  await db.run("UPDATE users SET createdAt=? WHERE id=?", [hace8dias, idVieja]);

  const purgadas = await purgeDemoUsers(db);
  assert.equal(purgadas, 1);

  // La vieja desaparece con TODOS sus datos; la nueva queda intacta.
  assert.equal(await db.get("SELECT 1 FROM users WHERE id=?", [idVieja]), null);
  for (const tbl of ["profile", "videos", "channels", "course_progress", "metric_snapshots", "viabilidad"]) {
    const resto = await db.all(`SELECT 1 FROM ${tbl} WHERE userId=?`, [idVieja]);
    assert.equal(resto.length, 0, `${tbl} purgada`);
  }
  assert.ok(await db.get("SELECT 1 FROM users WHERE id=?", [idNueva]));
  const videosNueva = await db.all("SELECT 1 FROM videos WHERE userId=?", [idNueva]);
  assert.equal(videosNueva.length, 6);

  // Una sesión de la cuenta purgada vuelve a comportarse como vacía (perfil 404 → onboarding).
  const cookieVieja = vieja.setCookie.split(";")[0];
  const perfil = await call("GET", "/api/profile", undefined, { cookie: cookieVieja });
  assert.equal(perfil.status, 404);

  // Segunda pasada: idempotente, nada que purgar.
  assert.equal(await purgeDemoUsers(db), 0);
});
