'use client';

import { useEffect } from 'react';

function esc(value: unknown) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function textOf(el: Element) { return (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase(); }
function view() { return document.querySelector('#view-analysis') as HTMLElement | null; }
function status() { return document.querySelector('#analysis-live-status') as HTMLElement | null; }

function ensureStateControl(header: HTMLElement) {
  if (header.querySelector('#arkon-state-control')) return;
  const host = header.querySelector(':scope > div:first-child') as HTMLElement | null;
  const control = document.createElement('div');
  control.id = 'arkon-state-control';
  control.className = 'mt-3 flex flex-wrap items-center gap-2';
  const label = document.createElement('label');
  label.htmlFor = 'arkon-state-code';
  label.className = 'text-[10px] font-mono uppercase tracking-wider text-slate-400';
  label.textContent = 'Estado del material';
  const input = document.createElement('input');
  input.id = 'arkon-state-code'; input.type = 'text'; input.maxLength = 32;
  input.placeholder = 'p. ej., E02'; input.autocomplete = 'off'; input.spellcheck = false;
  input.className = 'w-28 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white placeholder:text-slate-600';
  input.setAttribute('aria-label', 'Código del estado del material');
  const note = document.createElement('span');
  note.className = 'text-[10px] text-slate-500';
  note.textContent = 'Sin estado explícito, la evidencia queda para revisión.';
  control.append(label, input, note);
  (host || header).appendChild(control);
}

function shell() {
  const v = view();
  if (!v) return null;
  Array.from(v.children).forEach((child, i) => { if (i > 0 && (child as HTMLElement).id !== 'arkon-real-result') (child as HTMLElement).hidden = true; });
  const header = v.firstElementChild as HTMLElement | null;
  if (header) {
    const h = header.querySelector('h3'); if (h) h.textContent = 'ANÁLISIS INTEGRAL REAL — ARKON';
    let s = document.querySelector('#analysis-live-status') as HTMLElement | null;
    if (!s) { s = document.createElement('div'); s.id = 'analysis-live-status'; s.className = 'text-[10px] font-mono text-slate-500 mt-2'; const left = header.querySelector(':scope > div:first-child'); if (left) left.appendChild(s); }
    ensureStateControl(header);
  }
  let p = document.querySelector('#arkon-real-result') as HTMLElement | null;
  if (!p) { p = document.createElement('div'); p.id = 'arkon-real-result'; p.className = 'glass-card rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-6'; v.appendChild(p); }
  return p;
}

function setStatus(message: string, tone: 'idle' | 'run' | 'ok' | 'error' = 'idle') {
  const s = status(); if (!s) return;
  s.textContent = message;
  s.className = `text-[10px] font-mono mt-2 ${tone === 'ok' ? 'text-emerald-400' : tone === 'error' ? 'text-rose-400' : tone === 'run' ? 'text-cyan-400' : 'text-slate-500'}`;
}

function reset() {
  const p = shell(); if (!p) return;
  setStatus('ARKON REAL · sin análisis ejecutado');
  const aiStatus = document.querySelector('#ai-connection-status') as HTMLElement | null;
  if (aiStatus) aiStatus.textContent = 'Sin prueba de conexión en este análisis';
  p.innerHTML = '<div class="space-y-2"><div class="text-[10px] font-mono uppercase tracking-widest text-slate-500">Diagnóstico integral real</div><div class="text-lg font-semibold text-white">Seleccioná un producto y presioná Analizar.</div><div class="text-xs text-slate-500">No se muestran datos inventados. La pantalla se llena únicamente con la respuesta real de ARKON.</div></div>';
}

function arr(value: any): any[] { return Array.isArray(value) ? value : []; }
function n(value: any, digits = 2) { const x = Number(value); return Number.isFinite(x) ? x.toFixed(digits) : esc(value); }

const WORSE_HIGH = new Set(['absorcion_agua','porosidad_total','indice_vacios_e','indice_vacios','permeabilidad_intrinseca','conductividad_hidraulica','difusion_agua','difusion_gases','difusion_ionica','conductividad_termica','expansion_termica','huella_carbono','energia_incorporada','no_reciclable','blandura','coef_deslizamiento','deflectabilidad','compresibilidad','sensibilidad_termica','contraccion_termica','temperatura_falla']);
const WORSE_LOW = new Set(['resistencia_compresion','resistencia_traccion','resistencia_flexion','modulo_young','modulo_corte','modulo_volumetrico','cohesion','dureza_mohs','angulo_friccion','temperatura_servicio','impermeabilidad','indice_solidos','resistencia_matriz','resistividad_hidraulica','resistencia_difusion','resistencia_gases','resistencia_ionica','estabilidad_cohesiva','reciclabilidad']);
function level(prop: string, value: number) {
  const p = prop.toLowerCase();
  if (WORSE_HIGH.has(p)) return value >= 90 ? 'CRÍTICO' : value >= 80 ? 'ALTO' : value >= 70 ? 'MODERADO' : null;
  if (WORSE_LOW.has(p)) return value <= 10 ? 'CRÍTICO' : value <= 15 ? 'ALTO' : value <= 20 ? 'MODERADO' : null;
  return value >= 80 ? 'ALTO' : null;
}

function card(title: string, body: string, cls = 'border-slate-700/60') {
  return `<section class="rounded-xl border ${cls} bg-slate-950/40 p-4"><div class="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-3">${title}</div>${body}</section>`;
}
function list(items: string[], empty: string) { return items.length ? `<ol class="space-y-2 list-decimal list-inside">${items.map(x => `<li class="text-sm leading-6 text-slate-200">${esc(x)}</li>`).join('')}</ol>` : `<div class="text-sm text-slate-500">${esc(empty)}</div>`; }

function renderAINeuronBlock(data: any) {
  if (!data) return '';
  const agents = arr(data.agents);
  if (!agents.length) {
    return card('NEURONAS IA · TURSO → META LLAMA 3.2', `<div class="text-sm text-slate-200">${esc(data.message || 'La capa IA no ejecutó agentes.')}</div><div class="mt-2 text-xs text-slate-500">Modo lectura; no se modificaron datos de Supabase.</div>`, 'border-violet-500/30');
  }
  const statusLabels: Record<string, string> = {
    analyzed: 'Evidencia analizada', needs_review: 'Requiere revisión', no_evidence: 'Sin evidencia recuperada',
    turso_not_configured: 'Turso no configurado', llama_not_configured: 'Llama no configurado', unauthorized: 'No autorizado', error: 'Error',
  };
  const decisionLabels: Record<string, string> = {
    supported: 'Evidencia compatible', conflicting: 'Evidencia contradictoria', rejected: 'Evidencia no correspondiente', insufficient_evidence: 'Evidencia insuficiente',
  };
  const rows = agents.map((agent: any) => {
    const assessment = agent.assessment || {};
    const cited = new Set(arr(assessment.selectedEvidenceIds).map(String));
    const evidence = arr(agent.evidence).slice(0, 3).map((source: any) => {
      const title = `${source.document || source.table || 'Fuente Turso'}${source.page ? ` · pág. ${source.page}` : ''}`;
      const value = source.rawValue !== null && source.rawValue !== undefined ? `<div class="mt-1 text-xs text-cyan-200">Dato extraído: ${esc(source.rawValue)} ${esc(source.unit || '')}</div>` : '';
      return `<li class="rounded-lg border ${cited.has(String(source.id)) ? 'border-emerald-500/30' : 'border-slate-800'} bg-slate-950/50 p-3"><div class="text-xs font-semibold text-slate-200">${esc(title)}${cited.has(String(source.id)) ? ' · CITA DE LLAMA' : ''}</div><div class="mt-1 text-[10px] font-mono text-slate-500">${esc(source.id)} · ${esc(source.property || source.table || '')}${source.method ? ` · ${esc(source.method)}` : ''}</div>${value}<div class="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-400">${esc(String(source.excerpt || '').slice(0, 420))}</div></li>`;
    }).join('');
    const statusLabel = statusLabels[agent.status] || agent.status || 'Estado no informado';
    const decisionLabel = decisionLabels[assessment.decision] || '';
    const neuronIds = arr(agent.connectedNeuronIds).join(', ');
    const state = agent.selectedState || data.state?.code || 'no especificado';
    const review = assessment.requiresPhysicalValidation ? '<div class="mt-2 text-[10px] text-amber-300">Requiere validación física/laboratorio antes de aprobar cambios.</div>' : '';
    return `<article class="rounded-xl border border-violet-500/20 bg-slate-900/50 p-4"><div class="flex flex-wrap items-start justify-between gap-2"><div><div class="font-semibold text-white">${esc(agent.name || agent.agentId)}</div><div class="mt-1 text-[10px] font-mono text-slate-500">${esc(agent.agentId)} · Estado consultado: ${esc(state)} · Cables: ${esc(neuronIds)}</div></div><span class="rounded border border-violet-500/30 px-2 py-1 text-[10px] text-violet-200">${esc(statusLabel)}</span></div><div class="mt-3 text-xs leading-5 text-slate-300"><b>Núcleo:</b> ${esc(agent.nucleus || '')}</div>${decisionLabel ? `<div class="mt-3 text-sm font-semibold text-cyan-200">${esc(decisionLabel)}${assessment.stateMatch ? ` · estado: ${esc(assessment.stateMatch)}` : ''}</div>` : ''}${assessment.rationale ? `<div class="mt-2 text-sm leading-6 text-slate-300">${esc(assessment.rationale)}</div>` : ''}${assessment.missingInformation?.length ? `<div class="mt-2 text-xs text-amber-200">Faltantes: ${esc(assessment.missingInformation.join('; '))}</div>` : ''}${review}${evidence ? `<ul class="mt-3 space-y-2">${evidence}</ul>` : `<div class="mt-3 text-xs text-slate-500">${esc(agent.message || 'Sin fragmentos citables para este agente.')}</div>`}</article>`;
  }).join('');
  const stateInfo = data.state?.explicitlyProvided ? `Estado solicitado: ${data.state.code || data.state.name}.` : 'No se indicó estado del material: ningún agente debe declarar equivalencia de estado.';
  const countInfo = `Agentes ejecutados: ${agents.length} de ${Number(data.availableDirectAgentCount) || 50} perfiles directos disponibles.`;
  return card('NEURONAS IA · TURSO → META LLAMA 3.2', `<div class="mb-3 text-xs leading-5 text-slate-400"><b class="text-violet-200">${esc(countInfo)}</b> ${esc(stateInfo)} Evidencia recuperada en ARKON desde Turso; Llama recibe fragmentos seleccionados, no credenciales ni acceso a las cuentas. Lectura únicamente; no se escriben fórmulas ni datos en Supabase.</div><div class="space-y-3">${rows}</div>`, 'border-violet-500/30');
}

function renderIntegral(result: any, product: any, productId: string) {
  const p = shell(); if (!p) return;
  const material = String(result?.producto?.materialId || product?.materialId || '');
  const compositionMaterials = arr(product?.composicion?.materiales).map((x: any) => String(x));
  const compositionRoles = product?.composicion?.roles && typeof product.composicion.roles === 'object' ? product.composicion.roles : {};
  const compositionLabel = compositionMaterials.map((id: string) => `${id}${compositionRoles[id] ? ` · ${String(compositionRoles[id])}` : ''}`).join(' / ');
  const compositionNote = compositionMaterials.length
    ? card('COMPOSICIÓN REGISTRADA · ALCANCE DEL CÁLCULO', `<div class="text-sm text-slate-200">${esc(compositionLabel)}</div><div class="mt-2 text-xs leading-5 text-slate-400">Material base analizado: <b>${esc(material)}</b>. ${compositionMaterials.length > 1 ? 'Los registros no incluyen fracciones/porcentajes verificados; no se calcula una mezcla ni un promedio de componentes.' : 'El registro identifica un solo material; se muestran sus propiedades disponibles.'}</div>`, 'border-blue-500/30')
    : '';
  const r = result?.resultado || {};
  const materialResult = arr(result?.materiales)[0]?.resultado || {};
  const a = r.activacion || materialResult || {};
  const neurons = arr(a.neuronasActivadas);
  const pending = arr(a.propiedadesPendientes);
  const anomalies = neurons.flatMap((x: any) => arr(x.anomalias).map((z: any) => `${x.neuronId || ''}/${x.propertyName || ''}: ${z}`));
  const problems = neurons.map((x: any) => ({ ...x, nivel: level(String(x.propertyName || ''), Number(x.valorCompuesto)) })).filter((x: any) => x.nivel).sort((x: any, y: any) => ({'CRÍTICO':0,'ALTO':1,'MODERADO':2} as any)[x.nivel] - ({'CRÍTICO':0,'ALTO':1,'MODERADO':2} as any)[y.nivel]);
  const errors = arr(r.errores || materialResult.errores);
  const improvements = arr(r.mejoras || materialResult.mejoras);
  const formulas = arr(r.formulas || materialResult.formulas);
  const inferencia = r.inferencia || materialResult.inferencia;
  const cruces = arr(r.crucesCientificos || r.cruces || materialResult.crucesCientificos);
  const triz = arr(r.triz || r.contradiccionesTRIZ || materialResult.triz);
  const cobertura = Number(a.coberturaPorc);
  const confidence = Number(a.confianzaPromedio);

  setStatus(`ARKON REAL · producto ${productId} · material ${material} · ${neurons.length}/${a.totalNeuronas ?? '?'} neuronas`, 'ok');

  const neuronRows = neurons.map((x: any) => `<tr class="border-t border-slate-800"><td class="px-2 py-2 font-mono text-cyan-400">${esc(x.neuronId)}</td><td class="px-2 py-2">${esc(x.propertyName)}</td><td class="px-2 py-2 text-right">${n(x.valorCompuesto)}</td><td class="px-2 py-2 text-right">${n(x.valorInverso)}</td><td class="px-2 py-2 text-right">${n(x.confianza,3)}</td><td class="px-2 py-2 text-right">${n(x.metadatos?.formulasEvaluadas,0)}</td></tr>`).join('');
  const problemItems = problems.map((x: any) => `[${x.nivel}] ${x.neuronId} ${x.propertyName} = ${n(x.valorCompuesto)}/100 | confianza=${n(x.confianza,2)}`);
  const missingItems = pending.map((x: any) => String(x));
  const anomalyItems = anomalies;
  const improvementItems = improvements.map((x: any) => typeof x === 'string' ? x : JSON.stringify(x));
  const formulaItems = formulas.map((x: any) => typeof x === 'string' ? x : `${x.nombre || x.id || 'fórmula'}${x.valor !== undefined ? ` | valor=${x.valor}` : ''}${x.propiedad ? ` | propiedad=${x.propiedad}` : ''}`);
  const inferenciaText = inferencia ? JSON.stringify(inferencia, null, 2) : '';
  const cruzRows = cruces.map((x: any) => `<tr class="border-t border-slate-800"><td class="px-2 py-2">${esc(x.nombre_cruce || x.nombre || x.id)}</td><td class="px-2 py-2">${esc(x.problema || x.descripcion || '')}</td><td class="px-2 py-2 font-mono text-xs">${esc(x.formula || '')}</td></tr>`).join('');
  const trizRows = triz.map((x: any) => `<tr class="border-t border-slate-800"><td class="px-2 py-2">${esc(x.param_triz_mejora || x.mejora || '')}</td><td class="px-2 py-2">${esc(x.param_triz_empeora || x.empeora || '')}</td><td class="px-2 py-2">${esc(Array.isArray(x.nombres_principios) ? x.nombres_principios.join(', ') : x.principios || '')}</td></tr>`).join('');
  const ai = result?.ia || {};
  const aiNeurons = result?.aiNeurons || result?.diagnosticoIntegral?.neuronasIA || result?.resultado?.aiNeurons || null;
  const aiNeuronBlock = renderAINeuronBlock(aiNeurons);
  const aiText = typeof ai.text === 'string' ? esc(ai.text).replace(/\n/g, '<br>') : '';
  const aiStatus = document.querySelector('#ai-connection-status') as HTMLElement | null;
  if (aiStatus) aiStatus.textContent = ai.status === 'ok' ? 'Conectada · respuesta recibida' : ai.status === 'not_configured' ? 'No configurada' : 'No disponible';
  const aiBlock = card('SÍNTESIS ASISTIDA · META LLAMA 3.2', ai.status === 'ok'
    ? `<div class="text-sm leading-6 text-slate-200">${aiText}</div><div class="mt-3 text-[10px] text-slate-500">Respuesta recibida de ${esc(ai.provider)} · ${esc(ai.model)}. Esta capa interpreta resultados de ARKON; no produce ni valida sus cálculos.</div>`
    : `<div class="text-sm text-slate-300">${esc(ai.status === 'not_configured' ? 'Pendiente configurar CLOUDFLARE_ACCOUNT_ID y CLOUDFLARE_API_TOKEN en Vercel. Los cálculos de ARKON funcionan independientemente de esta conexión.' : ai.message || 'Síntesis no disponible; se conserva el resultado numérico de ARKON.')}</div><div class="mt-2 text-xs text-slate-500">La síntesis de IA no se considera conectada hasta que esta tarjeta muestre una respuesta recibida.</div>`, 'border-violet-500/30');
  const fallbackNote = result?.modoRespaldo
    ? card('TRANSPARENCIA DEL RESULTADO', `<div class="text-sm leading-6 text-amber-100">${esc(result.motivoRespaldo || 'Se muestran únicamente los resultados disponibles del motor de activación y NORMALIZACION; no se agregan cálculos de mezcla.')}</div>`, 'border-amber-500/30')
    : '';

  p.innerHTML = `<div class="space-y-5">
    <div class="flex flex-wrap items-end justify-between gap-4"><div><div class="text-[10px] font-mono uppercase tracking-widest text-cyan-400">ARKON · análisis con datos disponibles</div><div class="mt-1 text-2xl font-semibold text-white">${esc(product?.nombre || result?.producto?.nombre || productId)}</div><div class="mt-1 text-xs font-mono text-slate-500">Producto ${esc(productId)} · Material ${esc(material)} · Fuente: Supabase + Google Sheets NORMALIZACION</div></div><div class="grid grid-cols-2 gap-2 text-center"><div class="rounded-lg border border-cyan-500/20 p-3"><div class="text-[10px] text-slate-500">COBERTURA</div><div class="text-xl font-bold text-cyan-300">${Number.isFinite(cobertura) ? cobertura.toFixed(1) : '—'}%</div></div><div class="rounded-lg border border-emerald-500/20 p-3"><div class="text-[10px] text-slate-500">CONFIANZA MEDIA DEL MOTOR</div><div class="text-xl font-bold text-emerald-300">${Number.isFinite(confidence) ? confidence.toFixed(3) : '—'}</div></div></div></div>
    ${fallbackNote}
    ${compositionNote}
    ${card('ALCANCE Y VALIDACIÓN', 'Las puntuaciones, los umbrales de alerta y las propuestas son salidas operativas del sistema basadas en los datos cargados. No certifican una falla, no equivalen a una receta probada y requieren revisar unidades, fuentes y ensayos.', 'border-amber-500/30')}
    ${card('RESUMEN OPERATIVO', `<div class="grid md:grid-cols-4 gap-3"><div>Neuronas con datos <b>${esc(a.neuronasConDatos ?? neurons.length)}/${esc(a.totalNeuronas ?? '?')}</b></div><div>Alertas operativas <b>${problems.length}</b></div><div>Anomalías reportadas <b>${anomalies.length}</b></div><div>Propiedades faltantes <b>${pending.length}</b></div></div>`, 'border-cyan-500/20')}
    ${card('ALERTAS OPERATIVAS · UMBRALES DEL SISTEMA', list(problemItems, 'Ninguna propiedad superó los umbrales operativos actuales; esto no es una certificación de desempeño.'), 'border-rose-500/30')}
    ${errors.length ? card('ERRORES / DATOS FALTANTES REPORTADOS POR ARKON', list(errors.map((x: any) => typeof x === 'string' ? x : JSON.stringify(x)), 'Sin errores reportados.'), 'border-rose-500/20') : ''}
    ${card('ANOMALÍAS Y DATOS FALTANTES', `<div class="mb-4"><div class="text-xs text-slate-500 mb-2">ANOMALÍAS</div>${list(anomalyItems, '0 anomalías.')}</div><div><div class="text-xs text-slate-500 mb-2">PROPIEDADES SIN DATOS</div>${list(missingItems, '0 propiedades faltantes.')}</div>`, 'border-amber-500/20')}
    ${card('TODAS LAS NEURONAS ACTIVADAS', `<div class="overflow-auto max-h-[520px]"><table class="w-full text-xs"><thead class="sticky top-0 bg-slate-950"><tr><th class="text-left px-2 py-2">ID</th><th class="text-left px-2 py-2">PROPIEDAD</th><th class="text-right px-2 py-2">VALOR</th><th class="text-right px-2 py-2">INV</th><th class="text-right px-2 py-2">CONF</th><th class="text-right px-2 py-2">FÓRMULAS</th></tr></thead><tbody>${neuronRows}</tbody></table></div>`, 'border-slate-700/60')}
    ${card('HIPÓTESIS DE MEJORA DEVUELTAS POR ARKON · REQUIEREN VALIDACIÓN', list(improvementItems, 'ARKON no devolvió hipótesis de mejora en esta respuesta.'), 'border-emerald-500/30')}
    ${card('FÓRMULAS Y CÁLCULOS DEL MOTOR ARKON', list(formulaItems, 'ARKON no devolvió fórmulas en esta respuesta.'), 'border-cyan-500/30')}
    ${inferenciaText ? card('INFERENCIA CIENTÍFICA', `<pre class="whitespace-pre-wrap text-xs text-slate-300 overflow-auto">${esc(inferenciaText)}</pre>`, 'border-violet-500/30') : ''}
    ${cruces.length ? card('CRUCES E ÍNDICES DERIVADOS · REVISAR UNIDADES Y FÓRMULAS', `<div class="overflow-auto"><table class="w-full text-xs"><thead><tr><th class="text-left px-2 py-2">CRUCE</th><th class="text-left px-2 py-2">PROBLEMA</th><th class="text-left px-2 py-2">FÓRMULA</th></tr></thead><tbody>${cruzRows}</tbody></table></div>`, 'border-blue-500/30') : ''}
    ${triz.length ? card('TRIZ · PRINCIPIOS PARA EXPLORAR, NO VALIDACIÓN', `<div class="overflow-auto"><table class="w-full text-xs"><thead><tr><th class="text-left px-2 py-2">MEJORA</th><th class="text-left px-2 py-2">EMPEORA</th><th class="text-left px-2 py-2">PRINCIPIOS</th></tr></thead><tbody>${trizRows}</tbody></table></div>`, 'border-fuchsia-500/30') : ''}
    ${aiNeuronBlock}
    ${aiBlock}
    ${ai.status === 'ok' ? card('USO DE LA SÍNTESIS', 'El texto es generativo y puede contener errores. Contrastá cada interpretación con los valores y las fuentes; no constituye una validación experimental.', 'border-amber-500/30') : ''}
    <div class="text-[10px] font-mono text-slate-600">Respuesta cruda disponible en window.__ARKON_LAST_ANALYSIS__. No se modificaron datos de Supabase.</div>
  </div>`;
  (window as any).__ARKON_LAST_ANALYSIS__ = result;
  window.dispatchEvent(new CustomEvent('arkon:analysis-complete', { detail: result }));
}

function errorView(message: string) { const p = shell(); setStatus(`Error ARKON: ${message}`, 'error'); if (p) p.innerHTML = `<div class="rounded-xl border border-rose-500/30 bg-rose-500/5 p-5"><div class="font-semibold text-rose-300">ARKON no pudo completar el diagnóstico.</div><div class="mt-2 text-sm text-slate-400">${esc(message)}</div></div>`; }

async function getProduct(id: string) {
  const r = await fetch(`/api/products/${encodeURIComponent(id)}`, { cache: 'no-store' });
  const t = await r.text(); let d: any; try { d = JSON.parse(t); } catch { throw new Error(t || `HTTP ${r.status}`); }
  if (!r.ok || !d?.success || !d.product) throw new Error(d?.error || d?.mensaje || `Producto ${id} no encontrado.`);
  return d.product;
}

async function run(id: string) {
  id = String(id || '').trim();
  if (!/^\d+$/.test(id)) return errorView('El análisis requiere el id numérico real de public.productos.');
  try {
    const product = await getProduct(id);
    setStatus(`Ejecutando ARKON REAL · producto ${id} · material ${product.materialId || 'sin material'}`, 'run');
    const selectedState = (document.querySelector('#arkon-state-code') as HTMLInputElement | null)?.value.trim() || '';
    const response = await fetch('/api/analizar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store', body: JSON.stringify({ productId: id, contexto: product.contexto || 'general', ...(selectedState ? { estado: selectedState } : {}) }) });
    const text = await response.text(); let result: any; try { result = JSON.parse(text); } catch { throw new Error(text || `HTTP ${response.status}`); }
    if (!response.ok || result?.ok === false) throw new Error(result?.error || `HTTP ${response.status}`);
    renderIntegral(result, product, id);
  } catch (e) { errorView(e instanceof Error ? e.message : String(e)); console.error('ARKON integral analysis failed:', e); }
}

  async function syncCatalog() {
    try {
      const r = await fetch('/api/products', { cache: 'no-store' }); const data = await r.json(); if (!r.ok || !Array.isArray(data)) return;
      const products = data.filter((x: any) => x && /^\d+$/.test(String(x.id)));
      document.querySelectorAll('[data-kpi="productos-count"]').forEach((count) => { count.textContent = String(products.length); });
      const selector = document.querySelector('#global-product-selector') as HTMLSelectElement | null;
    if (selector) selector.innerHTML = products.map((x: any) => `<option value="${esc(x.id)}">${esc(x.id)} — ${esc(x.nombre)}</option>`).join('');
    const body = document.querySelector('#view-catalog table tbody') as HTMLElement | null;
    if (body) body.innerHTML = products.map((x: any) => `<tr class="hover:bg-slate-900/40"><td class="py-3 px-3"><div class="font-bold text-white">${esc(x.nombre)}</div><div class="text-[10px] font-mono text-cyan-400">Producto ${esc(x.id)} · material ${esc(x.materialId || 'sin material_id')}</div></td><td class="py-3 px-3 text-slate-400">${esc(x.categoria || 'Sin categoría')}</td><td class="py-3 px-3"><span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono">${esc(x.estado || '')}</span></td><td class="py-3 px-3 text-right"><button data-arkon-product-id="${esc(x.id)}" class="arkon-catalog-analyze px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 text-slate-950 cursor-pointer">Analizar</button></td></tr>`).join('');
    const first = products.find((x: any) => x.materialId); if (selector && first) selector.value = String(first.id);
  } catch (e) { console.error('Catálogo ARKON real:', e); }
}

