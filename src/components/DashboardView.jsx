import { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Brain,
  History,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Sparkles,
  Target,
  RefreshCw,
  Compass,
} from 'lucide-react';
import api from '../services/api';

export default function DashboardView({ onNavigate, onSelectTopic }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/learning/dashboard');
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
          <RefreshCw className="animate-spin text-indigo-600" size={20} />
          Loading your learning dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        <p className="font-semibold">{error}</p>
        <button
          type="button"
          onClick={fetchDashboard}
          className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { stats, upcomingSubjects = [], revisionDueTopics = [], nextActions = [], confidenceMismatches = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/50 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Compass size={14} />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                Evidence-Based Tracking
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              Welcome to Your Learning Log
            </h1>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              Pathlog measures verified practice and assessments, separating actual recall performance from resource exposure and subjective confidence.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('subjects')}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition"
            >
              <BookOpen size={15} />
              View Subjects
            </button>
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Subjects */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Subjects</span>
            <BookOpen size={16} className="text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats?.subjectsCount || 0}</p>
          <p className="mt-1 text-[11px] text-slate-400">Total enrolled areas</p>
        </div>

        {/* Topics */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Topics</span>
            <Target size={16} className="text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats?.topicsCount || 0}</p>
          <p className="mt-1 text-[11px] text-slate-400">Study sub-modules</p>
        </div>

        {/* Resource Exposure Fraction */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Resource Exposure</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats?.exposureFraction || '0/0'}</p>
          <p className="mt-1 text-[11px] text-slate-400">Completed / Total resources</p>
        </div>

        {/* Practice Sessions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Practice Accuracy</span>
            <Brain size={16} className="text-purple-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {stats?.practiceAccuracy !== null ? `${stats.practiceAccuracy}%` : 'N/A'}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">{stats?.totalPractice || 0} practice logs</p>
        </div>

        {/* Revision Queue */}
        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Revision Queue</span>
            <History size={16} className="text-amber-600" />
          </div>
          <p className={`mt-2 text-2xl font-bold ${stats?.revisionDueCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {stats?.revisionDueCount || 0}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Topics due for review</p>
        </div>
      </div>

      {/* Revision Alert (if overdue) */}
      {revisionDueTopics.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">
                {revisionDueTopics.length} topic{revisionDueTopics.length === 1 ? '' : 's'} due for active recall revision
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Practice-driven spaced repetition protects your memory retention.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('revision')}
            className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition shrink-0"
          >
            Review Queue <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Confidence Mismatches: "Worth a Second Look" */}
      {confidenceMismatches.length > 0 && (
        <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-5">
          <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
            <Sparkles size={16} className="text-purple-600" />
            <span>Worth a Second Look: Confidence vs. Performance Mismatch</span>
          </div>
          <p className="text-xs text-purple-700 mt-1">
            Pathlog detects when your self-rated feeling (1–5) contradicts the objective practice evidence in your logs.
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {confidenceMismatches.map((m, idx) => (
              <div key={idx} className="rounded-xl border border-purple-100 bg-white p-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{m.topicTitle}</span>
                  <span className="text-[10px] font-semibold text-slate-500">{m.subjectTitle}</span>
                </div>
                <p className="mt-1 text-xs text-purple-800 font-medium">{m.note}</p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-50 pt-2">
                  <span>Self-rating: <strong className="text-slate-800">{m.confidence}/5</strong></span>
                  <span>Evidence: <strong className="text-purple-700">{m.evidenceStatus}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Recommended Actions (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Target size={18} className="text-indigo-600" />
              Next Recommended Actions
            </h2>
            <span className="text-xs text-slate-400">Rule-based priority</span>
          </div>

          {nextActions.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
              <p className="text-sm font-semibold text-slate-800">All caught up!</p>
              <p className="text-xs text-slate-400 mt-1">
                No immediate revision or practice actions required. Add new subjects or topics to begin.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {nextActions.map((action, idx) => {
                const badgeColors = {
                  red: 'bg-red-50 text-red-700 border-red-200',
                  amber: 'bg-amber-50 text-amber-700 border-amber-200',
                  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                  slate: 'bg-slate-100 text-slate-700 border-slate-200',
                };
                const colorClass = badgeColors[action.priorityColor] || badgeColors.slate;

                return (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-slate-300 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colorClass}`}>
                          {action.priorityLabel}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">{action.subjectTitle}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{action.topicTitle}</h3>
                      <p className="text-xs text-slate-600">{action.reason}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectTopic(action.topicId)}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition shrink-0"
                    >
                      Take Action <ArrowRight size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Target Dates (1 col) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar size={18} className="text-indigo-600" />
              Target Dates
            </h2>
          </div>

          {upcomingSubjects.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-400">
              <p className="text-xs font-medium">No target dates scheduled.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Set a target exam or deadline date when creating or editing a subject.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingSubjects.map((subj) => {
                const target = new Date(subj.targetDate);
                const diffDays = Math.ceil((target - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <div
                    key={subj.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{subj.title}</span>
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                        {diffDays > 0 ? `${diffDays}d remaining` : 'Today'}
                      </span>
                    </div>
                    {subj.why && (
                      <p className="mt-1 text-xs text-slate-500 italic line-clamp-2">"{subj.why}"</p>
                    )}
                    <p className="mt-2 text-[11px] text-slate-400">
                      Target: {target.toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

