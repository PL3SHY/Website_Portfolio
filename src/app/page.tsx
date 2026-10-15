import AuditPanel from "@/components/AuditPanel";
import ProjectCard from "@/components/ProjectCard";
import { projects } from "@/data/projects";
import { profile, training } from "@/data/profile";

const link = "text-accent underline underline-offset-4 hover:text-accent-strong";

function SectionTitle({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-20 flex items-center gap-3 text-2xl font-semibold">
      <span className="font-mono text-base text-cyan" aria-hidden>
        {"//"}
      </span>
      {children}
    </h2>
  );
}

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 pt-14 lg:grid lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-14 xl:grid-cols-[22rem_minmax(0,1fr)]">
      {/* Left: who I am. On wide screens it stays in view while the right side scrolls. */}
      <aside className="pb-12 lg:sticky lg:top-24 lg:self-start lg:pb-0">
        <p className="inline-flex items-center gap-2 rounded border border-green/30 bg-green-soft px-2.5 py-1 font-mono text-xs text-green-strong">
          <span className="h-1.5 w-1.5 rounded-full bg-green" />
          open to OJT / internships
        </p>
        <h1 className="mt-5 text-4xl font-bold tracking-tight">{profile.name}</h1>
        <p className="mt-4 leading-relaxed text-muted">{profile.tagline}</p>
        <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
          <a href="#projects" className={link}>View projects</a>
          <a href={profile.github} className={link}>GitHub</a>
          <a href={`mailto:${profile.email}`} className={link}>Email</a>
        </p>
      </aside>

      {/* Right: the work. */}
      <div>
        <section className="pb-16">
          <SectionTitle id="projects">Projects</SectionTitle>
          <div className="mt-6 grid gap-4">
            {projects.map((p) => (
              <ProjectCard key={p.slug} project={p}>
                {p.demo === "auditor" ? <AuditPanel /> : null}
              </ProjectCard>
            ))}
          </div>
        </section>

        <section className="pb-16">
          <SectionTitle id="training">Training</SectionTitle>
          <ul className="mt-6 grid gap-4">
            {training.map((t) => (
              <li key={t.title} className="border-l-2 border-cyan pl-4">
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
      </div>
    </main>
  );
}
