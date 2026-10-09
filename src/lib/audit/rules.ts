export type Status = "pass" | "warn" | "fail";

export type Check = {
  id: string;
  name: string;
  status: Status;
  value: string | null; // what the site actually sent
  summary: string; // one line on this site's result
  why: string; // what the header protects against
  fix: string; // what to change
};

export type Headers = Record<string, string | string[] | undefined>;
type Rule = { weight: number; run: (h: Headers, isHttps: boolean) => Omit<Check, "id" | "name" | "why" | "fix"> } & {
  id: string;
  name: string;
  why: string;
  fix: string;
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v.join(", ") : v ?? null);

const RULES: Rule[] = [
  {
    id: "hsts",
    name: "Strict-Transport-Security",
    weight: 20,
    why: "Tells browsers to only ever use HTTPS for this site, which blocks downgrade and cookie-stealing attacks on public Wi-Fi.",
    fix: "Send Strict-Transport-Security: max-age=31536000; includeSubDomains (once every subdomain supports HTTPS).",
    run: (h, isHttps) => {
      const value = first(h["strict-transport-security"]);
      if (!isHttps) return { status: "fail", value, summary: "The page was served over plain HTTP, so HSTS cannot apply." };
      if (!value) return { status: "fail", value, summary: "Missing. Browsers may still try HTTP first." };
      const age = Number(/max-age=(\d+)/i.exec(value)?.[1] ?? 0);
      if (age < 15552000) {
        return { status: "warn", value, summary: `max-age is ${age}s; aim for at least 180 days (15552000s), ideally 1 year.` };
      }
      return { status: "pass", value, summary: "Present with a long max-age." };
    },
  },
  {
    id: "csp",
    name: "Content-Security-Policy",
    weight: 25,
    why: "Limits where scripts, styles and frames can load from, which is the strongest browser-side defence against cross-site scripting (XSS).",
    fix: "Define a policy such as default-src 'self' and avoid 'unsafe-inline', 'unsafe-eval' and wildcards in script-src.",
    run: (h) => {
      const value = first(h["content-security-policy"]);
      if (!value) return { status: "fail", value, summary: "Missing. Injected scripts would run freely." };
      const weak: string[] = [];
      if (/'unsafe-inline'/i.test(value)) weak.push("'unsafe-inline'");
      if (/'unsafe-eval'/i.test(value)) weak.push("'unsafe-eval'");
      if (/(^|[;\s])(default-src|script-src)[^;]*\s\*(\s|;|$)/i.test(value)) weak.push("a wildcard source");
      if (weak.length) return { status: "warn", value, summary: `Present, but weakened by ${weak.join(" and ")}.` };
      return { status: "pass", value, summary: "Present without the common weaknesses." };
    },
  },
  {
    id: "xfo",
    name: "X-Frame-Options",
    weight: 15,
    why: "Stops other sites from embedding this page in a hidden frame to trick users into clicking (clickjacking).",
    fix: "Send X-Frame-Options: DENY (or SAMEORIGIN), or use a CSP frame-ancestors directive.",
    run: (h) => {
      const value = first(h["x-frame-options"]);
      const csp = first(h["content-security-policy"]) ?? "";
      if (value && /^(deny|sameorigin)$/i.test(value.trim())) return { status: "pass", value, summary: "Framing is restricted." };
      if (/frame-ancestors/i.test(csp)) return { status: "pass", value, summary: "Covered by the CSP frame-ancestors directive." };
      if (value) return { status: "warn", value, summary: "Present, but not DENY or SAMEORIGIN." };
      return { status: "fail", value, summary: "Missing. The page can be framed by any site." };
    },
  },
  {
    id: "xcto",
    name: "X-Content-Type-Options",
    weight: 15,
    why: "Stops browsers guessing a file's type, so an uploaded file can't be reinterpreted as a script.",
    fix: "Send X-Content-Type-Options: nosniff.",
    run: (h) => {
      const value = first(h["x-content-type-options"]);
      if (value && /nosniff/i.test(value)) return { status: "pass", value, summary: "MIME sniffing is disabled." };
      return { status: "fail", value, summary: "Missing or not set to nosniff." };
    },
  },
  {
    id: "referrer",
    name: "Referrer-Policy",
    weight: 10,
    why: "Controls how much of the page address is sent to other sites when users follow a link, which can otherwise leak private paths or tokens.",
    fix: "Send Referrer-Policy: strict-origin-when-cross-origin (or stricter).",
    run: (h) => {
      const value = first(h["referrer-policy"]);
      if (!value) return { status: "warn", value, summary: "Missing. Modern browsers default to a reasonable policy, but it's better to set one." };
      if (/unsafe-url/i.test(value)) return { status: "warn", value, summary: "unsafe-url sends the full address everywhere." };
      return { status: "pass", value, summary: "A referrer policy is set." };
    },
  },
  {
    id: "permissions",
    name: "Permissions-Policy",
    weight: 5,
    why: "Switches off powerful browser features (camera, microphone, location) the site doesn't need, including inside embedded frames.",
    fix: "Send Permissions-Policy: camera=(), microphone=(), geolocation=() and allow only what you use.",
    run: (h) => {
      const value = first(h["permissions-policy"]);
      return value
        ? { status: "pass", value, summary: "Browser features are restricted." }
        : { status: "warn", value, summary: "Missing. All features stay at browser defaults." };
    },
  },
  {
    id: "leak",
    name: "Server information leaks",
    weight: 5,
    why: "Version banners tell attackers exactly which software to look up known exploits for.",
    fix: "Remove X-Powered-By and hide version numbers in the Server header.",
    run: (h) => {
      const powered = first(h["x-powered-by"]);
      const server = first(h["server"]);
      const leaks: string[] = [];
      if (powered) leaks.push(`X-Powered-By: ${powered}`);
      if (server && /\d+(\.\d+)+|\/\d/.test(server)) leaks.push(`Server: ${server}`);
      if (leaks.length) return { status: "warn", value: leaks.join("; "), summary: "Software details are exposed." };
      return { status: "pass", value: server, summary: "No obvious version banners." };
    },
  },
  {
    id: "cookies",
    name: "Cookie flags",
    weight: 5,
    why: "Secure keeps cookies off plain HTTP, HttpOnly hides them from scripts, and SameSite limits cross-site request forgery (CSRF).",
    fix: "Set Secure; HttpOnly; SameSite=Lax (or Strict) on session cookies.",
    run: (h) => {
      const raw = h["set-cookie"];
      const cookies = Array.isArray(raw) ? raw : raw ? [raw] : [];
      if (cookies.length === 0) return { status: "pass", value: null, summary: "No cookies set on this response." };
      const weak = cookies.filter((c) => !/;\s*secure/i.test(c) || !/;\s*httponly/i.test(c) || !/;\s*samesite=/i.test(c));
      if (weak.length === 0) return { status: "pass", value: `${cookies.length} cookie(s)`, summary: "All cookies carry Secure, HttpOnly and SameSite." };
      return { status: "warn", value: `${weak.length} of ${cookies.length} cookie(s) are missing flags`, summary: "Some cookies lack Secure, HttpOnly or SameSite." };
    },
  },
];

export function grade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 65) return "C";
  if (score >= 50) return "D";
  return "F";
}

export function audit(headers: Headers, isHttps: boolean) {
  let score = 0;
  const checks: Check[] = RULES.map((rule) => {
    const r = rule.run(headers, isHttps);
    score += r.status === "pass" ? rule.weight : r.status === "warn" ? rule.weight / 2 : 0;
    return { id: rule.id, name: rule.name, why: rule.why, fix: rule.fix, ...r };
  });
  score = Math.round(score);
  return { score, grade: grade(score), checks };
}
