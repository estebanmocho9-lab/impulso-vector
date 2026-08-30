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
  panel.innerHTML = `
    <div class="space-y-3">
      <div class="text-[10px] font-mono uppercase tracking-widest text-slate-500">Datos reales</div>
      <div class="text-lg font-semibold text-white">${escapeHtml(message)}</div>
      <div class="text-xs text-slate-500">No se muestran valores de demostración.</div>
    </div>
  `;
}

function renderMaterial(item: any) {
  if (!item?.ok) {
    return `
      <div class="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
        <div class="text-[10px] font-mono uppercase tracking-widest text-rose-400">Material con error</div>
        <div class="mt-1 text-sm font-semibold text-white">${escapeHtml(String(item?.materialId || 'sin ID'))}</div>
        <div class="mt-2 text-xs text-rose-200">${escapeHtml(String(item?.error || 'ARKON no devolvió resultado.'))}</div>
      </div>
    `;
  }

  const result = item?.resultado || {};
  const neuronas = Array.isArray(result?.neuronasActivadas) ? result.neuronasActivadas : [];

  return `
    <div class="rounded-xl border border-slate-800 p-4 space-y-4">
      <div>
        <div class="text-[10px] font-mono uppercase tracking-widest text-cyan-400">Material analizado por ARKON</div>
        <div class="mt-1 text-sm font-semibold text-white">${escapeHtml(String(item.materialId))}</div>
        <div class="mt-1 text-[10px] text-slate-500">Motor: ${escapeHtml(String(result?.motor || 'ARKON'))} · Contexto: ${escapeHtml(String(result?.contexto || 'general'))}</div>
      </div>

      <div class="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
        <div class="text-[9px] uppercase tracking-widest text-cyan-400 mb-3">Propiedades devueltas por ARKON</div>
        ${neuronas.length ? `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            ${neuronas.map((n: any) => `
              <div class="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                <div class="flex items-center justify-between gap-3">
                  <div class="text-xs font-semibold text-white">${escapeHtml(String(n?.propertyName || n?.neuronId || 'Propiedad'))}</div>
                  <div class="text-xs font-mono text-cyan-300">${Number.isFinite(Number(n?.valorCompuesto)) ? Number(n.valorCompuesto).toFixed(2) : '—'}</div>
                </div>
                <div class="mt-1 text-[9px] font-mono text-slate-500">${escapeHtml(String(n?.neuronId || ''))}</div>
              </div>
            `).join('')}
          </div>
        ` : '<div class="text-xs text-slate-500">ARKON no devolvió propiedades con datos.</div>'}
      </div>
    </div>
  `;
}

function paintResult(result: any, productName: string, productId: string) {
  const panel = ensureRealShell();
  if (!panel) return;

  const materiales = Array.isArray(result?.materiales) ? result.materiales : [];
  const productMaterialId = result?.producto?.materialId ? String(result.producto.materialId) : '';
  const status = getStatus();

  if (status) {
    status.textContent = `ARKON REAL · producto ${productId} · material ${productMaterialId || 'sin material_id'}`;
    status.className = 'text-[10px] font-mono text-emerald-400 mt-2';
  }

  panel.innerHTML = `
    <div class="space-y-5">
      <div>
        <div class="text-[10px] font-mono uppercase tracking-widest text-cyan-400">Resultado real de ARKON</div>
        <div class="mt-1 text-lg font-semibold text-white">${escapeHtml(productName || result?.producto?.nombre || productId)}</div>
        <div class="mt-1 text-[10px] font-mono text-slate-500">Producto: ${escapeHtml(productId)} · Material utilizado por ARKON: ${escapeHtml(productMaterialId || 'no disponible')}</div>
      </div>

      <div class="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-200">
        El material enviado a ARKON proviene exclusivamente de <span class="font-mono">productos.material_id</span> del producto seleccionado. No se fabrica ni se sustituye ningún valor.
      </div>

      <div class="space-y-4">
        ${materiales.length ? materiales.map(renderMaterial).join('') : '<div class="text-xs text-amber-300">ARKON no devolvió resultados de propiedades.</div>'}
      </div>
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
  if (!/^\d+$/.test(String(id).trim())) {
    throw new Error('La selección del catálogo debe contener el id numérico del producto.');
  }

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

  if (!/^\d+$/.test(id)) {
    paintError('El botón Analizar no recibió un id numérico de producto. Se detuvo el análisis para no enviar un material equivocado a ARKON.');
    return;
  }

  try {
    const product = await loadRealProduct(id);
    const title = getView()?.querySelector('h3');
    if (title) title.textContent = product.nombre || id;

    const badge = Array.from(getView()?.querySelectorAll('span') || []).find((el) =>
      ['esperando análisis', 'producto analizado', 'producto seleccionado'].includes(textOf(el))
    );
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

async function loadRealCatalog() {
  try {
    const response = await fetch('/api/products', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok || !Array.isArray(data)) return;

    const validProducts = data.filter((p: any) => p && /^\d+$/.test(String(p.id || '')));

    const selector = document.querySelector('#global-product-selector') as HTMLSelectElement | null;
    if (selector) {
      selector.innerHTML = validProducts.map((p: any) =>
        `<option value="${escapeHtml(String(p.id))}">${escapeHtml(String(p.id))} — ${escapeHtml(String(p.nombre || 'Producto'))}</option>`
      ).join('');
    }

    const tableBody = document.querySelector('#view-catalog table tbody') as HTMLElement | null;
    if (tableBody) {
      tableBody.innerHTML = validProducts.map((p: any) => `
        <tr class="hover:bg-slate-900/40 transition">
          <td class="py-3.5 px-3">
            <div class="font-bold text-white">${escapeHtml(String(p.nombre || 'Producto'))}</div>
            <div class="text-[10px] font-mono text-cyan-400">Producto ${escapeHtml(String(p.id))} · material ${escapeHtml(String(p.materialId || 'sin material_id'))}</div>
          </td>
          <td class="py-3.5 px-3 text-slate-400">${escapeHtml(String(p.categoria || 'Sin categoría'))}</td>
          <td class="py-3.5 px-3"><span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">${escapeHtml(String(p.estado || ''))}</span></td>
          <td class="py-3.5 px-3 text-right">
            <button data-arkon-product-id="${escapeHtml(String(p.id))}" class="arkon-catalog-analyze px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer font-bold transition">Analizar</button>
          </td>
        </tr>
      `).join('');
    }

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
