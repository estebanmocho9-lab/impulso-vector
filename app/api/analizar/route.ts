import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Entrada pública de Impulso Vector al motor REAL de ARKON.
 * No modifica ARKON ni las neuronas: solamente transporta el materialId
 * hasta el gateway público de ARKON y devuelve su resultado.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const materialId = String(body.materialId || body.productId || '').trim();
    const contexto = String(body.contexto || body.tipoProducto || 'general').trim();

    if (!materialId) {
      return NextResponse.json({ ok: false, error: 'Falta materialId' }, { status: 400 });
    }

    // El bridge público de la demo es estable y no depende de un túnel temporal.
    // Se permite sobreescribirlo por entorno, pero nunca volver a un túnel viejo.
    const configuredBridge = process.env.ARKON_BRIDGE_URL?.trim().replace(/\/$/, '');
    const bridgeUrl = configuredBridge && !configuredBridge.includes('trycloudflare.com')
      ? configuredBridge
      : 'https://arkon-x951.onrender.com';

    const bridgeToken = process.env.ARKON_BRIDGE_TOKEN?.trim();

    const response = await fetch(`${bridgeUrl}/api/neural-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(bridgeToken ? { 'X-ARKON-TOKEN': bridgeToken } : {}),
      },
      cache: 'no-store',
      body: JSON.stringify({ materialId, contexto, estado: body.estado }),
    });

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: false, error: text || `HTTP ${response.status}` };
    }

    if (!response.ok || data?.ok === false) {
      return NextResponse.json(
        { ok: false, error: data?.error || 'El motor ARKON devolvió un error', detalle: data },
        { status: response.status || 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      fuente: 'ARKON_DAP_REAL',
      resultado: data,
    });
  } catch (error: any) {
    console.error('Error conectando con ARKON:', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'Error conectando con el motor ARKON' },
      { status: 502 }
    );
  }
}
