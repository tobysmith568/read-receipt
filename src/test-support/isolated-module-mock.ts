import { afterEach, beforeEach, mock } from "bun:test";

/**
 * Mocks `specifier`'s exports with `factory()`'s return value for the duration of
 * each test, restoring the real exports afterwards. See docs/testing.md for why
 * this needs to happen per-test rather than once per describe/file.
 *
 * `specifier` must be the `src/...`-rooted form (e.g. `"src/utils/env"`), never a
 * `./`-relative one — `mock.module`/`import()` resolve relative specifiers against
 * this file's own location, not the caller's, so a relative specifier would target
 * the wrong file depending on who calls this helper.
 */
export const isolatedModuleMock = <TModule extends Record<string, unknown>>(
  specifier: string,
  factory: () => TModule
): TModule => {
  const mocked = factory();
  let real: TModule;

  beforeEach(async () => {
    real = { ...(await import(specifier)) } as TModule;
    await mock.module(specifier, () => mocked);
  });

  afterEach(async () => {
    await mock.module(specifier, () => real);
  });

  return mocked;
};
