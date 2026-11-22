import React, { useState, useRef } from 'react';
import { Camera, Sparkles, X, Download, RefreshCw, CheckCircle2, User, AlertCircle } from 'lucide-react';
import axios from 'axios';

export const FindMyPhotosModal = ({ isOpen, onClose, collectionId, token }) => {
  const [selfie, setSelfie] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [useCamera, setUseCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  if (!isOpen) return null;

  const startCamera = async () => {
    setUseCamera(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Could not access camera. Please allow camera permissions or upload a selfie file.');
      setUseCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setSelfie(dataUrl);

      // Stop camera stream
      const stream = video.srcObject;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setUseCamera(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setSelfie(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const runSelfieSearch = async () => {
    if (!selfie) return;
    setScanning(true);
    setError(null);
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const endpoint = token ? '/api/ai/find-my-photos' : '/api/public/find-my-photos';
      const res = await axios.post(
        endpoint,
        { selfieBase64: selfie, collectionId, threshold: 0.38 },
        { headers }
      );

      if (res.data.success) {
        if (!res.data.foundFace) {
          setError(res.data.message || 'No face detected in the selfie. Please take a clear selfie.');
        } else {
          setResults(res.data.matches || []);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Selfie search failed.');
    } finally {
      setScanning(false);
    }
  };

  const resetAll = () => {
    setSelfie(null);
    setResults(null);
    setError(null);
    setUseCamera(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl glass-panel border border-white/10 bg-[#0F172A] p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 p-[1px]">
              <div className="w-full h-full bg-[#080B14] rounded-[11px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Find My Photos <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-normal">AI Instant Search</span>
              </h2>
              <p className="text-xs text-slate-400">Take a 1-second selfie to find every event photograph you appear in.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Capture Selfie */}
          {!results && (
            <div className="space-y-4">
              {useCamera ? (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-purple-500/30">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover mirror" />
                  <canvas ref={canvasRef} className="hidden" />
                  <button
                    onClick={capturePhoto}
                    className="absolute bottom-4 px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-glow-primary hover:scale-105 transition-all"
                  >
                    Snap Selfie
                  </button>
                </div>
              ) : selfie ? (
                <div className="relative rounded-2xl overflow-hidden bg-black/60 aspect-video flex items-center justify-center border border-white/10 group">
                  <img src={selfie} alt="Selfie preview" className="w-full h-full object-contain" />
                  <button
                    onClick={() => setSelfie(null)}
                    className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 text-white hover:bg-rose-600 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <button
                    onClick={startCamera}
                    className="p-6 rounded-2xl glass-panel border border-white/10 hover:border-purple-500/40 hover:bg-white/[0.04] transition-all flex flex-col items-center justify-center gap-3 text-center group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Use Camera</p>
                      <p className="text-xs text-slate-400 mt-0.5">Snap a quick selfie with your device webcam</p>
                    </div>
                  </button>

                  <label className="p-6 rounded-2xl glass-panel border border-white/10 hover:border-cyan-500/40 hover:bg-white/[0.04] transition-all flex flex-col items-center justify-center gap-3 text-center cursor-pointer group">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Upload a Selfie</p>
                      <p className="text-xs text-slate-400 mt-0.5">Choose an existing portrait from your photos</p>
                    </div>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              )}

              {selfie && (
                <button
                  onClick={runSelfieSearch}
                  disabled={scanning}
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 shadow-glow-primary transition-all flex items-center justify-center gap-2"
                >
                  {scanning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Scanning facial landmarks across all event photos...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Find My Photos</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* STEP 2: Match Results */}
          {results && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Found {results.length} Photograph{results.length === 1 ? '' : 's'} of You!
                  </h3>
                  <p className="text-xs text-slate-400">Matched via SFace 128-dim biometric similarity.</p>
                </div>
                <button
                  onClick={resetAll}
                  className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
                >
                  Search with Another Selfie
                </button>
              </div>

              {results.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  We scanned all event photos but didn't find any matching your selfie. Make sure your face is well-lit!
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {results.map((photo) => (
                    <div key={photo._id} className="relative rounded-xl overflow-hidden bg-slate-900 border border-white/10 group aspect-square">
                      <img
                        src={photo.cloudinaryUrl || photo.thumbnailKey}
                        alt={photo.originalName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                        {photo.confidencePercent || 90}% Match
                      </div>
                      <a
                        href={photo.cloudinaryUrl || photo.thumbnailKey}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-purple-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Download Photo"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FindMyPhotosModal;
