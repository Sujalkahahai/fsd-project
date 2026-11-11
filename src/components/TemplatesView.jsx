import { useState, useEffect } from 'react';
import {
  BookmarkCheck,
  Copy,
  Plus,
  RefreshCw,
  CheckCircle,
  X,
  Layers,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TemplatesView({ onNavigate }) {
  const { isAdmin } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cloningId, setCloningId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Create Template modal (Admin only)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Web Development');
  const [topicsInput, setTopicsInput] = useState(
    'Introduction to Node.js, Express Routing & REST, Database Connectivity with MongoDB'
  );
  const [creating, setCreating] = useState(false);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/templates');
      if (res.success) {
        setTemplates(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Clone Template
  const handleClone = async (template) => {
    const tid = template.id || template._id;
    try {
      setCloningId(tid);
      const res = await api.post(`/api/templates/${tid}/clone`);
      if (res.success) {
        setSuccessMessage(`Successfully cloned "${template.title}" to your Subjects!`);
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setCloningId(null);
    }
  };

  // Create Template (Admin only)
  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const topicsArray = topicsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => ({
        title: t,
        importance: 2,
        revisionThresholdDays: 14,
        resources: [{ title: 'Overview Documentation', url: '', type: 'doc' }],
      }));

    try {
      setCreating(true);
      await api.post('/api/templates', {
        title: title.trim(),
        description: description.trim(),
        category,
        isPublished: true,
        topics: topicsArray,
      });

      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      fetchTemplates();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <BookmarkCheck size={14} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
              Curated Roadmaps
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Learning Path Templates
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Clone battle-tested curriculum templates directly into your personal subjects list. You get an independent copy to track your own resources, practice, and evidence.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition shrink-0 self-start"
          >
            <Plus size={16} /> Create Template
          </button>
        )}
      </div>

      {successMessage && (
        <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-4 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('subjects')}
            className="underline underline-offset-2 hover:text-emerald-950 font-bold"
          >
            View in Subjects →
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="animate-spin text-indigo-600" size={24} />
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          <Layers size={32} className="mx-auto text-indigo-400 mb-2" />
          <h3 className="text-base font-bold text-slate-800">No published templates</h3>
          <p className="text-xs text-slate-400 mt-1">
            Curated roadmap templates will appear here once published by an admin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tmpl) => {
            const tid = tmpl.id || tmpl._id;
            const topicCount = tmpl.topics?.length || 0;
            const resourceCount =
              tmpl.topics?.reduce((acc, t) => acc + (t.resources?.length || 0), 0) || 0;

            return (
              <div
                key={tid}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 uppercase">
                      {tmpl.category || 'General'}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {topicCount} topics • {resourceCount} resources
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-bold text-slate-900">{tmpl.title}</h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">{tmpl.description}</p>

                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Curriculum Topics
                    </span>
                    <ul className="mt-2 space-y-1">
                      {tmpl.topics?.slice(0, 4).map((t, i) => (
                        <li key={i} className="text-xs text-slate-700 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                          <span className="truncate">{t.title}</span>
                        </li>
                      ))}
                      {topicCount > 4 && (
                        <li className="text-[11px] text-slate-400 pl-3">
                          + {topicCount - 4} more topics
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    disabled={cloningId === tid}
                    onClick={() => handleClone(tmpl)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition shadow-xs shadow-indigo-100"
                  >
                    <Copy size={14} />
                    {cloningId === tid ? 'Cloning to Your Subjects...' : 'Clone to My Subjects'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE TEMPLATE MODAL (ADMIN ONLY) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Create Curated Template</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Systems 101"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Summary of this learning roadmap"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Topics (comma-separated list)
                </label>
                <textarea
                  rows={3}
                  value={topicsInput}
                  onChange={(e) => setTopicsInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {creating ? 'Publishing...' : 'Publish Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
