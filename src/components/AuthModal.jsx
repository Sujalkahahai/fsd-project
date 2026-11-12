import { useState } from 'react';
import { X, LogIn, UserPlus, AlertCircle, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ initialMode = 'login', onClose }) {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filledRole, setFilledRole] = useState(null);

  const { login, register } = useAuth();

  const handleSelectDemo = (role) => {
    setError('');
    if (role === 'student') {
      setEmail('student@pathlog.internal');
      setPassword('StudentPathlog2026!');
      setFilledRole('student');
    } else if (role === 'admin') {
      setEmail('admin@pathlog.internal');
      setPassword('AdminPathlog2026!');
      setFilledRole('admin');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'register' && !name.trim()) {
      setError('Please provide your full name');
      return;
    }

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setSubmitting(true);
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), password);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {mode === 'login' ? 'Sign in to Pathlog' : 'Create Pathlog Account'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === 'login'
                ? 'Access your subjects, practice sessions, and revision queue'
                : 'Start tracking evidence and mastering your curriculum'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Demo Accounts Quick Autofill (Shown when signing in) */}
        {mode === 'login' && (
          <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                <Sparkles size={14} className="text-indigo-600" />
                Demo Evaluation Accounts
              </span>
              <span className="text-[10px] text-indigo-600 font-medium">1-Click Autofill</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSelectDemo('student')}
                className={`flex flex-col items-start rounded-lg border p-2 text-left transition ${
                  filledRole === 'student'
                    ? 'border-indigo-600 bg-indigo-100/70 shadow-xs'
                    : 'border-indigo-200/80 bg-white hover:border-indigo-400 hover:bg-indigo-50/40 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-slate-900">Demo Student</span>
                  {filledRole === 'student' && <Check size={13} className="text-indigo-700" />}
                </div>
                <span className="text-[10px] text-slate-500 font-mono truncate w-full mt-0.5">
                  student@pathlog...
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectDemo('admin')}
                className={`flex flex-col items-start rounded-lg border p-2 text-left transition ${
                  filledRole === 'admin'
                    ? 'border-indigo-600 bg-indigo-100/70 shadow-xs'
                    : 'border-indigo-200/80 bg-white hover:border-indigo-400 hover:bg-indigo-50/40 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-slate-900">Administrator</span>
                  {filledRole === 'admin' && <Check size={13} className="text-indigo-700" />}
                </div>
                <span className="text-[10px] text-slate-500 font-mono truncate w-full mt-0.5">
                  admin@pathlog...
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Error alert */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-100">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 sm:space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Sujal Patel"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setFilledRole(null);
                }}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="e.g. student@college.edu"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFilledRole(null);
              }}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFilledRole(null);
              }}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm shadow-indigo-200"
          >
            {mode === 'login' ? (
              <>
                <LogIn size={16} /> {submitting ? 'Signing in...' : 'Sign In'}
              </>
            ) : (
              <>
                <UserPlus size={16} /> {submitting ? 'Creating account...' : 'Create Account'}
              </>
            )}
          </button>
        </form>

        {/* Toggle mode */}
        <div className="mt-4 sm:mt-5 text-center text-xs text-slate-500">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                  setFilledRole(null);
                }}
                className="font-semibold text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
              >
                Register here
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setFilledRole(null);
                }}
                className="font-semibold text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
              >
                Sign in instead
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

