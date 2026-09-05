import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MulterError } from "multer";

import { resolveUploadError } from "./uploadErrors";

describe("upload errors", () => {
  it("maps multer size limits without claiming a single max size", () => {
    const err = resolveUploadError(new MulterError("LIMIT_FILE_SIZE"));
    assert.equal(err?.statusCode, 400);
    assert.match(err?.message ?? "", /too large/i);
    assert.doesNotMatch(err?.message ?? "", /10 MB/);
  });

  it("maps rejected formats to a 400", () => {
    const err = resolveUploadError(new Error("FILE_FORMAT_NOT_ALLOWED"));
    assert.equal(err?.statusCode, 400);
    assert.match(err?.message ?? "", /not allowed/i);
  });
});
