import { $ } from "bun";
import * as config from "./config";
import { IamBinding } from "./resources/iam-binding";
import { SecretManagerSecret } from "./resources/secret-manager-secret";
import { ServiceAccount } from "./resources/service-account";
import { WorkloadIdentityPool } from "./resources/workload-identity-pool";

// Run manually, locally, by a human with project-owner access. Everything here is
// IAM-admin-shaped (creating trust relationships, granting roles, seeding secrets),
// so it is deliberately kept out of infra:apply/CI's routine, WIF-authenticated run.
async function main(): Promise<void> {
  const emailUser = requireEnv("EMAIL_USER");
  const emailPass = requireEnv("EMAIL_PASS");
  const projectNumber = await getProjectNumber();

  const wif = new WorkloadIdentityPool(
    config.PROJECT,
    projectNumber,
    config.WIF_POOL_ID,
    config.WIF_PROVIDER_ID,
    config.GITHUB_REPOSITORY,
    config.GITHUB_REF
  );
  await wif.apply();

  await new IamBinding(
    {
      kind: "service-account",
      project: config.PROJECT,
      email: config.DEPLOY_SERVICE_ACCOUNT_EMAIL
    },
    wif.principalSetMember,
    "roles/iam.workloadIdentityUser"
  ).apply();

  await new IamBinding(
    { kind: "project", project: config.PROJECT },
    `serviceAccount:${config.DEPLOY_SERVICE_ACCOUNT_EMAIL}`,
    "roles/artifactregistry.writer"
  ).apply();

  await new IamBinding(
    { kind: "project", project: config.PROJECT },
    `serviceAccount:${config.DEPLOY_SERVICE_ACCOUNT_EMAIL}`,
    "roles/secretmanager.admin"
  ).apply();

  await new SecretManagerSecret(config.PROJECT, config.EMAIL_USER_SECRET_ID, emailUser).apply();
  await new SecretManagerSecret(config.PROJECT, config.EMAIL_PASS_SECRET_ID, emailPass).apply();

  const runtimeSa = new ServiceAccount(
    config.PROJECT,
    config.RUNTIME_SERVICE_ACCOUNT_ID,
    config.RUNTIME_SERVICE_ACCOUNT_DISPLAY_NAME
  );
  await runtimeSa.apply();

  for (const secretId of [config.EMAIL_USER_SECRET_ID, config.EMAIL_PASS_SECRET_ID]) {
    await new IamBinding(
      { kind: "secret", project: config.PROJECT, secretId },
      `serviceAccount:${runtimeSa.email}`,
      "roles/secretmanager.secretAccessor"
    ).apply();
  }

  console.log(
    `WIF provider resource name (for google-github-actions/auth):\n  ${wif.providerResourceName}`
  );
  console.log(`Runtime service account:\n  ${runtimeSa.email}`);
}

async function getProjectNumber(): Promise<string> {
  const formatFlag = "--format=value(projectNumber)";
  const result = await $`gcloud projects describe ${config.PROJECT} ${formatFlag}`.quiet();
  return result.stdout.toString().trim();
}

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} env var is required`);
  }

  return value;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
