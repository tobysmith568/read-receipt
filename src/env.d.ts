/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_YEAR?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
