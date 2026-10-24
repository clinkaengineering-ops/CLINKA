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

  describe("voice message audio player", () => {
    beforeEach(() => {
      // Mock HTMLMediaElement methods in jsdom
      window.HTMLMediaElement.prototype.play = vi.fn().mockImplementation(function (this: HTMLMediaElement) {
        this.dispatchEvent(new Event("play"));
        return Promise.resolve();
      });
      window.HTMLMediaElement.prototype.pause = vi.fn().mockImplementation(function (this: HTMLMediaElement) {
        this.dispatchEvent(new Event("pause"));
      });
    });

    it("renders voice player with preload='metadata' when attachmentMime starts with audio/", () => {
      const msg: ChatMessage = {
        ...baseMessage,
        attachmentUrl: "/uploads/documents/voice.webm",
        attachmentName: "voice.webm",
        attachmentMime: "audio/webm",
        attachmentDuration: 42,
      };

      const { container } = render(<MessageAttachment message={msg} side="me" />);
      const player = screen.getByTestId("voice-message-player");
      expect(player).toBeInTheDocument();

      const audio = container.querySelector("audio");
      expect(audio).toBeInTheDocument();
      expect(audio).toHaveAttribute("preload", "metadata");
      expect(audio).toHaveAttribute("src", expect.stringContaining("voice.webm"));
    });

    it("uses stored attachmentDuration for the total time and progress bar max", () => {
      const msg: ChatMessage = {
        ...baseMessage,
        attachmentUrl: "/uploads/documents/voice.ogg",
        attachmentName: "voice.ogg",
        attachmentMime: "audio/ogg",
        attachmentDuration: 75, // 1 min 15 sec
      };

      render(<MessageAttachment message={msg} side="them" />);
      expect(screen.getByText("1:15")).toBeInTheDocument();
      expect(screen.getByText("0:00")).toBeInTheDocument();

      const slider = screen.getByRole("slider", { name: "Seek voice message" }) as HTMLInputElement;
      expect(slider.max).toBe("75");
      expect(slider.min).toBe("0");
    });

    it("allows seeking via range input and updates currentTime", () => {
      const msg: ChatMessage = {
        ...baseMessage,
        attachmentUrl: "/uploads/documents/voice.mp3",
        attachmentName: "voice.mp3",
        attachmentMime: "audio/mpeg",
        attachmentDuration: 60,
      };

      const { container } = render(<MessageAttachment message={msg} side="me" />);
      const slider = screen.getByRole("slider", { name: "Seek voice message" }) as HTMLInputElement;
      const audio = container.querySelector("audio") as HTMLAudioElement;

      fireEvent.change(slider, { target: { value: "25" } });
      expect(slider.value).toBe("25");
      expect(audio.currentTime).toBe(25);
      expect(screen.getByText("0:25")).toBeInTheDocument();
    });

    it("toggles play/pause when the action button is clicked", async () => {
      const msg: ChatMessage = {
        ...baseMessage,
        attachmentUrl: "/uploads/documents/voice.webm",
        attachmentName: "voice.webm",
        attachmentMime: "audio/webm",
        attachmentDuration: 30,
      };

      const { container } = render(<MessageAttachment message={msg} side="them" />);
      const button = screen.getByRole("button", { name: "Play voice message" });
      const audio = container.querySelector("audio") as HTMLAudioElement;

      // Click play
      await act(async () => {
        fireEvent.click(button);
      });
      expect(audio.play).toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Pause voice message" })).toBeInTheDocument();

      // Click pause
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Pause voice message" }));
      });
      expect(audio.pause).toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Play voice message" })).toBeInTheDocument();
    });

    it("ensures only one voice note plays at a time: starting one pauses any other", async () => {
      const msg1: ChatMessage = {
        ...baseMessage,
        id: 101,
        attachmentUrl: "/uploads/documents/voice1.webm",
        attachmentName: "voice1.webm",
        attachmentMime: "audio/webm",
        attachmentDuration: 20,
      };

      const msg2: ChatMessage = {
        ...baseMessage,
        id: 102,
        attachmentUrl: "/uploads/documents/voice2.webm",
        attachmentName: "voice2.webm",
        attachmentMime: "audio/webm",
        attachmentDuration: 40,
      };

      const { container: container1 } = render(<MessageAttachment message={msg1} side="me" />);
      const { container: container2 } = render(<MessageAttachment message={msg2} side="them" />);

      const playButtons = screen.getAllByRole("button", { name: "Play voice message" });
      const audio1 = container1.querySelector("audio") as HTMLAudioElement;
      const audio2 = container2.querySelector("audio") as HTMLAudioElement;

      // Start playing voice note 1
      await act(async () => {
        fireEvent.click(playButtons[0]);
      });
      expect(audio1.play).toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Pause voice message" })).toBeInTheDocument();

      // Start playing voice note 2
      await act(async () => {
        fireEvent.click(playButtons[1]);
      });
      expect(audio2.play).toHaveBeenCalled();

      // Note 1 must be paused when Note 2 starts
      expect(audio1.pause).toHaveBeenCalled();
    });

    it("cleans up audio on unmount by pausing playback", () => {
      const msg: ChatMessage = {
        ...baseMessage,
        attachmentUrl: "/uploads/documents/voice.webm",
        attachmentName: "voice.webm",
        attachmentMime: "audio/webm",
        attachmentDuration: 15,
      };

      const { container, unmount } = render(<MessageAttachment message={msg} side="me" />);
      const audio = container.querySelector("audio") as HTMLAudioElement;

      unmount();
      expect(audio.pause).toHaveBeenCalled();
    });

    it("supports light/dark themes and RTL layout classes", () => {
      const msg: ChatMessage = {
        ...baseMessage,
        attachmentUrl: "/uploads/documents/voice.webm",
        attachmentName: "voice.webm",
        attachmentMime: "audio/webm",
        attachmentDuration: 15,
      };

      // Test "them" side
      const { container: containerThem } = render(
        <MessageAttachment message={msg} side="them" />,
      );
      const themBtn = containerThem.querySelector("button");
      expect(themBtn?.className).toContain("bg-electric-500");
      expect(themBtn?.className).toContain("dark:bg-electric-600");
      const themSlider = containerThem.querySelector('input[type="range"]');
      expect(themSlider?.className).toContain("dark:bg-slate-700");

      // Test "me" side
      const { container: containerMe } = render(
        <MessageAttachment message={msg} side="me" />,
      );
      const meBtn = containerMe.querySelector("button");
      expect(meBtn?.className).toContain("bg-white");
      expect(meBtn?.className).toContain("text-electric-600");
    });
  });
});
