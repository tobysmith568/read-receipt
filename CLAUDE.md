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

- Bun (runtime + package manager, `bun.lock`) — Node's no longer used to run scripts
  (Next.js itself still executes under Node internally)
- Next.js 14, Pages Router (`src/pages`)
- ESLint 8 (`eslint-config-next`) + Prettier (`@tobysmith568/prettier-config`)
- Jest 30 + Testing Library, specs mirrored under `test/` (not colocated with source)
- Cypress 15 for e2e, run against a built Docker image in CI (chrome + firefox)
- cspell (spell-checking), license-cop (license auditing)
- Docker (`oven/bun` base image) → GCR → Cloud Run for deployment

A staged rewrite to Astro/Biome/Playwright/`bun:test` is still planned — see
`docs/modernization-plan.md` for the full plan and current stage.

## Commands

```
bun install          # install deps
bun run dev           # start Next dev server
bun run build          # production build
bun run start          # run a production build
bun run lint           # next lint (ESLint)
bunx prettier --check .  # format check (not a package.json script)
bun run test           # run full Jest suite (bare `bun test` runs Bun's own test runner, not this)
bunx jest path/to/file.spec.ts        # run a single Jest file
bunx jest -t "test name"              # run tests matching a name
bun run e2e            # open Cypress interactively
bunx cypress run        # run Cypress headlessly (used in CI, against a built Docker image)
bunx cspell "**/*.*"     # spell-check
bunx license-cop         # check dependency licenses
```

## Required environment variables

Not committed; create a local `.env`:

```
EMAIL_HOST=localhost
EMAIL_PORT=25
EMAIL_SENDER_NAME=Read Receipt
EMAIL_SENDER_EMAIL=read.receipt@whatever.com
EMAIL_USER=user
EMAIL_PASS=pass
DEV_IP=xxx.xxx.xxx.xxx   # mock IP used for dev builds, since localhost has no real one
```

Read in `src/utils/env.ts` via `getEnv()` — always go through that function rather
than reading `process.env` directly elsewhere.

## Architecture

The tracking-pixel flow spans two API routes plus the email templates that link them:

1. **`src/pages/index.tsx`** — form (Jotai-driven state machine: idle → sending →
   sent/error, see `src/components/form/`) posts the visitor's email to the submit API.
2. **`src/pages/api/submit.ts`** — receives the email, builds `first-email` HTML
   (`src/emails/first-email.tsx`) containing a link back to the open-tracking API with
   the recipient's email and a timestamp embedded in the URL, and sends it via
   `src/utils/email.ts` (nodemailer/SMTP).
3. **`src/pages/api/open/[email]/[timestamp].ts`** — hit when the recipient opens the
   first email (the "tracking pixel" request). It captures IP (`src/utils/ip.ts`,
   including IP geolocation lookup) and user agent (`src/utils/user-agent.ts`),
   computes elapsed time since the first email (`src/utils/time.ts`), sends a
   second email (`src/emails/second-email.tsx`) revealing what was captured, and
   responds with a 1x1 PNG pixel regardless of whether that send succeeds.

Other notable pieces:

- `src/emails/*.tsx` — React components rendered server-side to HTML strings for
  the two outbound emails (not part of the Next.js page tree).
- `src/utils/domain.ts` — derives the current request's domain (used to build
  absolute links inside emails).
- Static pages (`404`, `privacy`, `terms`, `licenses`) have no client interactivity.
- `src/pages/_app.tsx` / `_document.tsx` — standard Next.js App/Document overrides.
- Tests live under `test/`, mirroring `src/`'s structure rather than being colocated
  (e.g. `src/utils/domain.ts` ↔ `test/utils/domain.spec.ts`); email template tests use
  Jest snapshots serialized as HTML (`jest-serializer-html`).
- E2E specs (`e2e/integration/*.cy.ts`) run against a built Docker image, not the dev
  server — CI builds the image once and shares it between the `e2e` matrix jobs
  (chrome/firefox) via an uploaded artifact.
- Deployment: `Dockerfile` builds Next.js in `output: standalone` mode; CI (`ci.yml`)
  builds/tests/lints, CD (`cd.yml`) pushes the image to GCR and deploys to Cloud Run.
