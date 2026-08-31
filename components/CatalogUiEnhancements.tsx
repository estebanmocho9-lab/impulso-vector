'use client';

import { useEffect } from 'react';

type Product = {
  id: string;
  nombre?: string;
  categoria?: string;
  estado?: string;
};

export default function CatalogUiEnhancements() {
  useEffect(() => {
    let cancelled = false;
    let products: Product[] = [];

    const getProducts = async () => {
      try {
        const res = await fetch('/api/products');
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    };

    const findProduct = (value: string) => {
      const q = value.trim().toLowerCase();
      if (!q) return null;
      return products.find((p) =>
        String(p.id ?? '').toLowerCase() === q ||
        String(p.nombre ?? '').toLowerCase() === q
      ) ?? products.find((p) =>
        String(p.id ?? '').toLowerCase().includes(q) ||
        String(p.nombre ?? '').toLowerCase().includes(q) ||
        String(p.categoria ?? '').toLowerCase().includes(q)
      );
    };

    const goToAnalysis = (product: Product | null) => {
      if (!product?.id) return;
      const analyze = (window as any).analizarDesdeCatalogo;
      if (typeof analyze === 'function') {
        analyze(product.id);
      }
    };

    const install = () => {
      if (cancelled) return;

      // The catalog already renders the real product list into #catalog-grid.
      // Remove only the old hard-coded duplicate table that followed it.
      const grid = document.getElementById('catalog-grid');
      const duplicateTable = grid?.nextElementSibling;
      if (duplicateTable?.querySelector('table')) {
        duplicateTable.remove();
      }

      const selector = document.getElementById('global-product-selector');
      if (!selector) return;

      const parent = selector.parentElement;
      if (!parent) return;

      if (document.getElementById('main-product-search')) return;

      const wrapper = document.createElement('div');
      wrapper.id = 'main-product-search';
      wrapper.className = 'flex items-center gap-2 flex-wrap justify-end';

      const input = document.createElement('input');
      input.id = 'main-product-search-input';
      input.type = 'search';
      input.placeholder = 'Buscar producto...';
      input.autocomplete = 'off';
      input.className = 'bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 w-48 sm:w-64 focus:outline-none focus:border-cyan-500';
      input.setAttribute('aria-label', 'Buscar producto para analizar');

      const datalist = document.createElement('datalist');
      datalist.id = 'main-product-search-list';
      input.setAttribute('list', datalist.id);

      const button = document.createElement('button');
      button.type = 'button';
      button.id = 'main-product-search-button';
      button.textContent = 'Analizar';
      button.className = 'px-3 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 border border-cyan-400 cursor-pointer transition';

      const status = document.createElement('span');
      status.id = 'main-product-search-status';
      status.className = 'w-full sm:w-auto text-[10px] text-slate-500 font-mono';

      wrapper.appendChild(input);
      wrapper.appendChild(button);
      wrapper.appendChild(datalist);
      wrapper.appendChild(status);

      // Keep the existing selector intact; add the new search/analyze control beside it.
      parent.appendChild(wrapper);

      const refreshList = (list: Product[]) => {
        datalist.innerHTML = list.slice(0, 250).map((p) => {
          const label = `${p.id} — ${p.nombre ?? ''}`.trim();
          return `<option value="${label.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"></option>`;
        }).join('');
      };

      const execute = () => {
        const value = input.value;
        const product = findProduct(value);
        if (!product) {
          status.textContent = 'Producto no encontrado';
          status.className = 'w-full sm:w-auto text-[10px] text-rose-400 font-mono';
          return;
        }
        status.textContent = `${product.id} seleccionado`;
        status.className = 'w-full sm:w-auto text-[10px] text-emerald-400 font-mono';
        goToAnalysis(product);
      };

      input.addEventListener('input', () => {
        const product = findProduct(input.value);
        status.textContent = product ? `${product.id} — ${product.nombre ?? ''}` : '';
        status.className = 'w-full sm:w-auto text-[10px] text-slate-500 font-mono';
      });
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') execute();
      });
      button.addEventListener('click', execute);

      getProducts().then((data) => {
        if (cancelled) return;
        products = data;
        refreshList(products);
      });
    };

    // ArkonVisual injects its legacy HTML from its own effect, so wait one tick.
    const timer = window.setTimeout(install, 0);
    const retry = window.setTimeout(install, 500);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.clearTimeout(retry);
      document.getElementById('main-product-search')?.remove();
    };
  }, []);

  return null;
}
