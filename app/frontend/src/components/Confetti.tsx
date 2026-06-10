// Confetti propio en canvas — 50 partículas cálidas, 1500ms (06 §6.8).
import { useEffect, useRef } from "react";

const COLORES = ["#E94F37", "#E5B454", "#F08C7A", "#6FBFA5", "#E78A3C", "#F5EFE0"];

export function Confetti({ onFin }: { onFin: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      onFin();
      return;
    }

    const piezas = Array.from({ length: 50 }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 9,
      vy: -Math.random() * 11 - 4,
      r: Math.random() * 5 + 3,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: COLORES[Math.floor(Math.random() * COLORES.length)],
    }));

    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const dt = t - t0;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of piezas) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - dt / 1500);
        ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        ctx.restore();
      }
      if (dt < 1500) raf = requestAnimationFrame(tick);
      else onFin();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onFin]);

  return (
    <canvas
      ref={ref}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 90 }}
      aria-hidden="true"
    />
  );
}
