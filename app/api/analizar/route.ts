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

function getArkonUrl() {
  const configured = process.env.ARKON_BRIDGE_URL?.trim().replace(/\/$/, '');
  if (configured && !configured.includes('trycloudflare.com')) return configured;
  return 'https://arkon-x951.onrender.com';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const productIdRaw = body.productId ?? body.product_id;
    const productId = Number(String(productIdRaw ?? '').trim());

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
        producto: { id: product.id, nombre: product.nombre, contexto: product.contexto, materialId: null },
      }, { status: 422 });
    }

    const bridgeUrl = getArkonUrl();
    const token = process.env.ARKON_BRIDGE_TOKEN?.trim();

    const response = await fetch(`${bridgeUrl}/api/analizar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'X-ARKON-TOKEN': token } : {}),
      },
      cache: 'no-store',
      body: JSON.stringify({
        product_id: product.id,
        material_id: materialId,
        contexto: product.contexto || 'general',
        producto: product.nombre,
      }),
    });

    const text = await response.text();
    let arkon: any;
    try {
      arkon = JSON.parse(text);
    } catch {
      arkon = { ok: false, error: text || `HTTP ${response.status}` };
    }

    if (!response.ok || arkon?.ok === false) {
      return NextResponse.json({
        ok: false,
        error: arkon?.error || `ARKON respondió HTTP ${response.status}`,
        producto: { id: product.id, nombre: product.nombre, contexto: product.contexto || 'general', materialId },
        detalle: arkon,
      }, { status: response.status >= 400 && response.status < 600 ? response.status : 502 });
    }

    const resultado = {
      ...arkon,
      producto: {
        ...(arkon.producto || {}),
        id: product.id,
        nombre: product.nombre,
        contexto: product.contexto || 'general',
        materialId,
      },
      fuente: 'ARKON_DAP_REAL',
    };

    return NextResponse.json({ ok: true, resultado }, { status: 200 });
  } catch (error: any) {
    console.error('Error conectando producto con el análisis completo de ARKON:', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'Error conectando con el motor ARKON' },
      { status: 502 }
    );
  }
}
