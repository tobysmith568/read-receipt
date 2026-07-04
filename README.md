# ReadReceipt

Email senders can use a trick called a 'tracking pixel' to know exactly when you open their emails, just like a read receipt.

These pixels are not only hard to detect, but they also give away lots of personal information!

Using this website, you can receive an email containing my implementation of a tracking pixel to see examples of the information you're giving away simply by opening emails.

Hosted at: https://read-receipt.tobythe.dev

## Dev Setup

A `.env` is committed with working defaults for the SMTP server and a mock IP
address to use when run as a dev build (override with a gitignored `.env.local`
if you need different values, e.g. real SMTP credentials).

To run the project use:

```
bun install
docker compose up   # starts smtp4dev, so sent emails can be viewed at http://localhost:5000
bun run dev
```

`docker compose up app` additionally builds and runs the production Docker
image locally (talking to the same `smtp4dev`), instead of `bun run dev`.

# License

read-receipt is [copyrighted](./LICENSE.md) and is not available for re-distribution or re-use.

Copyright © 2020-2024 Toby Smith.

<a href="https://license-cop.js.org">
  <img alt="Protected by: License-Cop" src="https://license-cop.js.org/shield.svg">
</a>
