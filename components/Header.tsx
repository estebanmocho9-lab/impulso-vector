'use client';
import { useState, useEffect } from 'react';

export default function Header() {
  const [hora, setHora] = useState('');

  useEffect(() => {
    const actualizar = () => {
      const now = new Date();
      setHora(now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    actualizar();
    const t = setInterval(actualizar, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#020208]/80 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-[#00ff88] animate-pulse" />
        </div>
        <div>
          <div className="text-white font-black text-sm tracking-wider">IMPULSO<span className="text-[#00ff88]">IA</span></div>
          <div className="text-white/20 text-[10px] font-mono uppercase tracking-widest">Motor de Análisis v1.0</div>
        </div>
      </div>
      <div className="hidden md:flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
          <span className="text-[#00ff88] text-xs font-mono">Sistema activo</span>
        </div>
        <span className="text-white/20 text-xs font-mono">{hora}</span>
      </div>
    </header>
  );
}
