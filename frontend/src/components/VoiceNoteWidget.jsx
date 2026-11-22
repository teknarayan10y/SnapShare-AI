import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Send,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Radio,
} from 'lucide-react';
import { fileAPI, publicAPI } from '../services/api';

export const VoiceNoteWidget = ({ file, onVoiceNoteUpdated, isPublic = false }) => {
  const [voiceNote, setVoiceNote] = useState(file?.voiceNote || null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [recordedBase64, setRecordedBase64] = useState(null);
  const [senderName, setSenderName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioPlayerRef = useRef(null);

  useEffect(() => {
    setVoiceNote(file?.voiceNote || null);
  }, [file]);

  // Clean up
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    setSuccess(null);
    setRecordedAudioUrl(null);
    setRecordedBase64(null);
    setRecordSeconds(0);

    try {
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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);

        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setRecordedBase64(reader.result);
        };

        // Stop mic tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordSeconds((sec) => {
          if (sec >= 30) {
            stopRecording();
            return 30;
          }
          return sec + 1;
        });
      }, 1000);
    } catch (err) {
      setError('Microphone access denied or unavailable.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resetRecording = () => {
    setRecordedAudioUrl(null);
    setRecordedBase64(null);
    setRecordSeconds(0);
    setError(null);
  };

  const handleSaveVoiceNote = async () => {
    if (!recordedBase64 || !file?._id) return;
    setIsUploading(true);
    setError(null);
    try {
      const payload = {
        audioBase64: recordedBase64,
        senderName: senderName.trim() || 'Guest',
        duration: recordSeconds,
      };

      const res = isPublic
        ? await publicAPI.attachVoiceNote(file._id, payload)
        : await fileAPI.attachVoiceNote(file._id, payload);

      if (res.data.success) {
        setVoiceNote(res.data.voiceNote);
        setSuccess('Voice memory note attached successfully!');
        resetRecording();
        if (onVoiceNoteUpdated) {
          onVoiceNoteUpdated(res.data.voiceNote);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to upload voice note');
    } finally {
      setIsUploading(false);
    }
  };

  const togglePlayExisting = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="rounded-2xl p-4 bg-white/5 border border-white/10 text-white backdrop-blur-md">
      {/* Existing Voice Note */}
      {voiceNote?.url ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Volume2 className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs font-semibold text-purple-300">
                  Voice Note from {voiceNote.senderName || 'Guest'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {new Date(voiceNote.recordedAt || Date.now()).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={togglePlayExisting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-all shadow-glow-primary"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isPlaying ? 'Pause' : 'Play Note'}
            </button>
          </div>

          <audio
            ref={audioPlayerRef}
            src={voiceNote.url}
            onTimeUpdate={(e) => {
              const dur = e.currentTarget.duration || 1;
              const cur = e.currentTarget.currentTime || 0;
              setPlayProgress((cur / dur) * 100);
            }}
            onEnded={() => {
              setIsPlaying(false);
              setPlayProgress(0);
            }}
            className="hidden"
          />

          {/* Progress bar */}
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all duration-100"
              style={{ width: `${playProgress}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* Record New Voice Note Section */}
      <div className={voiceNote?.url ? 'mt-4 pt-4 border-t border-white/5' : ''}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Radio className="w-4 h-4 text-purple-400" />
            <span>{voiceNote?.url ? 'Record Another Note' : 'Leave a Voice Memory Note'}</span>
          </div>
          {isRecording && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-red-400 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              00:{recordSeconds < 10 ? `0${recordSeconds}` : recordSeconds} / 00:30
            </span>
          )}
        </div>

        {error && (
          <div className="p-2 mb-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="p-2 mb-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            {success}
          </div>
        )}

        {!recordedAudioUrl && !isRecording && (
          <button
            onClick={startRecording}
            className="w-full py-2.5 px-4 rounded-xl border border-dashed border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <Mic className="w-4 h-4 text-purple-400" />
            Hold or Click to Record Audio Greeting (Max 30s)
          </button>
        )}

        {isRecording && (
          <div className="flex items-center gap-3">
            <button
              onClick={stopRecording}
              className="flex-1 py-2 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <Square className="w-4 h-4" />
              Done Recording ({recordSeconds}s)
            </button>
          </div>
        )}

        {recordedAudioUrl && !isRecording && (
          <div className="space-y-3 mt-2">
            <div className="flex items-center gap-2">
              <audio src={recordedAudioUrl} controls className="w-full h-8 rounded-lg" />
              <button
                onClick={resetRecording}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                title="Discard & Re-record"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Your Name (e.g. Grandma, Uncle Dave)"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleSaveVoiceNote}
                disabled={isUploading}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-glow-primary transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {isUploading ? 'Attaching...' : 'Attach Note'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default VoiceNoteWidget;
