const test = require("node:test");
const assert = require("node:assert/strict");
const O = require("../src/observacion.js");

const cerca = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

test("tiempo de habla de la clase de ejemplo", () => {
  const m = O.metricas(O.ejemplo());
  assert.equal(m.duracion, 600);
  cerca(m.habla.docente, 419.5);
  cerca(m.habla.alumnos, 90.5);
  cerca(m.habla.nadie, 90);
  cerca(m.porcentajeDocente, 419.5 / 510);
});

test("preguntas, esperas y retomas de la clase de ejemplo", () => {
  const m = O.metricas(O.ejemplo());
  assert.equal(m.preguntas, 6);
  assert.equal(m.abiertas, 2);
  assert.equal(m.cerradas, 4);
  assert.deepEqual(m.esperas, [1.5, 4, 1, 2, 1]);
  cerca(m.esperaPromedio, 1.9);
  assert.equal(m.esperasCortas, 4);
  assert.equal(m.sinRespuesta, 1, "la pregunta de t = 260 la contestó el docente");
  assert.equal(m.retomas, 2);
});

test("la devolución habla en preguntas y nombra lo que salió bien", () => {
  const d = O.devolucion(O.metricas(O.ejemplo()));
  assert.ok(d.preguntas.some((p) => /82\s%/u.test(p)), "tiempo de habla del docente");
  assert.ok(d.preguntas.some((p) => p.includes("Rowe")), "tiempo de espera");
  assert.ok(d.preguntas.some((p) => p.includes("sin que hablaran")), "pregunta sin respuesta");
  assert.ok(d.preguntas.every((p) => p.includes("?")), "todas terminan en pregunta");
});

test("una clase con muchas preguntas abiertas y buena espera recibe fortalezas", () => {
  const s = O.nueva();
  O.registrar(s, 0, "habla:docente");
  for (let k = 0; k < 4; k++) {
    const t = 20 + k * 30;
    O.registrar(s, t, "pregunta:abierta");
    O.registrar(s, t + 4, "habla:alumnos");
    O.registrar(s, t + 20, "retoma");
    O.registrar(s, t + 25, "habla:docente");
  }
  O.terminar(s, 160);
  const d = O.devolucion(O.metricas(s));
  assert.equal(d.fortalezas.length, 4);
});

test("los eventos tienen que ir en orden y de un tipo conocido", () => {
  const s = O.nueva();
  O.registrar(s, 10, "habla:docente");
  assert.throws(() => O.registrar(s, 5, "habla:alumnos"));
  assert.throws(() => O.registrar(s, 11, "grito"));
});

test("deshacer saca el último evento y reabre una sesión terminada", () => {
  const s = O.nueva();
  O.registrar(s, 0, "habla:docente");
  O.registrar(s, 5, "retoma");
  O.terminar(s, 10);
  assert.equal(O.deshacer(s).tipo, "retoma");
  assert.equal(s.fin, null);
  assert.equal(s.eventos.length, 1);
});

test("una observación muy corta no alcanza para una devolución", () => {
  const s = O.nueva();
  O.registrar(s, 0, "habla:docente");
  O.terminar(s, 30);
  assert.match(O.devolucion(O.metricas(s)).preguntas[0], /menos de un minuto/);
});
