import {
  CHAT_MAX_FILE_SIZE,
  CHAT_ALLOWED_EXTENSIONS,
  CHAT_MIME_TYPES,
} from "./chatUpload.middleware";
import { isAllowedUpload, BLOCKED_FILE_EXTENSIONS } from "../config/upload";

describe("chatUpload middleware configuration", () => {
  it("enforces a 50 MB maximum file size", () => {
    expect(CHAT_MAX_FILE_SIZE).toBe(50 * 1024 * 1024);
  });

  describe("supported compressed and archive formats", () => {
    const archiveExtensions = [".zip", ".rar", ".7z", ".tar", ".gz", ".tgz", ".bz2"];

    it.each(archiveExtensions)("allows archive format %s", (ext) => {
      expect(CHAT_ALLOWED_EXTENSIONS.has(ext)).toBe(true);
      expect(
        isAllowedUpload(
          "application/octet-stream",
          `archive${ext}`,
          CHAT_MIME_TYPES,
          CHAT_ALLOWED_EXTENSIONS,
        ),
      ).toBe(true);
    });
  });

  describe("supported engineering, CAD, BIM, arch, and civil formats", () => {
    const engineeringFiles = [
      { name: "model.rvt", mime: "application/octet-stream" },
      { name: "family.rfa", mime: "application/octet-stream" },
      { name: "template.rte", mime: "application/octet-stream" },
      { name: "building.ifc", mime: "application/octet-stream" },
      { name: "plan.dwg", mime: "application/acad" },
      { name: "plan.dwg", mime: "application/octet-stream" },
      { name: "drawing.dxf", mime: "application/dxf" },
      { name: "clash.nwd", mime: "application/octet-stream" },
      { name: "facade.skp", mime: "application/octet-stream" },
      { name: "arch.pln", mime: "application/octet-stream" },
      { name: "part.step", mime: "application/x-step" },
      { name: "structural.edb", mime: "application/octet-stream" },
      { name: "analysis.sdb", mime: "application/octet-stream" },
      { name: "frame.std", mime: "application/octet-stream" },
      { name: "survey.landxml", mime: "application/xml" },
      { name: "site.kml", mime: "application/vnd.google-earth.kml+xml" },
    ];

    it.each(engineeringFiles)("allows $name with mime $mime", ({ name, mime }) => {
      expect(
        isAllowedUpload(mime, name, CHAT_MIME_TYPES, CHAT_ALLOWED_EXTENSIONS),
      ).toBe(true);
    });
  });

  describe("supported office, documents, and spreadsheets", () => {
    const docFiles = [
      { name: "document.pdf", mime: "application/pdf" },
      {
        name: "boq.xlsx",
        mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
      { name: "budget.xls", mime: "application/vnd.ms-excel" },
      {
        name: "spec.docx",
        mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
      { name: "contract.doc", mime: "application/msword" },
      { name: "points.csv", mime: "text/csv" },
      { name: "notes.txt", mime: "text/plain" },
    ];

    it.each(docFiles)("allows $name with mime $mime", ({ name, mime }) => {
      expect(
        isAllowedUpload(mime, name, CHAT_MIME_TYPES, CHAT_ALLOWED_EXTENSIONS),
      ).toBe(true);
    });
  });

  describe("supported image formats", () => {
    const images = [
      { name: "photo.jpg", mime: "image/jpeg" },
      { name: "photo.jpeg", mime: "image/jpeg" },
      { name: "diagram.png", mime: "image/png" },
      { name: "anim.gif", mime: "image/gif" },
      { name: "render.webp", mime: "image/webp" },
    ];

    it.each(images)("allows $name with mime $mime", ({ name, mime }) => {
      expect(
        isAllowedUpload(mime, name, CHAT_MIME_TYPES, CHAT_ALLOWED_EXTENSIONS),
      ).toBe(true);
    });
  });

  describe("blocks dangerous executable and script files", () => {
    const dangerousFiles = [
      "virus.exe",
      "malware.bat",
      "script.cmd",
      "payload.sh",
      "exploit.ps1",
      "hack.js",
      "test.ts",
      "page.html",
      "vector.svg",
    ];

    it.each(dangerousFiles)("blocks dangerous file %s", (filename) => {
      const ext = filename.slice(filename.lastIndexOf("."));
      expect(BLOCKED_FILE_EXTENSIONS.has(ext)).toBe(true);
      expect(
        isAllowedUpload(
          "application/octet-stream",
          filename,
          CHAT_MIME_TYPES,
          CHAT_ALLOWED_EXTENSIONS,
        ),
      ).toBe(false);
    });
  });

  describe("rejects unlisted arbitrary file extensions", () => {
    const unsupported = ["audio.mp3", "video.mkv", "random.xyz", "unknown.dat"];

    it.each(unsupported)("rejects %s", (filename) => {
      expect(
        isAllowedUpload(
          "application/octet-stream",
          filename,
          CHAT_MIME_TYPES,
          CHAT_ALLOWED_EXTENSIONS,
        ),
      ).toBe(false);
    });
  });
});