export default function ArkonAnalysisConnector() {
  useEffect(() => {
    let cancelled = false;
    reset(); syncCatalog();
    const install = () => {
      if (cancelled) return;
      const w = window as any;
      if (typeof w.switchNav !== 'function' || typeof w.cambiarProductoGlobal !== 'function') { window.setTimeout(install, 50); return; }
      if (!w.__ARKON_REAL_BRIDGE_INSTALLED__) {
        const nav = w.switchNav; const change = w.cambiarProductoGlobal;
        const analyze = async (id: string) => { const pid = String(id || '').trim(); if (!/^\d+$/.test(pid)) return errorView('Producto inválido.'); change(pid); nav('analysis'); await new Promise(r => setTimeout(r, 120)); await run(pid); };
        w.seleccionarYAnalizar = analyze; w.analizarDesdeCatalogo = analyze; w.__ARKON_REAL_BRIDGE_INSTALLED__ = true;
      }
    };
    install();
    const click = (event: Event) => {
      const target = event.target as HTMLElement | null; const button = target?.closest('button'); if (!button) return;
      const b = button.closest('.arkon-catalog-analyze') as HTMLElement | null;
      if (b) { event.preventDefault(); event.stopPropagation(); (event as any).stopImmediatePropagation?.(); const id = b.getAttribute('data-arkon-product-id') || ''; const w = window as any; if (typeof w.seleccionarYAnalizar === 'function') w.seleccionarYAnalizar(id); else run(id); return; }
      if (textOf(button) === 'analizar') { const selector = document.querySelector('#global-product-selector') as HTMLSelectElement | null; const id = selector?.value || ''; if (id) { event.preventDefault(); (event as any).stopImmediatePropagation?.(); const w = window as any; if (typeof w.seleccionarYAnalizar === 'function') w.seleccionarYAnalizar(id); else run(id); } }
    };
    document.addEventListener('click', click, true);
    return () => { cancelled = true; document.removeEventListener('click', click, true); };
  }, []);
  return null;
}
