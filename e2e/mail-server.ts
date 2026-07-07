import http from "node:http";
import ms from "smtp-tester";

const SMTP_PORT = 2525;
export const ADMIN_PORT = 4526;

interface CapturedEmail {
  html: string;
  subject: string;
}

let mailServer: ReturnType<typeof ms.init> | undefined;
let adminServer: http.Server | undefined;
let lastEmailPerRecipient: Record<string, CapturedEmail> = {};

// Runs once in the Playwright orchestrator process (globalSetup/globalTeardown).
// Test files run in separate worker processes, so captured emails are exposed
// over this tiny local HTTP server rather than shared in-memory state - see
// mail-client.ts for the side test files actually import.
export const startMailServer = async () => {
  mailServer = ms.init(SMTP_PORT);

  mailServer.bind((_addr, _id, email) => {
    lastEmailPerRecipient[email.headers.to] = {
      html: email.html,
      subject: email.headers.subject
    };
  });

  adminServer = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost:${ADMIN_PORT}`);

    if (req.method === "POST" && url.pathname === "/reset") {
      lastEmailPerRecipient = {};
      res.writeHead(204).end();
      return;
    }

    if (req.method === "GET" && url.pathname === "/last-email") {
      const to = url.searchParams.get("to") ?? "";
      const email = lastEmailPerRecipient[to];

      if (!email) {
        res.writeHead(404).end();
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(email));
      return;
    }

    res.writeHead(404).end();
  });

  await new Promise<void>(resolve => adminServer?.listen(ADMIN_PORT, resolve));
};

export const stopMailServer = async () => {
  await new Promise<void>(resolve => (mailServer ? mailServer.stop(() => resolve()) : resolve()));
  await new Promise<void>(resolve =>
    adminServer ? adminServer.close(() => resolve()) : resolve()
  );
};
