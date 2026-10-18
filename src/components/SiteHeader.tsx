import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-background/90 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-4 text-sm">
        <Link href="/" className="font-mono font-semibold text-accent-strong">
          sgb@portfolio:~$
        </Link>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-muted">
          <Link href="/#education" className="hover:text-accent">Education</Link>
          <Link href="/#projects" className="hover:text-accent">Projects</Link>
          <Link href="/#training" className="hover:text-accent">Training</Link>
          <Link href="/#contact" className="hover:text-accent">Contact</Link>
        </div>
      </nav>
    </header>
  );
}
