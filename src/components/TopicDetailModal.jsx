import { useState, useEffect, useCallback } from 'react';
import {
  X,
  CheckCircle,
  Circle,
  ExternalLink,
  Trash2,
  Brain,
  Award,
  BookOpen,
  Star,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import api from '../services/api';

export default function TopicDetailModal({ topicId, onClose, onRefresh }) {
  const [topicData, setTopicData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Active sub-tab in modal: 'resources' | 'practice' | 'assessments'
  const [activeTab, setActiveTab] = useState('resources');

  // Resource form state
  const [resTitle, setResTitle] = useState('');
  const [resUrl, setResUrl] = useState('');
  const [resType, setResType] = useState('article');
  const [addingRes, setAddingRes] = useState(false);

  // Practice form state
  const [practiceCorrect, setPracticeCorrect] = useState(true);
  const [practiceDifficulty, setPracticeDifficulty] = useState('medium');
  const [practiceNotes, setPracticeNotes] = useState('');
  const [submittingPractice, setSubmittingPractice] = useState(false);

  // Assessment form state
  const [asmtTitle, setAsmtTitle] = useState('');
  const [asmtScore, setAsmtScore] = useState('');
  const [asmtNoNotes, setAsmtNoNotes] = useState(true);
  const [submittingAsmt, setSubmittingAsmt] = useState(false);

  const fetchTopic = useCallback(async () => {
    if (!topicId) return;
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/api/topics/${topicId}`);
      if (res.success) {
        setTopicData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load topic details');
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    fetchTopic();
  }, [fetchTopic]);

  // Confidence rating update (1-5)
  const handleConfidenceChange = async (newRating) => {
    try {
      await api.put(`/api/topics/${topicId}`, { confidence: newRating });
      fetchTopic();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Failed to update confidence rating: ' + err.message);
    }
  };

  // Add Resource
  const handleAddResource = async (e) => {
    e.preventDefault();
    if (!resTitle.trim()) return;
    try {
      setAddingRes(true);
      await api.post('/api/resources', {
        topicId,
        title: resTitle.trim(),
        url: resUrl.trim(),
        type: resType,
      });
      setResTitle('');
      setResUrl('');
      fetchTopic();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setAddingRes(false);
    }
  };

  // Toggle Resource Done
  const handleToggleResource = async (resourceId) => {
    try {
      await api.patch(`/api/resources/${resourceId}/toggle`);
      fetchTopic();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete Resource
  const handleDeleteResource = async (resourceId) => {
    if (!window.confirm('Delete this resource?')) return;
    try {
      await api.delete(`/api/resources/${resourceId}`);
      fetchTopic();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  // Log Practice Session
  const handleLogPractice = async (e) => {
    e.preventDefault();
    try {
      setSubmittingPractice(true);
      await api.post('/api/practice', {
        topicId,
        correct: practiceCorrect,
        difficulty: practiceDifficulty,
        notes: practiceNotes.trim(),
      });
      setPracticeNotes('');
      fetchTopic();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingPractice(false);
    }
  };

  // Delete Practice Log
  const handleDeletePractice = async (practiceId) => {
    if (!window.confirm('Delete this practice log entry?')) return;
    try {
      await api.delete(`/api/practice/${practiceId}`);
      fetchTopic();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  // Record Assessment
  const handleRecordAssessment = async (e) => {
    e.preventDefault();
    const numeric = Number(asmtScore);
    if (isNaN(numeric) || numeric < 0 || numeric > 100) {
      alert('Score must be between 0 and 100');
      return;
    }

    try {
      setSubmittingAsmt(true);
      await api.post('/api/assessments', {
        topicId,
        title: asmtTitle.trim() || 'Topic Test',
        score: numeric,
        maxMarks: 100,
        noNotesUsed: asmtNoNotes,
      });
      setAsmtTitle('');
      setAsmtScore('');
      fetchTopic();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingAsmt(false);
    }
  };

  // Delete Assessment
  const handleDeleteAssessment = async (asmtId) => {
    if (!window.confirm('Delete this assessment entry?')) return;
    try {
      await api.delete(`/api/assessments/${asmtId}`);
      fetchTopic();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  if (!topicId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl my-8 overflow-hidden">
        {loading && !topicData ? (
          <div className="flex h-64 items-center justify-center">
            <RefreshCw className="animate-spin text-indigo-600" size={24} />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            <p className="font-semibold">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white"
            >
              Close
            </button>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="border-b border-slate-100 bg-slate-50/70 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {topicData.subjectTitle}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      Importance {topicData.importance === 3 ? 'High' : topicData.importance === 2 ? 'Medium' : 'Low'}
                    </span>
                  </div>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">{topicData.title}</h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Status and Confidence Summary Bar */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Evidence Status */}
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <span className="text-[11px] font-medium text-slate-500">Evidence Status</span>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        topicData.evidence.status === 'Strong'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : topicData.evidence.status === 'Moderate'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : topicData.evidence.status === 'Limited'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {topicData.evidence.status}
                    </span>
                    {topicData.evidence.recentAccuracy !== null && (
                      <span className="text-xs text-slate-600 font-semibold">
                        {topicData.evidence.recentAccuracy}% acc.
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">
                    {topicData.evidence.reason}
                  </p>
                </div>

                {/* Self-Rated Confidence (Separate from evidence!) */}
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-500">Self-Rated Confidence</span>
                    <span className="text-xs font-bold text-indigo-700">{topicData.confidence}/5</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleConfidenceChange(star)}
                        title={`Rate confidence ${star} of 5`}
                        className={`p-1 rounded-md transition ${
                          star <= topicData.confidence
                            ? 'text-amber-400 hover:text-amber-500'
                            : 'text-slate-200 hover:text-slate-300'
                        }`}
                      >
                        <Star size={16} fill={star <= topicData.confidence ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Subjective rating; does not falsify evidence.
                  </p>
                </div>

                {/* Revision Due Status */}
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <span className="text-[11px] font-medium text-slate-500">Revision Clock</span>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        topicData.revision.isDue
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {topicData.revision.isDue ? 'Due' : 'Up to Date'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Threshold: {topicData.revision.thresholdDays}d
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">
                    {topicData.revision.reason}
                  </p>
                </div>
              </div>

              {/* Mismatch Alert Banner */}
              {topicData.evidence.mismatch.hasMismatch && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-purple-50 p-2.5 text-xs font-medium text-purple-800 border border-purple-200">
                  <AlertCircle size={15} className="shrink-0 text-purple-600" />
                  <span>{topicData.evidence.mismatch.note}</span>
                </div>
              )}

              {/* Sub-tab Navigation */}
              <div className="mt-4 flex items-center gap-2 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('resources')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeTab === 'resources'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <BookOpen size={14} />
                  Resources ({topicData.exposureFraction})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('practice')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeTab === 'practice'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Brain size={14} />
                  Practice Sessions ({topicData.practiceLogs?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('assessments')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeTab === 'assessments'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Award size={14} />
                  Assessments ({topicData.assessments?.length || 0})
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              {/* TAB 1: RESOURCES */}
              {activeTab === 'resources' && (
                <div className="space-y-4">
                  {/* Add Resource Form */}
                  <form onSubmit={handleAddResource} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-3">
                    <p className="text-xs font-bold text-slate-800">Add Learning Resource</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          required
                          placeholder="Resource title (e.g. Official Documentation)"
                          value={resTitle}
                          onChange={(e) => setResTitle(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                      <div>
                        <select
                          value={resType}
                          onChange={(e) => setResType(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        >
                          <option value="article">Article</option>
                          <option value="video">Video</option>
                          <option value="doc">Documentation</option>
                          <option value="course">Course</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="Link URL (e.g. https://...)"
                        value={resUrl}
                        onChange={(e) => setResUrl(e.target.value)}
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                      <button
                        type="submit"
                        disabled={addingRes}
                        className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                      >
                        {addingRes ? 'Adding...' : 'Add Link'}
                      </button>
                    </div>
                  </form>

                  {/* Resources List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span>Study Materials</span>
                      <span>Exposure: {topicData.exposureFraction}</span>
                    </div>

                    {topicData.resources.length === 0 ? (
                      <p className="text-center py-6 text-xs text-slate-400">
                        No resources added yet. Add reference links and articles above.
                      </p>
                    ) : (
                      topicData.resources.map((res) => (
                        <div
                          key={res._id || res.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300 transition"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleToggleResource(res.id || res._id)}
                              className={`shrink-0 transition ${
                                res.done ? 'text-emerald-600' : 'text-slate-300 hover:text-slate-400'
                              }`}
                              title={res.done ? 'Mark as incomplete' : 'Mark as completed'}
                            >
                              {res.done ? <CheckCircle size={20} /> : <Circle size={20} />}
                            </button>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs font-bold truncate ${
                                    res.done ? 'line-through text-slate-400' : 'text-slate-800'
                                  }`}
                                >
                                  {res.title}
                                </span>
                                <span className="rounded-md bg-slate-100 px-1.5 py-0.2 text-[9px] font-semibold text-slate-500 uppercase">
                                  {res.type}
                                </span>
                              </div>
                              {res.url && (
                                <a
                                  href={res.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 mt-0.5 truncate"
                                >
                                  <ExternalLink size={11} /> {res.url}
                                </a>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteResource(res.id || res._id)}
                            className="p-1 text-slate-400 hover:text-red-600 transition shrink-0"
                            title="Delete resource"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: PRACTICE */}
              {activeTab === 'practice' && (
                <div className="space-y-4">
                  {/* Log Practice Form */}
                  <form onSubmit={handleLogPractice} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-800">Record Practice Session</p>
                      <span className="text-[10px] text-indigo-600 font-semibold">
                        Resets revision clock to 0 days
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Attempt Outcome</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPracticeCorrect(true)}
                          className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition border ${
                            practiceCorrect
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <CheckCircle2 size={15} /> Solved Correctly
                        </button>
                        <button
                          type="button"
                          onClick={() => setPracticeCorrect(false)}
                          className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition border ${
                            !practiceCorrect
                              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <XCircle size={15} /> Needs Review / Failed
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Difficulty</label>
                        <select
                          value={practiceDifficulty}
                          onChange={(e) => setPracticeDifficulty(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900"
                        >
                          <option value="easy">Easy (Fundamentals)</option>
                          <option value="medium">Medium (Standard)</option>
                          <option value="hard">Hard (Complex Application)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Session Notes (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Solved problem 34; struggled with edge case"
                          value={practiceNotes}
                          onChange={(e) => setPracticeNotes(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingPractice}
                      className="w-full rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition shadow-xs"
                    >
                      {submittingPractice ? 'Saving session...' : 'Log Practice Session'}
                    </button>
                  </form>

                  {/* Recent Practice History */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span>Practice Log History</span>
                      <span>Total: {topicData.practiceLogs?.length || 0} attempts</span>
                    </div>

                    {topicData.practiceLogs?.length === 0 ? (
                      <p className="text-center py-6 text-xs text-slate-400">
                        No practice sessions recorded yet. Solve questions and log your attempts above.
                      </p>
                    ) : (
                      topicData.practiceLogs.map((log) => (
                        <div
                          key={log._id || log.id}
                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300 transition"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                log.correct ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {log.correct ? '✓' : '✗'}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">
                                  {log.correct ? 'Correct Attempt' : 'Incorrect Attempt'}
                                </span>
                                <span className="rounded-md bg-slate-100 px-1.5 py-0.2 text-[10px] font-semibold text-slate-500 uppercase">
                                  {log.difficulty}
                                </span>
                              </div>
                              {log.notes && (
                                <p className="text-[11px] text-slate-600 mt-0.5">{log.notes}</p>
                              )}
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {new Date(log.createdAt).toLocaleDateString(undefined, {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeletePractice(log.id || log._id)}
                            className="p-1 text-slate-400 hover:text-red-600 transition shrink-0"
                            title="Delete log"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: ASSESSMENTS */}
              {activeTab === 'assessments' && (
                <div className="space-y-4">
                  {/* Record Assessment Form */}
                  <form onSubmit={handleRecordAssessment} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                    <p className="text-xs font-bold text-slate-800">Record Assessment Score</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Assessment Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Unit Test 1 / Mock Exam"
                          value={asmtTitle}
                          onChange={(e) => setAsmtTitle(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Score (0–100%)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          max="100"
                          placeholder="Score %"
                          value={asmtScore}
                          onChange={(e) => setAsmtScore(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="noNotes"
                        checked={asmtNoNotes}
                        onChange={(e) => setAsmtNoNotes(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="noNotes" className="text-xs text-slate-700 font-medium">
                        Completed without reference notes (closed-book test)
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingAsmt}
                      className="w-full rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition shadow-xs"
                    >
                      {submittingAsmt ? 'Saving score...' : 'Save Assessment Result'}
                    </button>
                  </form>

                  {/* Assessments List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span>Assessment Performance History</span>
                      <span>Total: {topicData.assessments?.length || 0}</span>
                    </div>

                    {topicData.assessments?.length === 0 ? (
                      <p className="text-center py-6 text-xs text-slate-400">
                        No formal assessments logged yet. Record your quiz or test scores above.
                      </p>
                    ) : (
                      topicData.assessments.map((asmt) => (
                        <div
                          key={asmt._id || asmt.id}
                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300 transition"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{asmt.title}</span>
                              <span
                                className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                                  asmt.score >= 75
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : asmt.score >= 50
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {asmt.score}%
                              </span>
                              {asmt.noNotesUsed && (
                                <span className="rounded-md bg-purple-50 text-purple-700 px-1.5 py-0.5 text-[9px] font-semibold">
                                  Closed-Book
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">
                              Recorded: {new Date(asmt.date || asmt.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteAssessment(asmt.id || asmt._id)}
                            className="p-1 text-slate-400 hover:text-red-600 transition shrink-0"
                            title="Delete assessment"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
