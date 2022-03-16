import { parseNumber } from "./number";

export interface Env {
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
  forceHttp: boolean;
}

export const getEnv = (): Env => ({
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
    ip: isFalsyOrEmpty(process.env.DEV_IP) ? undefined : process.env.DEV_IP
  },
  forceHttp: process.env.FORCE_HTTP === "true"
});

const isFalsyOrEmpty = (value: string | undefined | null): boolean => {
  return !value || value.trim() === "";
};
