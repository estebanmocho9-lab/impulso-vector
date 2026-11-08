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

function firstMaterialResult(arkon: any) {
  return Array.isArray(arkon?.materiales) ? (arkon.materiales[0]?.resultado || {}) : {};
}

function normalizeArkon(arkon: any, product: ProductRow, materialId: string) {
  const legacyResult = arkon?.resultado || {};
  const legacyNested = legacyResult?.resultado || {};
  const materialResult = firstMaterialResult(arkon);
  const diagnostic = arkon?.diagnosticoIntegral || {};
  const activacion = legacyResult?.activacion || legacyNested?.activacion || materialResult?.activacion || materialResult || arkon?.activacion || {};

  const errores = legacyResult?.errores ?? legacyNested?.errores ?? materialResult?.errores ?? arkon?.errores ?? [];
  const mejoras = legacyResult?.mejoras ?? legacyNested?.mejoras ?? materialResult?.mejoras ?? diagnostic?.soluciones?.mejoras ?? [];
  const reglasMejora = legacyResult?.reglasMejora ?? legacyNested?.reglasMejora ?? materialResult?.reglasMejora ?? diagnostic?.soluciones?.reglas_mejora ?? [];
  const formulas = legacyResult?.formulas ?? legacyNested?.formulas ?? materialResult?.formulas ?? diagnostic?.formulas ?? [];
  const cruces = legacyResult?.cruces ?? legacyNested?.cruces ?? materialResult?.cruces ?? diagnostic?.cruces ?? [];
  const triz = legacyResult?.triz ?? legacyNested?.triz ?? materialResult?.triz ?? diagnostic?.triz ?? [];
  const analisisProblemas = legacyResult?.analisisProblemas ?? legacyNested?.analisisProblemas ?? materialResult?.analisisProblemas ?? diagnostic?.analisisProblemas ?? [];
  const problemasDetectados = legacyResult?.problemasDetectados ?? legacyNested?.problemasDetectados ?? diagnostic?.problemasDetectados ?? [];
  const anomalias = legacyResult?.anomalias ?? legacyNested?.anomalias ?? materialResult?.anomalias ?? diagnostic?.anomalias ?? [];
  const propiedadesPendientes = legacyResult?.propiedadesPendientes ?? legacyNested?.propiedadesPendientes ?? materialResult?.propiedadesPendientes ?? diagnostic?.propiedadesPendientes ?? [];
  const evidenciaTurso = legacyResult?.evidenciaTurso ?? legacyNested?.evidenciaTurso ?? materialResult?.evidenciaTurso ?? diagnostic?.evidenciaTurso ?? activacion?.evidenciaTurso ?? [];

  const producto = {
    id: product.id,
    nombre: product.nombre,
    contexto: product.contexto || 'general',
    materialId,
  };

  // IMPORTANTE: resultado es directo porque el frontend de Impulso Vector
  // consume result.resultado.activacion, result.resultado.formulas, etc.
  // La versión anterior introducía un segundo nivel resultado.resultado.resultado
  // y dejaba la interfaz viendo 0/? aunque ARKON sí hubiera calculado los datos.
  const resultado = {
    activacion,
    problemasDetectados,
    anomalias,
    errores,
    propiedadesPendientes,
    evidenciaTurso,
    mejoras,
    reglasMejora,
    formulas,
    cruces,
    triz,
    analisisProblemas,
    inferencia: legacyResult?.inferencia ?? legacyNested?.inferencia ?? materialResult?.inferencia,
  };

  const coberturaBase = diagnostic?.cobertura || {};
  const diagnosticoIntegral = {
    ...(diagnostic || {}),
    cobertura: {
      neuronasConDatos: coberturaBase?.neuronasConDatos ?? activacion?.neuronasConDatos ?? 0,
      totalNeuronas: coberturaBase?.totalNeuronas ?? activacion?.totalNeuronas ?? 0,
      coberturaPorc: coberturaBase?.coberturaPorc ?? activacion?.coberturaPorc ?? 0,
      confianzaPromedio: coberturaBase?.confianzaPromedio ?? activacion?.confianzaPromedio ?? 0,
    },
    problemasDetectados,
    anomalias,
    propiedadesPendientes,
    evidenciaTurso,
    soluciones: diagnostic?.soluciones || { reglas_mejora: reglasMejora, mejoras },
    formulas,
    cruces,
    triz,
    analisisProblemas,
  };

  const aiNeurons = arkon?.aiNeurons ?? arkon?.neuronasIA ?? arkon?.diagnosticoIntegral?.neuronasIA ?? arkon?.resultado?.neuronasIA ?? null;

  return {
    ok: true,
    motor: arkon?.motor || 'ARKON REAL',
    fuente: arkon?.fuente || 'Turso documental para neuronas directas + fuente original de vectores para inversas + Supabase científico',
    producto,
    diagnosticoIntegral,
    resultado,
    materiales: arkon?.materiales || [{ materialId, resultado: { ...activacion, errores, mejoras, reglasMejora, formulas, cruces, triz, analisisProblemas } }],
    ...(aiNeurons ? { aiNeurons } : {}),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const productIdRaw = body.productId ?? body.product_id;
    const productId = Number(String(productIdRaw ?? '').trim());

    if (!Number.isInteger(productId)) {
      return NextResponse.json({ ok: false, error: 'El análisis requiere el id numérico del producto seleccionado en public.productos.' }, { status: 400 });
    }

    // Solo reenviar estados ARKON explícitos; no inferir E01/E02/E03.
    const requestedState = typeof body.estado === 'string' ? body.estado.trim().toUpperCase() : '';
    const estado = ['E01', 'E02', 'E03'].includes(requestedState) ? requestedState : undefined;

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('productos')
      .select('id,nombre,contexto,material_id,composicion')
      .eq('id', productId)
      .eq('activo', true)
      .maybeSingle();

    if (error) throw error;
    const product = (data as ProductRow | null) || null;
    if (!product) return NextResponse.json({ ok: false, error: `Producto '${productId}' no encontrado en public.productos.` }, { status: 404 });

    const materialId = product.material_id ? String(product.material_id).trim() : '';
    if (!materialId) return NextResponse.json({ ok: false, error: `El producto ${productId} (${product.nombre}) no tiene material_id en public.productos.` }, { status: 422 });

    const bridgeUrl = getArkonUrl();
    const token = process.env.ARKON_BRIDGE_TOKEN?.trim();
    const headers = { 'Content-Type': 'application/json', ...(token ? { 'X-ARKON-TOKEN': token } : {}) };
    const payload = JSON.stringify({
      material_id: materialId,
      contexto: product.contexto || 'general',
      producto: product.nombre,
      ...(estado ? { estado } : {}),
    });

    const response = await fetch(`${bridgeUrl}/api/analizar`, { method: 'POST', headers, cache: 'no-store', body: payload });
    const text = await response.text();
    let arkon: any;
    try { arkon = JSON.parse(text); } catch { arkon = { ok: false, error: text || `HTTP ${response.status}` }; }

    if (!response.ok || arkon?.ok === false) {
      return NextResponse.json({ ok: false, error: arkon?.error || `ARKON respondió HTTP ${response.status}`, producto: { id: product.id, nombre: product.nombre, contexto: product.contexto || 'general', materialId }, detalle: arkon }, { status: response.status >= 400 && response.status < 600 ? response.status : 502 });
    }

    const normalized = normalizeArkon(arkon, product, materialId);

    // Una única petición al análisis estándar. Las neuronas directas solicitan
    // evidencia a Llama/Turso mediante su proveedor; la app no invoca rutas neuronales.

    return NextResponse.json(normalized, { status: 200 });
  } catch (error: any) {
    console.error('Error conectando producto con el análisis completo de ARKON:', error);
    return NextResponse.json({ ok: false, error: error?.message || 'Error conectando con el motor ARKON' }, { status: 502 });
  }
}
