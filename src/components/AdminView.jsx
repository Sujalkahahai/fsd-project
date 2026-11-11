import { useState, useEffect } from 'react';
import {
  Shield,
  RefreshCw,
  Search,
} from 'lucide-react';
import api from '../services/api';

export default function AdminView() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/users'),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (usersRes.success) setUsers(usersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleSuspend = async (user) => {
    const action = user.isSuspended ? 'unsuspend' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${action} ${user.email}?`)) return;

    try {
      setUpdatingId(user.id);
      const res = await api.patch(`/api/admin/users/${user.id}/suspend`);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isSuspended: res.data.isSuspended } : u))
        );
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Shield size={14} />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
            Platform Moderation
          </span>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Admin Control Panel</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor platform metrics, manage registered user accounts, and enforce role-based access rules.
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="animate-spin text-indigo-600" size={24} />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium">Total Users</span>
              <p className="mt-2 text-2xl font-bold text-slate-900">{stats?.usersCount || 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium">Total Subjects</span>
              <p className="mt-2 text-2xl font-bold text-slate-900">{stats?.subjectsCount || 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium">Total Topics</span>
              <p className="mt-2 text-2xl font-bold text-slate-900">{stats?.topicsCount || 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium">Practice Logs</span>
              <p className="mt-2 text-2xl font-bold text-slate-900">{stats?.practiceCount || 0}</p>
            </div>
            <div className="col-span-2 md:col-span-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium">Assessments</span>
              <p className="mt-2 text-2xl font-bold text-slate-900">{stats?.assessmentsCount || 0}</p>
            </div>
          </div>

          {/* User Moderation Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-base font-bold text-slate-900">User Accounts</h2>
                <p className="text-xs text-slate-500">Manage account access and suspensions</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-5">User</th>
                    <th className="py-3 px-5">Role</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5">Joined</th>
                    <th className="py-3 px-5 text-right">Moderation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No users match search criteria
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-5">
                          <p className="font-bold text-slate-900">{user.name}</p>
                          <p className="text-[11px] text-slate-400">{user.email}</p>
                        </td>
                        <td className="py-3 px-5">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                              user.role === 'admin'
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              user.isSuspended
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {user.isSuspended ? 'Suspended' : 'Active'}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-slate-500">
                          {new Date(user.createdAt).toLocaleDateString(undefined, {
                            dateStyle: 'medium',
                          })}
                        </td>
                        <td className="py-3 px-5 text-right">
                          {user.role === 'admin' ? (
                            <span className="text-[10px] text-slate-400 italic">Protected</span>
                          ) : (
                            <button
                              type="button"
                              disabled={updatingId === user.id}
                              onClick={() => handleToggleSuspend(user)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                user.isSuspended
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              }`}
                            >
                              {updatingId === user.id
                                ? 'Updating...'
                                : user.isSuspended
                                ? 'Unsuspend'
                                : 'Suspend User'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
