import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, error: 'Método no permitido. Usar POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const productId = Number(body.productId);

    if (!Number.isInteger(productId)) {
      return res.status(400).json({ ok: false, error: 'El análisis requiere el id numérico del producto.' });
    }

    // ÚNICA fuente para decidir qué material corresponde al producto:
    // public.productos.material_id
    const { data: producto, error } = await supabase
      .from('productos')
      .select('id, nombre, contexto, material_id, composicion, activo')
      .eq('id', productId)
      .eq('activo', true)
      .maybeSingle();

    if (error) throw new Error(`Error consultando productos: ${error.message}`);
    if (!producto) {
      return res.status(404).json({ ok: false, error: `Producto ${productId} no existe o no está activo.` });
    }

    const materialId = String(producto.material_id || '').trim();
    if (!materialId) {
      return res.status(400).json({
        ok: false,
        error: `El producto ${productId} no tiene material_id en public.productos. ARKON no puede inventar un material.`,
      });
    }

    const arkonResponse = await fetch('https://arkon-backend-2026.vercel.app/api/analizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        material_id: materialId,
        producto: producto.nombre,
        contexto: producto.contexto || 'general',
      }),
    });

    const text = await arkonResponse.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      result = { error: text || 'ARKON devolvió una respuesta no JSON.' };
    }

    if (!arkonResponse.ok) {
      return res.status(arkonResponse.status).json(result);
    }

    // ARKON REAL devuelve el diagnóstico integral bajo `diagnosticoIntegral`.
    // Impulso Vector históricamente renderiza la misma información bajo
    // `resultado`; exponemos ambas formas para que no se pierda ningún dato
    // y para mantener el contrato de la interfaz sin inventar resultados.
    const integral = result?.diagnosticoIntegral || {};
    const activacion = result?.activacion || integral?.activacion || {};
    const resumen = integral?.resumen || {};

    result.resultado = {
      activacion,
      problemasDetectados: integral?.problemasDetectados || [],
      anomalias: integral?.anomalias || [],
      propiedadesPendientes: integral?.propiedadesPendientes || [],
      mejoras: [
        ...(integral?.soluciones?.reglas_mejora || []),
        ...(integral?.soluciones?.mejoras || []),
      ],
      formulas: integral?.formulas || [],
      crucesCientificos: integral?.cruces || [],
      triz: integral?.triz || [],
      analisisProblemas: integral?.analisisProblemas || [],
      errores: result?.errores || [],
      resumen,
    };

    // También dejamos `materiales` disponible como compatibilidad con
    // versiones anteriores del conector, siempre con la respuesta real.
    result.materiales = Array.isArray(result.materiales)
      ? result.materiales
      : [{ materialId, resultado: result.resultado }];

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error en puente /api/analizar:', error);
    return res.status(502).json({
      ok: false,
      error: error?.message || String(error),
    });
  }
}
