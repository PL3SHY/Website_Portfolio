export type Project = {
  slug: string;
  title: string;
  blurb: string;
  stack: string[];
  status: "In progress" | "Demo coming soon" | "Live";
  demoUrl?: string;
  repoUrl?: string;
};

// Only add repoUrl once the repo is public, and demoUrl once the demo is deployed.
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
    slug: "security-header-auditor",
    title: "Web Security Header Auditor",
    blurb:
      "A web app that fetches a site and audits its HTTP security headers, built while studying security fundamentals.",
    stack: ["Python", "FastAPI", "httpx"],
    status: "Demo coming soon",
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
