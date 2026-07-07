import { gcloudRun } from "../gcloud";

export interface CloudRunServiceConfig {
  project: string;
  region: string;
  serviceName: string;
  image: string;
  serviceAccountEmail: string;
  envVars: Record<string, string>;
  secretEnvVars: Record<string, string>;
  containerPort: number;
  maxInstances: number;
  memory: string;
  cpu: string;
  concurrency: number;
  timeoutSeconds: number;
}

export function buildDeployArgs(config: CloudRunServiceConfig): string[] {
  const envVarPairs = Object.entries(config.envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join(",");
  const secretPairs = Object.entries(config.secretEnvVars)
    .map(([key, secretId]) => `${key}=${secretId}:latest`)
    .join(",");

  const args = [
    "run",
    "deploy",
    config.serviceName,
    `--project=${config.project}`,
    `--region=${config.region}`,
    "--platform=managed",
    `--image=${config.image}`,
    `--service-account=${config.serviceAccountEmail}`,
    `--port=${config.containerPort}`,
    `--memory=${config.memory}`,
    `--cpu=${config.cpu}`,
    `--concurrency=${config.concurrency}`,
    `--timeout=${config.timeoutSeconds}`,
    `--max-instances=${config.maxInstances}`,
    "--quiet"
  ];

  if (envVarPairs.length > 0) {
    args.push(`--set-env-vars=${envVarPairs}`);
  }

  if (secretPairs.length > 0) {
    args.push(`--set-secrets=${secretPairs}`);
  }

  return args;
}

export class CloudRunService {
  constructor(private readonly config: CloudRunServiceConfig) {}

  // gcloud run deploy is itself idempotent/safe to re-run (it always reconciles
  // the service to the given flags), so there's no separate create/update
  // decision to make before invoking it.
  async apply(): Promise<void> {
    await gcloudRun(buildDeployArgs(this.config));
  }
}
