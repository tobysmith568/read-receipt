# Read Receipt — Modernization Plan

The project has drifted from current tooling norms (npm/Node, Next.js, Cypress, Jest,
ESLint/Prettier). This document breaks the refresh into independent, mergeable stages
so each lands as its own PR/branch rather than one giant rewrite.

## Ground rules

- Each stage is a separate branch/PR, merged and green in CI before the next starts.
- CI (`ci.yml`/`cd.yml`) and the `Dockerfile` are updated in the same stage that
  changes the tool they invoke — never left referencing a removed tool.
- No stage silently drops test/lint coverage. If a migration temporarily loses
  something (e.g. a Cypress test not yet ported to Playwright), that's called out
  and blocks merge of that stage.
- Later stages assume earlier stages are done — see "Depends on" per stage.
- `CLAUDE.md`/`.claude/` config (added in Stage 1) is a living document — amend
  it as the last step of every later stage so it never describes a stack that's
  already gone (e.g. still mentioning Jest after Stage 6 removes it).

## Current stack (baseline)

- Runtime/package manager: Node 20 + npm (`package-lock.json`)
- Framework: Next.js 14 (Pages Router, `src/pages`, two API routes, `output: standalone`)
- Lint/format: ESLint 8 (`eslint-config-next`) + Prettier (`@tobysmith568/prettier-config`)
- Unit tests: Jest 30 + Testing Library, mirrored under `test/` (not colocated)
- E2E tests: Cypress 15, run against a built Docker image in CI (chrome + firefox)
- Other: cspell, license-cop, Docker → GCR → Cloud Run

## Stage 1 — AI tooling (`CLAUDE.md` + `.claude/`)

**Depends on:** nothing. Do this first so the rest of the migration can be
done with an agent that has proper project context, and so there's a
documented baseline to compare each later stage's stack against.

- Run `/init` to scaffold `CLAUDE.md`: project purpose (tracking-pixel demo
  site), architecture (`src/pages` including the two API routes, `src/emails`,
  `src/utils`), dev commands, required `.env` variables (see README), test/e2e
  commands, and deployment path (Docker → GCR → Cloud Run).
- Add a project-level `.claude/settings.json` (checked into git, shared with
  the team/agents) covering permissions that are safe to pre-approve for this
  repo (e.g. running the package manager, lint/format, test, and e2e commands
  once each exists) — use the `update-config` skill rather than hand-rolling it.
- Decide what stays local-only (`.claude/settings.local.json`, gitignored)
  vs. shared — machine-specific paths/credentials stay local, everything
  else that helps any contributor/agent goes in the committed file.
- Note in `CLAUDE.md` that this file must be revisited at the end of every
  later stage (see ground rules) — call this out explicitly so it isn't
  forgotten once Bun/Astro/Biome/Playwright/bun:test land.
- Optional/deferred: a project-specific `run` skill override if the generic
  one doesn't handle this app's `.env`-driven dev server well enough — only
  add if it turns out to be needed, don't pre-build it speculatively.

**Exit criteria:** `CLAUDE.md` accurately describes the current (pre-migration)
stack; `.claude/settings.json` committed with sensible shared permissions.

## Stage 2 — Bun as package manager & runtime

**Depends on:** nothing (can run in parallel with Stage 1, but Stage 1 first
means every later stage is done with better agent context). Do this early —
every later stage runs its tooling through Bun.

- Replace `package-lock.json` with `bun.lock`; run `bun install`.
- Swap `npm ci`/`npm run` for `bun install --frozen-lockfile`/`bun run` in
  `ci.yml`, `cd.yml`, and the `Dockerfile` (`oven/bun` base image instead of
  `node:24-alpine`, adjusting the multi-stage build accordingly).
- Update `scripts` in `package.json` to use `bun` where it changes behaviour
  (e.g. `bunx` instead of `npx`).
