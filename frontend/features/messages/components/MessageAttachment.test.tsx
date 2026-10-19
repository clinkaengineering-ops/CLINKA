import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MessageAttachment } from "./MessageAttachment";
import type { ChatMessage } from "../types";

describe("MessageAttachment", () => {
  const baseMessage: ChatMessage = {
    id: 1,
    conversationId: 10,
    senderId: "user-1",
    content: "Here is the file",
    createdAt: new Date().toISOString(),
  };

  it("returns null if no attachmentUrl is present", () => {
    const { container } = render(
      <MessageAttachment message={baseMessage} side="me" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders image preview when mime type is image", () => {
    const msg: ChatMessage = {
      ...baseMessage,
      attachmentUrl: "/uploads/documents/render.png",
      attachmentName: "render.png",
      attachmentMime: "image/png",
    };
    render(<MessageAttachment message={msg} side="me" />);
    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("alt", "render.png");
  });

  it("renders CAD badge for .dwg file", () => {
    const msg: ChatMessage = {
      ...baseMessage,
      attachmentUrl: "/uploads/documents/foundation.dwg",
      attachmentName: "foundation.dwg",
      attachmentMime: "application/octet-stream",
    };
    render(<MessageAttachment message={msg} side="them" />);
    expect(screen.getByText("foundation.dwg")).toBeInTheDocument();
    expect(screen.getByText("DWG")).toBeInTheDocument();
  });

  it("renders BIM badge for .rvt file", () => {
    const msg: ChatMessage = {
      ...baseMessage,
      attachmentUrl: "/uploads/documents/villa.rvt",
      attachmentName: "villa.rvt",
      attachmentMime: "application/octet-stream",
    };
    render(<MessageAttachment message={msg} side="me" />);
    expect(screen.getByText("villa.rvt")).toBeInTheDocument();
    expect(screen.getByText("RVT")).toBeInTheDocument();
  });

  it("renders archive badge for .zip file", () => {
    const msg: ChatMessage = {
      ...baseMessage,
      attachmentUrl: "/uploads/documents/drawings.zip",
      attachmentName: "drawings.zip",
      attachmentMime: "application/zip",
    };
    render(<MessageAttachment message={msg} side="them" />);
    expect(screen.getByText("drawings.zip")).toBeInTheDocument();
    expect(screen.getByText("ZIP")).toBeInTheDocument();
  });

  it("renders PDF badge for .pdf file", () => {
    const msg: ChatMessage = {
      ...baseMessage,
      attachmentUrl: "/uploads/documents/spec.pdf",
      attachmentName: "spec.pdf",
      attachmentMime: "application/pdf",
    };
    render(<MessageAttachment message={msg} side="me" />);
    expect(screen.getByText("spec.pdf")).toBeInTheDocument();
    expect(screen.getByText("PDF")).toBeInTheDocument();
  });

  it("renders archive badge for .rar file", () => {
    const msg: ChatMessage = {
      ...baseMessage,
      attachmentUrl: "https://res.cloudinary.com/demo/raw/upload/v1/documents/archive.rar",
      attachmentName: "Sample RAR File.rar",
      attachmentMime: "application/x-rar-compressed",
    };
    render(<MessageAttachment message={msg} side="them" />);
    expect(screen.getByText("Sample RAR File.rar")).toBeInTheDocument();
    expect(screen.getByText("RAR")).toBeInTheDocument();
  });

  it("intercepts cross-origin download and triggers blob download with original filename", async () => {
    const msg: ChatMessage = {
      ...baseMessage,
      attachmentUrl: "https://res.cloudinary.com/demo/raw/upload/v1/documents/txnhlizhfd74v78zqiz2.zip",
      attachmentName: "81FLMLZT+OL.zip",
      attachmentMime: "application/zip",
    };

    const mockBlob = new Blob(["fake zip content"], { type: "application/zip" });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    } as any);

    const createObjectURLSpy = vi.fn().mockReturnValue("blob:http://localhost/mock-uuid");
    const revokeObjectURLSpy = vi.fn();
    window.URL.createObjectURL = createObjectURLSpy;
    window.URL.revokeObjectURL = revokeObjectURLSpy;

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<MessageAttachment message={msg} side="me" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("download", "81FLMLZT+OL.zip");

    // Click the download link via fireEvent inside act
    await act(async () => {
      fireEvent.click(link);
      await new Promise((r) => setTimeout(r, 20));
    });

    // Verify fetch was called with cross-origin URL
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://res.cloudinary.com/demo/raw/upload/v1/documents/txnhlizhfd74v78zqiz2.zip",
    );

    expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:http://localhost/mock-uuid");

    globalThis.fetch = originalFetch;
    clickSpy.mockRestore();
  });
});
