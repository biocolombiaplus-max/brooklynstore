import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';

// Lee la etiqueta de talla de un zapato (la que va en la lengüeta o por
// dentro) con Claude y devuelve las tallas que trae. Si no hay
// ANTHROPIC_API_KEY configurada responde 503 y el navegador usa su lector
// de texto de respaldo.

export const runtime = 'nodejs';
export const maxDuration = 30;

const LabelSchema = z.object({
  readable: z.boolean().describe('true si en la foto hay una etiqueta de talla de calzado legible'),
  us: z.number().nullable().describe('Talla US (ej: 8 o 8.5). null si no aparece'),
  usGender: z.enum(['hombre', 'mujer', 'desconocido']).describe('Si la talla US es de hombre (M) o de mujer (W)'),
  uk: z.number().nullable().describe('Talla UK. null si no aparece'),
  eu: z.number().nullable().describe('Talla EUR / EU / FR como número decimal (42 2/3 → 42.67). null si no aparece'),
  cm: z.number().nullable().describe('Largo en centímetros (CM, JP o MM convertidos a cm: JP 265 → 26.5). null si no aparece'),
  brand: z.string().nullable().describe('Marca si se ve en la etiqueta'),
});

const PROMPT = `Esta es la foto de la etiqueta de talla de un zapato (normalmente en la lengüeta o dentro del zapato).
Lee exactamente las tallas impresas: US, UK, EUR/EU/FR, CM/JP/MM. No inventes valores que no se vean.
Si la etiqueta dice "US M" o "US MEN" es de hombre; "US W" o "WOMEN" es de mujer.
Convierte fracciones a decimales (1/3 → .33, 1/2 → .5, 2/3 → .67). JP y MM vienen en milímetros: divídelos entre 10.
Si la foto no muestra una etiqueta de talla legible, marca readable en false.`;

// Límite básico para que nadie abuse del endpoint.
const hits = new Map<string, { count: number; reset: number }>();
function allowed(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.reset < now) {
    hits.set(ip, { count: 1, reset: now + 60_000 });
    return true;
  }
  entry.count += 1;
  return entry.count <= 8;
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'not_configured' }, { status: 503 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!allowed(ip)) return Response.json({ error: 'rate_limited' }, { status: 429 });

  let image: string;
  let mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
  try {
    const body = (await request.json()) as { image?: string; mediaType?: string };
    image = String(body.image ?? '');
    mediaType = body.mediaType === 'image/png' || body.mediaType === 'image/webp' ? body.mediaType : 'image/jpeg';
  } catch {
    return Response.json({ error: 'bad_request' }, { status: 400 });
  }
  if (!image || image.length > 6_000_000) return Response.json({ error: 'bad_image' }, { status: 400 });

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.parse({
      model: 'claude-opus-5',
      max_tokens: 2000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: betaZodOutputFormat(LabelSchema) },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    });

    if (response.stop_reason === 'refusal' || !response.parsed_output) {
      return Response.json({ error: 'unreadable' }, { status: 422 });
    }
    return Response.json({ label: response.parsed_output });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json({ error: 'busy' }, { status: 503 });
    }
    if (error instanceof Anthropic.APIError) {
      console.error('leer-etiqueta: API error', error.status, error.message);
      return Response.json({ error: 'api_error' }, { status: 502 });
    }
    console.error('leer-etiqueta:', error);
    return Response.json({ error: 'unknown' }, { status: 500 });
  }
}
