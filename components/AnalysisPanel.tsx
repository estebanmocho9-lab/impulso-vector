'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const CAPAS = [
  { id: 1, color: '#00ff88', label: 'CAPA 1', desc: 'Cargando vectores físicos' },
  { id: 2, color: '#00ccff', label: 'CAPA 2', desc: 'Activando neuronas relacionales' },
  { id: 3, color: '#8800ff', label: 'CAPA 3', desc: 'Cruzando propiedades directas e inversas' },
  { id: 4, color: '#ff8800', label: 'CAPA 4', desc: 'Validando coherencia global' },
  { id: 5, color: '#ff0088', label: 'CAPA 5', desc: 'Generando inferencias' },
  { id: 6, color: '#00ff88', label: 'CAPA 6', desc: 'Guardando memoria neuronal' },
];

const NEURONAS = [
  'porosidad','absorcion','cohesion','densidad','elasticidad',
  'rigidez','humedad','capilaridad','microfisuracion','conductividad_termica',
  'aislamiento_termico','absorcion_acustica','resistencia_mecanica','fragilidad',
  'peso','flexion','compacidad','hidrofobicidad','dureza','friabilidad'
];

export default function AnalysisPanel({ producto, onFinalizado }: { producto: string; onFinalizado: (id: string) => void }) {
  const [capaActual, setCapaActual] = useState(0);
  const [neuronasActivas, setNeuronasActivas] = useState<string[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const tickInterval = setInterval(() => setTick(p => p + 1), 100);

    // Activar capas progresivamente
    let capa = 0;
    const capaInterval = setInterval(() => {
      if (capa < CAPAS.length) {
        setCapaActual(capa + 1);
        // Activar algunas neuronas por capa
        const nuevas = NEURONAS.slice(capa * 3, (capa + 1) * 3);
        setNeuronasActivas(prev => [...prev, ...nuevas]);
        capa++;
      } else {
        clearInterval(capaInterval);
      }
    }, 900);

    // Buscar resultado real
    const buscar = async () => {
      await new Promise(r => setTimeout(r, CAPAS.length * 900 + 1000));
      const { data } = await supabase
        .from('resultados')
        .select('id')
        .eq('producto', producto)
        .order('fecha', { ascending: false })
        .limit(1)
        .single();
      clearInterval(tickInterval);
      onFinalizado(data?.id ?? 'sin_resultado');
    };

    buscar();
    return () => { clearInterval(tickInterval); clearInterval(capaInterval); };
  }, [producto, onFinalizado]);

  const progreso = Math.round((capaActual / CAPAS.length) * 100);

  return (
    <div className="relative z-10 min-h-[92vh] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12">

        {/* Panel izquierdo — capas */}
        <div>
          <p className="text-white/30 text-xs font-mono uppercase tracking-widest mb-3">— Analizando —</p>
          <h2 className="text-3xl font-black text-white mb-1">{producto}</h2>
          <p className="text-white/30 text-sm mb-8">Motor neuronal activo</p>

          {/* Barra progreso */}
          <div className="mb-8">
            <div className="flex justify-between text-xs font-mono text-white/30 mb-2">
              <span>Progreso global</span>
              <span className="text-[#00ff88]">{progreso}%</span>
            </div>
            <div className="h-px bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-[#00ff88] rounded-full transition-all duration-700" style={{ width: `${progreso}%` }} />
            </div>
          </div>

          {/* Capas */}
          <div className="space-y-3">
            {CAPAS.map((capa, i) => {
              const activa = capaActual > i;
              const actual = capaActual === i + 1;
              return (
                <div key={capa.id} className="flex items-center gap-4 transition-all duration-500"
                  style={{ opacity: capaActual < i ? 0.2 : 1 }}>
                  <div className="w-8 h-8 rounded-lg border flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 transition-all duration-500"
                    style={{
                      borderColor: activa ? capa.color : 'rgba(255,255,255,0.1)',
                      color: activa ? capa.color : 'rgba(255,255,255,0.2)',
                      background: activa ? `${capa.color}15` : 'transparent',
                      boxShadow: actual ? `0 0 12px ${capa.color}40` : 'none',
                    }}>
                    {activa && !actual ? '✓' : capa.id}
                  </div>
                  <div>
                    <div className="text-xs font-mono uppercase tracking-widest mb-0.5" style={{ color: activa ? capa.color : 'rgba(255,255,255,0.2)' }}>
                      {capa.label}
                    </div>
                    <div className="text-sm text-white/50">{capa.desc}</div>
                  </div>
                  {actual && (
                    <div className="ml-auto flex gap-1">
                      {[0,1,2].map(j => (
                        <div key={j} className="w-1 h-1 rounded-full"
                          style={{ background: capa.color, opacity: Math.sin(tick * 0.3 + j * 1.2) > 0 ? 1 : 0.2, transition: 'opacity 0.2s' }} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel derecho — neuronas */}
        <div className="border border-white/5 rounded-2xl p-6 bg-white/1">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-mono uppercase tracking-widest text-white/30">Red Neuronal</span>
            <span className="text-[#00ff88] font-mono font-bold">{neuronasActivas.length}<span className="text-white/20">/20</span></span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {NEURONAS.map((n, i) => {
              const activa = neuronasActivas.includes(n);
              const valor = activa ? Math.floor(30 + Math.sin(tick * 0.1 + i) * 40 + 40) : 0;
              return (
                <div key={n} className="rounded-lg p-2 text-center transition-all duration-500 border"
                  style={{
                    background: activa ? 'rgba(0,255,136,0.05)' : 'rgba(255,255,255,0.01)',
                    borderColor: activa ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.04)',
                  }}>
                  <div className="text-xs font-mono mb-1" style={{ color: activa ? '#00ff88' : 'rgba(255,255,255,0.15)' }}>
                    {valor > 0 ? valor : '--'}
                  </div>
                  <div className="text-[9px] text-white/20 uppercase truncate">{n.replace(/_/g, ' ')}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}