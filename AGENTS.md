# Repository Guidelines

## Project Structure & Module Organization

This project builds animated route-map videos with React 19, React Router 8, Remotion, MapLibre GL, and Turf.

- `app/home.tsx` contains the editor; `app/routes.ts` registers pages and rendering endpoints.
- `app/components/` holds editor controls and shared UI.
- `app/remotion/` contains composition registration, animation components, fonts, and Zod schemas. Map animation logic lives in `components/RouteMap.tsx`; update `schemata.ts` when changing input props.
- `app/lib/` contains geocoding, rendering helpers, hooks, and API types. Keep server-only logic in `*.server.ts` files.
- `public/` stores static assets, including fonts. `build/`, `out/`, and `.react-router/` are generated directories.

## Build, Test, and Development Commands

Use Node.js **22.22.0 or newer** and install dependencies with `npm ci`.

- `npm run dev`: start the web editor locally.
- `npm run remotion:studio`: preview and scrub video compositions.
- `npm run typecheck`: generate React Router types and check TypeScript.
- `npm run lint`: run ESLint and TypeScript checks.
- `npm run build`: create the production application.
- `npm start`: serve the production build.
- `npx remotion render`: render a composition locally.

For AWS deployment, the existing entry point is `node deploy.mjs`. The `remotion:deploy` package script currently references a missing `app/deploy.ts`.

## Coding Style & Naming Conventions

Use strict TypeScript, functional React components, and ES modules. Follow Prettier configuration: two spaces, no tabs, and bracket spacing; retain double quotes and semicolons. Format changed files with `npx prettier --write <path>`. ESLint uses Remotion's flat configuration.

Name component files in PascalCase, hooks with a `use` prefix, and utility modules in kebab-case. Use the `~/` alias for imports rooted in `app/`.

## Testing Guidelines

No automated test framework, test script, or coverage threshold is configured. Run type checking, linting, and the production build before submitting. For animation changes, scrub the beginning, middle, and end in Remotion Studio and verify a rendered video. For editor changes, exercise location search, route controls, preview, and export; include reproduction steps for fixes.

## Commit & Pull Request Guidelines

Recent commits use subjects such as `feat : location search` and `fix : railway build error`. Follow this pattern. Pull requests should explain behavior changes, link issues, and list validation performed. Include screenshots for editor changes and clips or frames for animation changes.

## Configuration & Secrets

Use `.env.example` as the configuration reference. Keep AWS credentials in the ignored `.env` file and server-side code. Never commit credentials, generated videos, or build output.
