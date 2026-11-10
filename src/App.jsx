import { useState } from 'react';
import {
  CalendarDays,
  Clock3,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Trash2,
  PlusCircle,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  LogIn,
  UserPlus,
  X,
  AlertCircle,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EventProvider, useEvents } from './context/EventContext';

function EventCard({ event }) {
  const { registerForEvent, unregisterFromEvent, isRegistered, deleteEvent } = useEvents();
  const { isAdmin } = useAuth();
  const registered = isRegistered(event.id);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${event.title}"?`)) return;
    try {
      setDeleting(true);
      await deleteEvent(event.id);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6 transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${event.tone || 'bg-teal-50 text-teal-700'}`}>
          {event.category}
        </span>
        {isAdmin ? (
          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
            <ShieldCheck size={14} /> Admin Managed
          </span>
        ) : (
          <span className="text-xs text-slate-400">Verified event</span>
        )}
      </div>

      <h3 className="mt-5 text-xl font-bold">{event.title}</h3>
      <p className="mt-3 flex-1 leading-7 text-slate-600">{event.description}</p>

      <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm text-slate-600">
        <div className="flex gap-3">
          <CalendarDays size={17} />
          {event.date}
        </div>
        <div className="flex gap-3">
          <Clock3 size={17} />
          {event.time}
        </div>
        <div className="flex gap-3">
          <MapPin size={17} />
          {event.location}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => (registered ? unregisterFromEvent(event.id) : registerForEvent(event.id))}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold ${
            registered ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-900 text-white hover:bg-teal-700'
          }`}
        >
          {registered ? (
            <>
              <CheckCircle2 size={18} /> Registered
            </>
          ) : (
            <>
              Register <ArrowRight size={18} />
            </>
          )}
        </button>

        {isAdmin && (
          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            title="Admin Delete Event"
            aria-label="Delete Event"
            className="flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-red-600 hover:bg-red-100 transition"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </article>
  );
}

function RegistrationSummary() {
  const { events, registeredEventIds, unregisterFromEvent, registrationCount } = useEvents();
  const registered = events.filter((event) => registeredEventIds.includes(event.id));

  return (
    <aside className="mb-8 rounded-2xl border border-teal-100 bg-teal-50 p-4 md:p-6">
      <p className="font-bold text-teal-900">
        My registrations <span className="font-normal text-teal-700">({registrationCount})</span>
      </p>
      {registered.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">No registrations yet. Click register on any card below.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {registered.map((event) => (
            <li key={event.id} className="flex justify-between items-center rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
              <span className="font-medium text-slate-800">{event.title}</span>
              <button onClick={() => unregisterFromEvent(event.id)} className="text-teal-700 hover:underline">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

function CreateEventModal({ isOpen, onClose }) {
  const { createEvent } = useEvents();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    category: 'Showcase',
    tone: 'bg-teal-50 text-teal-700',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await createEvent(formData);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-xl font-bold text-slate-900">Create New Event (Admin Only)</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500">Event Title</label>
            <input
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              placeholder="e.g. Distributed Systems Masterclass"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500">Description</label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              placeholder="Deep dive into consensus algorithms and microservices."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500">Date</label>
              <input
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                placeholder="20 June 2026"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500">Time</label>
              <input
                required
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                placeholder="10:00 AM – 1:00 PM"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500">Location</label>
              <input
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                placeholder="Mumbai"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              >
                <option value="Showcase">Showcase</option>
                <option value="Hands-on">Hands-on</option>
                <option value="Conference">Conference</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-teal-700 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AuthModal({ isOpen, mode, onClose, onSwitchMode }) {
  const { login, register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-xl font-bold text-slate-900">
            {mode === 'login' ? 'Sign in to Pathlog' : 'Create an Account'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500">Your Full Name</label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                placeholder="Jane Doe"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500">Email Address</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              placeholder="jane@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500">Password</label>
            <input
              required
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              placeholder="At least 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-teal-700 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
          >
            {submitting ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <p className="text-center text-xs text-slate-500">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={onSwitchMode}
              className="font-semibold text-teal-700 hover:underline"
            >
              {mode === 'login' ? 'Register here' : 'Sign in'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

function EventsPage() {
  const { events, loading, error, retry, registrationCount } = useEvents();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'login' });
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  if (loading) return <div className="min-h-screen bg-slate-50 p-10 text-center text-slate-600">Loading events from MongoDB Atlas…</div>;
  if (error)
    return (
      <div className="min-h-screen bg-slate-50 p-10 text-center">
        <p className="font-bold text-red-600">Unable to load events</p>
        <p className="mt-2 text-slate-600">{error}</p>
        <button onClick={retry} className="mt-4 rounded-xl bg-teal-700 px-4 py-2 font-semibold text-white">
          Retry
        </button>
      </div>
    );

  const categories = ['All', ...new Set(events.map((event) => event.category))];
  const query = searchQuery.toLowerCase();
  const filteredEvents = events.filter(
    (event) =>
      [event.title, event.description, event.location].some((field) => field?.toLowerCase().includes(query)) &&
      (selectedCategory === 'All' || event.category === selectedCategory)
  );

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 md:bg-slate-50">
      {/* Navigation Bar */}
      <header className="border-b bg-white sticky top-0 z-40">
        <nav className="mx-auto flex max-w-6xl items-center justify-between p-4 md:p-6 lg:p-8">
          <div className="flex items-center gap-3">
            <a href="#top" className="text-lg font-extrabold text-slate-900">
              Pathlog <span className="font-medium text-teal-600">Labs</span>
            </a>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
              Experiment 6
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-800">
                  <UserIcon size={14} className="text-slate-500" />
                  <span>{user.name}</span>
                  {isAdmin && (
                    <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                      Admin
                    </span>
                  )}
                </div>

                {isAdmin && (
                  <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 transition"
                  >
                    <PlusCircle size={15} /> Add Event
                  </button>
                )}

                <button
                  onClick={logout}
                  className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAuthModal({ isOpen: true, mode: 'login' })}
                  className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <LogIn size={14} /> Sign in
                </button>
                <button
                  onClick={() => setAuthModal({ isOpen: true, mode: 'register' })}
                  className="flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 transition"
                >
                  <UserPlus size={14} /> Register
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main id="top">
        <section className="mx-auto flex max-w-6xl flex-col justify-between gap-8 p-4 py-12 md:flex-row md:p-6 lg:p-8">
          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-teal-700">
              Role-Based Access Control · Secure JWT
            </p>
            <h1 className="text-2xl font-extrabold md:text-4xl lg:text-5xl">
              Turn shared knowledge into <span className="text-teal-700">real impact.</span>
            </h1>
            <p className="mt-5 text-slate-600 md:text-lg">
              Authenticated events management backed by MongoDB Atlas, bcrypt password hashing, and role-based permissions.
            </p>
          </div>
          <div className="w-full rounded-2xl bg-slate-900 p-6 text-white md:w-72 md:p-8 shadow-sm">
            <p className="text-sm text-teal-300">My reservations</p>
            <p className="mt-2 text-4xl font-extrabold">{registrationCount}</p>
            <p className="text-slate-300 text-sm mt-1">events reserved in this browser session</p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl p-4 pb-16 md:p-6 lg:p-8">
          <RegistrationSummary />

          <div className="mb-6 flex flex-col gap-3 md:flex-row">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search title, description, or location"
              aria-label="Search events"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-teal-100"
            />
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    selectedCategory === category
                      ? 'bg-teal-700 text-white'
                      : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center border border-slate-200">
              <p className="font-bold text-slate-700">No matching events</p>
              <button onClick={resetFilters} className="mt-3 text-teal-700 underline text-sm">
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={authModal.isOpen}
        mode={authModal.mode}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        onSwitchMode={() =>
          setAuthModal((prev) => ({
            ...prev,
            mode: prev.mode === 'login' ? 'register' : 'login',
          }))
        }
      />

      <CreateEventModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <EventProvider>
        <EventsPage />
      </EventProvider>
    </AuthProvider>
  );
}
