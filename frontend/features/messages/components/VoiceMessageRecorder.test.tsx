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

      options: any;
      constructor(_stream?: any, options?: any) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        mockMediaRecorder = this;
        this.options = options;
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
    vi.useRealTimers();
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

  it("does not restart recording or re-request getUserMedia when pausing for preview", async () => {
    const onSend = vi.fn();
    const onCancel = vi.fn();

    await act(async () => {
      render(<VoiceMessageRecorder onSend={onSend} onCancel={onCancel} />);
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent.click(screen.getByTitle("Pause and review"));
      await new Promise((r) => setTimeout(r, 20));
    });

    // Must still be exactly 1 call — no re-request or effect re-execution
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Voice message preview")).toBeInTheDocument();
  });

  it("discards recording and does not call onSend if duration is under 1 second", async () => {
    const onSend = vi.fn();
    const onCancel = vi.fn();

    await act(async () => {
      render(<VoiceMessageRecorder onSend={onSend} onCancel={onCancel} />);
      await new Promise((r) => setTimeout(r, 20));
    });

    // Click send immediately at 0 seconds
    await act(async () => {
      fireEvent.click(screen.getByTitle("Send voice message"));
    });

    expect(onSend).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalled();
  });

  it("packages audio blob into a File and calls onSend with explicit duration", async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();

    vi.useFakeTimers();

    await act(async () => {
      render(<VoiceMessageRecorder onSend={onSend} onCancel={onCancel} />);
      await Promise.resolve();
      await Promise.resolve();
    });

    // Advance timer by 3 seconds
    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
    });

    await act(async () => {
      fireEvent.click(screen.getByTitle("Send voice message"));
      await Promise.resolve();
    });

    expect(onSend).toHaveBeenCalledWith(expect.any(File), 3);

    const sentFile = onSend.mock.calls[0][0] as File;
    expect(sentFile.name).toMatch(/^voice-message-\d+\.webm$/);

    vi.useRealTimers();
  });

  it("auto-stops recording and moves to preview when reaching 300 seconds", async () => {
    const onSend = vi.fn();
    const onCancel = vi.fn();

    vi.useFakeTimers();

    await act(async () => {
      render(<VoiceMessageRecorder onSend={onSend} onCancel={onCancel} />);
      await Promise.resolve();
      await Promise.resolve();
    });

    // Advance timer past 300 seconds
    await act(async () => {
      vi.advanceTimersByTime(301000);
      await Promise.resolve();
    });

    expect(mockMediaRecorder.stop).toHaveBeenCalled();
    expect(screen.getByText("Voice message preview")).toBeInTheDocument();

    vi.useRealTimers();
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

  it("dispatches global audio event on mount to pause any playing voice message when recording starts", async () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    const onSend = vi.fn();
    const onCancel = vi.fn();

    await act(async () => {
      render(<VoiceMessageRecorder onSend={onSend} onCancel={onCancel} />);
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "clinka:voice-message:play",
      }),
    );
  });

  it("stops active recording and transitions to preview if another voice note starts playing", async () => {
    const onSend = vi.fn();
    const onCancel = vi.fn();

    await act(async () => {
      render(<VoiceMessageRecorder onSend={onSend} onCancel={onCancel} />);
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(mockMediaRecorder.state).toBe("recording");

    // Simulate another voice note starting playback
    await act(async () => {
      window.dispatchEvent(
        new CustomEvent("clinka:voice-message:play", {
          detail: { playerId: "other-voice-player" },
        }),
      );
    });

    expect(mockMediaRecorder.stop).toHaveBeenCalled();
    expect(screen.getByText("Voice message preview")).toBeInTheDocument();
  });

  it("resets navigator.audioSession.type to playback when recording is cleaned up or discarded", async () => {
    const mockAudioSession = { type: "play-and-record" };
    Object.defineProperty(navigator, "audioSession", {
      value: mockAudioSession,
      writable: true,
      configurable: true,
    });

    const onSend = vi.fn();
    const onCancel = vi.fn();

    await act(async () => {
      render(<VoiceMessageRecorder onSend={onSend} onCancel={onCancel} />);
      await new Promise((r) => setTimeout(r, 20));
    });

    await act(async () => {
      fireEvent.click(screen.getByTitle("Discard recording"));
    });

    expect(mockAudioSession.type).toBe("playback");
  });

  it("prioritizes audio/mp4 on Apple / iOS devices for native hardware encoding", async () => {
    const originalUserAgent = navigator.userAgent;
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      configurable: true,
    });

    const onSend = vi.fn();
    const onCancel = vi.fn();

    await act(async () => {
      render(<VoiceMessageRecorder onSend={onSend} onCancel={onCancel} />);
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(mockMediaRecorder.options?.mimeType).toBe("audio/mp4");

    Object.defineProperty(navigator, "userAgent", {
      value: originalUserAgent,
      configurable: true,
    });
  });
});
