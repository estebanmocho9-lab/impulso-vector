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
  activo: boolean | null;
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) throw new Error('Faltan variables de Supabase en Vercel.');
  return createClient(url, key);
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const productId = Number(id);
    if (!Number.isInteger(productId)) {
      return NextResponse.json({ success: false, mensaje: 'ID de producto inválido.' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('productos')
      .select('id,nombre,contexto,material_id,composicion,activo')
      .eq('id', productId)
      .eq('activo', true)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ success: false, mensaje: `Producto ${productId} no encontrado.` }, { status: 404 });
    }

    const product = data as ProductRow;
    const materialId = product.material_id ? String(product.material_id).trim() : '';

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        nombre: product.nombre,
        categoria: product.contexto || 'general',
        contexto: product.contexto || 'general',
        materialId,
        composicion: product.composicion || {},
      },
    });
  } catch (error: any) {
    console.error('Error leyendo producto real:', error);
    return NextResponse.json(
      { success: false, mensaje: error?.message || 'No se pudo leer el producto.' },
      { status: 500 }
    );
  }
}
