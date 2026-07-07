import { gcloudJson, gcloudRun } from "../gcloud";

export type ServiceAccountAction = "create" | "skip";

export function decideServiceAccountAction(exists: boolean): ServiceAccountAction {
  return exists ? "skip" : "create";
}

export class ServiceAccount {
  constructor(
    private readonly project: string,
    private readonly accountId: string,
    private readonly displayName: string
  ) {}

  get email(): string {
    return `${this.accountId}@${this.project}.iam.gserviceaccount.com`;
  }

  async apply(): Promise<void> {
    const existing = await gcloudJson([
      "iam",
      "service-accounts",
      "describe",
      this.email,
      `--project=${this.project}`
    ]);
    const action = decideServiceAccountAction(existing !== undefined);

    if (action === "create") {
      await gcloudRun([
        "iam",
        "service-accounts",
        "create",
        this.accountId,
        `--project=${this.project}`,
        `--display-name=${this.displayName}`
      ]);
    }
  }
}
