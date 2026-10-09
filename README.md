# Simone Bonifacio's Portfolio

My personal website, where I show the projects I've built. I'm a 4th-year Computer Science (Data Science) student at the University of Santo Tomas, looking for an internship in data science, software development or application security.

## What's on the site

- **Home page:** who I am, my projects, and my training.
- **Security Header Auditor** (`/audit`): a working tool. Type in a website address and it checks the website's built-in safety settings (called "security headers"), gives it a grade from A to F, and explains in plain language what each setting does and how to fix it.
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

TypeScript, Next.js and React for the website, Tailwind CSS for the styling. The auditor started as a Python prototype (FastAPI and httpx) and was rebuilt here in TypeScript so it lives in one place.

## Running it on your own computer

You need [Node.js](https://nodejs.org) installed. Then, in this folder:

```bash
npm install
npm run dev
```

Open <http://localhost:3000> in your browser. Edits to the files show up on the page automatically.

## Contact

SimoneGBonifacio@gmail.com · [github.com/PL3SHY](https://github.com/PL3SHY)
