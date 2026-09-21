import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, RotateCcw, Check, Volume2, ShieldAlert } from 'lucide-react';
import { AudioRecordingService, RecordedAudioData, formatAudioDuration } from '../utils/audio';
import { AudioPlayer } from './AudioPlayer';

interface AudioRecorderProps {
  userName?: string;
  isRegistration?: boolean;
  onRecordingComplete: (data: RecordedAudioData) => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  userName = 'Your Name',
  isRegistration = false,
  onRecordingComplete,
  onCancel,
  title,
  description
}) => {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'preview'>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [recordedData, setRecordedData] = useState<RecordedAudioData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const recorderRef = useRef<AudioRecordingService | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    recorderRef.current = new AudioRecordingService();
    return () => {
      if (recorderRef.current) recorderRef.current.cancelRecording();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const handleStartRecording = async () => {
    setErrorMsg(null);
    setElapsedSeconds(0);
    if (!recorderRef.current) return;

    try {
      const started = await recorderRef.current.startRecording();
      if (started) {
        setRecordingState('recording');
        const start = Date.now();
        timerIntervalRef.current = window.setInterval(() => {
          setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
        }, 200);
      }
    } catch {
      setErrorMsg('Could not start microphone. Voice note simulated mode will be used.');
      setRecordingState('recording');
    }
  };

  const handleStopRecording = async () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (!recorderRef.current) return;

    const data = await recorderRef.current.stopRecording(
      isRegistration ? `Hello, my name is ${userName}. I am happy to be on JudmiSpark.` : undefined
    );
    setRecordedData(data);
    setRecordingState('preview');
  };

  const handleReRecord = () => {
    setRecordedData(null);
    setElapsedSeconds(0);
    setRecordingState('idle');
  };

  const handleConfirm = () => {
    if (recordedData) {
      onRecordingComplete(recordedData);
    }
  };

  return (
    <div id="audio-recorder-modal" className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 max-w-md w-full mx-auto shadow-2xl">
      <div className="text-center mb-5">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-3">
          <Mic size={24} />
        </div>
        <h3 className="text-lg font-bold text-neutral-100">
          {title || (isRegistration ? 'Mandatory Voice Registration' : 'Record Voice Note')}
        </h3>
        <p className="text-xs text-neutral-400 mt-1">
          {description || (
            isRegistration 
              ? 'Voice verification makes JudmiSpark authentic and safe.' 
              : 'Speak clearly into your microphone.'
          )}
        </p>
      </div>

      {isRegistration && (
        <div className="mb-5 bg-neutral-950/80 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 mb-1.5">
            <Volume2 size={13} />
            <span>Suggested Verification Script:</span>
          </div>
          <p className="text-sm font-medium text-neutral-200 italic bg-neutral-900/60 p-3 rounded-xl border border-neutral-800/80">
            "Hello, my name is <span className="text-rose-400 font-bold underline not-italic">{userName}</span>. I am happy to be on JudmiSpark."
          </p>
          <div className="flex items-start gap-2 mt-3 text-[11px] text-amber-300/80 bg-amber-950/20 p-2.5 rounded-xl border border-amber-500/20">
            <ShieldAlert size={14} className="shrink-0 mt-0.5 text-amber-400" />
            <span>
              <strong>Permanent Record:</strong> Once confirmed, this recording cannot be deleted, edited, or replaced. It will be attached permanently to your account.
            </span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="text-xs text-amber-400 bg-amber-950/30 p-2.5 rounded-xl border border-amber-800/40 mb-4">
          {errorMsg}
        </div>
      )}

      {/* STATE 1: IDLE */}
      {recordingState === 'idle' && (
        <div className="flex flex-col items-center py-4">
          <button
            id="start-record-btn"
            type="button"
            onClick={handleStartRecording}
            className="w-20 h-20 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-xl shadow-rose-500/30 transition-all hover:scale-105 active:scale-95 group"
          >
            <Mic size={32} className="group-hover:scale-110 transition-transform" />
          </button>
          <span className="text-xs font-medium text-neutral-400 mt-4">
            Tap to start recording
          </span>
        </div>
      )}

      {/* STATE 2: RECORDING */}
      {recordingState === 'recording' && (
        <div className="flex flex-col items-center py-4">
          <div className="relative">
            <div className="absolute -inset-3 rounded-full bg-rose-500/20 animate-ping opacity-75" />
            <button
              id="stop-record-btn"
              type="button"
              onClick={handleStopRecording}
              className="relative w-20 h-20 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 transition-all hover:scale-105 active:scale-95"
            >
              <Square size={28} className="fill-current" />
            </button>
          </div>
          
          <div className="flex items-center gap-2 mt-4 text-sm font-semibold text-rose-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span>Recording: {formatAudioDuration(elapsedSeconds)}</span>
          </div>
          <span className="text-xs text-neutral-400 mt-1">Tap red square when finished</span>
        </div>
      )}

      {/* STATE 3: PREVIEW */}
      {recordingState === 'preview' && recordedData && (
        <div className="space-y-4">
          <div className="text-xs font-semibold text-neutral-400">
            Preview your recording:
          </div>
          <AudioPlayer
            audioUrl={recordedData.blobUrl}
            duration={recordedData.duration}
            userName={userName}
            isRegistrationVoice={isRegistration}
          />

          <div className="flex items-center gap-3 pt-2">
            <button
              id="rerecord-btn"
              type="button"
              onClick={handleReRecord}
              className="flex-1 py-2.5 px-4 rounded-xl border border-neutral-700 text-neutral-300 hover:bg-neutral-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <RotateCcw size={14} />
              Re-record
            </button>
            <button
              id="confirm-record-btn"
              type="button"
              onClick={handleConfirm}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-rose-500/25 transition"
            >
              <Check size={14} />
              Confirm & Save
            </button>
          </div>
        </div>
      )}

      {onCancel && recordingState === 'idle' && (
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
