import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ProductRow = {
  id: number;
  nombre: string;
  contexto: string | null;
  material_id: string | null;
  composicion: Record<string, unknown> | null;
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) throw new Error('Faltan variables de Supabase en Vercel.');
  return createClient(url, key);
}

async function callArkon(materialId: string, estado?: string) {
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

function numeric(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeCobertura(resultado: any) {
  const coberturaPorc = numeric(resultado?.coberturaPorc);
  if (coberturaPorc !== null) return coberturaPorc / 100;

  const cobertura = numeric(resultado?.cobertura);
  if (cobertura === null) return null;
  return cobertura > 1 ? cobertura / 100 : cobertura;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const productIdRaw = body.productId ?? body.product_id;
    const productId = Number(String(productIdRaw ?? '').trim());

    // La selección siempre representa un producto de public.productos.
    // El material se obtiene exclusivamente de ese registro.
    if (!Number.isInteger(productId)) {
      return NextResponse.json({
        ok: false,
        error: 'El análisis requiere el id numérico del producto seleccionado en public.productos.',
      }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('productos')
      .select('id,nombre,contexto,material_id,composicion')
      .eq('id', productId)
      .eq('activo', true)
      .maybeSingle();

    if (error) throw error;

    const product = (data as ProductRow | null) || null;
    if (!product) {
      return NextResponse.json({
        ok: false,
        error: `Producto '${productId}' no encontrado en public.productos.`,
      }, { status: 404 });
    }

    const materialId = product.material_id ? String(product.material_id).trim() : '';
    if (!materialId) {
      return NextResponse.json({
        ok: false,
        error: `El producto ${productId} (${product.nombre}) no tiene material_id en public.productos.`,
        producto: {
          id: product.id,
          nombre: product.nombre,
          contexto: product.contexto,
          materialId: null,
        },
      }, { status: 422 });
    }

    const estado = typeof body.estado === 'string' ? body.estado : undefined;
    let resultado: any;

    try {
      const respuestaArkon = await callArkon(materialId, estado);
      resultado = respuestaArkon?.resultado ?? respuestaArkon;
    } catch (error: any) {
      return NextResponse.json({
        ok: false,
        error: 'ARKON no pudo analizar el material vinculado.',
        producto: {
          id: product.id,
          nombre: product.nombre,
          contexto: product.contexto,
          materialId,
        },
        detalle: error?.message || String(error),
      }, { status: 502 });
    }

    const indice = numeric(resultado?.indice ?? resultado?.indiceGlobal);
    const cobertura = normalizeCobertura(resultado);
    const neuronasActivadas = Array.isArray(resultado?.neuronasActivadas)
      ? resultado.neuronasActivadas
      : [];
    const propiedadesConDatos = numeric(resultado?.propiedadesConDatos ?? resultado?.neuronasConDatos);
    const propiedadesPendientes = Array.isArray(resultado?.propiedadesPendientes)
      ? resultado.propiedadesPendientes
      : [];
    const totalNeuronas = numeric(resultado?.totalNeuronas);
    const neuronasSinDatos = numeric(resultado?.neuronasSinDatos);
    const confianzaPromedio = numeric(resultado?.confianzaPromedio);

    return NextResponse.json({
      ok: true,
      fuente: 'ARKON_DAP_REAL',
      producto: {
        id: product.id,
        nombre: product.nombre,
        contexto: product.contexto || 'general',
        materialId,
        materialIds: [materialId],
      },
      indice,
      indiceDisponible: indice !== null,
      cobertura,
      coberturaPorc: cobertura === null ? null : cobertura * 100,
      materiales: [{
        materialId,
        ok: true,
        resultado,
        neuronasActivadas,
        neuronasConDatos: propiedadesConDatos,
        neuronasSinDatos,
        totalNeuronas,
        confianzaPromedio,
        propiedadesPendientes,
      }],
      resumen: {
        materialesSolicitados: 1,
        materialesAnalizados: 1,
        materialesConError: 0,
        neuronasConDatos: propiedadesConDatos,
        neuronasSinDatos,
        totalNeuronas,
        confianzaPromedio,
        propiedadesPendientes: propiedadesPendientes.length,
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
