import { useState, useEffect } from 'react';
import { History, Brain, CheckCircle2, RefreshCw, ArrowRight, AlertTriangle } from 'lucide-react';
import api from '../services/api';

export default function RevisionQueueView({ onSelectTopic }) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchQueue = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/learning/revision-queue');
      if (res.success) {
        setQueue(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load revision queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500 text-white">
              <History size={14} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Spaced Repetition Engine
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Revision Queue</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Revision intervals default to 14 days, but are shortened to 7 days for topics with Limited or Needs Attention evidence. Reading resources does not reset your revision clock; only deliberate practice or assessment resets it.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchQueue}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs self-start"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="animate-spin text-indigo-600" size={24} />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          <p className="font-semibold">{error}</p>
          <button
            type="button"
            onClick={fetchQueue}
            className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white"
          >
            Retry
          </button>
        </div>
      ) : queue.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={24} />
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-900">All caught up!</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            No topics are currently due for spaced revision. Excellent job maintaining your active recall cadence!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-amber-200/80 bg-white p-5 shadow-2xs hover:border-amber-300 transition"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded-md bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    Due for Revision
                  </span>
                  <span className="text-xs font-bold text-slate-500">{item.subjectTitle}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[11px] text-slate-500">
                    Threshold: <strong>{item.thresholdDays} days</strong>
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{item.topicTitle}</h3>

                <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="shrink-0 text-amber-600" />
                  {item.reason}
                </p>

                <div className="flex items-center gap-3 text-xs text-slate-500 pt-1 flex-wrap">
                  <span>
                    Evidence:{' '}
                    <strong
                      className={
                        item.evidenceStatus === 'Strong'
                          ? 'text-emerald-700'
                          : item.evidenceStatus === 'Moderate'
                          ? 'text-blue-700'
                          : item.evidenceStatus === 'Limited'
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }
                    >
                      {item.evidenceStatus}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>Exposure: <strong>{item.exposureFraction}</strong></span>
                  {item.recentAccuracy !== null && (
                    <>
                      <span>•</span>
                      <span>Recent Practice Accuracy: <strong>{item.recentAccuracy}%</strong></span>
                    </>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectTopic(item.topicId)}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition shrink-0"
              >
                <Brain size={15} /> Practice Now <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

