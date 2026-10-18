import Image from "next/image";
import AuditPanel from "@/components/AuditPanel";
import ProjectCard from "@/components/ProjectCard";
import RentalDemo from "@/components/RentalDemo";
import { projects } from "@/data/projects";
import { activities, education, profile, skills, training } from "@/data/profile";

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
        {/* The photo is pre-made as a halftone (dots), framed like a comic panel.
            Hidden on phones, where it only takes space. */}
        <div className="mb-6 hidden w-full max-w-56 border-2 border-foreground sm:block">
          <Image
            src="/crow.png"
            alt="A crow holding a knife in its beak"
            width={560}
            height={560}
            className="block aspect-square w-full object-cover"
          />
        </div>
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
          <SectionTitle id="education">Education</SectionTitle>
          <ul className="mt-6 grid gap-6">
            {education.map((e) => (
              <li key={e.when} className="border-l-2 border-cyan pl-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <p className="font-medium">{e.school}</p>
                  <p className="font-mono text-xs text-muted">{e.when}</p>
                </div>
                <p className="text-sm italic text-muted">{e.degree}</p>
                {e.points.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                    {e.points.map((pt) => (
                      <li key={pt}>{pt}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="pb-16">
          <SectionTitle id="projects">Projects</SectionTitle>
          <div className="mt-6 grid gap-4">
            {projects.map((p) => (
              <ProjectCard key={p.slug} project={p}>
                {p.demo === "auditor" ? <AuditPanel /> : p.demo === "rental" ? <RentalDemo /> : null}
              </ProjectCard>
            ))}
          </div>
        </section>

        <section className="pb-16">
          <SectionTitle id="activities">Activities</SectionTitle>
          <ul className="mt-6 grid gap-4">
            {activities.map((a) => (
              <li key={a.title} className="border-l-2 border-cyan pl-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <p className="font-medium">{a.title}</p>
                  <p className="font-mono text-xs text-muted">{a.when}</p>
                </div>
                <p className="text-sm text-muted">{a.note}</p>
              </li>
            ))}
          </ul>
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

        <section className="pb-16">
          <SectionTitle id="skills">Skills</SectionTitle>
          <dl className="mt-6 grid gap-4">
            {skills.map((g) => (
              <div key={g.label}>
                <dt className="font-mono text-xs text-muted">{g.label}</dt>
                <dd className="mt-1.5 flex flex-wrap gap-2">
                  {g.items.map((item) => (
                    <span key={item} className="rounded border border-line bg-surface px-2 py-0.5 font-mono text-xs">
                      {item}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
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
