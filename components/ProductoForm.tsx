
'use client';
import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

const PRODUCTOS = [
  { id: 'placa_yeso', nombre: 'Placa de yeso antihumedad' },
  { id: 'mdf', nombre: 'MDF alternativo' },
  { id: 'souvenir', nombre: 'Souvenir de yeso' },
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
  const [form, setForm] = useState({
    producto: '',
    objetivo: '',
    costoProduccion: '',
    precioVenta: '',
    descripcion: '',
  });
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

    // Buscar resultado real en Supabase
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

  return (
    <div className="relative z-10 max-w-3xl mx-auto px-6 py-12">

      {/* Progreso */}
      <div className="flex items-center gap-3 mb-10">
        {[1, 2, 3].map((p) => (
          <div key={p} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border flex items-center justify-center text-xs font-mono font-bold transition-all duration-300"
              style={{
                borderColor: paso >= p ? '#00ff88' : 'rgba(255,255,255,0.1)',
                color: paso >= p ? '#00ff88' : 'rgba(255,255,255,0.2)',
                background: paso >= p ? 'rgba(0,255,136,0.1)' : 'transparent',
              }}>
              {paso > p ? '✓' : p}
            </div>
            {p < 3 && <div className="w-12 h-px" style={{ background: paso > p ? '#00ff88' : 'rgba(255,255,255,0.1)' }} />}
          </div>
        ))}
        <span className="text-white/30 text-xs font-mono ml-2">
          {paso === 1 ? 'Producto' : paso === 2 ? 'Imagen y datos' : 'Confirmar'}
        </span>
      </div>

      {/* PASO 1 — Selección de producto */}
      {paso === 1 && (
        <div>
          <h2 className="text-3xl font-black text-white mb-2">¿Qué producto querés analizar?</h2>
          <p className="text-white/30 text-sm mb-8">Seleccioná el tipo de producto y tu objetivo principal</p>

          <div className="space-y-3 mb-6">
            {PRODUCTOS.map((p) => (
              <button key={p.id} onClick={() => setForm(f => ({ ...f, producto: p.nombre }))}
                className="w-full text-left px-5 py-4 rounded-xl border transition-all duration-200"
                style={{
                  borderColor: form.producto === p.nombre ? '#00ff88' : 'rgba(255,255,255,0.06)',
                  background: form.producto === p.nombre ? 'rgba(0,255,136,0.05)' : 'rgba(255,255,255,0.01)',
                  color: form.producto === p.nombre ? '#00ff88' : 'rgba(255,255,255,0.6)',
                }}>
                {p.nombre}
              </button>
            ))}
          </div>

          <div className="mb-8">
            <p className="text-white/40 text-xs font-mono uppercase tracking-widest mb-3">Objetivo principal</p>
            <div className="grid grid-cols-2 gap-2">
              {OBJETIVOS.map((o) => (
                <button key={o} onClick={() => setForm(f => ({ ...f, objetivo: o }))}
                  className="text-left px-4 py-3 rounded-xl border text-sm transition-all duration-200"
                  style={{
                    borderColor: form.objetivo === o ? '#00ccff' : 'rgba(255,255,255,0.06)',
                    background: form.objetivo === o ? 'rgba(0,204,255,0.05)' : 'rgba(255,255,255,0.01)',
                    color: form.objetivo === o ? '#00ccff' : 'rgba(255,255,255,0.4)',
                  }}>
                  {o}
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => setPaso(2)} disabled={!form.producto}
            className="w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all duration-300"
            style={{
              background: form.producto ? '#00ff88' : 'rgba(255,255,255,0.05)',
              color: form.producto ? '#000' : 'rgba(255,255,255,0.2)',
            }}>
            Continuar →
          </button>
        </div>
      )}

      {/* PASO 2 — Imagen y datos financieros */}
      {paso === 2 && (
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Imagen y datos del producto</h2>
          <p className="text-white/30 text-sm mb-8">Subí una foto y completá los datos financieros</p>

          {/* Upload imagen */}
          <div className="mb-6">
            <p className="text-white/40 text-xs font-mono uppercase tracking-widest mb-3">Foto del producto</p>
            <div
              onClick={() => fileRef.current?.click()}
              className="border border-dashed border-white/10 rounded-2xl p-8 text-center cursor-pointer hover:border-[#00ff88]/30 transition-all duration-300"
              style={{ background: imagen ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
              {imagen ? (
                <img src={imagen} alt="producto" className="max-h-48 mx-auto rounded-xl object-contain" />
              ) : (
                <div>
                  <div className="text-4xl mb-3">📸</div>
                  <p className="text-white/30 text-sm">Clic para subir imagen</p>
                  <p className="text-white/15 text-xs mt-1">JPG, PNG, WebP</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagen} />
          </div>

          {/* Datos financieros */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              { key: 'costoProduccion', label: 'Costo de producción ($)', placeholder: 'Ej: 1500' },
              { key: 'precioVenta', label: 'Precio de venta estimado ($)', placeholder: 'Ej: 3500' },
            ].map((f) => (
              <div key={f.key}>
                <p className="text-white/40 text-xs font-mono uppercase tracking-widest mb-2">{f.label}</p>
                <input
                  type="number"
                  placeholder={f.placeholder}
                  value={form[f.key as keyof typeof form]}
                  onChange={(e) => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/2 text-white text-sm outline-none focus:border-[#00ff88]/40 transition-all"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            ))}
          </div>

          <div className="mb-8">
            <p className="text-white/40 text-xs font-mono uppercase tracking-widest mb-2">Descripción breve (opcional)</p>
            <textarea
              placeholder="Describí brevemente tu producto..."
              value={form.descripcion}
              onChange={(e) => setForm(f => ({ ...f, descripcion: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/2 text-white text-sm outline-none focus:border-[#00ff88]/40 transition-all resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setPaso(1)}
              className="px-6 py-4 rounded-xl border border-white/10 text-white/40 text-sm font-mono hover:border-white/20 transition-all">
              ← Volver
            </button>
            <button onClick={() => setPaso(3)}
              className="flex-1 py-4 rounded-xl bg-[#00ff88] text-black font-bold text-sm uppercase tracking-widest hover:scale-[1.02] transition-all">
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* PASO 3 — Confirmar */}
      {paso === 3 && (
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Confirmá el análisis</h2>
          <p className="text-white/30 text-sm mb-8">El sistema va a analizar tu producto en todos los módulos</p>

          <div className="border border-white/5 rounded-2xl p-6 bg-white/1 mb-6 space-y-4">
            <Fila label="Producto" valor={form.producto} />
            <Fila label="Objetivo" valor={form.objetivo || 'No especificado'} />
            <Fila label="Costo producción" valor={form.costoProduccion ? `$${form.costoProduccion}` : 'No especificado'} />
            <Fila label="Precio de venta" valor={form.precioVenta ? `$${form.precioVenta}` : 'No especificado'} />
            <Fila label="Imagen" valor={imagen ? '✓ Cargada' : 'Sin imagen'} />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {['🔬 Análisis material', '📸 Análisis de imagen', '📊 Análisis de mercado', '💰 Cálculo financiero'].map((m) => (
              <div key={m} className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#00ff88]/15 bg-[#00ff88]/5">
                <span className="text-xs text-white/60">{m}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setPaso(2)}
              className="px-6 py-4 rounded-xl border border-white/10 text-white/40 text-sm font-mono hover:border-white/20 transition-all">
              ← Volver
            </button>
            <button onClick={handleAnalizar} disabled={cargando}
              className="flex-1 py-4 rounded-xl bg-[#00ff88] text-black font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50">
              {cargando ? 'Analizando...' : 'Iniciar análisis completo →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Fila({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-white/30 text-xs font-mono uppercase tracking-widest">{label}</span>
      <span className="text-white/70 text-sm">{valor}</span>
    </div>
  );
}


