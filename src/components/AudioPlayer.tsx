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
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F2E7DF] border border-[#E9DDD5] text-[#2D151E] hover:bg-[#EBDED6] transition-all cursor-pointer select-none text-xs font-medium"
      >
        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#FF4A70] to-[#FF7B60] text-white flex items-center justify-center shrink-0 shadow-xs">
          {isPlaying ? <Pause size={10} className="fill-current" /> : <Play size={10} className="fill-current ml-0.5" />}
        </div>
        <div className="flex items-center gap-0.5 h-3">
          {bars.slice(0, 8).map((bar, idx) => (
            <div
              key={idx}
              className={`w-0.5 rounded-full transition-all duration-150 ${
                isPlaying ? 'bg-[#FF4A70] animate-pulse' : 'bg-[#D9C8D0]'
              }`}
              style={{ height: `${Math.max(3, bar * 12)}px` }}
            />
          ))}
        </div>
        <span className="text-[#8A767E] text-[11px] font-bold">{isPlaying ? formatAudioDuration(currentTime) : formatAudioDuration(effectiveDuration)}</span>
      </div>
    );
  }

  return (
    <div 
      id="audio-player-card"
      className={`rounded-2xl p-2.5 sm:p-3 border transition-all ${
        isRegistrationVoice 
          ? 'bg-white/90 border-[#F0E2DA] shadow-xs' 
          : 'bg-[#FAF4F0] border-[#E9DDD5]'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide">
          {isRegistrationVoice ? (
            <span className="flex items-center gap-1.5 text-[#FF4A70] bg-[#FF4A70]/10 px-2.5 py-0.5 rounded-full border border-[#FF4A70]/20 text-[10px] font-bold">
              <Volume2 size={11} />
              Voice Intro (Verified)
            </span>
          ) : (
            <span className="text-[#8A767E] flex items-center gap-1.5 text-[11px] font-bold">
              <Volume2 size={11} className="text-[#FF4A70]" />
              {label || `Voice note from ${userName}`}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={cycleSpeed}
          className="text-[10px] font-bold text-[#8A767E] hover:text-[#2D151E] bg-[#F2E7DF] px-1.5 py-0.5 rounded-md border border-[#E9DDD5] transition cursor-pointer"
        >
          {playbackRate}x
        </button>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          id="audio-player-toggle-btn"
          type="button"
          onClick={handlePlayPause}
          className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FF4A70] to-[#FF7B60] text-white flex items-center justify-center shadow-md shadow-rose-500/20 hover:scale-105 active:scale-95 transition shrink-0 cursor-pointer"
        >
          {isPlaying ? (
            <Pause size={14} className="fill-current" />
          ) : (
            <Play size={14} className="fill-current ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 h-5 px-1 mb-0.5">
            {bars.map((bar, idx) => {
              const barPercent = (idx / bars.length) * 100;
              const hasPassed = barPercent <= progressPercent;
              return (
                <div
                  key={idx}
                  className="flex-1 flex items-center justify-center"
                >
                  <div
                    className={`w-0.75 sm:w-1 rounded-full transition-all duration-150 ${
                      hasPassed
                        ? 'bg-[#FF4A70]'
                        : isPlaying
                        ? 'bg-[#E0CCD6]'
                        : 'bg-[#EBDED6]'
                    }`}
                    style={{
                      height: `${Math.max(3, isPlaying && hasPassed ? bar * 18 : bar * 14)}px`
                    }}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] font-medium text-[#8A767E] px-1">
            <span>{formatAudioDuration(currentTime)}</span>
            <span>{formatAudioDuration(effectiveDuration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
