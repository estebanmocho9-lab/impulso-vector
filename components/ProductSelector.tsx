'use client';
import { useState } from 'react';

const PRODUCTOS = [
  {
    id: 'placa_yeso',
    nombre: 'Placa de yeso antihumedad',
    descripcion: 'Panel de construcción con resistencia a la humedad',
    propiedades: ['Porosidad', 'Absorción', 'Cohesión', 'Densidad'],
    icono: '⬡',
    color: '#00ff88',
  },
  {
    id: 'mdf',
    nombre: 'MDF alternativo',
    descripcion: 'Madera sintética de densidad media optimizada',
    propiedades: ['Elasticidad', 'Flexión', 'Dureza', 'Peso'],
    icono: '⬡',
    color: '#0088ff',
  },
  {
    id: 'souvenir',
    nombre: 'Souvenir de yeso',
    descripcion: 'Producto decorativo de bajo peso y alta definición',
    propiedades: ['Friabilidad', 'Compacidad', 'Dureza', 'pH'],
    icono: '⬡',
    color: '#ff8800',
  },
];

export default function ProductSelector({ onSeleccionar }: { onSeleccionar: (p: string) => void }) {
  const [hover, setHover] = useState<string | null>(null);

  return (
    <div className="relative z-10 min-h-[92vh] flex flex-col items-center justify-center px-6 py-12">
      <div className="mb-12 text-center">
        <p className="text-white/30 text-xs font-mono uppercase tracking-widest mb-3">— Paso 01 —</p>
        <h2 className="text-4xl font-black text-white tracking-tight">Seleccioná el producto</h2>
        <p className="text-white/30 mt-3 text-sm">El motor neuronal analizará sus propiedades físicas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {PRODUCTOS.map((p) => (
          <button
            key={p.id}
            onClick={() => onSeleccionar(p.nombre)}
            onMouseEnter={() => setHover(p.id)}
            onMouseLeave={() => setHover(null)}
            className="relative group text-left rounded-2xl p-8 border transition-all duration-500"
            style={{
              background: hover === p.id ? `rgba(${p.color === '#00ff88' ? '0,255,136' : p.color === '#0088ff' ? '0,136,255' : '255,136,0'},0.05)` : 'rgba(255,255,255,0.02)',
              borderColor: hover === p.id ? p.color : 'rgba(255,255,255,0.06)',
              transform: hover === p.id ? 'translateY(-4px)' : 'none',
            }}
          >
            {/* Indicador top */}
            <div className="w-full h-px mb-8 rounded-full" style={{ background: hover === p.id ? p.color : 'rgba(255,255,255,0.06)' }} />

            <div className="text-3xl mb-4 font-mono" style={{ color: p.color }}>{p.icono}</div>
            <h3 className="text-white font-bold text-lg mb-2 leading-tight">{p.nombre}</h3>
            <p className="text-white/30 text-sm mb-6 leading-relaxed">{p.descripcion}</p>

            {/* Tags de propiedades */}
            <div className="flex flex-wrap gap-2">
              {p.propiedades.map((prop) => (
                <span key={prop} className="px-2 py-1 rounded text-xs font-mono uppercase tracking-wide border"
                  style={{ color: p.color, borderColor: `${p.color}30`, background: `${p.color}08` }}>
                  {prop}
                </span>
              ))}
            </div>

            {/* Flecha */}
            <div className="mt-6 flex items-center gap-2 text-xs font-mono uppercase tracking-widest transition-all duration-300"
              style={{ color: hover === p.id ? p.color : 'rgba(255,255,255,0.2)' }}>
              <span>Analizar</span>
              <span>→</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}