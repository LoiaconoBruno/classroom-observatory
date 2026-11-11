# Servidor de la escuela (Cloudflare Worker)

Un servidor mínimo para que el Observatorio de clase use la IA **sin poner una key de API en cada dispositivo**. Hace tres cosas:

- Guarda la key de la API de Anthropic como secreto de Cloudflare.
- Acepta pedidos solo desde la página de la herramienta (por defecto, `https://loiaconobruno.github.io`) y solo con el código de acceso de la escuela.
- Atiende solo tres tareas, con instrucciones que arma el propio servidor: devolución con prácticas respaldadas por estudios, clasificación de preguntas y evolución de un docente. El código de acceso no sirve para usar la key en otra cosa.

Lo que recibe son métricas y texto anonimizado: nunca nombres, etiquetas del plano ni audio. La página muestra cada pedido completo antes de mandarlo.

## Costo

- **Cloudflare:** el plan gratuito de Workers incluye 100.000 pedidos por día y 10 ms de CPU por pedido; la espera de la respuesta de la API no cuenta como CPU ([precios](https://developers.cloudflare.com/workers/platform/pricing/), [límites](https://developers.cloudflare.com/workers/platform/limits/)). Para una escuela chica alcanza de sobra.
- **API de Anthropic:** se paga por uso. Con Claude Opus 5.5 (US$4 por millón de tokens de entrada y US$20 por millón de salida, según la [página de precios](https://platform.claude.com/docs/en/about-claude/pricing) en noviembre de 2026), las tres tareas de una clase cuestan, en una estimación holgada, unos US$0,12. Con Claude Haiku 5.5, unos US$0,003.

## Instalar (una vez)

Hace falta Node 22, una cuenta de Cloudflare (gratuita) y una key de la API de Anthropic. Conviene ponerle a la key un límite de gasto en la consola de Anthropic.

1. Desde esta carpeta, instalá las dependencias:

   ```bash
   npm install
   ```

2. Iniciá sesión en Cloudflare (abre el navegador):

   ```bash
   npx wrangler login
   ```

3. Cargá la key de la API (la pide sin mostrarla):

   ```bash
   npx wrangler secret put ANTHROPIC_API_KEY
   ```

4. Elegí un código de acceso largo y difícil de adivinar, y cargalo:

   ```bash
   npx wrangler secret put CODIGO_ACCESO
   ```

5. Publicá el servidor:

   ```bash
   npx wrangler deploy
   ```

   Al final muestra la dirección, algo como `https://observatorio-de-clase.tu-cuenta.workers.dev`.

6. En la herramienta, en **Ajustes**, activá la IA y poné esa dirección y el código de acceso.

Si la página está publicada en otra dirección, cambiá `ORIGENES_PERMITIDOS` en `wrangler.toml` (se pueden poner varias, separadas por comas). Para gastar menos, cambiá `MODELO` a `claude-haiku-5-5`. Después de cualquier cambio, volvé a correr `npx wrangler deploy`.

## Protecciones

- **Origen:** solo responde a las páginas de `ORIGENES_PERMITIDOS` (CORS).
- **Código de acceso:** se compara sin que el tiempo de respuesta delate cuántos caracteres coinciden.
- **Límite de pedidos:** 20 por minuto por dirección IP, con el [rate limiting de Workers](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).
- **Tamaño:** rechaza pedidos de más de 20.000 bytes y valida la forma de cada tarea antes de llamar a la IA.
- **Respuesta:** se queda solo con lo que respeta el formato pedido. Una práctica que cita un estudio fuera del catálogo de `src/evidencia.js` se descarta.
- **Respaldo:** con Claude Opus 5.5, si los clasificadores de seguridad rechazan un pedido, la API lo reintenta en el modelo que recomienda Anthropic (`fallbacks: "default"`). La página muestra qué modelo respondió.

## Probar en la computadora

Los tests no necesitan red ni key (la llamada a Claude es una función simulada):

```bash
node --test
```

Para levantarlo localmente con `npx wrangler dev`, creá un archivo `.dev.vars` (no se sube al repositorio) con `ANTHROPIC_API_KEY`, `CODIGO_ACCESO` y `ORIGENES_PERMITIDOS=http://localhost:8765`. `ANTHROPIC_BASE_URL` permite apuntarlo a una API simulada.
