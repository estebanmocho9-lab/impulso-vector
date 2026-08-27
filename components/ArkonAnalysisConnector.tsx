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

function getStatus() {
  return document.querySelector('#analysis-live-status') as HTMLElement | null;
}

function clearStaticDemoValues() {
  const ids = ['card-rentabilidad', 'card-innovacion', 'card-mercado', 'card-sostenibilidad', 'card-viabilidad'];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) el.textContent = '—';
  }

  const analysis = document.querySelector('#view-analysis') as HTMLElement | null;
  if (!analysis) return;

  // Hide only the hard-coded demo content while a real ARKON result is shown.
  analysis.querySelectorAll('[data-arkon-demo]').forEach((el) => {
    (el as HTMLElement).hidden = true;
  });
}

function paintResult(result: any, materialId: string) {
  const status = getStatus();
  const indice = Number(result?.indice);
  const cobertura = Number(result?.cobertura);
  const causas = Array.isArray(result?.causas) ? result.causas : [];
  const soluciones = Array.isArray(result?.soluciones) ? result.soluciones : [];
  const triz = Array.isArray(result?.triz) ? result.triz : [];
  const resultadoId = result?.resultado_id ?? '—';

  if (status) {
    status.textContent = `ARKON EN VIVO · ${materialId} · resultado ${resultadoId} · cobertura ${Number.isFinite(cobertura) ? (cobertura * 100).toFixed(1) : '0.0'}%`;
    status.className = 'text-[10px] font-mono text-emerald-400';
  }

  clearStaticDemoValues();

  const target = document.querySelector('#arkon-real-result');
  const panel = target || (() => {
    const created = document.createElement('div');
    created.id = 'arkon-real-result';
    created.className = 'mt-6 rounded-2xl border border-cyan-500/20 bg-slate-950/80 p-5 text-slate-100';
    const anchor = status?.parentElement || document.body;
    anchor.insertAdjacentElement('afterend', created);
    return created;
  })();

  const list = (items: any[], empty: string) => items.length
    ? `<ul class="space-y-2">${items.map((item) => `<li class="text-xs text-slate-300 border-b border-slate-800 pb-2">${escapeHtml(String(item))}</li>`).join('')}</ul>`
    : `<div class="text-xs text-slate-500">${empty}</div>`;

  panel.innerHTML = `
    <div class="space-y-5">
      <div>
        <div class="text-[10px] font-mono uppercase tracking-widest text-cyan-400">Resultado real de ARKON</div>
        <div class="mt-1 text-lg font-semibold text-white">Producto ${escapeHtml(materialId)}</div>
        <div class="mt-1 text-[10px] font-mono text-slate-500">ID de resultado: ${escapeHtml(String(resultadoId))}</div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div class="rounded-xl border border-slate-800 p-3">
          <div class="text-[9px] uppercase text-slate-500">Índice ARKON</div>
          <div class="mt-1 text-xl font-semibold text-cyan-400">${Number.isFinite(indice) ? indice.toFixed(1) : '—'}/100</div>
        </div>
        <div class="rounded-xl border border-slate-800 p-3">
          <div class="text-[9px] uppercase text-slate-500">Cobertura real</div>
          <div class="mt-1 text-xl font-semibold">${Number.isFinite(cobertura) ? (cobertura * 100).toFixed(1) : '0.0'}%</div>
        </div>
        <div class="rounded-xl border border-slate-800 p-3">
          <div class="text-[9px] uppercase text-slate-500">TRIZ</div>
          <div class="mt-1 text-xl font-semibold">${triz.length}</div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="rounded-xl border border-slate-800 p-4">
          <div class="text-[10px] font-mono uppercase text-slate-500 mb-3">Causas físicas</div>
          ${list(causas, 'El motor no reportó causas físicas.')}
        </div>
        <div class="rounded-xl border border-slate-800 p-4">
          <div class="text-[10px] font-mono uppercase text-slate-500 mb-3">Soluciones propuestas</div>
          ${list(soluciones, 'El motor no reportó soluciones propuestas.')}
        </div>
        <div class="rounded-xl border border-slate-800 p-4">
          <div class="text-[10px] font-mono uppercase text-slate-500 mb-3">Principios TRIZ</div>
          ${list(triz, 'El motor no reportó principios TRIZ.')}
        </div>
      </div>
    </div>
  `;

  (window as any).__ARKON_LAST_ANALYSIS__ = result;
  window.dispatchEvent(new CustomEvent('arkon:analysis-complete', { detail: result }));
}

function paintError(message: string) {
  const status = getStatus();
  if (status) {
    status.textContent = `Error ARKON: ${message}`;
    status.className = 'text-[10px] font-mono text-rose-400';
  }

  const panel = document.querySelector('#arkon-real-result') as HTMLElement | null;
  if (panel) {
    panel.innerHTML = `<div class="text-sm text-rose-300"><strong>ARKON no pudo completar el análisis.</strong><div class="mt-2 text-xs text-slate-400">${escapeHtml(message)}</div></div>`;
  }
}

async function runRealAnalysis(materialId: string) {
  const id = String(materialId || '').trim();
  const status = getStatus();

  if (!id) {
    paintError('No se recibió un producto real para analizar.');
    return;
  }

  if (status) {
    status.textContent = `Ejecutando ARKON · ${id}...`;
    status.className = 'text-[10px] font-mono text-cyan-400';
  }

  try {
    // /api/analizar espera producto + material_id + contexto.
    // No enviamos materialId porque ese nombre no existe en el contrato del motor.
    const response = await fetch('/api/analizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        producto: id,
        material_id: id,
        contexto: 'general',
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

    paintResult(result, id);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    paintError(message);
    console.error('ARKON real analysis failed:', error);
  }
}

export default function ArkonAnalysisConnector() {
  useEffect(() => {
    let cancelled = false;

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
          await new Promise((resolve) => window.setTimeout(resolve, 200));
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
