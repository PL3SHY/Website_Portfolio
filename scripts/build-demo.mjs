// Rebuilds the Commerciales Flores demo from its source and copies it into the site:
//   npm run demo:build
// The source lives in demo-sources/commerciales-flores; the built copy that the site serves is
// public/demos/commerciales-flores (commit both after a rebuild).

import { spawnSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "demo-sources", "commerciales-flores");
const out = join(root, "public", "demos", "commerciales-flores");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

function run(args) {
  // On Windows npm is a .cmd file and needs a shell; the command is passed as one string.
  const result =
    process.platform === "win32"
      ? spawnSync(`${npm} ${args.join(" ")}`, { cwd: src, stdio: "inherit", shell: true })
      : spawnSync(npm, args, { cwd: src, stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`\n[demo] "npm ${args.join(" ")}" failed.`);
    process.exit(1);
  }
}

if (!existsSync(join(src, "node_modules"))) {
  console.log("[demo] Installing the demo's packages (first time only)...");
  run(["install", "--no-audit", "--no-fund"]);
}

console.log("[demo] Building...");
run(["run", "build:demo"]);

rmSync(out, { recursive: true, force: true });
cpSync(join(src, "dist"), out, { recursive: true });
console.log(`[demo] Done. Copied the build to ${out}`);
