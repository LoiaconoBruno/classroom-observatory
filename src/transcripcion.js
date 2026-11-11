// Transcripción local con Whisper (transformers.js), desactivada por defecto.
// El audio se procesa en el navegador y nunca sale del dispositivo: lo único que se
// descarga es el modelo (unos 77 MB la primera vez, después queda en la caché).
// La transcripción no se guarda ni se manda a la IA; sirve para copiar preguntas.
const Transcripcion = (() => {
  const VERSION_LIBRERIA = "4.3.1";
  const LIBRERIA = `https://cdn.jsdelivr.net/npm/@huggingface/transformers@${VERSION_LIBRERIA}`;
  const MODELO = "onnx-community/whisper-base";
  const TAMANO_MB = 77;
  let modelo = null;

  async function cargar(progreso = () => {}) {
    if (modelo) return modelo;
    const { pipeline } = await import(LIBRERIA);
    modelo = await pipeline("automatic-speech-recognition", MODELO, { dtype: "q8", progress_callback: progreso });
    return modelo;
  }

  // Whisper necesita audio mono a 16 kHz.
  async function audio16k(blob) {
    const datos = await blob.arrayBuffer();
    const ctx = new (globalThis.AudioContext || globalThis.webkitAudioContext)({ sampleRate: 16000 });
    try {
      const audio = await ctx.decodeAudioData(datos);
      if (audio.numberOfChannels === 1) return audio.getChannelData(0);
      const mono = new Float32Array(audio.length);
      for (let c = 0; c < audio.numberOfChannels; c++) {
        const canal = audio.getChannelData(c);
        for (let i = 0; i < canal.length; i++) mono[i] += canal[i] / audio.numberOfChannels;
      }
      return mono;
    } finally {
      ctx.close();
    }
  }

  async function transcribir(blob, { progreso } = {}) {
    const asr = await cargar(progreso);
    const audio = await audio16k(blob);
    const r = await asr(audio, { language: "spanish", task: "transcribe", chunk_length_s: 30, stride_length_s: 5 });
    return String(r.text || "").trim();
  }

  // Oraciones de la transcripción que parecen preguntas: entre ¿ y ?, o que terminan en ?.
  function preguntas(texto) {
    const t = String(texto || "").replace(/\s+/g, " ");
    const halladas = t.match(/¿[^¿?]{2,300}\?|[^.!?¿]{3,300}\?/g) || [];
    return [...new Set(halladas.map((p) => p.trim()))];
  }

  return { VERSION_LIBRERIA, MODELO, TAMANO_MB, cargar, transcribir, preguntas, audio16k };
})();

if (typeof module !== "undefined") module.exports = Transcripcion;
