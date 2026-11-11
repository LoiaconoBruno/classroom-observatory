// Catálogo de evidencia, relación con el Framework for Teaching y cliente de la IA.
const test = require("node:test");
const assert = require("node:assert/strict");
const Ev = require("../src/evidencia.js");
const R = require("../src/rubrica.js");
const IA = require("../src/ia.js");
const O = require("../src/observacion.js");
const T = require("../src/transcripcion.js");

test("evidencia: ids únicos, DOI y texto propio para cada estudio", () => {
  assert.equal(new Set(Ev.ids()).size, Ev.CATALOGO.length);
  for (const e of Ev.CATALOGO) {
    assert.match(e.url, /^https:\/\/doi\.org\/10\./, e.id);
    assert.ok(e.encontro.length > 40 && e.practica.length > 20, e.id);
  }
  const prompt = JSON.stringify(Ev.paraPrompt());
  assert.doesNotMatch(prompt, /doi\.org|Rowe|Tobin/, "la IA ve ids, no referencias para copiar");
});

test("rúbrica: cada indicador apunta a componentes existentes del dominio 3", () => {
  const ids = new Set(R.COMPONENTES.map((c) => c.id));
  for (const r of R.RELACIONES) for (const c of r.componentes) assert.ok(ids.has(c), `${r.indicador} → ${c}`);
  assert.equal(R.relaciones(O.metricas(O.ejemplo())).length, 7);
  assert.equal(R.relaciones(O.metricas(O.nueva())).length, 5, "sin plano, no hay participación");
  assert.match(R.MARCO.url, /^https:\/\/danielsongroup\.org\//);
});

test("cliente de la IA: manda el código, no una key, y explica los errores", async () => {
  const llamadas = [];
  const f = (estado, cuerpo) => async (url, init) => { llamadas.push({ url, init }); return { ok: estado === 200, status: estado, json: async () => cuerpo }; };
  const r = await IA.pedir({ url: "https://obs.ejemplo.workers.dev", codigo: " escuela ", paquete: { tarea: "clasificar", preguntas: ["¿Se entiende?"] }, fetch: f(200, { resultado: { clasificacion: [] }, modelo: "claude-opus-5-5" }) });
  assert.equal(r.modelo, "claude-opus-5-5");
  assert.equal(llamadas[0].init.headers["x-codigo-acceso"], "escuela");
  assert.equal(JSON.parse(llamadas[0].init.body).tarea, "clasificar");
  assert.equal(Object.keys(llamadas[0].init.headers).some((h) => /api-key|authorization/i.test(h)), false);
  await assert.rejects(IA.pedir({ url: "https://obs.ejemplo.workers.dev", codigo: "x", paquete: {}, fetch: f(401, { error: "Código de acceso incorrecto" }) }), /código de acceso no es correcto/);
  await assert.rejects(IA.pedir({ url: "http://obs.ejemplo.com", codigo: "x", paquete: {} }), /https/);
  await assert.rejects(IA.pedir({ url: "https://obs.ejemplo.workers.dev", codigo: "", paquete: {} }), /código/);
});

test("las citas salen del catálogo; un id desconocido se descarta", () => {
  const p = IA.conCitas([{ practica: "a", evidencia: "rowe1974" }, { practica: "b", evidencia: "inventado2025" }], Ev);
  assert.equal(p.length, 1);
  assert.equal(p[0].fuente.cita, "Rowe, 1974");
});

test("transcripción: encuentra las preguntas del texto, sin repetir", () => {
  const texto = "Hoy vemos la flotación. ¿Por qué flota un barco de hierro? Piénsenlo. Alguien quiere explicar su idea? ¿Por qué flota un barco de hierro?";
  assert.deepEqual(T.preguntas(texto), ["¿Por qué flota un barco de hierro?", "Alguien quiere explicar su idea?"]);
  assert.deepEqual(T.preguntas("Sin preguntas acá."), []);
  assert.equal(T.MODELO, "onnx-community/whisper-base");
});
