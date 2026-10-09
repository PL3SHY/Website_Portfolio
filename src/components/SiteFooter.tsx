import { profile } from "@/data/profile";

export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line py-6 text-center font-mono text-xs text-muted">
      {profile.name}
    </footer>
  );
}
