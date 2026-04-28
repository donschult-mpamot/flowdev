import { describe, expect, it } from "vitest";
import { cn } from "./cn.js";

describe("cn()", () => {
  it("is a function", () => {
    expect(typeof cn).toBe("function");
  });

  it("merges class names and resolves Tailwind conflicts", () => {
    expect(cn("p-4", "p-6")).toBe("p-6");
    expect(cn("text-red-500", false && "text-blue-500", "font-bold")).toBe(
      "text-red-500 font-bold",
    );
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });
});
