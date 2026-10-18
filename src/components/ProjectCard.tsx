import type { Project } from "@/data/projects";
import ProjectDemo from "@/components/ProjectDemo";

const STATUS_STYLE: Record<Project["status"], string> = {
  "In progress": "border-green/30 bg-green-soft text-green-strong",
  "Demo coming soon": "border-accent/30 bg-accent-soft text-accent-strong",
  Live: "border-green/40 bg-green-soft text-green-strong",
};

// `children` is an optional live demo, shown in a popup when the visitor clicks "try it live".
export default function ProjectCard({ project, children }: { project: Project; children?: React.ReactNode }) {
  const { slug, title, blurb, stack, status, links = [] } = project;
  return (
    <article
      // a card with a popup demo has no anchor id, so /#auditor opens the popup without scrolling the page
      id={children ? undefined : slug}
      className="scroll-mt-20 flex flex-col rounded-lg border border-line bg-surface p-5 transition-colors hover:border-accent"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <span className={`shrink-0 rounded border px-2 py-0.5 font-mono text-xs ${STATUS_STYLE[status]}`}>
          {status}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">{blurb}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {stack.map((s) => (
          <li key={s} className="rounded border border-line bg-background px-2 py-0.5 font-mono text-xs text-muted">
            {s}
          </li>
        ))}
      </ul>
      {children ? (
        <ProjectDemo id={slug} title={title} links={links}>
          {children}
        </ProjectDemo>
      ) : (
        links.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
            {links.map((l) => (
              <a key={l.url} href={l.url} className="text-accent underline underline-offset-4 hover:text-accent-strong">
                {l.label}
              </a>
            ))}
          </div>
        )
      )}
    </article>
  );
}
