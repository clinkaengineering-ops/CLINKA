import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  hasCompleteEngineerApplication,
  hasVerificationDocument,
  requireEngineerDocumentType,
  requireVerificationDocumentUrl,
} from "./engineerVerification";

describe("engineerVerification", () => {
  it("treats null, empty, and whitespace document URLs as missing", () => {
    assert.equal(hasVerificationDocument({}), false);
    assert.equal(
      hasVerificationDocument({
        collegeIdUrl: null,
        certificateUrl: "",
        syndicateCardUrl: "   ",
      }),
      false,
    );
    assert.equal(
      hasVerificationDocument({ collegeIdUrl: "/uploads/documents/id.pdf" }),
      true,
    );
  });

  it("requires a document and at least 3 portfolio items for review", () => {
    const docs = { collegeIdUrl: "/uploads/documents/id.pdf" };
    assert.equal(hasCompleteEngineerApplication({ ...docs, portfolio: [{}, {}] }), false);
    assert.equal(
      hasCompleteEngineerApplication({ ...docs, portfolio: [{}, {}, {}] }),
      true,
    );
    assert.equal(
      hasCompleteEngineerApplication({ portfolio: [{}, {}, {}] }),
      false,
    );
  });

  it("rejects missing document URLs and invalid document types", () => {
    assert.throws(() => requireVerificationDocumentUrl(""), /required/);
    assert.throws(() => requireVerificationDocumentUrl("  "), /required/);
    assert.equal(
      requireVerificationDocumentUrl(" /uploads/documents/id.pdf "),
      "/uploads/documents/id.pdf",
    );
    assert.throws(() => requireEngineerDocumentType("avatarUrl"), /document type/);
    assert.equal(requireEngineerDocumentType("certificateUrl"), "certificateUrl");
  });
});
