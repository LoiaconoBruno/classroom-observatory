// Servidor mínimo de la escuela (Cloudflare Worker): guarda la key de la API de Anthropic
// como secreto y atiende solo las tres tareas de la herramienta. Ver worker/README.md.
import Anthropic from "@anthropic-ai/sdk";
import { manejar } from "./manejador.js";
import { ErrorTarea } from "./tareas.js";

export default {
  async fetch(request, env) {
    const cliente = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, baseURL: env.ANTHROPIC_BASE_URL || undefined, maxRetries: 2 });
    const llamar = async (pedido) => {
      try {
        return await cliente.beta.messages.create(pedido);
      } catch (e) {
        if (e instanceof Anthropic.AuthenticationError) throw new ErrorTarea("La key de la API del servidor no es válida", 500);
        if (e instanceof Anthropic.RateLimitError) throw new ErrorTarea("La cuenta de la API llegó a su límite de pedidos", 429);
        if (e instanceof Anthropic.BadRequestError) throw new ErrorTarea("La API rechazó el pedido", 502);
        if (e instanceof Anthropic.APIError) throw new ErrorTarea(e.status ? `La API respondió con un error (${e.status})` : "No se pudo conectar con la API", 502);
        throw e;
      }
    };
    return manejar(request, env, { llamar });
  },
};
