'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Resultado {
  id: string;
  producto: string;
  problema_detectado: string;
  causas_fisicas: string[];
  soluciones_propuestas: string[];
  confianza_general: number;
  fecha: string;
}

export default function ResultsPanel({ resultadoId, onVolver }: { resultadoId: string; onVolver: () => void }) {
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      if (resultadoId === 'sin_resultado') { setCargando(false); return; }
      const { data } = await supabase.from('resultados').select('*').eq('id', resultadoId).single();
      if (data) setResultado(data as Resultado);
      setCargando(false);
    };
    cargar();
  }, [resultadoId]);

  if (cargando) return (
    <div className="relative z-10 flex items-center justify-center min-h-[92vh]">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
        <span className="text-white/40 font-mono text-sm">Cargando resultados...</span>
      </div>
    </div>
  );

  if (!resultado) return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-[92vh] px-6 text-center">
      <div className="w-16 h-16 rounded-2xl border border-[#00ff88]/20 bg-[#00ff88]/5 flex items-center justify-center mb-6 text-2xl">🧠</div>
      <h2 className="text-2xl font-black text-white mb-3">Sistema activo</h2>
      <p className="text-white/30 mb-8 max-w-md text-sm leading-relaxed">El motor neuronal está operativo. Ejecutá el backend para procesar y guardar resultados reales.</p>
      <button onClick={onVolver} className="px-6 py-3 border border-[#00ff88]/30 text-[#00ff88] rounded-xl text-sm font-mono uppercase tracking-widest hover:bg-[#00ff88]/10 transition-all">
        Volver
      </button>
    </div>
  );

  const confianza = Math.round(resultado.confianza_general * 100);

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-white/30 text-xs font-mono uppercase tracking-widest mb-2">— Análisis completado —</p>
          <h2 className="text-4xl font-black text-white">{resultado.producto}</h2>
          <p className="text-white/30 text-sm mt-2 font-mono">{new Date(resultado.fecha).toLocaleString('es-AR')}</p>
        </div>
        <button onClick={onVolver} className="px-5 py-2.5 border border-white/10 text-white/40 rounded-xl text-xs font-mono uppercase tracking-widest hover:border-[#00ff88]/30 hover:text-[#00ff88] transition-all">
          Nuevo análisis
        </button>
      </div>

      {/* Problema */}
      <div className="border border-red-500/20 bg-red-500/5 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <span className="text-red-400 text-xs font-mono uppercase tracking-widest">Problema detectado</span>
        </div>
        <p className="text-white/70 text-sm leading-relaxed">{resultado.problema_detectado}</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Confianza', valor: `${confianza}%`, color: '#00ff88', sub: 'del análisis' },
          { label: 'Neuronas', valor: '20', color: '#00ccff', sub: 'activadas' },
          { label: 'Capas', valor: '6', color: '#8800ff', sub: 'procesadas' },
          { label: 'Inferencias', valor: '4', color: '#ff8800', sub: 'generadas' },
        ].map((m) => (
          <div key={m.label} className="border border-white/5 rounded-2xl p-5 bg-white/1">
            <div className="text-3xl font-black font-mono mb-1" style={{ color: m.color }}>{m.valor}</div>
            <div className="text-white/60 text-sm font-bold">{m.label}</div>
            <div className="text-white/20 text-xs mt-0.5">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Causas y soluciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-yellow-500/20 bg-yellow-500/3 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            <span className="text-yellow-400 text-xs font-mono uppercase tracking-widest">Causas físicas</span>
          </div>
          <ul className="space-y-3">
            {resultado.causas_fisicas?.map((c, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-white/60 leading-relaxed">
                <span className="text-yellow-400 font-mono mt-0.5 flex-shrink-0">→</span>
                {c}
              </li>
            ))}
          </ul>
        </div>

        <div className="border border-[#00ff88]/20 bg-[#00ff88]/3 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
            <span className="text-[#00ff88] text-xs font-mono uppercase tracking-widest">Soluciones propuestas</span>
          </div>
          <ul className="space-y-3">
            {resultado.soluciones_propuestas?.map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-white/60 leading-relaxed">
                <span className="text-[#00ff88] font-mono mt-0.5 flex-shrink-0">✓</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Barra confianza */}
      <div className="mt-6 border border-white/5 rounded-2xl p-6 bg-white/1">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-mono uppercase tracking-widest text-white/30">Nivel de confianza neuronal</span>
          <span className="text-[#00ff88] font-mono font-bold">{confianza}%</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${confianza}%`, background: 'linear-gradient(90deg, #00ff88, #00ccff)' }} />
        </div>
      </div>
    </div>
  );
}