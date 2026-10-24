import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { VoiceMessageRecorder } from "./VoiceMessageRecorder";

describe("VoiceMessageRecorder", () => {
  let mockStream: any;
  let mockTrack: any;
  let mockMediaRecorder: any;

  beforeEach(() => {
    mockTrack = {
      stop: vi.fn(),
    };

    mockStream = {
      getTracks: vi.fn().mockReturnValue([mockTrack]),
    };

    // Mock navigator.mediaDevices.getUserMedia
    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
      writable: true,
      configurable: true,
    });

    // Mock MediaRecorder
    class MockMediaRecorder {
      static isTypeSupported = vi.fn().mockReturnValue(true);
      state = "inactive";
      ondataavailable: ((e: any) => void) | null = null;
      onstop: (() => void) | null = null;

      start = vi.fn(() => {
        this.state = "recording";
      });

      stop = vi.fn(() => {
        this.state = "inactive";
        if (this.ondataavailable) {
          this.ondataavailable({
            data: new Blob(["dummy audio bytes"], { type: "audio/webm" }),
          });
        }
        if (this.onstop) {
          this.onstop();
        }
      });

      constructor() {
        mockMediaRecorder = this;
      }
    }

    (globalThis as any).MediaRecorder = MockMediaRecorder;
    window.MediaRecorder = MockMediaRecorder as any;

    const mockCreateObjectURL = vi.fn().mockReturnValue("blob:http://localhost/mock-audio");
    const mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;
    window.URL.createObjectURL = mockCreateObjectURL;
    window.URL.revokeObjectURL = mockRevokeObjectURL;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requests audio stream and initializes recording with timer and controls", async () => {
    const onSend = vi.fn();
    const onCancel = vi.fn();

    await act(async () => {
      render(<VoiceMessageRecorder onSend={onSend} onCancel={onCancel} />);
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
      expect.objectContaining({ audio: expect.any(Object) }),
    );
    expect(mockMediaRecorder.start).toHaveBeenCalled();
    expect(screen.getByTitle("Discard recording")).toBeInTheDocument();
    expect(screen.getByTitle("Pause and review")).toBeInTheDocument();
    expect(screen.getByTitle("Send voice message")).toBeInTheDocument();
  });

  it("stops tracks and cancels when discard button is clicked", async () => {
    const onSend = vi.fn();
    const onCancel = vi.fn();

    await act(async () => {
      render(<VoiceMessageRecorder onSend={onSend} onCancel={onCancel} />);
      await new Promise((r) => setTimeout(r, 20));
    });

    await act(async () => {
      fireEvent.click(screen.getByTitle("Discard recording"));
    });

    expect(mockTrack.stop).toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalled();
  });

  it("transitions to preview mode when pause/stop is clicked", async () => {
    const onSend = vi.fn();
    const onCancel = vi.fn();

    await act(async () => {
      render(<VoiceMessageRecorder onSend={onSend} onCancel={onCancel} />);
      await new Promise((r) => setTimeout(r, 20));
    });

    await act(async () => {
      fireEvent.click(screen.getByTitle("Pause and review"));
    });

    await vi.waitFor(() => {
      expect(screen.getByText("Voice message preview")).toBeInTheDocument();
      expect(screen.getByTitle("Send voice message")).toBeInTheDocument();
    });
  });

  it("packages audio blob into a File and calls onSend", async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();

    await act(async () => {
      render(<VoiceMessageRecorder onSend={onSend} onCancel={onCancel} />);
      await new Promise((r) => setTimeout(r, 20));
    });

    await act(async () => {
      fireEvent.click(screen.getByTitle("Send voice message"));
    });

    await vi.waitFor(() => {
      expect(onSend).toHaveBeenCalledWith(expect.any(File), expect.any(Number));
    });

    const sentFile = onSend.mock.calls[0][0] as File;
    expect(sentFile.name).toMatch(/^voice-message-\d+-dur\d+\.webm$/);
  });

  it("handles microphone permission denial gracefully", async () => {
    const onSend = vi.fn();
    const onCancel = vi.fn();
    const onError = vi.fn();

    const notAllowed = new Error("Permission denied");
    notAllowed.name = "NotAllowedError";
    navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(notAllowed);

    await act(async () => {
      render(<VoiceMessageRecorder onSend={onSend} onCancel={onCancel} onError={onError} />);
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(onError).toHaveBeenCalledWith(
      expect.stringContaining("Microphone permission was denied"),
    );
    expect(onCancel).toHaveBeenCalled();
  });
});
