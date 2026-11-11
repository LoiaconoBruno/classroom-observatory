// Lo que sale del dispositivo hacia la IA: solo métricas y texto anonimizado.
// Nunca el plano con sus etiquetas, ni el alias del docente, ni audio.
// La página muestra este paquete completo antes de mandarlo.
const Privacidad = (() => {
  // Palabras que pueden empezar una oración con mayúscula sin ser un nombre propio.
  const COMUNES = new Set(`a al algo alguien alguna alguno algunas algunos ahora antes así bien bueno cada chicas chicos
    como cómo comparemos con cual cuál cuáles cualquier cuando cuándo cuanto cuánto cuánta cuántas cuántos dale de decime
    del después digan díganme donde dónde el él ella ellas ellos en entonces era es esa esas ese eso esos esta está están
    estas este esto estos explicá expliquen fue hay imaginen la las le les lo los mañana más me mi miren mirá muy nadie
    ni no nos nosotros o ok otra otro otras otros para pensemos pero piensen podemos podés por porque porqué puede pueden
    qué que quien quién quiénes recuerden saben sabés se sería si sí sigamos sin sobre su sus supongamos también te
    tenemos tiene tienen todas todos tu tú un una unas uno unos usted ustedes va vamos van vos y ya yo escuchen acuérdense
    hoy ayer primero segundo después finalmente gracias perfecto exacto claro
    escribime escriban escribí lean leé anoten anotá pensá respondan respondé contesten contestá levanten decí
    observen observá calculen calculá comparen compará abran abrí saquen sacá busquen buscá vean veamos hagamos
    hagan hacé tomen tomá traigan recordá fíjense fijate presten contame cuéntenme copien copiá dibujen dibujá`.split(/\s+/).filter(Boolean));

  const PALABRA_MAYUSCULA = /(?<![\p{L}\p{N}])(\p{Lu}[\p{Ll}\p{M}]+(?:[-'’]\p{L}+)?)(?![\p{L}\p{N}])/gu;

  // Reemplaza lo que puede identificar a alguien. "etiquetas" son las del plano (números o iniciales).
  function anonimizar(texto, { etiquetas = [] } = {}) {
    let t = String(texto || "");
    t = t.replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "[correo]");
    t = t.replace(/\bhttps?:\/\/\S+|\bwww\.\S+/gi, "[enlace]");
    t = t.replace(/\+?\d[\d\s.()-]{5,}\d/g, "[número]");
    t = t.replace(/\b(alumn[oa]s?|lugar|banco|asiento)\s+(n[.º°]?\s*)?\d{1,2}\b/gi, "[alumno]");
    const iniciales = etiquetas.map((e) => String(e)).filter((e) => /\p{L}/u.test(e));
    for (const e of iniciales) {
      const re = new RegExp(`(?<![\\p{L}\\p{N}])${e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "gu");
      t = t.replace(re, "[alumno]");
    }
    t = t.replace(PALABRA_MAYUSCULA, (m) => (COMUNES.has(m.toLowerCase()) ? m : "[nombre]"));
    return t.replace(/\s+/g, " ").trim();
  }

  const r1 = (x) => (x == null ? null : Math.round(x * 10) / 10);
  const r2 = (x) => (x == null ? null : Math.round(x * 100) / 100);

  // Métricas sin nada que identifique a un alumno: la participación va en cantidades, sin etiquetas.
  function metricasAnonimas(m) {
    const p = m.participacion;
    return {
      duracionMinutos: r1(m.duracion / 60),
      porcentajeDocente: r2(m.porcentajeDocente),
      segundosHabla: { docente: Math.round(m.habla.docente), alumnos: Math.round(m.habla.alumnos), silencio: Math.round(m.habla.nadie) },
      preguntas: m.preguntas,
      abiertas: m.abiertas,
      cerradas: m.cerradas,
      esperaPromedioSegundos: r1(m.esperaPromedio),
      esperasMenoresA3Segundos: m.esperasCortas,
      preguntasSinRespuestaDeAlumnos: m.sinRespuesta,
      retomas: m.retomas,
      participacion: p ? {
        alumnosPresentes: p.presentes,
        alumnosQueParticiparon: p.participaron,
        alumnosQueNoHablaron: p.nunca.length,
        intervenciones: p.total,
        parteDeLosTresQueMasHablaron: r2(p.tresPrimeros),
        gini: r2(p.gini),
      } : null,
    };
  }

  const etiquetasDe = (sesion) => (sesion.plano ? sesion.plano.lugares.filter((l) => l.ocupado).map((l) => l.etiqueta) : []);

  const textosDePreguntas = (sesion) => sesion.eventos
    .filter((e) => e.tipo.startsWith("pregunta:") && e.texto)
    .map((e) => ({ texto: anonimizar(e.texto, { etiquetas: etiquetasDe(sesion) }), marcadaComo: e.tipo.slice(9) }));

  // El paquete de cada tarea. Es lo único que viaja al servidor de la escuela y de ahí a la IA.
  function paquete(tarea, { sesion, metricas, devolucionReglas, historial } = {}) {
    if (tarea === "devolucion") {
      return {
        tarea,
        metricas: metricasAnonimas(metricas),
        devolucionPorReglas: devolucionReglas,
        preguntasDelDocente: textosDePreguntas(sesion).slice(0, 40),
      };
    }
    if (tarea === "clasificar") {
      return { tarea, preguntas: textosDePreguntas(sesion).slice(0, 40).map((p) => p.texto) };
    }
    if (tarea === "evolucion") {
      return {
        tarea,
        observaciones: historial.slice(-12).map((o) => ({ fecha: String(o.fecha).slice(0, 10), ...metricasAnonimas(o.metricas) })),
      };
    }
    throw new Error("Tarea desconocida: " + tarea);
  }

  return { COMUNES, anonimizar, metricasAnonimas, paquete };
})();

if (typeof module !== "undefined") module.exports = Privacidad;
