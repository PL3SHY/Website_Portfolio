import type { Project } from "@/data/projects";

export default function ProjectCard({ project }: { project: Project }) {
  const { title, blurb, stack, status, demoUrl, repoUrl } = project;
  return (
    <article className="flex flex-col rounded-lg border border-line bg-surface p-5 transition-colors hover:border-accent">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <span className="shrink-0 rounded border border-accent/30 bg-accent-soft px-2 py-0.5 font-mono text-xs text-accent-strong">
          {status}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">{blurb}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {stack.map((s) => (
          <li
            key={s}
            className="rounded border border-line bg-background px-2 py-0.5 font-mono text-xs text-muted"
          >
            {s}
          </li>
        ))}
      </ul>
      {(demoUrl || repoUrl) && (
        <div className="mt-4 flex gap-4 text-sm font-medium">
          {demoUrl && (
            <a href={demoUrl} className="text-accent underline underline-offset-4 hover:text-accent-strong">
              Live demo
            </a>
          )}
          {repoUrl && (
            <a href={repoUrl} className="text-accent underline underline-offset-4 hover:text-accent-strong">
              Source
            </a>
          )}
        </div>
      )}
    </article>
  );
}
