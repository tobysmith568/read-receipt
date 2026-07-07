export const PROJECT = "tobythe-dev";
export const REGION = "europe-west1";
export const REPOSITORY = "read-receipt";
export const SERVICE_NAME = "read-receipt";
export const GITHUB_REPOSITORY = "tobysmith568/read-receipt";
export const GITHUB_REF = "refs/heads/main";

export const DEPLOY_SERVICE_ACCOUNT_EMAIL = "read-receipt@tobythe-dev.iam.gserviceaccount.com";

export const RUNTIME_SERVICE_ACCOUNT_ID = "read-receipt-runtime";
export const RUNTIME_SERVICE_ACCOUNT_DISPLAY_NAME = "read-receipt runtime";

export const WIF_POOL_ID = "github-actions";
export const WIF_PROVIDER_ID = "github";

export const EMAIL_USER_SECRET_ID = "Read-Receipt-Email-User";
export const EMAIL_PASS_SECRET_ID = "Read-Receipt-Email-Pass";

export function artifactRegistryImage(tag: string): string {
  return `${REGION}-docker.pkg.dev/${PROJECT}/${REPOSITORY}/${SERVICE_NAME}:${tag}`;
}
