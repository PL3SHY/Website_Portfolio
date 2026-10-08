"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const LINES = [
  "handshake complete",
  "access level: recruiter",
  "no exploits here, just projects",
  "welcome to the network",
];
const STORAGE_KEY = "fx";
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeFx(cb: () => void) {
  window.addEventListener("fx-change", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("fx-change", cb);
    window.removeEventListener("storage", cb);
  };
}
function readFx() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}
function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export default function HeaderBand() {
  const fx = useSyncExternalStore(subscribeFx, readFx, () => true);
  const reduced = useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
  const [line, setLine] = useState(0);
  const [chars, setChars] = useState(0);

  const animate = fx && !reduced;

  useEffect(() => {
    if (!animate) return;
    const full = LINES[line].length;
    const id = setTimeout(
      () => {
        if (chars < full) setChars(chars + 1);
        else {
          setLine((line + 1) % LINES.length);
          setChars(0);
        }
      },
      chars < full ? 55 : 1800,
    );
    return () => clearTimeout(id);
  }, [animate, line, chars]);

  const text = animate ? LINES[line].slice(0, chars) : LINES[0];

  const toggle = () => {
    try {
      localStorage.setItem(STORAGE_KEY, fx ? "off" : "on");
    } catch {}
    window.dispatchEvent(new Event("fx-change"));
  };

  return (
    <div className="bg-slate-950 text-slate-300">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-1.5 font-mono text-xs">
        <p className="flex min-w-0 items-center gap-2">
          <span
            className={`font-semibold text-sky-400 ${animate ? "glitch" : ""}`}
            data-text="DEDSEC//"
          >
            DEDSEC//
          </span>
          <span className="truncate text-slate-400">
            {"> "}
            {text}
            {animate && <span className="cursor">▌</span>}
          </span>
        </p>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={fx}
          className="shrink-0 rounded border border-slate-700 px-2 py-0.5 text-slate-400 hover:border-sky-400 hover:text-sky-300"
        >
          fx: {fx ? "on" : "off"}
        </button>
      </div>
    </div>
  );
}
