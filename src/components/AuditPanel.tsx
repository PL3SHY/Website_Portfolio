import AuditTool from "@/components/AuditTool";

// The Header Auditor as it appears inside its project card: the tool, then a short explanation.
export default function AuditPanel() {
  return (
    <div>
      <p className="mb-4 text-sm text-muted">
        Enter a website to see which HTTP security headers it sends, with a grade and a short explanation of what each
        one protects against. Click a row for details and the fix.
      </p>
      <AuditTool />
      <div className="mt-6 space-y-2 border-t border-line pt-4 text-xs text-muted">
        <p>
          The server makes one GET request to the address you enter, reads only the response headers, and scores eight
          checks. It never downloads the page body and does not save the results. The grade is a quick guide, not a full
          security assessment.
        </p>
        <p>
          Fetching any address a stranger types is a classic server-side request forgery (SSRF) risk, so private, local
          and cloud-metadata addresses are refused. The address is checked again when the connection is made and at
          every redirect, ports other than 80 and 443 are rejected, and there are limits on time, redirects and requests
          per minute. Only scan sites you own or have permission to test.
        </p>
      </div>
    </div>
  );
}
