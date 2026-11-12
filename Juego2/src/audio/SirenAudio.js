// src/audio/SirenAudio.js
//
// Genera una sirena policial usando la Web Audio API (sin archivos externos).
// Usa dos osciladores que alternan entre frecuencias graves y agudas
// para simular la sirena tipo "wail" de una patrulla.
//

export default class SirenAudio {
  constructor() {
    this._ctx        = null;
    this._gainNode   = null;
    this._osc1       = null;
    this._osc2       = null;
    this._lfo        = null;
    this._lfoGain    = null;
    this._running    = false;
    this._fadeTimer  = null;
  }

  /** Inicia la sirena. Llama esto cuando arranca la carrera. */
  start() {
    if (this._running) return;

    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio no soportado:', e);
      return;
    }

    const ctx = this._ctx;

    // Nodo de volumen maestro (inicia en 0, hace fade-in)
    this._gainNode = ctx.createGain();
    this._gainNode.gain.setValueAtTime(0, ctx.currentTime);
    this._gainNode.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 1.0);
    this._gainNode.connect(ctx.destination);

    // ── Oscilador principal (sirena tipo wail) ────────────────────────────────
    // Alterna entre 650 Hz y 1050 Hz cíclicamente
    this._osc1 = ctx.createOscillator();
    this._osc1.type = 'sawtooth';
    this._osc1.frequency.setValueAtTime(650, ctx.currentTime);

    // LFO (Low Frequency Oscillator) para el barrido de frecuencia
    this._lfo = ctx.createOscillator();
    this._lfo.type = 'sine';
    this._lfo.frequency.setValueAtTime(0.9, ctx.currentTime); // 0.9 ciclos/segundo

    this._lfoGain = ctx.createGain();
    this._lfoGain.gain.setValueAtTime(200, ctx.currentTime); // rango ±200 Hz

    // Conectar LFO → ganancia de modulación → frecuencia del oscilador
    this._lfo.connect(this._lfoGain);
    this._lfoGain.connect(this._osc1.frequency);

    // Filtro paso-banda para suavizar el sonido metálico
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 850;
    filter.Q.value = 0.8;

    this._osc1.connect(filter);
    filter.connect(this._gainNode);

    // ── Oscilador secundario (efecto "yelp" intermitente) ─────────────────────
    this._osc2 = ctx.createOscillator();
    this._osc2.type = 'square';
    this._osc2.frequency.setValueAtTime(1200, ctx.currentTime);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.04, ctx.currentTime);

    // LFO rápido para el yelp intermitente
    const lfo2 = ctx.createOscillator();
    lfo2.type = 'square';
    lfo2.frequency.setValueAtTime(2.5, ctx.currentTime);

    const lfoGain2 = ctx.createGain();
    lfoGain2.gain.setValueAtTime(0.04, ctx.currentTime);

    lfo2.connect(lfoGain2);
    lfoGain2.connect(gain2.gain);
    this._osc2.connect(gain2);
    gain2.connect(this._gainNode);

    // Arrancar todo
    this._osc1.start();
    this._lfo.start();
    this._osc2.start();
    lfo2.start();

    this._running = true;
  }

  /** Sube/baja el volumen para efecto Doppler (Temu cerca = más fuerte) */
  setProximity(normalizedDist) {
    // normalizedDist: 0 = muy cerca, 1 = lejos
    if (!this._gainNode || !this._running) return;
    const vol = 0.03 + (1 - Math.min(1, normalizedDist)) * 0.22;
    this._gainNode.gain.setTargetAtTime(vol, this._ctx.currentTime, 0.1);
  }

  /** Detiene la sirena con fade-out suave. */
  stop() {
    if (!this._running || !this._ctx) return;
    this._running = false;

    const ctx = this._ctx;
    this._gainNode.gain.setTargetAtTime(0, ctx.currentTime, 0.4);

    setTimeout(() => {
      try {
        this._osc1?.stop();
        this._osc2?.stop();
        this._lfo?.stop();
        this._ctx?.close();
      } catch (_) {}
      this._ctx = null;
    }, 1800);
  }
}
