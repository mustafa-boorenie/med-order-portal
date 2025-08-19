'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface UserRow {
  id: string;
  email: string;
  role: 'ADMIN' | 'DOCTOR' | 'PATIENT';
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'DOCTOR' | 'PATIENT'>('PATIENT');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'DOCTOR' | 'PATIENT'>('ALL');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      const resp = await fetch('/api/admin/users', { cache: 'no-store' });
      const data = await resp.json();
      setUsers(Array.isArray(data) ? data : []);
      setLoading(false);
    };
    load();
  }, []);

  const refresh = async () => {
    setLoading(true);
    const resp = await fetch('/api/admin/users', { cache: 'no-store' });
    const data = await resp.json();
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newEmail) return;
    await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, role: newRole }),
    });
    setNewEmail('');
    setNewRole('PATIENT');
    await refresh();
  };

  const handleRoleChange = async (id: string, role: 'ADMIN' | 'DOCTOR' | 'PATIENT') => {
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    await refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    await refresh();
  };

  const visibleUsers = users.filter((u) => {
    const matchesQuery = query
      ? [u.email, u.role, new Date(u.createdAt).toLocaleString()]
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase())
      : true;
    const matchesRole = roleFilter === 'ALL' ? true : u.role === roleFilter;
    const created = new Date(u.createdAt).getTime();
    const minOk = fromDate ? created >= new Date(fromDate).getTime() : true;
    const maxOk = toDate ? created <= new Date(toDate).getTime() + 24 * 60 * 60 * 1000 - 1 : true;
    return matchesQuery && matchesRole && minOk && maxOk;
  });

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <h1 className="text-3xl font-bold text-gray-900">Users</h1>
              <a href="/admin" className="btn btn-secondary">Back</a>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="card">
            {loading ? (
              <div className="p-8 text-center">Loading...</div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-end">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">Search</label>
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      placeholder="Search by any field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Role</label>
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value as any)}
                      className="border rounded px-3 py-2"
                    >
                      <option value="ALL">All</option>
                      <option value="PATIENT">PATIENT</option>
                      <option value="DOCTOR">DOCTOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">From</label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">To</label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="border rounded px-3 py-2"
                    />
                  </div>
                  <button
                    onClick={refresh}
                    className="btn"
                    title="Refresh data"
                  >
                    Refresh
                  </button>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">Email</label>
                    <input
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Role</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="border rounded px-3 py-2"
                    >
                      <option value="PATIENT">PATIENT</option>
                      <option value="DOCTOR">DOCTOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <button onClick={handleCreate} className="btn btn-primary">Add User</button>
                </div>
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {visibleUsers.map(u => (
                      <tr key={u.id}>
                        <td className="px-6 py-4 text-sm text-gray-900">{u.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                            className="border rounded px-2 py-1"
                          >
                            <option value="PATIENT">PATIENT</option>
                            <option value="DOCTOR">DOCTOR</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(u.createdAt).toLocaleString()}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:text-red-800">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}


