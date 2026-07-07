import { gcloudJson, gcloudRun } from "../gcloud";

export type WifAction = "create" | "skip";

export function decideWifAction(exists: boolean): WifAction {
  return exists ? "skip" : "create";
}

const LOCATION = "global";
const ISSUER_URI = "https://token.actions.githubusercontent.com";
const ATTRIBUTE_MAPPING =
  "google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref";

export class WorkloadIdentityPool {
  constructor(
    private readonly project: string,
    private readonly projectNumber: string,
    private readonly poolId: string,
    private readonly providerId: string,
    private readonly repository: string,
    private readonly ref: string
  ) {}

  get principalSetMember(): string {
    return (
      `principalSet://iam.googleapis.com/projects/${this.projectNumber}/locations/${LOCATION}` +
      `/workloadIdentityPools/${this.poolId}/attribute.repository/${this.repository}`
    );
  }

  get providerResourceName(): string {
    return (
      `projects/${this.projectNumber}/locations/${LOCATION}/workloadIdentityPools/${this.poolId}` +
      `/providers/${this.providerId}`
    );
  }

  async apply(): Promise<void> {
    await this.applyPool();
    await this.applyProvider();
  }

  private async applyPool(): Promise<void> {
    const existing = await gcloudJson([
      "iam",
      "workload-identity-pools",
      "describe",
      this.poolId,
      ...this.poolLocationArgs()
    ]);

    if (decideWifAction(existing !== undefined) === "create") {
      await gcloudRun([
        "iam",
        "workload-identity-pools",
        "create",
        this.poolId,
        ...this.poolLocationArgs(),
        "--display-name=GitHub Actions"
      ]);
    }
  }

  private async applyProvider(): Promise<void> {
    const existing = await gcloudJson([
      "iam",
      "workload-identity-pools",
      "providers",
      "describe",
      this.providerId,
      `--workload-identity-pool=${this.poolId}`,
      ...this.poolLocationArgs()
    ]);

    const conditionArgs = [
      `--attribute-condition=assertion.repository=='${this.repository}' && assertion.ref=='${this.ref}'`
    ];

    if (decideWifAction(existing !== undefined) === "create") {
      await gcloudRun([
        "iam",
        "workload-identity-pools",
        "providers",
        "create-oidc",
        this.providerId,
        `--workload-identity-pool=${this.poolId}`,
        ...this.poolLocationArgs(),
        `--issuer-uri=${ISSUER_URI}`,
        `--attribute-mapping=${ATTRIBUTE_MAPPING}`,
        ...conditionArgs
      ]);
    }
  }

  private poolLocationArgs(): string[] {
    return [`--project=${this.project}`, `--location=${LOCATION}`];
  }
}
