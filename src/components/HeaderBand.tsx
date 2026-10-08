"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "fx-settings";
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
const GAP = 1; // px gap so each box stays visible
const CENTRE_DROP = 6; // boxes below the band, so the middle never shows

// dark -> light; the few levels give the pixelated look
const THEMES = {
  gray: ["#0a0a0a", "#1a1a1a", "#2b2b2b", "#444444", "#6b6b6b", "#a3a3a3"],
  blue: ["#020617", "#0b1b4a", "#1e3a8a", "#1d4ed8", "#3b82f6", "#93c5fd"],
  cyan: ["#02080a", "#06242c", "#0e4f5c", "#0e7490", "#22d3ee", "#a5f3fc"],
  green: ["#030a05", "#0a2414", "#14532d", "#15803d", "#22c55e", "#86efac"],
  amber: ["#0a0603", "#2a1606", "#78350f", "#b45309", "#f59e0b", "#fcd34d"],
} as const;
type Theme = keyof typeof THEMES;

type Settings = { on: boolean; speed: number; arms: number; cell: number; theme: Theme };
const DEFAULTS: Settings = { on: true, speed: 0.6, arms: 2, cell: 8, theme: "gray" };

function clamp(n: number, lo: number, hi: number, fallback: number) {
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
}

function parse(raw: string | null): Settings {
  if (!raw) return DEFAULTS;
  try {
    const o = JSON.parse(raw);
    return {
      on: typeof o.on === "boolean" ? o.on : DEFAULTS.on,
      speed: clamp(Number(o.speed), 0.1, 2, DEFAULTS.speed),
      arms: Math.round(clamp(Number(o.arms), 1, 6, DEFAULTS.arms)),
      cell: Math.round(clamp(Number(o.cell), 4, 16, DEFAULTS.cell)),
      theme: o.theme in THEMES ? o.theme : DEFAULTS.theme,
    };
  } catch {
    return DEFAULTS;
  }
}

function subscribeStore(cb: () => void) {
  window.addEventListener("fx-change", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("fx-change", cb);
    window.removeEventListener("storage", cb);
  };
}
function readRaw() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export default function HeaderBand() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const tRef = useRef(0); // animation clock survives setting changes
  const [open, setOpen] = useState(false);

  const raw = useSyncExternalStore(subscribeStore, readRaw, () => null);
  const s = useMemo(() => parse(raw), [raw]);
  const reduced = useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
  const animate = s.on && !reduced;
  const palette = THEMES[s.theme];

  // Only written when the visitor changes something; nothing is stored on a plain visit.
  const update = (patch: Partial<Settings>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...s, ...patch }));
    } catch {}
    window.dispatchEvent(new Event("fx-change"));
  };
  const reset = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    window.dispatchEvent(new Event("fx-change"));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const CELL = s.cell;
    let cols = 0;
    let rows = 0;
    let raf = 0;
    let last = 0;

    const draw = () => {
      const t = tRef.current;
      ctx.fillStyle = palette[0];
      ctx.fillRect(0, 0, cols * CELL, rows * CELL);
      // spiral centred below the band: only its outer arms are visible
      const cx = cols / 2;
      const cy = rows + CENTRE_DROP;
      const reach = cols * 0.3;
      const pulse = 0.78 + 0.22 * Math.sin(t * (s.speed * 1.8));
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const dx = x + 0.5 - cx;
          const dy = y + 0.5 - cy;
          const r = Math.hypot(dx, dy);
          const phase = s.arms * Math.atan2(dy, dx) + r * 0.5 - t * s.speed;
          const arm = (Math.sin(phase) + 1) / 2;
          const fade = Math.exp(-((r / reach) ** 2));
          const level = Math.min(5, Math.floor(arm * fade * pulse * 6.4));
          if (level > 0) {
            ctx.fillStyle = palette[level];
            ctx.fillRect(x * CELL, y * CELL, CELL - GAP, CELL - GAP);
          }
        }
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      cols = Math.max(1, Math.ceil(rect.width / CELL));
      rows = Math.max(1, Math.ceil(rect.height / CELL));
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    const tick = (now: number) => {
      if (now - last > 33) {
        tRef.current += (last ? now - last : 33) / 1000;
        last = now;
        draw();
      }
      raf = requestAnimationFrame(tick);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    if (animate) raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [animate, s.cell, s.speed, s.arms, palette]);

  // close the panel on Escape or a click outside it
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const row = "flex items-center justify-between gap-3";
  const label = "text-neutral-400";
  const range = "w-28 accent-neutral-300";

  return (
    <div ref={rootRef} className="relative" style={{ background: palette[0] }}>
      <canvas ref={canvasRef} className="block h-16 w-full sm:h-20" aria-hidden />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="fx-panel"
        className="absolute right-3 top-2 rounded border border-neutral-700 bg-neutral-950/70 px-2 py-0.5 font-mono text-xs text-neutral-400 hover:border-neutral-400 hover:text-neutral-200"
      >
        fx {open ? "▴" : "▾"}
      </button>
      {open && (
        <div
          id="fx-panel"
          role="group"
          aria-label="Header effect settings"
          className="absolute right-3 top-9 z-30 w-60 space-y-3 rounded border border-neutral-700 bg-neutral-900 p-3 font-mono text-xs text-neutral-200 shadow-lg"
        >
          <label className={row}>
            <span className={label}>animate{reduced ? " (reduced motion)" : ""}</span>
            <input
              type="checkbox"
              checked={s.on && !reduced}
              disabled={reduced}
              onChange={(e) => update({ on: e.target.checked })}
              className="accent-neutral-300"
            />
          </label>
          <label className={row}>
            <span className={label}>speed</span>
            <input
              type="range"
              min={0.1}
              max={2}
              step={0.1}
              value={s.speed}
              onChange={(e) => update({ speed: Number(e.target.value) })}
              className={range}
            />
          </label>
          <label className={row}>
            <span className={label}>arms</span>
            <input
              type="range"
              min={1}
              max={6}
              step={1}
              value={s.arms}
              onChange={(e) => update({ arms: Number(e.target.value) })}
              className={range}
            />
          </label>
          <label className={row}>
            <span className={label}>box size</span>
            <input
              type="range"
              min={4}
              max={16}
              step={1}
              value={s.cell}
              onChange={(e) => update({ cell: Number(e.target.value) })}
              className={range}
            />
          </label>
          <label className={row}>
            <span className={label}>color</span>
            <select
              value={s.theme}
              onChange={(e) => update({ theme: e.target.value as Theme })}
              className="rounded border border-neutral-700 bg-neutral-950 px-1.5 py-0.5"
            >
              {Object.keys(THEMES).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={reset}
            className="w-full rounded border border-neutral-700 py-1 text-neutral-300 hover:border-neutral-400"
          >
            reset
          </button>
        </div>
      )}
    </div>
  );
}
