# Observación de clase (dirección escolar con IA, versión 0)

Herramienta para observar una clase **a mano** y generar una **devolución para el docente**: quién habla y cuánto, qué preguntas se hacen (abiertas o cerradas), cuánto se espera la respuesta después de preguntar y cuántas veces el docente retoma una idea de un alumno.

Es el primer paso de la idea "dirección escolar impulsada por IA y wearables", recortado a lo que se puede hacer hoy sin grabar a nadie: los mismos indicadores que miden las herramientas de análisis de audio de clase, registrados por una persona.

## Por qué

La idea original propone anteojos que graban la clase y una IA que audita al docente y reporta a la dirección. El análisis de la idea marcó tres ajustes: **audio antes que video**, **el reporte primero para el docente** (para mejorar, no para sancionar) y **definir qué se mide y qué no**. Esta herramienta aplica los tres y sirve para diseñar el piloto: si los indicadores no son útiles a mano, automatizarlos no los va a volver útiles.

## Instalación

No hace falta instalar nada. Es una página estática sin dependencias. Para correr los tests hace falta Node 18 o más nuevo.

## Uso

Abrí `index.html` con doble clic.

**Observar una clase:** apretá **Empezar** y, durante la clase, marcá quién habla (Docente, Alumnos, Silencio) y cada pregunta del docente (abierta o cerrada) o cada vez que retoma una idea de un alumno. Hay atajos de teclado: D, A, S, Q (pregunta abierta), C (pregunta cerrada) y R (retoma). **Deshacer último** corrige un error. Al final, **Terminar**.

Ejemplo con la clase inventada que trae la página:

1. Apretá **Cargar clase de ejemplo** (10 minutos).
2. El reporte muestra: el docente ocupó el **82 %** del tiempo de habla; hubo **6 preguntas (2 abiertas)**; la espera promedio fue de **1,9 s**; hubo **2 retomas**. La barra reparte el tiempo total: docente 70 %, alumnos 15 % y silencio 15 %.
3. En **Preguntas para pensar** aparecen cinco, todas en forma de pregunta: el tiempo de habla, las preguntas cerradas, la espera (con la referencia a Rowe, 1974), la pregunta que quedó sin respuesta de los alumnos y las retomas.
4. **Imprimir** deja el reporte listo para entregar; **Exportar JSON** guarda los eventos, las métricas y la devolución.

## Cómo funciona

- La observación es una lista de eventos con su segundo. Los cambios de "quién habla" se convierten en tramos de tiempo.
- **Porcentaje del docente** = tiempo del docente / (tiempo del docente + tiempo de los alumnos). El silencio no cuenta como habla.
- **Espera:** para cada pregunta, el tiempo hasta que empiezan a hablar los alumnos, siempre que sea antes de la pregunta siguiente. Si no hablan, cuenta como "sin respuesta de los alumnos".
- **Devolución:** reglas simples con umbrales (por ejemplo, docente por encima del 70 %, espera menor a 3 s, menos de un tercio de preguntas abiertas). Lo que sale bien va a "Lo que salió bien" y lo demás se formula como una pregunta para el docente, nunca como un puntaje.
- Para menos de un minuto de observación no da devolución.

La lógica está en `src/observacion.js`, sin DOM, y se testea con:

```bash
npm test
```

## Limitaciones

- Los indicadores y umbrales son propios y simples, **no una rúbrica validada**. Para un piloto conviene adoptar un marco validado, como CLASS o el *Framework for Teaching* de Charlotte Danielson.
- Depende de que quien observa marque bien y a tiempo; la espera se mide con la precisión de un clic.
- No mide si lo enseñado es correcto, el clima del aula ni qué aprendió cada alumno.
- No graba ni usa IA. Los datos quedan en la pestaña: al recargar se pierden, salvo que exportes el JSON.

## Próximos pasos

- Elegir la rúbrica validada y mapear estos indicadores a sus dimensiones.
- Piloto con 2 o 3 docentes voluntarios, solo audio y con el reporte para ellos.
- Revisar el marco legal: consentimiento de familias y docentes (Ley 25.326 y Ley 26.061).
- Recién después, automatizar con análisis de audio: transcripción y detección de preguntas.

## Licencia

MIT
