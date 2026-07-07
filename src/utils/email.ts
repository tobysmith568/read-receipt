import { createTransport, type Transporter } from "nodemailer";
import { getEnv } from "./env";

const securePort = 465;

const getTransporter = (): Transporter => {
  const { host, port, user, pass } = getEnv().email;

  return createTransport({
    host,
    port,
    secure: port === securePort,
    auth: {
      user,
      pass
    }
  });
};

export const sendHtml = async (to: string, subject: string, html: string): Promise<void> => {
  const { senderName, senderEmail } = getEnv().email;

  await getTransporter().sendMail({
    from: `${senderName} <${senderEmail}>`,
    to,
    subject,
    html
  });
};
