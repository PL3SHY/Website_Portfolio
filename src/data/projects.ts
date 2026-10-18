export type Project = {
  slug: string;
  title: string;
  blurb: string;
  stack: string[];
  status: "In progress" | "Demo coming soon" | "Live";
  demo?: "auditor" | "rental"; // a live demo that opens in a popup from the card (see page.tsx)
  links?: { label: string; url: string }[]; // only add a link once its repo is public / the page is live
};

export const projects: Project[] = [
  {
    slug: "thesis-explainability",
    title: "Model Explainability Visualization Tool",
    blurb:
      "Thesis project: an interactive web tool that visualizes how a hybrid DistilRoBERTa (text) and GraphSAGE (graph) model arrives at its predictions.",
    stack: ["Python", "DistilRoBERTa", "GraphSAGE", "Data visualization"],
    status: "In progress",
  },
  {
    slug: "auditor",
    title: "Web Security Header Auditor",
    blurb:
      "Enter a URL and get a graded report on its HTTP security headers, with a plain-language explanation and fix for each. Built twice: first as a Python (FastAPI and httpx) app, then in TypeScript for this site, both with protections against server-side request forgery.",
    stack: ["Python", "FastAPI", "TypeScript", "Next.js", "HTTP security"],
    status: "Live",
    demo: "auditor",
    links: [
      { label: "Source (Python)", url: "https://github.com/PL3SHY/P1_SecTest" },
      { label: "Source (TypeScript)", url: "https://github.com/PL3SHY/Website_Portfolio/tree/main/src/lib/audit" },
    ],
  },
  {
    slug: "commerciales-flores",
    title: "Commerciales Flores: Rental Management",
    blurb:
      "Team project for Software Engineering I, built for a real property business: a platform for renting units, function halls and parking, with reservations, payments and refunds, billing reminders, support tickets and an admin dashboard. I was the systems analyst: I helped design the backend and database, set up the Cloudflare configuration, and helped debug and fix issues. The front end was built by teammates. The demo runs the real screens on sample data in your browser.",
    stack: ["React", "TypeScript", "Supabase", "PostgreSQL", "Cloudflare"],
    status: "Live",
    demo: "rental",
  },
];
