'use client';
import { useState, useEffect, useRef } from 'react';
import ProductSelector from '../components/ProductSelector';
import AnalysisPanel from '../components/AnalysisPanel';
import ResultsPanel from '../components/ResultsPanel';

export type Pantalla = 'home' | 'selector' | 'analisis' | 'resultados';

export default function Home() {
  const [pantalla, setPantalla] = useState<Pantalla>('home');
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [resultadoId, setResultadoId] = useState('');

  return (
    <main className="min-h-screen bg-[#020208] overflow-hidden">
      <GridBackground />
      <Nav />
      {pantalla === 'home' && <PantallaHome onIniciar={() => setPantalla('selector')} />}
      {pantalla === 'selector' && (
        <ProductSelector onSeleccionar={(p) => { setProductoSeleccionado(p); setPantalla('analisis'); }} />
      )}
      {pantalla === 'analisis' && (
        <AnalysisPanel producto={productoSeleccionado} onFinalizado={(id) => { setResultadoId(id); setPantalla('resultados'); }} />
      )}
      {pantalla === 'resultados' && (
        <ResultsPanel resultadoId={resultadoId} onVolver={() => setPantalla('selector')} />
      )}
    </main>
  );
}

function GridBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px]" style={{ background: 'rgba(0,255,136,0.04)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px]" style={{ background: 'rgba(0,100,255,0.04)' }} />
    </div>
  );
}

function Nav() {
  return (
    <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/5">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
        <span className="font-mono text-white font-bold tracking-wider text-sm">IMPULSO<span className="text-[#00ff88]">VECTOR</span></span>
      </div>
      <div className="flex items-center gap-6 text-xs text-white/30 font-mono uppercase tracking-widest">
        <span>Sistema Neuronal v1.0</span>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
          <span className="text-[#00ff88]">Online</span>
        </div>
      </div>
    </nav>
  );
}

function PantallaHome({ onIniciar }: { onIniciar: () => void }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 80);
    return () => clearInterval(t);
  }, []);

  const nodes = [
    { x: 50, y: 30, label: 'POROSIDAD' },
    { x: 20, y: 55, label: 'ABSORCIÓN' },
    { x: 80, y: 55, label: 'COHESIÓN' },
    { x: 35, y: 75, label: 'DENSIDAD' },
    { x: 65, y: 75, label: 'ELASTICIDAD' },
    { x: 50, y: 55, label: 'NÚCLEO' },
  ];

  const edges = [
    [0,5],[1,5],[2,5],[3,5],[4,5],[0,1],[0,2],[1,3],[2,4],[3,4]
  ];

  return (
    <div className="relative z-10 min-h-[92vh] flex items-center justify-center px-6">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* Texto */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00ff88]/20 bg-[#00ff88]/5 mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
            <span className="text-[#00ff88] text-xs font-mono uppercase tracking-widest">Motor de Inferencia Relacional</span>
          </div>

          <h1 className="text-6xl lg:text-7xl font-black text-white leading-[0.95] mb-6 tracking-tight">
            IMPULSO<br />
            <span className="text-[#00ff88]">VECTOR</span>
          </h1>

          <p className="text-white/40 text-lg leading-relaxed mb-10 max-w-md font-light">
            Sistema neuronal físico para análisis, inferencia y optimización de materiales compuestos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <button
              onClick={onIniciar}
              className="group relative px-8 py-4 bg-[#00ff88] text-black font-bold text-sm uppercase tracking-widest rounded-lg overflow-hidden transition-all duration-300 hover:scale-105"
            >
              <span className="relative z-10">Iniciar Análisis</span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { val: '20', label: 'Neuronas activas' },
              { val: '34', label: 'Propiedades' },
              { val: '6', label: 'Capas de análisis' },
            ].map((s) => (
              <div key={s.label} className="border border-white/5 rounded-xl p-4 bg-white/2">
                <div className="text-2xl font-black text-[#00ff88] font-mono">{s.val}</div>
                <div className="text-white/30 text-xs mt-1 uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Red neuronal SVG */}
        <div className="relative hidden lg:block">
          <div className="absolute inset-0 rounded-2xl" style={{ background: 'radial-gradient(circle at center, rgba(0,255,136,0.05) 0%, transparent 70%)' }} />
          <svg viewBox="0 0 100 100" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 20px rgba(0,255,136,0.1))' }}>
            {edges.map(([a, b], i) => {
              const na = nodes[a], nb = nodes[b];
              const active = Math.sin(tick * 0.08 + i) > 0.3;
              return (
                <line key={i} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                  stroke={active ? '#00ff88' : 'rgba(255,255,255,0.05)'}
                  strokeWidth={active ? '0.4' : '0.2'}
                  style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
                />
              );
            })}
            {nodes.map((n, i) => {
              const pulse = Math.sin(tick * 0.1 + i * 0.8) > 0;
              return (
                <g key={i}>
                  <circle cx={n.x} cy={n.y} r={i === 5 ? 4 : 2.5}
                    fill={i === 5 ? '#00ff88' : (pulse ? 'rgba(0,255,136,0.8)' : 'rgba(0,255,136,0.3)')}
                    style={{ transition: 'fill 0.3s' }}
                  />
                  <text x={n.x} y={n.y - 4} textAnchor="middle" fontSize="2.5"
                    fill="rgba(255,255,255,0.4)" fontFamily="monospace">
                    {n.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}