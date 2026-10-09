import type { Metadata } from "next";
import AuditTool from "@/components/AuditTool";

export const metadata: Metadata = {
  title: "Security Header Auditor | Simone Bonifacio",
  description: "Check a website's HTTP security headers and get a graded report with plain-language fixes.",
};

export default function AuditPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-20 pt-14">
      <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
        <span className="font-mono text-xl text-cyan" aria-hidden>
          {"//"}
        </span>
        Security Header Auditor
      </h1>
      <p className="mt-4 max-w-2xl text-muted">
        Enter a website and see which HTTP security headers it sends, with a grade and a short explanation of what each
        one protects against. Click any row for details and the fix.
      </p>

      <div className="mt-8">
        <AuditTool />
      </div>

      <section className="mt-14 space-y-3 border-t border-line pt-8 text-sm text-muted">
        <h2 className="font-mono text-sm font-semibold text-foreground">How it works</h2>
        <p>
          The server makes one GET request to the address you enter, reads only the response headers, and scores eight
          checks. It never downloads the page body and does not save the results. The grade is a quick guide, not a full security
          assessment.
        </p>
        <p>
          A tool that fetches any address a stranger types is a classic server-side request forgery (SSRF) risk, so
          requests to private, local and cloud-metadata addresses are refused. The address is checked again when the
          connection is made and at every redirect, ports other than 80 and 443 are rejected, and there are limits on
          time, redirects and requests per minute.
        </p>
        <p>
          Only scan sites you own or have permission to test. This was first prototyped in Python (FastAPI and httpx) and
          rebuilt here in TypeScript.
        </p>
      </section>
    </main>
  );
}
