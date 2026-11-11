// Plano del aula y participación por alumno.
const test = require("node:test");
const assert = require("node:assert/strict");
const O = require("../src/observacion.js");
const P = require("../src/plano.js");

test("plano: grilla con hasta 30 alumnos, etiquetas cortas y sin repetir", () => {
  const p = P.nuevo(5, 6);
  assert.equal(p.lugares.length, 30);
  assert.equal(P.ocupados(p).length, 30);
  assert.throws(() => P.alternar(P.alternar(p, "L30"), "L30") && P.alternar(P.nuevo(6, 6, 30), "L31"), /hasta 30/);
  const q = P.nuevo(4, 6, 20);
  assert.equal(P.ocupados(q).length, 20);
  P.etiquetar(q, "L1", "m.g.");
  assert.equal(q.lugares[0].etiqueta, "MG");
  assert.throws(() => P.etiquetar(q, "L2", "MG"), /Ya hay/);
  assert.throws(() => P.etiquetar(q, "L2", "Martina"), /sin nombres/);
  assert.throws(() => P.nuevo(9, 6), /entre 1 y 8 filas/);
  assert.deepEqual(P.validar(q), []);
});

test("plano: desocupar y volver a ocupar un lugar le da el primer número libre", () => {
  const p = P.nuevo(2, 3, 6);
  P.alternar(p, "L2");
  assert.equal(p.lugares[1].ocupado, false);
  P.etiquetar(p, "L3", "AB");
  P.alternar(p, "L2");
  assert.equal(p.lugares[1].ocupado, true);
  assert.equal(p.lugares[1].etiqueta, "2");
});

test("participación de la clase de ejemplo", () => {
  const m = O.metricas(O.ejemplo());
  const p = m.participacion;
  assert.equal(p.presentes, 20);
  assert.equal(p.participaron, 6);
  assert.equal(p.porcentaje, 0.3);
  assert.equal(p.nunca.length, 14);
  assert.ok(p.nunca.includes("1") && !p.nunca.includes("3"));
  assert.equal(p.total, 8);
  assert.equal(p.intervenciones.L3, 2);
  assert.equal(p.intervenciones.L8, 2, "vuelve a hablar después de L12: dos intervenciones");
  assert.equal(p.gini, 0.75);
  assert.equal(p.tresPrimeros, 5 / 8);
  assert.equal(p.segundos.L8, (133 - 124) + (152 - 141), "la retoma no cambia quién habla");
});

test("el habla de un alumno cuenta como habla de los alumnos y como respuesta a la pregunta", () => {
  const m = O.metricas(O.ejemplo());
  assert.equal(m.habla.alumnos, 90.5, "igual que si se marcara al grupo");
  assert.deepEqual(m.esperas, [1.5, 4, 1, 2, 1]);
});

test("tocar dos veces al mismo alumno seguido es una sola intervención", () => {
  const s = O.nueva(P.nuevo(1, 3, 3));
  O.registrar(s, 0, "habla:docente");
  O.registrar(s, 5, "habla:alumno", { alumno: "L1" });
  O.registrar(s, 6, "habla:alumno", { alumno: "L1" });
  O.registrar(s, 10, "habla:docente");
  O.terminar(s, 20);
  const p = O.metricas(s).participacion;
  assert.equal(p.intervenciones.L1, 1);
  assert.equal(p.segundos.L1, 5);
});

test("no se puede marcar un lugar vacío ni un alumno sin plano", () => {
  const plano = P.nuevo(1, 3, 2);
  const s = O.nueva(plano);
  assert.throws(() => O.registrar(s, 1, "habla:alumno", { alumno: "L3" }), /no tiene alumno/);
  assert.throws(() => O.registrar(O.nueva(), 1, "habla:alumno", { alumno: "L1" }), /plano/);
});

test("gini: 0 si todos hablan igual, alto si habla uno solo", () => {
  assert.equal(O.gini([2, 2, 2, 2]), 0);
  assert.equal(O.gini([4, 0, 0, 0]), 0.75);
  assert.equal(O.gini([0, 0]), 0);
});

test("la devolución pregunta por la participación y la concentración", () => {
  const d = O.devolucion(O.metricas(O.ejemplo()));
  assert.ok(d.preguntas.some((x) => x.includes("Hablaron 6 de 20 alumnos")));
  assert.ok(d.preguntas.some((x) => /63\s%/u.test(x)));
  assert.ok(d.preguntas.every((x) => x.trim().endsWith("?")));
});

test("el texto de las preguntas se guarda recortado", () => {
  const s = O.nueva();
  O.registrar(s, 0, "pregunta:abierta", { texto: "  ¿Por qué?  " });
  O.registrar(s, 1, "pregunta:cerrada", { texto: "x".repeat(500) });
  assert.equal(s.eventos[0].texto, "¿Por qué?");
  assert.equal(s.eventos[1].texto.length, O.LARGO_TEXTO);
});
