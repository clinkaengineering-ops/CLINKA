import { hasCompleteEngineerApplication } from "./engineerVerification";

describe("engineerVerification", () => {
  it("requires at least 3 portfolio items for review", () => {
    expect(hasCompleteEngineerApplication({ portfolio: [{}, {}] })).toBe(false);
    expect(hasCompleteEngineerApplication({ portfolio: [{}, {}, {}] })).toBe(true);
  });
});
