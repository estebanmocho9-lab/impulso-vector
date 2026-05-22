
'use client';

const MODULOS = [
  { icono: '🔬', titulo: 'Análisis de Producto', desc: 'Detecta problemas físicos, causas y soluciones basadas en propiedades reales del material.', tag: 'Real', color: '#00ff88', activo: true },
  { icono: '📸', titulo: 'Análisis de Imagen', desc: 'Evalúa calidad fotográfica, enfoque, iluminación y composición para publicaciones.', tag: 'IA', color: '#00ccff', activo: true },
  { icono: '📊', titulo: 'Análisis de Mercado', desc: 'Identifica canales de venta, horarios óptimos y estrategias para tu producto.', tag: 'IA', color: '#8800ff', activo: true },
  { icono: '💰', titulo: 'Calculadora Financiera', desc: 'Estimá costos, margen de ganancia y precio de venta de tu producto.', tag: 'Herramienta', color: '#ff8800', activo: true },
];

export default function Dashboard({ onIniciar }: { onIniciar: () => void }) {
  return (
    <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">

      {/* Hero */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#00ff88]/20 bg-[#00ff88]/5 mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
          <span className="text-[#00ff88] text-xs font-mono uppercase tracking-widest">Plataforma para emprendedores</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-tight">
          Analizá tu producto<br />
          <span className="text-[#00ff88]">con inteligencia real</span>
        </h1>
        <p className="text-white/40 text-lg max-w-xl mx-auto mb-8">
          Sistema de análisis material, visual y comercial para emprendedores que fabrican productos físicos.
        </p>
        <button
          onClick={onIniciar}
          className="px-10 py-4 bg-[#00ff88] text-black font-black text-sm uppercase tracking-widest rounded-xl hover:scale-105 transition-all duration-300"
        >
          Iniciar análisis completo →
        </button>
      </div>

      {/* Módulos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        {MODULOS.map((m) => (
          <div key={m.titulo}
            className="group border border-white/5 rounded-2xl p-6 bg-white/1 hover:border-white/10 transition-all duration-300 cursor-default">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: `${m.color}10`, border: `1px solid ${m.color}20` }}>
                {m.icono}
              </div>
              <span className="px-2 py-1 rounded text-[10px] font-mono uppercase tracking-widest border"
                style={{ color: m.color, borderColor: `${m.color}30`, background: `${m.color}08` }}>
                {m.tag}
              </span>
            </div>
            <h3 className="text-white font-bold text-lg mb-2">{m.titulo}</h3>
            <p className="text-white/30 text-sm leading-relaxed">{m.desc}</p>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 border border-white/5 rounded-2xl p-6 bg-white/1">
        {[
          { val: '34', label: 'Propiedades analizadas' },
          { val: '20', label: 'Neuronas activas' },
          { val: '4', label: 'Módulos integrados' },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-3xl font-black text-[#00ff88] font-mono">{s.val}</div>
            <div className="text-white/30 text-xs mt-1 uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}



