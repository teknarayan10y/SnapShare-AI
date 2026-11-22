import React, { useState, useEffect, useCallback } from 'react';
import { aiAPI } from '../services/api';
import { Brain, ChevronDown, ChevronUp, X, Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export const AIJobMonitor = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await aiAPI.getJobs({ limit: 5 });
      if (res.data?.success) {
        setJobs(res.data.jobs || []);
      }
    } catch {
      // Background monitor silently catches errors
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 4000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const activeJobs = jobs.filter((j) => j.status === 'processing' || j.status === 'queued');
  const hasActive = activeJobs.length > 0;

  if (jobs.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full font-semibold text-xs text-white glass-panel border transition-all duration-300 shadow-2xl hover:scale-105 ${
            hasActive
              ? 'border-purple-500/60 bg-purple-950/80 shadow-glow-primary'
              : 'border-white/10 bg-slate-900/90'
          }`}
        >
          <div className="relative">
            <Brain className={`w-4 h-4 ${hasActive ? 'text-purple-300 animate-pulse' : 'text-slate-400'}`} />
            {hasActive && (
              <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            )}
          </div>
          <span>AI Engine</span>
          {hasActive && (
            <span className="px-1.5 py-0.2 rounded-full bg-purple-500 text-[10px] text-white font-bold">
              {activeJobs.length}
            </span>
          )}
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        </button>
      ) : (
        <div className="w-80 rounded-2xl glass-panel bg-slate-900/95 border border-purple-500/30 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">AI Activity</h4>
              {hasActive && (
                <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-semibold border border-purple-500/30">
                  {activeJobs.length} active
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={fetchJobs}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {jobs.slice(0, 5).map((job) => (
              <div
                key={job._id}
                className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-300 font-medium truncate max-w-[170px]">
                    {job.fileId?.originalName || 'Asset Analysis'}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                      job.status === 'processing'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                        : job.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : job.status === 'failed'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-slate-700/40 text-slate-400'
                    }`}
                  >
                    {job.status}
                  </span>
                </div>

                {job.status === 'processing' && (
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-cyan-400 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${job.progress || 35}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-3 pt-2 border-t border-white/5 text-[11px] text-slate-400 text-center">
            {hasActive ? 'AI neural workers organizing in background' : 'All background AI tasks completed'}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIJobMonitor;
