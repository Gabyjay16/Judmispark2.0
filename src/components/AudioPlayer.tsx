import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { formatAudioDuration, generateWaveformBars } from '../utils/audio';

interface AudioPlayerProps {
  audioUrl?: string;
  duration?: number;
  userName?: string;
  isRegistrationVoice?: boolean;
  label?: string;
  seed?: string | number;
  compact?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  duration = 4,
  userName = 'User',
  isRegistrationVoice = false,
  label,
  seed = 42,
  compact = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const animIntervalRef = useRef<any>(null);

  const bars = generateWaveformBars(seed, compact ? 16 : 24);

  useEffect(() => {
    return () => {
      if (animIntervalRef.current) clearInterval(animIntervalRef.current);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isPlaying) {
      stopPlayback();
      return;
    }

    startPlayback();
  };

  const startPlayback = () => {
    setIsPlaying(true);
    setCurrentTime(0);

    // If real audio URL exists, play it
    if (audioUrl && audioUrl.startsWith('blob:')) {
      const audio = new Audio(audioUrl);
      audio.playbackRate = playbackRate;
      audioRef.current = audio;

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
      };

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      audio.play().catch(err => {
        console.warn('Real audio playback blocked or failed, falling back to synthesizer', err);
        fallbackSpeechPlayback();
      });
    } else {
      fallbackSpeechPlayback();
    }
  };

  const fallbackSpeechPlayback = () => {
    const textToSpeak = isRegistrationVoice
      ? `Hello, my name is ${userName}. I am happy to be on JudmiSpark.`
      : `Voice note from ${userName} on JudmiSpark.`;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = playbackRate;
      utterance.pitch = 1.05;
      speechUtteranceRef.current = utterance;

      const totalEstimated = Math.max(2, duration);
      const startTime = Date.now();

      animIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed >= totalEstimated) {
          stopPlayback();
        } else {
          setCurrentTime(elapsed);
        }
      }, 100);

      utterance.onend = () => {
        stopPlayback();
      };
      utterance.onerror = () => {
        stopPlayback();
      };

      window.speechSynthesis.speak(utterance);
    } else {
      // Simulate audio progress
      const totalEstimated = Math.max(2, duration);
      const startTime = Date.now();
      animIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed >= totalEstimated) {
          stopPlayback();
        } else {
          setCurrentTime(elapsed);
        }
      }, 100);
    }
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (animIntervalRef.current) {
      clearInterval(animIntervalRef.current);
      animIntervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const cycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
    if (audioRef.current) audioRef.current.playbackRate = nextRate;
  };

  const effectiveDuration = Math.max(duration, 3);
  const progressPercent = Math.min(100, (currentTime / effectiveDuration) * 100);

  if (compact) {
    return (
      <div 
        id="audio-player-compact"
        onClick={handlePlayPause}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-950/40 border border-rose-500/30 text-rose-200 hover:bg-rose-900/50 hover:border-rose-400/50 transition-all cursor-pointer select-none text-xs font-medium backdrop-blur-sm"
      >
        <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
          {isPlaying ? <Pause size={10} className="fill-current" /> : <Play size={10} className="fill-current ml-0.5" />}
        </div>
        <div className="flex items-center gap-0.5 h-3">
          {bars.slice(0, 8).map((bar, idx) => (
            <div
              key={idx}
              className={`w-0.5 rounded-full transition-all duration-150 ${
                isPlaying ? 'bg-rose-400 animate-pulse' : 'bg-rose-500/50'
              }`}
              style={{ height: `${Math.max(3, bar * 12)}px` }}
            />
          ))}
        </div>
        <span>{isPlaying ? formatAudioDuration(currentTime) : formatAudioDuration(effectiveDuration)}</span>
      </div>
    );
  }

  return (
    <div 
      id="audio-player-card"
      className={`rounded-2xl p-3 sm:p-4 border transition-all ${
        isRegistrationVoice 
          ? 'bg-gradient-to-br from-neutral-900 via-rose-950/20 to-neutral-900 border-rose-500/30' 
          : 'bg-neutral-800/80 border-neutral-700/60'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide">
          {isRegistrationVoice ? (
            <span className="flex items-center gap-1.5 text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
              <Volume2 size={12} />
              Permanent Registration Voice
            </span>
          ) : (
            <span className="text-neutral-400 flex items-center gap-1.5">
              <Volume2 size={12} />
              {label || `Voice note from ${userName}`}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={cycleSpeed}
          className="text-[11px] font-bold text-neutral-400 hover:text-neutral-200 bg-neutral-800 px-2 py-0.5 rounded-md border border-neutral-700 transition"
        >
          {playbackRate}x
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          id="audio-player-toggle-btn"
          type="button"
          onClick={handlePlayPause}
          className="w-11 h-11 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/25 hover:scale-105 active:scale-95 transition shrink-0"
        >
          {isPlaying ? (
            <Pause size={18} className="fill-current" />
          ) : (
            <Play size={18} className="fill-current ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 h-7 px-1 mb-1">
            {bars.map((bar, idx) => {
              const barPercent = (idx / bars.length) * 100;
              const hasPassed = barPercent <= progressPercent;
              return (
                <div
                  key={idx}
                  className="flex-1 flex items-center justify-center"
                >
                  <div
                    className={`w-1 rounded-full transition-all duration-150 ${
                      hasPassed
                        ? 'bg-rose-400'
                        : isPlaying
                        ? 'bg-neutral-600'
                        : 'bg-neutral-700'
                    }`}
                    style={{
                      height: `${Math.max(4, isPlaying && hasPassed ? bar * 24 : bar * 18)}px`
                    }}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] font-medium text-neutral-400 px-1">
            <span>{formatAudioDuration(currentTime)}</span>
            <span>{formatAudioDuration(effectiveDuration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
