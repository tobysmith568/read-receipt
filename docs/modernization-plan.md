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

## Stage 5 — Playwright instead of Cypress ✅ done

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

**Outcome / deviations from the plan above:**

- The trickiest part wasn't the spec syntax, it was `e2e/plugins/index.js`'s
  Cypress `task`s (`deleteAllEmails`/`getLastEmail`), which read captured
  emails from an in-process `smtp-tester` instance. Cypress plugins run in the
  same Node process as the test runner, so that in-memory state was directly
  reachable; Playwright test files run in separate worker processes from
  `globalSetup`/`globalTeardown`, so the same in-memory object isn't visible
  to the spec files. Solved by having `e2e/global-setup.ts` start both the
  `smtp-tester` SMTP server *and* a tiny local admin HTTP server
  (`e2e/mail-server.ts`, port 4526) exposing `POST /reset` and
  `GET /last-email?to=`; spec files call it through `e2e/mail-client.ts` via
  plain `fetch`, replacing Cypress's `cy.task` RPC with an equivalent
  same-machine HTTP RPC.
- `cy.get('h1:contains("X")')` (jQuery substring match, non-unique) had no
  direct Playwright equivalent; used `page.getByRole("heading", { level, name,
  exact: true })` instead, which is both idiomatic Playwright and stricter —
  it avoids accidental matches against other headings that merely contain the
  target text as a substring (e.g. `terms.astro`'s "Changes to These Terms and
  Conditions" section heading vs. the page's own "Terms and Conditions" h1).
- `smtp-tester` has no published types; added a minimal
  `e2e/smtp-tester.d.ts` ambient module declaration rather than pulling in
  `@types/smtp-tester` (doesn't exist).
- Because chromium and firefox now run as concurrent Playwright *projects*
  against the same shared mail-server admin process, the Index spec's tests
  were changed to send from a fresh `user+<uuid>@tobysmith.uk` address per
  test (`node:crypto` `randomUUID()`) rather than one fixed address — the
  original Cypress suite never hit this because its two browser runs were
  fully separate CI jobs/containers, each with their own `smtp-tester`
  instance.
- Actually running this suite end-to-end (rather than just porting syntax)
  surfaced two real, pre-existing bugs, both fixed as part of this stage:
  - `src/pages/api/open/[email]/[timestamp].ts` never decoded its `email`
    route param. Astro's router decodes path segments with `decodeURI`, which
    deliberately leaves `%40` (and other reserved-delimiter escapes) alone, so
    nodemailer was receiving `"user%40example.com"` as the recipient and
    failing nodemailer's envelope validation with "No recipients defined" —
    silently, since the
    handler's outer catch swallows all errors before always returning the
    pixel. This means the second ("you just opened this email") email has
    likely been broken on the live site since the Stage 3 Astro migration.
    Fixed with a `decodeURIComponent(email)` in `getQueryArgs`.
  - The ported tracking-pixel regex (copied from the Cypress version) assumed
    `"/>` immediately followed the closing quote of the `<img>`'s `src`
    attribute; that stopped matching once Stage 4 added `alt=""` to the same
    `<img>` for `lint/a11y/useAltText`, so the regex silently never matched
    from that point on. Rewritten to tolerate attributes between `src="..."`
    and the self-closing `/>`.
- CI matrix renamed `[chrome, firefox]` → `[chromium, firefox]` (Playwright's
  project names); added a `bunx playwright install --with-deps <browser>`
  step and a `bunx wait-on http://localhost:3000` step (Cypress's GitHub
  Action bundled both internally, Playwright's CLI doesn't).
- `biome.json`'s `e2e/**` override (`Cypress`/`cy` globals,
  `noExportsInTest: "off"`) and the `!e2e/downloads` files ignore were dropped
  entirely — Playwright specs don't need Cypress's global test API and don't
  export anything, and there's no download-testing equivalent in use.

## Stage 6 — Colocated `bun:test` instead of Jest ✅ done

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

**Outcome / deviations from the plan above:**

- `bun:test` has no auto-mocking (`jest.mock("module")` + `jest.mocked(fn)`) —
  every mocked module became an explicit `mock.module(specifier, factory)` with
  hand-built `mock()` instances. That surfaced a much bigger issue than
  expected: `mock.module` replaces a module's exports **process-wide**, not
  just for the file that calls it, and mutates them **in place** — capturing
  `await import(id)` once and handing that same namespace object back to
  `mock.module` to "restore" it later does not work, since the captured
  reference reflects whatever the module was most recently mocked as by the
  time you read it back. With every spec file's mocking initially done at
  module top-level, one file mocking `src/utils/env.ts` silently leaked into
  every other colocated test that imports the real module, in a way that
  depended on file/test execution order — invisible in a normal run, but
  reliably reproducible with `bun test --randomize`. Rather than leave this as
  a footgun to re-solve per file, it's factored into a single helper,
  `src/test-support/isolated-module-mock.ts`, that captures the real
  implementation and registers/restores the mock around every individual test
  (`beforeEach`/`afterEach`, not once per describe — so a skipped test never
  leaves a mock in place for the next one). Confirmed correct with a standalone
  repro (including concurrent mocking of the same module from three separate
  `describe`s under `--randomize`) before rewriting the real spec files against
  it. `docs/testing.md` documents the pattern and its constraints (in
  particular: pass the `src/...`-rooted specifier form, never a `./`-relative
  one, since `mock.module`/`import()` inside the helper resolve relative to
  the helper's own file, not the caller's) — `CLAUDE.md` points here instead of
  repeating the explanation inline.
- `jest.resetAllMocks()` (via `bun:test`'s `jest` compat namespace) silently
  does **not** reset mocks created with `bun:test`'s own `mock()` — confirmed
  with a minimal repro. Only visible under `--randomize`, since the normal
  file/declaration order happened to mask it. Every `beforeEach` now calls
  `.mockReset()` on each named mock instance directly instead of a bulk
  "reset everything" call.
- `jest.isolateModules(() => require("src/utils/email"))` existed only because
  `src/utils/email.ts` built the nodemailer transport as an import-time side
  effect. Rather than find a `bun:test` workaround, `email.ts` was refactored so
  `sendHtml` builds the transporter itself on every call — a real (small,
  low-risk) source change, not just a test-only one, and it removes the need
  for module re-isolation entirely.
- `jest-when`'s single call site (`printTimestamp` returning different values
  per argument) became a plain `mockImplementation` branching on the argument —
  not worth keeping the dependency for one usage.
- `mockdate` → `bun:test`'s built-in `setSystemTime`/`useFakeTimers`, no
  separate package needed.
- `jest-serializer-html` (a custom Jest snapshot serializer, unsupported by
  `bun:test`) was replaced by calling its underlying formatter, `diffable-html`,
  directly on the string before `toMatchSnapshot()` — confirmed byte-identical
  output by reading `jest-serializer-html`'s source first.
- DOM environment: only `src/utils/user-agent.test.ts` touches `window`/
  `navigator` (spying on `navigator.userAgent` so `ua-parser-js` doesn't fall
  back to the test runner's own UA string). The plan's assumption of a global
  `happy-dom` preload (`bunfig.toml` + `@happy-dom/global-registrator`) broke
  `src/utils/domain.test.ts`: happy-dom's `Request`/`Headers` silently strips
  the `host` header (forbidden by the Fetch spec) that `getDomainForRequest`
  reads, which Bun's own native `Request` does not enforce. Fixed by
  registering/unregistering happy-dom locally inside `user-agent.test.ts`'s
  `beforeAll`/`afterAll` instead of globally, and dropping `bunfig.toml`
  entirely. Also, `bun:test`'s `spyOn` doesn't yet support accessor properties
  (`spyOn(obj, "userAgent", "get")` throws), so that one spy uses
  `Object.defineProperty` directly instead.
- `tsconfig.json`'s exclude glob moved from `**/*.spec.ts(x)` to
  `**/*.test.ts(x)`, and `test/tsconfig.json` was deleted outright — colocated
  tests share the root config instead of needing their own. Added `@types/bun`
  as a devDependency so `bun:test` types resolve for both the CLI and editors
  (nothing previously pulled it in).
- `biome.json`'s override glob for the relaxed test-file rules
  (`noNonNullAssertion`, `useIterableCallbackReturn`, etc.) moved from
  `**/*.spec.{ts,tsx}` to `**/*.test.{ts,tsx}`; the now-unneeded
  `jest.config.js`/`jest.env.js` override was deleted.
- `package.json`'s `test` script is `bun test src`, not a bare `bun test` —
  the latter would also try to run the Playwright specs under `e2e/`.
- Found but deliberately left for Stage 7: `@testing-library/dom`,
  `@testing-library/jest-dom`, `@testing-library/react`, and
  `@testing-library/user-event` are unused by anything in `src/` (the tests
  that used them were the Next-era page snapshot tests, dropped back in
  Stage 3) — they're only still installed because `@testing-library/jest-dom`
  declares `jest` as a peer dependency, which is why `jest` itself still shows
  up in `node_modules` despite being fully removed from this project's own
  config/scripts.

## Stage 7 — General code review pass ✅ done

**Depends on:** all above stages complete (so the review is against the final
stack, not code that's about to be rewritten again).

Pre-review sweep confirmed most of this doc's original open questions are
already resolved by earlier stages; the concrete remaining work is narrower
than originally scoped:

- Remove `@testing-library/dom`, `@testing-library/jest-dom`,
  `@testing-library/react`, `@testing-library/user-event` from
  `package.json` — confirmed unused anywhere in `src/`/`e2e/` (flagged but
  deliberately deferred in Stage 6's outcome notes). `@testing-library/jest-dom`
  is the sole reason `jest` still resolves in `bun.lock` as a transitive peer
  dep despite being fully removed from config/scripts in Stage 6 — removing
  these four should drop `jest` out of the lockfile too; confirm with
  `bun install` + `grep -c '"jest"' bun.lock` after.
- Other deps flagged as "verify still used" in the original plan are already
  confirmed live and should stay: `@emotion/react`/`styled` (form components,
  `src/components/form/*`, `link-button.tsx`), `axios` (`utils/ip.ts`,
  `use-submit-email.ts`), `ua-parser-js` (`utils/user-agent.ts`), `dayjs`
  (`utils/time.ts`). `request-ip` is already gone (removed in Stage 3) — no
  action needed there.
- Sweep `src/` for dead code and inconsistencies introduced across migration
  stages (leftover Next-isms, mixed import styles) — a first pass found none
  (no `next/`-style imports, no `getStaticProps`/`_app`/`_document` remnants),
  but re-check once the testing-library removal above lands.
- `renovate.json` still just extends the external shared config
  (`local>tobysmith568/renovate-config`); Stage 2 left "confirm it understands
  `bun.lock`" as an open spike — since Renovate has presumably opened PRs
  against this repo in the time since, check its recent PR/dependency-dashboard
  history for evidence it's already handling `bun.lock` correctly rather than
  re-spiking from scratch.
- `cspell.json`, `codeql-analysis.yml`, `.vscode/*` all reviewed and already
  consistent with the current stack (correct excludes, `language: javascript`
  still correct for Astro/TS, no stale extension recommendations) — no
  changes needed. `license-cop`'s config was *also* reviewed and looked fine
  by inspection, but — see the outcome notes below — inspecting the config
  file isn't the same as running the tool, and it was in fact failing.
- Minor inconsistency found: `README.md`'s copyright line is hardcoded
  `Copyright © 2020-2024 Toby Smith`, while the site footer already reads the
  current year from build-time `PUBLIC_YEAR` (`src/components/Footer.astro`,
  landed in the Astro migration) — reconcile so the README isn't the one
  place still going stale year over year (either drop the end year, or note
  it's intentionally fixed at first-publication year — confirm with the repo
  owner which is intended before changing).
- Use `/code-review` (or `ultrareview` for a deeper pass) once the dep/dead-code
  cleanup above is committed, rather than reviewing ad hoc.

**Exit criteria:** clean `/code-review` pass, no orphaned deps/config left
over from earlier stages, `bun.lock` no longer resolves `jest`.

**Outcome / deviations from the plan above:**

- Removed `@testing-library/dom`, `@testing-library/jest-dom`,
  `@testing-library/react`, `@testing-library/user-event` from
  `package.json`; `bun install` confirmed both `jest` and `testing-library`
  drop out of `bun.lock` entirely (`grep -c` for each returns `0`). `bun run
  lint` and `bun run test` both still pass (146 tests, 0 fail) — nothing was
  quietly relying on them.
- Dead-code sweep found nothing to clean up: no `next/`-style imports, no
  `getStaticProps`/`_app`/`_document` remnants, no stray `jest.*` calls
  outside `package.json`, no mixed React import styles. The migration stages
  left the tree cleaner than the plan assumed.
- `renovate.json` needed no changes — checked recent PR history via `gh pr
  list` and found #229 ("Update dependency nodemailer to v8") merged cleanly
  post-Stage-2, plus a steady stream of 2026-dated PRs, confirming Renovate
  already understands `bun.lock` without any config changes.
- Found (but deliberately left alone) stale open Renovate PRs targeting
  dependencies removed in earlier stages — #227 (`next` → v15), #156
  (`eslint` → v9), and possibly others. Rather than closing them by hand,
  decided to let Renovate's own reconciliation close them automatically next
  time it runs (it detects the dependency no longer exists and closes/skips
  the PR itself) — no manual GitHub action taken.
- `cspell.json`, `codeql-analysis.yml`, and `.vscode/*` were all reviewed and
  required no changes — already consistent with the current stack.
- `license-cop` was initially (wrongly) signed off as "no changes needed" from
  reading `.licenses.json` alone — actually running `bunx license-cop` (as
  CI's `licence` job does) failed. Root cause: `license-cop` (even at the
  latest npm release, 1.9.0, checked directly against its source) has no Bun
  awareness at all — its package-manager detection only recognizes
  `npm`/`yarn`/`pnpm` lockfiles/`packageManager` fields, so with no
  `package-lock.json`/`yarn.lock`/`pnpm-lock.yaml` present it silently falls
  back to treating the project as npm and scans via `@npmcli/arborist`'s
  `loadActual()`. That part still classifies dev-vs-prod dependencies
  correctly (verified: dev-only packages like `smtp-tester`/`axe-core` are
  excluded by default, exactly as before Bun); the actual failures were three
  legitimately new *production*-transitive dependencies pulled in by Astro's
  own tree that were never vetted:
  - `satteri` (+ its `@bruits/satteri-linux-x64-*` native binaries) — Astro's
    markdown parser — flagged as unlicensed only because upstream's
    `package.json` omits the `license` field; its bundled `LICENSE` file is
    plain MIT (confirmed by reading it directly).
  - `argparse` (Python-2.0) via `astro → js-yaml → argparse` (YAML
    frontmatter parsing at build time).
  - `lightningcss` (+ native binaries, MPL-2.0) via `astro`/`@astrojs/react →
    vite` (build-time CSS transform).
  - `@img/sharp-libvips-*` (LGPL-3.0-or-later) via Astro's *optional*
    image-optimization support (`sharp`) — confirmed unused anywhere in
    `src/` (no `astro:assets`/`getImage`/`<Image>`).
  Resolved as: renamed `.licenses.json` → `.licenses.jsonc` (license-cop
  supports both; `.jsonc` allows the explanatory comments below to live next
  to the rules they justify) and allow-listed `satteri` (+ native binaries),
  `argparse`, and `lightningcss` (+ native binaries) by package name in
  `packages`, plus added `Python-2.0` and `MPL-2.0` to `licenses` — confirmed
  Python-2.0 is genuinely permissive (MIT-equivalent for this purpose), and
  MPL-2.0's file-level copyleft doesn't trigger here since `lightningcss` is
  used unmodified, not vendored/patched. Separately, `sharp`/`@img/sharp-libvips-*`
  were also added to `Dockerfile`'s `prod-deps` stage via `--omit=optional`
  (confirmed with a clean-`node_modules` local install that this actually
  drops them from what ships) — allow-listed in `.licenses.jsonc` too, since
  CI's `licence` job runs a full (non-`--production`) install where they're
  still present on disk; scanning against a `--production`-only install
  isn't viable because `license-cop`'s own `extends: "@license-cop/permissive"`
  requires that (dev-dependency) package to be present to resolve. Verified
  clean with `bunx license-cop` (exit 0, "No issues found") after all changes,
  and re-ran `bun run lint`/`bun run test` (146 pass) to confirm nothing else
  regressed from the `node_modules` churn during investigation.
- Bumped the copyright end year in both `README.md` and `LICENSE.md` from
  `2020-2024` to `2020-2026` (a plain static edit, not templated) — decided
  against wiring these through `PUBLIC_YEAR` like the footer, since neither
  file goes through the Astro build pipeline; the tradeoff is these two need
  a manual bump each time this stage (or an equivalent later pass) runs,
  unlike the footer.

## Stage 8 — CI/CD overhaul: IaC instead of click-ops GCP

**Depends on:** all above stages complete — this targets the final Bun/Astro/
Docker shape, and stage 7 already confirmed the repo's config/deps are clean,
so this is the last remaining "the code is modern but the deployment path
still predates it" gap.

**Pre-implementation audit (done as part of planning this stage, live against
the real `tobythe-dev` GCP project):**

- `gcloud` wasn't installed locally — added via `mise` (`mise.toml`/
  `mise.lock`, matching the `[settings] lockfile = true` / `gcloud = "latest"`
  convention already used in the `npm-versions` repo's `mise.toml`) rather
  than inventing a new pinning style.
- Artifact Registry already has a `read-receipt` Docker repo in
  `europe-west1` (created 2022-03-19, empty, 0 images) — this stage doesn't
  need to *create* the Artifact Registry repo, just start pushing to it and
  point `IMAGE_NAME` at it. It's adopted by the IaC class, not recreated.
- The live Cloud Run service `read-receipt` has been running since 2021 with
  real traffic on the custom domain — adopted as-is, not recreated. Its
  `containerPort` is `8080` (not `3000`, despite the Dockerfile's
  `ENV PORT=3000`/`EXPOSE 3000`) — Cloud Run injects its own `PORT` env var
  matching `containerPort` at runtime, overriding the image's baked-in `ENV`,
  so this is not a bug; the IaC `CloudRunService` class leaves `containerPort`
  at `8080` rather than "fixing" it to match the Dockerfile — changing a port
  that's proven working in production for years is an unforced, unrelated
  risk to bundle into this stage.
- Found a real security gap: `EMAIL_USER`/`EMAIL_PASS` (a live AWS SES SMTP
  key) sit as **plaintext Cloud Run env vars** today, with no Secret Manager
  secrets for this app at all (only `rss-feed` uses Secret Manager currently).
  This stage fixes it (see "Secrets" below) rather than just auditing and
  leaving it.
- Found a real long-lived-credential risk: the deploy service account
  (`read-receipt@tobythe-dev.iam.gserviceaccount.com`, backing
  `GCP_CREDENTIALS`) has 4 keys, including one created 2022-03-19 with **no
  expiry** (`9999-12-31`). Given this isn't hypothetical, Workload Identity
  Federation is pulled into this stage's scope rather than left as an
  optional/deferred spike (see "Workload Identity Federation" below).
- The GCR image bucket (`gs://artifacts.tobythe-dev.appspot.com`) is **shared**
  with other unrelated services in the same project (`rss-feed`,
  `tobythe-dev`, `totp-online`, `row-counter-api` all show up as Cloud Run
  services in this project) — "retire GCR" for this stage cannot mean
  deleting the bucket. It means: stop pushing/pulling `read-receipt` images
  via `gcr.io`, and delete only the old `gcr.io/tobythe-dev/read-receipt`
  image tags/manifests once the new pipeline is confirmed working.
- Checked branch protection on `main`: **none configured**. The original
  plan's worry about the `ci.yml`→`integration.yml` rename breaking
  required-status-check names is moot — there's nothing to reconcile.
- Found two orphaned GitHub secrets while auditing what feeds the deploy job:
  repo-level `FOSSA_API_KEY` (predates `license-cop`, unreferenced by any
  workflow) and Production-environment `GCP_EMAIL` (created the same day as
  `GCP_CREDENTIALS` in 2022, never referenced by any workflow — looks like an
  abandoned attempt at exactly the EMAIL_* delivery problem this stage
  solves properly). Both deleted as part of this stage's cleanup rather than
  left as unexplained residue.
- Checked the deploy SA's current IAM roles: `run.developer`,
  `iam.serviceAccountUser`, `storage.admin` (leftover from GCR's GCS-backed
  storage), `containerregistry.ServiceAgent`. **Missing** `artifactregistry.writer`
  and a Secret Manager write role — without granting these, `infra:apply`'s
  first real run fails outright. See "IAM grants" below for where these get
  added.
- Bigger finding: the Cloud Run service's **runtime** SA (the identity the
  app itself runs as — distinct from the deploy SA above) is the project's
  **default compute service account**, which holds **`roles/editor`** —
  project-wide write access. That's a materially larger blast radius than the
  plaintext SMTP creds (a public-facing demo app effectively running with
  near-owner rights on the whole GCP project), and granting Secret Manager
  read access to *this* SA for the `--set-secrets` change would otherwise
  mean granting it to an already-overprivileged identity. Fixed as part of
  this stage — see "Runtime service account" below.
- Confirmed the custom domain mapping (`read-receipt.tobythe.dev` →
  `read-receipt` service, `gcloud beta run domain-mappings list`) is keyed to
  the Cloud Run *service name*, not any identity/revision — adopting the
  existing service (rather than recreating it) leaves this untouched, no
  action needed.
- Confirmed `FORCE_HTTP`'s absence from the live service's env vars today is
  correct, not a gap: `src/utils/domain.ts` only forces `http://` links when
  `env.dev.isDev || env.forceHttp`, and production is neither — it's an
  override solely for `docker compose up app` (TLS-terminated by nothing),
  not something a real Cloud Run deployment (TLS-terminated by Cloud Run
  itself) should ever set. No change needed here.

The job granularity (lint/build/test/licence/e2e, then a separate deploy job
gated on CI passing) mostly stays as-is — this stage is primarily about *what
the deploy job talks to*, not the workflow shape, plus a couple of workflow
housekeeping items bundled in since they touch the same files:

- Rename `ci.yml` → `integration.yml` and `cd.yml` → `deployment.yml` (and
  update the `uses: ./.github/workflows/ci.yml` reference in the renamed
  `deployment.yml`). No branch-protection required-check names to reconcile
  (confirmed above — none exist).
- Give both workflows more informative top-level `name:` keys by
  interpolating the triggering ref, e.g. `name: Integration (${{
  github.ref_name }})` / `name: Deployment (${{ github.ref_name }})` — useful
  since `integration.yml` runs across `renovate/*` pushes, PRs to `main`, and
  as a reusable `workflow_call` from `deployment.yml`, so the ref alone
  currently isn't visible at a glance in the Actions run list.
- Add a `typecheck` job to `integration.yml`: just `tsc --noEmit` over the
  project (add a `typecheck` script to `package.json` alongside `lint`/
  `test`) — not `astro check`, plain `tsc` is enough per current scope. `build`
  and `test` should depend on it (`needs: typecheck`) so a type error fails
  fast before spending time on a Docker build or the test run; `lint` and
  `licence` stay independent (Biome doesn't need TS's type info, and
  license-cop doesn't touch app code at all) so they keep running in
  parallel rather than waiting. `infra/**/*.ts` is added to root
  `tsconfig.json`'s `include` (rather than getting its own `tsconfig.json`)
  so this one `typecheck` script/job covers `src/` and `infra/` together.
- Considered but rejected: dropping the Docker image from the `e2e` job in
  favour of Playwright's own `webServer` (`bun run build && bun run start`).
  That config is a local-dev convenience for when nothing's already on
  `:3000` — it doesn't build the container at all, so relying on it in CI
  would mean nothing in the pipeline ever exercises the actual artifact that
  gets pushed and deployed (multi-stage build, `oven/bun` runtime, the
  `--production`-only `node_modules` stage). Keeping e2e on the built image
  matters even more once this stage changes what gets pushed/deployed, so
  the Docker-based `e2e` job is unchanged by this stage.

### `infra/` package design

- One Bun TS class per resource type — no Pulumi/Terraform; a project this
  size doesn't need a state backend or a general-purpose DSL:
  - `infra/resources/artifact-registry-repo.ts`
  - `infra/resources/secret-manager-secret.ts`
  - `infra/resources/cloud-run-service.ts`
  - `infra/resources/workload-identity-pool.ts`
  Each class has an `apply()` that shells out to `gcloud` (Bun's `$` shell
  helper or `Bun.spawn`) and is idempotent — `describe` current state first,
  then `create`/`update` only if something actually differs — since there's
  no state file tracking what's already been applied.
- Two entrypoints, not one, split by *who* runs them and *how much trust*
  they need:
  - `bun run infra:apply` (`infra/apply.ts`) — run by `deployment.yml`'s
    `deploy` job on every push to `main`, authenticated via WIF. Manages only
    the Artifact Registry repo, the Secret Manager secrets, and the Cloud Run
    service, in that dependency order.
  - `bun run infra:bootstrap` (`infra/bootstrap.ts`) — run manually, locally,
    by a human with project-owner access. Manages the WIF pool/provider/IAM
    binding only. **Deliberately excluded from `infra:apply`/CI**: if CI's own
    service account could modify its own trust policy, a malicious or buggy
    PR merged to `main` could theoretically widen the trust condition to
    grant itself persistent access. Keeping WIF-management out of anything
    CI ever runs closes that off entirely.
- Secret Manager updates are idempotent in the way that matters for cost, not
  just for correctness: `SecretManagerSecret.apply()` reads the current
  latest version's value and only adds a new version if the desired value
  has actually changed — every version costs money, so a no-op deploy must
  not churn versions.
- Unit test coverage (`bun:test`) is limited to each class's create/update/skip
  *decision* logic (e.g. "given this mocked `describe` output and this desired
  state, does `apply()` choose to create, update, or skip?") — not full
  end-to-end mocking of `gcloud`'s real behaviour, which can only actually be
  verified by running it against GCP.

### Secrets

- `EMAIL_USER`/`EMAIL_PASS` (and any other `EMAIL_*` that shouldn't be
  plaintext) move from Cloud Run env vars to Secret Manager secrets, created/
  updated by `SecretManagerSecret` and referenced on the Cloud Run service via
  `--set-secrets` instead of `--set-env-vars`.
- The desired values themselves come from **new** Production-environment
  GitHub secrets (not the old, unused `GCP_EMAIL`, which is deleted rather
  than repurposed — no confirmed history of what it was for), passed into
  `infra:apply`'s environment at deploy time.

### IAM grants

- Same chicken-and-egg shape as WIF: the deploy SA can't grant itself
  permissions it doesn't already have, so its missing roles
  (`artifactregistry.writer` on the `read-receipt` Artifact Registry repo, and
  a Secret Manager role covering create-secret + add-version + read-latest-
  version, e.g. `roles/secretmanager.admin` scoped project-wide since
  `infra:apply` needs to create secrets that don't exist yet and resource-
  level IAM can't be assigned before the resource exists) are granted by
  `infra:bootstrap`, not `infra:apply` — consistent with keeping every
  IAM-grant-shaped action out of anything CI runs routinely.

### Runtime service account

- `infra:bootstrap` creates a new, narrowly-scoped runtime SA (e.g.
  `read-receipt-runtime@tobythe-dev.iam.gserviceaccount.com`) and grants it
  only `secretmanager.secretAccessor` on the specific `EMAIL_*` secrets —
  nothing else. Same reasoning as the IAM grants above: creating a service
  account and granting it access is IAM-admin-shaped, so it belongs in the
  manual bootstrap step, not CI's routine apply.
- `infra:apply`'s `CloudRunService` class switches the service's runtime
  identity to this new SA (just references its email — deploying a Cloud Run
  revision to run as a given SA only needs `run.developer` +
  `iam.serviceAccountUser`, which the deploy SA already has) and away from
  the default compute SA's project-wide `roles/editor` — closing a larger,
  pre-existing security gap than the one this stage originally set out to
  fix, using IAM work this stage is already doing.

### Workload Identity Federation

- Pulled into this stage's scope (not deferred) given the no-expiry key found
  in the audit above.
- Reuses the existing `read-receipt@tobythe-dev.iam.gserviceaccount.com`
  service account (already holds the right IAM roles from years of successful
  deploys) rather than provisioning a fresh one — only *how* GitHub Actions
  authenticates as it changes.
- Trust condition scoped tightly: `attribute.repository ==
  'tobysmith568/read-receipt'` AND `attribute.ref == 'refs/heads/main'`,
  matching `deployment.yml`'s existing trigger exactly.
- Bootstrap order (resolves the chicken-and-egg problem: `deployment.yml`
  can't authenticate via WIF until the pool already exists): run
  `bun run infra:bootstrap` locally once (as project owner, already
  authenticated), confirm `deployment.yml` deploys successfully once switched
  to WIF, *then* revoke all 4 existing SA keys on
  `read-receipt@tobythe-dev.iam.gserviceaccount.com`. Update
  `deployment.yml`'s `google-github-actions/auth` step from
  `credentials_json: ${{ secrets.GCP_CREDENTIALS }}` to
  `workload_identity_provider: ...` accordingly, and remove the
  `GCP_CREDENTIALS` GitHub secret once the keys are revoked.

### Artifact Registry / GCR migration

- Update `IMAGE_NAME` in both workflows from `gcr.io/tobythe-dev/read-receipt`
  to `europe-west1-docker.pkg.dev/tobythe-dev/read-receipt` (the existing,
  already-created repo — see audit above).
- Tag pushed images with both `:latest` and `:${{ github.sha }}`; the
  `CloudRunService` class deploys by the sha-tagged reference, not `:latest`
  — gives real rollback capability and removes ambiguity about which image a
  given revision is running, a natural pairing with introducing `infra/` as
  the deploy mechanism (the current build step tags with no explicit tag at
  all, i.e. implicitly `:latest` only, with no rollback-by-tag today).
- Once the new pipeline is confirmed working, delete the old
  `gcr.io/tobythe-dev/read-receipt` image tags/manifests (not the shared
  bucket — see audit above for why the whole bucket is out of scope).

### Cleanup bundled into this stage

- Delete orphaned GitHub secrets `FOSSA_API_KEY` (repo-level) and `GCP_EMAIL`
  (Production-environment) — both confirmed unreferenced by any workflow.
- Revisit `CLAUDE.md`'s "Commands"/"Current stack"/deployment sections once
  landed — the "Docker → GCR → Cloud Run" description throughout the doc
  (including this plan's own baseline section) becomes "Docker → Artifact
  Registry → Cloud Run via `infra/`", `ci.yml`/`cd.yml` references become
  `integration.yml`/`deployment.yml`, and the `gcloud` mise dependency needs
  documenting alongside the other required local tooling. Also document the
  `infra:apply` vs `infra:bootstrap` split and why WIF management is
  deliberately excluded from CI.

**Exit criteria:** `deployment.yml` deploys via the new `infra/` classes
(Artifact Registry + Secret Manager + Cloud Run) authenticated via Workload
Identity Federation, not raw inline `gcloud run deploy` with a long-lived
JSON key against GCR; GCR fully retired for `read-receipt` (repointed, old
image tags deleted); all 4 old SA keys revoked; `EMAIL_USER`/`EMAIL_PASS` live
in Secret Manager, not plaintext env vars; the Cloud Run service runs as the
new narrowly-scoped runtime SA, not the default compute SA's project-wide
`roles/editor`; the deploy SA holds exactly the roles `infra:apply` needs
(granted via `infra:bootstrap`), no more; orphaned `FOSSA_API_KEY`/
`GCP_EMAIL` secrets removed; `gcloud` available via `mise` for local use;
`integration.yml` gates `build`/`test` behind a passing `typecheck` job that
also covers `infra/`; `CLAUDE.md` no longer describes the click-ops/GCR/
static-key/`roles/editor` deployment path or the old `ci.yml`/`cd.yml`
filenames.

**Outcome / deviations from the plan above:**

- `typescript` was pinned `^5.0.0` and resolving to 5.0.2 — too old to parse
  `@vitejs/plugin-react`'s `.d.ts` (`export { X as "module.exports" }`,
  string-literal export aliasing), which made the new `typecheck` script fail
  immediately on `main`, unrelated to anything in `infra/`. Bumped to
  `typescript@6.0.3`; not otherwise in scope for this stage, but blocking its
  own exit criteria without the fix.
- GitHub Actions' workflow-level `name:` key doesn't support `${{ }}`
  expressions (only `run-name:` does) — the plan's ref-interpolated `name:`
  idea landed as a static `name:` plus a separate `run-name:` using the
  interpolation instead.
- Bun's `$` shell template parses literal parentheses in the command text as
  shell syntax, not string content — a `gcloud ... --format=value(projectNumber)`
  call failed with `Unexpected token: "("`. Fixed by building that flag as a
  plain JS string and interpolating the whole thing, rather than writing it
  inline in the template.
- Full pre-CI validation, done live against `tobythe-dev` before trusting any
  of this to run unattended: ran `infra:bootstrap` (creating the WIF pool/
  provider, granting the deploy SA its missing roles, seeding both secrets,
  creating the runtime SA + its secret-access grant), confirmed it's
  idempotent by re-running it immediately after (no duplicate resources, no
  new secret versions — `gcloud secrets versions list` stayed at version 1
  for both). Then built the real Docker image locally, pushed it to Artifact
  Registry, and ran `infra:apply` for real against the live Cloud Run
  service — confirmed the resulting revision picked up the Artifact Registry
  image, the new `read-receipt-runtime@` service account, and
  Secret-Manager-backed `EMAIL_USER`/`EMAIL_PASS`. Submitted the live email
  form afterward to confirm the tracking-pixel flow's SMTP send still works
  end-to-end with credentials now sourced from Secret Manager rather than
  plaintext — it does. The site never went down during any of this; Cloud
  Run only swaps traffic to a new revision once it's ready.
- Secret naming follows the existing `rss-feed` convention in the same
  project (PascalCase-hyphenated) rather than inventing a new one:
  `Read-Receipt-Email-User`, `Read-Receipt-Email-Pass`.
- `infra/`'s Secret Manager `create()`/`addVersion()` had to use `Bun.spawn`
  with piped stdin rather than Bun's `$` shell helper — `gcloud secrets
  create ... --data-file=-` needs the secret value written to the
  subprocess's stdin, which `$` doesn't expose as directly as `Bun.spawn`'s
  `stdin: "pipe"`.

## Suggested order

1. AI tooling — `CLAUDE.md` + `.claude/` (context for every stage after this)
2. Bun (foundation for everything else)
3. Astro (biggest/riskiest — done early so the shape-dependent stages below
   only have to target it once, instead of Next.js then Astro)
4. Biome.js (targets the final `.astro`/`.ts` file layout)
5. Playwright (specs written once, against final Astro markup)
6. Colocated bun:test (tests colocated once, against final source layout)
7. General code review (final pass)
8. CI/CD overhaul — IaC instead of click-ops GCP (last, since it targets the
   final deployment artifact produced by every stage above)

Stages 4–6 can happen in any relative order once Stage 3 lands; the ordering
above is just cheapest-and-least-risky first among them. Stage 3 itself keeps
the _old_ Jest/Cypress/ESLint tooling alive (patched, not rewritten) until
Stages 4–6 replace it — that's the deliberate tradeoff of doing the framework
swap before the tooling swaps.
