import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const bridge = process.env.ARKON_BRIDGE_URL?.replace(/\/$/, '');
  const token = process.env.ARKON_BRIDGE_TOKEN;

  if (!bridge) {
    return NextResponse.json(
      { ok: false, error: 'ARKON_BRIDGE_URL no está configurado en Vercel.' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const materialId = String(body.materialId || '').trim();

    if (!materialId) {
      return NextResponse.json(
        { ok: false, error: 'materialId es obligatorio.' },
        { status: 400 }
      );
    }

    const response = await fetch(`${bridge}/api/neural-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'X-ARKON-TOKEN': token } : {}),
      },
      body: JSON.stringify({
        materialId,
        contexto: 'general',
        estado: body.estado,
      }),
      cache: 'no-store',
    });

    const text = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: false, error: text || `HTTP ${response.status}` };
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error conectando con ARKON:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 502 }
    );
  }
}
