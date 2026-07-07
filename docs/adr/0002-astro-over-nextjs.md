# Astro instead of Next.js, served via the Node adapter under Bun

The app moved from Next.js (Pages Router) to Astro with `output: "server"` via `@astrojs/node` in `standalone` mode, since Cloud Run needs a long-running server and this app isn't a pure static site (two API routes send email and record tracking-pixel hits). All content pages ended up `export const prerender = true` — none have per-request dynamic content, and prerendering sidesteps a real bug where `@emotion/styled` doesn't survive Astro's SSR-per-request bundling faithfully in every case. Only the two API routes (`submit.ts`, `open/[email]/[timestamp].ts`) run per-request.

`getIpFromRequest` reads the `x-forwarded-for` header directly instead of using `Astro.clientAddress`, deliberately sidestepping Cloud Run's reverse-proxy trust configuration as an unknown quantity; the `request-ip` dependency was dropped entirely as part of this.
