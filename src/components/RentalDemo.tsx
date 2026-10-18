// The Commerciales Flores demo: the real screens from the team project running on sample data
// (built separately and served from /demos/commerciales-flores). The frame only loads once the
// popup is first shown, because it is lazy-loaded and the closed popup is hidden.
export default function RentalDemo() {
  return (
    <>
      <p className="border-b border-line bg-surface px-5 py-2 text-xs text-muted">
        A demo on sample data: nothing here is real and your changes stay in this tab. Use the{" "}
        <span className="font-mono text-foreground">demo tools</span> button at the bottom right of the demo to sign in as a
        client or the admin, or to reset it. The screens were built by my teammates; I worked on the backend design.
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
