// One-command launcher:  npm run open
// Installs packages if they are missing, starts the site, and opens it in your browser.
// Add --no-open to skip opening the browser:  npm run open -- --no-open

import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

const say = (msg) => console.log(`\n[open] ${msg}`);
const fail = (msg) => {
  console.error(`\n[open] ${msg}`);
  process.exit(1);
};

// 1. Node version (the site's framework needs Node 20.9 or newer)
const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 20 || (major === 20 && minor < 9)) {
  fail(`Node ${process.versions.node} is too old. Install Node 20.9 or newer from https://nodejs.org and try again.`);
}

// 2. Install packages the first time
if (!existsSync(join(root, "node_modules", "next"))) {
  say("First run: installing packages (this takes a minute)...");
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const install = spawnSync(npm, ["install", "--no-audit", "--no-fund"], { stdio: "inherit", shell: process.platform === "win32" });
  if (install.status !== 0) fail("Installing packages failed. Check your internet connection and try again.");
}

// 3. Start the site
say("Starting the site...");
const nextBin = createRequire(join(root, "package.json")).resolve("next/dist/bin/next");
const server = spawn(process.execPath, [nextBin, "dev"], { stdio: ["inherit", "pipe", "inherit"] });

function openBrowser(url) {
  const [cmd, args] =
    process.platform === "win32"
      ? ["cmd", ["/c", "start", "", url]]
      : process.platform === "darwin"
        ? ["open", [url]]
        : ["xdg-open", [url]];
  spawn(cmd, args, { stdio: "ignore", detached: true }).on("error", () => {
    console.log(`[open] Couldn't open a browser automatically. Open ${url} yourself.`);
  }).unref();
}

// Show the server's output, and open the browser once it says where it is running
// (it picks another port if 3000 is busy, so read the address instead of assuming it).
let opened = false;
server.stdout.on("data", (chunk) => {
  const text = chunk.toString();
  process.stdout.write(text);
  if (opened) return;
  const match = text.replace(/\u001b\[[0-9;]*m/g, "").match(/Local:\s+(http:\/\/\S+)/);
  if (match) {
    opened = true;
    if (process.argv.includes("--no-open")) {
      say(`Site is running at ${match[1]}  (press Ctrl+C to stop)`);
    } else {
      say(`Opening ${match[1]} in your browser  (press Ctrl+C here to stop the site)`);
      openBrowser(match[1]);
    }
  }
});

server.on("exit", (code) => process.exit(code ?? 0));
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.kill(signal);
  });
}
