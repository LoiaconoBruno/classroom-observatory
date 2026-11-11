// Catálogo de evidencia: los únicos estudios que la IA puede citar al sugerir prácticas.
// Cada uno tiene DOI verificado. Los resúmenes y las prácticas están escritos para esta
// herramienta, con cuidado de no atribuirle a un estudio más de lo que encontró.
// La IA devuelve solo el id; la cita completa la arma la página desde este catálogo,
// así no puede inventar una referencia.
const Evidencia = (() => {
  const CATALOGO = [
    {
      id: "rowe1974",
      cita: "Rowe, 1974",
      referencia: "Rowe, M. B. (1974). Wait-time and rewards as instructional variables, their influence on language, logic, and fate control: Part one—wait-time. Journal of Research in Science Teaching, 11(2), 81–94.",
      url: "https://doi.org/10.1002/tea.3660110202",
      encontro: "En clases de ciencias de primaria, los docentes esperaban alrededor de un segundo después de preguntar. Cuando esperaron 3 segundos o más, las respuestas fueron más largas, hubo más respuestas argumentadas y participaron alumnos que antes no lo hacían.",
      practica: "Esperar al menos 3 segundos después de una pregunta antes de volver a hablar, y otro tanto después de una respuesta.",
      indicadores: ["esperaPromedio", "sinRespuesta", "participacion"],
    },
    {
      id: "rowe1986",
      cita: "Rowe, 1986",
      referencia: "Rowe, M. B. (1986). Wait time: Slowing down may be a way of speeding up! Journal of Teacher Education, 37(1), 43–50.",
      url: "https://doi.org/10.1177/002248718603700110",
      encontro: "Revisa la investigación sobre las dos esperas: la que sigue a una pregunta y la que sigue a la respuesta de un alumno. Ambas suelen durar menos de un segundo, y el artículo describe cómo se entrenó a docentes para alargarlas.",
      practica: "Practicar las dos esperas: después de preguntar y después de que un alumno termina de hablar, antes de evaluar o seguir.",
      indicadores: ["esperaPromedio"],
    },
    {
      id: "tobin1987",
      cita: "Tobin, 1987",
      referencia: "Tobin, K. (1987). The role of wait time in higher cognitive level learning. Review of Educational Research, 57(1), 69–95.",
      url: "https://doi.org/10.3102/00346543057001069",
      encontro: "Revisión de estudios de distintas materias y niveles: cuando la espera promedio superó los 3 segundos, cambió el discurso de docentes y alumnos y mejoró el aprendizaje de nivel cognitivo alto en ciencias.",
      practica: "Usar la espera como tiempo para pensar, acompañada de una pregunta que valga la pena pensar.",
      indicadores: ["esperaPromedio", "proporcionAbiertas"],
    },
    {
      id: "nystrand2003",
      cita: "Nystrand et al., 2003",
      referencia: "Nystrand, M., Wu, L. L., Gamoran, A., Zeiser, S., & Long, D. A. (2003). Questions in time: Investigating the structure and dynamics of unfolding classroom discourse. Discourse Processes, 35(2), 135–198.",
      url: "https://doi.org/10.1207/S15326950DP3502_3",
      encontro: "En cientos de clases, las preguntas auténticas (sin respuesta prefijada) y la retoma de lo que dijo un alumno aumentaron la probabilidad de que apareciera una discusión genuina, que fue poco frecuente.",
      practica: "Hacer preguntas sin una única respuesta correcta y armar la pregunta siguiente a partir de lo que dijo un alumno.",
      indicadores: ["proporcionAbiertas", "retomas"],
    },
    {
      id: "howe2013",
      cita: "Howe y Abedin, 2013",
      referencia: "Howe, C., & Abedin, M. (2013). Classroom dialogue: A systematic review across four decades of research. Cambridge Journal of Education, 43(3), 325–356.",
      url: "https://doi.org/10.1080/0305764X.2013.786024",
      encontro: "Revisión de 225 estudios sobre el diálogo en el aula publicados entre 1972 y 2011. Concluye que se sabe mucho más sobre cómo se organiza el diálogo que sobre qué formas de organizarlo benefician más el aprendizaje.",
      practica: "Probar formatos en que los alumnos expliquen y discutan entre ellos, y observar qué cambia, sabiendo que la evidencia sobre su efecto todavía es limitada.",
      indicadores: ["porcentajeDocente", "participacion"],
    },
    {
      id: "michaels2008",
      cita: "Michaels, O'Connor y Resnick, 2008",
      referencia: "Michaels, S., O'Connor, C., & Resnick, L. B. (2008). Deliberative discourse idealized and realized: Accountable talk in the classroom and in civic life. Studies in Philosophy and Education, 27(4), 283–297.",
      url: "https://doi.org/10.1007/s11217-007-9071-1",
      encontro: "Describen el «accountable talk»: discusiones en que los alumnos responden ante la comunidad del aula (se escuchan y construyen sobre lo que dijo otro), ante el conocimiento y ante las normas del buen razonamiento.",
      practica: "Pedirle a otro alumno que reformule, amplíe o discuta lo que dijo un compañero, en vez de que el docente evalúe cada respuesta.",
      indicadores: ["participacion", "concentracion", "retomas"],
    },
    {
      id: "demszky2024",
      cita: "Demszky et al., 2024",
      referencia: "Demszky, D., Liu, J., Hill, H. C., Jurafsky, D., & Piech, C. (2024). Can automated feedback improve teachers' uptake of student ideas? Evidence from a randomized controlled trial in a large-scale online course. Educational Evaluation and Policy Analysis, 46(3), 483–505.",
      url: "https://doi.org/10.3102/01623737231169270",
      encontro: "En un ensayo aleatorizado con 1136 instructores de un curso en línea, una devolución automática sobre la retoma aumentó un 13 % la retoma de lo que decían los alumnos.",
      practica: "Mirar, después de cada clase, cuántas veces se retomó lo que dijo un alumno: la devolución sobre esa práctica, sola, ya la aumenta.",
      indicadores: ["retomas"],
    },
  ];

  const porId = (id) => CATALOGO.find((e) => e.id === id) || null;
  const ids = () => CATALOGO.map((e) => e.id);

  // Lo que se le pasa a la IA: id, qué encontró y la práctica. Sin URLs ni nombres de autores
  // para que no intente escribir la cita: la arma la página.
  const paraPrompt = () => CATALOGO.map(({ id, encontro, practica, indicadores }) => ({ id, encontro, practica, indicadores }));

  return { CATALOGO, porId, ids, paraPrompt };
})();

if (typeof module !== "undefined") module.exports = Evidencia;
