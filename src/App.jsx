import { useState } from 'react';
import {
  Compass,
  ArrowRight,
  Brain,
  History,
  LogIn,
  UserPlus,
  Sparkles,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import DashboardView from './components/DashboardView';
import SubjectsView from './components/SubjectsView';
import RevisionQueueView from './components/RevisionQueueView';
import StudyRoomView from './components/StudyRoomView';
import TemplatesView from './components/TemplatesView';
import AdminView from './components/AdminView';
import TopicDetailModal from './components/TopicDetailModal';
import ErrorBoundary from './components/ErrorBoundary';

function MainContent() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authModalMode, setAuthModalMode] = useState(null); // 'login' | 'register' | null
  const [selectedTopicId, setSelectedTopicId] = useState(null);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={(mode) => setAuthModalMode(mode)}
      />

      {/* Main Body */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-3 sm:px-6 py-4 sm:py-6">
        {isAuthenticated ? (
          <div>
            {activeTab === 'dashboard' && (
              <DashboardView
                onNavigate={setActiveTab}
                onSelectTopic={(tid) => setSelectedTopicId(tid)}
              />
            )}
            {activeTab === 'subjects' && (
              <SubjectsView onSelectTopic={(tid) => setSelectedTopicId(tid)} />
            )}
            {activeTab === 'revision' && (
              <RevisionQueueView onSelectTopic={(tid) => setSelectedTopicId(tid)} />
            )}
            {activeTab === 'studyrooms' && <StudyRoomView />}
            {activeTab === 'templates' && <TemplatesView onNavigate={setActiveTab} />}
            {activeTab === 'admin' && isAdmin && <AdminView />}
          </div>
        ) : (
          /* Landing Hero for Unauthenticated Visitors */
          <div className="space-y-10 sm:space-y-14 py-6 sm:py-14">
            <div className="text-center max-w-3xl mx-auto space-y-4 sm:space-y-5 px-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/70 px-3.5 py-1 text-xs font-bold text-indigo-700 shadow-2xs">
                <Compass size={14} className="animate-spin text-indigo-600" />
                Evidence-Based Study Tracking
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Stop Confusing Reading with Real Understanding
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
                Checklist trackers only prove you opened a link. <strong>Pathlog</strong> tracks verified practice logs and assessment scores separately from resource exposure, providing a transparent revision queue and explainable next actions.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full max-w-xs sm:max-w-none mx-auto">
                <button
                  type="button"
                  onClick={() => setAuthModalMode('register')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 transition"
                >
                  <UserPlus size={16} /> Get Started Free <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setAuthModalMode('login')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                >
                  <LogIn size={16} /> Sign In
                </button>
              </div>
            </div>

            {/* Core Values Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-2 sm:pt-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Brain size={20} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Evidence Before Confidence</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Resource completion measures exposure, not mastery. We calculate evidence status deterministically (Strong, Moderate, Limited, Needs attention) based on actual test scores and practice attempts.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <History size={20} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Transparent Revision Queue</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Revision intervals are calculated directly from your latest practice or assessment date. Checking off links never resets the clock — only active recall resets your retention decay.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <Sparkles size={20} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Explainable Next Actions</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  No mysterious AI black-boxes or arbitrary numbers. Recommendations are prioritized in clear tiers based on overdue intervals, topic importance, and identified evidence gaps.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-3 px-4 text-xs text-slate-500 sm:px-6">
          <div className="flex items-center gap-2">
            <Compass size={16} className="text-indigo-600" />
            <span className="font-bold text-slate-800">Pathlog</span>
            <span>— Full Stack Development Lab & Mini Project</span>
          </div>
          <p>© 2026 Pathlog System. All rights reserved.</p>
        </div>
      </footer>

      {/* Modals */}
      {authModalMode && (
        <AuthModal
          initialMode={authModalMode}
          onClose={() => setAuthModalMode(null)}
        />
      )}

      {selectedTopicId && (
        <ErrorBoundary onReset={() => setSelectedTopicId(null)}>
          <TopicDetailModal
            topicId={selectedTopicId}
            onClose={() => setSelectedTopicId(null)}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <MainContent />
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
