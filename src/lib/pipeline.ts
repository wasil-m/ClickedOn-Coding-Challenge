import { extractJson } from "./extract-json";
import { mockStream, type MockBehavior, type MockState } from "./anthropic-mock";

export interface GenerateInput {
  /** Drives the mock streaming client (see anthropic-mock.ts). */
  behavior: MockBehavior;
  /** Hands the finished draft to the next pipeline stage. May reject. */
  advanceToNextStage: () => Promise<void>;
  /** Returns true once the draft passes review. Scripted by callers/tests. */
  reviewPasses: (attempt: number) => boolean;
}

export interface GenerateResult {
  status: "ok" | "error";
  attempts: number;
}

const MAX_REVISIONS = 3;

/**
 * Runs one content-generation pass: stream a draft, extract it, revise until it
 * passes review, then hand off to the next stage.
 *
 * This is a faithful (stripped-down) reproduction of the real pipeline — and it
 * ships with three real bugs from that pipeline. Your job is to fix them so the
 * test suite passes. See the README for the symptoms. (Do not edit the tests.)
 */
export async function generate(input: GenerateInput): Promise<GenerateResult> {
  const state: MockState = { calls: 0 };

  // The model call can fail transiently (rate limits) or return a truncated
  // stream. Right now a single hiccup takes down the whole run.

  //Old Code -> No checks for attempts, returns error
  //const text = await mockStream(input.behavior, state);
  //extractJson(text);



//  Bug 2 Fix
// Retry up to 3 times on any failure (truncated stream or rate-limit error),
// reusing the same state so the mock's call count keeps advancing.
// Returns "error" if we exhaust all attempts without a successful extraction.
// This also fixed bug 3 i) as it bounds the attempts

  let extracted;
  let attempts = 0;

  while (attempts < 3) {
  try {
    attempts += 1;
    const text = await mockStream(input.behavior, state);
    extracted = extractJson(text);
    break;
  } catch (error) {
    // failed this time, loop will retry if attempts left
  }
}

if (!extracted) {
  return { status: "error", attempts: attempts };
}

  // Revise until the draft passes review.
  let attempt = 0;
  while (!input.reviewPasses(attempt) && attempt < 50) {
    attempt += 1;
  }


  try {
    await input.advanceToNextStage()
    return { status: "ok", attempts: attempt };
  } catch (error) {
    return { status: "error", attempts: attempt };
  }

/* Previous code (bugged) -> Hand off call wasn't being awaited, rejection never reached return statement, hence always returning "ok"
  // Kick off the next stage and return.
  void input.advanceToNextStage().catch(() => {
  //  ignored 
  });

  return { status: "ok", attempts: attempt };

*/
}

export { MAX_REVISIONS };

