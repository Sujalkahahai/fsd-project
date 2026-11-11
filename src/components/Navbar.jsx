import {
  Compass,
  LayoutDashboard,
  BookOpen,
  History,
  Users2,
  BookmarkCheck,
  Shield,
  LogOut,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Navbar({ activeTab, setActiveTab, onOpenAuth }) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'subjects', label: 'Subjects & Topics', icon: BookOpen },
    { id: 'revision', label: 'Revision Queue', icon: History },
    { id: 'studyrooms', label: 'Study Rooms', icon: Users2 },
    { id: 'templates', label: 'Curated Roadmaps', icon: BookmarkCheck },
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'Admin Panel', icon: Shield });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
            <Compass size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900">Pathlog</span>
            <span className="hidden text-xs text-slate-500 sm:block">Evidence-Based Learning</span>
          </div>
        </div>

        {/* Navigation Tabs (if authenticated) */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon size={15} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* User actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <>
              <NotificationBell />

              <div className="hidden sm:flex flex-col items-end pl-2">
                <span className="text-xs font-bold text-slate-900 leading-tight">{user.name}</span>
                <span className="text-[10px] font-semibold text-indigo-600 capitalize">
                  {user.role === 'admin' ? 'Administrator' : 'Learner'}
                </span>
              </div>

              <button
                type="button"
                onClick={logout}
                title="Log out"
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-red-600 transition shadow-sm"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
              >
                <LogIn size={15} />
                Sign In
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition shadow-sm shadow-indigo-200"
              >
                <UserPlus size={15} />
                Register
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile nav bar for small screens */}
      {isAuthenticated && (
        <div className="flex md:hidden overflow-x-auto border-t border-slate-100 bg-slate-50 px-2 py-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}

