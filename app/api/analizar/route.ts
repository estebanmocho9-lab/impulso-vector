import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Puerta de entrada web al motor REAL de ARKON.
 * ARKON no se modifica desde este proyecto. La app web solamente envía
 * materialId + contexto al bridge público de ARKON.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const materialId = String(body.materialId || body.productId || '').trim();
    const contexto = String(body.contexto || body.tipoProducto || 'general').trim();

    if (!materialId) {
      return NextResponse.json({ ok: false, error: 'Falta materialId' }, { status: 400 });
    }

    const bridgeUrl = process.env.ARKON_BRIDGE_URL?.replace(/\/$/, '');
    const bridgeToken = process.env.ARKON_BRIDGE_TOKEN;

    if (!bridgeUrl) {
      return NextResponse.json({ ok: false, error: 'ARKON_BRIDGE_URL no está configurada en Vercel' }, { status: 503 });
    }
    if (!bridgeToken) {
      return NextResponse.json({ ok: false, error: 'ARKON_BRIDGE_TOKEN no está configurado en Vercel' }, { status: 503 });
    }

    const response = await fetch(`${bridgeUrl}/api/neural-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ARKON-TOKEN': bridgeToken,
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
