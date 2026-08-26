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

function paintResult(result: any, materialId: string) {
  const status = document.querySelector('#analysis-live-status');
  const total = Number(result?.totalNeuronas || 0);
  const active = Number(result?.neuronasConDatos || 0);
  const coverage = Number(result?.coberturaPorc || 0);
  const confidence = Number(result?.confianzaPromedio || 0);
  const outputs = Array.isArray(result?.neuronasActivadas) ? result.neuronasActivadas : [];

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
        <div class="rounded-xl border border-slate-800 p-3"><div class="text-[9px] uppercase text-slate-500">Pendientes</div><div class="mt-1 text-xl font-semibold">${Number(result?.neuronasSinDatos || 0)}</div></div>
      </div>
      <div class="overflow-x-auto rounded-xl border border-slate-800">
        <div class="grid grid-cols-[90px_1fr_90px_90px] gap-2 bg-slate-900 px-3 py-2 text-[9px] font-mono uppercase text-slate-500">
          <span>Neurona</span><span>Propiedad</span><span>Valor</span><span>Confianza</span>
        </div>
        ${rows || '<div class="p-4 text-xs text-amber-300">ARKON no activó neuronas porque el producto no tiene propiedades compatibles disponibles.</div>'}
      </div>
      ${result?.esResultadoParcial ? '<div class="text-[10px] font-mono text-amber-300">Resultado parcial: las neuronas sin datos fueron ignoradas por el motor y no bloquearon el cálculo.</div>' : ''}
    </div>
  `;

  (window as any).__ARKON_LAST_ANALYSIS__ = result;
  window.dispatchEvent(new CustomEvent('arkon:analysis-complete', { detail: result }));
}

export default function ArkonAnalysisConnector() {
  useEffect(() => {
    const handler = async (event: Event) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest('button');
      if (!button) return;

      const label = textOf(button);
      if (!label.includes('analizar')) return;

      event.preventDefault();
      event.stopPropagation();
      if ('stopImmediatePropagation' in event) event.stopImmediatePropagation();

      const selector = document.querySelector('#global-product-selector') as HTMLSelectElement | null;
      const materialId = selector?.value?.trim() || '';

      if (!materialId) {
        const status = document.querySelector('#analysis-live-status');
        if (status) {
          status.textContent = 'Seleccioná un producto real del catálogo antes de analizar.';
          status.className = 'text-[10px] font-mono text-rose-400';
        }
        return;
      }

      const status = document.querySelector('#analysis-live-status');
      if (status) {
        status.textContent = `Ejecutando ARKON · ${materialId} · 50 directas + 50 inversas...`;
        status.className = 'text-[10px] font-mono text-cyan-400';
      }

      try {
        const response = await fetch('/api/arkon/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ materialId, estado: 'E01' }),
        });
        const result = await response.json();
        if (!response.ok || result?.ok === false) throw new Error(result?.error || `HTTP ${response.status}`);
        paintResult(result, materialId);
      } catch (error) {
        if (status) {
          status.textContent = `Error ARKON: ${error instanceof Error ? error.message : String(error)}`;
          status.className = 'text-[10px] font-mono text-rose-400';
        }
      }
    };

    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, []);

  return null;
}
