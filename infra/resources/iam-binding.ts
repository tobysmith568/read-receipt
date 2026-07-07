import { gcloudRun } from "../gcloud";

export type IamBindingScope =
  | { kind: "project"; project: string }
  | { kind: "service-account"; project: string; email: string }
  | { kind: "secret"; project: string; secretId: string };

export class IamBinding {
  constructor(
    private readonly scope: IamBindingScope,
    private readonly member: string,
    private readonly role: string
  ) {}

  // GCP's add-iam-policy-binding is itself idempotent (a repeat grant is a no-op),
  // so there's no separate create/skip decision to make here.
  async apply(): Promise<void> {
    await gcloudRun(this.addBindingArgs());
  }

  private addBindingArgs(): string[] {
    switch (this.scope.kind) {
      case "project":
        return [
          "projects",
          "add-iam-policy-binding",
          this.scope.project,
          `--member=${this.member}`,
          `--role=${this.role}`,
          "--condition=None"
        ];
      case "service-account":
        return [
          "iam",
          "service-accounts",
          "add-iam-policy-binding",
          this.scope.email,
          `--project=${this.scope.project}`,
          `--member=${this.member}`,
          `--role=${this.role}`
        ];
      case "secret":
        return [
          "secrets",
          "add-iam-policy-binding",
          this.scope.secretId,
          `--project=${this.scope.project}`,
          `--member=${this.member}`,
          `--role=${this.role}`
        ];
    }
  }
}
