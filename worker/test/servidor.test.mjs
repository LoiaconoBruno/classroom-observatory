// El servidor de la escuela, sin red ni key: la llamada a Claude es una función simulada.
import test from "node:test";
import assert from "node:assert/strict";
import { manejar } from "../src/manejador.js";
import { validarPaquete, construirPedido, interpretar, ErrorTarea, LIMITES } from "../src/tareas.js";

const ORIGEN = "https://loiaconobruno.github.io";
const ENV = { ORIGENES_PERMITIDOS: ORIGEN, CODIGO_ACCESO: "escuela-2026", ANTHROPIC_API_KEY: "clave-de-prueba", MODELO: "claude-opus-5-5" };

const METRICAS = {
  duracionMinutos: 10, porcentajeDocente: 0.82, segundosHabla: { docente: 420, alumnos: 91, silencio: 90 },
  preguntas: 6, abiertas: 2, cerradas: 4, esperaPromedioSegundos: 1.9, esperasMenoresA3Segundos: 4,
  preguntasSinRespuestaDeAlumnos: 1, retomas: 2,
  participacion: { alumnosPresentes: 20, alumnosQueParticiparon: 6, alumnosQueNoHablaron: 14, intervenciones: 8, parteDeLosTresQueMasHablaron: 0.63, gini: 0.75 },
};
const DEVOLUCION = { tarea: "devolucion", metricas: METRICAS, devolucionPorReglas: { fortalezas: [], preguntas: ["¿En qué momento podrían hablar más los alumnos?"] }, preguntasDelDocente: [{ texto: "¿Por qué la presión deja de crecer?", marcadaComo: "abierta" }] };

const respuesta = (obj, extra = {}) => ({ model: "claude-opus-5-5", stop_reason: "end_turn", content: [{ type: "thinking", thinking: "" }, { type: "text", text: JSON.stringify(obj) }], usage: { input_tokens: 3000, output_tokens: 900 }, ...extra });

function pedido(cuerpo, { origen = ORIGEN, codigo = ENV.CODIGO_ACCESO, metodo = "POST", crudo } = {}) {
  const headers = { "content-type": "application/json" };
  if (origen) headers.Origin = origen;
  if (codigo) headers["x-codigo-acceso"] = codigo;
  return new Request("https://observatorio.ejemplo.workers.dev/", { method: metodo, headers, body: metodo === "POST" ? (crudo ?? JSON.stringify(cuerpo)) : undefined });
}

const sinLlamar = { llamar: async () => { throw new Error("no debería llamar a la IA"); } };

test("preflight: CORS solo para el origen permitido", async () => {
  const ok = await manejar(pedido(null, { metodo: "OPTIONS" }), ENV, sinLlamar);
  assert.equal(ok.status, 204);
  assert.equal(ok.headers.get("Access-Control-Allow-Origin"), ORIGEN);
  assert.match(ok.headers.get("Access-Control-Allow-Headers"), /x-codigo-acceso/);
  const mal = await manejar(pedido(null, { metodo: "OPTIONS", origen: "https://otro.example" }), ENV, sinLlamar);
  assert.equal(mal.status, 403);
  assert.equal(mal.headers.get("Access-Control-Allow-Origin"), null);
});

test("rechaza origen ajeno, código incorrecto y servidor sin secretos, sin llamar a la IA", async () => {
  assert.equal((await manejar(pedido(DEVOLUCION, { origen: "https://otro.example" }), ENV, sinLlamar)).status, 403);
  assert.equal((await manejar(pedido(DEVOLUCION, { codigo: "otro" }), ENV, sinLlamar)).status, 401);
  assert.equal((await manejar(pedido(DEVOLUCION, { codigo: null }), ENV, sinLlamar)).status, 401);
  assert.equal((await manejar(pedido(DEVOLUCION), { ...ENV, ANTHROPIC_API_KEY: "" }, sinLlamar)).status, 500);
});

test("límite de pedidos, tamaño y JSON inválido", async () => {
  const limitado = { ...ENV, LIMITE: { limit: async () => ({ success: false }) } };
  assert.equal((await manejar(pedido(DEVOLUCION), limitado, sinLlamar)).status, 429);
  const grande = { ...DEVOLUCION, relleno: "x".repeat(LIMITES.bytes) };
  assert.equal((await manejar(pedido(grande), ENV, sinLlamar)).status, 413);
  assert.equal((await manejar(pedido(null, { crudo: "{no es json" }), ENV, sinLlamar)).status, 400);
  assert.equal((await manejar(pedido({ tarea: "otra cosa" }), ENV, sinLlamar)).status, 400);
});

