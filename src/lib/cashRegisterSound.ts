// "Cha-ching" de pago recibido para avisar pedidos nuevos en el admin —
// sintetizado en el navegador con Web Audio API (sin archivo de audio de
// por medio), para que suene igual sin depender de conexión ni licencias.
// Pensado para sonar nítido y "premium", como el aviso de pago de una app
// moderna: monedas brillantes + una campanada limpia, corto y satisfactorio.

let sharedContext: AudioContext | null = null;
let sharedMasterBus: AudioNode | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedContext) sharedContext = new Ctor();
  return sharedContext;
}

// Todo el sonido pasa por un compresor antes de salir — deja subir mucho el
// volumen de cada capa (para que suene fuerte y con cuerpo) sin que se
// distorsione o "reviente" al sumarse todas a la vez.
function getMasterBus(ctx: AudioContext): AudioNode {
  if (!sharedMasterBus) {
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.knee.value = 6;
    compressor.ratio.value = 14;
    compressor.attack.value = 0.001;
    compressor.release.value = 0.12;
    // Ganancia final más alta que antes — la clienta pidió que sonara "más
    // duro" al llegar un pedido; el compresor de arriba evita que se
    // distorsione al subir tanto el volumen.
    const boost = ctx.createGain();
    boost.gain.value = 2.3;
    compressor.connect(boost);
    boost.connect(ctx.destination);
    sharedMasterBus = compressor;
  }
  return sharedMasterBus;
}

// Los navegadores bloquean el audio hasta que hay una interacción real del
// usuario (clic) — esto debe llamarse desde dentro de ese clic para
// "desbloquear" el sonido para el resto de la sesión.
export async function unlockAudio(): Promise<boolean> {
  const ctx = getAudioContext();
  if (!ctx) return false;
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      return false;
    }
  }
  return ctx.state === 'running';
}

function playTone(
  ctx: AudioContext,
  bus: AudioNode,
  time: number,
  freq: number,
  duration: number,
  peakGain: number,
  type: OscillatorType,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, time);
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(peakGain, time + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  osc.connect(gain);
  gain.connect(bus);
  osc.start(time);
  osc.stop(time + duration + 0.02);
}

// Un golpe grave y corto justo al inicio — le da peso/impacto al aviso (como
// un "thump" de campana grande) para que se sienta más fuerte de entrada,
// no solo agudo.
function playThud(ctx: AudioContext, bus: AudioNode, time: number, peakGain: number) {
  playTone(ctx, bus, time, 110, 0.16, peakGain, 'sine');
  playTone(ctx, bus, time, 165, 0.12, peakGain * 0.6, 'triangle');
}

// Un "clink" metálico y brillante — dos tonos altísimos casi juntos, como
// una moneda cayendo sobre otra. Varias de estas seguidas dan el efecto de
// "monedas" del cha-ching clásico.
function playCoinClink(ctx: AudioContext, bus: AudioNode, time: number, peakGain: number) {
  playTone(ctx, bus, time, 3400, 0.09, peakGain, 'sine');
  playTone(ctx, bus, time, 3760, 0.08, peakGain * 0.8, 'triangle');
}

// Una campanada limpia con el "aleteo" natural de un timbre real (dos
// frecuencias casi idénticas) más un armónico agudo por encima para que
// brille — la nota de "pago confirmado".
function playBell(ctx: AudioContext, bus: AudioNode, time: number, freq: number, duration: number, peakGain: number) {
  playTone(ctx, bus, time, freq, duration, peakGain, 'triangle');
  playTone(ctx, bus, time, freq * 1.004, duration, peakGain * 0.85, 'sine');
  playTone(ctx, bus, time, freq * 2, duration * 0.55, peakGain * 0.25, 'sine');
}

// El "cha-ching" de pago recibido: unas monedas brillantes y dos campanadas
// ascendentes (cha - ching), la segunda más aguda y con más cuerpo — corto,
// nítido y satisfactorio, como el aviso de pago de una app premium.
export function playCashRegisterSound(): void {
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== 'running') return;
  const bus = getMasterBus(ctx);
  const now = ctx.currentTime;

  playThud(ctx, bus, now, 0.55);

  playCoinClink(ctx, bus, now, 0.6);
  playCoinClink(ctx, bus, now + 0.05, 0.5);
  playCoinClink(ctx, bus, now + 0.095, 0.4);

  playBell(ctx, bus, now + 0.09, 1568, 0.35, 0.6); // "cha"
  playBell(ctx, bus, now + 0.26, 2349, 0.75, 0.75); // "ching"
}
