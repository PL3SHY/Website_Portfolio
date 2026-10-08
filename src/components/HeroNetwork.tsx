"use client";

import { useEffect, useRef } from "react";

type Node = { x: number; y: number; vx: number; vy: number };

const ACCENT = "29, 78, 216"; // matches --accent (#1d4ed8)
const LINK_DIST = 130;
const MOUSE_DIST = 150;

export default function HeroNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let nodes: Node[] = [];
    let raf = 0;
    const mouse = { x: -9999, y: -9999 };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(18, Math.min(90, Math.round((w * h) / 3200)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const n of nodes) {
        if (!reduceMotion) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 0 || n.x > w) n.vx *= -1;
          if (n.y < 0 || n.y > h) n.vy *= -1;
        }
      }
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK_DIST) {
            ctx.strokeStyle = `rgba(${ACCENT}, ${(1 - d / LINK_DIST) * 0.4})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        const m = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (m < MOUSE_DIST) {
          ctx.strokeStyle = `rgba(${ACCENT}, ${(1 - m / MOUSE_DIST) * 0.7})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
        ctx.fillStyle = `rgba(${ACCENT}, ${m < MOUSE_DIST ? 0.95 : 0.6})`;
        ctx.beginPath();
        ctx.arc(a.x, a.y, m < MOUSE_DIST ? 3 : 2, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduceMotion) raf = requestAnimationFrame(draw);
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouse.x = mouse.y = -9999;
    };

    resize();
    draw();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-lg border border-line bg-surface">
      <canvas ref={canvasRef} className="block h-44 w-full sm:h-56" aria-hidden />
      <p className="pointer-events-none absolute bottom-2 left-3 font-mono text-xs text-accent-strong">
        $ scanning network… move your cursor
      </p>
    </div>
  );
}
