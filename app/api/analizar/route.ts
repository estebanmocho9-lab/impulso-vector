import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Puerta de entrada web al motor REAL de ARKON.
 *
 * ARKON no se modifica desde este proyecto. La app web solamente envía
 * materialId + tipoProducto al bridge que ejecuta el DAP real de ARKON.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const materialId = body.materialId || body.productId;
    const tipoProducto = body.tipoProducto || body.contexto;

    if (!materialId) {
      return NextResponse.json({ ok: false, error: 'Falta materialId' }, { status: 400 });
    }
    if (!tipoProducto) {
      return NextResponse.json({ ok: false, error: 'Falta tipoProducto/contexto' }, { status: 400 });
    }

    const bridgeUrl = process.env.ARKON_BRIDGE_URL;
    if (!bridgeUrl) {
      return NextResponse.json(
        { ok: false, error: 'ARKON_BRIDGE_URL no está configurada en Vercel' },
        { status: 503 }
      );
    }

    const response = await fetch(`${bridgeUrl.replace(/\/$/, '')}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ materialId, tipoProducto }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      return NextResponse.json(
        { ok: false, error: data.error || 'El motor ARKON devolvió un error' },
        { status: response.status || 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      resultado: data.resultado,
      fuente: 'ARKON_DAP_REAL',
    });
  } catch (error: any) {
    console.error('Error conectando con ARKON:', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'Error conectando con el motor ARKON' },
      { status: 502 }
    );
  }
}
