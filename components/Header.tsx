'use client';
import { useState, useEffect } from 'react';

export default function Header() {
  const [hora, setHora] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setHora(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => { clearInterval(t); window.removeEventListener('scroll', onScroll); };
  }, []);

  return (
    <header className="relative z-20 flex items-center justify-between px-6 py-4 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(5,5,15,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.04)' : '1px solid transparent',
      }}>
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="relative w-9 h-9">
          <div className="absolute inset-0 rounded-xl blur-md" style={{ background: 'rgba(120,80,255,0.4)' }} />
          <div className="relative w-9 h-9 rounded-xl border flex items-center justify-center"
            style={{ background: 'rgba(120,80,255,0.15)', borderColor: 'rgba(120,80,255,0.3)' }}>
            <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: '#a060ff' }} />
          </div>
        </div>
        <div>
          <div className="text-white font-black text-sm tracking-wider">
            IMPULSO<span style={{ color: '#a060ff' }}>IA</span>
          </div>
          <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgba(160,96,255,0.5)' }}>
            Motor Neuronal v1.0
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="hidden md:flex items-center gap-6">
        <div className="flex items-center gap-4 px-4 py-2 rounded-full"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00ff88' }} />
            <span className="text-xs font-mono" style={{ color: '#00ff88' }}>Neuronas activas</span>
          </div>
          <div className="w-px h-3" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>{hora}</span>
        </div>
      </div>
    </header>
  );
}
