'use client';

import { useEffect } from 'react';

function textOf(element: Element) {
  return (element.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
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
    if (index > 0 && (child as HTMLElement).id !== 'arkon-real-result') {
      (child as HTMLElement).hidden = true;
    }
  });

  const header = view.firstElementChild as HTMLElement | null;
  if (header) {
    const title = header.querySelector('h3');
    if (title) title.textContent = 'ANÁLISIS REAL DEL PRODUCTO';

    const badge = Array.from(header.querySelectorAll('span')).find((el) =>
      textOf(el) === 'producto analizado' || textOf(el) === 'producto seleccionado'
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
  panel.innerHTML = `
    <div class="space-y-3">
      <div class="text-[10px] font-mono uppercase tracking-widest text-slate-500">Datos reales</div>
      <div class="text-lg font-semibold text-white">${escapeHtml(message)}</div>
      <div class="text-xs text-slate-500">No se muestran valores de demostración.</div>
    </div>
  `;
}

function renderMaterial(item: any) {
  const result = item?.resultado || {};
  const indice = Number(result?.indice ?? result?.indiceGlobal);
  const cobertura = Number(result?.cobertura);
  const causas = Array.isArray(result?.causas) ? result.causas : [];
  const soluciones = Array.isArray(result?.soluciones) ? result.soluciones : [];
  const triz = Array.isArray(result?.triz) ? result.triz : [];
  const finiteIndice = Number.isFinite(indice);
  const finiteCobertura = Number.isFinite(cobertura);

  const list = (items: any[]) => items.length
    ? `<ul class="space-y-2">${items.map((value) => `<li class="text-xs text-slate-300 border-b border-slate-800 pb-2">${escapeHtml(String(value))}</li>`).join('')}</ul>`
    : `<div class="text-xs text-slate-500">Sin datos devueltos por ARKON.</div>`;

  if (!item?.ok) {
    return `
      <div class="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
        <div class="text-[10px] font-mono uppercase tracking-widest text-rose-400">Material con error</div>
        <div class="mt-1 text-sm font-semibold text-white">${escapeHtml(String(item?.materialId || 'sin ID'))}</div>
        <div class="mt-2 text-xs text-rose-200">${escapeHtml(String(item?.error || 'ARKON no devolvió resultado.'))}</div>
      </div>
    `;
  }

  return `
    <div class="rounded-xl border border-slate-800 p-4 space-y-4">
      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="text-[10px] font-mono uppercase tracking-widest text-cyan-400">Material analizado por ARKON</div>
          <div class="mt-1 text-sm font-semibold text-white">${escapeHtml(String(item.materialId))}</div>
        </div>
        <div class="text-right">
          <div class="text-[9px] uppercase text-slate-500">Índice</div>
          <div class="text-lg font-semibold text-cyan-400">${finiteIndice ? `${indice.toFixed(1)}/100` : 'Falta datos'}</div>
          <div class="text-[9px] text-slate-500">${finiteCobertura ? `Cobertura ${(cobertura * 100).toFixed(1)}%` : 'Cobertura sin datos'}</div>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="rounded-lg border border-slate-800 p-3"><div class="text-[9px] uppercase text-slate-500 mb-2">Causas</div>${list(causas)}</div>
        <div class="rounded-lg border border-slate-800 p-3"><div class="text-[9px] uppercase text-slate-500 mb-2">Soluciones</div>${list(soluciones)}</div>
        <div class="rounded-lg border border-slate-800 p-3"><div class="text-[9px] uppercase text-slate-500 mb-2">TRIZ</div>${list(triz)}</div>
      </div>
    </div>
  `;
}

function paintResult(result: any, productName: string, productId: string) {
  const panel = ensureRealShell();
  if (!panel) return;

  const materiales = Array.isArray(result?.materiales) ? result.materiales : [];
  const indice = Number(result?.indice);
  const cobertura = Number(result?.cobertura);
  const resumen = result?.resumen || {};
  const materialIds = Array.isArray(result?.producto?.materialIds) ? result.producto.materialIds : [];

  const status = getStatus();
  if (status) {
    status.textContent = `ARKON REAL · producto ${productId} · ${resumen.materialesAnalizados ?? 0}/${resumen.materialesSolicitados ?? materialIds.length} materiales analizados`;
    status.className = 'text-[10px] font-mono text-emerald-400 mt-2';
  }

  const finiteIndice = Number.isFinite(indice);
  const finiteCobertura = Number.isFinite(cobertura);

  panel.innerHTML = `
    <div class="space-y-6">
      <div>
        <div class="text-[10px] font-mono uppercase tracking-widest text-cyan-400">Resultado real de ARKON</div>
        <div class="mt-1 text-lg font-semibold text-white">${escapeHtml(productName || result?.producto?.nombre || productId)}</div>
        <div class="mt-1 text-[10px] font-mono text-slate-500">Producto: ${escapeHtml(productId)} · Materiales vinculados: ${escapeHtml(materialIds.join(', ') || 'ninguno')}</div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div class="rounded-xl border border-slate-800 p-4"><div class="text-[9px] uppercase text-slate-500">Índice producto</div><div class="mt-1 text-xl font-semibold text-cyan-400">${finiteIndice ? `${indice.toFixed(1)}/100` : 'Falta datos'}</div></div>
        <div class="rounded-xl border border-slate-800 p-4"><div class="text-[9px] uppercase text-slate-500">Cobertura</div><div class="mt-1 text-xl font-semibold">${finiteCobertura ? `${(cobertura * 100).toFixed(1)}%` : 'Falta datos'}</div></div>
        <div class="rounded-xl border border-slate-800 p-4"><div class="text-[9px] uppercase text-slate-500">Materiales</div><div class="mt-1 text-xl font-semibold">${resumen.materialesAnalizados ?? 0}/${resumen.materialesSolicitados ?? materialIds.length}</div></div>
      </div>

      <div class="space-y-4">
        ${materiales.length ? materiales.map(renderMaterial).join('') : '<div class="text-xs text-amber-300">No hay resultados de materiales.</div>'}
      </div>

      ${(resumen.materialesConError ?? 0) > 0
        ? `<div class="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-300">Hay ${resumen.materialesConError} material(es) que ARKON no pudo analizar. No se inventaron valores.</div>`
        : ''}
    </div>
  `;

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
  if (panel) {
    panel.innerHTML = `
      <div class="space-y-2">
        <div class="text-sm font-semibold text-rose-300">ARKON no pudo completar el análisis.</div>
        <div class="text-xs text-slate-400">${escapeHtml(message)}</div>
      </div>
    `;
  }
}

async function loadRealProduct(id: string) {
  const response = await fetch(`/api/products/${encodeURIComponent(id)}`, { cache: 'no-store' });
  const text = await response.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(text || `HTTP ${response.status}`);
  }
  if (!response.ok || !data?.success || !data?.product) {
    throw new Error(data?.mensaje || `No se encontró información real para ${id}`);
  }
  return data.product;
}

