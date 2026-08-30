import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) throw new Error('Faltan variables de Supabase en Vercel.');
  return createClient(url, key);
}

function getArkonUrl() {
  const configured = String(process.env.ARKON_BRIDGE_URL || '').trim().replace(/\/$/, '');
  if (configured && !configured.includes('trycloudflare.com')) return configured;
  return 'https://arkon-x951.onrender.com';
}

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function firstMaterialResult(arkon) {
  return Array.isArray(arkon?.materiales) ? (arkon.materiales[0]?.resultado || {}) : {};
}

function normalizeArkon(arkon, product, materialId) {
  const legacy = arkon?.resultado || {};
  const nested = legacy?.resultado || {};
  const materialResult = firstMaterialResult(arkon);
  const diagnostic = arkon?.diagnosticoIntegral || {};
  const activacion = legacy?.activacion || nested?.activacion || materialResult?.activacion || arkon?.activacion || {};

  const problemasDetectados = legacy?.problemasDetectados ?? nested?.problemasDetectados ?? diagnostic?.problemasDetectados ?? [];
  const anomalias = legacy?.anomalias ?? nested?.anomalias ?? materialResult?.anomalias ?? diagnostic?.anomalias ?? [];
  const propiedadesPendientes = legacy?.propiedadesPendientes ?? nested?.propiedadesPendientes ?? materialResult?.propiedadesPendientes ?? diagnostic?.propiedadesPendientes ?? activacion?.propiedadesPendientes ?? [];
  const errores = legacy?.errores ?? nested?.errores ?? materialResult?.errores ?? arkon?.errores ?? [];
  const soluciones = diagnostic?.soluciones || legacy?.soluciones || nested?.soluciones || {};
  const reglasMejora = legacy?.reglasMejora ?? nested?.reglasMejora ?? materialResult?.reglasMejora ?? soluciones?.reglas_mejora ?? [];
  const mejoras = legacy?.mejoras ?? nested?.mejoras ?? materialResult?.mejoras ?? soluciones?.mejoras ?? [];
  const formulas = legacy?.formulas ?? nested?.formulas ?? materialResult?.formulas ?? diagnostic?.formulas ?? [];
  const cruces = legacy?.cruces ?? nested?.cruces ?? materialResult?.cruces ?? diagnostic?.cruces ?? [];
  const triz = legacy?.triz ?? nested?.triz ?? materialResult?.triz ?? diagnostic?.triz ?? [];
  const analisisProblemas = legacy?.analisisProblemas ?? nested?.analisisProblemas ?? materialResult?.analisisProblemas ?? diagnostic?.analisisProblemas ?? [];
  const inferencia = legacy?.inferencia ?? nested?.inferencia ?? materialResult?.inferencia ?? diagnostic?.inferencia;

  const coberturaBase = diagnostic?.cobertura || {};
  const cobertura = {
    neuronasConDatos: coberturaBase?.neuronasConDatos ?? activacion?.neuronasConDatos ?? 0,
    totalNeuronas: coberturaBase?.totalNeuronas ?? activacion?.totalNeuronas ?? 0,
    coberturaPorc: coberturaBase?.coberturaPorc ?? activacion?.coberturaPorc ?? 0,
    confianzaPromedio: coberturaBase?.confianzaPromedio ?? activacion?.confianzaPromedio ?? 0,
  };

  const resultado = {
    activacion,
    problemasDetectados,
    anomalias,
    errores,
    propiedadesPendientes,
    soluciones: { reglas_mejora: reglasMejora, mejoras },
    mejoras: [...arr(reglasMejora), ...arr(mejoras)],
    reglasMejora,
    formulas,
    cruces,
    crucesCientificos: cruces,
    triz,
    analisisProblemas,
    inferencia,
    resumen: diagnostic?.resumen || {
      neuronasConDatos: cobertura.neuronasConDatos,
      totalNeuronas: cobertura.totalNeuronas,
      problemas: arr(problemasDetectados).length,
      anomalias: arr(anomalias).length,
      propiedadesFaltantes: arr(propiedadesPendientes).length,
      formulasEncontradas: arr(formulas).length,
      crucesUtilizables: arr(cruces).filter(x => x?.evaluable).length,
      trizEncontrados: arr(triz).length,
    },
  };

  const diagnosticoIntegral = {
    ...diagnostic,
    cobertura,
    problemasDetectados,
    anomalias,
    propiedadesPendientes,
    soluciones: resultado.soluciones,
    formulas,
    cruces,
    triz,
    analisisProblemas,
    resumen: resultado.resumen,
  };

  return {
    ok: true,
    motor: arkon?.motor || 'ARKON REAL',
    fuente: arkon?.fuente || 'Supabase + Google Sheets NORMALIZACION',
    producto: {
      id: product.id,
      nombre: product.nombre,
      contexto: product.contexto || 'general',
      materialId,
    },
    diagnosticoIntegral,
    resultado,
    materiales: Array.isArray(arkon?.materiales) && arkon.materiales.length
      ? arkon.materiales
      : [{ materialId, resultado: { ...activacion, errores, mejoras, reglasMejora, formulas, cruces, triz, analisisProblemas } }],
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, error: 'Método no permitido. Usar POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const productId = Number(body.productId ?? body.product_id);

    if (!Number.isInteger(productId)) {
      return res.status(400).json({ ok: false, error: 'El análisis requiere el id numérico del producto.' });
    }

    const supabase = getSupabase();
    const { data: producto, error } = await supabase
      .from('productos')
      .select('id,nombre,contexto,material_id,composicion,activo')
      .eq('id', productId)
      .eq('activo', true)
      .maybeSingle();

    if (error) throw new Error(`Error consultando productos: ${error.message}`);
    if (!producto) return res.status(404).json({ ok: false, error: `Producto ${productId} no existe o no está activo.` });

    const materialId = String(producto.material_id || '').trim();
    if (!materialId) {
      return res.status(422).json({ ok: false, error: `El producto ${productId} (${producto.nombre}) no tiene material_id en public.productos.` });
    }

    const bridgeUrl = getArkonUrl();
    const token = String(process.env.ARKON_BRIDGE_TOKEN || '').trim();
    const headers = { 'Content-Type': 'application/json', ...(token ? { 'X-ARKON-TOKEN': token } : {}) };
    const payload = {
      material_id: materialId,
      producto: producto.nombre,
      contexto: producto.contexto || 'general',
    };

    const arkonResponse = await fetch(`${bridgeUrl}/api/analizar`, {
      method: 'POST',
      headers,
      cache: 'no-store',
      body: JSON.stringify(payload),
    });

    const text = await arkonResponse.text();
    let arkon;
    try {
      arkon = JSON.parse(text);
    } catch {
      arkon = { ok: false, error: text || `ARKON respondió HTTP ${arkonResponse.status}` };
    }

    if (!arkonResponse.ok || arkon?.ok === false) {
      return res.status(arkonResponse.status >= 400 && arkonResponse.status < 600 ? arkonResponse.status : 502).json({
        ok: false,
        error: arkon?.error || `ARKON respondió HTTP ${arkonResponse.status}`,
        producto: { id: producto.id, nombre: producto.nombre, materialId },
        detalle: arkon,
      });
    }

    const normalized = normalizeArkon(arkon, producto, materialId);

    // Garantía de compatibilidad: si el puente integral no entregó neuronas,
    // consultar el activationEngine real. Nunca se generan valores ficticios.
    if (!arr(normalized.resultado.activacion?.neuronasActivadas).length) {
      try {
        const neuralResponse = await fetch(`${bridgeUrl}/api/neural-analysis`, {
          method: 'POST',
          headers,
          cache: 'no-store',
          body: JSON.stringify({ materialId, contexto: producto.contexto || 'general' }),
        });
        const neuralText = await neuralResponse.text();
        const neural = JSON.parse(neuralText);
        if (neuralResponse.ok && neural?.ok !== false && arr(neural?.neuronasActivadas).length) {
          normalized.resultado.activacion = neural;
          normalized.diagnosticoIntegral.cobertura = {
            neuronasConDatos: neural.neuronasConDatos ?? neural.neuronasActivadas.length,
            totalNeuronas: neural.totalNeuronas ?? neural.neuronasActivadas.length,
            coberturaPorc: neural.coberturaPorc ?? 0,
            confianzaPromedio: neural.confianzaPromedio ?? 0,
          };
          normalized.materiales = [{
            materialId,
            resultado: {
              ...neural,
              errores: normalized.resultado.errores,
              mejoras: normalized.resultado.mejoras,
              reglasMejora: normalized.resultado.reglasMejora,
              formulas: normalized.resultado.formulas,
              cruces: normalized.resultado.cruces,
              triz: normalized.resultado.triz,
              analisisProblemas: normalized.resultado.analisisProblemas,
            },
          }];
        }
      } catch (fallbackError) {
        console.warn('ARKON activation fallback no disponible:', fallbackError);
      }
    }

    return res.status(200).json(normalized);
  } catch (error) {
    console.error('Error en puente /api/analizar:', error);
    return res.status(502).json({ ok: false, error: error?.message || String(error) });
  }
}
