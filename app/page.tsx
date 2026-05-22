'use client';
import { useState } from 'react';
import Header from '../components/Header';
import Dashboard from '../components/Dashboard';
import ProductoForm from '../components/ProductoForm';
import ResultsPanel from '../components/ResultsPanel';

export type Pantalla = 'dashboard' | 'analisis' | 'resultados';

export default function Home() {
  const [pantalla, setPantalla] = useState<Pantalla>('dashboard');
  const [productoData, setProductoData] = useState<any>(null);
  const [resultadoId, setResultadoId] = useState('');

  return (
    <main className="min-h-screen bg-[#020208]">
      <GridBg />
      <Header />
      {pantalla === 'dashboard' && (
        <Dashboard onIniciar={() => setPantalla('analisis')} />
      )}
      {pantalla === 'analisis' && (
        <ProductoForm
          onFinalizado={(data, id) => {
            setProductoData(data);
            setResultadoId(id);
            setPantalla('resultados');
          }}
        />
      )}
      {pantalla === 'resultados' && (
        <ResultsPanel
          resultadoId={resultadoId}
          productoData={productoData}
          onVolver={() => setPantalla('dashboard')}
        />
      )}
    </main>
  );
}

function GridBg() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(rgba(0,255,136,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.025) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />
      <div className="absolute top-0 left-1/2 w-[600px] h-[300px] -translate-x-1/2 blur-[100px]"
        style={{ background: 'radial-gradient(ellipse, rgba(0,255,136,0.06) 0%, transparent 70%)' }} />
    </div>
  );
}