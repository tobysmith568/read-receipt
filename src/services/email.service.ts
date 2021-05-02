import { singleton } from "tsyringe";
import { createTransport } from "nodemailer";
import * as Mail from "nodemailer/lib/mailer";
import { EnvironmentService } from "./environment.service";

@singleton()
export class EmailService {
  private static readonly SECUREPORT = 465;

  private transporter: Mail;
  private from: string;

  constructor(environmentService: EnvironmentService) {
    const { host, port, senderName, senderEmail, user, pass } = environmentService.config.email;

    this.transporter = createTransport({
      host,
      port,
      secure: port === EmailService.SECUREPORT,
      auth: {
        user,
        pass
      }
    });
    this.from = `${senderName} <${senderEmail}>`;
  }

  public async sendHtml(to: string, subject: string, html: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to,
      subject,
      html
    });
  }
}
