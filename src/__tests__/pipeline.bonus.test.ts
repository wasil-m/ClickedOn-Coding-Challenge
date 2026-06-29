import { describe, it, expect } from "vitest";
import { generate } from "../lib/pipeline";

describe("Bonus — review passing right at the attempt boundary", () => {
  it("succeeds when review passes on the last allowed attempt", async () => {
    const res = await generate({
      behavior: "ok",
      advanceToNextStage: async () => {
        /* hand-off succeeds */
      },
      reviewPasses: (attempt) => attempt >= 2,
    });

    expect(res.status).toBe("ok");
    expect(res.attempts).toBe(2);
  });
});