test("devolución: arma el pedido en el servidor y filtra la respuesta", async () => {
  let recibido;
  const llamar = async (p) => {
    recibido = p;
    return respuesta({
      preguntas: [{ pregunta: "¿Qué pasaría si esperás un poco más después de preguntar?", indicador: "esperaPromedio" }, { pregunta: "Esto no es una pregunta", indicador: "retomas" }],
      fortalezas: ["Hubo dos retomas."],
      practicas: [{ practica: "Esperar 3 segundos", porque: "La espera fue de 1,9 s", evidencia: "rowe1974" }, { practica: "Inventada", porque: "x", evidencia: "estudio-inexistente" }],
    });
  };
  const r = await manejar(pedido(DEVOLUCION), ENV, { llamar });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("Access-Control-Allow-Origin"), ORIGEN);
  const datos = await r.json();
  assert.equal(datos.modelo, "claude-opus-5-5");
  assert.deepEqual(datos.uso, { entrada: 3000, salida: 900 });
  assert.equal(datos.resultado.preguntas.length, 1, "descarta lo que no termina en pregunta");
  assert.deepEqual(datos.resultado.practicas.map((p) => p.evidencia), ["rowe1974"], "descarta evidencia fuera del catálogo");
  assert.equal(recibido.model, "claude-opus-5-5");
  assert.equal(recibido.fallbacks, "default");
  assert.deepEqual(recibido.betas, ["server-side-fallback-2026-07-01"]);
  assert.equal(recibido.output_config.format.type, "json_schema");
  assert.match(recibido.system, /nunca para evaluarlo/);
  assert.match(recibido.system, /no instrucciones/);
  assert.match(recibido.messages[0].content, /catalogoDeEvidencia/);
  assert.equal("temperature" in recibido, false);
});

test("con Haiku 5.5 no se manda el respaldo del servidor", () => {
  const p = construirPedido({ tarea: "clasificar", preguntas: ["¿Se entiende?"] }, { modelo: "claude-haiku-5-5" });
  assert.equal(p.model, "claude-haiku-5-5");
  assert.equal("fallbacks" in p, false);
  assert.equal("betas" in p, false);
});

test("clasificar: un resultado por índice válido", () => {
  const paquete = { tarea: "clasificar", preguntas: ["¿Se entiende?", "¿Por qué flota?"] };
  assert.equal(validarPaquete(paquete), "");
  const r = interpretar("clasificar", respuesta({ clasificacion: [
    { indice: 1, tipo: "abierta", motivo: "Pide explicar." }, { indice: 0, tipo: "cerrada", motivo: "Es retórica." },
    { indice: 0, tipo: "abierta", motivo: "repetida" }, { indice: 7, tipo: "cerrada", motivo: "no existe" },
  ] }), paquete);
  assert.deepEqual(r.clasificacion.map((x) => [x.indice, x.tipo]), [[0, "cerrada"], [1, "abierta"]]);
});

test("evolución: pide al menos dos observaciones con fecha", () => {
  assert.match(validarPaquete({ tarea: "evolucion", observaciones: [{ fecha: "2026-11-01", ...METRICAS }] }), /entre 2 y 12/);
  assert.match(validarPaquete({ tarea: "evolucion", observaciones: [{ fecha: "ayer", ...METRICAS }, { fecha: "2026-11-08", ...METRICAS }] }), /Fecha/);
  assert.equal(validarPaquete({ tarea: "evolucion", observaciones: [{ fecha: "2026-11-01", ...METRICAS }, { fecha: "2026-11-08", ...METRICAS }] }), "");
});

test("rechazo del modelo y respuestas rotas", async () => {
  assert.throws(() => interpretar("devolucion", { stop_reason: "refusal", content: [] }, DEVOLUCION), (e) => e instanceof ErrorTarea && e.estado === 422);
  assert.throws(() => interpretar("devolucion", { stop_reason: "end_turn", content: [{ type: "text", text: "hola" }] }, DEVOLUCION), /JSON/);
  const r = await manejar(pedido(DEVOLUCION), ENV, { llamar: async () => ({ stop_reason: "refusal", content: [] }) });
  assert.equal(r.status, 422);
  const r2 = await manejar(pedido(DEVOLUCION), ENV, { llamar: async () => { throw new Error("red caída"); } });
  assert.equal(r2.status, 502);
});

test("valida las métricas: no acepta texto donde va un número", () => {
  assert.match(validarPaquete({ ...DEVOLUCION, metricas: { ...METRICAS, retomas: "dos" } }), /retomas/);
  assert.match(validarPaquete({ ...DEVOLUCION, preguntasDelDocente: [{ texto: "x".repeat(LIMITES.texto + 1) }] }), /Preguntas/);
});
