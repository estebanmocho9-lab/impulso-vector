'use client';

import { useEffect } from 'react';

function textOf(element: Element) {
  return (element.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function paintResult(result: any) {
  const analysis = result?.analisis || {};
  const problems = result?.problemasDetectados || [];
  const first = Object.entries(analysis)[0] as any;
  const index = first?.[1]?.indice;

  const status = document.querySelector('#analysis-live-status');
  if (status) {
    status.textContent = first
      ? `ARKON respondió: ${first[0]} · índice ${index} · ${first[1].nivel}`
      : `ARKON respondió con ${problems.length} problema(s) detectado(s).`;
    status.className = 'text-[10px] font-mono text-emerald-400';
  }

  const target = document.querySelector('#arkon-real-result');
  if (target) {
    target.innerHTML = `<div class="space-y-2"><div class="text-[10px] font-mono text-cyan-400 uppercase">Resultado real de ARKON</div><div class="text-xs text-slate-200">${escapeHtml(JSON.stringify(result, null, 2))}</div></div>`;
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
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
      const materialId = selector?.value || 'MA.001';
      const tipoProducto = selector?.selectedOptions?.[0]?.textContent?.includes('Mortero')
        ? 'mortero_autonivelante'
        : selector?.selectedOptions?.[0]?.textContent?.includes('Ladrillo')
          ? 'ladrillo_termico'
          : 'placa_antihumedad';

      const status = document.querySelector('#analysis-live-status');
      if (status) status.textContent = `Ejecutando ARKON · ${materialId} · ${tipoProducto}...`;

      try {
        const response = await fetch('/api/arkon/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ materialId, tipoProducto }),
        });
        const result = await response.json();
        if (!response.ok || result?.ok === false) throw new Error(result?.error || `HTTP ${response.status}`);
        paintResult(result);
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
