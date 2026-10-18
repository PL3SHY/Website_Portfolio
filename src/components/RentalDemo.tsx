// The Commerciales Flores demo: the real screens from the team project running on sample data
// (built separately and served from /demos/commerciales-flores). The frame only loads once the
// popup is first shown, because it is lazy-loaded and the closed popup is hidden.
export default function RentalDemo() {
  return (
    <>
      <p className="border-b border-line bg-surface px-5 py-2 text-xs text-muted">
        A demo on sample data: nothing here is real and your changes stay in this tab. Use{" "}
        <span className="font-mono text-foreground">Explore as client</span> or{" "}
        <span className="font-mono text-foreground">Explore as admin</span> at the top of the demo to go in, and{" "}
        <span className="font-mono text-foreground">Reset demo</span> (next to Logout) to start over. This is our team&apos;s
        project; my part was the backend design, the Cloudflare setup and bug fixing, plus this demo&apos;s fake backend.
      </p>
      <iframe
        src="/demos/commerciales-flores/index.html"
        title="Commerciales Flores demo"
        loading="lazy"
        className="min-h-0 w-full flex-1 border-0 bg-white"
      />
    </>
  );
}
