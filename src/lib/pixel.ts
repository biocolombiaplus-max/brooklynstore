// Envío de eventos al Píxel de Meta. Si el píxel no está configurado (o un
// bloqueador lo impide) simplemente no hace nada: nunca rompe la tienda.

type FbqParams = Record<string, unknown>;
type Fbq = (command: 'track' | 'trackCustom', event: string, params?: FbqParams, options?: { eventID?: string }) => void;

export function trackPixel(event: string, params?: FbqParams, eventID?: string): void {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { fbq?: Fbq; __bsPixelQueue?: unknown[][] };
  const fbq = w.fbq;
  if (typeof fbq !== 'function') {
    // El píxel aún no cargó: se guarda y se envía apenas cargue.
    w.__bsPixelQueue = (w.__bsPixelQueue ?? []).slice(-30);
    w.__bsPixelQueue.push(['track', event, params, eventID ? { eventID } : undefined]);
    return;
  }
  try {
    fbq('track', event, params, eventID ? { eventID } : undefined);
  } catch {
    // Nada: el seguimiento nunca debe afectar la compra.
  }
}
