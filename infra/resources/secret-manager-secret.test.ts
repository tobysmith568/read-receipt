import { describe, expect, it } from "bun:test";
import { decideSecretAction } from "./secret-manager-secret";

describe("decideSecretAction", () => {
  it("should create when the secret does not exist", () => {
    expect(decideSecretAction(false, undefined, "new-value")).toBe("create");
  });

  it("should add a version when the secret exists but the value changed", () => {
    expect(decideSecretAction(true, "old-value", "new-value")).toBe("add-version");
  });

  it("should skip when the secret exists and the value is unchanged", () => {
    expect(decideSecretAction(true, "same-value", "same-value")).toBe("skip");
  });
});
