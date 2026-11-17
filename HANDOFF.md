# HANDOFF — My Portfolio

Read this before making changes to the codebase. It tells an agent or model what exists, how it's wired, and the conventions to follow.

## Project at a glance
A static React portfolio: 4 pages (Home, About, Projects, Contact), client-side routing, Tailwind styling, Vite build. Deployed to GitHub Pages from `main`.

## Tech stack (versions from package.json)
- React 18.3, react-dom 18.3
- react-router-dom 6.28
- TypeScript 5.6 (strict)
- Vite 5.4 + @vitejs/plugin-react 4.3
- ESLint 9.14 + typescript-eslint 8.13

## File structure (source of truth)
```
my-portfolio/
├── src/
│   ├── index.tsx        # React entry point (renders <App />)
│   ├── App.tsx          # Router + Header + route definitions
│   ├── index.css        # Global CSS (Tailwind directives)
│   ├── App.css          # Component-specific overrides
│   ├── components/
│   │   ├── Header.tsx   # Site navigation
│   │   └── PortfolioItem.tsx  # Project card (Project interface defined here)
│   ├── pages/
│   │   ├── Home.tsx     # Dark snap deck: plain front page + 3 placeholder pages, grain + pointer glow
│   │   ├── About.tsx    # Bio / skills
│   │   ├── Projects.tsx # Project data + cards
│   │   └── Contact.tsx  # Static contact form
│   └── test/
│       └── setup.ts     # Test setup
├── package.json         # Scripts + dependencies
├── tsconfig.json        # TypeScript config (strict)
├── vite.config.ts       # Vite config
├── .gitignore
├── README.md            # User-facing docs
├── CONCEPT.md           # Project concept / vision (this sibling)
├── HANDOFF.md           # This file — editable agent handoff notes
├── PROJECT_SUMMARY.md   # Historical summary of completed work
├── FINAL_SETUP_SUMMARY.md
├── GITHUB_SETUP.md
└── README.md
```

## Key conventions (follow these)
- **Default exports** for components and pages (`export default X`)
- **Interfaces near their component** — e.g. `Project` is defined in `PortfolioItem.tsx`
- **Tailwind utility classes** inline; avoid adding new CSS unless necessary
- **Route paths** are registered in `App.tsx` (`/`, `/about`, `/projects`, `/contact`)
- **Images** use `https://images.unsplash.com/...` URLs; no local image assets yet
- **Strict TypeScript** — no `any`; type props and function returns

## How to run
```
npm install            # install dependencies
npm run dev            # start dev server (http://localhost:5173)
npm run build          # type-check + production build to dist/
npm run preview        # preview the production build
npm run lint           # ESLint, must pass with 0 warnings
```

## How an agent should approach changes
1. Read `CONCEPT.md` for the "why" and `HANDOFF.md` for the "how".
2. Make one focused change at a time; do not bundle unrelated edits.
3. Follow the conventions above; match the existing file layout.
4. If adding a page: create `src/pages/Name.tsx`, export default, add a route in `App.tsx`, and add a nav link in `Header.tsx`.
5. If adding a shared component: put it in `src/components/`, export default, define its props interface in the same file.
6. Run `npm run build` and `npm run lint` before considering a change done.
7. Update `HANDOFF.md` if your change alters structure, scripts, or conventions.

## What NOT to change without discussion
- The `main` branch deployment target (GitHub Pages)
- Dependency versions / lockfile (unless a real need exists)
- Removing the contact form's static nature (no backend exists)

## Testing
No test suite is installed yet. The `src/test/setup.ts` exists but vitest/@testing-library are not in package.json. If you add tests, install `vitest @testing-library/react @testing-library/jest-dom` first and add a `test` script to package.json.

## Deployment
- Build: `npm run build` → output in `dist/`
- Host: GitHub Pages, source = `main` branch, folder = `/root`
- URL: `https://<username>.github.io/my-portfolio`

## How to edit this file
This file is meant to be edited by hand or by an agent whenever the codebase structure, scripts, or conventions change. Keep it current so the next agent reads accurate instructions.
