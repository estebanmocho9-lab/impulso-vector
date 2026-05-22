'use client';
import { useEffect, useState } from 'react';

const MODULOS = [
  { icono: '⬡', titulo: 'Análisis Material', desc: 'Detección de fallas físicas basada en vectores neuronales reales', tag: 'NEURONAL REAL', color: '#00ff88', glow: 'rgba(0,255,136,0.15)' },
  { icono: '⬡', titulo: 'Análisis de Imagen', desc: 'Evaluación fotográfica para publicaciones en redes y marketplace', tag: 'IA VISUAL', color: '#00ccff', glow: 'rgba(0,204,255,0.15)' },
  { icono: '⬡', titulo: 'Análisis de Mercado', desc: 'Canales óptimos, horarios y estrategia de venta personalizada', tag: 'ESTIMACIÓN', color: '#a060ff', glow: 'rgba(160,96,255,0.15)' },
  { icono: '⬡', titulo: 'Calculadora Financiera', desc: 'Costos, margen de ganancia y proyección de rentabilidad', tag: 'CALCULADO', color: '#ff8800', glow: 'rgba(255,136,0,0.15)' },
];

const PROPIEDADES = ['Porosidad','Absorción','Cohesión','Densidad','Elasticidad','Conductividad','Dureza','Flexión','Humedad','Capilaridad','Fragilidad','Peso'];

export default function Dashboard({ onIniciar }: { onIniciar: () => void }) {
  const [tick, setTick] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 100);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">

      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden mb-8 p-12"
        style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>

        {/* Glow fondo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] blur-[80px] pointer-events-none"
          style={{ background: 'rgba(120,60,255,0.12)' }} />

        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
              style={{ background: 'rgba(160,96,255,0.08)', border: '1px solid rgba(160,96,255,0.2)' }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#a060ff' }} />
              <span className="text-xs font-mono uppercase tracking-widest" style={{ color: '#a060ff' }}>
                Sistema neuronal físico activo
              </span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-black text-white leading-[0.95] mb-5 tracking-tight">
              Analizá tu<br />
              <span style={{ color: '#a060ff' }}>producto</span><br />
              con IA real
            </h1>

            <p className="mb-8 leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)', fontSize: '1rem' }}>
              Motor de inferencia relacional para emprendedores. Detecta fallas físicas, analiza mercado y optimiza tu producto.
            </p>

            <button onClick={onIniciar}
              className="group relative px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest overflow-hidden transition-all duration-300 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #a060ff, #6030cc)', color: '#fff' }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(135deg, #c080ff, #8040ee)' }} />
              <span className="relative">Iniciar análisis completo →</span>
            </button>
          </div>

          {/* Visualización neuronal */}
          <div className="relative h-64 hidden lg:block">
            <svg viewBox="0 0 300 200" className="w-full h-full">
              {/* Conexiones */}
              {[
                [150,100,60,50],[150,100,240,50],[150,100,30,150],[150,100,270,150],
                [150,100,100,170],[150,100,200,170],[60,50,30,150],[240,50,270,150],
              ].map(([x1,y1,x2,y2], i) => {
                const active = Math.sin(tick * 0.06 + i * 0.7) > 0.2;
                return (
                  <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={active ? 'rgba(160,96,255,0.6)' : 'rgba(255,255,255,0.04)'}
                    strokeWidth={active ? 1 : 0.5}
                    style={{ transition: 'stroke 0.4s, stroke-width 0.4s' }} />
                );
              })}
              {/* Nodos */}
              {[
                {x:150,y:100,r:8,label:'NÚCLEO'},
                {x:60,y:50,r:5,label:'POROSIDAD'},{x:240,y:50,r:5,label:'ABSORCIÓN'},
                {x:30,y:150,r:4,label:'COHESIÓN'},{x:270,y:150,r:4,label:'DENSIDAD'},
                {x:100,y:170,r:4,label:'ELASTICIDAD'},{x:200,y:170,r:4,label:'DUREZA'},
              ].map((n, i) => {
                const pulse = Math.sin(tick * 0.08 + i * 1.1) > 0;
                const isCore = i === 0;
                return (
                  <g key={i}>
                    <circle cx={n.x} cy={n.y} r={n.r * 2.5}
                      fill={isCore ? 'rgba(160,96,255,0.12)' : 'rgba(160,96,255,0.06)'} />
                    <circle cx={n.x} cy={n.y} r={n.r}
                      fill={isCore ? '#a060ff' : pulse ? 'rgba(160,96,255,0.9)' : 'rgba(160,96,255,0.3)'}
                      style={{ transition: 'fill 0.3s' }} />
                    <text x={n.x} y={n.y - n.r - 3} textAnchor="middle" fontSize="5"
                      fill="rgba(255,255,255,0.3)" fontFamily="monospace">{n.label}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Módulos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {MODULOS.map((m, i) => (
          <div key={m.titulo}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            className="relative rounded-2xl p-6 cursor-default transition-all duration-400 overflow-hidden"
            style={{
              background: hovered === i ? m.glow : 'rgba(255,255,255,0.015)',
              border: `1px solid ${hovered === i ? m.color + '30' : 'rgba(255,255,255,0.05)'}`,
              transform: hovered === i ? 'translateY(-2px)' : 'none',
            }}>
            <div className="absolute top-0 right-0 w-32 h-32 blur-[50px] pointer-events-none transition-opacity duration-400"
              style={{ background: m.color, opacity: hovered === i ? 0.06 : 0 }} />

            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center font-mono text-xl"
                style={{ background: `${m.color}10`, border: `1px solid ${m.color}20`, color: m.color }}>
                {m.icono}
              </div>
              <span className="px-2 py-1 rounded text-[9px] font-mono uppercase tracking-widest"
                style={{ color: m.color, background: `${m.color}08`, border: `1px solid ${m.color}20` }}>
                {m.tag}
              </span>
            </div>
            <h3 className="text-white font-bold mb-2">{m.titulo}</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.3)' }}>{m.desc}</p>
          </div>
        ))}
      </div>

      {/* Propiedades activas */}
      <div className="rounded-2xl p-6"
        style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center justify-between mb-5">
          <span className="text-xs font-mono uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Propiedades físicas monitoreadas
          </span>
          <span className="text-xs font-mono" style={{ color: '#a060ff' }}>34 activas</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PROPIEDADES.map((p, i) => {
            const active = Math.sin(tick * 0.05 + i * 0.9) > 0;
            return (
              <span key={p} className="px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wide transition-all duration-500"
                style={{
                  background: active ? 'rgba(160,96,255,0.1)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${active ? 'rgba(160,96,255,0.25)' : 'rgba(255,255,255,0.04)'}`,
                  color: active ? 'rgba(160,96,255,0.9)' : 'rgba(255,255,255,0.15)',
                }}>
                {p}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
