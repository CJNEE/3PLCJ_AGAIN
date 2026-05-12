import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGetSecurityAlerts } from '@/hooks/useQueries';
import { normalizeApiResponse } from '@/utils/apiResponseHandler';
import { Card, LoadingSpinner, EmptyState, Button } from '@/components/common';

export default function HrSecurityAlertsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'Admin') navigate('/', { replace: true });
  }, [user, navigate]);

  const [search, setSearch] = useState('');
  const { data, isLoading, refetch } = useGetSecurityAlerts();
  const alerts = normalizeApiResponse(data || []);

  const filtered = useMemo(() => {
    const arr = alerts.filter((a: any) => (a.role || '').toLowerCase() !== 'admin');
    if (!search) return arr;
    const q = search.toLowerCase();
    return arr.filter((a: any) => (a.employee_name || '').toLowerCase().includes(q) || (a.description || '').toLowerCase().includes(q));
  }, [alerts, search]);

  return (
    <div className="p-4 lg:p-6 lg:ml-64 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold">Security Alerts</h1>
          <p className="text-sm text-gray-600">Alerts from employees and hubs (admin alerts hidden).</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <input className="input-field w-full md:w-72" placeholder="Search alerts" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button onClick={() => refetch()}>Refresh</Button>
        </div>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center p-8"><LoadingSpinner /></div>
        ) : !filtered.length ? (
          <EmptyState title="No alerts" description="No security alerts found." />
        ) : (
          <div className="space-y-2">
            {filtered.map((a: any) => (
              <div key={a.id} className="p-3 border rounded">
                <div className="flex flex-col md:flex-row md:justify-between gap-2">
                  <div>
                    <div className="font-semibold">{a.employee_name || 'Unknown'}</div>
                    <div className="text-sm text-gray-500">{a.description}</div>
                  </div>
                  <div className="text-sm text-gray-600">{new Date(a.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
