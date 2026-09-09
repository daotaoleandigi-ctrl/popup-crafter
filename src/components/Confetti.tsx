import { useEffect, useRef } from "react";

interface ConfettiProps {
  fire: number; // increment to fire
  origin?: { x: number; y: number } | null; // viewport coords to burst from
}

export default function Confetti({ fire, origin }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevFire = useRef(0);

  useEffect(() => {
    // Only fire on a rising edge (0 -> positive). Prevents re-firing when the
    // component remounts (e.g. popup reopened) with a stale non-zero `fire`.
    if (fire === 0 || fire === prevFire.current) return;
    prevFire.current = fire;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = (canvas.width = window.innerWidth);
    const H = (canvas.height = window.innerHeight);
    const ox = origin?.x ?? W / 2;
    const oy = origin?.y ?? H / 2;

    const colors = [
      "#7c3aed",
      "#a78bfa",
      "#fbbf24",
      "#f59e0b",
      "#ec4899",
      "#34d399",
    ];
    const particles: {
      x: number;
      y: number;
      r: number;
      c: string;
      vx: number;
      vy: number;
      rot: number;
      vr: number;
      life: number;
    }[] = [];

    for (let i = 0; i < 140; i++) {
      particles.push({
        x: ox + (Math.random() - 0.5) * 60,
        y: oy + (Math.random() - 0.5) * 30,
        r: 4 + Math.random() * 6,
        c: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 9 - 4,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        life: 1,
      });
    }

    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const elapsed = t - start;
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p) => {
        p.vy += 0.2;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life = Math.max(0, 1 - elapsed / 1800);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        ctx.restore();
      });
      if (elapsed < 1900) {
        raf = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, W, H);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fire, origin]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[2147483647]"
      style={{ width: "100vw", height: "100vh" }}
      aria-hidden
    />
  );
}
