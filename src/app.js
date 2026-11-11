// Interfaz del observatorio: docentes, plano del aula, observación, reporte, IA opcional,
// transcripción local y datos. La lógica está en los otros archivos de src/.
(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pct = (x) => `${Math.round(x * 100)}\u00a0%`;   // espacio que no corta: "63 %" no se parte
  const seg = (x) => `${x.toFixed(1).replace(".", ",")} s`;
  const reloj = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
  const fecha = (iso) => new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
  const NOMBRES = {
    "habla:docente": "Habla el docente", "habla:alumnos": "Habla el grupo de alumnos", "habla:nadie": "Silencio",
    "pregunta:abierta": "Pregunta abierta", "pregunta:cerrada": "Pregunta cerrada", retoma: "Retoma una idea de un alumno",
  };
  const TECLAS = { d: "habla:docente", a: "habla:alumnos", s: "habla:nadie", q: "pregunta:abierta", c: "pregunta:cerrada", r: "retoma" };
  const VISTAS = ["inicio", "preparar", "observar", "historial", "reporte", "ajustes"];

  const e = {
    almacen: null, persistente: true, ajustes: {},
    docente: null, plano: null, modoPlano: "ocupar", lugarEditado: null,
    sesion: null, inicio: null, timer: null, preguntaEnEdicion: null,
    obs: null, esEjemplo: false, historial: [],
    grabador: null, partes: [], audio: null,
    pendiente: null,
  };

  /* Vistas */

  function mostrar(nombre) {
    for (const v of VISTAS) $(`vista-${v}`).hidden = v !== nombre;
    window.scrollTo(0, 0);
    const titulo = $(`vista-${nombre}`).querySelector("h1");
    if (titulo && nombre !== "observar") { titulo.tabIndex = -1; titulo.focus({ preventScroll: true }); }
  }

  document.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-ir]");
    if (b) { ev.preventDefault(); irInicio(); }
  });
  $("nav-inicio").addEventListener("click", (ev) => { ev.preventDefault(); if (!observando()) irInicio(); });
  $("nav-ajustes").addEventListener("click", (ev) => { ev.preventDefault(); if (!observando()) { pintarAjustes(); mostrar("ajustes"); } });

  const observando = () => e.sesion && e.sesion.fin === null && e.inicio !== null;

  async function irInicio() {
    await pintarDocentes();
    mostrar("inicio");
  }

  /* Consentimiento */

  async function conConsentimiento() {
    if (await e.almacen.ajustes.leer("consentimiento")) return true;
    $("consentimiento-error").textContent = "";
    $("dialogo-consentimiento").showModal();
    return false;
  }

  $("dialogo-consentimiento").addEventListener("cancel", (ev) => ev.preventDefault());
  $("form-consentimiento").addEventListener("submit", async (ev) => {
    const valor = ev.submitter ? ev.submitter.value : "";
    if (valor === "ejemplo") { verEjemplo(); return; }
    if (!$("acepto-docente").checked || !$("acepto-uso").checked) {
      ev.preventDefault();
      $("consentimiento-error").textContent = "Para guardar observaciones, marcá las dos casillas.";
      return;
    }
    await e.almacen.ajustes.escribir("consentimiento", { fecha: new Date().toISOString(), version: 1 });
  });
  $("ver-consentimiento").addEventListener("click", () => $("dialogo-consentimiento").showModal());

  /* Docentes */

  async function pintarDocentes() {
    const docentes = await e.almacen.docentes.listar();
    const filas = await Promise.all(docentes.map(async (d) => {
      const obs = await e.almacen.observaciones.deDocente(d.id);
      const ultima = obs.length ? ` · última: ${fecha(obs[obs.length - 1].fecha)}` : "";
      return `<li class="docente"><div><p class="docente__nombre">${esc(d.alias)}</p><p class="docente__dato">${obs.length} ${obs.length === 1 ? "observación" : "observaciones"}${ultima}</p></div>`
        + `<div class="docente__acciones"><button type="button" class="btn btn--primario" data-observar="${esc(d.id)}">Observar</button>`
        + `<button type="button" class="btn" data-historial="${esc(d.id)}">Historial</button></div></li>`;
    }));
    $("docentes").innerHTML = filas.join("") || `<li class="docente__dato">Todavía no hay docentes. Agregá el primero con su nombre o un alias.</li>`;
    if (!e.persistente) $("docentes").insertAdjacentHTML("afterbegin", `<li class="aviso aviso--aviso">Este navegador no permite guardar datos: lo que hagas se pierde al cerrar la pestaña.</li>`);
  }

  $("docentes").addEventListener("click", async (ev) => {
    const obs = ev.target.closest("[data-observar]");
    const his = ev.target.closest("[data-historial]");
    if (obs) preparar(await e.almacen.docentes.obtener(obs.dataset.observar));
    if (his) verHistorial(await e.almacen.docentes.obtener(his.dataset.historial));
  });

  $("form-docente").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    if (!(await conConsentimiento())) return;
    const error = Almacen.validarAlias($("alias").value);
    $("alias-error").textContent = error;
    $("alias").setAttribute("aria-invalid", String(Boolean(error)));
    if (error) { $("alias").focus(); return; }
    await e.almacen.docentes.guardar({ alias: $("alias").value });
    $("alias").value = "";
    await pintarDocentes();
  });

  /* Preparar: plano del aula */

  function opciones(sel, max, valor) {
    sel.innerHTML = Array.from({ length: max }, (_, i) => `<option value="${i + 1}"${i + 1 === valor ? " selected" : ""}>${i + 1}</option>`).join("");
  }

  async function preparar(docente) {
    if (!(await conConsentimiento())) return;
    e.docente = docente;
    e.plano = docente.plano ? Plano.copiar(docente.plano) : Plano.nuevo(5, 6, 25);
    e.lugarEditado = null;
    $("preparar-docente").textContent = `Docente: ${docente.alias}. El plano se recuerda para la próxima observación.`;
    $("curso").value = docente.ultimoCurso || "";
    opciones($("filas"), Plano.FILAS_MAX, e.plano.filas);
    opciones($("columnas"), Plano.COLUMNAS_MAX, e.plano.columnas);
    modoPlano("ocupar");
    pintarPlanoEditor();
    mostrar("preparar");
  }

  function cambiarGrilla() {
    const filas = Number($("filas").value), columnas = Number($("columnas").value);
    const antes = Plano.ocupados(e.plano).length;
    e.plano = Plano.nuevo(filas, columnas, Math.min(antes, filas * columnas, Plano.MAXIMO));
    e.lugarEditado = null;
    $("form-etiqueta").hidden = true;
    pintarPlanoEditor();
  }
  $("filas").addEventListener("change", cambiarGrilla);
  $("columnas").addEventListener("change", cambiarGrilla);

  function modoPlano(modo) {
    e.modoPlano = modo;
    for (const [id, m] of [["modo-ocupar", "ocupar"], ["modo-etiquetar", "etiquetar"]]) {
      $(id).setAttribute("aria-selected", String(m === modo));
      $(id).tabIndex = m === modo ? 0 : -1;
    }
    $("plano-ayuda").textContent = modo === "ocupar"
      ? "Tocá un lugar para marcar si hay un alumno. Hasta 30 alumnos, identificados solo por número o iniciales."
      : "Tocá un lugar ocupado para cambiar su etiqueta: un número o hasta 3 iniciales, nunca un nombre.";
    if (modo === "ocupar") { e.lugarEditado = null; $("form-etiqueta").hidden = true; }
    pintarPlanoEditor();
  }
  $("modo-ocupar").addEventListener("click", () => modoPlano("ocupar"));
  $("modo-etiquetar").addEventListener("click", () => modoPlano("etiquetar"));

  function botonLugar(l, { pulsado = null, clase = "" } = {}) {
    const etiqueta = l.ocupado ? `Alumno ${l.etiqueta}` : "Lugar vacío";
    const presion = pulsado === null ? "" : ` aria-pressed="${pulsado}"`;
    return `<button type="button" class="lugar${l.ocupado ? "" : " lugar--vacio"}${clase}" data-lugar="${l.id}" aria-label="${esc(etiqueta)}"${presion}>${l.ocupado ? esc(l.etiqueta) : "·"}</button>`;
  }

  function pintarPlanoEditor() {
    const p = e.plano;
    $("plano-editor").style.setProperty("--columnas", p.columnas);
    $("plano-editor").innerHTML = p.lugares.map((l) => botonLugar(l, { clase: e.lugarEditado === l.id ? " lugar--elegido" : "" })).join("");
    const n = Plano.ocupados(p).length;
    $("plano-resumen").textContent = `${n} ${n === 1 ? "alumno" : "alumnos"} en una grilla de ${p.filas} × ${p.columnas}.`;
    $("empezar").disabled = n === 0;
  }

  $("plano-editor").addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-lugar]");
    if (!b) return;
    const id = b.dataset.lugar;
    try {
      if (e.modoPlano === "ocupar") Plano.alternar(e.plano, id);
      else {
        const l = e.plano.lugares.find((x) => x.id === id);
        if (!l.ocupado) return;
        e.lugarEditado = id;
        $("form-etiqueta").hidden = false;
        $("etiqueta-lugar").textContent = `(ahora: ${l.etiqueta})`;
        $("etiqueta").value = l.etiqueta;
        $("etiqueta-error").textContent = "";
        $("etiqueta").focus();
      }
      $("plano-resumen").classList.remove("campo__error");
    } catch (err) {
      $("plano-resumen").textContent = err.message;
      return;
    }
    pintarPlanoEditor();
  });

  $("form-etiqueta").addEventListener("submit", (ev) => {
    ev.preventDefault();
    try {
      Plano.etiquetar(e.plano, e.lugarEditado, $("etiqueta").value);
      e.lugarEditado = null;
      $("form-etiqueta").hidden = true;
      pintarPlanoEditor();
    } catch (err) {
      $("etiqueta-error").textContent = err.message;
      $("etiqueta").focus();
    }
  });

  $("empezar").addEventListener("click", async () => {
    const errores = Plano.validar(e.plano);
    if (errores.length) { $("plano-resumen").textContent = errores[0]; return; }
    e.docente = await e.almacen.docentes.guardar({ ...e.docente, plano: Plano.copiar(e.plano), ultimoCurso: $("curso").value.trim() });
    empezarObservacion();
  });

  /* Observar */

  const ahora = () => (performance.now() - e.inicio) / 1000;

  function empezarObservacion() {
    e.sesion = Observacion.nueva(Plano.copiar(e.plano));
    e.inicio = performance.now();
    e.preguntaEnEdicion = null;
    e.audio = null;
    e.partes = [];
    $("observar-docente").textContent = e.docente.alias;
    $("reloj").textContent = "0:00";
    $("form-pregunta").hidden = true;
    $("plano-observar").style.setProperty("--columnas", e.sesion.plano.columnas);
    $("grabacion").hidden = !e.ajustes.transcripcionActiva;
    $("grabar").setAttribute("aria-pressed", "false");
    $("grabar").textContent = "Grabar audio";
    clearInterval(e.timer);
    e.timer = setInterval(() => { $("reloj").textContent = reloj(ahora()); }, 250);
    pintarObservacion();
    mostrar("observar");
    $("terminar").focus({ preventScroll: true });
  }

  function hablanteActual() {
    const ult = [...e.sesion.eventos].reverse().find((x) => x.tipo.startsWith("habla:"));
    return ult || null;
  }

  function pintarObservacion() {
    const h = hablanteActual();
    document.querySelectorAll("#vista-observar [data-ev]").forEach((b) => {
      if (b.dataset.ev.startsWith("habla:")) b.setAttribute("aria-pressed", String(Boolean(h && h.tipo === b.dataset.ev)));
    });
    $("plano-observar").innerHTML = e.sesion.plano.lugares.filter((l) => l.ocupado || true).map((l) => l.ocupado
      ? botonLugar(l, { pulsado: Boolean(h && h.tipo === "habla:alumno" && h.alumno === l.id) })
      : `<span class="lugar lugar--vacio" aria-hidden="true"></span>`).join("");
    const nombre = (x) => (x.tipo === "habla:alumno" ? `Habla el alumno ${etiquetaDe(x.alumno)}` : NOMBRES[x.tipo]) + (x.texto ? `: «${x.texto}»` : "");
    $("log").innerHTML = e.sesion.eventos.slice(-8).reverse().map((x) => `<li><time>${reloj(x.t)}</time><span>${esc(nombre(x))}</span></li>`).join("")
      || `<li><span class="docente__dato">Nada todavía. Atajos: D, A, S, Q, C, R y Z para deshacer.</span></li>`;
    $("ahora").textContent = h ? nombre(h) : "Marcá quién habla para empezar.";
    $("deshacer").disabled = !e.sesion.eventos.length;
  }

  const etiquetaDe = (id) => (e.sesion.plano.lugares.find((l) => l.id === id) || {}).etiqueta || id;

  function marcar(tipo, extra) {
    if (!observando()) return;
    cerrarPregunta();
    const ev = Observacion.registrar(e.sesion, ahora(), tipo, extra);
    if (tipo.startsWith("pregunta:")) {
      e.preguntaEnEdicion = ev;
      $("form-pregunta").hidden = false;
      $("texto-pregunta").value = "";
      $("texto-pregunta").focus({ preventScroll: true });
    }
    pintarObservacion();
  }

  function cerrarPregunta() {
    if (e.preguntaEnEdicion) {
      const t = $("texto-pregunta").value.trim();
      if (t) e.preguntaEnEdicion.texto = t.slice(0, Observacion.LARGO_TEXTO);
    }
    e.preguntaEnEdicion = null;
    $("form-pregunta").hidden = true;
  }

  $("form-pregunta").addEventListener("submit", (ev) => { ev.preventDefault(); cerrarPregunta(); pintarObservacion(); });
  $("texto-pregunta").addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") { ev.preventDefault(); $("texto-pregunta").value = ""; cerrarPregunta(); pintarObservacion(); }
  });

  document.querySelectorAll("#vista-observar [data-ev]").forEach((b) => b.addEventListener("click", () => marcar(b.dataset.ev)));
  $("plano-observar").addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-lugar]");
    if (b) marcar("habla:alumno", { alumno: b.dataset.lugar });
  });

  function deshacer() {
    if (!e.sesion || !e.sesion.eventos.length) return;
    const quitado = Observacion.deshacer(e.sesion);
    if (quitado === e.preguntaEnEdicion) { e.preguntaEnEdicion = null; $("form-pregunta").hidden = true; }
    pintarObservacion();
  }
  $("deshacer").addEventListener("click", deshacer);

  document.addEventListener("keydown", (ev) => {
    if ($("vista-observar").hidden || !observando()) return;
    if ((ev.target instanceof Element && ev.target.matches("input, textarea, select")) || ev.metaKey || ev.ctrlKey || ev.altKey) return;
    const k = ev.key.toLowerCase();
    if (TECLAS[k]) { ev.preventDefault(); marcar(TECLAS[k]); }
    else if (k === "z") { ev.preventDefault(); deshacer(); }
  });

  window.addEventListener("beforeunload", (ev) => { if (observando()) { ev.preventDefault(); ev.returnValue = ""; } });

  $("terminar").addEventListener("click", async () => {
    if (!observando()) return;
    const t = ahora();
    if (t < 60 && !confirm("La observación dura menos de un minuto y no alcanza para una devolución. ¿Terminar igual?")) return;
    cerrarPregunta();
    Observacion.terminar(e.sesion, t);
    clearInterval(e.timer);
    await detenerGrabacion();
    const obs = await e.almacen.observaciones.guardar({ docenteId: e.docente.id, curso: $("curso").value.trim(), sesion: e.sesion });
    e.inicio = null;
    await verReporte(obs);
  });

  /* Grabación para la transcripción local */

  $("grabar").addEventListener("click", async () => {
    if (e.grabador) { await detenerGrabacion(); return; }
    try {
      const flujo = await navigator.mediaDevices.getUserMedia({ audio: true });
      e.partes = [];
      e.grabador = new MediaRecorder(flujo);
      e.grabador.ondataavailable = (x) => { if (x.data.size) e.partes.push(x.data); };
      e.grabador.start(1000);
      $("grabar").setAttribute("aria-pressed", "true");
      $("grabar").textContent = "Detener la grabación";
      $("grabacion-estado").textContent = "Grabando en este dispositivo. El audio no se guarda ni sale de acá.";
    } catch {
      $("grabacion-estado").textContent = "No se pudo usar el micrófono. Revisá el permiso del navegador.";
    }
  });

  function detenerGrabacion() {
    return new Promise((ok) => {
      const g = e.grabador;
      if (!g) { ok(); return; }
      g.onstop = () => {
        g.stream.getTracks().forEach((t) => t.stop());
        e.audio = e.partes.length ? new Blob(e.partes, { type: g.mimeType || "audio/webm" }) : null;
        e.grabador = null;
        $("grabar").setAttribute("aria-pressed", "false");
        $("grabar").textContent = "Grabar audio";
        ok();
      };
      g.stop();
    });
  }

  /* Historial */

  async function verHistorial(docente) {
    e.docente = docente;
    const obs = await e.almacen.observaciones.deDocente(docente.id);
    $("historial-docente").textContent = `${docente.alias} · ${obs.length} ${obs.length === 1 ? "observación" : "observaciones"}`;
    $("historial-tabla").innerHTML = obs.length
      ? `<thead><tr><th>Fecha</th><th>Curso</th><th class="num">Duración</th><th class="num">Habla del docente</th><th class="num">Preguntas abiertas</th><th class="num">Espera</th><th class="num">Participación</th><th></th></tr></thead><tbody>`
        + obs.slice().reverse().map((o) => {
          const m = Observacion.metricas(o.sesion);
          return `<tr><td>${fecha(o.fecha)}</td><td>${esc(o.curso || "—")}</td><td class="num">${reloj(m.duracion)}</td><td class="num">${pct(m.porcentajeDocente)}</td>`
            + `<td class="num">${m.abiertas} de ${m.preguntas}</td><td class="num">${m.esperaPromedio === null ? "—" : seg(m.esperaPromedio)}</td>`
            + `<td class="num">${m.participacion && m.participacion.total ? pct(m.participacion.porcentaje) : "—"}</td>`
            + `<td><button type="button" class="btn" data-ver="${esc(o.id)}">Ver</button></td></tr>`;
        }).join("") + "</tbody>"
      : `<tbody><tr><td>Todavía no hay observaciones de este docente.</td></tr></tbody>`;
    mostrar("historial");
  }

  $("historial-tabla").addEventListener("click", async (ev) => {
    const b = ev.target.closest("[data-ver]");
    if (b) verReporte(await e.almacen.observaciones.obtener(b.dataset.ver));
  });
  $("historial-observar").addEventListener("click", () => preparar(e.docente));
  $("borrar-docente").addEventListener("click", async () => {
    if (!confirm(`¿Borrar a ${e.docente.alias} y todas sus observaciones? No se puede deshacer.`)) return;
    await e.almacen.docentes.borrar(e.docente.id);
    irInicio();
  });

  /* Reporte */

  function verEjemplo() {
    e.esEjemplo = true;
    e.docente = { id: null, alias: "Docente de ejemplo" };
    e.audio = null;
    pintarReporte({ id: "ejemplo", docenteId: null, fecha: new Date().toISOString(), curso: "2.º A · Física (clase inventada)", sesion: Observacion.ejemplo(), ia: {} }, []);
    mostrar("reporte");
  }
  $("ver-ejemplo").addEventListener("click", verEjemplo);
  $("portada-ejemplo").addEventListener("click", verEjemplo);
  $("portada-empezar").addEventListener("click", async () => {
    $("form-docente").scrollIntoView({ behavior: "smooth", block: "center" });
    if (await conConsentimiento()) $("alias").focus({ preventScroll: true });
  });
  $("dialogo-consentimiento").addEventListener("close", () => {
    if ($("dialogo-consentimiento").returnValue !== "ejemplo" && document.activeElement === document.body) $("alias").focus();
  });

  async function verReporte(obs) {
    e.esEjemplo = false;
    e.docente = await e.almacen.docentes.obtener(obs.docenteId);
    const historial = await e.almacen.observaciones.deDocente(obs.docenteId);
    pintarReporte(obs, historial);
    mostrar("reporte");
  }

  function pintarReporte(obs, historial) {
    e.obs = obs;
    e.historial = historial;
    const m = Observacion.metricas(obs.sesion);
    const d = Observacion.devolucion(m);
    const numero = historial.findIndex((o) => o.id === obs.id);
    const dato = (k, v) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`;
    $("reporte-datos").innerHTML = dato("Docente", e.docente ? e.docente.alias : "—") + dato("Fecha", fecha(obs.fecha))
      + (obs.curso ? dato("Curso", obs.curso) : "") + dato("Duración", `${reloj(m.duracion)} min`)
      + (numero >= 0 ? dato("Observación", `${numero + 1} de ${historial.length}`) : "");

    const p = m.participacion;
    // Cada indicador dice qué mide en palabras simples. Solo la espera tiene una
    // referencia de la investigación (Rowe, 1974): se marca en una barra, sin colores
    // de bien o mal, porque la devolución no es un puntaje.
    const cifra = (k, v, det = "", que = "", extra = "") => `<div class="cifra"><p class="cifra__k">${k}</p><p class="cifra__v">${v}</p>${det ? `<p class="cifra__d">${det}</p>` : ""}${extra}${que ? `<p class="cifra__que">${que}</p>` : ""}</div>`;
    const ESPERA_REF = 3;
    const escalaEspera = m.esperaPromedio === null ? "" : (() => {
      const tope = Math.max(6, Math.ceil(m.esperaPromedio));
      const a = (x) => `${Math.min(100, (x / tope) * 100)}%`;
      return `<div class="escala" role="img" aria-label="Espera promedio ${seg(m.esperaPromedio)}; referencia de la investigación: ${ESPERA_REF} segundos"><span class="escala__valor" style="width:${a(m.esperaPromedio)}"></span><span class="escala__ref" style="left:${a(ESPERA_REF)}"></span></div><p class="cifra__ref">Referencia: ${ESPERA_REF} s o más (Rowe, 1974)</p>`;
    })();
    $("cifras").innerHTML = cifra("Habla del docente", pct(m.porcentajeDocente), "del tiempo en que alguien habló", "Qué parte de la charla de la clase fue del docente.")
      + cifra("Preguntas", m.preguntas, `${m.abiertas} ${m.abiertas === 1 ? "abierta" : "abiertas"}, ${m.cerradas} ${m.cerradas === 1 ? "cerrada" : "cerradas"}`, "Abiertas: admiten varias respuestas. Cerradas: tienen una sola.")
      + cifra("Espera promedio", m.esperaPromedio === null ? "—" : seg(m.esperaPromedio), `${m.esperasCortas} de ${m.esperas.length} esperas por debajo de 3 s`, "Cuánto se esperó, después de preguntar, antes de volver a hablar.", escalaEspera)
      + cifra("Retomas", m.retomas, "ideas de alumnos usadas para seguir", "Veces que el docente usó lo que dijo un alumno para avanzar.")
      + (p && p.total ? cifra("Participación", `${p.participaron} de ${p.presentes}`, `${pct(p.porcentaje)} de los alumnos habló`, "Cuántos alumnos hablaron al menos una vez.") : "")
      + (p && p.participaron > 3 ? cifra("Concentración", pct(p.tresPrimeros), `de las intervenciones, de los 3 que más hablaron (Gini ${p.gini.toFixed(2).replace(".", ",")})`, "Si la palabra se repartió o quedó en pocos.") : "");

    const total = m.habla.docente + m.habla.alumnos + m.habla.nadie || 1;
    const tramo = (clase, k, nombre) => (m.habla[k] > 0 ? `<span class="${clase}" style="flex:${m.habla[k] / total}">${pct(m.habla[k] / total)}</span>` : "");
    $("barra").innerHTML = tramo("b-docente", "docente") + tramo("b-alumnos", "alumnos") + tramo("b-silencio", "nadie");
    const resumenBarra = `Docente ${pct(m.habla.docente / total)}, alumnos ${pct(m.habla.alumnos / total)}, silencio ${pct(m.habla.nadie / total)} del tiempo total.`;
    $("barra").setAttribute("aria-label", resumenBarra);
    $("barra-leyenda").textContent = resumenBarra;

    $("sec-participacion").hidden = !(p && p.presentes);
    if (p && p.presentes) {
      $("participacion-texto").textContent = p.total
        ? `Hablaron ${p.participaron} de ${p.presentes} alumnos (${pct(p.porcentaje)}), en ${p.total} intervenciones. `
          + (p.nunca.length ? `No hablaron: ${p.nunca.join(", ")}. ` : "Hablaron todos. ")
          + (p.participaron > 3 ? `Los tres que más hablaron hicieron el ${pct(p.tresPrimeros)} de las intervenciones.` : "")
        : "No se marcó a ningún alumno en particular: la participación por alumno no se puede calcular.";
      const plano = obs.sesion.plano;
      $("plano-mapa").style.setProperty("--columnas", plano.columnas);
      $("plano-mapa").setAttribute("aria-label", `Mapa de participación: ${$("participacion-texto").textContent}`);
      $("plano-mapa").innerHTML = plano.lugares.map((l) => {
        if (!l.ocupado) return `<span class="lugar lugar--vacio" aria-hidden="true"></span>`;
        const n = p.intervenciones[l.id] || 0;
        const nivel = n === 0 ? " lugar--nunca" : ` lugar--habla-${Math.min(3, n)}`;
        return `<span class="lugar${nivel}">${esc(l.etiqueta)}<small>${n}</small></span>`;
      }).join("");
    }

    $("fortalezas").innerHTML = d.fortalezas.map((x) => `<li>${esc(x)}</li>`).join("") || `<li class="lista--suave">Nada para destacar con estos indicadores.</li>`;
    $("preguntas").innerHTML = d.preguntas.map((x) => `<li>${esc(x)}</li>`).join("") || `<li class="lista--suave">Nada para revisar con estos indicadores.</li>`;

    pintarRegistradas();
    pintarTranscripcion();
    pintarIA();
    pintarEvolucion();
    pintarMarco(m);
    $("nomide").innerHTML = Observacion.NO_MIDE.map((x) => `<li>${esc(x)}</li>`).join("");
    $("borrar-observacion").hidden = e.esEjemplo;
  }

  function preguntasDe(obs) {
    return obs.sesion.eventos.map((x, i) => ({ x, i })).filter(({ x }) => x.tipo.startsWith("pregunta:"));
  }

  function pintarRegistradas() {
    const cla = e.obs.ia && e.obs.ia.clasificar ? e.obs.ia.clasificar.resultado.clasificacion : [];
    const conTexto = preguntasDe(e.obs).filter(({ x }) => x.texto).map(({ i }) => i);
    $("registradas").innerHTML = preguntasDe(e.obs).map(({ x, i }) => {
      const marca = x.tipo.slice(9);
      const k = conTexto.indexOf(i);
      const c = k >= 0 ? cla.find((y) => y.indice === k) : null;
      const ia = c ? ` · IA: <span class="${c.tipo === marca ? "coincide" : "difiere"}">${c.tipo}${c.tipo === marca ? " (coincide)" : ` (marcada ${marca})`}</span> — ${esc(c.motivo)}` : "";
      return `<li class="registrada"><span class="registrada__meta">${reloj(x.t)} · marcada ${marca}${ia}</span>`
        + `<input data-evento="${i}" value="${esc(x.texto || "")}" maxlength="${Observacion.LARGO_TEXTO}" placeholder="Sin texto" aria-label="Texto de la pregunta de ${reloj(x.t)}">`
        + `<span class="registrada__texto">${esc(x.texto || "(sin texto)")}</span></li>`;
    }).join("") || `<li class="lista--suave">No se registraron preguntas.</li>`;
  }

  $("registradas").addEventListener("change", async (ev) => {
    const input = ev.target.closest("[data-evento]");
    if (!input) return;
    const evento = e.obs.sesion.eventos[Number(input.dataset.evento)];
    const t = input.value.trim().slice(0, Observacion.LARGO_TEXTO);
    if (t) evento.texto = t; else delete evento.texto;
    if (!e.esEjemplo) await e.almacen.observaciones.guardar(e.obs);
    const span = input.nextElementSibling;
    if (span) span.textContent = t || "(sin texto)";
  });

  /* Transcripción local */

  function pintarTranscripcion() {
    const visible = Boolean(e.ajustes.transcripcionActiva && e.audio && !e.esEjemplo);
    $("transcripcion").hidden = !visible;
    if (visible) {
      $("transcripcion-estado").textContent = `Hay ${Math.round(e.audio.size / 1024)} KB de audio de esta clase, solo en la memoria de esta pestaña. La primera vez se descarga el modelo Whisper (unos ${Transcripcion.TAMANO_MB} MB).`;
      $("sugeridas").innerHTML = "";
    }
  }

  $("transcribir").addEventListener("click", async () => {
    if (!e.audio) return;
    const b = $("transcribir");
    b.disabled = true;
    $("transcripcion-estado").textContent = "Preparando el modelo…";
    try {
      const texto = await Transcripcion.transcribir(e.audio, {
        progreso: (x) => { if (x && x.status === "progress" && x.total) $("transcripcion-estado").textContent = `Descargando el modelo: ${Math.round((x.loaded / x.total) * 100)} %`; },
      });
      const halladas = Transcripcion.preguntas(texto);
      $("transcripcion-estado").textContent = halladas.length
        ? `Se encontraron ${halladas.length} preguntas en la transcripción. Usalas para completar las preguntas registradas.`
        : "La transcripción no tiene preguntas reconocibles.";
      $("sugeridas").innerHTML = halladas.map((q, k) => `<li><span>${esc(q)}</span><button type="button" class="btn" data-sugerida="${k}">Usar en la próxima pregunta sin texto</button></li>`).join("");
      $("sugeridas").dataset.textos = JSON.stringify(halladas);
    } catch (err) {
      $("transcripcion-estado").textContent = `No se pudo transcribir: ${err.message}`;
    } finally {
      b.disabled = false;
    }
  });

  $("sugeridas").addEventListener("click", async (ev) => {
    const b = ev.target.closest("[data-sugerida]");
    if (!b) return;
    const textos = JSON.parse($("sugeridas").dataset.textos || "[]");
    const libre = preguntasDe(e.obs).find(({ x }) => !x.texto);
    if (!libre) { b.textContent = "No quedan preguntas sin texto"; return; }
    libre.x.texto = textos[Number(b.dataset.sugerida)].slice(0, Observacion.LARGO_TEXTO);
    await e.almacen.observaciones.guardar(e.obs);
    b.closest("li").remove();
    pintarRegistradas();
  });

  /* IA */

  function pintarIA() {
    const activa = Boolean(e.ajustes.iaActiva && e.ajustes.servidor && e.ajustes.codigo);
    $("ia-apagada").hidden = activa;
    $("ia-acciones").hidden = !activa;
    $("ia-apagada").querySelector("p").textContent = e.ajustes.iaActiva
      ? "La IA está activada, pero falta la dirección o el código del servidor de la escuela (en Ajustes)."
      : "La IA está apagada. Se puede activar en Ajustes, con la dirección y el código del servidor de la escuela.";
    $("ia-evolucion").disabled = e.historial.length < 2;
    $("ia-evolucion").title = e.historial.length < 2 ? "Hacen falta al menos dos observaciones del mismo docente" : "";
    $("ia-estado").textContent = "";
    const ia = e.obs.ia || {};
    const hay = Object.keys(ia).length;
    $("sec-ia").hidden = !e.ajustes.iaActiva && !hay;
    $("ia-resultados").innerHTML = [pintarDevolucionIA(ia.devolucion), pintarClasificacionIA(ia.clasificar), pintarEvolucionIA(ia.evolucion)].join("");
  }

  const firma = (r) => `<span class="chip chip--acento">${esc(r.modelo)}</span><span class="leyenda">${fecha(r.fecha)}${r.uso ? ` · ${r.uso.entrada} tokens de entrada, ${r.uso.salida} de salida` : ""}</span>`;

  function pintarDevolucionIA(r) {
    if (!r) return "";
    const x = r.resultado;
    const practicas = IA.conCitas(x.practicas, Evidencia);
    const fuentes = [...new Map(practicas.map((p) => [p.fuente.id, p.fuente])).values()];
    return `<div class="ia-bloque"><h3>Devolución con IA ${firma(r)}</h3>`
      + (x.fortalezas.length ? `<h4>Lo que salió bien</h4><ul class="lista">${x.fortalezas.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>` : "")
      + `<h4>Preguntas para pensar</h4><ul class="lista">${x.preguntas.map((q) => `<li>${esc(q.pregunta)}</li>`).join("")}</ul>`
      + (practicas.length ? `<h4>Prácticas para probar</h4>${practicas.map((p) => `<div class="practica"><p><strong>${esc(p.practica)}</strong></p><p>${esc(p.porque)}</p><cite>${esc(p.fuente.cita)}: ${esc(p.fuente.encontro)}</cite></div>`).join("")}` : "")
      + (fuentes.length ? `<h4>Referencias</h4><ul class="referencias">${fuentes.map((f) => `<li>${esc(f.referencia)} <a href="${esc(f.url)}">${esc(f.url)}</a></li>`).join("")}</ul>` : "")
      + `</div>`;
  }

  function pintarClasificacionIA(r) {
    if (!r) return "";
    const conTexto = preguntasDe(e.obs).filter(({ x }) => x.texto);
    const coinciden = r.resultado.clasificacion.filter((c) => conTexto[c.indice] && conTexto[c.indice].x.tipo.slice(9) === c.tipo).length;
    return `<div class="ia-bloque"><h3>Clasificación de preguntas con IA ${firma(r)}</h3>`
      + `<p>La IA coincidió con la marca del observador en ${coinciden} de ${r.resultado.clasificacion.length} preguntas con texto. El detalle está en "Preguntas registradas".</p></div>`;
  }

  const NOMBRE_INDICADOR = {
    porcentajeDocente: "Habla del docente", proporcionAbiertas: "Preguntas abiertas", esperaPromedio: "Espera", sinRespuesta: "Preguntas sin respuesta",
    retomas: "Retomas", participacion: "Participación", concentracion: "Concentración",
  };

  function pintarEvolucionIA(r) {
    if (!r) return "";
    const x = r.resultado;
    const flecha = { subio: "↑ subió", bajo: "↓ bajó", estable: "→ estable" };
    return `<div class="ia-bloque"><h3>Evolución con IA ${firma(r)}</h3><p>${esc(x.resumen)}</p>`
      + (x.cambios.length ? `<ul class="lista">${x.cambios.map((c) => `<li><strong>${esc(NOMBRE_INDICADOR[c.indicador])}: ${flecha[c.direccion]}.</strong> ${esc(c.comentario)}</li>`).join("")}</ul>` : "")
      + (x.preguntas.length ? `<h4>Preguntas para pensar</h4><ul class="lista">${x.preguntas.map((q) => `<li>${esc(q)}</li>`).join("")}</ul>` : "")
      + `</div>`;
  }

  document.querySelectorAll("[data-ia]").forEach((b) => b.addEventListener("click", () => prepararEnvio(b.dataset.ia)));

  function prepararEnvio(tarea) {
    const m = Observacion.metricas(e.obs.sesion);
    let paquete;
    try {
      if (tarea === "clasificar" && !preguntasDe(e.obs).some(({ x }) => x.texto)) throw new Error("Para clasificar, escribí el texto de al menos una pregunta.");
      paquete = Privacidad.paquete(tarea, {
        sesion: e.obs.sesion, metricas: m, devolucionReglas: Observacion.devolucion(m),
        historial: e.historial.map((o) => ({ fecha: o.fecha, metricas: Observacion.metricas(o.sesion) })),
      });
    } catch (err) {
      $("ia-estado").textContent = err.message;
      return;
    }
    e.pendiente = { tarea, paquete };
    $("envio-json").textContent = JSON.stringify(paquete, null, 2);
    $("dialogo-envio").showModal();
  }

  $("dialogo-envio").addEventListener("close", async () => {
    if ($("dialogo-envio").returnValue !== "mandar" || !e.pendiente) { e.pendiente = null; return; }
    const { tarea, paquete } = e.pendiente;
    e.pendiente = null;
    const botones = document.querySelectorAll("[data-ia]");
    botones.forEach((b) => { b.disabled = true; });
    $("ia-estado").textContent = "Consultando a la IA a través del servidor de la escuela…";
    try {
      const r = await IA.pedir({ url: e.ajustes.servidor, codigo: e.ajustes.codigo, paquete });
      e.obs.ia = { ...(e.obs.ia || {}), [tarea]: { resultado: r.resultado, modelo: r.modelo, uso: r.uso || null, fecha: new Date().toISOString() } };
      if (!e.esEjemplo) await e.almacen.observaciones.guardar(e.obs);
      pintarRegistradas();
      pintarIA();
      $("ia-estado").textContent = "Listo.";
    } catch (err) {
      $("ia-estado").textContent = err.message;
    } finally {
      botones.forEach((b) => { b.disabled = false; });
      $("ia-evolucion").disabled = e.historial.length < 2;
    }
  });

  /* Evolución sin IA */

  function pintarEvolucion() {
    const h = e.historial;
    $("sec-evolucion").hidden = h.length < 2;
    if (h.length < 2) return;
    const filas = h.map((o) => ({ o, m: Observacion.metricas(o.sesion) }));
    const col = (titulo, f) => `<tr><th scope="row">${titulo}</th>${filas.map(f).join("")}</tr>`;
    $("evolucion-tabla").innerHTML = `<thead><tr><th>Indicador</th>${filas.map(({ o }) => `<th class="num">${fecha(o.fecha)}${o.id === e.obs.id ? " (esta)" : ""}</th>`).join("")}</tr></thead><tbody>`
      + col("Habla del docente", ({ m }) => `<td class="num">${pct(m.porcentajeDocente)}</td>`)
      + col("Preguntas abiertas", ({ m }) => `<td class="num">${m.abiertas} de ${m.preguntas}</td>`)
      + col("Espera promedio", ({ m }) => `<td class="num">${m.esperaPromedio === null ? "—" : seg(m.esperaPromedio)}</td>`)
      + col("Retomas", ({ m }) => `<td class="num">${m.retomas}</td>`)
      + col("Participación", ({ m }) => `<td class="num">${m.participacion && m.participacion.total ? pct(m.participacion.porcentaje) : "—"}</td>`)
      + "</tbody>";
  }

  /* Marco validado */

  function pintarMarco(m) {
    const M = Rubrica.MARCO;
    $("marco-intro").innerHTML = `Cada indicador se relaciona con componentes del ${esc(M.dominio)} del <a href="${esc(M.url)}">${esc(M.nombre)}</a>. `
      + "La herramienta no puntúa con ese marco: lo usa para que la conversación con el docente tenga un lenguaje compartido.";
    $("marco-tabla").innerHTML = `<thead><tr><th>Indicador</th><th>Componente</th><th>Relación</th></tr></thead><tbody>`
      + Rubrica.relaciones(m).map((r) => `<tr><td data-etiqueta="Indicador">${esc(r.nombre)}</td><td data-etiqueta="Componente">${r.componentes.map((c) => `${c.id} · ${esc(c.traduccion)}`).join("<br>")}</td><td data-etiqueta="Relación">${esc(r.relacion)}</td></tr>`).join("")
      + "</tbody>";
    $("marco-nocubre").textContent = `Lo que no cubre: ${Rubrica.NO_CUBRE.join(" ")}`;
  }

  /* Acciones del reporte */

  $("reporte-volver").addEventListener("click", () => { if (e.esEjemplo || !e.docente) irInicio(); else verHistorial(e.docente); });
  $("imprimir").addEventListener("click", () => window.print());

  function bajar(datos, nombre) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" }));
    a.download = nombre;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  $("exportar-una").addEventListener("click", () => {
    const m = Observacion.metricas(e.obs.sesion);
    bajar({ formato: "observatorio-de-clase/observacion", docente: e.docente ? e.docente.alias : null, observacion: e.obs, metricas: m, devolucion: Observacion.devolucion(m) },
      `observacion-${e.obs.fecha.slice(0, 10)}.json`);
  });

  $("borrar-observacion").addEventListener("click", async () => {
    if (e.esEjemplo || !confirm("¿Borrar esta observación? No se puede deshacer.")) return;
    await e.almacen.observaciones.borrar(e.obs.id);
    verHistorial(e.docente);
  });

  /* Ajustes */

  async function cargarAjustes() {
    const al = e.almacen.ajustes;
    e.ajustes = {
      iaActiva: Boolean(await al.leer("iaActiva", false)),
      servidor: (await al.leer("servidor", "")) || "",
      codigo: (await al.leer("codigoAcceso", "")) || "",
      transcripcionActiva: Boolean(await al.leer("transcripcionActiva", false)),
    };
  }

  function pintarAjustes() {
    $("ia-activa").checked = e.ajustes.iaActiva;
    $("servidor").value = e.ajustes.servidor;
    $("codigo").value = e.ajustes.codigo;
    $("ia-config").hidden = !e.ajustes.iaActiva;
    $("transcripcion-activa").checked = e.ajustes.transcripcionActiva;
    $("datos-estado").textContent = "";
  }

  $("ia-activa").addEventListener("change", async () => {
    e.ajustes.iaActiva = $("ia-activa").checked;
    $("ia-config").hidden = !e.ajustes.iaActiva;
    await e.almacen.ajustes.escribir("iaActiva", e.ajustes.iaActiva);
  });
  $("servidor").addEventListener("change", async () => {
    const v = $("servidor").value.trim();
    const error = v ? IA.validarUrl(v) : "";
    $("servidor-error").textContent = error;
    $("servidor").setAttribute("aria-invalid", String(Boolean(error)));
    if (error) return;
    e.ajustes.servidor = v;
    await e.almacen.ajustes.escribir("servidor", v);
  });
  $("codigo").addEventListener("change", async () => {
    e.ajustes.codigo = $("codigo").value.trim();
    await e.almacen.ajustes.escribir("codigoAcceso", e.ajustes.codigo);
  });
  $("transcripcion-activa").addEventListener("change", async () => {
    e.ajustes.transcripcionActiva = $("transcripcion-activa").checked;
    await e.almacen.ajustes.escribir("transcripcionActiva", e.ajustes.transcripcionActiva);
  });

  $("exportar-todo").addEventListener("click", async () => {
    bajar(await e.almacen.exportar(), `observatorio-de-clase-${new Date().toISOString().slice(0, 10)}.json`);
    $("datos-estado").textContent = "Exportado. El código de acceso al servidor no se incluye.";
  });
  $("importar").addEventListener("change", async () => {
    const archivo = $("importar").files[0];
    $("importar").value = "";
    if (!archivo) return;
    try {
      const r = await e.almacen.importar(JSON.parse(await archivo.text()));
      $("datos-estado").textContent = `Importado: ${r.docentes} docentes y ${r.observaciones} observaciones.`;
      await cargarAjustes();
      pintarAjustes();
    } catch (err) {
      $("datos-estado").textContent = `No se pudo importar: ${err.message}`;
    }
  });
  $("borrar-todo").addEventListener("click", async () => {
    if (!confirm("¿Borrar todos los docentes, observaciones y ajustes de este dispositivo? No se puede deshacer. Si querés una copia, exportá antes.")) return;
    await e.almacen.borrarTodo();
    await cargarAjustes();
    pintarAjustes();
    $("datos-estado").textContent = "Se borró todo.";
  });

  /* Arranque */

  async function iniciar() {
    // El enlace con ?ejemplo muestra la clase inventada sin tocar el almacenamiento.
    if (new URLSearchParams(location.search).has("ejemplo")) {
      e.almacen = Almacen.crear(Almacen.memoria());
      e.persistente = false;
      await cargarAjustes();
      verEjemplo();
      return;
    }
    try {
      if (!globalThis.indexedDB) throw new Error("sin IndexedDB");
      const almacen = Almacen.crear(Almacen.indexedDB());
      const espera = new Promise((_, mal) => setTimeout(() => mal(new Error("IndexedDB no responde")), 3000));
      await Promise.race([almacen.ajustes.leer("consentimiento"), espera]);
      e.almacen = almacen;
    } catch {
      e.almacen = Almacen.crear(Almacen.memoria());
      e.persistente = false;
    }
    await cargarAjustes();
    // El aviso de consentimiento aparece cuando se va a guardar algo (agregar un
    // docente o preparar una observación), no al abrir: primero se ve qué es la app.
    await irInicio();
  }

  iniciar();
})();
