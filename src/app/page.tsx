import ProjectCard from "@/components/ProjectCard";
import { projects } from "@/data/projects";
import { profile, training } from "@/data/profile";

const link = "text-accent underline underline-offset-4 hover:text-accent-strong";

function SectionTitle({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-8 flex items-center gap-3 text-2xl font-semibold">
      <span className="font-mono text-base text-accent" aria-hidden>
        {"//"}
      </span>
      {children}
    </h2>
  );
}

export default function Home() {
  return (
    <>
      <header className="border-b border-line">
        <nav className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-4 text-sm">
          <span className="font-mono font-semibold text-accent-strong">sgb@portfolio:~$</span>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-muted">
            <a href="#projects" className="hover:text-accent">Projects</a>
            <a href="#training" className="hover:text-accent">Training</a>
            <a href="#contact" className="hover:text-accent">Contact</a>
            <a href={profile.github} className="hover:text-accent">GitHub</a>
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5">
        <section className="py-16">
          <p className="inline-flex items-center gap-2 rounded border border-accent/30 bg-accent-soft px-2.5 py-1 font-mono text-xs text-accent-strong">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            open to OJT / internships
          </p>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">{profile.name}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{profile.tagline}</p>
          <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
            <a href="#projects" className={link}>View projects</a>
            <a href={profile.github} className={link}>GitHub</a>
            <a href={`mailto:${profile.email}`} className={link}>Email</a>
          </p>
        </section>

        <section className="pb-16">
          <SectionTitle id="projects">Projects</SectionTitle>
          <div className="mt-6 grid gap-4">
            {projects.map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
        </section>

        <section className="pb-16">
          <SectionTitle id="training">Training</SectionTitle>
          <ul className="mt-6 grid gap-4">
            {training.map((t) => (
              <li key={t.title} className="border-l-2 border-accent pl-4">
                <p className="font-medium">{t.title}</p>
                <p className="text-sm text-muted">
                  {t.org}. {t.note}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="pb-20">
          <SectionTitle id="contact">Contact</SectionTitle>
          <p className="mt-4">
            <a href={`mailto:${profile.email}`} className={link}>{profile.email}</a>
            <span className="text-muted">{" · "}</span>
            <a href={profile.github} className={link}>github.com/PL3SHY</a>
          </p>
        </section>
      </main>

      <footer className="border-t border-line py-6 text-center font-mono text-xs text-muted">
        {profile.name}
      </footer>
    </>
  );
}
