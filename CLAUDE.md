# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Living document:** this repo is mid-migration (see `docs/modernization-plan.md`).
> Revisit this file at the end of every migration stage so it never describes a
> stack that's already been replaced (e.g. don't leave "Jest" here after the
> stage that removes it in favour of `bun:test`).

## Project purpose

ReadReceipt is a demo site (hosted at https://read-receipt.tobythe.dev) that
demonstrates email tracking pixels. A visitor submits their email address, receives
a first email containing a tracking pixel, and when they open it a second email is
sent back showing exactly what information the pixel revealed (IP address,
geolocation, user agent, and the time between sending and opening).

## Current stack (mid-migration)

- Bun (runtime + package manager, `bun.lock`)
- Astro 7, `output: "server"` via `@astrojs/node` (`mode: "standalone"`) — static
  pages are prerendered at build time (`export const prerender = true`); only the
  two API routes run per-request. The built entry point (`dist/server/entry.mjs`)
  runs under `bun`, not `node`.
- `@astrojs/react` provides the one React island (the email form); everything else
  is native `.astro` + scoped `<style>`
- Biome 2 (`biome.json`) — single lint + format tool, replacing ESLint/Prettier.
  `.astro` frontmatter is linted/formatted out of the box (no experimental flag
  needed), but Biome can't see across the `---` boundary into the template, so
  `noUnusedImports`/`noUnusedVariables` are disabled for `**/*.astro` in
  `biome.json` to avoid false positives on props/imports only used in markup.
- Jest 30 + Testing Library (transformed via `@swc/jest`, not `next/jest`), specs
  mirrored under `test/` (not colocated with source)
- Playwright for e2e (`chromium`/`firefox` projects), run against a built Docker
  image in CI; mail capture for the tracking-pixel flow goes through
  `smtp-tester` via a small local admin HTTP server (`e2e/mail-server.ts` +
  `e2e/mail-client.ts`), not a Cypress-style task, since Playwright test files
  run in separate worker processes from `globalSetup`/`globalTeardown`
- cspell (spell-checking), license-cop (license auditing)
- Docker (`oven/bun` base image) → GCR → Cloud Run for deployment

A staged rewrite to colocated `bun:test` is still planned — see
`docs/modernization-plan.md` for the full plan and current stage.

## Commands

```
bun install          # install deps
bun run dev           # start the Astro dev server
bun run build          # production build (astro build)
bun run start          # run a production build (bun ./dist/server/entry.mjs)
bun run lint           # biome ci .
bunx biome format --write .  # format the repo (not a package.json script)
bun run test           # run full Jest suite (bare `bun test` runs Bun's own test runner, not this)
bunx jest path/to/file.spec.ts        # run a single Jest file
bunx jest -t "test name"              # run tests matching a name
bun run e2e            # open the Playwright UI (interactive) - auto builds/starts the app if nothing's running on :3000
bunx playwright test     # run Playwright headlessly (used in CI, against a built Docker image)
bunx playwright test --project=chromium  # run a single project (also: firefox)
bunx cspell "**/*.*"     # spell-check
bunx license-cop         # check dependency licenses
docker compose up        # starts smtp4dev only, for manually viewing sent emails at http://localhost:5000
docker compose up app    # additionally builds/runs the production Docker image locally, talking to smtp4dev
```

## Required environment variables

`.env` is committed with working defaults (points at `smtp4dev`/the e2e
suite's own `smtp-tester`, both on port 2525 - never running at the same
time, so one file covers both). Override locally via a gitignored `.env.local`
for different real values (e.g. actual SMTP credentials):

```
EMAIL_HOST=localhost
EMAIL_PORT=2525
EMAIL_SENDER_NAME=Read Receipt
EMAIL_SENDER_EMAIL=read.receipt@whatever.com
EMAIL_USER=user
EMAIL_PASS=pass
DEV_IP=95.150.202.188   # mock IP used for dev builds, since localhost has no real one
FORCE_HTTP=true         # needed once running the *built* app (bun run start / docker compose up app); harmless in dev
```

Read in `src/utils/env.ts` via `getEnv()` — always go through that function rather
than reading `process.env` directly elsewhere. This still works unchanged under
Astro: `process.env` is read only inside server/API-route code, which runs in a
real Bun process at request time. The one exception is the footer's copyright
year, which is a build-time-inlined _public_ value — that one is `PUBLIC_YEAR`,
read via `import.meta.env.PUBLIC_YEAR` in `src/components/Footer.astro` (Vite's
convention for values safe to ship to the client, mirroring what `NEXT_PUBLIC_YEAR`
was under Next).

## Architecture

The tracking-pixel flow spans two API routes plus the email templates that link them:

1. **`src/pages/index.astro`** — static markup plus one React island, the email
   form (`<EmailForm client:load />`, Jotai-driven state machine: idle → sending →
   sent/error, see `src/components/form/`), which posts the visitor's email to the
   submit API.
2. **`src/pages/api/submit.ts`** — an Astro `APIRoute` (`POST`) that receives the
   email, builds `first-email` HTML (`src/emails/first-email.tsx`) containing a
   link back to the open-tracking API with the recipient's email and a timestamp
   embedded in the URL, and sends it via `src/utils/email.ts` (nodemailer/SMTP).
3. **`src/pages/api/open/[email]/[timestamp].ts`** — an Astro `APIRoute` (`GET`)
   hit when the recipient opens the first email (the "tracking pixel" request).
   It captures IP (`src/utils/ip.ts`, parsed from `x-forwarded-for` — no
   `request-ip` dependency, since Astro's `Request` is a Fetch API object, not a
   Node `IncomingMessage`) and user agent (`src/utils/user-agent.ts`), computes
   elapsed time since the first email (`src/utils/time.ts`), sends a second email
   (`src/emails/second-email.tsx`) revealing what was captured, and responds with
   a 1x1 PNG pixel regardless of whether that send succeeds.

Other notable pieces:

- `src/emails/*.tsx` — React components rendered server-side to HTML strings for
  the two outbound emails (not part of the Astro page tree).
- `src/utils/domain.ts` — derives the current request's domain (used to build
  absolute links inside emails) from the Fetch API `Request`'s `host` header.
