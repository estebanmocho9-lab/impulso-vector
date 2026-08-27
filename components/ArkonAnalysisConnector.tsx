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

function valueOrMissing(value: unknown, formatter?: (value: number) => string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 'Falta datos';
  return formatter ? formatter(n) : String(value);
}

function ensureRealShell() {
  const view = getView();
  if (!view) return null;

  // The old analysis screen is a visual demo. Keep only the real product selector
  // and replace every hard-coded analysis result with a clean real-data shell.
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

    const description = Array.from(header.querySelectorAll('span')).find((el) =>
      textOf(el).includes('información suficiente')
    );
    if (description) description.textContent = 'Los datos se mostrarán únicamente cuando existan en ARKON';

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

function paintResult(result: any, materialId: string, productName?: string) {
  const panel = ensureRealShell();
  if (!panel) return;

  const payload = result?.resultado ?? result ?? {};
  const indice = payload?.indice;
  const cobertura = payload?.cobertura;
  const causas = Array.isArray(payload?.causas) ? payload.causas : [];
  const soluciones = Array.isArray(payload?.soluciones) ? payload.soluciones : [];
  const triz = Array.isArray(payload?.triz) ? payload.triz : [];
  const resultadoId = payload?.resultado_id ?? result?.resultado_id ?? 'Falta datos';

  const status = getStatus();
  if (status) {
    const coverageText = Number.isFinite(Number(cobertura))
      ? `${(Number(cobertura) * 100).toFixed(1)}%`
      : 'Falta datos';
    status.textContent = `ARKON REAL · ${materialId} · resultado ${resultadoId} · cobertura ${coverageText}`;
    status.className = 'text-[10px] font-mono text-emerald-400 mt-2';
  }

  const list = (items: any[]) => items.length
    ? `<ul class="space-y-2">${items.map((item) => `<li class="text-xs text-slate-300 border-b border-slate-800 pb-2">${escapeHtml(String(item))}</li>`).join('')}</ul>`
    : `<div class="text-xs text-amber-300">Falta datos</div>`;

  panel.innerHTML = `
    <div class="space-y-6">
      <div>
        <div class="text-[10px] font-mono uppercase tracking-widest text-cyan-400">Resultado real de ARKON</div>
        <div class="mt-1 text-lg font-semibold text-white">${escapeHtml(productName || materialId)}</div>
        <div class="mt-1 text-[10px] font-mono text-slate-500">Material: ${escapeHtml(materialId)} · ID resultado: ${escapeHtml(String(resultadoId))}</div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div class="rounded-xl border border-slate-800 p-4">
          <div class="text-[9px] uppercase text-slate-500">Índice ARKON</div>
          <div class="mt-1 text-xl font-semibold text-cyan-400">${valueOrMissing(indice, (n) => `${n.toFixed(1)}/100`)}</div>
        </div>
        <div class="rounded-xl border border-slate-800 p-4">
          <div class="text-[9px] uppercase text-slate-500">Cobertura real</div>
          <div class="mt-1 text-xl font-semibold">${valueOrMissing(cobertura, (n) => `${(n * 100).toFixed(1)}%`)}</div>
        </div>
        <div class="rounded-xl border border-slate-800 p-4">
          <div class="text-[9px] uppercase text-slate-500">TRIZ</div>
          <div class="mt-1 text-xl font-semibold">${triz.length ? triz.length : 'Falta datos'}</div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="rounded-xl border border-slate-800 p-4">
          <div class="text-[10px] font-mono uppercase text-slate-500 mb-3">Causas físicas</div>
          ${list(causas)}
        </div>
        <div class="rounded-xl border border-slate-800 p-4">
          <div class="text-[10px] font-mono uppercase text-slate-500 mb-3">Soluciones propuestas</div>
          ${list(soluciones)}
        </div>
        <div class="rounded-xl border border-slate-800 p-4">
          <div class="text-[10px] font-mono uppercase text-slate-500 mb-3">Principios TRIZ</div>
          ${list(triz)}
        </div>
      </div>

      ${Number(cobertura) === 0 || !Number.isFinite(Number(cobertura))
        ? '<div class="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-300">Falta datos reales suficientes para producir un análisis. ARKON no inventó valores.</div>'
        : ''}
    </div>
  `;

  (window as any).__ARKON_LAST_ANALYSIS__ = payload;
  window.dispatchEvent(new CustomEvent('arkon:analysis-complete', { detail: payload }));
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

async function runRealAnalysis(materialId: string) {
  const id = String(materialId || '').trim();
  ensureRealShell();

  if (!id) {
    paintError('No se recibió un producto real para analizar.');
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
      status.textContent = `Ejecutando ARKON REAL · ${id} · contexto ${product.categoria || 'Falta datos'}...`;
      status.className = 'text-[10px] font-mono text-cyan-400 mt-2';
    }

    // The public Next.js route is the gateway to the real ARKON engine.
    // It expects materialId/productId, not producto/material_id.
    const response = await fetch('/api/analizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        materialId: id,
        contexto: product.categoria || 'general',
      }),
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

    paintResult(result, id, product.nombre);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    paintError(message);
    console.error('ARKON real analysis failed:', error);
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
      const materialId = match?.[1] || selector?.value || '';

      if (materialId) {
        const w = window as any;
        if (typeof w.seleccionarYAnalizar === 'function') {
          w.seleccionarYAnalizar(materialId);
        } else if (typeof w.analizarDesdeCatalogo === 'function') {
          w.analizarDesdeCatalogo(materialId);
        }
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
