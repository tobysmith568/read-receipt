import "reflect-metadata";
import "zone.js/dist/zone-node";
import { ngExpressEngine } from "@nguniversal/express-engine";
import * as express from "express";
import { join } from "path";

import { AppServerModule } from "./src/main.server";
import { APP_BASE_HREF } from "@angular/common";
import { existsSync } from "fs";
import { container } from "tsyringe";
import { EmailController } from "src/controllers/email.controller";
import { json, Response, Request } from "express";

export function app(): express.Express {
  const server = express();
  const distFolder = join(process.cwd(), "dist/read-receipt/browser");
  const indexHtml = existsSync(join(distFolder, "index.original.html")) ? "index.original.html" : "index";

  const emailController = container.resolve(EmailController);

  server.engine(
    "html",
    ngExpressEngine({
      bootstrap: AppServerModule
    })
  );

  server.set("view engine", "html");
  server.set("views", distFolder);

  server.use((req, res, next) => {
    if (req.url.includes("__server__")) {
      render(indexHtml, req, res);
      return;
    }

    next();
  });

  server.get(
    "*.*",
    express.static(distFolder, {
      maxAge: "1y"
    })
  );

  server.use("/email", json(), emailController.getRouter());

  server.get("*", (req, res) => {
    render(indexHtml, req, res);
  });

  return server;
}

function run(): void {
  const port = process.env.PORT || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

function render(indexHtml: string, req: Request, res: Response): void {
  res.render(indexHtml, { req, providers: [{ provide: APP_BASE_HREF, useValue: req.baseUrl }] });
}

// Webpack will replace 'require' with '__webpack_require__'
// '__non_webpack_require__' is a proxy to Node 'require'
// The below code is to ensure that the server is run only when not requiring the bundle.
declare const __non_webpack_require__: NodeRequire;
const mainModule = __non_webpack_require__.main;
const moduleFilename = (mainModule && mainModule.filename) || "";
if (moduleFilename === __filename || moduleFilename.includes("iisnode")) {
  run();
}

export * from "./src/main.server";
