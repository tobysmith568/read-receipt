import { Request, Router, Response } from "express";
import { EmailService } from "src/services/email.service";
import { ExpressService } from "src/services/express.service";
import { singleton } from "tsyringe";
import { IController } from "./controller.interface";
import { compile } from "handlebars";
import { FileService } from "src/services/file.service";

@singleton()
export class EmailController implements IController {
  private compiledPixelEmail?: HandlebarsTemplateDelegate<void> = undefined;

  constructor(
    private readonly expressService: ExpressService,
    private readonly emailService: EmailService,
    private readonly fileService: FileService
  ) {}

  public getRouter(): Router {
    const router = this.expressService.createRouter();

    router.post("/send", (req, res) => this.send(req, res));

    return router;
  }

  private async send(req: Request, res: Response): Promise<void> {
    if (!this.compiledPixelEmail) {
      const template: string = await this.fileService.readFile(
        __dirname + "/../browser/assets/__server__/emails/with-pixel.hbs"
      );
      this.compiledPixelEmail = compile<void>(template);
    }

    try {
      await this.emailService.sendHtml(req.body.email, "Read Receipt", this.compiledPixelEmail());
      res.json({ sentTo: req.body.email });
    } catch (e) {
      res.status(500).json({ error: true });
    }
  }
}
