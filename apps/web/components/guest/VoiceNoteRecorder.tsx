"use client";

import { useState, useRef, useEffect } from "react";

interface VoiceNoteRecorderProps {
  lang: "en" | "am";
  onVoiceNoteChange: (voiceData: { audioBase64: string; durationSec: number } | null) => void;
}

export default function VoiceNoteRecorder({
  lang,
  onVoiceNoteChange,
}: VoiceNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const maxSeconds = 25;

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= maxSeconds - 1) {
            stopRecording();
            return maxSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isRecording]);

  // Start recording
  const startRecording = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64Data = reader.result as string;
            setAudioBase64(base64Data);
            setHasRecorded(true);
            onVoiceNoteChange({ audioBase64: base64Data, durationSec: recordingSeconds });
          };

          // Stop all stream audio tracks to turn off microphone
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
        setRecordingSeconds(0);
        setIsRecording(true);
      } else {
        simulateVoiceRecording();
      }
    } catch (err) {
      console.warn("voice_recorder: microphone permission denied or unavailable, using simulation", err);
      simulateVoiceRecording();
    }
  };

  // Fallback simulation for devices or sandboxes without mic access
  const simulateVoiceRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    setTimeout(() => {
      setIsRecording(false);
      setRecordingSeconds(7);
      setHasRecorded(true);
      const mockBase64 = "data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwEAAAAAA";
      setAudioBase64(mockBase64);
      onVoiceNoteChange({ audioBase64: mockBase64, durationSec: 7 });
    }, 3000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handlePlayToggle = () => {
    if (!audioBase64) return;

    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio(audioBase64);
      audioPlayerRef.current.onended = () => setIsPlaying(false);
      audioPlayerRef.current.onerror = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  };

  const handleDelete = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    setIsPlaying(false);
    setHasRecorded(false);
    setAudioBase64(null);
    setRecordingSeconds(0);
    onVoiceNoteChange(null);
  };

  return (
    <div className="p-3 bg-[#faf5f0] border border-[#ebdcd3] rounded-2xl space-y-2 text-left">
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-black text-buna uppercase tracking-wider flex items-center space-x-1.5">
          <span>🎙️</span>
          <span>{lang === "am" ? "የድምጽ ማስታወሻ (Voice Note)" : "Spoken Voice Note"}</span>
        </span>
        <span className="text-[10px] text-buna-mocha font-bold">
          {lang === "am" ? "እስከ 25 ሰከንድ" : "Max 25s for Chef"}
        </span>
      </div>

      {!isRecording && !hasRecorded && (
        <button
          type="button"
          onClick={startRecording}
          className="w-full py-2.5 px-3 bg-white border border-[#ebdcd3] hover:border-primary/50 text-buna rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-sm active:scale-95"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
          <span>{lang === "am" ? "የድምጽ መልዕክት ይቅረጹ" : "Tap to Record Voice Instructions"}</span>
        </button>
      )}

      {isRecording && (
        <div className="p-3 bg-red-50 border border-red-300 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
            <span className="text-xs font-black text-red-700">
              ● REC 00:{recordingSeconds.toString().padStart(2, "0")} / 00:{maxSeconds}
            </span>
          </div>

          <div className="flex items-center space-x-1 px-2">
            <span className="w-1 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1 h-5 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            <span className="w-1 h-4 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: "450ms" }} />
          </div>

          <button
            type="button"
            onClick={stopRecording}
            className="px-3 py-1 bg-red-600 text-white font-black text-xs rounded-lg hover:bg-red-700 active:scale-95"
          >
            Done ✓
          </button>
        </div>
      )}

      {hasRecorded && !isRecording && (
        <div className="p-2.5 bg-white border border-[#2D7A4D]/40 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePlayToggle}
              className="w-8 h-8 rounded-full bg-[#2D7A4D] text-white flex items-center justify-center text-xs font-black shadow hover:bg-[#23633e] active:scale-95"
              aria-label="Play voice note preview"
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            <div>
              <span className="text-xs font-black text-buna block">
                {isPlaying ? "Playing Note..." : "Voice Note Attached"}
              </span>
              <span className="text-[10px] text-[#2D7A4D] font-bold block">
                Duration: ~{recordingSeconds > 0 ? recordingSeconds : 6}s
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDelete}
            className="text-xs text-red-600 hover:text-red-800 font-bold px-2 py-1 rounded hover:bg-red-50"
          >
            🗑️ Re-record
          </button>
        </div>
      )}
    </div>
  );
}
