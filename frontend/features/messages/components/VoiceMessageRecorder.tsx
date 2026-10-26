"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { IconTrash, IconSend, IconPlay, IconPause, IconSquare } from "@/components/Icons";

interface VoiceMessageRecorderProps {
  onSend: (file: File, duration?: number) => Promise<void> | void;
  onCancel: () => void;
  onError?: (message: string) => void;
  disabled?: boolean;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function getBestMimeType(): { mimeType: string; ext: string } {
  if (typeof MediaRecorder === "undefined") {
    return { mimeType: "audio/webm", ext: ".webm" };
  }

  const types = [
    { mimeType: "audio/webm;codecs=opus", ext: ".webm" },
    { mimeType: "audio/webm", ext: ".webm" },
    { mimeType: "audio/mp4", ext: ".m4a" },
    { mimeType: "audio/ogg;codecs=opus", ext: ".ogg" },
  ];

  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t.mimeType)) {
      return t;
    }
  }

  return { mimeType: "audio/webm", ext: ".webm" };
}

/** Must match the constant in VoiceMessagePlayer so both participate in the same pause system. */
const GLOBAL_AUDIO_EVENT = "clinka:voice-message:play";

export function VoiceMessageRecorder({
  onSend,
  onCancel,
  onError,
  disabled = false,
}: VoiceMessageRecorderProps) {
  const [isPausedForPreview, setIsPausedForPreview] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [sending, setSending] = useState(false);

  // Preview state
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);

  // Live visualizer bars (16 bars)
  const [volumeLevels, setVolumeLevels] = useState<number[]>(() => Array(16).fill(0.2));

  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const mimeConfigRef = useRef(getBestMimeType());

  // Unique ID so the global pause system can distinguish this recorder
  const recorderId = useId();

  // Cleanup helper
  const cleanupStream = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const previewUrlRef = useRef<string | null>(null);
  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  const onCancelRef = useRef(onCancel);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onCancelRef.current = onCancel;
    onErrorRef.current = onError;
  }, [onCancel, onError]);

  // Handle Pause & Preview
  const handlePauseForPreview = useCallback(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: mimeConfigRef.current.mimeType,
      });
      setPreviewBlob(blob);
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
      const url = URL.createObjectURL(blob);
      previewUrlRef.current = url;
      setPreviewUrl(url);
      setIsPausedForPreview(true);
    };

    mediaRecorderRef.current.stop();
    cleanupStream();
  }, [cleanupStream]);

  const handlePauseForPreviewRef = useRef(handlePauseForPreview);
  useEffect(() => {
    handlePauseForPreviewRef.current = handlePauseForPreview;
  }, [handlePauseForPreview]);

  // On mount: pause every other voice message that may be playing.
  // This prevents echo/feedback when the microphone starts capturing.
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(GLOBAL_AUDIO_EVENT, { detail: { playerId: recorderId } }),
    );
  }, [recorderId]);

  // If another voice player starts playing or recording starts elsewhere:
  // 1. If actively recording: stop recording and transition to preview to avoid capturing speaker audio
  // 2. If previewing audio: pause preview playback
  useEffect(() => {
    const handleGlobalPlay = (e: Event) => {
      const customEvent = e as CustomEvent<{ playerId: string }>;
      if (customEvent.detail?.playerId !== recorderId) {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          handlePauseForPreviewRef.current();
        }
        const audio = previewAudioRef.current;
        if (audio && !audio.paused) {
          audio.pause();
          setIsPlayingPreview(false);
        }
      }
    };

    window.addEventListener(GLOBAL_AUDIO_EVENT, handleGlobalPlay as EventListener);
    return () => {
      window.removeEventListener(GLOBAL_AUDIO_EVENT, handleGlobalPlay as EventListener);
    };
  }, [recorderId]);

  // Start recording on mount
  useEffect(() => {
    let isMounted = true;

    async function initRecording() {
      if (!navigator.mediaDevices?.getUserMedia) {
        onErrorRef.current?.("Audio recording is not supported in this browser.");
        onCancelRef.current();
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        mimeConfigRef.current = getBestMimeType();

        const recorder = new MediaRecorder(stream, {
          mimeType: mimeConfigRef.current.mimeType,
        });

        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        mediaRecorderRef.current = recorder;
        recorder.start(100);

        // Start duration timer with 300s limit
        timerRef.current = setInterval(() => {
          setSeconds((prev) => {
            if (prev >= 300) return 300;
            const next = prev + 1;
            if (next >= 300) {
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              handlePauseForPreviewRef.current();
              return 300;
            }
            return next;
          });
        }, 1000);

        // Start live audio visualizer
        try {
          const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            audioContextRef.current = ctx;
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            analyser.smoothingTimeConstant = 0.6;
            source.connect(analyser);
            analyserRef.current = analyser;

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const updateVisualizer = () => {
              if (!analyserRef.current || !isMounted) return;
              analyserRef.current.getByteFrequencyData(dataArray);

              // Downsample to 16 bars
              const newLevels: number[] = [];
              const step = Math.floor(bufferLength / 16) || 1;
              for (let i = 0; i < 16; i++) {
                const val = dataArray[i * step] || 0;
                // Normalize 0..255 to 0.15..1.0
                newLevels.push(Math.max(0.15, Math.min(1, val / 180)));
              }
              setVolumeLevels(newLevels);
              animFrameRef.current = requestAnimationFrame(updateVisualizer);
            };

            animFrameRef.current = requestAnimationFrame(updateVisualizer);
          }
        } catch {
          // If AudioContext fails, silent fallback (bars remain gentle)
        }
      } catch (err: unknown) {
        cleanupStream();
        if (!isMounted) return;
        const e = err as { name?: string; message?: string };
        if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
          onErrorRef.current?.(
            "Microphone permission was denied. Please allow microphone access in your browser settings.",
          );
        } else if (e.name === "NotFoundError" || e.name === "DevicesNotFoundError") {
          onErrorRef.current?.("No microphone detected. Please connect a microphone to send voice messages.");
        } else {
          onErrorRef.current?.(e.message || "Failed to access microphone.");
        }
        onCancelRef.current();
      }
    }

    initRecording();

    return () => {
      isMounted = false;
      cleanupStream();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, [cleanupStream]);

  // Handle Discard / Cancel
  const handleDiscard = useCallback(() => {
    cleanupStream();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    chunksRef.current = [];
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
    setPreviewBlob(null);
    onCancel();
  }, [cleanupStream, onCancel]);

  // Handle Send
  const handleFinalSend = useCallback(async () => {
    if (sending || disabled) return;

    // Discard recordings under 1 second without sending
    if (seconds < 1) {
      handleDiscard();
      return;
    }

    setSending(true);

    try {
      let finalBlob = previewBlob;

      if (!finalBlob) {
        // Stop recorder and wait for chunks
        const recorder = mediaRecorderRef.current;
        if (recorder && recorder.state !== "inactive") {
          await new Promise<void>((resolve) => {
            recorder.onstop = () => resolve();
            recorder.stop();
          });
        }
        cleanupStream();
        finalBlob = new Blob(chunksRef.current, {
          type: mimeConfigRef.current.mimeType,
        });
      }

      if (finalBlob.size === 0) {
        onError?.("Voice message was empty. Please record again.");
        onCancel();
        return;
      }

      const { ext } = mimeConfigRef.current;
      const durationSecs = Math.max(1, Math.min(300, Math.round(seconds)));
      const filename = `voice-message-${Date.now()}${ext}`;
      const file = new File([finalBlob], filename, {
        type: mimeConfigRef.current.mimeType,
      });

      await onSend(file, durationSecs);
    } catch (e: unknown) {
      const err = e as { message?: string };
      onError?.(err.message || "Failed to send voice message.");
    } finally {
      cleanupStream();
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      setSending(false);
    }
  }, [cleanupStream, disabled, handleDiscard, onError, onCancel, onSend, previewBlob, seconds, sending]);

  // Preview playback controls
  const togglePreviewPlay = () => {
    const audio = previewAudioRef.current;
    if (!audio) return;
    if (isPlayingPreview) {
      audio.pause();
      setIsPlayingPreview(false);
    } else {
      // Pause any other voice message that's playing
      window.dispatchEvent(
        new CustomEvent(GLOBAL_AUDIO_EVENT, { detail: { playerId: recorderId } }),
      );
      audio
        .play()
        .then(() => setIsPlayingPreview(true))
        .catch(() => {});
    }
  };

  return (
    <div className="flex items-center gap-3 w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm animate-fade-in">
      {previewUrl && (
        <audio
          ref={previewAudioRef}
          src={previewUrl}
          onTimeUpdate={(e) => {
            const ct = e.currentTarget.currentTime;
            // Force-stop preview if currentTime exceeds recorded seconds
            if (seconds > 0 && ct >= seconds + 0.3) {
              e.currentTarget.pause();
              e.currentTarget.currentTime = 0;
              setIsPlayingPreview(false);
              setPreviewTime(0);
              return;
            }
            setPreviewTime(ct);
          }}
          onEnded={() => {
            setIsPlayingPreview(false);
            setPreviewTime(0);
            if (previewAudioRef.current) previewAudioRef.current.currentTime = 0;
          }}
        />
      )}

      {/* Discard button */}
      <button
        type="button"
        onClick={handleDiscard}
        disabled={sending}
        title="Discard recording"
        className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0"
      >
        <IconTrash width={16} height={16} />
      </button>

      {/* Middle status bar */}
      <div className="flex-1 flex items-center gap-3 min-w-0">
        {!isPausedForPreview ? (
          <>
            {/* Pulsing red record indicator */}
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
            </span>

            {/* Live recording timer */}
            <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200 shrink-0">
              {formatDuration(seconds)}
            </span>

            {/* Live dynamic sound wave visualizer */}
            <div className="flex-1 flex items-center gap-[3px] h-6 px-2 min-w-0">
              {volumeLevels.map((lvl, idx) => (
                <span
                  key={idx}
                  style={{ height: `${Math.round(lvl * 20)}px` }}
                  className="w-1 rounded-full bg-rose-500/80 transition-all duration-75"
                />
              ))}
            </div>

            {/* Pause/Stop to preview before sending */}
            <button
              type="button"
              onClick={handlePauseForPreview}
              title="Pause and review"
              className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition shrink-0"
            >
              <IconSquare width={14} height={14} className="fill-current text-slate-600 dark:text-slate-300" />
            </button>
          </>
        ) : (
          <>
            {/* Preview play button */}
            <button
              type="button"
              onClick={togglePreviewPlay}
              className="h-8 w-8 rounded-full bg-electric-500 text-white flex items-center justify-center shrink-0 hover:bg-electric-600 transition"
            >
              {isPlayingPreview ? (
                <IconPause width={14} height={14} className="fill-current" />
              ) : (
                <IconPlay width={14} height={14} className="fill-current ms-0.5" />
              )}
            </button>

            {/* Preview timer */}
            <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200 shrink-0">
              {formatDuration(Math.round(isPlayingPreview ? previewTime : seconds))}
            </span>

            <span className="text-xs text-slate-400 truncate">
              Voice message preview
            </span>
          </>
        )}
      </div>

      {/* Send voice message button */}
      <button
        type="button"
        onClick={handleFinalSend}
        disabled={sending || disabled}
        title="Send voice message"
        className="h-9 w-9 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30 transition-transform active:scale-95"
      >
        <IconSend width={16} height={16} />
      </button>
    </div>
  );
}
