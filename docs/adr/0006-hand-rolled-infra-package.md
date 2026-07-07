# Hand-rolled `infra/` package instead of Terraform/Pulumi, split into `infra:apply` / `infra:bootstrap`

Deployment moved from click-ops GCP to code, but as a small `infra/` package of Bun TS classes (one per resource type: Artifact Registry repo, Secret Manager secret, Cloud Run service, Workload Identity pool) that shell out to `gcloud` and are each idempotent (`describe`-then-`create`/`update`), rather than Terraform/Pulumi — a project this size doesn't need a state backend or a general-purpose IaC DSL.

The package has two entrypoints, split by trust level rather than by resource type:

- `bun run infra:apply` — run by CI on every push to `main`, authenticated via Workload Identity Federation. Manages only the Artifact Registry repo, Secret Manager secrets, and the Cloud Run service.
- `bun run infra:bootstrap` — run manually, once, by a human with project-owner access. Manages the WIF pool/provider/trust binding, the deploy service account's own IAM roles, and the runtime service account plus its secret-access grant.

WIF pool/provider management, IAM grants, and service-account creation are deliberately excluded from `infra:apply`/CI: if CI's own service account could modify its own trust policy or grant itself new roles, a malicious or buggy PR merged to `main` could widen its own access. Keeping every IAM-admin-shaped action out of anything CI routinely runs closes that off entirely.
