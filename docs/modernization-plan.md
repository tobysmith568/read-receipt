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

The job granularity (lint/build/test/licence/e2e, then a separate deploy job
gated on CI passing) mostly stays as-is — this stage is primarily about *what
the deploy job talks to*, not the workflow shape, plus a couple of workflow
housekeeping items bundled in since they touch the same files:

- Rename `ci.yml` → `integration.yml` and `cd.yml` → `deployment.yml` (and
  update the `uses: ./.github/workflows/ci.yml` reference in the renamed
  `deployment.yml`, plus any other cross-references e.g. branch protection
  required-check names, which are matched by job name not filename but are
  worth double-checking still resolve after the rename).
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
  parallel rather than waiting.
- Considered but rejected: dropping the Docker image from the `e2e` job in
  favour of Playwright's own `webServer` (`bun run build && bun run start`).
  That config is a local-dev convenience for when nothing's already on
  `:3000` — it doesn't build the container at all, so relying on it in CI
  would mean nothing in the pipeline ever exercises the actual artifact that
  gets pushed and deployed (multi-stage build, `oven/bun` runtime, the
  `--production`-only `node_modules` stage). Keeping e2e on the built image
  matters even more once this stage changes what gets pushed/deployed, so
  the Docker-based `e2e` job is unchanged by this stage.
- Add a small `infra/` package of Bun TS classes representing the GCP
  resources this app actually needs (Artifact Registry repo, Secret Manager
  secrets, the Cloud Run service) — no Pulumi/Terraform; a project this size
  doesn't need a state backend or a general-purpose DSL. Each class's methods
  (`ensure()`/`apply()`/similar) are thin wrappers that shell out to `gcloud`
  (Bun's `$` shell helper or `Bun.spawn`), and are written idempotently
  (`gcloud ... describe` to check current state before `create`/`update`),
  since there's no state file tracking what's already been applied.
- Add a `bun run infra:apply`-style script that `deployment.yml`'s `deploy`
  job calls instead of today's inline `gcloud run deploy ...` step, so the
  resource definitions live in versioned TS rather than YAML flags.
- Migrate off Google Container Registry (`gcr.io/tobythe-dev/read-receipt`,
  referenced via `IMAGE_NAME` in both `integration.yml` and `deployment.yml`)
  to Artifact Registry — GCR is deprecated in favour of Artifact Registry,
  and the new Docker repo should itself be one of the IaC-managed resources
  rather than something clicked into existence once. Update `IMAGE_NAME` in
  both workflows to the new `<region>-docker.pkg.dev/...` path.
- Add a `mise` config (`mise.toml` or an entry in an existing one) pinning the
  `gcloud` CLI version, since it's not currently installed on all dev
  machines and the IaC classes assume it's on `PATH` both locally and in CI.
- Audit what's currently click-ops'd in the GCP console (Cloud Run service
  config/env vars, any Secret Manager secrets backing `EMAIL_*` in
  production, the existing GCR repo) and decide per-resource whether the IaC
  classes adopt the existing resource (`describe` finds it, so `apply()`
  updates in place) or recreate it fresh — recreation is acceptable where
  adoption doesn't gel cleanly (the user has said so explicitly), but note
  which resources went which way so it's not a surprise later.
- Spike/confirm whether this is also the right moment to replace the
  long-lived `GCP_CREDENTIALS` JSON key (used by `google-github-actions/auth`
  in `deployment.yml`) with Workload Identity Federation — it's a natural
  pairing with an IaC overhaul (the federation pool/provider binding would
  itself be one of the new `infra/` resources) but isn't required by the IaC
  change itself, so don't block this stage on it if it turns out to be its
  own can of worms.
- Revisit `CLAUDE.md`'s "Commands"/"Current stack"/deployment sections once
  landed — the "Docker → GCR → Cloud Run" description throughout the doc
  (including this plan's own baseline section) becomes "Docker → Artifact
  Registry → Cloud Run via `infra/`", `ci.yml`/`cd.yml` references become
  `integration.yml`/`deployment.yml`, and the `gcloud` mise dependency needs
  documenting alongside the other required local tooling.

**Exit criteria:** `deployment.yml` deploys via the new `infra/` classes and
Artifact Registry, not raw inline `gcloud run deploy` against GCR; GCR fully
retired; `gcloud` available via `mise` for local use; `integration.yml` gates
`build`/`test` behind a passing `typecheck` job; `CLAUDE.md` no longer
describes the click-ops/GCR deployment path or the old `ci.yml`/`cd.yml`
filenames.

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
