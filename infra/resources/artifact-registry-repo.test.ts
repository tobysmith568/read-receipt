import { describe, expect, it } from "bun:test";
import { decideRepoAction } from "./artifact-registry-repo";

describe("decideRepoAction", () => {
  it("should create when the repo does not exist", () => {
    expect(decideRepoAction(false)).toBe("create");
  });

  it("should skip when the repo already exists", () => {
    expect(decideRepoAction(true)).toBe("skip");
  });
});
