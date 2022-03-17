import { createTransport } from "nodemailer";
import { getEnv } from "./env";

const securePort = 465;
const { host, port, user, pass, senderName, senderEmail } = getEnv().email;

const transporter = createTransport({
  host,
  port,
  secure: port === securePort,
  auth: {
    user,
    pass
  }
});

const from = `${senderName} <${senderEmail}>`;

export const sendHtml = async (to: string, subject: string, html: string): Promise<void> => {
  await transporter.sendMail({
    from,
    to,
    subject,
    html
  });
};
