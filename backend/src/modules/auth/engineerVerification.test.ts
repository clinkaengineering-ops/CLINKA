import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasCompleteEngineerApplication } from "./engineerVerification";

describe("engineerVerification", () => {
  it("requires at least 3 portfolio items for review", () => {
    assert.equal(hasCompleteEngineerApplication({ portfolio: [{}, {}] }), false);
    assert.equal(hasCompleteEngineerApplication({ portfolio: [{}, {}, {}] }), true);
  });
});
