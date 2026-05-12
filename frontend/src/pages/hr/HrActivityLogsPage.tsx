import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGetActivityLogs } from '@/hooks/useQueries';
import { normalizeApiResponse } from '@/utils/apiResponseHandler';
import { Card, LoadingSpinner, EmptyState } from '@/components/common';

export default function HrActivityLogsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'Admin') navigate('/', { replace: true });
  }, [user, navigate]);

  const [search, setSearch] = useState('');
  const { data, isLoading, refetch } = useGetActivityLogs();
  const logs = normalizeApiResponse(data || []);

  const filtered = useMemo(() => {
    const arr = logs.filter((l: any) => (l.role || '').toLowerCase() !== 'admin');
    if (!search) return arr;
    const q = search.toLowerCase();
    return arr.filter((l: any) => (l.employee_name || '').toLowerCase().includes(q) || (l.action || '').toLowerCase().includes(q) || (l.details || '').toLowerCase().includes(q));
  }, [logs, search]);

  return (
    <div className="p-4 lg:p-6 lg:ml-64 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold">Activity Logs</h1>
          <p className="text-sm text-gray-600">Activities from employees and HR (admin entries hidden).</p>
        </div>
        <div className="w-full md:w-auto">
          <input className="input-field w-full md:w-72" placeholder="Search logs" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center p-8"><LoadingSpinner /></div>
        ) : !filtered.length ? (
          <EmptyState title="No activity" description="No activity logs found." />
        ) : (
          <div className="space-y-2">
            {filtered.map((l: any) => (
              <div key={l.id} className="p-3 border rounded">
                <div className="flex flex-col md:flex-row md:justify-between gap-2">
                  <div>
                    <div className="font-semibold">{l.employee_name || 'Unknown'}</div>
                    <div className="text-sm text-gray-500">{l.action} — {l.details}</div>
                  </div>
                  <div className="text-sm text-gray-600">{new Date(l.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
