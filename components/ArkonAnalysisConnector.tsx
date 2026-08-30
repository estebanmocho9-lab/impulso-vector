'use client';

import { useEffect } from 'react';

function textOf(element: Element) {
  return (element.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function getView() {
  return document.querySelector('#view-analysis') as HTMLElement | null;
}

function getStatus() {
  return document.querySelector('#analysis-live-status') as HTMLElement | null;
}

function ensureRealShell() {
  const view = getView();
  if (!view) return null;

  Array.from(view.children).forEach((child, index) => {
    if (index > 0 && (child as HTMLElement).id !== 'arkon-real-result') (child as HTMLElement).hidden = true;
  });

  const header = view.firstElementChild as HTMLElement | null;
  if (header) {
    const title = header.querySelector('h3');
    if (title) title.textContent = 'ANÁLISIS REAL DEL PRODUCTO';

    const badge = Array.from(header.querySelectorAll('span')).find((el) =>
      ['producto analizado', 'producto seleccionado', 'esperando análisis'].includes(textOf(el))
    );
    if (badge) badge.textContent = 'Esperando análisis';

    let status = document.querySelector('#analysis-live-status') as HTMLElement | null;
    if (!status) {
      status = document.createElement('div');
      status.id = 'analysis-live-status';
      status.className = 'text-[10px] font-mono text-slate-500 mt-2';
      const left = header.querySelector(':scope > div:first-child');
      if (left) left.appendChild(status);
    }
  }

  let panel = document.querySelector('#arkon-real-result') as HTMLElement | null;
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'arkon-real-result';
    panel.className = 'glass-card rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-6';
    view.appendChild(panel);
  }
  return panel;
}

function resetAnalysisView(message = 'Seleccioná un producto y presioná Analizar para ejecutar ARKON.') {
  const panel = ensureRealShell();
  if (!panel) return;
  const status = getStatus();
  if (status) {
    status.textContent = 'ARKON REAL · sin análisis ejecutado';
    status.className = 'text-[10px] font-mono text-slate-500 mt-2';
  }
  panel.innerHTML = `<div class="space-y-3"><div class="text-[10px] font-mono uppercase tracking-widest text-slate-500">Análisis real</div><div class="text-lg font-semibold text-white">${escapeHtml(message)}</div><div class="text-xs text-slate-500">No se muestran propiedades, valores demostrativos ni estadísticas internas.</div></div>`;
}

const ERROR_KEYS = ['errores', 'error', 'errors', 'problemas', 'anomalias', 'anomalías', 'inconsistencias', 'alertas', 'causas'];
const IMPROVEMENT_KEYS = ['mejoras', 'mejora', 'soluciones', 'solucion', 'solutions', 'recomendaciones', 'oportunidades', 'acciones', 'accionesRecomendadas'];
const FORMULA_KEYS = ['formulas', 'fórmulas', 'formulasPosibles', 'fórmulasPosibles', 'formulasAplicables', 'fórmulasAplicables', 'ecuaciones', 'ecuacionesPosibles', 'ecuacionesAplicables'];

function keyMatches(key: string, keys: string[]) {
  return keys.some((candidate) => candidate.toLowerCase() === key.toLowerCase());
}

function collectByKeys(value: any, keys: string[], found: any[] = [], seen = new Set<any>()) {
  if (value === null || value === undefined || seen.has(value)) return found;
  if (typeof value !== 'object') return found;
  seen.add(value);

  if (Array.isArray(value)) {
    value.forEach((item) => collectByKeys(item, keys, found, seen));
    return found;
  }

  for (const [key, child] of Object.entries(value)) {
    if (keyMatches(key, keys)) found.push(child);
    if (child && typeof child === 'object') collectByKeys(child, keys, found, seen);
  }
  return found;
}

function flattenItems(value: any, output: string[] = []) {
  if (value === null || value === undefined) return output;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const text = String(value).trim();
    if (text) output.push(text);
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => flattenItems(item, output));
    return output;
  }
  if (typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (child === null || child === undefined) continue;
      if (typeof child === 'object') flattenItems(child, output);
      else output.push(`${key}: ${String(child)}`);
    }
  }
  return output;
}

