import { MulterError } from "multer";
import { resolveUploadError } from "./uploadErrors";

describe("upload errors", () => {
  it("maps multer size limits without claiming a single max size", () => {
    const err = resolveUploadError(new MulterError("LIMIT_FILE_SIZE"));
    expect(err?.statusCode).toBe(400);
    expect(err?.message ?? "").toMatch(/too large/i);
    expect(err?.message ?? "").not.toMatch(/10 MB/);
  });

  it("maps rejected formats to a 400", () => {
    const err = resolveUploadError(new Error("FILE_FORMAT_NOT_ALLOWED"));
    expect(err?.statusCode).toBe(400);
    expect(err?.message ?? "").toMatch(/not allowed/i);
  });
});
