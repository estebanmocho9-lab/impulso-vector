import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ProductRow = {
  id: number;
  nombre: string;
  contexto: string | null;
  material_id: string | null;
  material_ids: string[] | null;
  composicion: Record<string, unknown> | null;
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) throw new Error('Faltan variables de Supabase en Vercel.');
  return createClient(url, key);
}

async function callArkon(materialId: string, estado?: string) {
  // Esta es la entrada pública estable al gateway del motor ARKON.
  // Impulso Vector no modifica ARKON ni sus neuronas.
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
    body: JSON.stringify({
      materialId,
      // gateway.ts de ARKON valida actualmente contexto === 'general'.
      contexto: 'general',
      estado,
    }),
  });

  const text = await response.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = { ok: false, error: text || `HTTP ${response.status}` };
  }

  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error || `ARKON respondió HTTP ${response.status}`);
  }

  return data;
}

function uniqueMaterialIds(product: ProductRow) {
  return Array.from(new Set([
    ...(Array.isArray(product.material_ids) ? product.material_ids : []),
    ...(product.material_id ? [product.material_id] : []),
  ].map((value) => String(value).trim()).filter(Boolean)));
}

function weightFor(materialId: string, product: ProductRow, materialIds: string[]) {
  const composition = product.composicion;
  if (composition && typeof composition === 'object') {
    const direct = Number((composition as any)[materialId]);
    if (Number.isFinite(direct) && direct > 0) return direct;
  }
  return 1 / Math.max(materialIds.length, 1);
}

function numeric(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const productIdRaw = body.productId ?? body.product_id;
    const materialIdRaw = body.materialId ?? body.material_id;

    let product: ProductRow | null = null;

    if (productIdRaw !== undefined && productIdRaw !== null && String(productIdRaw).trim() !== '') {
      const productId = Number(productIdRaw);
      if (!Number.isInteger(productId)) {
        return NextResponse.json({ ok: false, error: 'productId inválido.' }, { status: 400 });
      }

      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('productos')
        .select('id,nombre,contexto,material_id,material_ids,composicion')
        .eq('id', productId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return NextResponse.json({ ok: false, error: `Producto ${productId} no encontrado.` }, { status: 404 });
      }
      product = data as ProductRow;
    }

    const materialIds = product
      ? uniqueMaterialIds(product)
      : (materialIdRaw ? [String(materialIdRaw).trim()] : []);

    if (!materialIds.length) {
      return NextResponse.json({
        ok: false,
        error: 'El producto no tiene materiales vinculados. Complete productos.material_ids antes de analizarlo.',
      }, { status: 422 });
    }

    const estado = typeof body.estado === 'string' ? body.estado : undefined;
    const materiales: any[] = [];

    for (const materialId of materialIds) {
      try {
        const resultado = await callArkon(materialId, estado);
        const payload = resultado?.resultado ?? resultado;
        materiales.push({
          materialId,
          ok: true,
          resultado: payload,
        });
      } catch (error: any) {
        materiales.push({
          materialId,
          ok: false,
          error: error?.message || String(error),
        });
      }
    }

    const exitosos = materiales.filter((item) => item.ok);
    if (!exitosos.length) {
      return NextResponse.json({
        ok: false,
        error: 'ARKON no pudo analizar ninguno de los materiales vinculados.',
        producto: product ? { id: product.id, nombre: product.nombre, contexto: product.contexto } : null,
        materiales,
      }, { status: 502 });
    }

    const pesos = exitosos.map((item) => weightFor(item.materialId, product || ({ composicion: null } as ProductRow), materialIds));
    const pesoTotal = pesos.reduce((sum, value) => sum + value, 0) || exitosos.length;
    const indices = exitosos.map((item) => numeric(item.resultado?.indice ?? item.resultado?.indiceGlobal));
    const indicesValidos = indices.map((value, index) => value === null ? null : { value, weight: pesos[index] }).filter(Boolean) as { value: number; weight: number }[];
    const indice = indicesValidos.length
      ? indicesValidos.reduce((sum, item) => sum + item.value * item.weight, 0) / indicesValidos.reduce((sum, item) => sum + item.weight, 0)
      : null;

    const coberturas = exitosos
      .map((item) => numeric(item.resultado?.cobertura))
      .filter((value): value is number => value !== null);
    const cobertura = coberturas.length
      ? coberturas.reduce((sum, value) => sum + value, 0) / coberturas.length
      : null;

    return NextResponse.json({
      ok: true,
      fuente: 'ARKON_DAP_REAL',
      producto: product ? {
        id: product.id,
        nombre: product.nombre,
        contexto: product.contexto || 'general',
        materialIds,
      } : null,
      indice,
      cobertura,
      materiales,
      resumen: {
        materialesSolicitados: materialIds.length,
        materialesAnalizados: exitosos.length,
        materialesConError: materiales.length - exitosos.length,
      },
    });
  } catch (error: any) {
    console.error('Error conectando producto con ARKON:', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'Error conectando con el motor ARKON' },
      { status: 502 }
    );
  }
}