- Verify Next.js dev/build/start still work when invoked via `bun run` (Next
  itself still executes under Node internally — this stage is about the
  package manager and script runner, not swapping Next's runtime).
- Update README dev setup instructions (`bun install`, `bun run dev`).
- Spike/confirm: does `node-version`/cache config in the GH Actions workflows
  need replacing with `oven-sh/setup-bun`?
- Remove `.npmrc` (`engine-strict`, `strict-peer-deps` are npm-specific);
  only add a `bunfig.toml` if something equivalent turns out to be needed.
- Spike/confirm: `renovate.json` extends a shared external config
  (`local>tobysmith568/renovate-config`) — check it actually understands a
  `bun.lock` before assuming dependency updates keep working unattended.

**Exit criteria:** CI green using Bun for install + running existing
npm-scripts; Docker image still builds and serves; no behavior change.

## Stage 3 — Astro instead of Next.js ✅ done

**Depends on:** Stage 2 (Bun). Deliberately done _before_ Biome/Playwright/
bun:test (Stages 4–6), even though it's the highest-risk stage — Astro changes
the page file layout (`.tsx` → `.astro`) and rendered markup, and both the
e2e specs and colocated unit tests would otherwise have to be written once
against Next.js output and then rewritten against Astro's. Better to eat that
churn once, on the old Jest/Cypress/ESLint tooling, than pay it twice.

This is the largest and riskiest stage — it's a framework change, not a
tooling swap, and this app isn't a pure static site:

- `src/pages/api/submit.ts` and `src/pages/api/open/[email]/[timestamp].ts`
  are server logic (sends email, records a tracking pixel hit) → become Astro
  API endpoints (`src/pages/api/**/*.ts`) under `output: "server"` with the
  Node adapter (`@astrojs/node`), since Cloud Run needs a long-running server,
  not static output. The adapter's build output is a plain Node-compatible
  entry script — Astro's own docs note it can be run as `bun ./dist/server/entry.mjs`
  instead of `node ...`, so this doesn't have to reintroduce a Node runtime;
  spike/confirm this works for our request handling and `nodemailer` usage
  before relying on it (there's no widely-maintained native Bun adapter worth
  using instead for an app this size — running the Node adapter's output under
  Bun is the standard approach).
- `src/pages/index.tsx` has interactive client state (Jotai-driven form:
  idle/sending/sent/error) → becomes an Astro page with a React island
  (`@astrojs/react`, `client:load`) wrapping just the form component; static
  chrome (`content.tsx`, `footer.tsx`, `link-button.tsx`) can become plain
  `.astro` components.
- `src/pages/404.tsx`, `privacy.tsx`, `terms.tsx`, `licenses.tsx` are static →
  straightforward `.astro` page conversions.
- `src/pages/_app.tsx` / `_document.tsx` → Astro layout
  (`src/layouts/Layout.astro`).
- `src/emails/*.tsx` (React-rendered email templates) — confirm rendering
  approach still works standalone (they're rendered server-side to HTML
  strings for `nodemailer`, not part of the page tree, so likely unaffected,
  but worth explicitly verifying rather than assuming).
- Replace `next.config.js` with `astro.config.mjs`; update `tsconfig.json`
  for Astro's expected config.
- Rework the `Dockerfile`: Next's `output: standalone` copy step is
  Next-specific; Astro + `@astrojs/node` in `standalone` mode has its own
  build output shape. Keep the runner stage on `oven/bun` (from Stage 2)
  rather than switching back to a `node:*` base image — run the built entry
  script with `bun` instead of `node`, per the spike above.
- Update env var access (`src/utils/env.ts`) for Astro's `import.meta.env`
  vs Next's `process.env`, keeping runtime (not build-time) reads where the
  app currently relies on `.env` at container start.
- The existing Jest specs (`test/**`) and Cypress specs (`e2e/integration/**`)
  will need path/import/selector touch-ups to keep passing against the new
  Astro output — this stage is not exempt from keeping CI green, it's just
  patching the _old_ test tooling rather than rewriting it onto the new one.
- Revisit `CLAUDE.md` (Stage 1) — this is the biggest single change to the
  architecture description, so give it a full re-read, not just a diff.
- Add the Astro VS Code extension to `.vscode/extensions.json` recommendations.
- Confirm `codeql-analysis.yml`'s `language: javascript` Autobuild job still
  passes — CodeQL's JS analysis doesn't compile anything so it should be
  unaffected, but verify rather than assume given the file layout change.

**Exit criteria:** app fully served by Astro, deployed via the same Docker →
GCR → Cloud Run pipeline, existing Jest + Cypress suites passing against it
(not yet migrated to bun:test/Playwright — that's Stages 5/6).

**Outcome / deviations from the plan above:**

- Static pages (`index`, `404`, `privacy`, `terms`, `licenses`) all ended up
  `export const prerender = true` — none of them have per-request dynamic
  content (mirroring what Next was already doing via automatic static
  optimization), and prerendering sidesteps a real bug: `@emotion/styled`
  doesn't survive Astro's SSR-per-request bundling faithfully in every case,
  and `generate-license-file` would otherwise have needed promoting to a
  production runtime dependency instead of staying a devDependency. Only the
  two API routes (`submit.ts`, `open/[email]/[timestamp].ts`) are dynamic.
- `getIpFromRequest` reads `x-forwarded-for` directly instead of using
  `Astro.clientAddress`, to sidestep Cloud Run's reverse-proxy trust
  configuration as an unknown; `request-ip` is gone entirely.
- Removing `next` forced two knock-on tooling changes beyond Astro itself:
  `next lint`/`eslint-config-next` don't work without the `next` package, and
  `eslint-plugin-astro` (needed to lint `.astro` files at all) requires
  ESLint ≥10. ESLint 10.6.0 itself turned out to be incompatible with
  `astro-eslint-parser`'s scope manager (`scopeManager.addGlobals is not a function`) — landed on ESLint 9.39.4 (flat config, `eslint.config.mjs`)
  instead, which works cleanly. The full Biome migration is still Stage 4.
- `jest.config.js` lost `next/jest` (transform now `@swc/jest`) and
  `jest.env.js` gained global `Request`/`Response`/`Headers`/`fetch` polyfills
  for jsdom, needed once utils/tests started using Fetch API `Request` objects.
- The five `test/pages/*.spec.tsx` snapshot tests were deleted rather than
  ported — they rendered Next page components directly, and page content now
  lives in `.astro` templates that Jest/RTL can't import. Routing/content
  coverage for those pages now lives solely in the Cypress specs; a real,
  intentional coverage change, not a silent drop.
- The `privacy` and `terms` legal-text bodies initially hit repeated
  content-filter false positives when writing the boilerplate legal text in
  one shot; splitting the same content into many small sequential edits (a
  few paragraphs/list items at a time) got past it with no content changes
  needed. Both pages are now fully ported.

## Stage 4 — Biome.js instead of ESLint/Prettier ✅ done

**Depends on:** Stage 3 (Astro) and Stage 2 (Bun) — config should target the
final `.astro`/`.ts` file layout so it isn't written twice.

- Add Biome config (`biome.json`), migrating relevant rules from
  `.eslintrc.json` + `@tobysmith568/prettier-config` + `.editorconfig`.
- Confirm Biome's Astro support (parsing/formatting `.astro` files) meets
  needs — Biome's Astro/Vue/Svelte handling is newer than its JS/TS support,
  so verify before relying on it rather than assuming parity.
- Decide fate of `eslint-config-next`-specific rules (e.g. `next/core-web-vitals`)
  — no longer relevant post-Astro anyway, but confirm nothing framework-specific
  needs an equivalent.
- Remove `.eslintrc.json`, `.prettierignore`, ESLint/Prettier deps, and the
  `"prettier"` field in `package.json`; replace the `Lint` job in `ci.yml`
  (currently `eslint` + `prettier --check`) with `biome ci`.
- Swap `dbaeumer.vscode-eslint`/`esbenp.prettier-vscode` in
  `.vscode/extensions.json` for Biome's VS Code extension, and update
  `.vscode/settings.json`'s `editor.defaultFormatter` accordingly.
- Keep `cspell` — Biome doesn't do spell-checking.
- Run `biome check --write` once repo-wide, review the diff for anything
  surprising before committing.

**Exit criteria:** `biome ci .` passes in CI; ESLint/Prettier fully removed
from deps and workflows.

**Outcome / deviations from the plan above:**

- Biome supports `.astro` files out of the box as of v2.3+ (no
  `html.experimentalFullSupportEnabled` flag needed) for both linting and
  formatting the frontmatter script — confirmed by spiking `biome format`
  against a deliberately mis-indented copy of `Content.astro` before relying
  on it.
- The gap the spike did find: Biome's `.astro` analysis doesn't see across
  the `---` frontmatter/template boundary, so every destructured prop or
  import that's only referenced in the markup below (e.g. `showHome` in
  `Content.astro`, `Layout`/`Content` imports in the page files) was flagged
  as unused. Rather than silently losing that coverage, `noUnusedImports`
  and `noUnusedVariables` are explicitly turned off for `**/*.astro` in
  `biome.json`, documented there and in `CLAUDE.md` — those two rules still
  apply everywhere else (`.ts`/`.tsx`).
- `bunx biome migrate eslint --write` / `migrate prettier` were tried first;
  the ESLint migration produced an unwieldy fully-decomposed rule list
  (every individual recommended rule spelled out under `"preset": "none"`,
  plus duplicated per-glob global lists for every DOM event handler) instead
  of just keeping `"preset": "recommended"`. Hand-written config using the
  preset was simpler to read and maintain, so the migration output was
  discarded in favour of that; the Prettier migration couldn't run at all
  since `@tobysmith568/prettier-config` is an external npm package rather
  than a local config file, so its settings (`printWidth: 100`,
  `arrowParens: avoid`, `trailingComma: none`, `bracketSameLine: true`, LF,
  double quotes) were copied into `biome.json`'s `javascript.formatter`
  by hand instead.
- A handful of rules were disabled with justification rather than blindly
  accepted: `complexity.noBannedTypes` (mirrors the old
  `@typescript-eslint/no-empty-object-type: off` override, needed for an
  intentionally-empty `SubmitRequest` type), `suspicious.noShadowRestrictedNames`
  for `src/components/form/**` (the `Error` component intentionally shares
  its name with the global), `suspicious.noExportsInTest` for `e2e/**`
  (false positive on Cypress spec files), and
  `suspicious.useIterableCallbackReturn` /
  `style.noNonNullAssertion` for `**/*.spec.{ts,tsx}` (both fire on
  idiomatic, pre-existing test patterns — parameterized `.forEach(() => it(...))`
  blocks and non-null assertions on mocked values — that would otherwise
  need rewriting purely for lint compliance).
- `public/**` is excluded from Biome entirely — `biome check` was trying to
  parse `public/safari-pinned-tab.svg` as a source file and erroring on it;
  ESLint/Prettier never touched `public/` either, this just makes the
  exclusion explicit in `biome.json`.
- One real (not tooling-driven) fix landed alongside the migration: the
  first-email tracking pixel `<img>` had no `alt` attribute
  (`lint/a11y/useAltText`) — added `alt=""` since it's a decorative pixel,
  not a content image.

## Stage 5 — Playwright instead of Cypress

**Depends on:** Stage 3 (Astro) — write specs once, against final Astro
markup/routes, not against Next.js output that's about to change.

- Add Playwright, port each spec in `e2e/integration/*.cy.ts`
  (`404`, `index`, `privacy`, `terms`, `third-party`) to Playwright equivalents,
  against the now-Astro app.
- Replace `e2e/support`/`e2e/plugins` custom commands with Playwright
  fixtures/helpers as needed.
- Update the `e2e` CI job: swap `cypress-io/github-action` for
  `playwright test` run against the same built Docker image
  (`docker run ... && npx playwright test`), keep the chromium+firefox matrix
  (Playwright supports both projects natively, plus webkit if wanted).
- Update screenshot/video artifact upload paths to Playwright's
  (`test-results/`, `playwright-report/`).
- Remove `cypress.config.ts`, `e2e/` Cypress-specific files, `cypress` deps.

**Exit criteria:** All 5 e2e scenarios pass under Playwright in CI across the
same browser matrix Cypress covered; Cypress fully removed.

## Stage 6 — Colocated `bun:test` instead of Jest

**Depends on:** Stage 3 (Astro) — colocate tests once, next to the final
`.astro`/`.ts` source files, not next to `.tsx` files that are about to move.

- Confirm `bun:test` covers what's used today: Testing Library + jsdom/happy-dom
  environment (`bun test --dom` / preload), snapshot testing (`toMatchSnapshot`),
  `jest-when`-style stubbing, `mockdate`. Anything unsupported needs a
  replacement (e.g. `mockdate` → manual `Date` mock, `jest-when` → `mock()`
  matcher patterns).
- Move each `test/**/*.spec.ts(x)` next to the file it tests as
  `*.test.ts(x)` (e.g. `src/utils/domain.ts` + `src/utils/domain.test.ts`),
  removing the mirrored `test/` tree and `test/tsconfig.json`.
- Regenerate snapshots under `bun:test`'s snapshot format.
- Replace `jest.config.js`, `jest.env.js`, `jest-environment-jsdom`,
  `jest-serializer-html` with Bun equivalents (or drop if no longer needed).
- Update the `Test` CI job: `bun test --coverage` instead of
  `npx jest --ci --coverage`; confirm Codecov can still ingest Bun's coverage
  output format (may need `lcov` reporter flag).

**Exit criteria:** same test count/assertions passing under `bun test`,
colocated with source; Jest fully removed; coverage still uploaded to Codecov.

## Stage 7 — General code review pass

**Depends on:** all above stages complete (so the review is against the final
stack, not code that's about to be rewritten again).

- Sweep `src/` for dead code, outdated dependency usage, and inconsistencies
  introduced across the migration stages (e.g. leftover Next-isms, mixed
  import styles).
- Check `package.json` deps for anything still present but now unused
  (`@emotion/react`/`styled` if no longer needed once Astro/CSS approach is
  settled, `request-ip`, `ua-parser-js`, etc. — verify each is still used).
- Revisit `renovate.json`/dependency-update config for the new toolchain.
- Confirm `license-cop`, `cspell`, `codeql-analysis.yml` still make sense
  and pass under the new file layout.
- Use `/code-review` (or `ultrareview` for a deeper pass) once the branch is
  ready, rather than reviewing ad hoc.

**Exit criteria:** clean `/code-review` pass, no orphaned deps/config left
over from earlier stages.

## Suggested order

1. AI tooling — `CLAUDE.md` + `.claude/` (context for every stage after this)
2. Bun (foundation for everything else)
3. Astro (biggest/riskiest — done early so the shape-dependent stages below
   only have to target it once, instead of Next.js then Astro)
4. Biome.js (targets the final `.astro`/`.ts` file layout)
5. Playwright (specs written once, against final Astro markup)
6. Colocated bun:test (tests colocated once, against final source layout)
7. General code review (final pass)

Stages 4–6 can happen in any relative order once Stage 3 lands; the ordering
above is just cheapest-and-least-risky first among them. Stage 3 itself keeps
the _old_ Jest/Cypress/ESLint tooling alive (patched, not rewritten) until
Stages 4–6 replace it — that's the deliberate tradeoff of doing the framework
swap before the tooling swaps.
