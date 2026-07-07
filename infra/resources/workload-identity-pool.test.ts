import { describe, expect, it } from "bun:test";
import { decideWifAction } from "./workload-identity-pool";

describe("decideWifAction", () => {
  it("should create when the resource does not exist", () => {
    expect(decideWifAction(false)).toBe("create");
  });

  it("should skip when the resource already exists", () => {
    expect(decideWifAction(true)).toBe("skip");
  });
});
