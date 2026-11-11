// Persistencia en el dispositivo: IndexedDB en el navegador, memoria en los tests.
// Tres tablas: docentes, observaciones (con su docente) y ajustes. Nada sale del
// dispositivo salvo que se exporte.
const Almacen = (() => {
  const FORMATO = "observatorio-de-clase";
  const VERSION_DATOS = 1;
  const TABLAS = { docentes: "id", observaciones: "id", ajustes: "clave" };
  const PRIVADOS = new Set(["codigoAcceso"]);   // ajustes que no se exportan

  // Mismo contrato que IndexedDB, en memoria.
  function memoria() {
    const datos = Object.fromEntries(Object.keys(TABLAS).map((t) => [t, new Map()]));
    const clon = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
    return {
      async obtener(t, k) { return clon(datos[t].get(k)); },
      async poner(t, v) { datos[t].set(v[TABLAS[t]], clon(v)); },
      async quitar(t, k) { datos[t].delete(k); },
      async todos(t) { return [...datos[t].values()].map(clon); },
      async vaciar(t) { datos[t].clear(); },
    };
  }

  function indexedDB(nombre = "observatorio-de-clase") {
    const abrir = new Promise((ok, mal) => {
      const r = globalThis.indexedDB.open(nombre, VERSION_DATOS);
      r.onupgradeneeded = () => {
        const db = r.result;
        for (const [t, clave] of Object.entries(TABLAS)) if (!db.objectStoreNames.contains(t)) db.createObjectStore(t, { keyPath: clave });
      };
      r.onsuccess = () => ok(r.result);
      r.onerror = () => mal(r.error);
    });
    const pedido = (t, modo, hacer) => abrir.then((db) => new Promise((ok, mal) => {
      const tx = db.transaction(t, modo);
      const r = hacer(tx.objectStore(t));
      tx.oncomplete = () => ok(r && "result" in r ? r.result : undefined);
      tx.onerror = () => mal(tx.error);
      tx.onabort = () => mal(tx.error || new Error("Se canceló la operación"));
    }));
    return {
      obtener: (t, k) => pedido(t, "readonly", (s) => s.get(k)),
      poner: (t, v) => pedido(t, "readwrite", (s) => s.put(v)),
      quitar: (t, k) => pedido(t, "readwrite", (s) => s.delete(k)),
      todos: (t) => pedido(t, "readonly", (s) => s.getAll()),
      vaciar: (t) => pedido(t, "readwrite", (s) => s.clear()),
    };
  }

  const nuevoId = () => (globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);

  function validarAlias(alias) {
    const a = String(alias || "").trim();
    if (!a) return "Poné un nombre o un alias para el docente.";
    if (a.length > 40) return "Hasta 40 caracteres.";
    return "";
  }

  function crear(base) {
    const almacen = {
      docentes: {
        listar: async () => (await base.todos("docentes")).sort((a, b) => a.alias.localeCompare(b.alias, "es")),
        obtener: (id) => base.obtener("docentes", id),
        async guardar(d) {
          const error = validarAlias(d.alias);
          if (error) throw new Error(error);
          const docente = { creado: new Date().toISOString(), ...d, id: d.id || nuevoId(), alias: d.alias.trim() };
          await base.poner("docentes", docente);
          return docente;
        },
        async borrar(id) {
          for (const o of await almacen.observaciones.deDocente(id)) await base.quitar("observaciones", o.id);
          await base.quitar("docentes", id);
        },
      },
      observaciones: {
        obtener: (id) => base.obtener("observaciones", id),
        async deDocente(docenteId) {
          return (await base.todos("observaciones")).filter((o) => o.docenteId === docenteId).sort((a, b) => a.fecha.localeCompare(b.fecha));
        },
        async guardar(o) {
          if (!o.docenteId) throw new Error("La observación no tiene docente.");
          const obs = { fecha: new Date().toISOString(), ia: {}, ...o, id: o.id || nuevoId() };
          await base.poner("observaciones", obs);
          return obs;
        },
        borrar: (id) => base.quitar("observaciones", id),
      },
      ajustes: {
        async leer(clave, defecto = null) { const a = await base.obtener("ajustes", clave); return a === undefined ? defecto : a.valor; },
        escribir: (clave, valor) => base.poner("ajustes", { clave, valor }),
      },
      // Todo lo guardado, en un JSON. El código de acceso al servidor de la escuela no se exporta.
      async exportar() {
        return {
          formato: FORMATO,
          version: VERSION_DATOS,
          exportado: new Date().toISOString(),
          docentes: await base.todos("docentes"),
          observaciones: await base.todos("observaciones"),
          ajustes: (await base.todos("ajustes")).filter((a) => !PRIVADOS.has(a.clave)),
        };
      },
      async importar(datos) {
        if (!datos || datos.formato !== FORMATO) throw new Error("No es una exportación del observatorio de clase.");
        if (datos.version !== VERSION_DATOS) throw new Error(`Versión de datos no soportada: ${datos.version}`);
        for (const d of datos.docentes || []) await base.poner("docentes", d);
        for (const o of datos.observaciones || []) await base.poner("observaciones", o);
        for (const a of datos.ajustes || []) if (!PRIVADOS.has(a.clave)) await base.poner("ajustes", a);
        return { docentes: (datos.docentes || []).length, observaciones: (datos.observaciones || []).length };
      },
      async borrarTodo() {
        for (const t of Object.keys(TABLAS)) await base.vaciar(t);
      },
    };
    return almacen;
  }

  return { FORMATO, VERSION_DATOS, memoria, indexedDB, crear, validarAlias, nuevoId };
})();

if (typeof module !== "undefined") module.exports = Almacen;
