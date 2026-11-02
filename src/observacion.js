// Observación de una clase y devolución para el docente.
//
// Registra lo mismo que miden las herramientas de análisis de audio de clase
// (como TeachFX), pero a mano: quién habla, qué preguntas se hacen, cuánto se
// espera después de preguntar y cuántas veces el docente retoma una idea de
// un alumno. Con eso arma una devolución en forma de preguntas, pensada para
// el docente, no para sancionar.
//
// Una sesión es una lista de eventos { t, tipo } con t en segundos desde el inicio:
//   "habla:docente" | "habla:alumnos" | "habla:nadie"   (cambio de quién habla)
//   "pregunta:abierta" | "pregunta:cerrada"            (pregunta del docente)
//   "retoma"                                           (retoma una idea de un alumno)
const Observacion = (() => {
  const TIPOS = ["habla:docente", "habla:alumnos", "habla:nadie", "pregunta:abierta", "pregunta:cerrada", "retoma"];
  const ESPERA_RECOMENDADA = 3; // segundos (Rowe, 1974)

  function nueva() {
    return { eventos: [], fin: null };
  }

  function registrar(sesion, t, tipo) {
    if (!TIPOS.includes(tipo)) throw new Error("Tipo de evento desconocido: " + tipo);
    if (sesion.fin !== null) throw new Error("La sesión ya terminó");
    const ultimo = sesion.eventos[sesion.eventos.length - 1];
    if (ultimo && t < ultimo.t) throw new Error("Los eventos tienen que ir en orden");
    sesion.eventos.push({ t, tipo });
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
      habla[e.tipo.slice(6)] += Math.max(0, hasta - e.t);
    });

    const preguntas = ev.filter((e) => e.tipo.startsWith("pregunta:"));
    const esperas = [];
    let sinRespuesta = 0;
    preguntas.forEach((q, i) => {
      const limite = i + 1 < preguntas.length ? preguntas[i + 1].t : fin;
      const resp = ev.find((e) => e.tipo === "habla:alumnos" && e.t >= q.t && e.t <= limite);
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
    };
  }

  const pct = (x) => Math.round(x * 100) + " %";
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
    if (m.sinRespuesta > 0) preguntas.push(`${m.sinRespuesta} ${m.sinRespuesta === 1 ? "pregunta quedó" : "preguntas quedaron"} sin que hablaran los alumnos. ¿Las respondió el propio docente?`);

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
    "Nada sobre alumnos individuales: solo cuenta \"los alumnos\" como grupo.",
  ];

  // Una clase de 10 minutos inventada, para ver cómo queda la devolución.
  function ejemplo() {
    const s = nueva();
    const guion = [
      [0, "habla:docente"], [40, "pregunta:cerrada"], [41.5, "habla:alumnos"], [46, "habla:docente"],
      [120, "pregunta:abierta"], [124, "habla:alumnos"], [150, "retoma"], [152, "habla:docente"],
      [200, "pregunta:cerrada"], [201, "habla:alumnos"], [204, "habla:docente"],
      [260, "pregunta:cerrada"], [261, "habla:docente"],
      [330, "habla:nadie"], [420, "habla:docente"],
      [450, "pregunta:abierta"], [452, "habla:alumnos"], [500, "retoma"], [503, "habla:docente"],
      [560, "pregunta:cerrada"], [561, "habla:alumnos"], [565, "habla:docente"],
    ];
    for (const [t, tipo] of guion) registrar(s, t, tipo);
    terminar(s, 600);
    return s;
  }

  return { TIPOS, ESPERA_RECOMENDADA, nueva, registrar, deshacer, terminar, metricas, devolucion, NO_MIDE, ejemplo };
})();

if (typeof module !== "undefined") module.exports = Observacion;
