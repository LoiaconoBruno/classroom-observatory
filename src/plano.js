// Plano del aula: una grilla de hasta 30 lugares. Cada lugar ocupado tiene una
// etiqueta corta (un número o iniciales), nunca un nombre: así el registro no
// guarda datos que identifiquen a un alumno fuera del aula.
const Plano = (() => {
  const MAXIMO = 30;
  const FILAS_MAX = 8;
  const COLUMNAS_MAX = 8;

  // Etiqueta válida: de 1 a 3 caracteres, letras o números. "M.G." pasa a "MG".
  function normalizarEtiqueta(texto) {
    return String(texto || "").normalize("NFC").toUpperCase().replace(/[.\s·-]/g, "");
  }

  function validarEtiqueta(texto) {
    const e = normalizarEtiqueta(texto);
    if (!e) return "Poné un número o iniciales.";
    if (!/^[A-ZÁÉÍÓÚÜÑ0-9]{1,3}$/u.test(e)) return "Solo un número o hasta 3 iniciales, sin nombres.";
    return "";
  }

  // Grilla de filas × columnas; ocupa los primeros "alumnos" lugares, numerados desde 1.
  function nuevo(filas = 5, columnas = 6, alumnos = Math.min(filas * columnas, MAXIMO)) {
    if (!Number.isInteger(filas) || !Number.isInteger(columnas) || filas < 1 || columnas < 1 || filas > FILAS_MAX || columnas > COLUMNAS_MAX) {
      throw new Error(`El plano tiene que tener entre 1 y ${FILAS_MAX} filas y entre 1 y ${COLUMNAS_MAX} columnas.`);
    }
    if (filas * columnas > MAXIMO * 2) throw new Error("Demasiados lugares en la grilla.");
    const ocupados = Math.min(alumnos, MAXIMO, filas * columnas);
    const lugares = [];
    for (let i = 0; i < filas * columnas; i++) {
      lugares.push({ id: `L${i + 1}`, etiqueta: i < ocupados ? String(i + 1) : "", ocupado: i < ocupados });
    }
    return { filas, columnas, lugares };
  }

  const ocupados = (plano) => plano.lugares.filter((l) => l.ocupado);

  // Ocupa o desocupa un lugar. No deja pasar de 30 alumnos.
  function alternar(plano, id) {
    const l = plano.lugares.find((x) => x.id === id);
    if (!l) throw new Error("No existe el lugar " + id);
    if (!l.ocupado && ocupados(plano).length >= MAXIMO) throw new Error(`El plano admite hasta ${MAXIMO} alumnos.`);
    l.ocupado = !l.ocupado;
    if (l.ocupado && !l.etiqueta) l.etiqueta = siguienteNumero(plano);
    return plano;
  }

  function siguienteNumero(plano) {
    const usados = new Set(plano.lugares.map((l) => l.etiqueta));
    for (let n = 1; ; n++) if (!usados.has(String(n))) return String(n);
  }

  function etiquetar(plano, id, texto) {
    const error = validarEtiqueta(texto);
    if (error) throw new Error(error);
    const e = normalizarEtiqueta(texto);
    if (plano.lugares.some((l) => l.id !== id && l.ocupado && l.etiqueta === e)) throw new Error(`Ya hay un lugar con "${e}".`);
    const l = plano.lugares.find((x) => x.id === id);
    if (!l) throw new Error("No existe el lugar " + id);
    l.etiqueta = e;
    return plano;
  }

  // Revisa un plano guardado o importado.
  function validar(plano) {
    const errores = [];
    if (!plano || !Array.isArray(plano.lugares)) return ["El plano no tiene lugares."];
    if (plano.lugares.length !== plano.filas * plano.columnas) errores.push("La cantidad de lugares no coincide con la grilla.");
    const ocu = ocupados(plano);
    if (ocu.length > MAXIMO) errores.push(`Hay ${ocu.length} alumnos; el máximo es ${MAXIMO}.`);
    const vistas = new Set();
    for (const l of ocu) {
      const e = validarEtiqueta(l.etiqueta);
      if (e) errores.push(`${l.id}: ${e}`);
      if (vistas.has(l.etiqueta)) errores.push(`Etiqueta repetida: ${l.etiqueta}`);
      vistas.add(l.etiqueta);
    }
    return errores;
  }

  const copiar = (plano) => JSON.parse(JSON.stringify(plano));

  return { MAXIMO, FILAS_MAX, COLUMNAS_MAX, normalizarEtiqueta, validarEtiqueta, nuevo, ocupados, alternar, etiquetar, validar, copiar };
})();

if (typeof module !== "undefined") module.exports = Plano;
