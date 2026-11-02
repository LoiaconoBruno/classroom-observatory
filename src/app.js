// Interfaz: reloj, botones y atajos para registrar, y el reporte final.
(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const NOMBRES = {
    "habla:docente": "Habla el docente", "habla:alumnos": "Hablan los alumnos", "habla:nadie": "Silencio",
    "pregunta:abierta": "Pregunta abierta", "pregunta:cerrada": "Pregunta cerrada", "retoma": "Retoma una idea de un alumno",
  };
  const TECLAS = { d: "habla:docente", a: "habla:alumnos", s: "habla:nadie", q: "pregunta:abierta", c: "pregunta:cerrada", r: "retoma" };

  let sesion = Observacion.nueva();
  let inicio = null;   // performance.now() al empezar
  let timer = null;
  let hablante = null;

  const ahora = () => (performance.now() - inicio) / 1000;
  const reloj = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

  function botones(activos) {
    document.querySelectorAll("[data-ev]").forEach((b) => {
      b.disabled = !activos;
      b.classList.toggle("activo", b.dataset.ev === hablante);
    });
    $("terminar").disabled = !activos;
    $("deshacer").disabled = !sesion.eventos.length;
  }

  function log() {
    $("log").innerHTML = sesion.eventos.slice(-8).reverse()
      .map((e) => `<li><span class="mono">${reloj(e.t)}</span> · ${NOMBRES[e.tipo]}</li>`).join("") || '<li class="muted">Nada todavía.</li>';
  }

  function marcar(tipo) {
    if (inicio === null || sesion.fin !== null) return;
    Observacion.registrar(sesion, ahora(), tipo);
    if (tipo.startsWith("habla:")) hablante = tipo;
    botones(true); log(); reporte();
  }

  function empezar() {
    sesion = Observacion.nueva();
    inicio = performance.now();
    hablante = null;
    clearInterval(timer);
    timer = setInterval(() => { $("reloj").textContent = reloj(ahora()); }, 250);
    $("empezar").textContent = "Reiniciar";
    $("estado").textContent = "Observando… marcá quién habla y cada pregunta. Atajos: D, A, S, Q, C, R.";
    $("reporte").hidden = true;
    botones(true); log();
  }

  function terminar() {
    if (inicio === null) return;
    Observacion.terminar(sesion, ahora());
    clearInterval(timer);
    botones(false); log(); reporte();
  }

  function reporte() {
    const enCurso = sesion.fin === null;
    const m = Observacion.metricas(sesion, enCurso ? (inicio === null ? 0 : ahora()) : sesion.fin);
    if (!sesion.eventos.length) return;
    $("reporte").hidden = false;
    if (!enCurso) $("estado").textContent = `Observación de ${reloj(m.duracion)} minutos.`;
    const pct = (x) => Math.round(x * 100) + " %";
    const stat = (k, v) => `<div class="stat"><div class="k">${k}</div><div class="v">${v}</div></div>`;
    $("stats").innerHTML = stat("Docente / tiempo de habla", pct(m.porcentajeDocente))
      + stat("Preguntas", `${m.preguntas} (${m.abiertas} abiertas)`)
      + stat("Espera promedio", m.esperaPromedio === null ? "—" : m.esperaPromedio.toFixed(1).replace(".", ",") + " s")
      + stat("Retomas", m.retomas);
    const total = m.habla.docente + m.habla.alumnos + m.habla.nadie || 1;
    const seg = (q, col, txt) => m.habla[q] > 0 ? `<div style="flex:${m.habla[q] / total};background:${col}">${txt} ${pct(m.habla[q] / total)}</div>` : "";
    $("barra").innerHTML = seg("docente", "var(--s1)", "Docente") + seg("alumnos", "var(--s2)", "Alumnos") + seg("nadie", "var(--muted)", "Silencio");
    const d = Observacion.devolucion(m);
    $("fortalezas").innerHTML = d.fortalezas.map((x) => `<li>${esc(x)}</li>`).join("") || '<li class="muted">Nada para destacar todavía con estos indicadores.</li>';
    $("preguntas").innerHTML = d.preguntas.map((x) => `<li>${esc(x)}</li>`).join("") || '<li class="muted">Nada para revisar con estos indicadores.</li>';
    $("nomide").innerHTML = Observacion.NO_MIDE.map((x) => `<li>${esc(x)}</li>`).join("");
  }

  $("empezar").addEventListener("click", () => {
    if (sesion.eventos.length && sesion.fin === null && !confirm("¿Empezar de nuevo? Se pierde la observación en curso.")) return;
    empezar();
  });
  $("terminar").addEventListener("click", terminar);
  $("deshacer").addEventListener("click", () => {
    const fueTerminada = sesion.fin !== null && inicio !== null;
    Observacion.deshacer(sesion);
    const ult = [...sesion.eventos].reverse().find((e) => e.tipo.startsWith("habla:"));
    hablante = ult ? ult.tipo : null;
    if (fueTerminada) { inicio = performance.now() - (sesion.eventos.length ? sesion.eventos[sesion.eventos.length - 1].t * 1000 : 0); timer = setInterval(() => { $("reloj").textContent = reloj(ahora()); }, 250); }
    botones(inicio !== null); log(); reporte();
  });
  document.querySelectorAll("[data-ev]").forEach((b) => b.addEventListener("click", () => marcar(b.dataset.ev)));
  document.addEventListener("keydown", (e) => {
    if ((e.target instanceof Element && e.target.matches("input, textarea, select")) || e.metaKey || e.ctrlKey || e.altKey) return;
    const tipo = TECLAS[e.key.toLowerCase()];
    if (tipo) { e.preventDefault(); marcar(tipo); }
  });
  $("ejemplo").addEventListener("click", () => {
    clearInterval(timer);
    sesion = Observacion.ejemplo();
    inicio = null; hablante = null;
    $("reloj").textContent = reloj(sesion.fin);
    $("empezar").textContent = "Empezar";
    botones(false); log(); reporte();
  });
  $("imprimir").addEventListener("click", () => window.print());
  $("exportar").addEventListener("click", () => {
    const datos = { sesion, metricas: Observacion.metricas(sesion), devolucion: Observacion.devolucion(Observacion.metricas(sesion)) };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" }));
    a.download = "observacion-de-clase.json"; a.click(); URL.revokeObjectURL(a.href);
  });

  botones(false); log();
})();
