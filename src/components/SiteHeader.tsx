/* eslint-disable @next/next/no-html-link-for-pages -- plain anchors are intentional, see below */
import { profile } from "@/data/profile";

// Plain anchors on purpose: they fire the browser's hashchange event, which the demo card listens to
// so that /#auditor expands it. (Next's <Link> changes the address without that event.)
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-background/90 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-4 text-sm">
        <a href="/" className="font-mono font-semibold text-accent-strong">
          sgb@portfolio:~$
        </a>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-muted">
          <a href="/#projects" className="hover:text-accent">Projects</a>
          <a href="/#auditor" className="hover:text-accent">Auditor</a>
          <a href="/#training" className="hover:text-accent">Training</a>
          <a href="/#contact" className="hover:text-accent">Contact</a>
          <a href={profile.github} className="hover:text-accent">GitHub</a>
        </div>
      </nav>
    </header>
  );
}