- Static pages (`404.astro`, `privacy.astro`, `terms.astro`, `licenses.astro`) are
  native Astro components with scoped `<style>` (no React/emotion), all prerendered
  at build time — `licenses.astro` calls `generate-license-file` as a top-level
  `await` in its frontmatter instead of Next's `getStaticProps`.
- `src/layouts/Layout.astro` — shared `<head>`/wrapper/footer chrome, replacing
  Next's `_app.tsx`/`_document.tsx` and the old `Wrapper` div that pages used to
  import from `src/pages/index.tsx`.
- `src/components/Content.astro` / `Footer.astro` — shared chrome components;
  `LinkButton` (`src/components/link-button.tsx`) stays React since it's only ever
  rendered inside the form island.
- Tests live under `test/`, mirroring `src/`'s structure rather than being colocated
  (e.g. `src/utils/domain.ts` ↔ `test/utils/domain.spec.ts`); email template tests use
  Jest snapshots serialized as HTML (`jest-serializer-html`). There's no page-level
  snapshot coverage any more (the old `test/pages/*.spec.tsx` rendered Next page
  components directly, which no longer exist as standalone components) — routing/
  content coverage for those pages now lives solely in the Playwright specs.
- E2E specs (`e2e/integration/*.spec.ts`) run against a built Docker image, not the dev
  server — CI builds the image once and shares it between the `e2e` matrix jobs
  (`chromium`/`firefox`) via an uploaded artifact. The SMTP capture server
  (`e2e/global-setup.ts`) runs on the GitHub Actions runner itself, not inside
  the container — the container's `EMAIL_HOST=172.17.0.1` (the Docker bridge
  gateway) points nodemailer back at it. `playwright.config.ts`'s `webServer`
  (`bun run build && bun run start`, `reuseExistingServer: true`) means
  running Playwright locally builds/starts the app automatically if nothing's
  already on `:3000`; in CI it just reuses the already-running container.
- `compose.yml` is for manual local dev only, unrelated to the e2e suite's own
  `smtp-tester` instance: `docker compose up` starts `smtp4dev` (a real SMTP
  server with a web UI at `http://localhost:5000`) so emails sent while
  poking at the app by hand (`bun run dev`) can actually be seen; `docker
  compose up app` additionally builds/runs the production image against it.
- Deployment: `Dockerfile` builds the Astro node-adapter standalone output; unlike
  Next's `.next/standalone`, Astro doesn't trace/bundle production `node_modules`
  automatically, so the runner stage installs and copies `node_modules` itself
  (via a `bun install --production` stage) alongside `dist/`. CI (`ci.yml`)
  builds/tests/lints, CD (`cd.yml`) pushes the image to GCR and deploys to Cloud Run.
