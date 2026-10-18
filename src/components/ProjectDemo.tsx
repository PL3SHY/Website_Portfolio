"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

type Link = { label: string; url: string };

function subscribeHash(cb: () => void) {
  window.addEventListener("hashchange", cb);
  window.addEventListener("popstate", cb);
  return () => {
    window.removeEventListener("hashchange", cb);
    window.removeEventListener("popstate", cb);
  };
}

// A "try it live" button that opens the demo in a popup over the page (the rest of the site is
// dimmed and stays where it is), plus the card's links. Opening via the page address
// (/#auditor, e.g. from the nav) opens the popup too.
export default function ProjectDemo({
  id,
  title,
  links,
  wide = false,
  children,
}: {
  id: string;
  title: string;
  links: Link[];
  wide?: boolean; // a big popup that gives the demo most of the screen
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash, () => "");
  // a click wins over the address, but only until the address changes again
  const [manual, setManual] = useState<{ forHash: string; open: boolean } | null>(null);
  const open = manual && manual.forHash === hash ? manual.open : hash === `#${id}`;

  // keep the <dialog> element in step with `open`
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLInputElement>("input")?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
    // stop the page behind the popup from scrolling
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Every way of closing (X button, Escape, click on the dimmed area) comes through here.
  // The state is the single source of truth: the effect above closes the <dialog> from it.
  const requestClose = useCallback(() => {
    if (window.location.hash === `#${id}`) {
      // drop "#auditor" from the address so the nav link can open it again
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    setManual({ forHash: window.location.hash, open: false });
  }, [id]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onCancel = (e: Event) => {
      e.preventDefault(); // Escape: let our state do the closing
      requestClose();
    };
    dialog.addEventListener("cancel", onCancel);
    dialog.addEventListener("close", requestClose); // safety net for any other way it gets closed
    return () => {
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("close", requestClose);
    };
  }, [requestClose]);

  const linkClass = "text-accent underline underline-offset-4 hover:text-accent-strong";

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium">
        <button
          type="button"
          onClick={() => setManual({ forHash: hash, open: true })}
          className="rounded bg-accent px-3 py-1 font-mono text-xs text-white hover:bg-accent-strong"
        >
          try it live
        </button>
        {links.map((l) => (
          <a key={l.url} href={l.url} className={linkClass}>
            {l.label}
          </a>
        ))}
      </div>

      {/* stays mounted while closed, so a report is still there if you reopen it */}
      <dialog
        ref={dialogRef}
        aria-labelledby={`${id}-title`}
        onClick={(e) => {
          if (e.target === e.currentTarget) requestClose(); // click on the dimmed area
        }}
        className={`m-auto rounded-xl border border-line bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-[2px] ${
          wide
            ? "h-[calc(100dvh-2rem)] w-[min(90rem,calc(100%-2rem))] overflow-hidden open:flex open:flex-col"
            : "max-h-[calc(100dvh-2rem)] w-[min(48rem,calc(100%-2rem))] overflow-y-auto"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-background px-5 py-3">
          <h2 id={`${id}-title`} className="text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close"
            className="rounded border border-line px-2 py-0.5 font-mono text-sm text-muted hover:border-accent hover:text-accent"
          >
            ✕
          </button>
        </div>
        <div className={wide ? "flex min-h-0 flex-1 flex-col" : "p-5"}>{children}</div>
      </dialog>
    </>
  );
}
