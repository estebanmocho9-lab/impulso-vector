(function () {
  'use strict';

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getPanel() {
    var view = document.getElementById('view-analysis');
    if (!view) return null;
    var panel = document.getElementById('arkon-real-analysis-result');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'arkon-real-analysis-result';
      panel.className = 'glass-card rounded-2xl p-6 mb-6 border-cyan-500/40';
      view.insertBefore(panel, view.firstChild);
    }
    return panel;
  }

  function render(panel, product, result) {
    var analisis = result && result.analisis ? result.analisis : {};
    var problemas = result && result.problemasDetectados ? result.problemasDetectados : [];
    var propiedades = result && result.propiedadesProblema ? result.propiedadesProblema : [];
    var mejoras = result && result.mejoras ? result.mejoras : [];
    var triz = result && result.triz ? result.triz : [];
    var alternativas = result && result.materiales_alternativos ? result.materiales_alternativos : [];
    var analisisHtml = Object.keys(analisis).map(function (key) {
      var a = analisis[key] || {};
      return '<div class="bg-slate-950/70 p-3 rounded-xl border border-slate-800">' +
        '<div class="text-xs font-bold text-white">' + esc(key) + '</div>' +
        '<div class="text-[11px] text-slate-400 mt-1">Índice: <b class="text-cyan-400">' + esc(a.indice) + '</b> · Nivel: <b class="text-amber-400">' + esc(a.nivel) + '</b> · Confianza: ' + esc(a.confianza) + '</div>' +
        '</div>';
    }).join('');

    panel.innerHTML =
      '<div class="flex items-center justify-between gap-4 mb-4">' +
        '<div><div class="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">MOTOR REAL DE ARKON</div>' +
        '<h3 class="text-lg font-extrabold text-white mt-1">Análisis ejecutado</h3>' +
        '<p class="text-xs text-slate-400 mt-1">' + esc(product.nombre || product.id) + ' · ' + esc(product.id) + '</p></div>' +
        '<span class="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">DATOS REALES</span>' +
      '</div>' +
      '<div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">' +
        '<div class="bg-slate-950/70 p-4 rounded-xl border border-slate-800"><div class="text-[10px] text-slate-400 uppercase">Problemas</div><div class="text-2xl font-extrabold text-white mt-1">' + esc(problemas.length) + '</div></div>' +
        '<div class="bg-slate-950/70 p-4 rounded-xl border border-slate-800"><div class="text-[10px] text-slate-400 uppercase">Propiedades fuera de rango</div><div class="text-2xl font-extrabold text-white mt-1">' + esc(propiedades.length) + '</div></div>' +
        '<div class="bg-slate-950/70 p-4 rounded-xl border border-slate-800"><div class="text-[10px] text-slate-400 uppercase">Cruces analizados</div><div class="text-2xl font-extrabold text-white mt-1">' + esc(Object.keys(analisis).reduce(function (n, k) { return n + Object.keys(analisis[k].cruces || {}).length; }, 0)) + '</div></div>' +
      '</div>' +
      (analisisHtml ? '<div class="space-y-2 mb-4"><div class="text-xs font-bold text-white mb-2">Resultados del motor</div>' + analisisHtml + '</div>' : '<div class="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 mb-4">El motor respondió sin índices no nulos para este producto. El resultado es real; todavía no estamos corrigiendo la lógica del motor.</div>') +
      '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">' +
        '<div><div class="text-xs font-bold text-white mb-2">Mejoras encontradas</div><div class="space-y-2">' + (mejoras.length ? mejoras.map(function (m) { return '<div class="text-[11px] bg-slate-950/70 p-3 rounded-xl border border-slate-800"><b>' + esc(m.problema) + '</b><br><span class="text-slate-400">' + esc(m.solucion) + '</span></div>'; }).join('') : '<div class="text-[11px] text-slate-500">Sin mejoras devueltas por el motor en esta ejecución.</div>') + '</div></div>' +
        '<div><div class="text-xs font-bold text-white mb-2">TRIZ / alternativas</div><div class="space-y-2">' + (triz.length ? triz.map(function (t) { return '<div class="text-[11px] bg-slate-950/70 p-3 rounded-xl border border-slate-800"><b>' + esc(t.parametro) + '</b>: ' + esc((t.principios || []).join(', ')) + '</div>'; }).join('') : '<div class="text-[11px] text-slate-500">Sin principios TRIZ devueltos.</div>') + (alternativas.length ? alternativas.map(function (a) { return '<div class="text-[11px] bg-slate-950/70 p-3 rounded-xl border border-slate-800"><b>' + esc(a.id) + '</b> · ' + esc(a.nombre) + '<br><span class="text-slate-400">' + esc(a.razon) + '</span></div>'; }).join('') : '') + '</div></div>' +
      '</div>';
  }

  async function run(productId, button) {
    var panel = getPanel();
    if (!panel) return;
    if (button) {
      button.disabled = true;
      button.dataset.originalText = button.textContent;
      button.textContent = 'Analizando ARKON...';
    }
    panel.innerHTML = '<div class="text-xs text-cyan-400 font-mono">Ejecutando el motor real de ARKON. No se están usando datos de demostración...</div>';
    try {
      var productResponse = await fetch('/api/products/' + encodeURIComponent(productId), { cache: 'no-store' });
      var productData = await productResponse.json();
      if (!productResponse.ok || !productData.product) throw new Error(productData.mensaje || 'Producto no encontrado');
      var product = productData.product;

      var response = await fetch('/api/analizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialId: product.id,
          contexto: product.categoria,
          producto: product.nombre
        })
      });
      var data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'El motor ARKON no pudo completar el análisis');
      render(panel, product, data.resultado);
    } catch (error) {
      panel.innerHTML = '<div class="text-xs text-rose-400"><b>No se pudo ejecutar el análisis real.</b><br><span class="text-slate-400">' + esc(error.message) + '</span></div>';
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = button.dataset.originalText || 'Analizar →';
      }
    }
  }

  document.addEventListener('click', function (event) {
    var target = event.target && event.target.closest ? event.target.closest('button[onclick*="seleccionarYAnalizar"]') : null;
    if (!target) return;
    var onclick = target.getAttribute('onclick') || '';
    var match = onclick.match(/seleccionarYAnalizar\(['\"]([^'\"]+)['\"]\)/);
    if (!match) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    var id = match[1];
    var view = document.getElementById('view-analysis');
    if (view) {
      document.querySelectorAll('.tab-view').forEach(function (el) { el.classList.remove('active'); });
      view.classList.add('active');
    }
    run(id, target);
  }, true);

  window.arkonRealAnalysis = { run: run };
})();
