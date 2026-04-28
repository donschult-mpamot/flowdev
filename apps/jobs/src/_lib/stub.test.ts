import { describe, expect, it } from "vitest";
import { runStubJob } from "./stub.js";

describe("@flowdev/jobs runStubJob()", () => {
  it("is a function", () => {
    expect(typeof runStubJob).toBe("function");
  });
});
