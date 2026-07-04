# Testing notes

This repo uses `bun:test`, colocated with source as `*.test.ts(x)` (e.g.
`src/utils/domain.ts` ↔ `src/utils/domain.test.ts`). Most of it behaves like
Jest, but a few things don't — this file covers the ones worth knowing before
writing a new test, especially anything that mocks a sibling module.

## Mocking a module: use `isolatedModuleMock`

`mock.module(id, factory)` replaces a module's exports **process-wide** — for
every file in the same `bun test` run, not just the file that called it. Doing
that mocking (and capturing the real implementation to restore it) at file top
level, or once per describe via `beforeAll`/`afterAll`, can leak into other
colocated test files that import the real module — invisible in a normal run,
only showing up under `bun test --randomize`. Getting the restore itself right
is also easy to get wrong: `mock.module` mutates a module's exports **in
place**, so capturing `const realModule = await import(id)` and later
restoring with `mock.module(id, () => realModule)` does not work — `realModule`
is a live reference to the same object `mock.module` mutates, so by the time
you restore it, it already reflects whatever it was most recently mocked as.

`src/test-support/isolated-module-mock.ts` wraps all of this correctly — use it
instead of hand-rolling `mock.module`/`beforeEach`/`afterEach` in a new test:

```ts
import { isolatedModuleMock } from "../test-support/isolated-module-mock";
import type { getEnv as GetEnv } from "./env";

describe("domain utils", () => {
  const mockedGetEnv = isolatedModuleMock("src/utils/env", () => ({
    getEnv: mock<typeof GetEnv>()
  })).getEnv;

  // ...tests, calling mockedGetEnv.mockReturnValue(...) etc.
});
```

It mocks and restores the module around **every test**, not once per
describe/file, so a skipped test never leaves a mock in place for the next one
to inherit. Pass the `src/...`-rooted form of the specifier (matching the
`"src/*"` path in `tsconfig.json`), never a `./`-relative one — `mock.module`
and `import()` resolve relative specifiers against
`isolated-module-mock.ts`'s own location, not the call site, so a relative
specifier would silently target the wrong file depending on which test file
called it. Bun's module registry is keyed by resolved file path, not specifier
text, so mocking the `src/...` form still intercepts the module even though
the source under test imports it via a relative path (e.g. `./env`).

## `jest` compat namespace gaps

`bun:test` exports a `jest` namespace (`jest.fn`, `jest.spyOn`,
`jest.resetAllMocks`, etc.) for easier porting from Jest. `jest.resetAllMocks()`
looked like the obvious replacement for Jest's bulk reset in `beforeEach`, but
it silently does **not** reset mocks created with `bun:test`'s own `mock()` —
confirmed with a minimal repro, only visible under `--randomize` since normal
declaration order happened to mask the leak. Call `.mockReset()` on each named
mock instance directly instead:

```ts
beforeEach(() => {
  mockedGetEnv.mockReset();
  mockedCreateTransport.mockReset();
});
```

## DOM environment: opt in per-file, not globally

Most tests here are plain Node/Fetch-API code and don't need a DOM. Only
`src/utils/user-agent.test.ts` touches `window`/`navigator`, so it registers
`happy-dom` (`@happy-dom/global-registrator`) locally in its own
`beforeAll`/`afterAll` rather than globally via a `bunfig.toml` preload.

This is deliberate, not just minimalism: happy-dom's `Request`/`Headers`
implementation strips the `host` header (forbidden by the Fetch spec), which
`src/utils/domain.test.ts` relies on reading via `request.headers.get("host")`.
Bun's own native `Request` doesn't enforce that restriction. Registering
happy-dom globally for the whole test run breaks `domain.test.ts`'s tests.

Also, `bun:test`'s `spyOn` doesn't yet support accessor properties
(`spyOn(obj, "userAgent", "get")` throws `does not support accessor properties
yet`), so `user-agent.test.ts` overrides the getter directly with
`Object.defineProperty` instead of `spyOn`.

## Snapshot serializers

`bun:test` doesn't support Jest's custom snapshot serializer plugins. The
email template tests (`src/emails/*.test.tsx`) used to rely on
`jest-serializer-html` to pretty-print HTML before snapshotting; instead they
call its underlying formatter, `diffable-html`, directly on the rendered string
before `toMatchSnapshot()`:

```ts
expect(toDiffableHtml(result).trim()).toMatchSnapshot();
```

## Faking time

Use `bun:test`'s built-in `setSystemTime(date)` / `setSystemTime()` (reset) —
no `mockdate`-equivalent package needed.
