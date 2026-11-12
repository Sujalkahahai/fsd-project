import { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  X,
} from 'lucide-react';
import api from '../services/api';

export default function SubjectsView({ onSelectTopic }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Expand/collapse subject cards
  const [expandedSubjects, setExpandedSubjects] = useState({});

  // Subject details map: { [subjectId]: { topics: [...] } }
  const [subjectDetails, setSubjectDetails] = useState({});

  // Create/Edit Subject Modal
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjTitle, setSubjTitle] = useState('');
  const [subjWhy, setSubjWhy] = useState('');
  const [subjTargetDate, setSubjTargetDate] = useState('');
  const [savingSubject, setSavingSubject] = useState(false);

  // Add Topic Modal
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [targetSubjectId, setTargetSubjectId] = useState(null);
  const [topicTitle, setTopicTitle] = useState('');
  const [topicImportance, setTopicImportance] = useState(2);
  const [topicThreshold, setTopicThreshold] = useState(14);
  const [topicConfidence, setTopicConfidence] = useState(3);
  const [savingTopic, setSavingTopic] = useState(false);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/subjects');
      if (res.success) {
        setSubjects(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const toggleSubject = async (subjectId) => {
    const nextState = !expandedSubjects[subjectId];
    setExpandedSubjects((prev) => ({ ...prev, [subjectId]: nextState }));

    if (nextState && !subjectDetails[subjectId]) {
      try {
        const res = await api.get(`/api/subjects/${subjectId}`);
        if (res.success) {
          setSubjectDetails((prev) => ({ ...prev, [subjectId]: res.data }));
        }
      } catch (err) {
        console.error('Failed to load subject topics:', err);
      }
    }
  };

  const reloadSubjectDetails = async (subjectId) => {
    try {
      const res = await api.get(`/api/subjects/${subjectId}`);
      if (res.success) {
        setSubjectDetails((prev) => ({ ...prev, [subjectId]: res.data }));
      }
      fetchSubjects();
    } catch (err) {
      console.error(err);
    }
  };

  // Save Subject (Create or Edit)
  const handleSaveSubject = async (e) => {
    e.preventDefault();
    if (!subjTitle.trim()) return;

    try {
      setSavingSubject(true);
      if (editingSubject) {
        await api.put(`/api/subjects/${editingSubject.id || editingSubject._id}`, {
          title: subjTitle.trim(),
          why: subjWhy.trim(),
          targetDate: subjTargetDate || null,
        });
      } else {
        await api.post('/api/subjects', {
          title: subjTitle.trim(),
          why: subjWhy.trim(),
          targetDate: subjTargetDate || null,
        });
      }
      setIsSubjectModalOpen(false);
      setEditingSubject(null);
      setSubjTitle('');
      setSubjWhy('');
      setSubjTargetDate('');
      fetchSubjects();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingSubject(false);
    }
  };

  // Delete Subject
  const handleDeleteSubject = async (subject) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${subject.title}"? All of its topics, resources, and practice records will be deleted.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/api/subjects/${subject.id || subject._id}`);
      fetchSubjects();
    } catch (err) {
      alert(err.message);
    }
  };

  // Save Topic
  const handleSaveTopic = async (e) => {
    e.preventDefault();
    if (!topicTitle.trim() || !targetSubjectId) return;

    try {
      setSavingTopic(true);
      await api.post('/api/topics', {
        subjectId: targetSubjectId,
        title: topicTitle.trim(),
        importance: topicImportance,
        revisionThresholdDays: topicThreshold,
        confidence: topicConfidence,
      });

      setIsTopicModalOpen(false);
      setTopicTitle('');
      setTopicImportance(2);
      setTopicThreshold(14);
      setTopicConfidence(3);
      reloadSubjectDetails(targetSubjectId);
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingTopic(false);
    }
  };

  // Delete Topic
  const handleDeleteTopic = async (topicId, subjectId) => {
    if (!window.confirm('Delete this topic and all its learning resources?')) return;
    try {
      await api.delete(`/api/topics/${topicId}`);
      reloadSubjectDetails(subjectId);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Subjects & Topics</h1>
          <p className="text-xs text-slate-500 mt-1">
            Organize your curriculum into subjects and track exposure, practice logs, and evidence for every topic.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingSubject(null);
            setSubjTitle('');
            setSubjWhy('');
            setSubjTargetDate('');
            setIsSubjectModalOpen(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition shrink-0"
        >
          <Plus size={16} /> Add Subject
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
            onClick={fetchSubjects}
            className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white"
          >
            Retry
          </button>
        </div>
      ) : subjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <BookOpen size={24} />
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-800">No subjects created yet</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Get started by adding a subject (e.g. Operating Systems, Web Engineering) or clone a curated template!
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingSubject(null);
              setIsSubjectModalOpen(true);
            }}
            className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition"
          >
            Create Your First Subject
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {subjects.map((subject) => {
            const sid = subject.id || subject._id;
            const isExpanded = !!expandedSubjects[sid];
            const details = subjectDetails[sid];

            return (
              <div
                key={sid}
                className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition"
              >
                {/* Subject Summary Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-3 border-b border-slate-100">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => toggleSubject(sid)}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-slate-400 hover:text-slate-700 transition"
                      >
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                      <h2 className="text-base font-bold text-slate-900">{subject.title}</h2>
                    </div>

                    {subject.why && (
                      <p className="mt-1 text-xs text-slate-500 italic pl-6">
                        Why: "{subject.why}"
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 sm:gap-4 pl-6 sm:pl-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {/* Exposure Fraction */}
                    <div className="text-left sm:text-right">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Exposure
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {subject.exposureFraction || '0/0'} resources
                      </span>
                    </div>

                    {/* Topics Count */}
                    <div className="text-left sm:text-right">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Topics
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {subject.topicCount || 0}
                      </span>
                    </div>

                    {/* Target Date */}
                    {subject.targetDate && (
                      <div className="text-left sm:text-right hidden sm:block">
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Target
                        </span>
                        <span className="text-xs font-semibold text-indigo-700">
                          {new Date(subject.targetDate).toLocaleDateString(undefined, {
                            dateStyle: 'medium',
                          })}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1 border-l border-slate-100 pl-2 sm:pl-3 ml-auto sm:ml-0">
                      <button
                        type="button"
                        onClick={() => {
                          setTargetSubjectId(sid);
                          setIsTopicModalOpen(true);
                        }}
                        className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                        title="Add Topic"
                      >
                        <Plus size={14} /> Topic
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSubject(subject);
                          setSubjTitle(subject.title);
                          setSubjWhy(subject.why || '');
                          setSubjTargetDate(
                            subject.targetDate
                              ? new Date(subject.targetDate).toISOString().split('T')[0]
                              : ''
                          );
                          setIsSubjectModalOpen(true);
                        }}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                        title="Edit Subject"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubject(subject)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Delete Subject"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Topics List */}
                {isExpanded && (
                  <div className="bg-slate-50/50 p-4 space-y-2">
                    {!details ? (
                      <div className="flex items-center justify-center py-6 text-xs text-slate-400">
                        <RefreshCw className="animate-spin mr-2" size={16} /> Loading topics...
                      </div>
                    ) : details.topics.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        <p>No topics added to this subject yet.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setTargetSubjectId(sid);
                            setIsTopicModalOpen(true);
                          }}
                          className="mt-2 text-indigo-600 font-semibold hover:underline"
                        >
                          + Add the first topic
                        </button>
                      </div>
                    ) : (
                      details.topics.map((topic) => {
                        const tid = topic.id || topic._id;
                        return (
                          <div
                            key={tid}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 hover:border-slate-300 transition"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-bold text-slate-900">{topic.title}</h3>
                                <span className="rounded-md bg-slate-100 px-1.5 py-0.2 text-[10px] font-semibold text-slate-500">
                                  {topic.importance === 3 ? 'High' : topic.importance === 2 ? 'Medium' : 'Low'} Priority
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  Confidence: <strong>{topic.confidence}/5</strong>
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                                <span>Exposure: <strong className="text-slate-700">{topic.exposureFraction}</strong></span>
                                <span>•</span>
                                <span>
                                  Evidence:{' '}
                                  <strong
                                    className={
                                      topic.evidence?.status === 'Strong'
                                        ? 'text-emerald-700'
                                        : topic.evidence?.status === 'Moderate'
                                        ? 'text-blue-700'
                                        : topic.evidence?.status === 'Limited'
                                        ? 'text-amber-700'
                                        : 'text-rose-700'
                                    }
                                  >
                                    {topic.evidence?.status}
                                  </strong>
                                </span>
                                <span>•</span>
                                <span className={topic.revision?.isDue ? 'text-amber-700 font-semibold' : 'text-slate-500'}>
                                  {topic.revision?.isDue ? 'Revision Due' : 'Up to Date'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                              <button
                                type="button"
                                onClick={() => onSelectTopic(tid)}
                                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition shadow-xs"
                              >
                                View Topic Details
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTopic(tid, sid)}
                                className="p-1.5 text-slate-400 hover:text-red-600 transition"
                                title="Delete Topic"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT SUBJECT MODAL */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </h3>
              <button
                type="button"
                onClick={() => setIsSubjectModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operating Systems / Cloud Computing"
                  value={subjTitle}
                  onChange={(e) => setSubjTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Why Note (Optional - Max 250 chars)
                </label>
                <textarea
                  rows={2}
                  maxLength={250}
                  placeholder="e.g. Master core concurrency principles for upcoming campus placement tests"
                  value={subjWhy}
                  onChange={(e) => setSubjWhy(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Exam / Completion Date (Optional)
                </label>
                <input
                  type="date"
                  value={subjTargetDate}
                  onChange={(e) => setSubjTargetDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSubject}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingSubject ? 'Saving...' : 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TOPIC MODAL */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Topic</h3>
              <button
                type="button"
                onClick={() => setIsTopicModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTopic} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Topic Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Process Scheduling & CPU Deadlocks"
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Importance</label>
                  <select
                    value={topicImportance}
                    onChange={(e) => setTopicImportance(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value={3}>High (Importance 3)</option>
                    <option value={2}>Medium (Importance 2)</option>
                    <option value={1}>Low (Importance 1)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Revision Days</label>
                  <input
                    type="number"
                    min="1"
                    value={topicThreshold}
                    onChange={(e) => setTopicThreshold(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Confidence (1 to 5)
                </label>
                <select
                  value={topicConfidence}
                  onChange={(e) => setTopicConfidence(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value={1}>1 - Completely New / Uncertain</option>
                  <option value={2}>2 - Basic Awareness</option>
                  <option value={3}>3 - Moderate Familiarity</option>
                  <option value={4}>4 - High Comfort</option>
                  <option value={5}>5 - Confident Mastery</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTopicModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTopic}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingTopic ? 'Saving...' : 'Create Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
