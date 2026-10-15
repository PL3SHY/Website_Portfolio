export type Project = {
  slug: string;
  title: string;
  blurb: string;
  stack: string[];
  status: "In progress" | "Demo coming soon" | "Live";
  demo?: "auditor"; // a live demo that opens inside the card (see page.tsx)
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
      "Course project in Software Engineering I. I handled systems analysis, helped design the backend and database, and set up the site's Cloudflare configuration. The demo will use mock data.",
    stack: ["Web", "Database design", "Cloudflare"],
    status: "Demo coming soon",
  },
];
