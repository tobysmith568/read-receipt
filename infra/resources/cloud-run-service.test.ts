import { describe, expect, it } from "bun:test";
import { buildDeployArgs, type CloudRunServiceConfig } from "./cloud-run-service";

const baseConfig: CloudRunServiceConfig = {
  project: "test-project",
  region: "europe-west1",
  serviceName: "read-receipt",
  image: "europe-west1-docker.pkg.dev/test-project/read-receipt/read-receipt:abc123",
  serviceAccountEmail: "read-receipt-runtime@test-project.iam.gserviceaccount.com",
  envVars: { EMAIL_HOST: "smtp.example.com" },
  secretEnvVars: { EMAIL_USER: "Read-Receipt-Email-User" },
  containerPort: 8080,
  maxInstances: 4,
  memory: "256Mi",
  cpu: "1000m",
  concurrency: 80,
  timeoutSeconds: 300
};

describe("buildDeployArgs", () => {
  it("should include the image, region, and runtime service account", () => {
    const args = buildDeployArgs(baseConfig);

    expect(args).toContain(
      "--image=europe-west1-docker.pkg.dev/test-project/read-receipt/read-receipt:abc123"
    );
    expect(args).toContain("--region=europe-west1");
    expect(args).toContain(
      "--service-account=read-receipt-runtime@test-project.iam.gserviceaccount.com"
    );
  });

  it("should format env vars as a comma-separated KEY=VALUE list", () => {
    const args = buildDeployArgs({ ...baseConfig, envVars: { A: "1", B: "2" } });

    expect(args).toContain("--set-env-vars=A=1,B=2");
  });

  it("should format secret env vars pointing at the latest version", () => {
    const args = buildDeployArgs({
      ...baseConfig,
      secretEnvVars: { EMAIL_USER: "Read-Receipt-Email-User" }
    });

    expect(args).toContain("--set-secrets=EMAIL_USER=Read-Receipt-Email-User:latest");
  });

  it("should omit --set-env-vars when there are no env vars", () => {
    const args = buildDeployArgs({ ...baseConfig, envVars: {} });

    expect(args.some(arg => arg.startsWith("--set-env-vars"))).toBe(false);
  });

  it("should omit --set-secrets when there are no secret env vars", () => {
    const args = buildDeployArgs({ ...baseConfig, secretEnvVars: {} });

    expect(args.some(arg => arg.startsWith("--set-secrets"))).toBe(false);
  });
});
