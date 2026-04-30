import { describe, expect, it } from "vitest";

describe("@flowdev/worker smoke test", () => {
  it("can import workspace dependencies", async () => {
    const shared = await import("@flowdev/shared");
    expect(typeof shared.cn).toBe("function");
  });
});
