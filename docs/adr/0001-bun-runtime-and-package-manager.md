# Bun as runtime and package manager, instead of Node/npm

The project migrated off Node 20 + npm to Bun for installs, script running, and `bun:test`, with the Docker runner stage switching from `node:*` to `oven/bun`. Astro's `@astrojs/node` adapter (standalone mode) still produces a plain Node-compatible entry script — there's no widely-maintained native Bun adapter worth adopting for an app this size — so that output is run as `bun ./dist/server/entry.mjs` rather than under `node`, which was confirmed to work rather than assumed.