function uniqueItems(values: string[]) {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

function section(title: string, values: string[], tone: 'error' | 'improvement' | 'formula', empty: string) {
  const styles = {
    error: 'border-rose-500/30 bg-rose-500/5 text-rose-200',
    improvement: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200',
    formula: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-100',
  }[tone];
  const heading = { error: 'ERRORES / PROBLEMAS', improvement: 'MEJORAS / SOLUCIONES', formula: 'POSIBLES FÓRMULAS / ECUACIONES' }[tone];
  return `<section class="rounded-xl border ${styles} p-4"><div class="text-[10px] font-mono uppercase tracking-widest mb-3">${heading}</div>${values.length ? `<ol class="space-y-2 list-decimal list-inside">${values.map((v) => `<li class="text-sm leading-6">${escapeHtml(v)}</li>`).join('')}</ol>` : `<div class="text-sm opacity-70">${escapeHtml(empty)}</div>`}</section>`;
}

function extractAnalysisLists(result: any) {
  const errors = uniqueItems(collectByKeys(result, ERROR_KEYS).flatMap((v) => flattenItems(v)));
  const improvements = uniqueItems(collectByKeys(result, IMPROVEMENT_KEYS).flatMap((v) => flattenItems(v)));
  const formulas = uniqueItems(collectByKeys(result, FORMULA_KEYS).flatMap((v) => flattenItems(v)));
  return { errors, improvements, formulas };
}

function paintResult(result: any, productName: string, productId: string) {
  const panel = ensureRealShell();
  if (!panel) return;

  const productMaterialId = result?.producto?.materialId ? String(result.producto.materialId) : '';
  const materialResult = Array.isArray(result?.materiales) ? result.materiales[0]?.resultado || {} : {};
  const combined = { ...materialResult, ...result };
  const { errors, improvements, formulas } = extractAnalysisLists(combined);
  const status = getStatus();

  if (status) {
    status.textContent = `ARKON REAL · producto ${productId} · material ${productMaterialId || 'sin material_id'}`;
    status.className = 'text-[10px] font-mono text-emerald-400 mt-2';
  }

  panel.innerHTML = `<div class="space-y-5">
    <div>
      <div class="text-[10px] font-mono uppercase tracking-widest text-cyan-400">Resultado real de ARKON</div>
      <div class="mt-1 text-lg font-semibold text-white">${escapeHtml(productName || result?.producto?.nombre || productId)}</div>
      <div class="mt-1 text-[10px] font-mono text-slate-500">Producto: ${escapeHtml(productId)} · Material utilizado por ARKON: ${escapeHtml(productMaterialId || 'no disponible')}</div>
    </div>
    ${section('errores', errors, 'error', 'ARKON no devolvió errores o problemas en esta respuesta.')}
    ${section('mejoras', improvements, 'improvement', 'ARKON no devolvió mejoras, soluciones o recomendaciones en esta respuesta.')}
    ${section('fórmulas', formulas, 'formula', 'ARKON no devolvió posibles fórmulas o ecuaciones en esta respuesta.')}
  </div>`;

  (window as any).__ARKON_LAST_ANALYSIS__ = result;
  window.dispatchEvent(new CustomEvent('arkon:analysis-complete', { detail: result }));
}

function paintError(message: string) {
  const panel = ensureRealShell();
  const status = getStatus();
  if (status) {
    status.textContent = `Error ARKON: ${message}`;
    status.className = 'text-[10px] font-mono text-rose-400 mt-2';
  }
  if (panel) panel.innerHTML = `<div class="space-y-2"><div class="text-sm font-semibold text-rose-300">ARKON no pudo completar el análisis.</div><div class="text-xs text-slate-400">${escapeHtml(message)}</div></div>`;
}

async function loadRealProduct(id: string) {
  if (!/^\d+$/.test(String(id).trim())) throw new Error('La selección del catálogo debe contener el id numérico del producto.');
  const response = await fetch(`/api/products/${encodeURIComponent(id)}`, { cache: 'no-store' });
  const text = await response.text();
  let data: any;
  try { data = JSON.parse(text); } catch { throw new Error(text || `HTTP ${response.status}`); }
  if (!response.ok || !data?.success || !data?.product) throw new Error(data?.mensaje || `No se encontró información real para ${id}`);
  return data.product;
}

async function runRealAnalysis(productId: string) {
  const id = String(productId || '').trim();
  ensureRealShell();
  if (!/^\d+$/.test(id)) {
    paintError('El botón Analizar no recibió un id numérico de producto. Se detuvo el análisis para no enviar un material equivocado a ARKON.');
    return;
  }

  try {
    const product = await loadRealProduct(id);
    const title = getView()?.querySelector('h3');
    if (title) title.textContent = product.nombre || id;
    const badge = Array.from(getView()?.querySelectorAll('span') || []).find((el) => ['esperando análisis', 'producto analizado', 'producto seleccionado'].includes(textOf(el)));
    if (badge) badge.textContent = 'Producto analizado';

    const status = getStatus();
    if (status) {
      status.textContent = `Ejecutando ARKON REAL · producto ${id} · leyendo productos.material_id...`;
      status.className = 'text-[10px] font-mono text-cyan-400 mt-2';
    }

    const response = await fetch('/api/analizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ productId: id }),
    });
    const text = await response.text();
    let result: any;
    try { result = JSON.parse(text); } catch { throw new Error(text || `HTTP ${response.status}`); }
    if (!response.ok || result?.ok === false) throw new Error(result?.error || `HTTP ${response.status}`);
    paintResult(result, product.nombre, id);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    paintError(message);
    console.error('ARKON real product analysis failed:', error);
  }
}

