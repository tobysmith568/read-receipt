import { Request, Router, Response } from "express";
import { EmailService } from "src/services/email.service";
import { ExpressService } from "src/services/express.service";
import { singleton } from "tsyringe";
import { IController } from "./controller.interface";
import { compile } from "handlebars";
import { FileService } from "src/services/file.service";
import { IFirstEmail } from "src/models/first-email.interface";
import { TimeService } from "src/services/time.service";
import { ISecondEmail } from "src/models/second-email.interface";
import { EnvironmentService } from "src/services/environment.service";
import { IpService } from "src/services/ip.service";
import { UserAgentService } from "src/services/user-agent.service";

@singleton()
export class EmailController implements IController {
  private readonly pixelLocation: string;
  private readonly firstEmailLocation: string;
  private readonly secondEmailLocation: string;

  private readonly router: Router;

  private compiledFirstEmail?: HandlebarsTemplateDelegate<IFirstEmail>;
  private compiledSecondEmail?: HandlebarsTemplateDelegate<ISecondEmail>;

  constructor(
    private readonly expressService: ExpressService,
    private readonly emailService: EmailService,
    private readonly fileService: FileService,
    private readonly timeService: TimeService,
    private readonly environmentService: EnvironmentService,
    private readonly ipService: IpService,
    private readonly userAgentService: UserAgentService
  ) {
    this.pixelLocation = fileService.resolvePath(__dirname, "../browser/assets/__server__/img/pixel.png");
    this.firstEmailLocation = fileService.resolvePath(__dirname, "../browser/assets/__server__/emails/first-email.hbs");
    this.secondEmailLocation = fileService.resolvePath(
      __dirname,
      "../browser/assets/__server__/emails/second-email.hbs"
    );

    this.router = this.expressService.createRouter();
    this.router.post("/send", (req, res) => this.send(req, res));
    this.router.get("/:urlSafeEmail/:timestamp/pixel.png", (req, res) => this.pixel(req, res));
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
      const recipientEmailAddress = req.body.email;
      const recipientEmailAddressBase64 = encodeURIComponent(recipientEmailAddress);

      const emailData: IFirstEmail = {
        domain: currentDomain,
        urlSafeEmail: recipientEmailAddressBase64,
        timestamp: this.timeService.getCurrentTimestampUTC()
      };

      const completeEmailContent = this.compiledFirstEmail(emailData);

      await this.emailService.sendHtml(recipientEmailAddress, "Read Receipt", completeEmailContent);

      res.json({ sentTo: req.body.email });
    } catch (e) {
      res.status(500).json({ error: true });
    }
  }

  private async pixel(req: Request, res: Response): Promise<void> {
    res.sendFile(this.pixelLocation);

    if (!this.compiledSecondEmail) {
      const template: string = await this.fileService.readFile(this.secondEmailLocation);
      this.compiledSecondEmail = compile<ISecondEmail>(template);
    }
    const recipientEmailAddress = decodeURIComponent(req.params.urlSafeEmail);

    const emailData = await this.gatherUserData(req, recipientEmailAddress);
    const completeEmailContent = this.compiledSecondEmail(emailData);
    this.emailService.sendHtml(recipientEmailAddress, "You just opened your  email!", completeEmailContent);
  }

  private fullUrl(req: Request): string {
    const protocol = req.secure ? "https://" : "http://";
    const domainAndPort = req.get("host");

    const url = new URL(protocol + domainAndPort);
    return url.href;
  }

  private async gatherUserData(req: Request, recipientEmailAddress: string): Promise<ISecondEmail> {
    const firstSentAtTimestampUTC = Number(req.params.timestamp);
    const secondSentAtTimestampUTC = this.timeService.getCurrentTimestampUTC();
    const differenceBetweenTimestamps = this.timeService.getDifferenceBetweenTimestamps(
      firstSentAtTimestampUTC,
      secondSentAtTimestampUTC
    );

    const userIp = this.getIp(req);
    const ipData = await this.ipService.getInfoFromIp(userIp);
    const userAgentData = this.userAgentService.getUserAgent(req);

    return {
      user: {
        email: recipientEmailAddress,
        ip: userIp
      },
      times: {
        firstEmailTimestamp: this.timeService.printTimestamp(firstSentAtTimestampUTC),
        secondEmailTimestamp: this.timeService.printTimestamp(secondSentAtTimestampUTC),
        timestampDifference: differenceBetweenTimestamps
      },
      ipData,
      userAgentData
    };
  }

  private getIp(request: Request): string {
    const fromExpress = request.clientIp;

    if (!fromExpress || fromExpress === "::1") {
      return this.environmentService.config.dev.ip ?? "unknown";
    }

    return fromExpress;
  }
}
