import { describe, expect, it } from "vitest";

describe("@flowdev/web smoke test", () => {
  it("can import cn() from the workspace shared package", async () => {
    const shared = await import("@flowdev/shared");
    expect(typeof shared.cn).toBe("function");
    expect(shared.cn("p-4", "p-6")).toBe("p-6");
  });
});
