// Persistencia, con el almacén en memoria (el de IndexedDB tiene el mismo contrato y se prueba en el navegador).
const test = require("node:test");
const assert = require("node:assert/strict");
const A = require("../src/almacen.js");
const O = require("../src/observacion.js");

test("docentes y su historial de observaciones, ordenado por fecha", async () => {
  const al = A.crear(A.memoria());
  const ana = await al.docentes.guardar({ alias: "  Prof. Ana  " });
  const beto = await al.docentes.guardar({ alias: "Beto" });
  assert.equal(ana.alias, "Prof. Ana");
  assert.deepEqual((await al.docentes.listar()).map((d) => d.alias), ["Beto", "Prof. Ana"]);
  await al.observaciones.guardar({ docenteId: ana.id, fecha: "2026-11-08T10:00:00Z", sesion: O.ejemplo() });
  await al.observaciones.guardar({ docenteId: ana.id, fecha: "2026-11-01T10:00:00Z", sesion: O.ejemplo() });
  await al.observaciones.guardar({ docenteId: beto.id, fecha: "2026-11-02T10:00:00Z", sesion: O.ejemplo() });
  const hist = await al.observaciones.deDocente(ana.id);
  assert.deepEqual(hist.map((o) => o.fecha.slice(0, 10)), ["2026-11-01", "2026-11-08"]);
  assert.equal(O.metricas(hist[0].sesion).participacion.participaron, 6, "la sesión se guarda completa");
  await al.docentes.borrar(ana.id);
  assert.equal((await al.observaciones.deDocente(ana.id)).length, 0, "borrar un docente borra sus observaciones");
  assert.equal((await al.observaciones.deDocente(beto.id)).length, 1);
});

test("validaciones al guardar", async () => {
  const al = A.crear(A.memoria());
  await assert.rejects(al.docentes.guardar({ alias: "  " }), /alias/);
  await assert.rejects(al.docentes.guardar({ alias: "x".repeat(41) }), /40/);
  await assert.rejects(al.observaciones.guardar({ sesion: O.nueva() }), /docente/);
});

test("exportar no incluye el código de acceso; importar y borrar todo", async () => {
  const al = A.crear(A.memoria());
  const d = await al.docentes.guardar({ alias: "Ana" });
  await al.observaciones.guardar({ docenteId: d.id, sesion: O.ejemplo() });
  await al.ajustes.escribir("iaActiva", true);
  await al.ajustes.escribir("codigoAcceso", "secreto-de-la-escuela");
  const json = await al.exportar();
  assert.equal(json.formato, "observatorio-de-clase");
  assert.equal(json.docentes.length, 1);
  assert.equal(json.observaciones.length, 1);
  assert.deepEqual(json.ajustes.map((a) => a.clave), ["iaActiva"]);
  assert.doesNotMatch(JSON.stringify(json), /secreto-de-la-escuela/);

  await al.borrarTodo();
  assert.equal((await al.docentes.listar()).length, 0);
  assert.equal(await al.ajustes.leer("codigoAcceso", "nada"), "nada");

  const otro = A.crear(A.memoria());
  assert.deepEqual(await otro.importar(json), { docentes: 1, observaciones: 1 });
  assert.equal((await otro.observaciones.deDocente(d.id)).length, 1);
  assert.equal(await otro.ajustes.leer("iaActiva"), true);
  await assert.rejects(otro.importar({ formato: "otra cosa" }), /No es una exportación/);
});