async function runRealAnalysis(productId: string) {
  const id = String(productId || '').trim();
  ensureRealShell();

  if (!id) {
    paintError('No se recibió el ID real del producto.');
    return;
  }

  try {
    const product = await loadRealProduct(id);
    const title = getView()?.querySelector('h3');
    if (title) title.textContent = product.nombre || id;

    const badge = Array.from(getView()?.querySelectorAll('span') || []).find((el) =>
      textOf(el) === 'esperando análisis'
    );
    if (badge) badge.textContent = 'Producto analizado';

    const status = getStatus();
    if (status) {
      status.textContent = `Ejecutando ARKON REAL · ${id} · cargando materiales...`;
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
    try {
      result = JSON.parse(text);
    } catch {
      throw new Error(text || `HTTP ${response.status}`);
    }

    if (!response.ok || result?.ok === false) {
      throw new Error(result?.error || `HTTP ${response.status}`);
    }

    paintResult(result, product.nombre, id);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    paintError(message);
    console.error('ARKON real product analysis failed:', error);
  }
}

export default function ArkonAnalysisConnector() {
  useEffect(() => {
    let cancelled = false;

    resetAnalysisView();

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
      if (!textOf(button).includes('analizar')) return;

      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();

      const inline = button.getAttribute('onclick') || '';
      const match = inline.match(/(?:analizarDesdeCatalogo|seleccionarYAnalizar)\(['"]([^'"]+)['"]\)/);
      const selector = document.querySelector('#global-product-selector') as HTMLSelectElement | null;
      const productId = match?.[1] || selector?.value || '';

      if (productId) {
        const w = window as any;
        if (typeof w.seleccionarYAnalizar === 'function') w.seleccionarYAnalizar(productId);
        else if (typeof w.analizarDesdeCatalogo === 'function') w.analizarDesdeCatalogo(productId);
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
