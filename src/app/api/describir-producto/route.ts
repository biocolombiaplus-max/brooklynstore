import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { FIREBASE_CONFIG } from '@/lib/firebase-config';

// Carga rápida del panel: mira la foto de un zapato y sugiere título,
// marca, color, género y estilo. Solo para administradores (se valida el
// token de Firebase y que el usuario esté en la colección "admins").

export const runtime = 'nodejs';
export const maxDuration = 30;

const Suggestion = z.object({
  title: z.string().describe('Nombre comercial corto: marca + modelo + detalle, ej: "Nike Air Force 1 Low". Sin el color.'),
  brand: z.string().describe('Marca exactamente como aparece en la lista dada, o la marca visible si no está en la lista. Vacío si no se reconoce.'),
  colorName: z.string().describe('Color principal en español, ej: "Blanco", "Negro / Blanco", "Beige arena"'),
  gender: z.enum(['hombre', 'mujer', 'unisex']).describe('Unisex si el modelo se vende para ambos'),
  collection: z.enum(['deportivos', 'urbanos', 'running', 'basket', 'sandalias', 'botas']),
  description: z.string().describe('2 frases de venta en español neutro-ecuatoriano, sin decir que es original ni réplica'),
});

async function isAdminRequest(request: Request): Promise<boolean> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return false;
  try {
    const lookup = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_CONFIG.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    });
    if (!lookup.ok) return false;
    const uid = ((await lookup.json()) as { users?: { localId: string }[] }).users?.[0]?.localId;
    if (!uid) return false;
    const adminDoc = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/admins/${uid}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return adminDoc.ok;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'not_configured' }, { status: 503 });
  }
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  let image = '';
  let brands: string[] = [];
  try {
    const body = (await request.json()) as { image?: string; brands?: string[] };
    image = String(body.image ?? '');
    brands = Array.isArray(body.brands) ? body.brands.slice(0, 40).map(String) : [];
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
      output_config: { effort: 'low', format: betaZodOutputFormat(Suggestion) },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
            {
              type: 'text',
              text: `Eres el asistente de catálogo de una tienda de zapatos deportivos en Ecuador. Mira la foto y sugiere los datos del producto.
Marcas que vende la tienda: ${brands.join(', ') || 'varias'}.
Si no estás seguro del modelo exacto, usa un nombre descriptivo corto (ej: "Tenis urbano de caña baja").`,
            },
          ],
        },
      ],
    });
    if (response.stop_reason === 'refusal' || !response.parsed_output) {
      return Response.json({ error: 'no_suggestion' }, { status: 422 });
    }
    return Response.json({ suggestion: response.parsed_output });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return Response.json({ error: 'busy' }, { status: 503 });
    if (error instanceof Anthropic.APIError) {
      console.error('describir-producto: API error', error.status, error.message);
      return Response.json({ error: 'api_error' }, { status: 502 });
    }
    console.error('describir-producto:', error);
    return Response.json({ error: 'unknown' }, { status: 500 });
  }
}
