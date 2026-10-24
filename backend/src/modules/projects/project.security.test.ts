import db from "../../config/db";
import { deletePortfolioItem } from "../users/user.service";
import { deleteProject } from "./project.service";
import * as uploadConfig from "../../config/upload";

jest.mock("../../config/db", () => ({
  __esModule: true,
  default: {
    project: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    projectDeliverable: {
      findMany: jest.fn(),
    },
    portfolioProject: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    engineerProfile: {
      findUnique: jest.fn(),
    },
    ban: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
  },
}));

describe("Document Access & Lifecycle Security Controls", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Arbitrary File Deletion / Stored Path Injection Prevention", () => {
    it("filters out sensitive document and deliverable paths when deleting portfolio item", async () => {
      const deleteUploadFilesSpy = jest
        .spyOn(uploadConfig, "deleteUploadFiles")
        .mockResolvedValue();

      (db.portfolioProject.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        engineerId: 10,
        coverImageUrl: "/uploads/images/legit_cover.png",
        files: [
          { fileUrl: "/uploads/images/legit_slide.png" },
          // Maliciously injected path pointing to another user's payment proof
          { fileUrl: "/uploads/documents/victim_payment_proof.pdf" },
          // Maliciously injected path pointing to confidential deliverable
          { fileUrl: "/uploads/projects/victim_deliverable.zip" },
        ],
      });

      (db.engineerProfile.findUnique as jest.Mock).mockResolvedValue({
        id: 10,
        userId: "eng-1",
      });

      (db.portfolioProject.delete as jest.Mock).mockResolvedValue({ id: 1 });

      await deletePortfolioItem("eng-1", 1);

      expect(db.portfolioProject.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(deleteUploadFilesSpy).toHaveBeenCalledTimes(1);

      const deletedPaths = deleteUploadFilesSpy.mock.calls[0][0] as string[];
      // Legitimate images should be deleted
      expect(deletedPaths).toContain("/uploads/images/legit_cover.png");
      expect(deletedPaths).toContain("/uploads/images/legit_slide.png");
      // Injected sensitive paths MUST BE STRIPPED
      expect(deletedPaths).not.toContain("/uploads/documents/victim_payment_proof.pdf");
      expect(deletedPaths).not.toContain("/uploads/projects/victim_deliverable.zip");

      deleteUploadFilesSpy.mockRestore();
    });
  });

  describe("Stored Deliverable Cleanup on Project Deletion", () => {
    it("deletes stored deliverable files when a project is deleted", async () => {
      const deleteUploadFilesSpy = jest
        .spyOn(uploadConfig, "deleteUploadFiles")
        .mockResolvedValue();

      (db.project.findUnique as jest.Mock).mockResolvedValue({
        id: "proj-123",
        clientId: "client-1",
        status: "OPEN",
      });

      (db.projectDeliverable.findMany as jest.Mock).mockResolvedValue([
        { url: "/uploads/projects/blueprint1.dwg" },
        { url: "/uploads/projects/blueprint2.pdf" },
      ]);

      (db.project.delete as jest.Mock).mockResolvedValue({ id: "proj-123" });

      await deleteProject("client-1", "proj-123");

      expect(db.project.delete).toHaveBeenCalledWith({ where: { id: "proj-123" } });
      expect(deleteUploadFilesSpy).toHaveBeenCalledWith([
        "/uploads/projects/blueprint1.dwg",
        "/uploads/projects/blueprint2.pdf",
      ]);

      deleteUploadFilesSpy.mockRestore();
    });
  });
});
