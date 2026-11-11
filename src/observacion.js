// Observación de una clase y devolución para el docente.
//
// Registra lo mismo que miden las herramientas de análisis de audio de clase
// (como TeachFX), pero a mano: quién habla, qué preguntas se hacen, cuánto se
// espera después de preguntar y cuántas veces el docente retoma una idea de
// un alumno. Con eso arma una devolución en forma de preguntas, pensada para
// el docente, no para sancionar.
//
// Una sesión es una lista de eventos { t, tipo } con t en segundos desde el inicio:
//   "habla:docente" | "habla:alumnos" | "habla:nadie"   (cambio de quién habla; "alumnos" = el grupo)
//   "habla:alumno" con { alumno: id del lugar }         (habla un alumno en particular, del plano)
//   "pregunta:abierta" | "pregunta:cerrada"            (pregunta del docente, con { texto } opcional)
//   "retoma"                                           (retoma una idea de un alumno)
// Si la sesión tiene plano del aula, también mide la participación por alumno.
const Observacion = (() => {
  const TIPOS = ["habla:docente", "habla:alumnos", "habla:alumno", "habla:nadie", "pregunta:abierta", "pregunta:cerrada", "retoma"];
  const ESPERA_RECOMENDADA = 3; // segundos (Rowe, 1974)
  const LARGO_TEXTO = 300;

  function nueva(plano = null) {
    return { eventos: [], fin: null, plano };
  }

  const hablanAlumnos = (tipo) => tipo === "habla:alumnos" || tipo === "habla:alumno";

  function registrar(sesion, t, tipo, extra = {}) {
    if (!TIPOS.includes(tipo)) throw new Error("Tipo de evento desconocido: " + tipo);
    if (sesion.fin !== null) throw new Error("La sesión ya terminó");
    if (!Number.isFinite(t) || t < 0) throw new Error("El tiempo tiene que ser un número de segundos");
    const ultimo = sesion.eventos[sesion.eventos.length - 1];
    if (ultimo && t < ultimo.t) throw new Error("Los eventos tienen que ir en orden");
    const evento = { t, tipo };
    if (tipo === "habla:alumno") {
      if (!sesion.plano) throw new Error("Para marcar un alumno hace falta el plano del aula");
      const lugar = sesion.plano.lugares.find((l) => l.id === extra.alumno);
      if (!lugar || !lugar.ocupado) throw new Error("Ese lugar no tiene alumno: " + extra.alumno);
      evento.alumno = lugar.id;
    }
    if (tipo.startsWith("pregunta:") && extra.texto) {
      evento.texto = String(extra.texto).trim().slice(0, LARGO_TEXTO);
    }
    sesion.eventos.push(evento);
    return evento;
  }

  function deshacer(sesion) {
    if (sesion.fin !== null) sesion.fin = null;
    return sesion.eventos.pop() || null;
  }

  function terminar(sesion, t) {
    sesion.fin = t;
  }

  function metricas(sesion, tFin = sesion.fin) {
    const ev = sesion.eventos;
    const fin = tFin ?? (ev.length ? ev[ev.length - 1].t : 0);
    const habla = { docente: 0, alumnos: 0, nadie: 0 };
    const cambios = ev.filter((e) => e.tipo.startsWith("habla:"));
    cambios.forEach((e, i) => {
      const hasta = i + 1 < cambios.length ? cambios[i + 1].t : fin;
      habla[hablanAlumnos(e.tipo) ? "alumnos" : e.tipo.slice(6)] += Math.max(0, hasta - e.t);
    });

    const preguntas = ev.filter((e) => e.tipo.startsWith("pregunta:"));
    const esperas = [];
    let sinRespuesta = 0;
    preguntas.forEach((q, i) => {
      const limite = i + 1 < preguntas.length ? preguntas[i + 1].t : fin;
      const resp = ev.find((e) => hablanAlumnos(e.tipo) && e.t >= q.t && e.t <= limite);
      if (resp) esperas.push(resp.t - q.t); else sinRespuesta++;
    });

    const abiertas = preguntas.filter((q) => q.tipo === "pregunta:abierta").length;
    const hablado = habla.docente + habla.alumnos;
    return {
      duracion: fin,
      habla,
      porcentajeDocente: hablado ? habla.docente / hablado : 0,
      preguntas: preguntas.length,
      abiertas,
      cerradas: preguntas.length - abiertas,
      proporcionAbiertas: preguntas.length ? abiertas / preguntas.length : 0,
      esperas,
      esperaPromedio: esperas.length ? esperas.reduce((a, b) => a + b, 0) / esperas.length : null,
      esperasCortas: esperas.filter((x) => x < ESPERA_RECOMENDADA).length,
      sinRespuesta,
      retomas: ev.filter((e) => e.tipo === "retoma").length,
      preguntasPorMinuto: fin ? preguntas.length / (fin / 60) : 0,
      participacion: participacion(sesion, cambios, fin),
    };
  }

  // Participación por alumno: cuántas veces tomó la palabra cada uno (una intervención
  // empieza cuando pasa a hablar ese alumno) y cuántos segundos habló.
  function participacion(sesion, cambios, fin) {
    if (!sesion.plano) return null;
    const presentes = sesion.plano.lugares.filter((l) => l.ocupado);
    const intervenciones = Object.fromEntries(presentes.map((l) => [l.id, 0]));
    const segundos = Object.fromEntries(presentes.map((l) => [l.id, 0]));
    let anterior = null;
    cambios.forEach((e, i) => {
      const hasta = i + 1 < cambios.length ? cambios[i + 1].t : fin;
      if (e.tipo === "habla:alumno" && e.alumno in intervenciones) {
        if (!(anterior && anterior.tipo === "habla:alumno" && anterior.alumno === e.alumno)) intervenciones[e.alumno]++;
        segundos[e.alumno] += Math.max(0, hasta - e.t);
      }
      anterior = e;
    });
    const cuentas = presentes.map((l) => intervenciones[l.id]);
    const total = cuentas.reduce((a, b) => a + b, 0);
    const participaron = cuentas.filter((x) => x > 0).length;
    const ordenadas = [...cuentas].sort((a, b) => b - a);
    return {
      presentes: presentes.length,
      participaron,
      porcentaje: presentes.length ? participaron / presentes.length : 0,
      nunca: presentes.filter((l) => intervenciones[l.id] === 0).map((l) => l.etiqueta),
      intervenciones,
      segundos,
      total,
      gini: total ? gini(cuentas) : null,
      tresPrimeros: total ? ordenadas.slice(0, 3).reduce((a, b) => a + b, 0) / total : null,
    };
  }

  // Coeficiente de Gini de una lista de cuentas: 0 si todos intervienen lo mismo,
  // cerca de 1 si casi todas las intervenciones son de un solo alumno.
  function gini(xs) {
    const n = xs.length;
    const suma = xs.reduce((a, b) => a + b, 0);
    if (!n || !suma) return 0;
    let dif = 0;
    for (const a of xs) for (const b of xs) dif += Math.abs(a - b);
    return dif / (2 * n * suma);
  }

  const pct = (x) => Math.round(x * 100) + "\u00a0%";   // espacio que no corta
  const seg = (x) => x.toFixed(1).replace(".", ",") + " s";

  // Devolución: fortalezas y preguntas para pensar. Nunca un puntaje.
  function devolucion(m) {
    const fortalezas = [];
    const preguntas = [];
    if (m.duracion < 60) return { fortalezas, preguntas: ["La observación duró menos de un minuto: no alcanza para una devolución."] };

    if (m.porcentajeDocente <= 0.5) fortalezas.push(`Los alumnos tuvieron la mitad o más del tiempo de habla (el docente habló el ${pct(m.porcentajeDocente)}).`);
    else if (m.porcentajeDocente > 0.7) preguntas.push(`El docente ocupó el ${pct(m.porcentajeDocente)} del tiempo de habla. ¿En qué momento de la clase podrían hablar más los alumnos?`);

    if (m.preguntas === 0) preguntas.push("No se registraron preguntas del docente. ¿Hubo algún momento en que una pregunta podría haber reemplazado una explicación?");
    else if (m.proporcionAbiertas >= 0.5) fortalezas.push(`La mitad o más de las preguntas fueron abiertas (${m.abiertas} de ${m.preguntas}).`);
    else if (m.proporcionAbiertas < 0.35) preguntas.push(`${m.cerradas} de ${m.preguntas} preguntas fueron cerradas. ¿Cuál de ellas se podría transformar en una que pida explicar?`);

    if (m.esperaPromedio !== null) {
      if (m.esperaPromedio >= ESPERA_RECOMENDADA) fortalezas.push(`Después de preguntar se esperó en promedio ${seg(m.esperaPromedio)} antes de que respondieran.`);
      else preguntas.push(`Después de preguntar, la espera promedio fue de ${seg(m.esperaPromedio)}. La investigación sobre el tiempo de espera (Rowe, 1974) encontró respuestas más largas y elaboradas al esperar 3 segundos o más. ¿Qué pasaría si se sostiene un poco más el silencio?`);
    }
    if (m.sinRespuesta > 0) preguntas.push(m.sinRespuesta === 1
      ? "1 pregunta quedó sin que hablaran los alumnos. ¿La respondió el propio docente?"
      : `${m.sinRespuesta} preguntas quedaron sin que hablaran los alumnos. ¿Las respondió el propio docente?`);

    const p = m.participacion;
    if (p && p.presentes && p.total) {
      if (p.porcentaje >= 0.75) fortalezas.push(`Participaron ${p.participaron} de ${p.presentes} alumnos.`);
      else if (p.porcentaje < 0.5) preguntas.push(`Hablaron ${p.participaron} de ${p.presentes} alumnos; ${p.nunca.length} no intervinieron. ¿Qué estrategia permitiría escuchar a quienes no participaron?`);
      if (p.participaron > 3 && p.tresPrimeros >= 0.6) preguntas.push(`Los tres alumnos que más hablaron hicieron el ${pct(p.tresPrimeros)} de las intervenciones. ¿Cómo se podría repartir más la palabra?`);
    }

    if (m.retomas >= 3) fortalezas.push(`El docente retomó ${m.retomas} veces ideas de los alumnos.`);
    else preguntas.push(m.retomas === 0
      ? "No se registró ninguna retoma de una idea de un alumno. ¿Hubo alguna intervención que se podría haber usado para seguir la clase?"
      : `Se retomaron ${m.retomas} ideas de alumnos. ¿Qué otra intervención se podría haber aprovechado?`);
    return { fortalezas, preguntas };
  }

  const NO_MIDE = [
    "Si lo que se enseñó es correcto o importante.",
    "El clima del aula, el vínculo ni las emociones de nadie.",
    "Qué aprendió cada alumno.",
    "Qué dijo cada alumno ni si su respuesta era correcta: solo cuántas veces y cuánto tiempo habló.",
  ];

  // Una clase de 10 minutos inventada, para ver cómo queda la devolución:
  // 20 alumnos en un plano de 4 × 6; a la pregunta de t = 200 contesta el grupo a coro.
  function ejemplo() {
    const lugares = Array.from({ length: 24 }, (_, i) => ({ id: `L${i + 1}`, etiqueta: i < 20 ? String(i + 1) : "", ocupado: i < 20 }));
    const s = nueva({ filas: 4, columnas: 6, lugares });
    const guion = [
      [0, "habla:docente"], [40, "pregunta:cerrada", { texto: "¿Cuánto es la densidad del arroz?" }], [41.5, "habla:alumno", { alumno: "L3" }], [46, "habla:docente"],
      [120, "pregunta:abierta", { texto: "¿Por qué la presión en el fondo deja de crecer?" }], [124, "habla:alumno", { alumno: "L8" }],
      [133, "habla:alumno", { alumno: "L12" }], [141, "habla:alumno", { alumno: "L8" }], [150, "retoma"], [152, "habla:docente"],
      [200, "pregunta:cerrada", { texto: "¿Es más alto o más bajo que el del trigo?" }], [201, "habla:alumnos"], [204, "habla:docente"],
      [260, "pregunta:cerrada", { texto: "¿Se entiende?" }], [261, "habla:docente"],
      [330, "habla:nadie"], [420, "habla:docente"],
      [450, "pregunta:abierta", { texto: "¿Qué pasaría si el silo fuera más angosto?" }], [452, "habla:alumno", { alumno: "L15" }],
      [470, "habla:alumno", { alumno: "L5" }], [485, "habla:alumno", { alumno: "L19" }], [500, "retoma"], [503, "habla:docente"],
      [560, "pregunta:cerrada", { texto: "¿Está claro el ejercicio para mañana?" }], [561, "habla:alumno", { alumno: "L3" }], [565, "habla:docente"],
    ];
    for (const [t, tipo, extra] of guion) registrar(s, t, tipo, extra);
    terminar(s, 600);
    return s;
  }

  return { TIPOS, ESPERA_RECOMENDADA, LARGO_TEXTO, nueva, registrar, deshacer, terminar, metricas, gini, devolucion, NO_MIDE, ejemplo };
})();

if (typeof module !== "undefined") module.exports = Observacion;
