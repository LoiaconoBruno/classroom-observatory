# Observar una clase: paper de uso y guía de la idea

## Resumen

Este documento acompaña al **Observatorio de clase** (repositorio *classroom-observatory*), una herramienta para que una escuela chica observe clases y les dé a sus docentes una **devolución**. Mide quién habla y cuánto, qué preguntas se hacen (abiertas o cerradas), cuánto se espera la respuesta, cuántas veces el docente retoma una idea de un alumno y, con el plano del aula, cuántos alumnos participan y cuánto se concentra la palabra. Los datos quedan en el dispositivo. La IA es opcional y viene apagada: si se activa, recibe solo métricas y texto anonimizado, a través de un servidor mínimo de la escuela. El principio no cambia: la devolución es para el docente, nunca un puntaje ni una sanción.

Es el primer paso de una idea más ambiciosa, "dirección escolar impulsada por IA y wearables", recortada a lo que se puede hacer hoy sin grabar a nadie. La primera parte es un paper de uso: cómo se observa con el plano del aula, los indicadores, el ejemplo resuelto con los números de la herramienta, la IA opcional, la privacidad, la relación con un marco validado y los límites. La segunda es una guía de la idea. Recorre la tradición de observar el discurso del aula (el análisis de interacción de Ned Flanders, la secuencia pregunta-respuesta-evaluación de Hugh Mehan y Courtney Cazden, las preguntas auténticas y la "retoma" de Martin Nystrand) y la investigación sobre el tiempo de espera de Mary Budd Rowe y Kenneth Tobin. Sigue con los marcos de observación validados (CLASS de Robert Pianta, el *Framework for Teaching* de Charlotte Danielson) y lo que mostró el proyecto MET sobre su confiabilidad, y con la evidencia sobre devolución y acompañamiento docente (Hattie y Timperley, Kluger y DeNisi, Kraft, Blazar y Hogan). Cierra con los sistemas que ya automatizan estos indicadores con audio (Kelly, D'Mello y Nystrand; Demszky y colaboradores) y los riesgos de convertir la observación en vigilancia, de Foucault a la ley de Campbell, con el marco legal argentino. La tesis tiene tres ajustes a la idea original: **audio antes que video**, **el reporte primero para el docente** y **definir qué se mide y qué no**.

## Parte I. Paper de uso

### 1. Qué es la herramienta

El Observatorio de clase es una página estática sin dependencias. Se abre desde la [demo en vivo](https://loiaconobruno.github.io/classroom-observatory/) o con doble clic en `index.html`, y funciona en computadora, tablet y celular. Tiene cinco pantallas:

1. **Docentes:** la lista de docentes (con nombre o alias), cada uno con su historial, y "Ver la clase de ejemplo".
2. **Preparar:** el plano del aula, una grilla de hasta 8 × 8 con hasta 30 alumnos identificados por número o iniciales. Se recuerda para la próxima observación del mismo docente.
3. **Observar:** un reloj grande, los botones de quién habla (docente, grupo de alumnos, silencio), el plano para tocar al alumno que habla, los botones de pregunta abierta, pregunta cerrada y retoma, y atajos de teclado.
4. **Reporte:** los indicadores, la participación sobre el plano, la devolución, las preguntas registradas, la IA opcional, la evolución del docente, la relación con el *Framework for Teaching* y lo que la observación no mide. Se imprime o se guarda en PDF.
5. **Ajustes:** la IA y la transcripción local (las dos apagadas por defecto), y exportar, importar o borrar todos los datos.

Todo se guarda en el navegador, con IndexedDB, y nada sale del dispositivo salvo que se active la IA. La lógica está en archivos sin acceso al DOM: `src/observacion.js`, `src/plano.js`, `src/privacidad.js`, `src/almacen.js`, `src/evidencia.js`, `src/rubrica.js` e `src/ia.js`. El servidor de la escuela está en `worker/`. Los 36 tests se corren con `npm test`, con Node 22.

### 2. Instalación

```bash
git clone https://github.com/LoiaconoBruno/classroom-observatory.git
cd classroom-observatory
npm test
```

Después se abre `index.html` con doble clic. El servidor de la escuela, necesario solo para la IA, se instala aparte en Cloudflare, con los pasos de `worker/README.md` (sección 8.2).

### 3. Cómo se observa

1. **Consentimiento.** La primera vez que se va a guardar algo (al agregar un docente o preparar una observación), la página explica qué se guarda y qué no, cita la Ley 25.326 y la Ley 26.061, y pide confirmar dos cosas: que el docente está de acuerdo y la escuela informó a las familias, y que la devolución se va a usar para acompañar, no para calificar (sección 9).
2. **Docente.** Agregar al docente con su nombre o un alias y tocar **Observar**.
3. **Plano.** Elegir filas y columnas y tocar los lugares para ocuparlos o vaciarlos. Con "Cambiar etiqueta", cada lugar recibe un número o hasta tres iniciales: "M.G." queda como "MG", y un nombre como "Martina" se rechaza.
4. **Empezar** al comienzo de la clase. Arranca el reloj.
5. Cada vez que cambia **quién habla**, marcar Docente (D), Grupo de alumnos (A) o Silencio (S), o **tocar el lugar del alumno que habla**. Se marca el cambio, no cada frase.
6. Cada vez que el docente hace una **pregunta**, marcar abierta (Q) o cerrada (C). Aparece un campo para escribir la pregunta, opcional: Enter lo guarda y Esc lo cierra sin texto.
7. Cada vez que el docente **retoma** una idea de un alumno, marcar R.
8. **Deshacer** (Z) corrige el último evento.
9. **Terminar** al final. La observación se guarda y aparece el reporte.

| Tecla | Evento |
|---|---|
| D | Habla el docente |
| A | Habla el grupo de alumnos (a coro o sin distinguir quién) |
| S | Silencio |
| Q | Pregunta abierta |
| C | Pregunta cerrada |
| R | Retoma una idea de un alumno |
| Z | Deshacer |

En tablet y celular, los botones son grandes y los atajos no se muestran. Una sugerencia práctica: marcar la pregunta **en el momento en que termina** de formularse, no cuando empieza. Así, la espera se mide desde el final de la pregunta, que es lo que estudió Rowe.

### 4. Qué es una pregunta abierta, una cerrada y una retoma

- **Pregunta cerrada:** tiene una respuesta corta y conocida por el docente. "¿Cuánto es 7 por 8?", "¿Quién escribió el *Martín Fierro*?".
- **Pregunta abierta:** pide explicar, razonar, opinar o comparar, y admite varias respuestas. "¿Por qué creen que pasó eso?", "¿Cómo lo resolverían de otra manera?".
- **Retoma:** el docente toma lo que dijo un alumno y lo usa: lo repite para el grupo, le pide que lo amplíe, se lo pregunta a otro alumno, lo conecta con el tema. "Martina dijo que el hielo flota porque es más liviano. ¿Están de acuerdo? ¿Más liviano que qué?".

La sección 15 cuenta de dónde vienen estas categorías.

### 5. Los indicadores

| Indicador | Cómo se calcula |
|---|---|
| Porcentaje de habla del docente | Tiempo del docente / (tiempo del docente + tiempo de los alumnos). El silencio no cuenta |
| Reparto del tiempo total | Docente, alumnos y silencio sobre la duración completa |
| Preguntas | Cantidad total, y cuántas abiertas |
| Espera promedio | Para cada pregunta, el tiempo hasta que empieza a hablar un alumno o el grupo, si es antes de la pregunta siguiente |
| Sin respuesta de los alumnos | Preguntas después de las cuales los alumnos no hablaron antes de la siguiente |
| Retomas | Cantidad de ideas de alumnos retomadas |
| Participación | Alumnos que tomaron la palabra al menos una vez, sobre los presentes en el plano |
| Quiénes no hablaron | Las etiquetas (números o iniciales) de los presentes sin ninguna intervención |
| Concentración | La parte de las intervenciones que hicieron los tres alumnos que más hablaron, y el coeficiente de Gini de las intervenciones |

Una **intervención** empieza cada vez que pasa a hablar un alumno; tocar dos veces seguidas al mismo alumno cuenta una sola. Si habla el grupo a coro, cuenta como tiempo de los alumnos, pero no como intervención de nadie.

El **coeficiente de Gini** resume cuán desigual es el reparto. Para *n* alumnos presentes con *x*₁ … *x*ₙ intervenciones:

$$ G = Σᵢ Σⱼ |xᵢ − xⱼ| / (2 · n² · x̄) $$

Vale 0 si todos intervienen lo mismo y se acerca a 1 si casi todas las intervenciones son de un solo alumno. Como es difícil de interpretar, el reporte muestra primero la parte de los tres que más hablaron, y la concentración aparece solo si participaron más de tres alumnos.

### 6. Cómo se arma la devolución

La devolución tiene dos listas: **Lo que salió bien** y **Preguntas para pensar**. Se arma con reglas simples:

| Indicador | Va a "Lo que salió bien" si… | Va a "Preguntas para pensar" si… |
|---|---|---|
| Habla del docente | es 50 % o menos | es más de 70 % |
| Preguntas abiertas | son la mitad o más | son menos del 35 % (o no hubo preguntas) |
| Espera | el promedio es de 3 s o más | el promedio es menor de 3 s |
| Retomas | son 3 o más | son menos (con una pregunta distinta si no hubo ninguna) |
| Sin respuesta | — | hubo alguna |
| Participación | participó el 75 % o más | participó menos del 50 % |
| Concentración | — | los tres que más hablaron hicieron el 60 % o más de las intervenciones, con más de tres participantes |

Entre los umbrales, el indicador no aparece en ninguna de las dos listas. Todo lo que no salió bien se formula como una **pregunta**, nunca como un puntaje o una calificación. Para menos de un minuto de observación, la herramienta no da devolución.

### 7. Ejemplo resuelto: la clase inventada

1. **Ver la clase de ejemplo:** 10 minutos de una clase de física inventada, con 20 alumnos en un plano de 4 × 6. No se guarda nada.
2. **Los indicadores:**
   - El docente ocupó el **82 %** del tiempo de habla: 419,5 s del docente contra 90,5 s de los alumnos.
   - El reparto del tiempo total: docente **70 %**, alumnos **15 %**, silencio **15 %**.
   - Hubo **6 preguntas**, de las cuales **2 abiertas** y 4 cerradas.
   - Las esperas fueron de 1,5; 4; 1; 2 y 1 segundos: promedio **1,9 s**. Cuatro de las cinco, menores a 3 s.
   - **1** pregunta quedó sin que hablaran los alumnos.
   - Hubo **2 retomas**.
   - **Participación:** hablaron **6 de 20** alumnos (30 %), en 8 intervenciones. Los alumnos 3 y 8 intervinieron dos veces; 5, 12, 15 y 19, una. La pregunta de los 200 s la contestó el grupo a coro.
   - **Concentración:** los tres que más hablaron hicieron el **63 %** de las intervenciones. El coeficiente de Gini es **0,75**.
3. **Preguntas para pensar.** La herramienta genera siete:
   - "El docente ocupó el 82 % del tiempo de habla. ¿En qué momento de la clase podrían hablar más los alumnos?"
   - "4 de 6 preguntas fueron cerradas. ¿Cuál de ellas se podría transformar en una que pida explicar?"
   - "Después de preguntar, la espera promedio fue de 1,9 s. La investigación sobre el tiempo de espera (Rowe, 1974) encontró respuestas más largas y elaboradas al esperar 3 segundos o más. ¿Qué pasaría si se sostiene un poco más el silencio?"
   - "1 pregunta quedó sin que hablaran los alumnos. ¿La respondió el propio docente?"
   - "Hablaron 6 de 20 alumnos; 14 no intervinieron. ¿Qué estrategia permitiría escuchar a quienes no participaron?"
   - "Los tres alumnos que más hablaron hicieron el 63 % de las intervenciones. ¿Cómo se podría repartir más la palabra?"
   - "Se retomaron 2 ideas de alumnos. ¿Qué otra intervención se podría haber aprovechado?"
4. **Lo que salió bien.** En esta clase, ninguno de los indicadores superó el umbral de fortaleza, y la lista queda vacía.
5. **Preguntas registradas.** Las seis preguntas tienen texto, por ejemplo "¿Por qué la presión en el fondo deja de crecer?" (abierta) y "¿Se entiende?" (cerrada).
6. **Imprimir o guardar en PDF** deja el reporte listo para entregar. **Exportar JSON** guarda los eventos, las métricas y la devolución.

### 8. La IA, opcional

#### 8.1 Qué hace

Con la IA activada, el reporte ofrece tres tareas:

- **Devolución y prácticas con evidencia:** a partir de las métricas, de las preguntas anonimizadas y de la devolución por reglas, redacta de 3 a 6 preguntas para el docente y sugiere de 1 a 3 prácticas para probar. Cada práctica tiene que salir de un **catálogo de siete estudios** con DOI verificado (`src/evidencia.js`): Rowe (1974 y 1986), Tobin (1987), Nystrand y colaboradores (2003), Howe y Abedin (2013), Michaels, O'Connor y Resnick (2008) y Demszky y colaboradores (2024). La IA devuelve solo el identificador del estudio, y la cita la arma la página. Una práctica que nombra un estudio fuera del catálogo se descarta.
- **Clasificar las preguntas:** marca como abierta o cerrada cada pregunta con texto y explica por qué. El reporte muestra si coincide con la marca del observador; la decisión sigue siendo del observador.
- **Evolución del docente:** con dos observaciones o más del mismo docente, describe qué cambió y propone preguntas sobre esa evolución. La tabla de evolución, con los números, está siempre, aun sin IA.

Sin IA, la herramienta funciona igual con las reglas de la sección 6.

#### 8.2 Cómo se conecta: el servidor de la escuela

La página no tiene una key de API. Habla con un **servidor mínimo de la escuela**, un Cloudflare Worker (`worker/`), que guarda la key de la API de Anthropic como secreto y atiende solo esas tres tareas. En Ajustes van su dirección y un código de acceso, que queda en el dispositivo y no se exporta. El servidor:

- acepta pedidos solo desde la página publicada y solo con el código de acceso;
- limita los pedidos a 20 por minuto por dirección IP y rechaza los de más de 20.000 bytes;
- arma él mismo las instrucciones y el formato de la respuesta, de modo que el código no sirve para usar la key en otra cosa;
- usa Claude Opus 5.5 por defecto y, si los clasificadores de seguridad rechazan un pedido, deja que la API lo reintente en el modelo que recomienda Anthropic. El reporte muestra qué modelo respondió.

El plan gratuito de Cloudflare Workers incluye 100.000 pedidos por día (Cloudflare, s. f.). La API de Anthropic se paga por uso: con los precios de noviembre de 2026 (Anthropic, s. f.), las tres tareas de una clase cuestan, en una estimación holgada, unos **US$0,12 con Claude Opus 5.5** y unos US$0,003 con Claude Haiku 5.5. El modelo se cambia en la configuración del servidor.

#### 8.3 Qué se manda

Antes de cada pedido, la página muestra **el contenido completo** que va a mandar y espera que se confirme. Va solamente:

- las métricas, con la participación en cantidades (presentes, participaron, no hablaron, intervenciones, concentración), sin las etiquetas del plano;
- el texto de las preguntas, **anonimizado**: los correos, teléfonos, enlaces, iniciales del plano y menciones como "alumno 12" se reemplazan, y también cualquier palabra con mayúscula que no sea una palabra común (por ejemplo, "¿Martina, por qué flota?" pasa a "¿[nombre], por qué flota?");
- para la evolución, las fechas y las métricas de cada observación.

Nunca van el alias del docente, el plano, el audio ni la transcripción.

#### 8.4 Qué se probó

Los tests verifican el servidor con una llamada simulada a Claude: CORS, código de acceso, límite de pedidos, tamaño, validación, el pedido que arma y el filtro de la respuesta. Además, el servidor se corrió en la computadora con `wrangler dev` y el SDK oficial, contra una API de Claude simulada. La página hizo las tres tareas de punta a punta y ningún pedido llevó un nombre. Lo que **no** se probó es la API real, porque el repositorio no tiene una key: hay que hacerlo al instalar el servidor.

### 9. Privacidad y datos

Los datos de una observación son datos personales, y los de los alumnos son datos de menores. En la Argentina rigen la Ley 25.326 de Protección de los Datos Personales y la Ley 26.061 de Protección Integral de los Derechos de las Niñas, Niños y Adolescentes (sección 24). La herramienta toma estas decisiones:

- **Consentimiento antes del primer uso.** El aviso inicial cita las dos leyes y pide confirmar que el docente está de acuerdo y que la escuela informó a las familias. Sin eso no se guarda nada; la clase de ejemplo se puede ver igual.
- **Alumnos sin nombre.** El plano acepta solo números o hasta tres iniciales.
- **Todo en el dispositivo.** Los docentes, las observaciones y los ajustes se guardan en IndexedDB, en el navegador. No hay cuentas ni servidor de datos.
- **Exportar y borrar.** En Ajustes, "Exportar todo" baja un JSON con todos los datos (sin el código de acceso) e "Importar" lo trae a otro dispositivo. "Borrar todo" elimina todo, y también hay botones para borrar un docente con sus observaciones o una sola observación.
- **IA opcional y anonimizada** (sección 8.3).
- **Transcripción solo local.** Con la transcripción activada, se puede grabar el audio de la clase en el dispositivo. Al terminar, el modelo Whisper de Radford y colaboradores (2023) lo transcribe dentro del navegador, con la biblioteca transformers.js y el modelo `whisper-base` cuantizado (unos 77 MB, que se descargan la primera vez). La página busca las preguntas en la transcripción para completar el texto de las preguntas registradas. El audio y la transcripción no se guardan, no se exportan y nunca van a la IA. Con una grabación humana de dominio público, 28 segundos se transcribieron en 4 segundos en una Mac con Apple Silicon, con errores en algunos nombres propios. Con una voz sintética de prueba, el modelo repitió frases en bucle. Por eso la transcripción es experimental: sirve para ayudar a copiar preguntas, no como registro.

### 10. Relación con el Framework for Teaching

Los indicadores son propios y simples, pero se relacionan con un marco validado: el *Framework for Teaching* de Charlotte Danielson, en su versión actual (The Danielson Group, s. f.). El reporte incluye una tabla que relaciona cada indicador con componentes del **dominio 3, Learning Experiences**:

| Indicador | Componente |
|---|---|
| Habla del docente | 3c Engaging Students in Learning; 3b Using Questioning and Discussion Techniques |
| Preguntas abiertas | 3b |
| Tiempo de espera | 3b |
| Preguntas sin respuesta de los alumnos | 3b |
| Retomas | 3b; 3e Responding Flexibly to Student Needs |
| Participación | 3b; 3c |
| Concentración de la palabra | 3b; 3c |

La herramienta no puntúa con ese marco: no copia ni aplica sus niveles de desempeño. Lo usa para que la conversación con el docente tenga un lenguaje compartido. Del dominio 3 no cubre la comunicación del propósito y el contenido (3a) ni el uso de la evaluación para aprender (3d), y no observa los dominios 1 (planificación y preparación), 2 (ambientes de aprendizaje) y 4 (enseñanza con principios). La sección 18 compara este marco con CLASS.

### 11. Lo que la herramienta no mide

La propia página lo declara, y conviene repetirlo antes de cualquier uso:

- Si lo que se enseñó es correcto o importante.
- El clima del aula, el vínculo ni las emociones de nadie.
- Qué aprendió cada alumno.
- Qué dijo cada alumno ni si su respuesta era correcta: solo cuántas veces y cuánto tiempo habló.

### 12. Cómo leer los resultados

- **Son descripciones, no evaluaciones.** Un 82 % de habla docente no es "malo": en una clase expositiva planificada así, es lo esperable. La pregunta es si es lo que el docente quería.
- **Los umbrales son orientativos.** Vienen de la investigación (sección 16 para la espera, sección 15 para el habla), pero no son reglas. Una clase puede tener buenas razones para estar fuera de ellos.
- **Una clase no alcanza.** Los indicadores varían mucho de una clase a otra del mismo docente. Para ver un patrón hacen falta varias observaciones (sección 18.3), y para eso está el historial.
- **El destinatario es el docente.** La devolución está escrita para quien dio la clase, no para la dirección. Las preguntas invitan a pensar, no a justificarse.
- **Lo que dice la IA es una sugerencia.** Viene marcado con el modelo que lo generó, y las prácticas citan estudios reales, pero su lectura de una clase de diez minutos no reemplaza la conversación con el docente.

#### 12.1 Preguntas frecuentes

**¿Qué hago si hablan el docente y los alumnos a la vez?** Marcar a quien tiene la palabra en ese momento. Las superposiciones breves no cambian mucho los porcentajes.

**¿Y si contesta todo el grupo a coro?** Marcar "Grupo de alumnos". Cuenta como tiempo de los alumnos y como respuesta a la pregunta, pero no como intervención de ningún alumno en particular.

**¿Una pregunta retórica cuenta?** Si el docente no espera respuesta ("¿Y saben qué pasó? Pasó que…"), conviene no marcarla. Si se marca, va a aparecer como "sin respuesta de los alumnos", y la devolución preguntará si la respondió el propio docente, que es justamente lo que pasó.

**¿Por qué la espera se mide solo hasta la pregunta siguiente?** Porque si el docente hace otra pregunta antes de que hablen los alumnos, la primera quedó sin respuesta. Es uno de los patrones que Rowe encontró más a menudo: el docente reformula o responde él mismo antes de dar tiempo.

**¿Dónde se guarda lo que observo?** En el navegador del dispositivo, con IndexedDB. Si se borran los datos del sitio o se usa una ventana privada, se pierde; por eso conviene exportar de vez en cuando.

**¿Por qué no hay un puntaje final?** Porque un puntaje invita a comparar docentes y a usar el número para decisiones administrativas, que es exactamente lo que la herramienta quiere evitar (sección 23).

**¿Por qué el plano no acepta nombres?** Para que lo que se guarda no identifique a un alumno fuera del aula. Quien observa sabe quién es "MG"; un archivo exportado o una IA, no.

#### 12.2 Practicar antes de observar a alguien

Observar bien es una habilidad. Antes de usar la herramienta con un colega, conviene practicar:

1. **Con la clase de ejemplo.** Mirar el reporte: cuándo cambia quién habla, dónde están las preguntas, cuánto tarda la respuesta, quiénes hablaron.
2. **Con un video.** Hay clases filmadas de dominio público (por ejemplo, las que publican algunos programas de formación docente). Observar diez minutos y repetir la misma observación otro día: si los números cambian mucho, hay que afinar los criterios.
3. **Con otra persona.** Dos personas observan el mismo video por separado y comparan. Donde más difieren suele ser en la clasificación de preguntas (¿esa era abierta o cerrada?) y en las retomas (¿eso fue retomar o solo repetir?). La clasificación con IA puede servir como tercera opinión. Conversar esas diferencias es la mejor manera de acordar criterios, y es lo que hacen los observadores que se certifican en marcos como CLASS.
4. **Con la propia clase.** Grabar solo audio de una clase propia (con el consentimiento del grupo) y observarse. Es la manera más directa de entender qué se siente al recibir la devolución.

**¿Puedo observar mi propia clase en vivo?** No es práctico: no se puede enseñar y marcar a la vez. Se puede pedir a un colega que observe, o grabar solo el audio y observarlo después.

**¿Y si la clase es en grupos?** La herramienta está pensada para el formato de clase completa, con un docente y el grupo. En trabajo por grupos, lo que importa es otra cosa (cómo circula el docente, qué pregunta en cada grupo), y los indicadores pierden sentido.

### 13. Limitaciones

- Los indicadores y umbrales son propios y simples. Se relacionan con un marco validado, pero **no son una rúbrica validada**.
- Depende de que quien observa marque bien y a tiempo; la espera se mide con la precisión de un toque, y la participación depende de tocar al alumno correcto.
- No mide si lo enseñado es correcto, el clima del aula ni qué aprendió cada alumno.
- La IA no se probó contra la API real, solo contra una simulada (sección 8.4). Sus sugerencias dependen de un modelo y pueden equivocarse.
- La anonimización es por reglas: puede dejar pasar un nombre escrito en minúscula. Por eso la página muestra el contenido antes de mandarlo.
- La transcripción local es experimental: descarga unos 77 MB y puede fallar con audio de mala calidad.
- Los datos viven en un solo navegador: si se borran los datos del sitio, se pierden. Hay que exportar para tener una copia.

## Parte II. Guía de la idea

### 14. La idea original y sus tres ajustes

La idea original era ambiciosa: anteojos con cámara que el docente usa durante la clase, y una IA que analiza las grabaciones, audita la práctica docente y le reporta a la dirección. El análisis de la idea marcó tres ajustes antes de construir nada:

1. **Audio antes que video.** Casi todos los indicadores que la investigación sabe medir de manera automática (quién habla, qué preguntas se hacen, cuánto se espera, si se retoman ideas) salen del audio. El video agrega poco a esos indicadores y mucho a los riesgos: caras de menores, gestos, imágenes que pueden circular.
2. **El reporte primero para el docente.** Una herramienta que audita para la dirección se vive como vigilancia y genera resistencia y simulación. Una que le devuelve información al docente para que mejore se vive como apoyo. La evidencia (sección 19) dice que lo segundo funciona mejor.
3. **Definir qué se mide y qué no.** Antes de automatizar, hay que saber qué indicadores son útiles y cuáles no se pueden medir. Si los indicadores no sirven a mano, automatizarlos no los va a volver útiles.

La herramienta aplica los tres ajustes en su versión más simple: una persona observa, marca eventos, y el docente recibe una devolución en forma de preguntas. Esta guía cuenta de dónde vienen los indicadores, qué dice la investigación sobre ellos y qué haría falta para el piloto y, eventualmente, para la automatización.

### 15. Observar el discurso del aula: una tradición

#### 15.1 Flanders y la regla de los dos tercios

En los años sesenta, Ned Flanders desarrolló un sistema para codificar la interacción verbal en el aula: cada tres segundos, un observador anotaba una de diez categorías (el docente acepta sentimientos, elogia, usa ideas de los alumnos, pregunta, expone, da instrucciones, critica; el alumno responde, inicia; silencio o confusión). Lo sistematizó en *Analyzing Teaching Behavior* (1970). Con miles de clases codificadas, Flanders formuló una regularidad que se conoce como la **regla de los dos tercios**: en una clase típica, alrededor de dos tercios del tiempo alguien está hablando, y de ese tiempo, alrededor de dos tercios habla el docente.

Los botones de "quién habla" de la herramienta son una versión mínima del sistema de Flanders, y su categoría "usa ideas de los alumnos" es el antecedente de la "retoma". El umbral de 70 % de habla docente de la herramienta está cerca de los dos tercios de Flanders: por encima, la clase es más expositiva que el promedio que él observó.

#### 15.2 Pregunta, respuesta, evaluación

Hugh Mehan, en *Learning Lessons* (1979), y antes John Sinclair y Malcolm Coulthard (1975), describieron la estructura más común del discurso escolar: el docente **inicia** (casi siempre con una pregunta de respuesta conocida), un alumno **responde** y el docente **evalúa** ("¡Muy bien!", "No, ¿alguien más?"). La secuencia se llama **IRE** (iniciación, respuesta, evaluación) o IRF (con *feedback*). Courtney Cazden la analizó en *Classroom Discourse* (1988; 2.ª ed., 2001) y mostró que es tan dominante que alumnos y docentes la reconocen sin pensar: una pregunta del docente "es" una prueba, no una pregunta genuina.

La secuencia IRE tiene usos (repasar, verificar), pero si domina la clase, los alumnos aprenden que su tarea es adivinar la respuesta que el docente ya tiene. Las preguntas cerradas de la herramienta son, casi siempre, el primer turno de una secuencia IRE.

#### 15.3 Nystrand: preguntas auténticas y retoma

Martin Nystrand y Adam Gamoran estudiaron en los años noventa cientos de clases de lengua en escuelas secundarias de Estados Unidos. En *Opening Dialogue* (1997), Nystrand distinguió dos rasgos del discurso que se asociaban con mejores resultados de aprendizaje:

- **Preguntas auténticas:** preguntas sin una respuesta prefijada, que el docente hace porque le interesa lo que piensan los alumnos. Son las abiertas de la herramienta, en un sentido más preciso.
- **Retoma** (*uptake*): cuando el docente incorpora en su pregunta siguiente algo que dijo un alumno. "Vos dijiste que el personaje tenía miedo. ¿En qué parte lo notaste?"

Nystrand y colaboradores mostraron, en un estudio con más de 200 clases (*Discourse Processes*, 35(2), 135–198, 2003), que las preguntas auténticas y la retoma predicen la aparición de **discusión** genuina, la forma de discurso más asociada al aprendizaje profundo, y que son muy poco frecuentes: en la mayoría de las clases observadas, la discusión abierta duraba menos de un minuto por hora.

La herramienta mide exactamente esos dos rasgos: la proporción de preguntas abiertas y la cantidad de retomas. Son, según la investigación de Nystrand, dos de los indicadores más informativos que se pueden obtener sin evaluar el contenido.

#### 15.4 Qué cuenta como retoma

La retoma es el indicador más difícil de marcar a mano, porque exige juzgar si el docente realmente usó la idea del alumno. Algunos ejemplos, en una clase de ciencias sobre la flotación:

| Lo que dice el docente después de que Martina dijo "flota porque es liviano" | ¿Retoma? |
|---|---|
| "Muy bien. Sigamos." | No: evalúa y sigue |
| "Liviano, dice Martina." (y sigue con otra cosa) | Débil: repite sin usar |
| "Martina dice que flota porque es liviano. ¿Liviano comparado con qué?" | Sí: la idea es el punto de partida de la pregunta |
| "¿Alguien piensa distinto de Martina?" | Sí: pone la idea en discusión |
| "Esa idea de Martina nos sirve para lo que vamos a ver: la densidad." | Sí: la conecta con el contenido |

El criterio práctico es que, después de la retoma, la idea del alumno siga en juego en la clase. Una repetición que no lleva a nada no cuenta. Acordar este criterio entre observadores, con ejemplos como estos, es una de las tareas del piloto.

### 16. El tiempo de espera

#### 16.1 Rowe, 1974

Mary Budd Rowe, profesora de educación en ciencias, escuchó en los años sesenta cientos de grabaciones de clases de ciencias de escuela primaria. Notó algo que nadie había medido: después de hacer una pregunta, los docentes esperaban en promedio **alrededor de un segundo** antes de volver a hablar (reformular, dar la palabra a otro, responder ellos mismos). Y después de que un alumno respondía, esperaban todavía menos antes de evaluar o seguir.

Rowe publicó sus resultados en 1974 (*Journal of Research in Science Teaching*, 11(2), 81–94). Cuando entrenó a docentes para esperar **3 segundos o más**, encontró cambios notables: las respuestas de los alumnos se hicieron más largas, aparecieron más respuestas especulativas y argumentadas, los alumnos empezaron a responderse entre ellos, hicieron más preguntas, y participaron alumnos que antes no lo hacían. En 1986, Rowe resumió dos décadas de investigación en un artículo con un título que es casi un consejo: *Wait time: Slowing down may be a way of speeding up!* (*Journal of Teacher Education*, 37(1), 43–50).

La espera recomendada de la herramienta, 3 segundos, es la de Rowe, y la devolución la cita.

#### 16.2 Tobin y las réplicas

Kenneth Tobin revisó en 1987 la investigación posterior (*Review of Educational Research*, 57(1), 69–95) y confirmó que aumentar el tiempo de espera por encima de 3 segundos se asocia con mejoras en la calidad de las respuestas y en el aprendizaje de nivel cognitivo alto, aunque el efecto depende de qué hace el docente con ese tiempo: esperar sin una buena pregunta no ayuda. Tobin propuso hablar de **tiempo para pensar**, para subrayar que el silencio tiene una función.

En la clase de ejemplo, la espera promedio es de 1,9 segundos, y cuatro de las cinco esperas están por debajo de 3. Es un patrón típico, muy cercano al que Rowe encontró hace cincuenta años.

#### 16.3 Por qué cuesta esperar

Esperar tres segundos en silencio frente a un grupo parece una eternidad. El silencio se vive como un fracaso de la pregunta o como una pérdida de tiempo, y la tendencia natural es llenarlo. Por eso la herramienta formula la devolución como una invitación ("¿Qué pasaría si se sostiene un poco más el silencio?") y no como una corrección: esperar es una habilidad que se practica, y saber cuánto se espera de hecho (1,9 segundos, no "bastante") es el primer paso.

#### 16.4 El otro tiempo de espera

Rowe distinguió dos tiempos de espera. El **primero** es el que mide la herramienta: entre la pregunta del docente y la respuesta del alumno. El **segundo** es el que va desde que el alumno termina de hablar hasta que el docente reacciona. Rowe encontró que el segundo era, en promedio, todavía más corto que el primero, y que alargarlo tenía efectos igual de importantes: cuando el docente no evalúa de inmediato ("¡Muy bien!", "No…"), el alumno tiende a seguir hablando, a completar o corregir su idea, y otros alumnos se animan a intervenir.

La herramienta no mide el segundo tiempo de espera, porque requeriría marcar el final de cada intervención de los alumnos con mucha precisión. Es una candidata natural para la versión automatizada, donde el audio permite medir los silencios con exactitud de décimas de segundo.

### 17. Contar el habla del docente

¿Por qué importa cuánto habla el docente? No porque hablar sea malo: explicar bien es una de las cosas más valiosas que hace un docente. Importa por dos razones.

La primera es de **oportunidades**: en una clase de 40 minutos con 30 alumnos y 82 % de habla docente, el tiempo de habla de los alumnos, repartido, es de menos de 15 segundos por alumno. Aprender a explicar, argumentar y preguntar requiere practicarlo, y hablar es la forma de practicarlo.

La segunda es de **diagnóstico**: el docente que habla casi todo el tiempo tiene poca información sobre qué entienden los alumnos. Paul Black y Dylan Wiliam mostraron en su revisión de 1998 sobre evaluación formativa (*Assessment in Education*, 5(1), 7–74) que las prácticas que mejor predicen el aprendizaje son las que dan al docente información continua sobre lo que piensan los alumnos y le permiten ajustar la enseñanza. Esa información sale, sobre todo, de escucharlos.

El umbral de 70 % de la herramienta no dice cuánto debería hablar un docente. Dice que, por encima de ese número, vale la pena preguntarse si es lo que se quería.

### 18. Marcos de observación validados

#### 18.1 CLASS

El **Classroom Assessment Scoring System** (CLASS), desarrollado por Robert Pianta, Karen La Paro y Bridget Hamre en la Universidad de Virginia (2008), organiza la observación en tres dominios: **apoyo emocional** (clima positivo, sensibilidad del docente, respeto por la perspectiva de los alumnos), **organización del aula** (manejo de la conducta, productividad, formatos de instrucción) y **apoyo pedagógico** (desarrollo de conceptos, calidad de la retroalimentación, modelado del lenguaje). Cada dimensión se puntúa de 1 a 7 en ciclos de observación de unos 20 minutos, por observadores certificados. CLASS se validó con miles de aulas y sus puntajes predicen resultados de aprendizaje y desarrollo socioemocional.

#### 18.2 El Framework for Teaching de Danielson

Charlotte Danielson publicó en 1996 *Enhancing Professional Practice: A Framework for Teaching* (2.ª ed., 2007), un marco con cuatro dominios: planificación y preparación, ambiente del aula, instrucción y responsabilidades profesionales. El dominio de instrucción incluye "uso de técnicas de preguntas y discusión", con descriptores que se parecen mucho a los indicadores de la herramienta: preguntas de alto nivel cognitivo, tiempo para pensar, participación de los alumnos, retoma de sus ideas.

La herramienta eligió el *Framework for Teaching* y relaciona cada indicador con componentes de su dominio 3, en la versión actual del marco (sección 10). Los mismos indicadores también caben en el apoyo pedagógico de CLASS. El resto de esos marcos (clima, organización, planificación) la herramienta no lo mide.

#### 18.3 El proyecto MET: cuántas observaciones hacen falta

Entre 2009 y 2012, el proyecto *Measures of Effective Teaching* (MET), financiado por la Fundación Gates y dirigido por Thomas Kane y Douglas Staiger, filmó unas 20 000 clases de unos 3000 docentes y las puntuó con varios marcos, incluidos CLASS y el de Danielson. Uno de sus resultados más importantes fue sobre la **confiabilidad**: el puntaje de una sola observación por un solo observador varía mucho. Para obtener una medida estable de la práctica de un docente hacen falta varias clases observadas por varios observadores (el informe de 2012 sugería al menos cuatro observaciones con dos o más observadores distintos para alcanzar una confiabilidad aceptable).

Heather Hill, Charalambos Charalambous y Matthew Kraft señalaron además en 2012 (*Educational Researcher*, 41(2), 56–64) que la confiabilidad entre observadores no alcanza: hay que asegurar también que el instrumento mida lo que dice medir y que sus puntajes generalicen entre clases.

La lección para la herramienta es directa: una clase observada no dice cómo enseña un docente. Dice qué pasó en esa clase. Por eso la herramienta habla de "esta clase" y formula preguntas, no juicios.

### 19. La devolución: qué la hace útil

#### 19.1 Hattie y Timperley

John Hattie y Helen Timperley publicaron en 2007 una de las revisiones más citadas sobre retroalimentación (*Review of Educational Research*, 77(1), 81–112). Propusieron que una devolución útil responde tres preguntas: **¿adónde voy?** (cuál es la meta), **¿cómo voy?** (dónde estoy respecto de la meta) y **¿qué sigue?** (qué hacer para acercarse). Y distinguieron cuatro niveles: la tarea, el proceso, la autorregulación y la persona. La devolución centrada en la persona ("sos un gran docente", "te falta vocación") es la menos útil; la centrada en el proceso y la autorregulación, la más.

La devolución de la herramienta está diseñada con ese criterio: dice cómo fue (los indicadores), sugiere una meta implícita (más espera, más preguntas abiertas) y deja el "qué sigue" en forma de pregunta para que lo decida el docente. Nunca habla de la persona.

#### 19.2 Kluger y DeNisi: la devolución que empeora

Avraham Kluger y Angelo DeNisi revisaron en 1996 más de 600 estudios sobre intervenciones de retroalimentación (*Psychological Bulletin*, 119(2), 254–284). Encontraron que, en promedio, la retroalimentación mejora el desempeño, pero que en **más de un tercio** de los casos lo empeora. La devolución daña cuando desplaza la atención de la tarea hacia el yo: cuando se vive como un juicio sobre la persona, activa defensas, ansiedad o desinterés.

Es la razón de los dos rasgos más deliberados de la herramienta: formular lo mejorable como preguntas y no tener un puntaje. Un número final invitaría a compararse y a sentirse juzgado; una pregunta invita a pensar en la clase.

#### 19.3 Acompañamiento docente

Matthew Kraft, David Blazar y Dylan Hogan metaanalizaron en 2018 (*Review of Educational Research*, 88(4), 547–588) 60 estudios sobre **coaching** docente: programas en los que un especialista observa clases, da devoluciones y acompaña al docente a lo largo del tiempo. Encontraron efectos considerables sobre la práctica de enseñanza observada y efectos más modestos, pero positivos, sobre el aprendizaje de los alumnos. Los programas más eficaces eran individualizados, intensivos, sostenidos y centrados en prácticas específicas.

Una herramienta de observación como esta es un insumo para ese acompañamiento, no un reemplazo: los indicadores le dan al coach y al docente un lenguaje común para hablar de la clase.

### 20. Automatizar: lo que ya existe

#### 20.1 Preguntas auténticas medidas por computadora

Sean Kelly, Andrew Olney, Patrick Donnelly, Martin Nystrand y Sidney D'Mello mostraron en 2018 (*Educational Researcher*, 47(7), 451–464) que es posible detectar automáticamente, a partir del audio de clases reales, la proporción de preguntas auténticas de un docente, con una precisión comparable a la de observadores humanos entrenados. Usaron reconocimiento de voz para transcribir y modelos de clasificación para identificar las preguntas y su tipo.

#### 20.2 La retoma medida por computadora

Dorottya Demszky y colaboradores, en Stanford, desarrollaron en 2021 una medida automática de la **retoma** en conversaciones entre docentes y alumnos (*Proceedings of the 59th Annual Meeting of the ACL*). Después la usaron en un experimento: en un curso masivo en línea de programación, docentes voluntarios recibieron devoluciones automáticas sobre cuánto retomaban las ideas de sus alumnos. Los que recibieron la devolución aumentaron su retoma, y sus alumnos mostraron más satisfacción y compromiso con las tareas (Demszky, Liu, Hill, Jurafsky y Piech, *Educational Evaluation and Policy Analysis*, 46(3), 483–505, 2024). Es la evidencia más directa de que la idea, en su versión ajustada (audio, devolución para el docente, indicadores definidos), puede funcionar.

#### 20.3 Herramientas comerciales

Existen productos comerciales que analizan el audio de una clase y le dan al docente indicadores parecidos a los de la herramienta: porcentaje de habla, tipos de preguntas, tiempo de espera. Su modelo es justamente el de los tres ajustes: solo audio, devolución privada para el docente. La herramienta da un paso chico en esa dirección, con dos cuidados: la transcripción es local y opcional, y la IA solo redacta y clasifica a partir de lo que registró una persona, nunca observa por su cuenta (secciones 8 y 9). Automatizar la observación con audio sigue siendo un paso para **después** del piloto a mano.

#### 20.4 Por qué empezar a mano

La herramienta podría haber empezado por la automatización. No lo hizo por una razón que el README resume: si los indicadores no son útiles a mano, automatizarlos no los va a volver útiles. Un piloto a mano permite responder preguntas que la automatización da por resueltas: ¿los docentes encuentran útil la devolución? ¿Qué indicador les sirve más? ¿Qué umbrales tienen sentido en su contexto? ¿Qué falta? Responderlas cuesta dos o tres docentes voluntarios y algunas horas de observación; equivocarse en la automatización cuesta mucho más.

### 21. La idea original, tomada en serio

Antes de descartar los wearables, conviene preguntarse qué podrían aportar que la observación a mano no aporta.

**Sensores de interacción.** Alex Pentland y su grupo en el MIT Media Lab desarrollaron a fines de los 2000 los **distintivos sociométricos** (*sociometric badges*): pequeños dispositivos que las personas llevan colgados y que registran quién habla con quién, cuánto, con qué energía y en qué orden, sin grabar el contenido de lo que se dice. Daniel Olguín Olguín, Pentland y colaboradores describieron la tecnología en 2009 (*IEEE Transactions on Systems, Man, and Cybernetics, Part B*, 39(1), 43–55), y Pentland resumió sus hallazgos sobre equipos de trabajo en *Harvard Business Review* (2012): los patrones de comunicación (cuánto hablan todos, cuánto se escuchan, cuánto se conectan entre sí) predecían el desempeño de los equipos mejor que la inteligencia o la personalidad de sus miembros.

Un sensor así en un aula mediría lo mismo que los botones de "quién habla" de la herramienta, sin necesidad de un observador y sin registrar palabras. Es una versión de la idea original que respeta los tres ajustes: solo audio (en realidad, ni siquiera el audio completo, sino quién habla y cuándo), datos para el docente y una definición clara de lo que se mide.

**Lo que agregaría el contenido.** Con transcripción automática, se podría además clasificar las preguntas y detectar retomas, como en los trabajos de Kelly, D'Mello, Nystrand y Demszky (sección 20). Ahí empiezan los riesgos de privacidad, porque el contenido de lo que dicen los alumnos sí es información sensible.

**Lo que agregaría el video.** Casi nada para estos indicadores, y mucho para los riesgos. La dirección del aula de la mirada del docente, los gestos, quién levanta la mano: son señales interesantes para la investigación, pero difíciles de interpretar, fáciles de malinterpretar y muy sensibles.

**La pregunta de fondo.** Los wearables no cambian la pregunta central de la idea, que es para qué y para quién se mide. Un dispositivo que le devuelve al docente cuánto esperó después de preguntar es una herramienta de desarrollo profesional. El mismo dispositivo, reportando a la dirección, es un instrumento de control. La tecnología es la misma; el diseño institucional, no.

### 22. Evaluación formativa y evaluación sumativa

Michael Scriven distinguió en 1967 dos funciones de la evaluación: la **formativa**, que se hace durante un proceso para mejorarlo, y la **sumativa**, que se hace al final para juzgarlo o tomar decisiones (aprobar, contratar, promover). La misma información puede servir para las dos, pero no al mismo tiempo sin costo: cuando una evaluación tiene consecuencias, quien es evaluado deja de mostrar sus dificultades y empieza a mostrar lo que conviene.

La herramienta está diseñada como evaluación formativa del docente, en el mismo sentido en que Black y Wiliam (sección 17) hablan de evaluación formativa de los alumnos: información para ajustar, no para calificar. Por eso no tiene puntaje, no compara docentes y deja la decisión de qué hacer con la devolución en manos de quien dio la clase.

La idea original, en cambio, apuntaba a una evaluación sumativa: una IA que audita y reporta a la dirección. El paso de una a otra es el ajuste más importante que el proyecto le hizo a la idea. Si alguna vez se quisiera usar la observación para decisiones administrativas, la investigación del proyecto MET sugiere que haría falta mucho más: varios observadores, varias clases, un marco validado y, sobre todo, combinarla con otras fuentes de información (encuestas a alumnos, resultados de aprendizaje), como recomendaron Kane y Staiger.

### 23. Observar o vigilar

#### 23.1 El panóptico

Michel Foucault, en *Vigilar y castigar* (1975), tomó como modelo del poder moderno el **panóptico**, el diseño de prisión que Jeremy Bentham propuso en 1791: una torre central desde la que un vigilante puede ver todas las celdas sin ser visto. Lo decisivo, decía Foucault, es que los presos nunca saben si los están mirando, así que se comportan como si siempre lo estuvieran. El poder se vuelve automático: no hace falta vigilar, alcanza con que se pueda.

Unos anteojos con cámara que graban toda la clase y una IA que reporta a la dirección son un panóptico casi literal. El docente nunca sabría qué momento de la clase va a ser analizado ni con qué criterio. El efecto esperable no es una mejor enseñanza sino una enseñanza **defensiva**: hacer lo que el sistema mide, evitar riesgos, no probar nada nuevo.

#### 23.2 La ley de Campbell

El psicólogo Donald Campbell formuló en 1979 (*Evaluation and Program Planning*, 2(1), 67–90) una advertencia que se conoce como la **ley de Campbell**: cuanto más se usa un indicador cuantitativo para tomar decisiones sociales, más se expone a presiones de corrupción y más tiende a distorsionar los procesos que pretende medir. La versión económica, la ley de Goodhart, dice que cuando una medida se convierte en un objetivo, deja de ser una buena medida. Jerry Muller recopiló ejemplos en educación, salud y administración pública en *The Tyranny of Metrics* (2018).

Aplicado a la herramienta: si el porcentaje de preguntas abiertas se usara para evaluar a los docentes, aparecerían clases llenas de "¿Qué opinan?" vacíos, sin escuchar las respuestas. El indicador subiría y la enseñanza no mejoraría. Por eso la devolución es para el docente, no hay puntaje y la herramienta declara lo que no mide.

#### 23.3 Los alumnos

La idea original grababa también a los alumnos, que en la escuela son mayoritariamente menores de edad. La herramienta no registra nada sobre alumnos individuales: solo "los alumnos" como grupo, sin nombres ni voces. Es una decisión de diseño que anticipa el marco legal (sección 24) y responde a una pregunta ética simple: ¿qué necesita saber un docente para mejorar su clase? No necesita saber quién habló; necesita saber cuánto hablaron.

### 24. El marco legal argentino

Antes de un piloto hay que revisar el marco legal. En la Argentina, los dos textos centrales son:

- **Ley 25.326 de Protección de los Datos Personales (2000).** Exige consentimiento libre, expreso e informado para el tratamiento de datos personales, con información clara sobre la finalidad, los destinatarios y los derechos de acceso, rectificación y supresión. La voz y la imagen de una persona son datos personales. Grabar una clase para analizarla requiere el consentimiento de los docentes y, para los alumnos menores, de sus representantes legales.
- **Ley 26.061 de Protección Integral de los Derechos de las Niñas, Niños y Adolescentes (2005).** Reconoce el derecho a la dignidad, la intimidad y la propia imagen, y establece el **interés superior del niño** como criterio de interpretación. Cualquier registro de alumnos tiene que justificarse en función de su beneficio, no del de la institución.

A eso se suman las normas de cada jurisdicción educativa y los convenios colectivos docentes, que en muchos casos regulan la observación de clases y los procedimientos de evaluación. Un piloto con docentes voluntarios, con la devolución solo para ellos, con los alumnos identificados solo por número o iniciales y con los datos guardados en el dispositivo minimiza los problemas legales, pero no exime de pedir consentimientos. Por eso la herramienta pide confirmarlos antes del primer uso y ofrece exportar y borrar todo (sección 9).

### 25. Diseñar el piloto

El próximo paso del proyecto es un piloto con dos o tres docentes voluntarios. Con lo visto, una propuesta:

1. **Voluntarios.** Docentes que quieran participar, sin consecuencias administrativas de ningún tipo. Idealmente, que elijan ellos qué clases observar.
2. **Marco elegido.** La herramienta ya relaciona sus indicadores con el *Framework for Teaching* (sección 10). Conviene compartir esa tabla con los docentes antes de empezar, para que sepan qué parte del marco se observa y cuál no.
3. **Observación a mano, varias veces.** Al menos cuatro clases por docente, como sugiere el proyecto MET, con dos observadores en al menos una de ellas para comparar sus registros.
4. **Devolución en conversación.** Entregar el reporte impreso y conversarlo con el docente, empezando por "Lo que salió bien" y por las preguntas que el docente elija.
5. **Un objetivo por vez.** Que el docente elija un indicador para trabajar (por ejemplo, la espera) y ver si cambia en las clases siguientes.
6. **Preguntarle al docente.** Al final, una entrevista: ¿qué fue útil?, ¿qué no?, ¿qué faltó?, ¿cómo se sintió ser observado?

El piloto no busca probar que la herramienta mejora el aprendizaje (con tres docentes no se puede), sino aprender lo suficiente para decidir si vale la pena automatizar y qué.

### 26. Lo que mostraron las observaciones a gran escala

Los indicadores de la herramienta no son una curiosidad académica: hay estudios que observaron decenas de miles de clases con instrumentos parecidos, y sus resultados ayudan a poner en contexto lo que se ve en una sola.

#### 26.1 Tres países filmados: el estudio de video de TIMSS

En 1995, como parte del Estudio Internacional de Tendencias en Matemática y Ciencias (TIMSS), un equipo dirigido por James Stigler filmó clases de matemática de octavo grado elegidas al azar en Alemania, Japón y Estados Unidos. Stigler y James Hiebert analizaron los videos en *The Teaching Gap* (1999). Encontraron que cada país tenía un **guion cultural** de clase muy estable, compartido por casi todos sus docentes. En las clases japonesas típicas, el docente planteaba un problema que los alumnos no sabían resolver todavía, los alumnos trabajaban solos o en grupos, presentaban distintas soluciones y la clase las comparaba. En las estadounidenses típicas, el docente mostraba un procedimiento y los alumnos lo practicaban con ejercicios parecidos.

Para la herramienta, el estudio deja dos lecciones. La primera es que los patrones de habla, preguntas y espera no son decisiones individuales sino, en buena medida, culturales: un docente que habla el 82 % del tiempo puede estar siguiendo el guion de su sistema escolar más que un estilo propio. La segunda es que los guiones se pueden cambiar, pero no de a un docente por vez: Stigler y Hiebert argumentaron que mejorar la enseñanza requiere trabajo colectivo y sostenido sobre clases concretas.

#### 26.2 Las aulas de América Latina

Barbara Bruns y Javier Luque, del Banco Mundial, publicaron en 2015 *Great Teachers: How to Raise Student Learning in Latin America and the Caribbean*, con los resultados de observaciones en más de 15 000 aulas de siete países de la región. Usaron el método de **instantáneas de clase de Stallings**: a intervalos regulares, el observador anota qué está haciendo el docente y qué están haciendo los alumnos. Encontraron que, en promedio, los docentes dedicaban a la instrucción alrededor de dos tercios del tiempo de clase, frente a un 85 % que se toma como referencia de buena práctica: una diferencia equivalente a perder aproximadamente un día de clase por semana. Gran parte del tiempo de instrucción se iba en actividades de baja exigencia, como copiar del pizarrón, y una fracción considerable de alumnos estaba desconectada de la actividad.

El indicador central de Stallings, el uso del tiempo, es complementario de los de la herramienta. La herramienta mira **cómo** se habla durante la clase; Stallings mira **en qué** se usa el tiempo. Una clase puede tener muy buena espera y muchas preguntas abiertas en los pocos minutos que se dedican a la discusión, y perder el resto en tareas administrativas. Una versión futura podría agregar una marca de "actividad" (instrucción, práctica, organización, tiempo perdido) para cubrir esa dimensión.

#### 26.3 Instrumentos para sistemas enteros

A partir de experiencias como esa, el Banco Mundial desarrolló en 2019 **Teach**, un instrumento abierto de observación de clases pensado para países de ingresos bajos y medios. Combina una medida del tiempo dedicado al aprendizaje con una evaluación de prácticas en tres áreas: clima del aula, instrucción y habilidades socioemocionales. Está diseñado para que lo apliquen observadores con una capacitación breve, y se usó para relevar la calidad de la enseñanza en varios países.

La existencia de instrumentos como Teach, CLASS o el marco de Danielson refuerza el primer próximo paso del proyecto: antes de inventar indicadores propios para un piloto, conviene adoptar uno validado y usar la herramienta como complemento para las dimensiones de discurso que ese instrumento mide con menos detalle.

### 27. Observar entre pares: el estudio de clases

La herramienta propone que la devolución sea para el docente. Hay una tradición que va todavía más lejos: que la observación la hagan los propios docentes, entre ellos, sobre una clase que planificaron juntos.

#### 27.1 El *jugyou kenkyuu* japonés

En Japón, desde hace más de un siglo, los docentes practican el **estudio de clases** (*jugyou kenkyuu*, traducido al inglés como *lesson study*). Un grupo de docentes elige un objetivo de aprendizaje, investiga cómo suelen pensar los alumnos sobre ese tema, planifica una clase en detalle, anticipando las respuestas probables. Uno de ellos la dicta mientras los demás observan, no al docente sino a los **alumnos**: qué dicen, dónde se traban, qué estrategias usan. Después discuten lo observado, revisan la planificación y, a veces, la vuelven a dictar con otro grupo.

Catherine Lewis, Rebecca Perry y Aki Murata analizaron en 2006 (*Educational Researcher*, 35(3), 3–14) cómo el estudio de clases mejora la enseñanza: no por una técnica en particular, sino porque aumenta el conocimiento de los docentes sobre el contenido y sobre el pensamiento de los alumnos, fortalece la colaboración y crea un hábito de mirar la propia práctica con evidencia. Stigler y Hiebert lo señalaron como una de las razones de la estabilidad y la calidad del guion japonés.

#### 27.2 Qué cambia si observan los colegas

El estudio de clases tiene tres diferencias con el modelo de inspección que proponía la idea original:

- **El objeto de la observación es la clase, no el docente.** Lo que se discute es si la planificación funcionó, y la planificación es de todos.
- **Lo que se mira es el aprendizaje.** Los observadores anotan lo que hacen y dicen los alumnos, que es lo que más importa y lo que la herramienta no mide.
- **No hay jerarquía.** Observan pares, no supervisores. La devolución no tiene consecuencias administrativas.

La herramienta podría usarse dentro de un esquema así: un colega observa con los botones mientras otros toman notas sobre los alumnos, y los indicadores de habla, preguntas y espera se discuten junto con esas notas. Es probablemente el uso más fértil, y el menos parecido a la vigilancia que la idea original imaginaba.

#### 27.3 Experiencias en la región

El estudio de clases se adaptó en muchos países, incluidos varios de América Latina, en programas de formación docente, sobre todo en matemática. Las adaptaciones muestran que el formato no se trasplanta tal cual: requiere tiempo institucional para que los docentes planifiquen y observen juntos, algo que las escuelas organizadas por horas cátedra rara vez tienen. Esa es, quizás, la conclusión más práctica para un piloto: cualquier sistema de observación, manual o automático, depende de que exista un tiempo protegido para conversar sobre lo observado. Sin esa conversación, el mejor reporte termina en un cajón.

### 28. Del modelo al código

| Concepto | Dónde | Qué produce |
|---|---|---|
| Tipos de evento | `TIPOS` en `src/observacion.js` | habla:docente, habla:alumnos, habla:alumno (con el lugar), habla:nadie, pregunta:abierta, pregunta:cerrada (con texto opcional), retoma |
| Registrar y deshacer | `registrar`, `deshacer`, `terminar` | Los eventos en orden, con validación del lugar del plano |
| Métricas | `metricas(sesion)` | Tiempos de habla, preguntas, esperas, sin respuesta, retomas y participación |
| Concentración | `gini(cuentas)` | El coeficiente de Gini de las intervenciones |
| Devolución | `devolucion(metricas)` | "Lo que salió bien" y "Preguntas para pensar" |
| Plano del aula | `nuevo`, `alternar`, `etiquetar`, `validar` en `src/plano.js` | Una grilla de hasta 30 alumnos con números o iniciales |
| Anonimizar | `anonimizar`, `paquete` en `src/privacidad.js` | El contenido exacto que puede ir a la IA |
| Guardar | `crear(indexedDB())` en `src/almacen.js` | Docentes, observaciones y ajustes, con exportar, importar y borrar |
| Evidencia | `CATALOGO` en `src/evidencia.js` | Los siete estudios que la IA puede citar |
| Marco validado | `RELACIONES` en `src/rubrica.js` | Indicadores y componentes del dominio 3 del *Framework for Teaching* |
| Cliente de la IA | `pedir` en `src/ia.js` | El pedido al servidor de la escuela, con el código de acceso |
| Transcripción | `transcribir`, `preguntas` en `src/transcripcion.js` | Texto y preguntas del audio, dentro del navegador |
| Servidor de la escuela | `worker/src/` | Origen, código, límites, el pedido a Claude y el filtro de la respuesta |

Los 36 tests verifican, entre otras cosas: los tiempos, las preguntas, las esperas y la participación de la clase de ejemplo; el coeficiente de Gini; que tocar dos veces al mismo alumno es una sola intervención; que el plano rechaza nombres y más de 30 alumnos; que la anonimización reemplaza nombres, iniciales, correos y teléfonos; que el paquete para la IA no lleva etiquetas ni alias; que exportar no incluye el código de acceso; que cada estudio del catálogo tiene DOI; y que el servidor rechaza origen ajeno, código incorrecto, exceso de pedidos y de tamaño, y descarta la evidencia fuera del catálogo.

```js
const O = require("./src/observacion.js");
const m = O.metricas(O.ejemplo());
m.porcentajeDocente;                // ≈ 0,82
m.participacion.participaron;       // 6, de 20 presentes
m.participacion.gini;               // 0,75
O.devolucion(m).preguntas.length;   // 7
```

### 29. Ejercicios

1. Observá diez minutos de una clase (propia o de un video público de una clase) con la herramienta. Anotá qué fue lo más difícil de marcar.
2. Con la clase de ejemplo, ¿cuánto tendría que haber durado la espera promedio para que apareciera en "Lo que salió bien"? ¿Cuántas de las cinco esperas tendrían que cambiar?
3. Escribí cinco preguntas cerradas de tu materia y transformalas en abiertas. ¿Cuál de las abiertas permitiría retomar mejor las respuestas de los alumnos?
4. Practicá esperar: en una conversación, después de hacer una pregunta, contá mentalmente hasta tres antes de volver a hablar. ¿Qué pasó?
5. Leé la descripción del dominio 3 del *Framework for Teaching* de Danielson y discutí la tabla de la sección 10: ¿agregarías o sacarías alguna relación?
6. Diseñá el texto del consentimiento informado para un piloto con solo audio. ¿Qué tiene que decir según la Ley 25.326?
7. Imaginá que el porcentaje de preguntas abiertas se usa para evaluar docentes. Describí tres maneras en que el indicador se podría "inflar" sin que mejore la clase.
8. En la clase de ejemplo, ¿cuántos alumnos más tendrían que haber hablado una vez para que la participación pasara del 50 %? ¿Cómo cambiaría el coeficiente de Gini?

### 30. Glosario

- **Devolución:** información sobre el propio desempeño, orientada a mejorar.
- **Pregunta cerrada:** pregunta con una respuesta corta y prefijada.
- **Pregunta abierta o auténtica:** pregunta sin respuesta prefijada, que invita a explicar o razonar.
- **Retoma (uptake):** incorporación, por parte del docente, de una idea dicha por un alumno.
- **Tiempo de espera:** silencio entre una pregunta y la siguiente intervención.
- **Secuencia IRE:** iniciación del docente, respuesta del alumno, evaluación del docente.
- **Regla de los dos tercios:** regularidad observada por Flanders sobre el habla en el aula.
- **Evaluación formativa:** evaluación orientada a ajustar la enseñanza mientras ocurre.
- **CLASS:** sistema de observación de aulas con dominios emocional, organizativo y pedagógico.
- **Framework for Teaching:** marco de Danielson con cuatro dominios de la práctica docente.
- **Confiabilidad:** estabilidad de una medida entre observadores, clases y ocasiones.
- **Ley de Campbell:** los indicadores usados para decidir tienden a corromperse.
- **Panóptico:** dispositivo de vigilancia en el que el vigilado no sabe cuándo lo observan.
- **Plano del aula:** grilla con los lugares de los alumnos, identificados por número o iniciales.
- **Intervención:** cada vez que un alumno toma la palabra.
- **Coeficiente de Gini:** medida de desigualdad de un reparto: 0 si es parejo, cerca de 1 si lo concentra uno solo.
- **Anonimizar:** reemplazar en un texto lo que puede identificar a una persona.
- **IndexedDB:** base de datos del navegador, donde la herramienta guarda todo en el dispositivo.
- **Worker:** programa chico que corre en los servidores de Cloudflare; acá, el servidor de la escuela que guarda la key de la API.

### 31. Conclusión

La idea de una dirección escolar apoyada en IA y wearables tiene un núcleo valioso y una forma peligrosa. El núcleo es que hay indicadores del discurso del aula que la investigación sabe medir y que se asocian con mejor aprendizaje: cuánto hablan los alumnos (Flanders), cuántas preguntas son auténticas y cuántas ideas se retoman (Nystrand), cuánto se espera después de preguntar (Rowe, Tobin). La forma peligrosa es grabar todo y reportar a la dirección, que convierte la observación en un panóptico y los indicadores en objetivos que se corrompen, como advierten Foucault y Campbell, y que desconoce lo que la investigación dice sobre devoluciones que dañan (Kluger y DeNisi).

La herramienta se queda con el núcleo y descarta la forma: observación a mano, solo indicadores que salen del habla, alumnos identificados solo por número o iniciales, datos que no salen del dispositivo, una devolución para el docente formulada como preguntas y una declaración explícita de lo que no mide. La IA llega como ayuda opcional y acotada: redacta y clasifica a partir de lo que registró una persona, recibe solo métricas y texto anonimizado, y solo puede citar estudios de un catálogo verificado. El próximo paso es un piloto con docentes voluntarios y, recién después, automatizar con audio, como ya mostraron que se puede Kelly, D'Mello y Nystrand, y Demszky y colaboradores.

## Referencias

- Anthropic. (s. f.). *Pricing*. Claude Platform Docs. https://platform.claude.com/docs/en/about-claude/pricing
- Banco Mundial. (2019). *Teach: Classroom Observation Tool*. World Bank Group. https://www.worldbank.org/en/topic/education/brief/teach-helping-countries-track-and-improve-teaching-quality
- Bentham, J. (1791). *Panopticon; or, the Inspection-House*. Londres: T. Payne. https://archive.org/details/10059224bsb
- Black, P., & Wiliam, D. (1998). Assessment and classroom learning. *Assessment in Education: Principles, Policy & Practice*, 5(1), 7–74. https://doi.org/10.1080/0969595980050102
- Bruns, B., & Luque, J. (2015). *Great Teachers: How to Raise Student Learning in Latin America and the Caribbean*. World Bank. https://doi.org/10.1596/978-1-4648-0151-8
- Campbell, D. T. (1979). Assessing the impact of planned social change. *Evaluation and Program Planning*, 2(1), 67–90. https://doi.org/10.1016/0149-7189(79)90048-X
- Cazden, C. B. (2001). *Classroom Discourse: The Language of Teaching and Learning* (2.ª ed.). Heinemann. https://archive.org/details/classroomdiscour0000cazd_m6q5
- Cloudflare. (s. f.). *Workers pricing*. Cloudflare Docs. https://developers.cloudflare.com/workers/platform/pricing/
- The Danielson Group. (s. f.). *The Framework for Teaching*. https://danielsongroup.org/the-framework-for-teaching/
- Danielson, C. (2007). *Enhancing Professional Practice: A Framework for Teaching* (2.ª ed.). ASCD. https://openlibrary.org/works/OL27358632W
- Demszky, D., Liu, J., Hill, H. C., Jurafsky, D., & Piech, C. (2024). Can automated feedback improve teachers' uptake of student ideas? Evidence from a randomized controlled trial in a large-scale online course. *Educational Evaluation and Policy Analysis*, 46(3), 483–505. https://doi.org/10.3102/01623737231169270
- Demszky, D., Liu, J., Mancenido, Z., Cohen, J., Hill, H., Jurafsky, D., & Hashimoto, T. (2021). Measuring conversational uptake: A case study on student-teacher interactions. En *Proceedings of the 59th Annual Meeting of the Association for Computational Linguistics* (pp. 1638–1653). https://doi.org/10.18653/v1/2021.acl-long.130
- Flanders, N. A. (1970). *Analyzing Teaching Behavior*. Addison-Wesley. https://openlibrary.org/works/OL1583104W
- Foucault, M. (1975). *Surveiller et punir: Naissance de la prison*. París: Gallimard. https://openlibrary.org/works/OL26841W
- Hattie, J., & Timperley, H. (2007). The power of feedback. *Review of Educational Research*, 77(1), 81–112. https://doi.org/10.3102/003465430298487
- Hill, H. C., Charalambous, C. Y., & Kraft, M. A. (2012). When rater reliability is not enough: Teacher observation systems and a case for the generalizability study. *Educational Researcher*, 41(2), 56–64. https://doi.org/10.3102/0013189X12437203
- Howe, C., & Abedin, M. (2013). Classroom dialogue: A systematic review across four decades of research. *Cambridge Journal of Education*, 43(3), 325–356. https://doi.org/10.1080/0305764X.2013.786024
- Kane, T. J., & Staiger, D. O. (2012). *Gathering Feedback for Teaching: Combining High-Quality Observations with Student Surveys and Achievement Gains*. Bill & Melinda Gates Foundation, MET Project. https://eric.ed.gov/?id=ED540960
- Kelly, S., Olney, A. M., Donnelly, P., Nystrand, M., & D'Mello, S. K. (2018). Automatically measuring question authenticity in real-world classrooms. *Educational Researcher*, 47(7), 451–464. https://doi.org/10.3102/0013189X18785613
- Kluger, A. N., & DeNisi, A. (1996). The effects of feedback interventions on performance: A historical review, a meta-analysis, and a preliminary feedback intervention theory. *Psychological Bulletin*, 119(2), 254–284. https://doi.org/10.1037/0033-2909.119.2.254
- Kraft, M. A., Blazar, D., & Hogan, D. (2018). The effect of teacher coaching on instruction and achievement: A meta-analysis of the causal evidence. *Review of Educational Research*, 88(4), 547–588. https://doi.org/10.3102/0034654318759268
- Lewis, C., Perry, R., & Murata, A. (2006). How should research contribute to instructional improvement? The case of lesson study. *Educational Researcher*, 35(3), 3–14. https://doi.org/10.3102/0013189X035003003
- Ley 25.326 de Protección de los Datos Personales. (2000). *Boletín Oficial de la República Argentina*, 2 de noviembre de 2000. https://servicios.infoleg.gob.ar/infolegInternet/anexos/60000-64999/64790/norma.htm
- Ley 26.061 de Protección Integral de los Derechos de las Niñas, Niños y Adolescentes. (2005). *Boletín Oficial de la República Argentina*, 26 de octubre de 2005. https://servicios.infoleg.gob.ar/infolegInternet/anexos/110000-114999/110778/norma.htm
- Mehan, H. (1979). *Learning Lessons: Social Organization in the Classroom*. Harvard University Press. https://archive.org/details/learninglessonss0000meha
- Michaels, S., O'Connor, C., & Resnick, L. B. (2008). Deliberative discourse idealized and realized: Accountable talk in the classroom and in civic life. *Studies in Philosophy and Education*, 27(4), 283–297. https://doi.org/10.1007/s11217-007-9071-1
- Muller, J. Z. (2018). *The Tyranny of Metrics*. Princeton University Press. https://doi.org/10.1515/9780691191263
- Nystrand, M. (1997). *Opening Dialogue: Understanding the Dynamics of Language and Learning in the English Classroom*. Teachers College Press. https://archive.org/details/openingdialogueu0000nyst
- Nystrand, M., Wu, L. L., Gamoran, A., Zeiser, S., & Long, D. A. (2003). Questions in time: Investigating the structure and dynamics of unfolding classroom discourse. *Discourse Processes*, 35(2), 135–198. https://doi.org/10.1207/S15326950DP3502_3
- Olguín Olguín, D., Waber, B. N., Kim, T., Mohan, A., Ara, K., & Pentland, A. (2009). Sensible organizations: Technology and methodology for automatically measuring organizational behavior. *IEEE Transactions on Systems, Man, and Cybernetics, Part B*, 39(1), 43–55. https://doi.org/10.1109/TSMCB.2008.2006638
- Pentland, A. (2012). The new science of building great teams. *Harvard Business Review*, 90(4), 60–70. https://hbr.org/2012/04/the-new-science-of-building-great-teams-2
- Pianta, R. C., La Paro, K. M., & Hamre, B. K. (2008). *Classroom Assessment Scoring System (CLASS) Manual, K-3*. Paul H. Brookes. https://openlibrary.org/works/OL18600776W
- Radford, A., Kim, J. W., Xu, T., Brockman, G., McLeavey, C., & Sutskever, I. (2023). Robust speech recognition via large-scale weak supervision. En *Proceedings of the 40th International Conference on Machine Learning* (pp. 28492–28518). PMLR. https://proceedings.mlr.press/v202/radford23a.html
- Rowe, M. B. (1974). Wait-time and rewards as instructional variables, their influence on language, logic, and fate control: Part one—wait-time. *Journal of Research in Science Teaching*, 11(2), 81–94. https://doi.org/10.1002/tea.3660110202
- Rowe, M. B. (1986). Wait time: Slowing down may be a way of speeding up! *Journal of Teacher Education*, 37(1), 43–50. https://doi.org/10.1177/002248718603700110
- Scriven, M. (1967). The methodology of evaluation. En R. W. Tyler, R. M. Gagné & M. Scriven (Eds.), *Perspectives of Curriculum Evaluation* (pp. 39–83). Rand McNally. https://archive.org/details/perspectivesofcu0000ralp
- Sinclair, J. M., & Coulthard, R. M. (1975). *Towards an Analysis of Discourse: The English Used by Teachers and Pupils*. Oxford University Press. https://openlibrary.org/works/OL18502655W
- Stigler, J. W., & Hiebert, J. (1999). *The Teaching Gap: Best Ideas from the World's Teachers for Improving Education in the Classroom*. Free Press. https://archive.org/details/teachinggapbesti00stig
- Tobin, K. (1987). The role of wait time in higher cognitive level learning. *Review of Educational Research*, 57(1), 69–95. https://doi.org/10.3102/00346543057001069
