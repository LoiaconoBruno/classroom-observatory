# Observar una clase: paper de uso y guía de la idea

## Resumen

Este documento acompaña a **Classroom Observatory**, una herramienta para observar una clase **a mano** y generar una **devolución para el docente**: quién habla y cuánto, qué preguntas se hacen (abiertas o cerradas), cuánto se espera la respuesta después de preguntar y cuántas veces el docente retoma una idea de un alumno. Es el primer paso de una idea más ambiciosa, "dirección escolar impulsada por IA y wearables", recortada a lo que se puede hacer hoy sin grabar a nadie: los mismos indicadores que miden las herramientas de análisis de audio de clase, registrados por una persona.

La primera parte es un paper de uso: cómo se observa, los atajos de teclado, el ejemplo de la clase inventada resuelto con los números de la herramienta, cómo se construye la devolución y sus límites. La segunda es una guía de la idea. Recorre la tradición de observar el discurso del aula (el análisis de interacción de Ned Flanders, la secuencia pregunta-respuesta-evaluación de Hugh Mehan y Courtney Cazden, las preguntas auténticas y la "retoma" de Martin Nystrand), la investigación sobre el tiempo de espera de Mary Budd Rowe y Kenneth Tobin, los marcos de observación validados (CLASS de Robert Pianta, el *Framework for Teaching* de Charlotte Danielson) y lo que mostró el proyecto MET sobre su confiabilidad, la evidencia sobre devolución y acompañamiento docente (Hattie y Timperley, Kluger y DeNisi, Kraft, Blazar y Hogan), los sistemas que ya automatizan estos indicadores con audio (Kelly, D'Mello y Nystrand; Demszky y colaboradores) y los riesgos de convertir la observación en vigilancia, de Foucault a la ley de Campbell, con el marco legal argentino. La tesis del proyecto tiene tres ajustes a la idea original: **audio antes que video**, **el reporte primero para el docente** y **definir qué se mide y qué no**.

## Parte I. Paper de uso

### 1. Qué es la herramienta

Classroom Observatory es una página estática sin dependencias que se abre desde la [demo en vivo](https://loiaconobruno.github.io/classroom-observatory/) o con doble clic en `index.html`. No graba, no usa micrófono ni cámara y no usa IA. Los datos quedan en la pestaña del navegador.

La página tiene tres zonas:

1. **Observar:** Empezar, Terminar, Deshacer último; tres botones de "quién habla" (Docente, Alumnos, Silencio); tres botones de eventos (Pregunta abierta, Pregunta cerrada, Retoma una idea); y "Cargar clase de ejemplo".
2. **Devolución para el docente:** los indicadores, una barra con el reparto del tiempo, "Lo que salió bien", "Preguntas para pensar", y los botones Imprimir y Exportar JSON.
3. **Antes de usarla en un aula real:** lo que la herramienta no mide y lo que hay que resolver antes de un piloto.

La lógica está en `src/observacion.js`, sin acceso al DOM. Los tests se corren con `npm test` (Node 18 o más nuevo).

### 2. Instalación

```bash
git clone https://github.com/LoiaconoBruno/classroom-observatory.git
cd classroom-observatory
npm test
```

Después se abre `index.html` con doble clic.

### 3. Cómo se observa

1. **Empezar** al comienzo de la clase. Arranca el reloj.
2. Cada vez que cambia **quién habla**, marcar Docente (D), Alumnos (A) o Silencio (S). Se marca el cambio, no cada frase: si el docente sigue hablando, no hace falta volver a apretar.
3. Cada vez que el docente hace una **pregunta**, marcar si es abierta (Q) o cerrada (C).
4. Cada vez que el docente **retoma** una idea de un alumno (la menciona, la usa, la pregunta de nuevo, la conecta con otra), marcar R.
5. **Deshacer último** corrige un error.
6. **Terminar** al final. Aparece la devolución.

| Tecla | Evento |
|---|---|
| D | Habla el docente |
| A | Hablan los alumnos |
| S | Silencio |
| Q | Pregunta abierta |
| C | Pregunta cerrada |
| R | Retoma una idea de un alumno |

Una sugerencia práctica: marcar la pregunta **en el momento en que termina** de formularse, no cuando empieza. Así, la espera (el tiempo hasta que hablan los alumnos) se mide desde el final de la pregunta, que es lo que estudió Rowe.

### 4. Qué es una pregunta abierta, una cerrada y una retoma

- **Pregunta cerrada:** tiene una respuesta corta y conocida por el docente. "¿Cuánto es 7 por 8?", "¿Quién escribió el *Martín Fierro*?".
- **Pregunta abierta:** pide explicar, razonar, opinar o comparar, y admite varias respuestas. "¿Por qué creen que pasó eso?", "¿Cómo lo resolverían de otra manera?".
- **Retoma:** el docente toma lo que dijo un alumno y lo usa: lo repite para el grupo, le pide que lo amplíe, se lo pregunta a otro alumno, lo conecta con el tema. "Martina dijo que el hielo flota porque es más liviano. ¿Están de acuerdo? ¿Más liviano que qué?".

La sección 12 cuenta de dónde vienen estas categorías.

### 5. Los indicadores

| Indicador | Cómo se calcula |
|---|---|
| Porcentaje de habla del docente | Tiempo del docente / (tiempo del docente + tiempo de los alumnos). El silencio no cuenta |
| Reparto del tiempo total | Docente, alumnos y silencio sobre la duración completa |
| Preguntas | Cantidad total, y cuántas abiertas |
| Espera promedio | Para cada pregunta, el tiempo hasta que empiezan a hablar los alumnos, si es antes de la pregunta siguiente |
| Sin respuesta de los alumnos | Preguntas después de las cuales los alumnos no hablaron antes de la siguiente pregunta |
| Retomas | Cantidad de ideas de alumnos retomadas |

### 6. Cómo se arma la devolución

La devolución tiene dos listas: **Lo que salió bien** y **Preguntas para pensar**. Se arma con reglas simples:

| Indicador | Va a "Lo que salió bien" si… | Va a "Preguntas para pensar" si… |
|---|---|---|
| Habla del docente | es 50 % o menos | es más de 70 % |
| Preguntas abiertas | son la mitad o más | son menos del 35 % (o no hubo preguntas) |
| Espera | el promedio es de 3 s o más | el promedio es menor de 3 s |
| Retomas | son 3 o más | son menos (con una pregunta distinta si no hubo ninguna) |
| Sin respuesta | — | hubo alguna |

Entre los umbrales (por ejemplo, habla del docente entre 50 % y 70 %), el indicador no aparece en ninguna de las dos listas. Todo lo que no salió bien se formula como una **pregunta**, nunca como un puntaje o una calificación. Para menos de un minuto de observación, la herramienta no da devolución.

### 7. Ejemplo resuelto: la clase inventada

1. **Cargar clase de ejemplo:** 10 minutos de una clase inventada.
2. **Los indicadores:**
   - El docente ocupó el **82 %** del tiempo de habla: 419,5 s del docente contra 90,5 s de los alumnos.
   - El reparto del tiempo total: docente **70 %**, alumnos **15 %**, silencio **15 %**.
   - Hubo **6 preguntas**, de las cuales **2 abiertas** y 4 cerradas.
   - Las esperas fueron de 1,5; 4; 1; 2 y 1 segundos: promedio **1,9 s**. Cuatro de las cinco, menores a 3 s.
   - **1** pregunta quedó sin que hablaran los alumnos.
   - Hubo **2 retomas**.
   - Ritmo: 0,6 preguntas por minuto.
3. **Preguntas para pensar.** La herramienta genera cinco:
   - "El docente ocupó el 82 % del tiempo de habla. ¿En qué momento de la clase podrían hablar más los alumnos?"
   - "4 de 6 preguntas fueron cerradas. ¿Cuál de ellas se podría transformar en una que pida explicar?"
   - "Después de preguntar, la espera promedio fue de 1,9 s. La investigación sobre el tiempo de espera (Rowe, 1974) encontró respuestas más largas y elaboradas al esperar 3 segundos o más. ¿Qué pasaría si se sostiene un poco más el silencio?"
   - "1 pregunta quedó sin que hablaran los alumnos. ¿Las respondió el propio docente?"
   - "Se retomaron 2 ideas de alumnos. ¿Qué otra intervención se podría haber aprovechado?"
4. **Lo que salió bien.** En esta clase, ninguno de los indicadores superó el umbral de fortaleza, y la lista queda vacía. En una clase con muchas preguntas abiertas y buena espera, aparecerían frases como "La mitad o más de las preguntas fueron abiertas".
5. **Imprimir** deja el reporte listo para entregar; **Exportar JSON** guarda los eventos, las métricas y la devolución.

### 8. Lo que la herramienta no mide

La propia página lo declara, y conviene repetirlo antes de cualquier uso:

- Si lo que se enseñó es correcto o importante.
- El clima del aula, el vínculo ni las emociones de nadie.
- Qué aprendió cada alumno.
- Nada sobre alumnos individuales: solo cuenta "los alumnos" como grupo.

### 9. Cómo leer los resultados

- **Son descripciones, no evaluaciones.** Un 82 % de habla docente no es "malo": en una clase expositiva planificada así, es lo esperable. La pregunta es si es lo que el docente quería.
- **Los umbrales son orientativos.** Vienen de la investigación (sección 13 para la espera, sección 12 para el habla), pero no son reglas. Una clase puede tener buenas razones para estar fuera de ellos.
- **Una clase no alcanza.** Los indicadores varían mucho de una clase a otra del mismo docente. Para ver un patrón hacen falta varias observaciones (sección 15.3).
- **El destinatario es el docente.** La devolución está escrita para quien dio la clase, no para la dirección. Las preguntas invitan a pensar, no a justificarse.

#### 9.1 Preguntas frecuentes

**¿Qué hago si hablan el docente y los alumnos a la vez?** Marcar a quien tiene la palabra en ese momento. Las superposiciones breves no cambian mucho los porcentajes.

**¿Una pregunta retórica cuenta?** Si el docente no espera respuesta ("¿Y saben qué pasó? Pasó que…"), conviene no marcarla. Si se marca, va a aparecer como "sin respuesta de los alumnos", y la devolución preguntará si la respondió el propio docente, que es justamente lo que pasó.

**¿Por qué la espera se mide solo hasta la pregunta siguiente?** Porque si el docente hace otra pregunta antes de que hablen los alumnos, la primera quedó sin respuesta. Es uno de los patrones que Rowe encontró más a menudo: el docente reformula o responde él mismo antes de dar tiempo.

**¿Se guarda lo que observo?** Solo en la pestaña. Al recargar se pierde, salvo que se exporte el JSON. Es una decisión de diseño: no hay datos de una clase guardados en ningún lado sin que alguien lo decida.

**¿Por qué no hay un puntaje final?** Porque un puntaje invita a comparar docentes y a usar el número para decisiones administrativas, que es exactamente lo que la herramienta quiere evitar (sección 20).

#### 9.2 Practicar antes de observar a alguien

Observar bien es una habilidad. Antes de usar la herramienta con un colega, conviene practicar:

1. **Con la clase de ejemplo.** Cargarla y mirar la línea de eventos que genera: cuándo cambia quién habla, dónde están las preguntas, cuánto tarda la respuesta.
2. **Con un video.** Hay clases filmadas de dominio público (por ejemplo, las que publican algunos programas de formación docente). Observar diez minutos, marcar con la herramienta y repetir la misma observación otro día: si los números cambian mucho, hay que afinar los criterios.
3. **Con otra persona.** Dos personas observan el mismo video por separado y comparan. Donde más difieren suele ser en la clasificación de preguntas (¿esa era abierta o cerrada?) y en las retomas (¿eso fue retomar o solo repetir?). Conversar esas diferencias es la mejor manera de acordar criterios, y es lo que hacen los observadores que se certifican en marcos como CLASS.
4. **Con la propia clase.** Grabar solo audio de una clase propia (con el consentimiento del grupo) y observarse. Es la manera más directa de entender qué se siente al recibir la devolución.

**¿Puedo observar mi propia clase en vivo?** No es práctico: no se puede enseñar y marcar a la vez. Se puede pedir a un colega o a un alumno avanzado que observe, o grabar solo el audio y observarlo después.

**¿Y si la clase es en grupos?** La herramienta está pensada para el formato de clase completa, con un docente y el grupo. En trabajo por grupos, lo que importa es otra cosa (cómo circula el docente, qué pregunta en cada grupo), y los indicadores pierden sentido.

### 10. Limitaciones

- Los indicadores y umbrales son propios y simples, **no una rúbrica validada**.
- Depende de que quien observa marque bien y a tiempo; la espera se mide con la precisión de un clic.
- No mide si lo enseñado es correcto, el clima del aula ni qué aprendió cada alumno.
- No graba ni usa IA. Los datos quedan en la pestaña.

## Parte II. Guía de la idea

### 11. La idea original y sus tres ajustes

La idea original era ambiciosa: anteojos con cámara que el docente usa durante la clase, y una IA que analiza las grabaciones, audita la práctica docente y le reporta a la dirección. El análisis de la idea marcó tres ajustes antes de construir nada:

1. **Audio antes que video.** Casi todos los indicadores que la investigación sabe medir de manera automática (quién habla, qué preguntas se hacen, cuánto se espera, si se retoman ideas) salen del audio. El video agrega poco a esos indicadores y mucho a los riesgos: caras de menores, gestos, imágenes que pueden circular.
2. **El reporte primero para el docente.** Una herramienta que audita para la dirección se vive como vigilancia y genera resistencia y simulación. Una que le devuelve información al docente para que mejore se vive como apoyo. La evidencia (sección 16) dice que lo segundo funciona mejor.
3. **Definir qué se mide y qué no.** Antes de automatizar, hay que saber qué indicadores son útiles y cuáles no se pueden medir. Si los indicadores no sirven a mano, automatizarlos no los va a volver útiles.

La herramienta aplica los tres ajustes en su versión más simple: una persona observa, marca eventos, y el docente recibe una devolución en forma de preguntas. Esta guía cuenta de dónde vienen los indicadores, qué dice la investigación sobre ellos y qué haría falta para el piloto y, eventualmente, para la automatización.

### 12. Observar el discurso del aula: una tradición

#### 12.1 Flanders y la regla de los dos tercios

En los años sesenta, Ned Flanders desarrolló un sistema para codificar la interacción verbal en el aula: cada tres segundos, un observador anotaba una de diez categorías (el docente acepta sentimientos, elogia, usa ideas de los alumnos, pregunta, expone, da instrucciones, critica; el alumno responde, inicia; silencio o confusión). Lo sistematizó en *Analyzing Teaching Behavior* (1970). Con miles de clases codificadas, Flanders formuló una regularidad que se conoce como la **regla de los dos tercios**: en una clase típica, alrededor de dos tercios del tiempo alguien está hablando, y de ese tiempo, alrededor de dos tercios habla el docente.

Los botones de "quién habla" de la herramienta son una versión mínima del sistema de Flanders, y su categoría "usa ideas de los alumnos" es el antecedente de la "retoma". El umbral de 70 % de habla docente de la herramienta está cerca de los dos tercios de Flanders: por encima, la clase es más expositiva que el promedio que él observó.

#### 12.2 Pregunta, respuesta, evaluación

Hugh Mehan, en *Learning Lessons* (1979), y antes John Sinclair y Malcolm Coulthard (1975), describieron la estructura más común del discurso escolar: el docente **inicia** (casi siempre con una pregunta de respuesta conocida), un alumno **responde** y el docente **evalúa** ("¡Muy bien!", "No, ¿alguien más?"). La secuencia se llama **IRE** (iniciación, respuesta, evaluación) o IRF (con *feedback*). Courtney Cazden la analizó en *Classroom Discourse* (1988; 2.ª ed., 2001) y mostró que es tan dominante que alumnos y docentes la reconocen sin pensar: una pregunta del docente "es" una prueba, no una pregunta genuina.

La secuencia IRE tiene usos (repasar, verificar), pero si domina la clase, los alumnos aprenden que su tarea es adivinar la respuesta que el docente ya tiene. Las preguntas cerradas de la herramienta son, casi siempre, el primer turno de una secuencia IRE.

#### 12.3 Nystrand: preguntas auténticas y retoma

Martin Nystrand y Adam Gamoran estudiaron en los años noventa cientos de clases de lengua en escuelas secundarias de Estados Unidos. En *Opening Dialogue* (1997), Nystrand distinguió dos rasgos del discurso que se asociaban con mejores resultados de aprendizaje:

- **Preguntas auténticas:** preguntas sin una respuesta prefijada, que el docente hace porque le interesa lo que piensan los alumnos. Son las abiertas de la herramienta, en un sentido más preciso.
- **Retoma** (*uptake*): cuando el docente incorpora en su pregunta siguiente algo que dijo un alumno. "Vos dijiste que el personaje tenía miedo. ¿En qué parte lo notaste?"

Nystrand y colaboradores mostraron, en un estudio con más de 200 clases (*Discourse Processes*, 35(2), 135–198, 2003), que las preguntas auténticas y la retoma predicen la aparición de **discusión** genuina, la forma de discurso más asociada al aprendizaje profundo, y que son muy poco frecuentes: en la mayoría de las clases observadas, la discusión abierta duraba menos de un minuto por hora.

La herramienta mide exactamente esos dos rasgos: la proporción de preguntas abiertas y la cantidad de retomas. Son, según la investigación de Nystrand, dos de los indicadores más informativos que se pueden obtener sin evaluar el contenido.

#### 12.4 Qué cuenta como retoma

La retoma es el indicador más difícil de marcar a mano, porque exige juzgar si el docente realmente usó la idea del alumno. Algunos ejemplos, en una clase de ciencias sobre la flotación:

| Lo que dice el docente después de que Martina dijo "flota porque es liviano" | ¿Retoma? |
|---|---|
| "Muy bien. Sigamos." | No: evalúa y sigue |
| "Liviano, dice Martina." (y sigue con otra cosa) | Débil: repite sin usar |
| "Martina dice que flota porque es liviano. ¿Liviano comparado con qué?" | Sí: la idea es el punto de partida de la pregunta |
| "¿Alguien piensa distinto de Martina?" | Sí: pone la idea en discusión |
| "Esa idea de Martina nos sirve para lo que vamos a ver: la densidad." | Sí: la conecta con el contenido |

El criterio práctico es que, después de la retoma, la idea del alumno siga en juego en la clase. Una repetición que no lleva a nada no cuenta. Acordar este criterio entre observadores, con ejemplos como estos, es una de las tareas del piloto.

### 13. El tiempo de espera

#### 13.1 Rowe, 1974

Mary Budd Rowe, profesora de educación en ciencias, escuchó en los años sesenta cientos de grabaciones de clases de ciencias de escuela primaria. Notó algo que nadie había medido: después de hacer una pregunta, los docentes esperaban en promedio **alrededor de un segundo** antes de volver a hablar (reformular, dar la palabra a otro, responder ellos mismos). Y después de que un alumno respondía, esperaban todavía menos antes de evaluar o seguir.

Rowe publicó sus resultados en 1974 (*Journal of Research in Science Teaching*, 11(2), 81–94). Cuando entrenó a docentes para esperar **3 segundos o más**, encontró cambios notables: las respuestas de los alumnos se hicieron más largas, aparecieron más respuestas especulativas y argumentadas, los alumnos empezaron a responderse entre ellos, hicieron más preguntas, y participaron alumnos que antes no lo hacían. En 1986, Rowe resumió dos décadas de investigación en un artículo con un título que es casi un consejo: *Wait time: Slowing down may be a way of speeding up!* (*Journal of Teacher Education*, 37(1), 43–50).

La espera recomendada de la herramienta, 3 segundos, es la de Rowe, y la devolución la cita.

#### 13.2 Tobin y las réplicas

Kenneth Tobin revisó en 1987 la investigación posterior (*Review of Educational Research*, 57(1), 69–95) y confirmó que aumentar el tiempo de espera por encima de 3 segundos se asocia con mejoras en la calidad de las respuestas y en el aprendizaje de nivel cognitivo alto, aunque el efecto depende de qué hace el docente con ese tiempo: esperar sin una buena pregunta no ayuda. Tobin propuso hablar de **tiempo para pensar**, para subrayar que el silencio tiene una función.

En la clase de ejemplo, la espera promedio es de 1,9 segundos, y cuatro de las cinco esperas están por debajo de 3. Es un patrón típico, muy cercano al que Rowe encontró hace cincuenta años.

#### 13.3 Por qué cuesta esperar

Esperar tres segundos en silencio frente a un grupo parece una eternidad. El silencio se vive como un fracaso de la pregunta o como una pérdida de tiempo, y la tendencia natural es llenarlo. Por eso la herramienta formula la devolución como una invitación ("¿Qué pasaría si se sostiene un poco más el silencio?") y no como una corrección: esperar es una habilidad que se practica, y saber cuánto se espera de hecho (1,9 segundos, no "bastante") es el primer paso.

#### 13.4 El otro tiempo de espera

Rowe distinguió dos tiempos de espera. El **primero** es el que mide la herramienta: entre la pregunta del docente y la respuesta del alumno. El **segundo** es el que va desde que el alumno termina de hablar hasta que el docente reacciona. Rowe encontró que el segundo era, en promedio, todavía más corto que el primero, y que alargarlo tenía efectos igual de importantes: cuando el docente no evalúa de inmediato ("¡Muy bien!", "No…"), el alumno tiende a seguir hablando, a completar o corregir su idea, y otros alumnos se animan a intervenir.

La herramienta no mide el segundo tiempo de espera, porque requeriría marcar el final de cada intervención de los alumnos con mucha precisión. Es una candidata natural para la versión automatizada, donde el audio permite medir los silencios con exactitud de décimas de segundo.

### 14. Contar el habla del docente

¿Por qué importa cuánto habla el docente? No porque hablar sea malo: explicar bien es una de las cosas más valiosas que hace un docente. Importa por dos razones.

La primera es de **oportunidades**: en una clase de 40 minutos con 30 alumnos y 82 % de habla docente, el tiempo de habla de los alumnos, repartido, es de menos de 15 segundos por alumno. Aprender a explicar, argumentar y preguntar requiere practicarlo, y hablar es la forma de practicarlo.

La segunda es de **diagnóstico**: el docente que habla casi todo el tiempo tiene poca información sobre qué entienden los alumnos. Paul Black y Dylan Wiliam mostraron en su revisión de 1998 sobre evaluación formativa (*Assessment in Education*, 5(1), 7–74) que las prácticas que mejor predicen el aprendizaje son las que dan al docente información continua sobre lo que piensan los alumnos y le permiten ajustar la enseñanza. Esa información sale, sobre todo, de escucharlos.

El umbral de 70 % de la herramienta no dice cuánto debería hablar un docente. Dice que, por encima de ese número, vale la pena preguntarse si es lo que se quería.

### 15. Marcos de observación validados

#### 15.1 CLASS

El **Classroom Assessment Scoring System** (CLASS), desarrollado por Robert Pianta, Karen La Paro y Bridget Hamre en la Universidad de Virginia (2008), organiza la observación en tres dominios: **apoyo emocional** (clima positivo, sensibilidad del docente, respeto por la perspectiva de los alumnos), **organización del aula** (manejo de la conducta, productividad, formatos de instrucción) y **apoyo pedagógico** (desarrollo de conceptos, calidad de la retroalimentación, modelado del lenguaje). Cada dimensión se puntúa de 1 a 7 en ciclos de observación de unos 20 minutos, por observadores certificados. CLASS se validó con miles de aulas y sus puntajes predicen resultados de aprendizaje y desarrollo socioemocional.

#### 15.2 El Framework for Teaching de Danielson

Charlotte Danielson publicó en 1996 *Enhancing Professional Practice: A Framework for Teaching* (2.ª ed., 2007), un marco con cuatro dominios: planificación y preparación, ambiente del aula, instrucción y responsabilidades profesionales. El dominio de instrucción incluye "uso de técnicas de preguntas y discusión", con descriptores que se parecen mucho a los indicadores de la herramienta: preguntas de alto nivel cognitivo, tiempo para pensar, participación de los alumnos, retoma de sus ideas.

El primer próximo paso del proyecto es elegir uno de estos marcos y **mapear** los indicadores de la herramienta a sus dimensiones. Los indicadores de habla, preguntas, espera y retoma caben en el apoyo pedagógico de CLASS y en el dominio de instrucción de Danielson; el resto de esos marcos (clima, organización, planificación) la herramienta no lo mide.

#### 15.3 El proyecto MET: cuántas observaciones hacen falta

Entre 2009 y 2012, el proyecto *Measures of Effective Teaching* (MET), financiado por la Fundación Gates y dirigido por Thomas Kane y Douglas Staiger, filmó unas 20 000 clases de unos 3000 docentes y las puntuó con varios marcos, incluidos CLASS y el de Danielson. Uno de sus resultados más importantes fue sobre la **confiabilidad**: el puntaje de una sola observación por un solo observador varía mucho. Para obtener una medida estable de la práctica de un docente hacen falta varias clases observadas por varios observadores (el informe de 2012 sugería al menos cuatro observaciones con dos o más observadores distintos para alcanzar una confiabilidad aceptable).

Heather Hill, Charalambos Charalambous y Matthew Kraft señalaron además en 2012 (*Educational Researcher*, 41(2), 56–64) que la confiabilidad entre observadores no alcanza: hay que asegurar también que el instrumento mida lo que dice medir y que sus puntajes generalicen entre clases.

La lección para la herramienta es directa: una clase observada no dice cómo enseña un docente. Dice qué pasó en esa clase. Por eso la herramienta habla de "esta clase" y formula preguntas, no juicios.

### 16. La devolución: qué la hace útil

#### 16.1 Hattie y Timperley

John Hattie y Helen Timperley publicaron en 2007 una de las revisiones más citadas sobre retroalimentación (*Review of Educational Research*, 77(1), 81–112). Propusieron que una devolución útil responde tres preguntas: **¿adónde voy?** (cuál es la meta), **¿cómo voy?** (dónde estoy respecto de la meta) y **¿qué sigue?** (qué hacer para acercarse). Y distinguieron cuatro niveles: la tarea, el proceso, la autorregulación y la persona. La devolución centrada en la persona ("sos un gran docente", "te falta vocación") es la menos útil; la centrada en el proceso y la autorregulación, la más.

La devolución de la herramienta está diseñada con ese criterio: dice cómo fue (los indicadores), sugiere una meta implícita (más espera, más preguntas abiertas) y deja el "qué sigue" en forma de pregunta para que lo decida el docente. Nunca habla de la persona.

#### 16.2 Kluger y DeNisi: la devolución que empeora

Avraham Kluger y Angelo DeNisi revisaron en 1996 más de 600 estudios sobre intervenciones de retroalimentación (*Psychological Bulletin*, 119(2), 254–284). Encontraron que, en promedio, la retroalimentación mejora el desempeño, pero que en **más de un tercio** de los casos lo empeora. La devolución daña cuando desplaza la atención de la tarea hacia el yo: cuando se vive como un juicio sobre la persona, activa defensas, ansiedad o desinterés.

Es la razón de los dos rasgos más deliberados de la herramienta: formular lo mejorable como preguntas y no tener un puntaje. Un número final invitaría a compararse y a sentirse juzgado; una pregunta invita a pensar en la clase.

#### 16.3 Acompañamiento docente

Matthew Kraft, David Blazar y Dylan Hogan metaanalizaron en 2018 (*Review of Educational Research*, 88(4), 547–588) 60 estudios sobre **coaching** docente: programas en los que un especialista observa clases, da devoluciones y acompaña al docente a lo largo del tiempo. Encontraron efectos considerables sobre la práctica de enseñanza observada y efectos más modestos, pero positivos, sobre el aprendizaje de los alumnos. Los programas más eficaces eran individualizados, intensivos, sostenidos y centrados en prácticas específicas.

Una herramienta de observación como esta es un insumo para ese acompañamiento, no un reemplazo: los indicadores le dan al coach y al docente un lenguaje común para hablar de la clase.

### 17. Automatizar: lo que ya existe

#### 17.1 Preguntas auténticas medidas por computadora

Sean Kelly, Andrew Olney, Patrick Donnelly, Martin Nystrand y Sidney D'Mello mostraron en 2018 (*Educational Researcher*, 47(7), 451–464) que es posible detectar automáticamente, a partir del audio de clases reales, la proporción de preguntas auténticas de un docente, con una precisión comparable a la de observadores humanos entrenados. Usaron reconocimiento de voz para transcribir y modelos de clasificación para identificar las preguntas y su tipo.

#### 17.2 La retoma medida por computadora

Dorottya Demszky y colaboradores, en Stanford, desarrollaron en 2021 una medida automática de la **retoma** en conversaciones entre docentes y alumnos (*Proceedings of the 59th Annual Meeting of the ACL*). Después la usaron en un experimento: en un curso masivo en línea de programación, docentes voluntarios recibieron devoluciones automáticas sobre cuánto retomaban las ideas de sus alumnos. Los que recibieron la devolución aumentaron su retoma, y sus alumnos mostraron más satisfacción y compromiso con las tareas (Demszky, Liu, Hill, Jurafsky y Piech, *Educational Evaluation and Policy Analysis*, 46(3), 483–505, 2024). Es la evidencia más directa de que la idea, en su versión ajustada (audio, devolución para el docente, indicadores definidos), puede funcionar.

#### 17.3 Herramientas comerciales

Existen productos comerciales que analizan el audio de una clase y le dan al docente indicadores parecidos a los de la herramienta: porcentaje de habla, tipos de preguntas, tiempo de espera. Su modelo es justamente el de los tres ajustes: solo audio, devolución privada para el docente. El cuarto próximo paso del proyecto es automatizar con análisis de audio (transcripción y detección de preguntas), **recién después** del piloto a mano.

#### 17.4 Por qué empezar a mano

La herramienta podría haber empezado por la automatización. No lo hizo por una razón que el README resume: si los indicadores no son útiles a mano, automatizarlos no los va a volver útiles. Un piloto a mano permite responder preguntas que la automatización da por resueltas: ¿los docentes encuentran útil la devolución? ¿Qué indicador les sirve más? ¿Qué umbrales tienen sentido en su contexto? ¿Qué falta? Responderlas cuesta dos o tres docentes voluntarios y algunas horas de observación; equivocarse en la automatización cuesta mucho más.

### 18. La idea original, tomada en serio

Antes de descartar los wearables, conviene preguntarse qué podrían aportar que la observación a mano no aporta.

**Sensores de interacción.** Alex Pentland y su grupo en el MIT Media Lab desarrollaron a fines de los 2000 los **distintivos sociométricos** (*sociometric badges*): pequeños dispositivos que las personas llevan colgados y que registran quién habla con quién, cuánto, con qué energía y en qué orden, sin grabar el contenido de lo que se dice. Daniel Olguín Olguín, Pentland y colaboradores describieron la tecnología en 2009 (*IEEE Transactions on Systems, Man, and Cybernetics, Part B*, 39(1), 43–55), y Pentland resumió sus hallazgos sobre equipos de trabajo en *Harvard Business Review* (2012): los patrones de comunicación (cuánto hablan todos, cuánto se escuchan, cuánto se conectan entre sí) predecían el desempeño de los equipos mejor que la inteligencia o la personalidad de sus miembros.

Un sensor así en un aula mediría lo mismo que los botones de "quién habla" de la herramienta, sin necesidad de un observador y sin registrar palabras. Es una versión de la idea original que respeta los tres ajustes: solo audio (en realidad, ni siquiera el audio completo, sino quién habla y cuándo), datos para el docente y una definición clara de lo que se mide.

**Lo que agregaría el contenido.** Con transcripción automática, se podría además clasificar las preguntas y detectar retomas, como en los trabajos de Kelly, D'Mello, Nystrand y Demszky (sección 17). Ahí empiezan los riesgos de privacidad, porque el contenido de lo que dicen los alumnos sí es información sensible.

**Lo que agregaría el video.** Casi nada para estos indicadores, y mucho para los riesgos. La dirección del aula de la mirada del docente, los gestos, quién levanta la mano: son señales interesantes para la investigación, pero difíciles de interpretar, fáciles de malinterpretar y muy sensibles.

**La pregunta de fondo.** Los wearables no cambian la pregunta central de la idea, que es para qué y para quién se mide. Un dispositivo que le devuelve al docente cuánto esperó después de preguntar es una herramienta de desarrollo profesional. El mismo dispositivo, reportando a la dirección, es un instrumento de control. La tecnología es la misma; el diseño institucional, no.

### 19. Evaluación formativa y evaluación sumativa

Michael Scriven distinguió en 1967 dos funciones de la evaluación: la **formativa**, que se hace durante un proceso para mejorarlo, y la **sumativa**, que se hace al final para juzgarlo o tomar decisiones (aprobar, contratar, promover). La misma información puede servir para las dos, pero no al mismo tiempo sin costo: cuando una evaluación tiene consecuencias, quien es evaluado deja de mostrar sus dificultades y empieza a mostrar lo que conviene.

La herramienta está diseñada como evaluación formativa del docente, en el mismo sentido en que Black y Wiliam (sección 14) hablan de evaluación formativa de los alumnos: información para ajustar, no para calificar. Por eso no tiene puntaje, no compara docentes y deja la decisión de qué hacer con la devolución en manos de quien dio la clase.

La idea original, en cambio, apuntaba a una evaluación sumativa: una IA que audita y reporta a la dirección. El paso de una a otra es el ajuste más importante que el proyecto le hizo a la idea. Si alguna vez se quisiera usar la observación para decisiones administrativas, la investigación del proyecto MET sugiere que haría falta mucho más: varios observadores, varias clases, un marco validado y, sobre todo, combinarla con otras fuentes de información (encuestas a alumnos, resultados de aprendizaje), como recomendaron Kane y Staiger.

### 20. Observar o vigilar

#### 20.1 El panóptico

Michel Foucault, en *Vigilar y castigar* (1975), tomó como modelo del poder moderno el **panóptico**, el diseño de prisión que Jeremy Bentham propuso en 1791: una torre central desde la que un vigilante puede ver todas las celdas sin ser visto. Lo decisivo, decía Foucault, es que los presos nunca saben si los están mirando, así que se comportan como si siempre lo estuvieran. El poder se vuelve automático: no hace falta vigilar, alcanza con que se pueda.

Unos anteojos con cámara que graban toda la clase y una IA que reporta a la dirección son un panóptico casi literal. El docente nunca sabría qué momento de la clase va a ser analizado ni con qué criterio. El efecto esperable no es una mejor enseñanza sino una enseñanza **defensiva**: hacer lo que el sistema mide, evitar riesgos, no probar nada nuevo.

#### 20.2 La ley de Campbell

El psicólogo Donald Campbell formuló en 1979 (*Evaluation and Program Planning*, 2(1), 67–90) una advertencia que se conoce como la **ley de Campbell**: cuanto más se usa un indicador cuantitativo para tomar decisiones sociales, más se expone a presiones de corrupción y más tiende a distorsionar los procesos que pretende medir. La versión económica, la ley de Goodhart, dice que cuando una medida se convierte en un objetivo, deja de ser una buena medida. Jerry Muller recopiló ejemplos en educación, salud y administración pública en *The Tyranny of Metrics* (2018).

Aplicado a la herramienta: si el porcentaje de preguntas abiertas se usara para evaluar a los docentes, aparecerían clases llenas de "¿Qué opinan?" vacíos, sin escuchar las respuestas. El indicador subiría y la enseñanza no mejoraría. Por eso la devolución es para el docente, no hay puntaje y la herramienta declara lo que no mide.

#### 20.3 Los alumnos

La idea original grababa también a los alumnos, que en la escuela son mayoritariamente menores de edad. La herramienta no registra nada sobre alumnos individuales: solo "los alumnos" como grupo, sin nombres ni voces. Es una decisión de diseño que anticipa el marco legal (sección 21) y responde a una pregunta ética simple: ¿qué necesita saber un docente para mejorar su clase? No necesita saber quién habló; necesita saber cuánto hablaron.

### 21. El marco legal argentino

El tercer próximo paso del proyecto es revisar el marco legal antes de un piloto. En la Argentina, los dos textos centrales son:

- **Ley 25.326 de Protección de los Datos Personales (2000).** Exige consentimiento libre, expreso e informado para el tratamiento de datos personales, con información clara sobre la finalidad, los destinatarios y los derechos de acceso, rectificación y supresión. La voz y la imagen de una persona son datos personales. Grabar una clase para analizarla requiere el consentimiento de los docentes y, para los alumnos menores, de sus representantes legales.
- **Ley 26.061 de Protección Integral de los Derechos de las Niñas, Niños y Adolescentes (2005).** Reconoce el derecho a la dignidad, la intimidad y la propia imagen, y establece el **interés superior del niño** como criterio de interpretación. Cualquier registro de alumnos tiene que justificarse en función de su beneficio, no del de la institución.

A eso se suman las normas de cada jurisdicción educativa y los convenios colectivos docentes, que en muchos casos regulan la observación de clases y los procedimientos de evaluación. Un piloto con solo audio, con docentes voluntarios, con la devolución solo para ellos y sin registro de alumnos individuales minimiza los problemas legales, pero no exime de pedir consentimientos.

### 22. Diseñar el piloto

El segundo próximo paso del proyecto es un piloto con dos o tres docentes voluntarios. Con lo visto, una propuesta:

1. **Voluntarios.** Docentes que quieran participar, sin consecuencias administrativas de ningún tipo. Idealmente, que elijan ellos qué clases observar.
2. **Marco elegido.** Antes de empezar, mapear los indicadores a CLASS o a Danielson, para saber qué parte de esos marcos se está cubriendo y cuál no.
3. **Observación a mano, varias veces.** Al menos cuatro clases por docente, como sugiere el proyecto MET, con dos observadores en al menos una de ellas para comparar sus registros.
4. **Devolución en conversación.** Entregar el reporte impreso y conversarlo con el docente, empezando por "Lo que salió bien" y por las preguntas que el docente elija.
5. **Un objetivo por vez.** Que el docente elija un indicador para trabajar (por ejemplo, la espera) y ver si cambia en las clases siguientes.
6. **Preguntarle al docente.** Al final, una entrevista: ¿qué fue útil?, ¿qué no?, ¿qué faltó?, ¿cómo se sintió ser observado?

El piloto no busca probar que la herramienta mejora el aprendizaje (con tres docentes no se puede), sino aprender lo suficiente para decidir si vale la pena automatizar y qué.

### 23. Del modelo al código

| Concepto | En `src/observacion.js` | Qué produce |
|---|---|---|
| Tipos de evento | `TIPOS` | habla:docente, habla:alumnos, habla:nadie, pregunta:abierta, pregunta:cerrada, retoma |
| Espera recomendada | `ESPERA_RECOMENDADA` | 3 segundos (Rowe) |
| Sesión nueva | `nueva()` | Una observación vacía |
| Registrar | `registrar(sesion, tipo, t)` | Agrega un evento, en orden |
| Deshacer | `deshacer(sesion)` | Saca el último evento y reabre una sesión terminada |
| Terminar | `terminar(sesion, t)` | Cierra la observación |
| Métricas | `metricas(sesion)` | Tiempos de habla, preguntas, esperas, sin respuesta, retomas |
| Devolución | `devolucion(metricas)` | "Lo que salió bien" y "Preguntas para pensar" |
| Lo que no mide | `NO_MIDE` | Las cuatro advertencias |
| Ejemplo | `ejemplo()` | La clase inventada de 10 minutos |

Los tests verifican: el tiempo de habla de la clase de ejemplo; sus preguntas, esperas y retomas; que la devolución habla en preguntas y nombra lo que salió bien; que una clase con muchas preguntas abiertas y buena espera recibe fortalezas; que los eventos tienen que ir en orden y ser de un tipo conocido; que deshacer saca el último evento y reabre una sesión terminada, y que una observación muy corta no alcanza para una devolución.

```js
const O = require("./src/observacion.js");
const m = O.metricas(O.ejemplo());
m.porcentajeDocente;   // ≈ 0,82
m.esperaPromedio;      // 1,9
O.devolucion(m).preguntas.length;   // 5
```

### 24. Ejercicios

1. Observá diez minutos de una clase (propia o de un video público de una clase) con la herramienta. Anotá qué fue lo más difícil de marcar.
2. Con la clase de ejemplo, ¿cuánto tendría que haber durado la espera promedio para que apareciera en "Lo que salió bien"? ¿Cuántas de las cinco esperas tendrían que cambiar?
3. Escribí cinco preguntas cerradas de tu materia y transformalas en abiertas. ¿Cuál de las abiertas permitiría retomar mejor las respuestas de los alumnos?
4. Practicá esperar: en una conversación, después de hacer una pregunta, contá mentalmente hasta tres antes de volver a hablar. ¿Qué pasó?
5. Leé la descripción del dominio de instrucción del *Framework for Teaching* de Danielson y marcá qué componentes cubre la herramienta y cuáles no.
6. Diseñá el texto del consentimiento informado para un piloto con solo audio. ¿Qué tiene que decir según la Ley 25.326?
7. Imaginá que el porcentaje de preguntas abiertas se usa para evaluar docentes. Describí tres maneras en que el indicador se podría "inflar" sin que mejore la clase.

### 25. Glosario

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

### 26. Conclusión

La idea de una dirección escolar apoyada en IA y wearables tiene un núcleo valioso y una forma peligrosa. El núcleo es que hay indicadores del discurso del aula que la investigación sabe medir y que se asocian con mejor aprendizaje: cuánto hablan los alumnos (Flanders), cuántas preguntas son auténticas y cuántas ideas se retoman (Nystrand), cuánto se espera después de preguntar (Rowe, Tobin). La forma peligrosa es grabar todo y reportar a la dirección, que convierte la observación en un panóptico y los indicadores en objetivos que se corrompen, como advierten Foucault y Campbell, y que desconoce lo que la investigación dice sobre devoluciones que dañan (Kluger y DeNisi).

La herramienta se queda con el núcleo y descarta la forma: observación a mano, solo indicadores que salen del habla, ningún dato de alumnos individuales, una devolución para el docente formulada como preguntas, y una declaración explícita de lo que no mide. Es, como dice el propio proyecto, el primer paso: elegir un marco validado, hacer un piloto con docentes voluntarios, revisar el marco legal y, recién después, automatizar con audio, como ya mostraron que se puede Kelly, D'Mello y Nystrand, y Demszky y colaboradores.

## Referencias

- Bentham, J. (1791). *Panopticon; or, the Inspection-House*. Londres: T. Payne.
- Black, P., & Wiliam, D. (1998). Assessment and classroom learning. *Assessment in Education: Principles, Policy & Practice*, 5(1), 7–74. https://doi.org/10.1080/0969595980050102
- Campbell, D. T. (1979). Assessing the impact of planned social change. *Evaluation and Program Planning*, 2(1), 67–90. https://doi.org/10.1016/0149-7189(79)90048-X
- Cazden, C. B. (2001). *Classroom Discourse: The Language of Teaching and Learning* (2.ª ed.). Heinemann. ISBN 978-0-325-00378-5.
- Danielson, C. (2007). *Enhancing Professional Practice: A Framework for Teaching* (2.ª ed.). ASCD. ISBN 978-1-4166-0517-1.
- Demszky, D., Liu, J., Hill, H. C., Jurafsky, D., & Piech, C. (2024). Can automated feedback improve teachers' uptake of student ideas? Evidence from a randomized controlled trial in a large-scale online course. *Educational Evaluation and Policy Analysis*, 46(3), 483–505. https://doi.org/10.3102/01623737231169270
- Demszky, D., Liu, J., Mancenido, Z., Cohen, J., Hill, H., Jurafsky, D., & Hashimoto, T. (2021). Measuring conversational uptake: A case study on student-teacher interactions. En *Proceedings of the 59th Annual Meeting of the Association for Computational Linguistics* (pp. 1638–1653). https://doi.org/10.18653/v1/2021.acl-long.130
- Flanders, N. A. (1970). *Analyzing Teaching Behavior*. Addison-Wesley.
- Foucault, M. (1975). *Surveiller et punir: Naissance de la prison*. París: Gallimard.
- Hattie, J., & Timperley, H. (2007). The power of feedback. *Review of Educational Research*, 77(1), 81–112. https://doi.org/10.3102/003465430298487
- Hill, H. C., Charalambous, C. Y., & Kraft, M. A. (2012). When rater reliability is not enough: Teacher observation systems and a case for the generalizability study. *Educational Researcher*, 41(2), 56–64. https://doi.org/10.3102/0013189X12437203
- Kane, T. J., & Staiger, D. O. (2012). *Gathering Feedback for Teaching: Combining High-Quality Observations with Student Surveys and Achievement Gains*. Bill & Melinda Gates Foundation, MET Project.
- Kelly, S., Olney, A. M., Donnelly, P., Nystrand, M., & D'Mello, S. K. (2018). Automatically measuring question authenticity in real-world classrooms. *Educational Researcher*, 47(7), 451–464. https://doi.org/10.3102/0013189X18785613
- Kluger, A. N., & DeNisi, A. (1996). The effects of feedback interventions on performance: A historical review, a meta-analysis, and a preliminary feedback intervention theory. *Psychological Bulletin*, 119(2), 254–284. https://doi.org/10.1037/0033-2909.119.2.254
- Kraft, M. A., Blazar, D., & Hogan, D. (2018). The effect of teacher coaching on instruction and achievement: A meta-analysis of the causal evidence. *Review of Educational Research*, 88(4), 547–588. https://doi.org/10.3102/0034654318759268
- Ley 25.326 de Protección de los Datos Personales. (2000). *Boletín Oficial de la República Argentina*, 2 de noviembre de 2000.
- Ley 26.061 de Protección Integral de los Derechos de las Niñas, Niños y Adolescentes. (2005). *Boletín Oficial de la República Argentina*, 26 de octubre de 2005.
- Mehan, H. (1979). *Learning Lessons: Social Organization in the Classroom*. Harvard University Press.
- Muller, J. Z. (2018). *The Tyranny of Metrics*. Princeton University Press. ISBN 978-0-691-17495-2.
- Nystrand, M. (1997). *Opening Dialogue: Understanding the Dynamics of Language and Learning in the English Classroom*. Teachers College Press.
- Nystrand, M., Wu, L. L., Gamoran, A., Zeiser, S., & Long, D. A. (2003). Questions in time: Investigating the structure and dynamics of unfolding classroom discourse. *Discourse Processes*, 35(2), 135–198. https://doi.org/10.1207/S15326950DP3502_3
- Olguín Olguín, D., Waber, B. N., Kim, T., Mohan, A., Ara, K., & Pentland, A. (2009). Sensible organizations: Technology and methodology for automatically measuring organizational behavior. *IEEE Transactions on Systems, Man, and Cybernetics, Part B*, 39(1), 43–55. https://doi.org/10.1109/TSMCB.2008.2006638
- Pentland, A. (2012). The new science of building great teams. *Harvard Business Review*, 90(4), 60–70.
- Pianta, R. C., La Paro, K. M., & Hamre, B. K. (2008). *Classroom Assessment Scoring System (CLASS) Manual, K-3*. Paul H. Brookes.
- Rowe, M. B. (1974). Wait-time and rewards as instructional variables, their influence on language, logic, and fate control: Part one—wait-time. *Journal of Research in Science Teaching*, 11(2), 81–94. https://doi.org/10.1002/tea.3660110202
- Rowe, M. B. (1986). Wait time: Slowing down may be a way of speeding up! *Journal of Teacher Education*, 37(1), 43–50. https://doi.org/10.1177/002248718603700110
- Scriven, M. (1967). The methodology of evaluation. En R. W. Tyler, R. M. Gagné & M. Scriven (Eds.), *Perspectives of Curriculum Evaluation* (pp. 39–83). Rand McNally.
- Sinclair, J. M., & Coulthard, R. M. (1975). *Towards an Analysis of Discourse: The English Used by Teachers and Pupils*. Oxford University Press.
- Tobin, K. (1987). The role of wait time in higher cognitive level learning. *Review of Educational Research*, 57(1), 69–95. https://doi.org/10.3102/00346543057001069
