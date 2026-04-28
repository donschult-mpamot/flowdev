import { describe, expect, it } from "vitest";

describe("@flowdev/db smoke test", () => {
  it("re-exports a prisma symbol from the package entry", async () => {
    const mod = await import("./index.js");
    expect(mod).toHaveProperty("prisma");
  });
});
