import { Request, Router, Response } from "express";
import { EmailService } from "src/services/email.service";
import { ExpressService } from "src/services/express.service";
import { singleton } from "tsyringe";
import { IController } from "./controller.interface";
import { compile } from "handlebars";
import { FileService } from "src/services/file.service";
import { IFirstEmail } from "src/models/first-email.interface";

@singleton()
export class EmailController implements IController {
  private readonly pixelLocation: string;
  private readonly firstEmailLocation: string;

  private readonly router: Router;

  private compiledFirstEmail?: HandlebarsTemplateDelegate<IFirstEmail>;

  constructor(
    private readonly expressService: ExpressService,
    private readonly emailService: EmailService,
    private readonly fileService: FileService
  ) {
    this.pixelLocation = fileService.resolvePath(__dirname, "../browser/assets/__server__/img/pixel.png");
    this.firstEmailLocation = fileService.resolvePath(__dirname, "../browser/assets/__server__/emails/first-email.hbs");

    this.router = this.expressService.createRouter();
    this.router.post("/send", (req, res) => this.send(req, res));
    this.router.get("/pixel.png", (req, res) => this.pixel(req, res));
  }

  public getRouter(): Router {
    return this.router;
  }

  private async send(req: Request, res: Response): Promise<void> {
    if (!this.compiledFirstEmail) {
      const template: string = await this.fileService.readFile(this.firstEmailLocation);
      this.compiledFirstEmail = compile<IFirstEmail>(template);
    }

    try {
      const currentDomain = this.fullUrl(req);
      const completeEmailContent = this.compiledFirstEmail({ domain: currentDomain });
      const recipientEmailAddress = req.body.email;

      await this.emailService.sendHtml(recipientEmailAddress, "Read Receipt", completeEmailContent);

      res.json({ sentTo: req.body.email });
    } catch (e) {
      res.status(500).json({ error: true });
    }
  }

  private async pixel(req: Request, res: Response): Promise<void> {
    console.log("GETTING PIXEL!");
    res.sendFile(this.pixelLocation);
  }

  private fullUrl(req: Request): string {
    const protocol = req.secure ? "https://" : "http://";
    const domainAndPort = req.get("host");

    const url = new URL(protocol + domainAndPort);
    return url.href;
  }
}
