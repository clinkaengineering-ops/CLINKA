import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
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
});
