import { describe, expect, it } from "vitest";
import { CONNECTORS_PACKAGE_VERSION } from "./index.js";

describe("@flowdev/connectors smoke test", () => {
  it("exports a version constant", () => {
    expect(CONNECTORS_PACKAGE_VERSION).toBe("0.0.1");
  });
});
