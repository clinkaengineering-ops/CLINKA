"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { IconPlay, IconPause, IconMic } from "@/components/Icons";
import { cn } from "@/utils/cn";

import type { ChatMessage } from "../types";

interface VoiceMessagePlayerProps {
  url: string;
  side: "me" | "them";
  filename?: string;
  name?: string;
  duration?: number | null;
  storedDuration?: number | null;
  message?: ChatMessage;
}

const GLOBAL_AUDIO_EVENT = "clinka:voice-message:play";

function formatAudioTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

/**
 * Deterministic waveform bar heights based on the audio filename/URL.
 */
function generateWaveformBars(seed: string, count = 28): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    const x = Math.sin(hash + i * 1.7) * 10000;
    const rand = x - Math.floor(x);
    const base = 0.25 + 0.7 * Math.pow(rand, 1.2);
    bars.push(Math.max(0.2, Math.min(1, Number(base.toFixed(2)))));
  }
  return bars;
}

const SPEED_OPTIONS = [1, 1.5, 2] as const;

export function VoiceMessagePlayer({
  url,
  side,
  filename,
  name,
  duration: explicitDuration,
  storedDuration,
  message,
}: VoiceMessagePlayerProps) {
  const initialDuration = explicitDuration ?? storedDuration ?? message?.attachmentDuration ?? null;
  const effectiveFilename = filename ?? name ?? message?.attachmentName;

  const playerId = useId();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number>(() =>
    typeof initialDuration === "number" && initialDuration > 0 ? initialDuration : 0,
  );
  const [playbackSpeed, setPlaybackSpeed] = useState<(typeof SPEED_OPTIONS)[number]>(1);
  const [loadError, setLoadError] = useState(false);

  const bars = useMemo(() => generateWaveformBars(effectiveFilename || url, 28), [effectiveFilename, url]);

  // Sync duration if initialDuration prop changes
  useEffect(() => {
    if (typeof initialDuration === "number" && initialDuration > 0) {
      setDuration(initialDuration);
    }
  }, [initialDuration]);

  const isPlayingRef = useRef(false);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Pause when another voice message starts playing anywhere in the chat
  useEffect(() => {
    const handleGlobalPlay = (e: Event) => {
      const customEvent = e as CustomEvent<{ playerId: string }>;
      if (customEvent.detail?.playerId !== playerId) {
        if (audioRef.current && (isPlayingRef.current || !audioRef.current.paused)) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      }
    };

    window.addEventListener(GLOBAL_AUDIO_EVENT, handleGlobalPlay as EventListener);
    return () => {
      window.removeEventListener(GLOBAL_AUDIO_EVENT, handleGlobalPlay as EventListener);
    };
  }, [playerId]);

  // Cleanup on unmount: pause playback
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
      }
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      window.dispatchEvent(
        new CustomEvent(GLOBAL_AUDIO_EVENT, { detail: { playerId } }),
      );
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setLoadError(true));
    }
  }, [isPlaying, playerId]);

  const cycleSpeed = useCallback(() => {
    const nextIndex = (SPEED_OPTIONS.indexOf(playbackSpeed) + 1) % SPEED_OPTIONS.length;
    const nextSpeed = SPEED_OPTIONS[nextIndex];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  }, [playbackSpeed]);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  }, []);

  const isMe = side === "me";
  const progressRatio = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  if (loadError) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        download={filename ?? "voice-message.webm"}
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition",
          isMe
            ? "bg-white/15 text-white hover:bg-white/25"
            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700",
        )}
      >
        <IconMic width={14} height={14} />
        <span>Voice message (Tap to download)</span>
      </a>
    );
  }

  return (
    <div
      data-testid="voice-message-player"
      dir="ltr"
      className={cn(
        "flex flex-col gap-1.5 py-1 min-w-[250px] max-w-[320px] select-none",
        isMe ? "text-white" : "text-slate-900 dark:text-slate-100",
      )}
    >
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) {
            setDuration(d);
          }
        }}
        onDurationChange={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) {
            setDuration(d);
          }
        }}
        onTimeUpdate={(e) => {
          setCurrentTime(e.currentTarget.currentTime);
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
          if (audioRef.current) audioRef.current.currentTime = 0;
        }}
        onError={() => setLoadError(true)}
      />

      <div className="flex items-center gap-3">
        {/* Play / Pause round action button */}
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause voice message" : "Play voice message"}
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-sm",
            isMe
              ? "bg-white text-electric-600 hover:bg-white/95"
              : "bg-electric-500 dark:bg-electric-600 text-white hover:bg-electric-600 dark:hover:bg-electric-500",
          )}
        >
          {isPlaying ? (
            <IconPause width={18} height={18} className="fill-current" />
          ) : (
            <IconPlay width={18} height={18} className="fill-current ms-0.5" />
          )}
        </button>

        {/* Waveform track & Range Slider */}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <div className="relative flex items-center h-7 py-1">
            {/* Waveform visualization bars */}
            <div className="absolute inset-0 flex items-center gap-[2.5px] pointer-events-none">
              {bars.map((heightMultiplier, idx) => {
                const barProgress = (idx + 0.5) / bars.length;
                const hasPlayed = barProgress <= progressRatio;

                return (
                  <span
                    key={idx}
                    style={{ height: `${Math.round(heightMultiplier * 22)}px` }}
                    className={cn(
                      "flex-1 rounded-full transition-colors duration-100",
                      isMe
                        ? hasPlayed
                          ? "bg-white"
                          : "bg-white/35"
                        : hasPlayed
                          ? "bg-electric-500 dark:bg-electric-400"
                          : "bg-slate-300 dark:bg-slate-700",
                    )}
                  />
                );
              })}
            </div>

            {/* Accessible seek slider overlay */}
            <input
              type="range"
              aria-label="Seek voice message"
              min="0"
              max={duration || 100}
              step="any"
              value={currentTime}
              onChange={handleSliderChange}
              className={cn(
                "relative z-10 w-full h-7 opacity-0 cursor-pointer appearance-none bg-transparent",
                isMe ? "dark:bg-slate-700" : "dark:bg-slate-700",
              )}
            />
          </div>

          {/* Time & speed controls */}
          <div
            className={cn(
              "flex items-center justify-between text-[11px] font-medium leading-none px-0.5",
              isMe ? "text-white/80" : "text-slate-500 dark:text-slate-400",
            )}
          >
            <div className="flex items-center gap-1.5">
              <span>{formatAudioTime(currentTime)}</span>
              <span>/</span>
              <span>{formatAudioTime(duration)}</span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* WhatsApp-style playback speed pill */}
              <button
                type="button"
                onClick={cycleSpeed}
                title="Change playback speed"
                aria-label={`Playback speed ${playbackSpeed}x`}
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-bold transition",
                  isMe
                    ? "bg-white/20 hover:bg-white/30 text-white"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300",
                )}
              >
                {playbackSpeed}x
              </button>

              <IconMic
                width={12}
                height={12}
                className={cn(
                  "opacity-75",
                  isMe ? "text-white" : "text-electric-500 dark:text-electric-400",
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