async function loadRealCatalog() {
  try {
    const response = await fetch('/api/products', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok || !Array.isArray(data)) return;
    const validProducts = data.filter((p: any) => p && /^\d+$/.test(String(p.id || '')));

    const selector = document.querySelector('#global-product-selector') as HTMLSelectElement | null;
    if (selector) selector.innerHTML = validProducts.map((p: any) => `<option value="${escapeHtml(String(p.id))}">${escapeHtml(String(p.id))} — ${escapeHtml(String(p.nombre || 'Producto'))}</option>`).join('');

    const tableBody = document.querySelector('#view-catalog table tbody') as HTMLElement | null;
    if (tableBody) tableBody.innerHTML = validProducts.map((p: any) => `<tr class="hover:bg-slate-900/40 transition"><td class="py-3.5 px-3"><div class="font-bold text-white">${escapeHtml(String(p.nombre || 'Producto'))}</div><div class="text-[10px] font-mono text-cyan-400">Producto ${escapeHtml(String(p.id))} · material ${escapeHtml(String(p.materialId || 'sin material_id'))}</div></td><td class="py-3.5 px-3 text-slate-400">${escapeHtml(String(p.categoria || 'Sin categoría'))}</td><td class="py-3.5 px-3"><span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">${escapeHtml(String(p.estado || ''))}</span></td><td class="py-3.5 px-3 text-right"><button data-arkon-product-id="${escapeHtml(String(p.id))}" class="arkon-catalog-analyze px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer font-bold transition">Analizar</button></td></tr>`).join('');

    const firstWithMaterial = validProducts.find((p: any) => String(p.materialId || '').trim());
    if (selector && firstWithMaterial) selector.value = String(firstWithMaterial.id);
  } catch (error) {
    console.error('No se pudo sincronizar el catálogo real:', error);
  }
}

export default function ArkonAnalysisConnector() {
  useEffect(() => {
    let cancelled = false;
    resetAnalysisView();
    loadRealCatalog();

    const installCatalogBridge = () => {
      if (cancelled) return;
      const w = window as any;
      if (typeof w.switchNav !== 'function' || typeof w.cambiarProductoGlobal !== 'function') {
        window.setTimeout(installCatalogBridge, 50);
        return;
      }

      if (!w.__ARKON_REAL_BRIDGE_INSTALLED__) {
        const originalSwitchNav = w.switchNav;
        const originalCambiarProductoGlobal = w.cambiarProductoGlobal;
        const analyze = async (id: string) => {
          const productId = String(id || '').trim();
          if (!/^\d+$/.test(productId)) {
            paintError('Selección de producto inválida. El análisis requiere el id numérico de public.productos.');
            return;
          }
          originalCambiarProductoGlobal(productId);
          originalSwitchNav('analysis');
          await new Promise((resolve) => window.setTimeout(resolve, 100));
          ensureRealShell();
          await runRealAnalysis(productId);
        };
        w.seleccionarYAnalizar = analyze;
        w.analizarDesdeCatalogo = analyze;
        w.__ARKON_REAL_BRIDGE_INSTALLED__ = true;
      }
    };

    installCatalogBridge();

    const handler = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest('button');
      if (!button) return;

      const catalogButton = button.closest('.arkon-catalog-analyze') as HTMLElement | null;
      if (catalogButton) {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
        const productId = catalogButton.getAttribute('data-arkon-product-id') || '';
        const w = window as any;
        if (typeof w.seleccionarYAnalizar === 'function') w.seleccionarYAnalizar(productId);
        return;
      }

      if (!textOf(button).includes('analizar')) return;
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();

      const inline = button.getAttribute('onclick') || '';
      const match = inline.match(/(?:analizarDesdeCatalogo|seleccionarYAnalizar)\(['"]([^'"]+)['"]\)/);
      const selector = document.querySelector('#global-product-selector') as HTMLSelectElement | null;
      const productId = match?.[1] || selector?.value || '';
      if (/^\d+$/.test(productId)) {
        const w = window as any;
        if (typeof w.seleccionarYAnalizar === 'function') w.seleccionarYAnalizar(productId);
      } else {
        paintError('Ese botón todavía contiene un código antiguo que no es el id del producto. El catálogo real usa public.productos.id.');
      }
    };

    document.addEventListener('click', handler, true);
    return () => {
      cancelled = true;
      document.removeEventListener('click', handler, true);
    };
  }, []);

  return null;
}
