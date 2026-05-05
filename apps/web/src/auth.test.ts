import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";

import { isPublicPath } from "./auth.config";

describe("auth.config — isPublicPath()", () => {
  it("treats /sign-in as public", () => {
    expect(isPublicPath("/sign-in")).toBe(true);
  });

  it("treats /api/auth/* as public", () => {
    expect(isPublicPath("/api/auth/signin")).toBe(true);
    expect(isPublicPath("/api/auth/callback/microsoft-entra-id")).toBe(true);
    expect(isPublicPath("/api/auth/session")).toBe(true);
  });

  it("treats /_next/* and /favicon.ico as public", () => {
    expect(isPublicPath("/_next/static/chunks/main.js")).toBe(true);
    expect(isPublicPath("/favicon.ico")).toBe(true);
  });

  it("treats /portfolio and any other route as protected", () => {
    expect(isPublicPath("/portfolio")).toBe(false);
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/api/anything-else")).toBe(false);
  });
});

describe("bcrypt password round-trip", () => {
  it("hash + compare succeeds for a matching password", async () => {
    const plain = "correct-horse-battery-staple";
    const hash = await bcrypt.hash(plain, 12);
    await expect(bcrypt.compare(plain, hash)).resolves.toBe(true);
  });

  it("compare fails for a mismatched password", async () => {
    const hash = await bcrypt.hash("right-password", 12);
    await expect(bcrypt.compare("wrong-password", hash)).resolves.toBe(false);
  });
});
