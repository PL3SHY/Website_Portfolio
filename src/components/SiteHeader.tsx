import Link from "next/link";
import { profile } from "@/data/profile";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-background/90 backdrop-blur">
      <nav className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-4 text-sm">
        <Link href="/" className="font-mono font-semibold text-accent-strong">
          sgb@portfolio:~$
        </Link>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-muted">
          <Link href="/#projects" className="hover:text-accent">Projects</Link>
          <Link href="/audit" className="hover:text-accent">Auditor</Link>
          <Link href="/#training" className="hover:text-accent">Training</Link>
          <Link href="/#contact" className="hover:text-accent">Contact</Link>
          <a href={profile.github} className="hover:text-accent">GitHub</a>
        </div>
      </nav>
    </header>
  );
}
