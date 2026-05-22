'use client';
import { useState, useEffect, useRef } from 'react';
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
    <main className="min-h-screen bg-[#05050f] overflow-x-hidden">
      <NeuralBackground />
      <Header />
      <div className="relative z-10">
        {pantalla === 'dashboard' && <Dashboard onIniciar={() => setPantalla('analisis')} />}
        {pantalla === 'analisis' && (
          <ProductoForm onFinalizado={(data, id) => { setProductoData(data); setResultadoId(id); setPantalla('resultados'); }} />
        )}
        {pantalla === 'resultados' && (
          <ResultsPanel resultadoId={resultadoId} productoData={productoData} onVolver={() => setPantalla('dashboard')} />
        )}
      </div>
    </main>
  );
}

function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const nodes: { x: number; y: number; vx: number; vy: number; r: number; pulse: number }[] = [];
    for (let i = 0; i < 40; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 1,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Gradient background
      const grad = ctx.createRadialGradient(canvas.width / 2, 0, 0, canvas.width / 2, canvas.height / 2, canvas.height);
      grad.addColorStop(0, 'rgba(30,10,80,0.15)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = 'rgba(100,80,255,0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 60) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 60) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            const alpha = (1 - dist / 180) * 0.12;
            ctx.strokeStyle = `rgba(100,80,255,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Nodes
      nodes.forEach(n => {
        n.pulse += 0.02;
        const glow = Math.sin(n.pulse) * 0.5 + 0.5;
        const gradient = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 4);
        gradient.addColorStop(0, `rgba(120,80,255,${0.6 * glow})`);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(160,120,255,${0.4 + glow * 0.6})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();

        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', handleResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', handleResize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}