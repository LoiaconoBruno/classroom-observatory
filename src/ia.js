// Cliente de la IA: habla solo con el servidor de la escuela (el Worker de worker/),
// que tiene la key de la API. Desde acá viaja el paquete anonimizado de privacidad.js
// y el código de acceso de la escuela; nunca una key de API.
const IA = (() => {
  const TIEMPO_MAXIMO = 90000;

  class ErrorIA extends Error {
    constructor(mensaje, estado) { super(mensaje); this.name = "ErrorIA"; this.estado = estado; }
  }

  function validarUrl(url) {
    let u;
    try { u = new URL(String(url || "").trim()); } catch { return "Poné la dirección del servidor de la escuela (https://…)."; }
    if (u.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(u.hostname)) return "La dirección tiene que empezar con https://.";
    return "";
  }

  async function pedir({ url, codigo, paquete, fetch: f = globalThis.fetch }) {
    const error = validarUrl(url);
    if (error) throw new ErrorIA(error, 0);
    if (!codigo || !String(codigo).trim()) throw new ErrorIA("Falta el código de acceso de la escuela.", 0);
    const control = typeof AbortController !== "undefined" ? new AbortController() : null;
    const reloj = control ? setTimeout(() => control.abort(), TIEMPO_MAXIMO) : null;
    let r;
    try {
      r = await f(String(url).trim(), {
        method: "POST",
        headers: { "content-type": "application/json", "x-codigo-acceso": String(codigo).trim() },
        body: JSON.stringify(paquete),
        signal: control ? control.signal : undefined,
      });
    } catch (e) {
      throw new ErrorIA(e && e.name === "AbortError" ? "El servidor tardó demasiado. Probá de nuevo." : "No se pudo conectar con el servidor de la escuela. Revisá la dirección y la conexión.", 0);
    } finally {
      if (reloj) clearTimeout(reloj);
    }
    let datos = null;
    try { datos = await r.json(); } catch { /* sin JSON */ }
    if (!r.ok) {
      const detalle = datos && datos.error ? datos.error : `HTTP ${r.status}`;
      const motivo = r.status === 401 ? "El código de acceso no es correcto."
        : r.status === 403 ? "El servidor no acepta pedidos desde esta página."
        : r.status === 413 ? "La observación es demasiado larga para mandarla."
        : r.status === 429 ? "Se alcanzó el límite de pedidos por minuto. Esperá un momento."
        : r.status === 422 ? "El modelo no pudo responder este pedido."
        : r.status >= 500 ? "El servidor tuvo un problema. Probá en un rato."
        : "El servidor rechazó el pedido.";
      throw new ErrorIA(`${motivo} (${detalle})`, r.status);
    }
    if (!datos || !datos.resultado) throw new ErrorIA("La respuesta del servidor no trae un resultado.", r.status);
    return datos;
  }

  // Convierte los ids de evidencia de una respuesta en citas del catálogo; descarta los que no existen.
  function conCitas(practicas, catalogo) {
    return (practicas || []).map((p) => ({ ...p, fuente: catalogo.porId(p.evidencia) })).filter((p) => p.fuente);
  }

  return { ErrorIA, validarUrl, pedir, conCitas, TIEMPO_MAXIMO };
})();

if (typeof module !== "undefined") module.exports = IA;
