"use client";

import { useState, useSyncExternalStore } from "react";

type Link = { label: string; url: string };

function subscribeHash(cb: () => void) {
  window.addEventListener("hashchange", cb);
  window.addEventListener("popstate", cb);
  return () => {
    window.removeEventListener("hashchange", cb);
    window.removeEventListener("popstate", cb);
  };
}

// A "Try it live" button that expands the demo right inside the project card, plus the card's
// links. Opening via the page address (/#auditor, e.g. from the nav) expands it too.
export default function ProjectDemo({
  id,
  links,
  children,
}: {
  id: string;
  links: Link[];
  children: React.ReactNode;
}) {
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash, () => "");
  // a click wins over the address, but only until the address changes again
  const [manual, setManual] = useState<{ forHash: string; open: boolean } | null>(null);
  const open = manual && manual.forHash === hash ? manual.open : hash === `#${id}`;

  const linkClass = "text-accent underline underline-offset-4 hover:text-accent-strong";

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium">
        <button
          type="button"
          onClick={() => setManual({ forHash: hash, open: !open })}
          aria-expanded={open}
          aria-controls={`${id}-demo`}
          className="rounded bg-accent px-3 py-1 font-mono text-xs text-white hover:bg-accent-strong"
        >
          {open ? "close ▴" : "try it live ▾"}
        </button>
        {links.map((l) => (
          <a key={l.url} href={l.url} className={linkClass}>
            {l.label}
          </a>
        ))}
      </div>
      {/* kept mounted while closed, so a report is still there if you collapse and reopen */}
      <div id={`${id}-demo`} hidden={!open} className="mt-5 border-t border-line pt-5">
        {children}
      </div>
    </>
  );
}
