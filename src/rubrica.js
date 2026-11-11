// Cómo se relacionan los indicadores de la herramienta con un marco validado:
// el Framework for Teaching de Charlotte Danielson, en su versión actual (The Danielson
// Group). Solo se nombran sus componentes y se explica la relación con palabras propias:
// la rúbrica (los niveles y sus descriptores) no se copia, y la herramienta no puntúa.
const Rubrica = (() => {
  const MARCO = {
    nombre: "Framework for Teaching (Charlotte Danielson)",
    fuente: "The Danielson Group",
    url: "https://danielsongroup.org/the-framework-for-teaching/",
    dominio: "Dominio 3: Learning Experiences (experiencias de aprendizaje)",
  };

  // Componentes del dominio 3 con los que se relaciona algún indicador.
  const COMPONENTES = [
    { id: "3b", nombre: "Using Questioning and Discussion Techniques", traduccion: "Uso de técnicas de preguntas y discusión" },
    { id: "3c", nombre: "Engaging Students in Learning", traduccion: "Compromiso de los alumnos con el aprendizaje" },
    { id: "3e", nombre: "Responding Flexibly to Student Needs", traduccion: "Respuesta flexible a lo que necesitan los alumnos" },
  ];

  const RELACIONES = [
    { indicador: "porcentajeDocente", nombre: "Tiempo de habla del docente", componentes: ["3c", "3b"],
      relacion: "Cuánto del tiempo de habla queda para los alumnos es una señal de quién hace el trabajo intelectual de la clase." },
    { indicador: "proporcionAbiertas", nombre: "Preguntas abiertas", componentes: ["3b"],
      relacion: "Las preguntas que piden explicar o argumentar abren la discusión; las de respuesta única la cierran." },
    { indicador: "esperaPromedio", nombre: "Tiempo de espera", componentes: ["3b"],
      relacion: "La espera después de preguntar le da a la pregunta tiempo para ser pensada." },
    { indicador: "sinRespuesta", nombre: "Preguntas sin respuesta de los alumnos", componentes: ["3b"],
      relacion: "Una pregunta que responde el propio docente no llega a ser parte de una discusión." },
    { indicador: "retomas", nombre: "Retomas", componentes: ["3b", "3e"],
      relacion: "Usar lo que dijo un alumno para seguir la clase es responder a lo que piensan los alumnos y construir la discusión sobre eso." },
    { indicador: "participacion", nombre: "Alumnos que participaron", componentes: ["3b", "3c"],
      relacion: "Cuántos alumnos hablaron muestra si la discusión y el trabajo alcanzaron a todo el grupo." },
    { indicador: "concentracion", nombre: "Concentración de la palabra", componentes: ["3b", "3c"],
      relacion: "Si pocos alumnos tienen casi todas las intervenciones, la discusión es de ellos, no del grupo." },
  ];

  const NO_CUBRE = [
    "Dominio 1 (planificación y preparación), dominio 2 (ambientes de aprendizaje) y dominio 4 (enseñanza con principios): la herramienta no los observa.",
    "Del dominio 3, la comunicación del propósito y el contenido (3a) y el uso de la evaluación para aprender (3d).",
    "La calidad de lo que se pregunta y se responde: la herramienta cuenta y mide tiempos, no juzga el contenido.",
  ];

  const componente = (id) => COMPONENTES.find((c) => c.id === id);

  // Las relaciones que aplican a una observación (la participación solo si hubo plano).
  function relaciones(metricas) {
    return RELACIONES.filter((r) => !(["participacion", "concentracion"].includes(r.indicador) && !(metricas && metricas.participacion)))
      .map((r) => ({ ...r, componentes: r.componentes.map(componente) }));
  }

  return { MARCO, COMPONENTES, RELACIONES, NO_CUBRE, componente, relaciones };
})();

if (typeof module !== "undefined") module.exports = Rubrica;
