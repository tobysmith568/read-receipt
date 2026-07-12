/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_YEAR?: string;
  readonly EMAIL_HOST?: string;
  readonly EMAIL_PORT?: string;
  readonly EMAIL_SENDER_NAME?: string;
  readonly EMAIL_SENDER_EMAIL?: string;
  readonly EMAIL_USER?: string;
  readonly EMAIL_PASS?: string;
  readonly DEV_IP?: string;
  readonly FORCE_HTTP?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
