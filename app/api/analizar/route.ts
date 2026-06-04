import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Ya no usamos googleapis, leemos desde Supabase

const MAPEO_HEADERS: Record<string, string> = {
  'densidad real': 'densidad_real', 'densidad aparente': 'densidad_aparente',
  'porosidad total': 'porosidad_total', 'absorción de agua': 'absorcion_agua',
  'absorcion de agua': 'absorcion_agua', 'índice de vacíos': 'indice_vacios_e',
  'indice de vacios': 'indice_vacios_e', 'diámetro de poro': 'diametro_poro',
  'diametro de poro': 'diametro_poro', 'área bet': 'area_bet', 'area bet': 'area_bet',
  'volumen de poro': 'volumen_poro', 'tamaño de partícula': 'tamaño_particula',
  'tamaño de particula': 'tamaño_particula', 'tortuosidad': 'tortuosidad',
  'resistencia a compresión': 'resistencia_compresion', 'resistencia a compresion': 'resistencia_compresion',
  'resistencia a tracción': 'resistencia_traccion', 'resistencia a traccion': 'resistencia_traccion',
  'resistencia a flexión': 'resistencia_flexion', 'resistencia a flexion': 'resistencia_flexion',
  'módulo de young': 'modulo_young', 'modulo de young': 'modulo_young',
  'módulo de corte': 'modulo_corte', 'modulo de corte': 'modulo_corte',
  'módulo volumétrico': 'modulo_volumetrico', 'modulo volumetrico': 'modulo_volumetrico',
  'cohesión': 'cohesion', 'cohesion': 'cohesion',
  'dureza mohs': 'dureza_mohs', 'ángulo de fricción': 'angulo_friccion',
  'angulo de friccion': 'angulo_friccion', 'poisson': 'poisson',
  'conductividad térmica': 'conductividad_termica', 'conductividad termica': 'conductividad_termica',
  'calor específico': 'calor_especifico', 'calor especifico': 'calor_especifico',
  'expansión térmica': 'expansion_termica', 'expansion termica': 'expansion_termica',
  'temperatura de servicio': 'temperatura_servicio', 'temperatura de fusión': 'temperatura_fusion',
  'temperatura de fusion': 'temperatura_fusion', 'difusividad térmica': 'difusividad_termica',
  'difusividad termica': 'difusividad_termica',
  'permeabilidad intrínseca': 'permeabilidad_intrinseca', 'permeabilidad intrinseca': 'permeabilidad_intrinseca',
  'conductividad hidráulica': 'conductividad_hidraulica', 'conductividad hidraulica': 'conductividad_hidraulica',
  'difusión de agua': 'difusion_agua', 'difusion de agua': 'difusion_agua',
  'difusión de gases': 'difusion_gases', 'difusion de gases': 'difusion_gases',
  'difusión iónica': 'difusion_ionica', 'difusion ionica': 'difusion_ionica',
  'conductividad eléctrica': 'conductividad_electrica', 'conductividad electrica': 'conductividad_electrica',
  'ph': 'ph', 'cec': 'cec', 'adsorción': 'adsorcion', 'adsorcion': 'adsorcion',
  'potencial zeta': 'potencial_zeta', 'energía superficial': 'energia_superficial',
  'energia superficial': 'energia_superficial', 'ángulo de contacto': 'angulo_contacto',
  'angulo de contacto': 'angulo_contacto', 'trabajo de adhesión': 'trabajo_adhesion',
  'trabajo de adhesion': 'trabajo_adhesion', 'espesor de doble capa': 'espesor_doble_capa',
  'sio2': 'sio2', 'al2o3': 'al2o3', 'fe2o3': 'fe2o3', 'cao': 'cao',
  'mgo': 'mgo', 'na2o': 'na2o', 'k2o': 'k2o',
  'huella de carbono': 'huella_carbono', 'energía incorporada': 'energia_incorporada',
  'energia incorporada': 'energia_incorporada', 'reciclabilidad': 'reciclabilidad',
};

// Función que lee el vector desde Supabase en lugar de Google Sheets
async function leerVectorDeSupabase(materialId: string): Promise<Record<string, number | null> | null> {
  const { data, error } = await supabase
    .from('materiales_vectores')
    .select('*')
    .eq('id_material', materialId)
    .maybeSingle();

  if (error || !data) {
    console.error(`Error leyendo material ${materialId} desde Supabase:`, error);
    return null;
  }

  // Convertir la fila a Record<string, number|null>
  const vector: Record<string, number | null> = {};
  for (const [key, value] of Object.entries(data)) {
    // Omitir columnas internas
    if (key === 'id_material' || key === 'created_at' || key === 'estado') continue;
    if (value !== null && !isNaN(Number(value))) {
      vector[key] = Number(value);
    } else {
      vector[key] = null;
    }
  }
  return vector;
}

