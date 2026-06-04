'use client';
import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================
// components/ProductoForm.tsx
//
// CAMBIOS RESPECTO AL ORIGINAL:
//   - handleAnalizar() ya NO busca en "resultados" directamente
//   - Ahora INSERTA un trabajo en tabla "trabajos"
//   - Escucha en tiempo real (Supabase Realtime) el cambio de estado
//   - Cuando el backend marca el trabajo como "completado",
//     la app recibe el resultado_id y navega a ResultsPanel
//   - Si el backend marca "error", muestra el mensaje real
//
// NO SE MODIFICÓ: el diseño, los pasos, la lógica del formulario
// ============================================================

const PRODUCTOS = [
  { id: 'placa_yeso',  nombre: 'Placa de yeso antihumedad', materialId: 'MA.001' },
  { id: 'mdf',         nombre: 'MDF alternativo',           materialId: 'MA.002' },
  { id: 'souvenir',    nombre: 'Souvenir de yeso',           materialId: 'MA.001' },
];

// Mapeo: objetivo del usuario → nombre del problema en Supabase
const OBJETIVO_A_CONTEXTO: Record<string, string> = {
  'Mejorar resistencia a la humedad': 'absorcion',
  'Reducir peso del producto':        'peso',
  'Aumentar resistencia mecánica':    'resistencia_estructural',
  'Mejorar acabado superficial':      'sustentabilidad',
  'Reducir costo de producción':      'sustentabilidad',
  'Mejorar aislación térmica':        'aislamiento_termico',
};

const OBJETIVOS = Object.keys(OBJETIVO_A_CONTEXTO);

export default function ProductoForm({ onFinalizado }: {
  onFinalizado: (data: any, id: string) => void;
}) {
  const [paso, setPaso] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [estadoAnalisis, setEstadoAnalisis] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [imagen, setImagen] = useState<string | null>(null);
  const [form, setForm] = useState({
    producto:       '',
    objetivo:       '',
    costoProduccion: '',
    precioVenta:    '',
    descripcion:    '',
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const suscripcionRef = useRef<any>(null);

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
    setErrorMsg('');
    setEstadoAnalisis('Iniciando análisis...');

    // Encontrar el materialId correspondiente al producto seleccionado
    const productoConfig = PRODUCTOS.find(p => p.nombre === form.producto);
    const materialId     = productoConfig?.materialId ?? 'MA.001';
    const contexto       = OBJETIVO_A_CONTEXTO[form.objetivo] ?? 'absorcion';

    // 1. Insertar trabajo en Supabase
    const { data: trabajo, error: errorTrabajo } = await supabase
      .from('trabajos')
      .insert({
        producto:    form.producto,
        material_id: materialId,
        contexto:    contexto,
        estado:      'pendiente',
      })
      .select('id')
      .single();

    if (errorTrabajo || !trabajo) {
      setErrorMsg('No se pudo crear el trabajo. Verificá la conexión con Supabase.');
      setCargando(false);
      return;
    }

    const trabajoId = trabajo.id;
    setEstadoAnalisis('Motor neuronal activado. Calculando índices físicos...');

    // 2. Llamar a la API route de Vercel que hace el análisis completo
    const apiRes = await fetch('/api/analizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trabajoId,
        materialId: form.materialId,
        contexto,
        producto: form.productoNombre,
      }),
    });

    const apiData = await apiRes.json();

    if (!apiRes.ok || !apiData.ok) {
      setCargando(false);
      setErrorMsg(apiData.error ?? 'Error en el análisis.');
      return;
    }

    setCargando(false);
    setEstadoAnalisis('¡Análisis completado!');
    onFinalizado({ ...form, imagen }, apiData.resultadoId);
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

      {/* PASO 1 */}
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

      {/* PASO 2 */}
      {paso === 2 && (
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Imagen y datos del producto</h2>
          <p className="text-white/30 text-sm mb-8">Subí una foto y completá los datos financieros</p>

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

          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              { key: 'costoProduccion', label: 'Costo de producción ($)', placeholder: 'Ej: 1500' },
              { key: 'precioVenta',     label: 'Precio de venta estimado ($)', placeholder: 'Ej: 3500' },
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

      {/* PASO 3 — Confirmar y analizar */}
      {paso === 3 && (
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Confirmá el análisis</h2>
          <p className="text-white/30 text-sm mb-8">El sistema va a activar las neuronas y analizar tu producto</p>

          <div className="border border-white/5 rounded-2xl p-6 bg-white/1 mb-6 space-y-4">
            <Fila label="Producto"         valor={form.producto} />
            <Fila label="Objetivo"         valor={form.objetivo || 'No especificado'} />
            <Fila label="Contexto de análisis" valor={OBJETIVO_A_CONTEXTO[form.objetivo] ?? 'absorcion'} />
            <Fila label="Costo producción" valor={form.costoProduccion ? `$${form.costoProduccion}` : 'No especificado'} />
            <Fila label="Precio de venta"  valor={form.precioVenta ? `$${form.precioVenta}` : 'No especificado'} />
            <Fila label="Imagen"           valor={imagen ? '✓ Cargada' : 'Sin imagen'} />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {['🧠 50 neuronas físicas', '🔬 Fórmulas científicas', '⚡ Cruces TRIZ', '📊 Motor de inferencia'].map((m) => (
              <div key={m} className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#00ff88]/15 bg-[#00ff88]/5">
                <span className="text-xs text-white/60">{m}</span>
              </div>
            ))}
          </div>

          {/* Estado del análisis mientras carga */}
          {cargando && (
            <div className="border border-[#00ff88]/20 bg-[#00ff88]/5 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse flex-shrink-0" />
                <p className="text-[#00ff88] text-sm font-mono">{estadoAnalisis}</p>
              </div>
            </div>
          )}

          {/* Error si algo falló */}
          {errorMsg && (
            <div className="border border-red-500/30 bg-red-500/5 rounded-xl p-4 mb-4">
              <p className="text-red-400 text-sm">{errorMsg}</p>
              <p className="text-white/30 text-xs mt-2">
                Asegurate de que el worker de ImpulsoIA esté corriendo:<br/>
                <span className="font-mono text-white/50">npx ts-node src/worker/workerTrabajos.ts</span>
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setPaso(2)} disabled={cargando}
              className="px-6 py-4 rounded-xl border border-white/10 text-white/40 text-sm font-mono hover:border-white/20 transition-all disabled:opacity-30">
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
