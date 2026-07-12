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
    host: import.meta.env.EMAIL_HOST ?? "",
    port: parseNumber(import.meta.env.EMAIL_PORT, 465),
    senderName: import.meta.env.EMAIL_SENDER_NAME ?? "",
    senderEmail: import.meta.env.EMAIL_SENDER_EMAIL ?? "",
    user: import.meta.env.EMAIL_USER ?? "",
    pass: import.meta.env.EMAIL_PASS ?? ""
  },
  dev: {
    isDev: Boolean(import.meta.env.DEV),
    ip: isFalsyOrEmpty(import.meta.env.DEV_IP) ? undefined : import.meta.env.DEV_IP
  },
  forceHttp: import.meta.env.FORCE_HTTP === "true"
});

const isFalsyOrEmpty = (value: string | undefined | null): boolean => {
  return !value || value.trim() === "";
};
