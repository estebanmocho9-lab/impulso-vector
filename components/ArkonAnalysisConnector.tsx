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

function paintResult(result: any, materialId: string) {
  const status = getStatus();
  const payload = result?.resultado || result;
  const total = Number(payload?.totalNeuronas || 100);
  const active = Number(payload?.neuronasConDatos || 0);
  const coverage = Number(payload?.coberturaPorc || 0);
  const confidence = Number(payload?.confianzaPromedio || 0);
  const outputs = Array.isArray(payload?.neuronasActivadas) ? payload.neuronasActivadas : [];

  if (status) {
    status.textContent = `ARKON EN VIVO · ${materialId} · ${active}/${total} neuronas con datos · cobertura ${coverage.toFixed(1)}%`;
    status.className = 'text-[10px] font-mono text-emerald-400';
  }

  const target = document.querySelector('#arkon-real-result');
  const panel = target || (() => {
    const created = document.createElement('div');
    created.id = 'arkon-real-result';
    created.className = 'mt-6 rounded-2xl border border-cyan-500/20 bg-slate-950/80 p-5 text-slate-100';
    const anchor = status?.parentElement || document.body;
    anchor.insertAdjacentElement('afterend', created);
    return created;
  })();

  const rows = outputs.map((neuron: any) => `
    <div class="grid grid-cols-[90px_1fr_90px_90px] gap-2 border-b border-slate-800 py-2 text-[10px] font-mono">
      <span class="text-cyan-400">${escapeHtml(String(neuron?.neuronId ?? ''))}</span>
      <span class="text-slate-300">${escapeHtml(String(neuron?.propertyName ?? ''))}</span>
      <span class="text-slate-200">${escapeHtml(String(neuron?.valorCompuesto ?? ''))}</span>
      <span class="text-emerald-400">${escapeHtml(String(neuron?.confianza ?? ''))}</span>
    </div>
  `).join('');

  panel.innerHTML = `
    <div class="space-y-4">
      <div>
        <div class="text-[10px] font-mono uppercase tracking-widest text-cyan-400">Resultado real de ARKON</div>
        <div class="mt-1 text-lg font-semibold text-white">Producto ${escapeHtml(materialId)}</div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="rounded-xl border border-slate-800 p-3"><div class="text-[9px] uppercase text-slate-500">Neuronas activadas</div><div class="mt-1 text-xl font-semibold">${active}/${total}</div></div>
        <div class="rounded-xl border border-slate-800 p-3"><div class="text-[9px] uppercase text-slate-500">Cobertura</div><div class="mt-1 text-xl font-semibold">${coverage.toFixed(1)}%</div></div>
        <div class="rounded-xl border border-slate-800 p-3"><div class="text-[9px] uppercase text-slate-500">Confianza promedio</div><div class="mt-1 text-xl font-semibold">${confidence.toFixed(3)}</div></div>
        <div class="rounded-xl border border-slate-800 p-3"><div class="text-[9px] uppercase text-slate-500">Pendientes</div><div class="mt-1 text-xl font-semibold">${Number(payload?.neuronasSinDatos || 0)}</div></div>
      </div>
      <div class="overflow-x-auto rounded-xl border border-slate-800">
        <div class="grid grid-cols-[90px_1fr_90px_90px] gap-2 bg-slate-900 px-3 py-2 text-[9px] font-mono uppercase text-slate-500">
          <span>Neurona</span><span>Propiedad</span><span>Valor</span><span>Confianza</span>
        </div>
        ${rows || '<div class="p-4 text-xs text-amber-300">ARKON respondió sin salidas neuronales compatibles para este producto.</div>'}
      </div>
      ${payload?.esResultadoParcial ? '<div class="text-[10px] font-mono text-amber-300">Resultado parcial: las neuronas sin datos fueron ignoradas por el motor.</div>' : ''}
    </div>
  `;

  (window as any).__ARKON_LAST_ANALYSIS__ = payload;
  window.dispatchEvent(new CustomEvent('arkon:analysis-complete', { detail: payload }));
}

async function runRealAnalysis(materialId: string) {
  const id = String(materialId || '').trim();
  const status = getStatus();

  if (!id) {
    if (status) {
      status.textContent = 'No se recibió un producto real para analizar.';
      status.className = 'text-[10px] font-mono text-rose-400';
    }
    return;
  }

  if (status) {
    status.textContent = `Ejecutando ARKON · ${id} · 50 directas + 50 inversas...`;
    status.className = 'text-[10px] font-mono text-cyan-400';
  }

  try {
    const response = await fetch('/api/analizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ materialId: id, contexto: 'general', estado: 'E01' }),
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
    if (status) {
      status.textContent = `Error ARKON: ${error instanceof Error ? error.message : String(error)}`;
      status.className = 'text-[10px] font-mono text-rose-400';
    }
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

        w.seleccionarYAnalizar = async (id: string) => {
          const productId = String(id || '').trim();
          originalCambiarProductoGlobal(productId);
          originalSwitchNav('analysis');
          await new Promise((resolve) => window.setTimeout(resolve, 200));
          await runRealAnalysis(productId);
        };

        w.analizarDesdeCatalogo = async (id: string) => {
          const productId = String(id || '').trim();
          originalCambiarProductoGlobal(productId);
          originalSwitchNav('analysis');
          await new Promise((resolve) => window.setTimeout(resolve, 200));
          await runRealAnalysis(productId);
        };

        w.__ARKON_REAL_BRIDGE_INSTALLED__ = true;
      }
    };

    installCatalogBridge();

    const handler = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest('button');
      if (!button) return;
      if (!textOf(button).includes('analizar')) return;

      // The catalog uses inline onclick handlers. Stop the legacy demo handler
      // and let the bridge installed above perform the real analysis.
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
