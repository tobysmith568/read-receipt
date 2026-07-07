import * as config from "./config";
import { ArtifactRegistryRepo } from "./resources/artifact-registry-repo";
import { CloudRunService } from "./resources/cloud-run-service";
import { SecretManagerSecret } from "./resources/secret-manager-secret";

async function main(): Promise<void> {
  const imageTag = requireEnv("IMAGE_TAG");
  const emailUser = requireEnv("EMAIL_USER");
  const emailPass = requireEnv("EMAIL_PASS");

  await new ArtifactRegistryRepo(config.PROJECT, config.REGION, config.REPOSITORY).apply();

  await new SecretManagerSecret(config.PROJECT, config.EMAIL_USER_SECRET_ID, emailUser).apply();
  await new SecretManagerSecret(config.PROJECT, config.EMAIL_PASS_SECRET_ID, emailPass).apply();

  await new CloudRunService({
    project: config.PROJECT,
    region: config.REGION,
    serviceName: config.SERVICE_NAME,
    image: config.artifactRegistryImage(imageTag),
    serviceAccountEmail: `${config.RUNTIME_SERVICE_ACCOUNT_ID}@${config.PROJECT}.iam.gserviceaccount.com`,
    envVars: {
      EMAIL_HOST: "email-smtp.eu-west-2.amazonaws.com",
      EMAIL_PORT: "465",
      EMAIL_SENDER_NAME: "Read Receipt",
      EMAIL_SENDER_EMAIL: "read.receipt@tobythe.dev"
    },
    secretEnvVars: {
      EMAIL_USER: config.EMAIL_USER_SECRET_ID,
      EMAIL_PASS: config.EMAIL_PASS_SECRET_ID
    },
    containerPort: 8080,
    maxInstances: 4,
    memory: "256Mi",
    cpu: "1000m",
    concurrency: 80,
    timeoutSeconds: 300
  }).apply();
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
