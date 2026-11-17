# CONCEPT — My Portfolio

## Purpose
A personal portfolio website that presents who I am, what I've built, and how to contact me. It is a single-page-app style marketing site, not a web application with user accounts or persistent data.

## Audience
Recruiters, hiring managers, collaborators, and anyone looking for my work and contact details.

## Core features
- **Home** — hero introduction, short bio, profile image
- **About** — bio, skills, experience summary
- **Projects** — project showcase cards (title, description, image, technologies)
- **Contact** — static contact form (no backend; messages are not sent anywhere)
- **Navigation** — Header with links to all four sections

## Design principles
- Responsive layout that works on mobile, tablet, and desktop
- Clean, modern, professional look (light background, slate/gray text, Tailwind utility classes)
- Fast, static build output via Vite
- Component-based architecture; each page is its own file under `src/pages/`

## Tech stack
- React 18 + TypeScript (strict mode)
- Vite (dev server + production build)
- React Router DOM (client-side routing)
- Tailwind CSS utility classes
- ESLint with TypeScript rules

## Success criteria
- Site builds without errors (`npm run build`)
- Lint passes with zero warnings (`npm run lint`)
- All four routes render and navigate correctly
- Deployable to GitHub Pages from the `main` branch

## Non-goals (out of scope)
- Backend API or database
- User authentication / accounts
- Dynamic contact form submission
- Blog or CMS
- Dark mode

## How to edit this file
This file is intended to be edited by hand or by an agent as the project concept evolves. Keep it high-level; implementation details belong in `HANDOFF.md` and the code comments.
