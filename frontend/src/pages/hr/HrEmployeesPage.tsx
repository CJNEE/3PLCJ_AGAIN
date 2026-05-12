import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGetEmployees } from '@/hooks/useQueries';
import { normalizeApiResponse, getApiResponseCount } from '@/utils/apiResponseHandler';
import { Card, LoadingSpinner, Button, EmptyState } from '@/components/common';

export default function HrEmployeesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (user?.role === 'Admin') navigate('/', { replace: true });
  }, [user, navigate]);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 12;

  const { data, isLoading, refetch } = useGetEmployees();
  const employees = normalizeApiResponse(data);

  const filtered = useMemo(() => {
    if (!search) return employees;
    const q = search.toLowerCase();
    return employees.filter((e: any) => (e.full_name || '').toLowerCase().includes(q) || (e.employee_id || '').toLowerCase().includes(q) || (e.position || '').toLowerCase().includes(q));
  }, [employees, search]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const visible = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page]);

  return (
    <div className="p-4 lg:p-6 lg:ml-64 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-sm text-gray-600">View and manage employees (HR view).</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search name, id or position" className="input-field flex-1 md:flex-none" />
          <Button variant="primary" onClick={() => refetch()}>Refresh</Button>
        </div>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center p-8"><LoadingSpinner /></div>
        ) : !visible.length ? (
          <EmptyState title="No employees" description="No employees found." />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="text-left text-sm text-gray-500">
                    <th className="py-2">Name</th>
                    <th className="py-2">Employee ID</th>
                    <th className="py-2">Position</th>
                    <th className="py-2">Hub</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((emp: any) => (
                    <tr key={emp.id} className="border-t">
                      <td className="py-3">{emp.full_name || `${emp.firstname || ''} ${emp.lastname || ''}`}</td>
                      <td className="py-3">{emp.employee_id || '—'}</td>
                      <td className="py-3">{emp.position || '—'}</td>
                      <td className="py-3">{emp.hub_name || (emp.hub && emp.hub.name) || '—'}</td>
                      <td className="py-3">{emp.status || '—'}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="secondary" onClick={() => navigate(`/hr/employees/${emp.id}`)}>View</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="block md:hidden grid grid-cols-1 gap-3">
              {visible.map((emp: any) => (
                <div key={emp.id} className="p-3 border rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{emp.full_name || `${emp.firstname || ''} ${emp.lastname || ''}`}</div>
                      <div className="text-sm text-gray-500">{emp.position || '—'}</div>
                      <div className="text-xs text-gray-400">{emp.hub_name || (emp.hub && emp.hub.name) || '—'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">{emp.employee_id || '—'}</div>
                      <div className="mt-2"><Button size="sm" variant="secondary" onClick={() => navigate(`/hr/employees/${emp.id}`)}>View</Button></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Pagination */}
      <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="text-sm text-gray-600">Showing {Math.min((page-1)*perPage+1, total)}-{Math.min(page*perPage, total)} of {total}</div>
        <div className="flex items-center gap-2">
          <Button size="sm" disabled={page<=1} onClick={() => setPage((p) => Math.max(1, p-1))}>Prev</Button>
          <div className="px-3 py-1 border rounded">{page} / {totalPages}</div>
          <Button size="sm" disabled={page>=totalPages} onClick={() => setPage((p) => Math.min(totalPages, p+1))}>Next</Button>
        </div>
      </div>
    </div>
  );
}
