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

/**
 * Prefers `process.env` (correct at runtime for the *built* server, where
 * Docker/Cloud Run inject real values after `astro build` has already run)
 * and falls back to `import.meta.env` (correct under `astro dev`, where Vite
 * loads `.env` there but leaves `process.env` empty). See ADR 0008 — Vite
 * statically inlines `import.meta.env` values at build time, so relying on it
 * alone would freeze production secrets to whatever (if anything) was present
 * during the CI build step, not the real runtime-injected values.
 */
const readEnvVar = (key: string): string | undefined => process.env[key] || import.meta.env[key];

export const getEnv = (): Env => ({
  email: {
    host: readEnvVar("EMAIL_HOST") ?? "",
    port: parseNumber(readEnvVar("EMAIL_PORT"), 465),
    senderName: readEnvVar("EMAIL_SENDER_NAME") ?? "",
    senderEmail: readEnvVar("EMAIL_SENDER_EMAIL") ?? "",
    user: readEnvVar("EMAIL_USER") ?? "",
    pass: readEnvVar("EMAIL_PASS") ?? ""
  },
  dev: {
    isDev: Boolean(import.meta.env.DEV),
    ip: isFalsyOrEmpty(readEnvVar("DEV_IP")) ? undefined : readEnvVar("DEV_IP")
  },
  forceHttp: readEnvVar("FORCE_HTTP") === "true"
});

const isFalsyOrEmpty = (value: string | undefined | null): boolean => {
  return !value || value.trim() === "";
};
