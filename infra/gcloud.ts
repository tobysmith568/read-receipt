import { $ } from "bun";

$.nothrow();

export async function gcloudJson<T>(args: string[]): Promise<T | undefined> {
  const result = await $`gcloud ${args} --format=json`.quiet();

  if (result.exitCode !== 0) {
    if (isNotFoundError(result.stderr.toString())) {
      return undefined;
    }

    throw new Error(`gcloud ${args.join(" ")} failed:\n${result.stderr.toString()}`);
  }

  const stdout = result.stdout.toString().trim();
  return stdout.length === 0 ? undefined : (JSON.parse(stdout) as T);
}

export async function gcloudRun(args: string[]): Promise<void> {
  const result = await $`gcloud ${args}`.quiet();

  if (result.exitCode !== 0) {
    throw new Error(`gcloud ${args.join(" ")} failed:\n${result.stderr.toString()}`);
  }
}

function isNotFoundError(stderr: string): boolean {
  return (
    stderr.includes("NOT_FOUND") ||
    stderr.includes("not found") ||
    stderr.includes("Could not fetch resource")
  );
}
