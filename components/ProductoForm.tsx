'use client';
import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

const PRODUCTOS = [
  { id: 'placa_yeso', nombre: 'Placa de yeso antihumedad', desc: 'Panel de construcción resistente a la humedad' },
  { id: 'mdf', nombre: 'MDF alternativo', desc: 'Madera sintética de densidad media optimizada' },
  { id: 'souvenir', nombre: 'Souvenir de yeso', desc: 'Producto decorativo de bajo peso' },
];

const OBJETIVOS = [
  'Mejorar resistencia a la humedad',
  'Reducir peso del producto',
  'Aumentar resistencia mecánica',
  'Mejorar acabado superficial',
  'Reducir costo de producción',
  'Mejorar aislación térmica',
];

export default function ProductoForm({ onFinalizado }: {
  onFinalizado: (data: any, id: string) => void;
}) {
  const [paso, setPaso] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [imagen, setImagen] = useState<string | null>(null);
  const [form, setForm] = useState({ producto: '', objetivo: '', costoProduccion: '', precioVenta: '', descripcion: '' });
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImagen(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAnalizar = async () => {
    if (!form.producto) return;
    setCargando(true);
    const { data } = await supabase
      .from('resultados')
      .select('id')
      .eq('producto', form.producto)
      .order('fecha', { ascending: false })
      .limit(1)
      .single();
    setCargando(false);
    onFinalizado({ ...form, imagen }, data?.id ?? 'sin_resultado');
  };

  const PASOS = ['Producto', 'Datos', 'Confirmar'];

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">

      {/* Progress */}
      <div className="flex items-center gap-2 mb-10">
        {PASOS.map((label, i) => {
          const p = i + 1;
          const done = paso > p;
          const current = paso === p;
          return (
            <div key={label} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all duration-300"
                  style={{
                    background: done ? '#a060ff' : current ? 'rgba(160,96,255,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${done || current ? '#a060ff' : 'rgba(255,255,255,0.08)'}`,
                    color: done ? '#fff' : current ? '#a060ff' : 'rgba(255,255,255,0.2)',
                  }}>
                  {done ? '✓' : p}
                </div>
                <span className="text-xs font-mono hidden sm:block transition-all duration-300"
                  style={{ color: current ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)' }}>
                  {label}
                </span>
              </div>
              {i < PASOS.length - 1 && (
                <div className="w-8 h-px mx-1 transition-all duration-500"
                  style={{ background: done ? '#a060ff' : 'rgba(255,255,255,0.08)' }} />
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>

        {/* PASO 1 */}
        {paso === 1 && (
          <div>
            <h2 className="text-2xl font-black text-white mb-1">¿Qué producto analizamos?</h2>
            <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.3)' }}>Seleccioná el producto y tu objetivo principal</p>

            <p className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>Producto</p>
            <div className="space-y-2 mb-7">
              {PRODUCTOS.map((p) => (
                <button key={p.id} onClick={() => setForm(f => ({ ...f, producto: p.nombre }))}
                  className="w-full text-left px-5 py-4 rounded-xl transition-all duration-200"
                  style={{
                    background: form.producto === p.nombre ? 'rgba(160,96,255,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${form.producto === p.nombre ? 'rgba(160,96,255,0.4)' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                  <div className="font-bold text-sm" style={{ color: form.producto === p.nombre ? '#a060ff' : 'rgba(255,255,255,0.7)' }}>
                    {p.nombre}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{p.desc}</div>
                </button>
              ))}
            </div>

            <p className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>Objetivo</p>
            <div className="grid grid-cols-2 gap-2 mb-8">
              {OBJETIVOS.map((o) => (
                <button key={o} onClick={() => setForm(f => ({ ...f, objetivo: o }))}
                  className="text-left px-3 py-2.5 rounded-lg text-xs transition-all duration-200"
                  style={{
                    background: form.objetivo === o ? 'rgba(0,204,255,0.06)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${form.objetivo === o ? 'rgba(0,204,255,0.3)' : 'rgba(255,255,255,0.05)'}`,
                    color: form.objetivo === o ? '#00ccff' : 'rgba(255,255,255,0.35)',
                  }}>
                  {o}
                </button>
              ))}
            </div>

            <button onClick={() => setPaso(2)} disabled={!form.producto}
              className="w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all duration-300"
              style={{
                background: form.producto ? 'linear-gradient(135deg, #a060ff, #6030cc)' : 'rgba(255,255,255,0.04)',
                color: form.producto ? '#fff' : 'rgba(255,255,255,0.2)',
                cursor: form.producto ? 'pointer' : 'not-allowed',
              }}>
              Continuar →
            </button>
          </div>
        )}

        {/* PASO 2 */}
        {paso === 2 && (
          <div>
            <h2 className="text-2xl font-black text-white mb-1">Imagen y datos financieros</h2>
            <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.3)' }}>Opcional pero mejora el análisis</p>

            {/* Upload */}
            <p className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>Foto del producto</p>
            <div onClick={() => fileRef.current?.click()}
              className="rounded-xl p-8 text-center cursor-pointer transition-all duration-300 mb-6"
              style={{
                border: `1px dashed ${imagen ? 'rgba(160,96,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                background: imagen ? 'rgba(160,96,255,0.04)' : 'rgba(255,255,255,0.01)',
              }}>
              {imagen ? (
                <img src={imagen} alt="producto" className="max-h-40 mx-auto rounded-xl object-contain" />
              ) : (
                <div>
                  <div className="text-3xl mb-2">📸</div>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Clic para subir imagen</p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.15)' }}>JPG, PNG, WebP</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagen} />

            {/* Financiero */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { key: 'costoProduccion', label: 'Costo de producción ($)', placeholder: 'Ej: 1500' },
                { key: 'precioVenta', label: 'Precio de venta ($)', placeholder: 'Ej: 3500' },
              ].map((f) => (
                <div key={f.key}>
                  <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>{f.label}</p>
                  <input type="number" placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', colorScheme: 'dark' }} />
                </div>
              ))}
            </div>

            <textarea placeholder="Describí brevemente tu producto (opcional)..."
              value={form.descripcion}
              onChange={(e) => setForm(f => ({ ...f, descripcion: e.target.value }))}
              rows={3} className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none resize-none mb-6 transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }} />

            <div className="flex gap-3">
              <button onClick={() => setPaso(1)}
                className="px-5 py-3 rounded-xl text-sm font-mono transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}>
                ← Volver
              </button>
              <button onClick={() => setPaso(3)}
                className="flex-1 py-3 rounded-xl font-bold text-sm uppercase tracking-widest"
                style={{ background: 'linear-gradient(135deg, #a060ff, #6030cc)', color: '#fff' }}>
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* PASO 3 */}
        {paso === 3 && (
          <div>
            <h2 className="text-2xl font-black text-white mb-1">Confirmá el análisis</h2>
            <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.3)' }}>El motor neuronal procesará tu producto</p>

            <div className="rounded-xl p-5 mb-6 space-y-3"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              {[
                { label: 'Producto', valor: form.producto },
                { label: 'Objetivo', valor: form.objetivo || 'No especificado' },
                { label: 'Costo', valor: form.costoProduccion ? `$${form.costoProduccion}` : '—' },
                { label: 'Precio', valor: form.precioVenta ? `$${form.precioVenta}` : '—' },
                { label: 'Imagen', valor: imagen ? '✓ Cargada' : 'Sin imagen' },
              ].map((r) => (
                <div key={r.label} className="flex justify-between items-center py-1.5"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="text-xs font-mono uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>{r.label}</span>
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{r.valor}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-7">
              {[
                { label: '🔬 Análisis material', real: true },
                { label: '📸 Análisis de imagen', real: false },
                { label: '📊 Análisis de mercado', real: false },
                { label: '💰 Cálculo financiero', real: true },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{m.label}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                    style={{
                      background: m.real ? 'rgba(0,255,136,0.1)' : 'rgba(160,96,255,0.1)',
                      color: m.real ? '#00ff88' : '#a060ff',
                      border: `1px solid ${m.real ? 'rgba(0,255,136,0.2)' : 'rgba(160,96,255,0.2)'}`,
                    }}>
                    {m.real ? 'REAL' : 'ESTIMADO'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setPaso(2)}
                className="px-5 py-3 rounded-xl text-sm font-mono transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}>
                ← Volver
              </button>
              <button onClick={handleAnalizar} disabled={cargando}
                className="flex-1 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all duration-300 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #a060ff, #6030cc)', color: '#fff' }}>
                {cargando ? 'Procesando...' : 'Iniciar análisis →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


