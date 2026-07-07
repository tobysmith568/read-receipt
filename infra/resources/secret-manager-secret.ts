import { gcloudJson } from "../gcloud";

export type SecretAction = "create" | "add-version" | "skip";

export function decideSecretAction(
  exists: boolean,
  currentValue: string | undefined,
  desiredValue: string
): SecretAction {
  if (!exists) {
    return "create";
  }

  return currentValue === desiredValue ? "skip" : "add-version";
}

export class SecretManagerSecret {
  constructor(
    private readonly project: string,
    private readonly secretId: string,
    private readonly desiredValue: string
  ) {}

  async apply(): Promise<void> {
    const existing = await gcloudJson(this.describeArgs());
    const currentValue = existing === undefined ? undefined : await this.currentValue();
    const action = decideSecretAction(existing !== undefined, currentValue, this.desiredValue);

    if (action === "create") {
      await this.create();
    } else if (action === "add-version") {
      await this.addVersion();
    }
  }

  private describeArgs(): string[] {
    return ["secrets", "describe", this.secretId, `--project=${this.project}`];
  }

  private async currentValue(): Promise<string | undefined> {
    const result =
      await Bun.$`gcloud secrets versions access latest --secret=${this.secretId} --project=${this.project}`
        .quiet()
        .nothrow();

    return result.exitCode === 0 ? result.stdout.toString() : undefined;
  }

  private async create(): Promise<void> {
    const proc = Bun.spawn(
      [
        "gcloud",
        "secrets",
        "create",
        this.secretId,
        `--project=${this.project}`,
        "--replication-policy=automatic",
        "--data-file=-"
      ],
      { stdin: "pipe", stderr: "pipe" }
    );
    proc.stdin.write(this.desiredValue);
    await proc.stdin.end();
    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      throw new Error(
        `failed to create secret ${this.secretId}: ${await new Response(proc.stderr).text()}`
      );
    }
  }

  private async addVersion(): Promise<void> {
    const proc = Bun.spawn(
      [
        "gcloud",
        "secrets",
        "versions",
        "add",
        this.secretId,
        `--project=${this.project}`,
        "--data-file=-"
      ],
      { stdin: "pipe", stderr: "pipe" }
    );
    proc.stdin.write(this.desiredValue);
    await proc.stdin.end();
    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      throw new Error(
        `failed to add version to secret ${this.secretId}: ${await new Response(proc.stderr).text()}`
      );
    }
  }
}
