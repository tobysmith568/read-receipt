import { gcloudJson, gcloudRun } from "../gcloud";

export type RepoAction = "create" | "skip";

export function decideRepoAction(exists: boolean): RepoAction {
  return exists ? "skip" : "create";
}

export class ArtifactRegistryRepo {
  constructor(
    private readonly project: string,
    private readonly region: string,
    private readonly repoId: string
  ) {}

  async apply(): Promise<void> {
    const existing = await gcloudJson(this.describeArgs());
    const action = decideRepoAction(existing !== undefined);

    if (action === "create") {
      await gcloudRun([
        "artifacts",
        "repositories",
        "create",
        this.repoId,
        `--project=${this.project}`,
        `--location=${this.region}`,
        "--repository-format=docker"
      ]);
    }
  }

  private describeArgs(): string[] {
    return [
      "artifacts",
      "repositories",
      "describe",
      this.repoId,
      `--project=${this.project}`,
      `--location=${this.region}`
    ];
  }
}