function evaluarFormula(formula: string, vector: Record<string, number | null>): number | null {
  try {
    const vars: Record<string, number> = {};
    for (const [key, val] of Object.entries(vector)) {
      if (val !== null && !isNaN(Number(val))) vars[`idx_${key}`] = Number(val);
    }
    const varsEnFormula = formula.match(/idx_\w+/g) ?? [];
    for (const v of varsEnFormula) {
      if (vars[v] === undefined) return null;
    }
    const expr = formula
      .replace(/LEAST\(([^)]+)\)/g, 'Math.min($1)')
      .replace(/GREATEST\(([^)]+)\)/g, 'Math.max($1)');
    const fn = new Function(...Object.keys(vars), `return ${expr}`);
    const r = fn(...Object.values(vars));
    if (isNaN(r) || !isFinite(r)) return null;
    return Math.max(0, Math.min(100, r));
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const { trabajoId, materialId, contexto, producto } = await req.json();

    await supabase.from('trabajos')
      .update({ estado: 'procesando', actualizado_en: new Date().toISOString() })
      .eq('id', trabajoId);

    // Leer vector desde Supabase (antes era leerVectorDeSheets)
    const vector = await leerVectorDeSupabase(materialId);
    if (!vector) throw new Error(`Material ${materialId} no encontrado en Supabase`);

    const propConDatos = Object.values(vector).filter(v => v !== null).length;

    const { data: cruces } = await supabase
      .from('cruces_cientificos').select('*')
      .eq('problema', contexto).eq('activo', true);

    const resultadosCruces: Record<string, number> = {};
    const sinDatos: string[] = [];

    for (const cruce of (cruces ?? [])) {
      const val = evaluarFormula(cruce.formula, vector);
      if (val !== null) resultadosCruces[cruce.nombre_cruce] = val;
      else sinDatos.push(cruce.descripcion ?? cruce.nombre_cruce);
    }

    const { data: problema } = await supabase
      .from('problemas').select('*').eq('nombre_problema', contexto).single();

    let indice = 0, pesoTotal = 0;
    if (problema?.cruces_activos) {
      for (const ca of problema.cruces_activos) {
        const v = resultadosCruces[ca.nombreCruce];
        if (v !== undefined) { indice += v * ca.peso; pesoTotal += ca.peso; }
      }
      if (pesoTotal > 0) indice /= pesoTotal;
    } else {
      const vals = Object.values(resultadosCruces);
      if (vals.length > 0) indice = vals.reduce((a, b) => a + b, 0) / vals.length;
    }

    const cobertura = (cruces?.length ?? 0) > 0
      ? Object.keys(resultadosCruces).length / (cruces?.length ?? 1) : 0;

    const causas: string[] = [];
    for (const [n, v] of Object.entries(resultadosCruces)) {
      const c = cruces?.find((x: any) => x.nombre_cruce === n);
      if (v > 70) causas.push(`${c?.descripcion ?? n}: índice elevado (${v.toFixed(1)}/100)`);
      else if (v < 20) causas.push(`${c?.descripcion ?? n}: índice bajo (${v.toFixed(1)}/100)`);
    }
    if (causas.length === 0) causas.push(`${propConDatos} propiedades leídas desde Supabase — índice ${indice.toFixed(1)}/100`);
    if (sinDatos.length > 0) causas.push(`Sin datos suficientes para: ${sinDatos.slice(0, 2).join(', ')}`);

    const triz: string[] = [];
    const { data: trizData } = await supabase.from('triz_contradicciones').select('nombres_principios, propiedades_mejora').limit(50);
    const propAltas = Object.entries(resultadosCruces).filter(([,v]) => v > 65).map(([k]) => k);
    for (const t of (trizData ?? [])) {
      const mejora = Array.isArray(t.propiedades_mejora) ? t.propiedades_mejora : JSON.parse(t.propiedades_mejora ?? '[]');
      if (propAltas.some(p => mejora.some((m: string) => m.toLowerCase().includes(p.toLowerCase())))) {
        const principios = Array.isArray(t.nombres_principios) ? t.nombres_principios : JSON.parse(t.nombres_principios ?? '[]');
        for (const p of principios.slice(0, 2)) { if (!triz.includes(p)) triz.push(p); }
      }
      if (triz.length >= 4) break;
    }

    const { data: resultado, error: errRes } = await supabase.from('resultados').insert({
      producto,
      problema_detectado: `Análisis de ${contexto} — índice: ${indice.toFixed(1)}/100 (${Math.round(cobertura*100)}% cobertura)`,
      causas_fisicas: causas.slice(0, 5),
      soluciones_propuestas: [
        ...(triz.length > 0 ? [`Principios TRIZ: ${triz.slice(0,3).join(', ')}`] : []),
        cobertura < 0.5 ? 'Completar propiedades en NORMALIZACION para análisis más preciso' : `Análisis con ${Object.keys(resultadosCruces).length} cruces científicos`,
      ].slice(0, 5),
      compatibilidades: [], mejoras: triz.slice(0, 3),
      confianza_general: Math.round(cobertura * 100) / 100,
      neuronas_activadas: Object.keys(resultadosCruces).length,
      inferencias_generadas: causas.length,
      coherencia_global: Math.round(indice) / 100,
      propiedades_pendientes: sinDatos,
      fecha: new Date().toISOString(),
    }).select('id').single();

    if (errRes || !resultado) throw new Error('Error guardando resultado: ' + errRes?.message);

    await supabase.from('trabajos').update({
      estado: 'completado', resultado_id: resultado.id, actualizado_en: new Date().toISOString()
    }).eq('id', trabajoId);

    return NextResponse.json({ ok: true, resultadoId: resultado.id, indice });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}