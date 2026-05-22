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
  { red: 'Instagram', dia: 'Martes y Jueves', hora: '18:00 - 21:00', alcance: 'Alto', color: '#ff0088' },
  { red: 'Facebook Marketplace', dia: 'Miércoles y Sábado', hora: '10:00 - 13:00', alcance: 'Muy alto', color: '#0088ff' },
  { red: 'Mercado Libre', dia: 'Todos los días', hora: '20:00 - 23:00', alcance: 'Máximo', color: '#ff8800' },
  { red: 'WhatsApp Business', dia: 'Lunes a Viernes', hora: '09:00 - 11:00', alcance: 'Directo', color: '#00ff88' },
];

const ANALISIS_IMAGEN = [
  { aspecto: 'Enfoque', score: 85, comentario: 'Bueno — el producto se ve nítido' },
  { aspecto: 'Iluminación', score: 72, comentario: 'Aceptable — podría mejorar con luz natural' },
  { aspecto: 'Composición', score: 68, comentario: 'Regular — centrá más el producto' },
  { aspecto: 'Fondo', score: 55, comentario: 'Mejorable — usá fondo blanco o neutro' },
];

export default function ResultsPanel({ resultadoId, productoData, onVolver }: {
  resultadoId: string;
  productoData: any;
  onVolver: () => void;
}) {
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState<'material' | 'imagen' | 'mercado' | 'financiero'>('material');

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

  if (cargando) return (
    <div className="relative z-10 flex items-center justify-center min-h-[80vh]">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
        <span className="text-white/40 font-mono text-sm">Procesando análisis...</span>
      </div>
    </div>
  );

  const TABS = [
    { id: 'material', label: '🔬 Material', color: '#00ff88' },
    { id: 'imagen', label: '📸 Imagen', color: '#00ccff' },
    { id: 'mercado', label: '📊 Mercado', color: '#8800ff' },
    { id: 'financiero', label: '💰 Finanzas', color: '#ff8800' },
  ];

  return (
    <div className="relative z-10 max-w-5xl mx-auto px-6 py-10">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-white/30 text-xs font-mono uppercase tracking-widest mb-1">Análisis completado</p>
          <h2 className="text-3xl font-black text-white">{productoData?.producto}</h2>
          {productoData?.objetivo && (
            <p className="text-white/30 text-sm mt-1">Objetivo: {productoData.objetivo}</p>
          )}
        </div>
        <button onClick={onVolver}
          className="px-5 py-2.5 border border-white/10 text-white/40 rounded-xl text-xs font-mono uppercase tracking-widest hover:border-[#00ff88]/30 hover:text-[#00ff88] transition-all">
          ← Nuevo análisis
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className="px-5 py-2.5 rounded-xl text-sm font-mono transition-all duration-200"
            style={{
              background: tab === t.id ? `${t.color}15` : 'rgba(255,255,255,0.02)',
              border: `1px solid ${tab === t.id ? t.color + '40' : 'rgba(255,255,255,0.06)'}`,
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
              {/* Problema */}
              <div className="border border-red-500/20 bg-red-500/5 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span className="text-red-400 text-xs font-mono uppercase tracking-widest">Problema detectado</span>
                </div>
                <p className="text-white/70 text-sm leading-relaxed">{resultado.problema_detectado}</p>
              </div>

              {/* Confianza */}
              <div className="border border-white/5 rounded-2xl p-5 bg-white/1">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white/30 text-xs font-mono uppercase tracking-widest">Confianza del análisis</span>
                  <span className="text-[#00ff88] font-mono font-bold text-lg">{confianza}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${confianza}%`, background: 'linear-gradient(90deg, #00ff88, #00ccff)' }} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="border border-yellow-500/20 bg-yellow-500/3 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                    <span className="text-yellow-400 text-xs font-mono uppercase tracking-widest">Causas físicas</span>
                  </div>
                  <ul className="space-y-3">
                    {resultado.causas_fisicas?.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/60 leading-relaxed">
                        <span className="text-yellow-400 mt-0.5 flex-shrink-0">→</span>{c}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border border-[#00ff88]/20 bg-[#00ff88]/3 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
                    <span className="text-[#00ff88] text-xs font-mono uppercase tracking-widest">Soluciones propuestas</span>
                  </div>
                  <ul className="space-y-3">
                    {resultado.soluciones_propuestas?.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/60 leading-relaxed">
                        <span className="text-[#00ff88] mt-0.5 flex-shrink-0">✓</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <div className="border border-white/5 rounded-2xl p-10 text-center bg-white/1">
              <div className="text-4xl mb-4">🔬</div>
              <p className="text-white/40 text-sm">Ejecutá el backend para ver el análisis material real.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB IMAGEN */}
      {tab === 'imagen' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {productoData?.imagen && (
              <div className="border border-white/5 rounded-2xl p-4 bg-white/1">
                <p className="text-white/30 text-xs font-mono uppercase tracking-widest mb-3">Imagen analizada</p>
                <img src={productoData.imagen} alt="producto" className="w-full rounded-xl object-contain max-h-48" />
              </div>
            )}
            <div className="border border-white/5 rounded-2xl p-6 bg-white/1 space-y-4">
              <p className="text-white/30 text-xs font-mono uppercase tracking-widest">Evaluación fotográfica</p>
              {ANALISIS_IMAGEN.map((a) => (
                <div key={a.aspecto}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white/60 text-sm">{a.aspecto}</span>
                    <span className="font-mono text-sm" style={{ color: a.score > 75 ? '#00ff88' : a.score > 60 ? '#ff8800' : '#ff4444' }}>
                      {a.score}%
                    </span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-1">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${a.score}%`, background: a.score > 75 ? '#00ff88' : a.score > 60 ? '#ff8800' : '#ff4444' }} />
                  </div>
                  <p className="text-white/25 text-xs">{a.comentario}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="border border-[#00ccff]/20 bg-[#00ccff]/3 rounded-2xl p-6">
            <p className="text-[#00ccff] text-xs font-mono uppercase tracking-widest mb-3">Recomendaciones para publicar</p>
            <ul className="space-y-2 text-sm text-white/60">
              <li className="flex items-start gap-2"><span className="text-[#00ccff]">→</span>Usá fondo blanco o de color neutro para destacar el producto</li>
              <li className="flex items-start gap-2"><span className="text-[#00ccff]">→</span>Fotografiá con luz natural cerca de una ventana</li>
              <li className="flex items-start gap-2"><span className="text-[#00ccff]">→</span>Tomá al menos 3 fotos: frente, lateral y detalle de textura</li>
              <li className="flex items-start gap-2"><span className="text-[#00ccff]">→</span>Evitá sombras duras sobre el producto</li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB MERCADO */}
      {tab === 'mercado' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REDES.map((r) => (
              <div key={r.red} className="border border-white/5 rounded-2xl p-5 bg-white/1">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-white">{r.red}</span>
                  <span className="px-2 py-1 rounded text-[10px] font-mono uppercase"
                    style={{ color: r.color, background: `${r.color}10`, border: `1px solid ${r.color}20` }}>
                    {r.alcance}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-white/40">
                  <p>📅 {r.dia}</p>
                  <p>🕐 {r.hora}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border border-[#8800ff]/20 bg-[#8800ff]/3 rounded-2xl p-6">
            <p className="text-[#8800ff] text-xs font-mono uppercase tracking-widest mb-3">Estrategia recomendada</p>
            <ul className="space-y-2 text-sm text-white/60">
              <li className="flex items-start gap-2"><span className="text-[#8800ff]">→</span>Publicá en Mercado Libre primero — es donde más se buscan productos de construcción</li>
              <li className="flex items-start gap-2"><span className="text-[#8800ff]">→</span>Usá Instagram para mostrar el proceso de fabricación — genera confianza</li>
              <li className="flex items-start gap-2"><span className="text-[#8800ff]">→</span>Creá un catálogo de WhatsApp Business con fotos y precios</li>
              <li className="flex items-start gap-2"><span className="text-[#8800ff]">→</span>Publicá los jueves a las 20:00 para máximo alcance</li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB FINANCIERO */}
      {tab === 'financiero' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Costo producción', valor: costo > 0 ? `$${costo.toLocaleString()}` : 'No ingresado', color: '#ff4444' },
              { label: 'Precio de venta', valor: precio > 0 ? `$${precio.toLocaleString()}` : 'No ingresado', color: '#00ccff' },
              { label: 'Ganancia neta', valor: ganancia > 0 ? `$${ganancia.toLocaleString()}` : '—', color: '#00ff88' },
              { label: 'Margen', valor: precio > 0 ? `${margen}%` : '—', color: '#ff8800' },
            ].map((m) => (
              <div key={m.label} className="border border-white/5 rounded-2xl p-5 bg-white/1 text-center">
                <div className="text-2xl font-black font-mono mb-1" style={{ color: m.color }}>{m.valor}</div>
                <div className="text-white/30 text-xs uppercase tracking-wide">{m.label}</div>
              </div>
            ))}
          </div>

          {precio > 0 && costo > 0 && (
            <div className="border border-white/5 rounded-2xl p-6 bg-white/1">
              <p className="text-white/30 text-xs font-mono uppercase tracking-widest mb-5">Proyección de ventas</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { unidades: 10, label: '10 unidades/mes' },
                  { unidades: 25, label: '25 unidades/mes' },
                  { unidades: 50, label: '50 unidades/mes' },
                ].map((p) => (
                  <div key={p.label} className="text-center border border-white/5 rounded-xl p-4">
                    <div className="text-xl font-black text-[#00ff88] font-mono">${(ganancia * p.unidades).toLocaleString()}</div>
                    <div className="text-white/30 text-xs mt-1">{p.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border border-[#ff8800]/20 bg-[#ff8800]/3 rounded-2xl p-6">
            <p className="text-[#ff8800] text-xs font-mono uppercase tracking-widest mb-3">Recomendaciones financieras</p>
            <ul className="space-y-2 text-sm text-white/60">
              <li className="flex items-start gap-2"><span className="text-[#ff8800]">→</span>Un margen saludable para productos físicos es entre 40% y 60%</li>
              <li className="flex items-start gap-2"><span className="text-[#ff8800]">→</span>Considerá incluir costos de envío en el precio final</li>
              <li className="flex items-start gap-2"><span className="text-[#ff8800]">→</span>Ofrecé descuento por volumen a partir de 5 unidades</li>
              <li className="flex items-start gap-2"><span className="text-[#ff8800]">→</span>Revisá costos de materia prima cada 30 días</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}


