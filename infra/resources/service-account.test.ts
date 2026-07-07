import { describe, expect, it } from "bun:test";
import { decideServiceAccountAction } from "./service-account";

describe("decideServiceAccountAction", () => {
  it("should create when the service account does not exist", () => {
    expect(decideServiceAccountAction(false)).toBe("create");
  });

  it("should skip when the service account already exists", () => {
    expect(decideServiceAccountAction(true)).toBe("skip");
  });
});
