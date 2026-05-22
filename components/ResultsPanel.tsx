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

const REDES = [
  { red: 'Mercado Libre', dia: 'Todos los días', hora: '20:00 - 23:00', alcance: 'Máximo', color: '#ff8800' },
  { red: 'Instagram', dia: 'Mar y Jue', hora: '18:00 - 21:00', alcance: 'Alto', color: '#ff0088' },
  { red: 'Facebook Marketplace', dia: 'Mié y Sáb', hora: '10:00 - 13:00', alcance: 'Muy alto', color: '#0088ff' },
  { red: 'WhatsApp Business', dia: 'Lun a Vie', hora: '09:00 - 11:00', alcance: 'Directo', color: '#00ff88' },
];

const FOTO_EVAL = [
  { aspecto: 'Enfoque', score: 85 },
  { aspecto: 'Iluminación', score: 72 },
  { aspecto: 'Composición', score: 68 },
  { aspecto: 'Fondo', score: 55 },
];

type Tab = 'material' | 'imagen' | 'mercado' | 'financiero';

export default function ResultsPanel({ resultadoId, productoData, onVolver }: {
  resultadoId: string; productoData: any; onVolver: () => void;
}) {
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState<Tab>('material');

  useEffect(() => {
    const cargar = async () => {
      if (resultadoId === 'sin_resultado') { setCargando(false); return; }
      const { data } = await supabase.from('resultados').select('*').eq('id', resultadoId).single();
      if (data) setResultado(data as Resultado);
      setCargando(false);
    };
    cargar();
  }, [resultadoId]);

  const costo = parseFloat(productoData?.costoProduccion || '0');
  const precio = parseFloat(productoData?.precioVenta || '0');
  const ganancia = precio - costo;
  const margen = precio > 0 ? ((ganancia / precio) * 100).toFixed(1) : '0';
  const confianza = resultado ? Math.round(resultado.confianza_general * 100) : 0;

  const TABS: { id: Tab; label: string; color: string }[] = [
    { id: 'material', label: '🔬 Material', color: '#00ff88' },
    { id: 'imagen', label: '📸 Imagen', color: '#00ccff' },
    { id: 'mercado', label: '📊 Mercado', color: '#a060ff' },
    { id: 'financiero', label: '💰 Finanzas', color: '#ff8800' },
  ];

  if (cargando) return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#a060ff' }} />
        <span className="font-mono text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Cargando resultados...</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Análisis completado
          </p>
          <h2 className="text-3xl font-black text-white">{productoData?.producto}</h2>
          {productoData?.objetivo && (
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Objetivo: {productoData.objetivo}
            </p>
          )}
        </div>
        <button onClick={onVolver}
          className="px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-widest transition-all"
          style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}>
          ← Nuevo análisis
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-7 flex-wrap">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-5 py-2.5 rounded-xl text-sm font-mono transition-all duration-200"
            style={{
              background: tab === t.id ? `${t.color}10` : 'rgba(255,255,255,0.02)',
              border: `1px solid ${tab === t.id ? t.color + '30' : 'rgba(255,255,255,0.06)'}`,
              color: tab === t.id ? t.color : 'rgba(255,255,255,0.3)',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB MATERIAL */}
      {tab === 'material' && (
        <div className="space-y-5">
          {resultado ? (
            <>
              <div className="rounded-2xl p-6" style={{ background: 'rgba(255,50,50,0.04)', border: '1px solid rgba(255,50,50,0.15)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span className="text-xs font-mono uppercase tracking-widest text-red-400">Problema detectado — datos reales</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>{resultado.problema_detectado}</p>
              </div>

              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-mono uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>Confianza neuronal</span>
                  <span className="font-mono font-bold text-lg" style={{ color: '#00ff88' }}>{confianza}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${confianza}%`, background: 'linear-gradient(90deg, #00ff88, #00ccff)' }} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="rounded-2xl p-6" style={{ background: 'rgba(255,200,0,0.03)', border: '1px solid rgba(255,200,0,0.12)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#ffc800' }} />
                    <span className="text-xs font-mono uppercase tracking-widest" style={{ color: '#ffc800' }}>Causas físicas</span>
                  </div>
                  <ul className="space-y-3">
                    {resultado.causas_fisicas?.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        <span style={{ color: '#ffc800' }} className="mt-0.5 flex-shrink-0">→</span>{c}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl p-6" style={{ background: 'rgba(0,255,136,0.03)', border: '1px solid rgba(0,255,136,0.12)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#00ff88' }} />
                    <span className="text-xs font-mono uppercase tracking-widest" style={{ color: '#00ff88' }}>Soluciones propuestas</span>
                  </div>
                  <ul className="space-y-3">
                    {resultado.soluciones_propuestas?.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        <span style={{ color: '#00ff88' }} className="mt-0.5 flex-shrink-0">✓</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-xl px-4 py-3 flex items-center gap-2"
                style={{ background: 'rgba(160,96,255,0.05)', border: '1px solid rgba(160,96,255,0.15)' }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#a060ff' }} />
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Análisis basado en vectores neuronales reales almacenados en Supabase. Los resultados reflejan las propiedades físicas del material.
                </p>
              </div>
            </>
          ) : (
            <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-4xl mb-4">⚠️</div>
              <p className="font-bold text-white mb-2">Datos insuficientes</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                El sistema neuronal aún no tiene suficientes propiedades cargadas para este producto. Ejecutá el backend con datos reales.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB IMAGEN */}
      {tab === 'imagen' && (
        <div className="space-y-5">
          <div className="rounded-xl px-4 py-3 flex items-center gap-2 mb-2"
            style={{ background: 'rgba(0,204,255,0.05)', border: '1px solid rgba(0,204,255,0.15)' }}>
            <span className="text-xs font-mono" style={{ color: '#00ccff' }}>ESTIMACIÓN IA — No conectado al motor neuronal</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {productoData?.imagen && (
              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>Imagen analizada</p>
                <img src={productoData.imagen} alt="producto" className="w-full rounded-xl object-contain max-h-44" />
              </div>
            )}
            <div className="rounded-2xl p-6 space-y-4" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-xs font-mono uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>Evaluación fotográfica</p>
              {FOTO_EVAL.map((a) => {
                const color = a.score > 75 ? '#00ff88' : a.score > 60 ? '#ff8800' : '#ff4444';
                return (
                  <div key={a.aspecto}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{a.aspecto}</span>
                      <span className="font-mono text-sm" style={{ color }}>{a.score}%</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="h-full rounded-full" style={{ width: `${a.score}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-2xl p-6" style={{ background: 'rgba(0,204,255,0.03)', border: '1px solid rgba(0,204,255,0.1)' }}>
            <p className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: '#00ccff' }}>Recomendaciones</p>
            {['Usá fondo blanco o neutro para destacar el producto','Fotografiá con luz natural cerca de una ventana','Tomá 3 fotos: frente, lateral y detalle de textura','Evitá sombras duras sobre el producto'].map((r, i) => (
              <p key={i} className="flex items-start gap-2 text-sm mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                <span style={{ color: '#00ccff' }}>→</span>{r}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* TAB MERCADO */}
      {tab === 'mercado' && (
        <div className="space-y-5">
          <div className="rounded-xl px-4 py-3 flex items-center gap-2"
            style={{ background: 'rgba(160,96,255,0.05)', border: '1px solid rgba(160,96,255,0.15)' }}>
            <span className="text-xs font-mono" style={{ color: '#a060ff' }}>ESTIMACIÓN — Basado en datos de mercado generales para productos físicos en Argentina</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REDES.map((r) => (
              <div key={r.red} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-white">{r.red}</span>
                  <span className="text-[9px] font-mono px-2 py-1 rounded uppercase"
                    style={{ color: r.color, background: `${r.color}10`, border: `1px solid ${r.color}20` }}>
                    {r.alcance}
                  </span>
                </div>
                <div className="space-y-1 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  <p>📅 {r.dia}</p>
                  <p>🕐 {r.hora}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl p-6" style={{ background: 'rgba(160,96,255,0.03)', border: '1px solid rgba(160,96,255,0.1)' }}>
            <p className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: '#a060ff' }}>Estrategia recomendada</p>
            {['Publicá en Mercado Libre primero — es donde más se buscan productos de construcción','Usá Instagram para mostrar el proceso de fabricación — genera confianza','Creá un catálogo de WhatsApp Business con fotos y precios','Publicá los jueves a las 20:00 para máximo alcance'].map((s, i) => (
              <p key={i} className="flex items-start gap-2 text-sm mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                <span style={{ color: '#a060ff' }}>→</span>{s}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* TAB FINANCIERO */}
      {tab === 'financiero' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Costo producción', valor: costo > 0 ? `$${costo.toLocaleString()}` : '—', color: '#ff4444' },
              { label: 'Precio de venta', valor: precio > 0 ? `$${precio.toLocaleString()}` : '—', color: '#00ccff' },
              { label: 'Ganancia neta', valor: ganancia > 0 ? `$${ganancia.toLocaleString()}` : '—', color: '#00ff88' },
              { label: 'Margen', valor: precio > 0 ? `${margen}%` : '—', color: '#ff8800' },
            ].map((m) => (
              <div key={m.label} className="rounded-2xl p-5 text-center" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="text-2xl font-black font-mono mb-1" style={{ color: m.color }}>{m.valor}</div>
                <div className="text-xs uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.25)' }}>{m.label}</div>
              </div>
            ))}
          </div>

          {precio > 0 && costo > 0 && (
            <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-xs font-mono uppercase tracking-widest mb-5" style={{ color: 'rgba(255,255,255,0.25)' }}>Proyección mensual</p>
              <div className="grid grid-cols-3 gap-4">
                {[10, 25, 50].map((u) => (
                  <div key={u} className="text-center rounded-xl p-4" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="text-xl font-black font-mono" style={{ color: '#00ff88' }}>${(ganancia * u).toLocaleString()}</div>
                    <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>{u} unidades/mes</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl p-6" style={{ background: 'rgba(255,136,0,0.03)', border: '1px solid rgba(255,136,0,0.1)' }}>
            <p className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: '#ff8800' }}>Recomendaciones financieras</p>
            {['Un margen saludable para productos físicos es entre 40% y 60%','Considerá incluir costos de envío en el precio final','Ofrecé descuento por volumen a partir de 5 unidades','Revisá costos de materia prima cada 30 días'].map((r, i) => (
              <p key={i} className="flex items-start gap-2 text-sm mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                <span style={{ color: '#ff8800' }}>→</span>{r}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
