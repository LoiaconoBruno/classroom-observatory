// Manejo de un pedido: origen permitido, código de acceso, límite de pedidos, tamaño,
// validación y llamada a la IA. La llamada se recibe como función para poder probarlo
// sin red ni key (ver test/).
import { validarPaquete, construirPedido, interpretar, ErrorTarea, LIMITES } from "./tareas.js";

// Compara el código sin que el tiempo de respuesta delate cuántos caracteres coinciden.
async function mismoCodigo(a, b) {
  const hash = async (s) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
  const [x, y] = await Promise.all([hash(a), hash(b)]);
  let dif = 0;
  for (let i = 0; i < x.length; i++) dif |= x[i] ^ y[i];
  return dif === 0;
}

export async function manejar(request, env, { llamar }) {
  const origen = request.headers.get("Origin") || "";
  const permitidos = String(env.ORIGENES_PERMITIDOS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const permitido = permitidos.includes(origen);
  const cors = permitido
    ? { "Access-Control-Allow-Origin": origen, "Access-Control-Allow-Headers": "content-type, x-codigo-acceso", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Max-Age": "86400", Vary: "Origin" }
    : { Vary: "Origin" };
  const responder = (estado, cuerpo) => new Response(JSON.stringify(cuerpo), { status: estado, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...cors } });

  if (request.method === "OPTIONS") return new Response(null, { status: permitido ? 204 : 403, headers: cors });
  if (!permitido) return responder(403, { error: "Origen no permitido" });
  if (request.method !== "POST") return responder(405, { error: "Solo se acepta POST" });
  if (!env.CODIGO_ACCESO || !env.ANTHROPIC_API_KEY) return responder(500, { error: "El servidor no está configurado: faltan secretos" });
  if (!(await mismoCodigo(request.headers.get("x-codigo-acceso") || "", env.CODIGO_ACCESO))) return responder(401, { error: "Código de acceso incorrecto" });
  if (env.LIMITE) {
    const { success } = await env.LIMITE.limit({ key: request.headers.get("CF-Connecting-IP") || "sin-ip" });
    if (!success) return responder(429, { error: "Demasiados pedidos por minuto" });
  }

  const texto = await request.text();
  if (new TextEncoder().encode(texto).length > LIMITES.bytes) return responder(413, { error: `El pedido supera los ${LIMITES.bytes} bytes` });
  let paquete;
  try { paquete = JSON.parse(texto); } catch { return responder(400, { error: "El cuerpo no es JSON" }); }
  const error = validarPaquete(paquete);
  if (error) return responder(400, { error });

  try {
    const mensaje = await llamar(construirPedido(paquete, { modelo: env.MODELO || "claude-opus-5-5" }));
    const uso = mensaje.usage ? { entrada: mensaje.usage.input_tokens, salida: mensaje.usage.output_tokens } : null;
    return responder(200, { resultado: interpretar(paquete.tarea, mensaje, paquete), modelo: mensaje.model, uso });
  } catch (e) {
    if (e instanceof ErrorTarea) return responder(e.estado, { error: e.message });
    return responder(502, { error: "No se pudo consultar a la IA" });
  }
}
