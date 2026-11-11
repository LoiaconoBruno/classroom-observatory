// Lo que puede salir hacia la IA: métricas y texto anonimizado.
const test = require("node:test");
const assert = require("node:assert/strict");
const O = require("../src/observacion.js");
const Pr = require("../src/privacidad.js");

test("anonimizar: nombres, iniciales, lugares, correos, teléfonos y enlaces", () => {
  const a = (t, o) => Pr.anonimizar(t, o);
  assert.equal(a("¿Martina, por qué flota?"), "¿[nombre], por qué flota?");
  assert.equal(a("¿Qué dijo Juan Pérez sobre eso?"), "¿Qué dijo [nombre] [nombre] sobre eso?");
  assert.equal(a("¿Qué opina JP?", { etiquetas: ["JP", "12"] }), "¿Qué opina [alumno]?");
  assert.equal(a("Alumno 12, ¿qué pensás?"), "[alumno], ¿qué pensás?");
  assert.equal(a("Escribime a ana.torres@escuela.edu.ar o al 11 5555-0000"), "Escribime a [correo] o al [número]");
  assert.equal(a("Miren https://ejemplo.com/video"), "Miren [enlace]");
  assert.equal(a("¿Cuánto es 3 por 4?"), "¿Cuánto es 3 por 4?", "los números cortos quedan");
  assert.equal(a("Por qué el agua hierve a 100 grados?"), "Por qué el agua hierve a 100 grados?");
});

test("las métricas anónimas no llevan etiquetas de alumnos", () => {
  const s = O.ejemplo();
  const m = Pr.metricasAnonimas(O.metricas(s));
  const texto = JSON.stringify(m);
  assert.equal(m.participacion.alumnosQueParticiparon, 6);
  assert.equal(m.participacion.alumnosQueNoHablaron, 14);
  assert.doesNotMatch(texto, /"L\d+"|nunca|intervenciones":\{/);
});

test("el paquete de cada tarea: solo métricas y textos anonimizados", () => {
  const s = O.ejemplo();
  s.eventos.find((e) => e.texto).texto = "¿Sofía, cuánto es la densidad del arroz?";
  const m = O.metricas(s);
  const dev = Pr.paquete("devolucion", { sesion: s, metricas: m, devolucionReglas: O.devolucion(m) });
  assert.equal(dev.tarea, "devolucion");
  assert.equal(dev.preguntasDelDocente.length, 6);
  assert.equal(dev.preguntasDelDocente[0].texto, "¿[nombre], cuánto es la densidad del arroz?");
  assert.equal("plano" in dev || "sesion" in dev, false);
  const cla = Pr.paquete("clasificar", { sesion: s });
  assert.equal(cla.preguntas.length, 6);
  assert.ok(cla.preguntas.every((x) => typeof x === "string"));
  const evo = Pr.paquete("evolucion", { historial: [{ fecha: "2026-11-01T10:00:00Z", metricas: m }, { fecha: "2026-11-08T10:00:00Z", metricas: m }] });
  assert.deepEqual(evo.observaciones.map((o) => o.fecha), ["2026-11-01", "2026-11-08"]);
  assert.throws(() => Pr.paquete("otra"), /desconocida/);
});
