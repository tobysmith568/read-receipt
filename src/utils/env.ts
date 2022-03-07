import { parseNumber } from "./number";

interface Env {
  email: {
    host: string;
    port: number;
    senderName: string;
    senderEmail: string;
    user: string;
    pass: string;
  };
  dev: {
    isDev: boolean;
    ip?: string;
  };
}

const env: Env = {
  email: {
    host: process.env.EMAIL_HOST ?? "",
    port: parseNumber(process.env.EMAIL_PORT, 465),
    senderName: process.env.EMAIL_SENDER_NAME ?? "",
    senderEmail: process.env.EMAIL_SENDER_EMAIL ?? "",
    user: process.env.EMAIL_USER ?? "",
    pass: process.env.EMAIL_PASS ?? ""
  },
  dev: {
    isDev: process.env.NODE_ENV === "development",
    ip: process.env.DEV_IP ?? undefined
  }
};
export default env;
