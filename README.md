# Simone Bonifacio's Portfolio

## Open the site (one command)

In a terminal, inside this folder, run:

```bash
npm run open
```

That does everything for you: it installs what the site needs (only the first time), starts the site, and opens it in your browser. Press `Ctrl+C` in the terminal to stop it.

- You need [Node.js](https://nodejs.org) (version 20.9 or newer) installed once. That's the only requirement.
- This is for trying the site on your own computer. It is not how the live website is published.
- If your browser doesn't open by itself, go to the address the terminal prints (usually <http://localhost:3000>).

## About

My personal website, where I show the projects I've built. I'm a 4th-year Computer Science (Data Science) student at the University of Santo Tomas, looking for an internship in data science, software development or application security.

## What's on the site

- **Home page:** who I am, my projects, and my training.
- **Security Header Auditor:** a working tool inside its own project card. Click **try it live**, type in a website address and it checks the website's built-in safety settings (called "security headers"), gives it a grade from A to F, and explains in plain language what each setting does and how to fix it.
- **Pixel animation at the top:** a slow, pulsing pattern made of small squares. Click **fx** to change its speed, shape and color, or switch it off. Settings stay on your own device only.

## How the project is organized

Think of it like a small shop:

| Folder | What it is | Shop comparison |
|---|---|---|
| `src/app/` | The pages of the website and the one behind-the-scenes service | The shop floor and the back counter |
| `src/components/` | Reusable building blocks, like the top menu, a project card and the auditor form | Shelves and display stands |
| `src/data/` | My details and my list of projects, written as plain text | The price list |
| `src/lib/audit/` | The rules the auditor follows, and the safety checks it makes before visiting a website | The staff rulebook |

To add a new project to the site, I only edit one file (`src/data/projects.ts`). A new card appears on the home page with no other changes.

## How the auditor works, in four steps

1. You type a website address into the page.
2. The server checks that the address is safe to visit. It refuses private or internal addresses, so the tool can't be tricked into snooping around where it shouldn't.
3. It looks at the website's response and checks eight safety settings.
4. You see a grade and a short explanation for each one.

It only reads the website's headers, never its content, and it doesn't save anything. It's a quick guide, not a full security assessment, and it should only be used on websites you own or have permission to test.

## Built with

TypeScript, Next.js and React for the website, Tailwind CSS for the styling. The auditor exists in two versions: a standalone Python one (FastAPI and httpx, in [its own repo](https://github.com/PL3SHY/P1_SecTest)) and the TypeScript one inside this site, which gives the same grades.

## Doing it step by step

`npm run open` is a shortcut for these two commands, in case you prefer to run them yourself:

```bash
npm install     # first time only: downloads what the site needs
npm run dev     # starts the site
```

Then open <http://localhost:3000> in your browser. Edits to the files show up on the page automatically.

## Contact

SimoneGBonifacio@gmail.com · [github.com/PL3SHY](https://github.com/PL3SHY)
