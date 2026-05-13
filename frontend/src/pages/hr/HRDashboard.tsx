import { useMemo, useState } from 'react';
import { Card, Badge } from '@/components/common';
import { useGetEmployees, useGetAttendance, useGetActivityLogs } from '@/hooks/useQueries';
import { useAuth } from '@/hooks/useAuth';
import { normalizeApiResponse } from '@/utils/apiResponseHandler';
import { Sidebar } from '@/components/Sidebar';
import { formatDistanceToNow } from 'date-fns';

const EMPLOYMENT_BAR_COLORS: Record<string, string> = {
  'Full-time': '#2563EB',
  OCW: '#3B82F6',
};

export const HRDashboard = () => {
  const { employee } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const employeesQuery = useGetEmployees();
  const attendanceQuery = useGetAttendance({ date: today });
  const activityLogsQuery = useGetActivityLogs({ limit: 12 });

  const employees = normalizeApiResponse(employeesQuery.data);
  const attendance = normalizeApiResponse(attendanceQuery.data);
  const activityLogs = normalizeApiResponse(activityLogsQuery.data);

  const activeEmployees = useMemo(
    () => employees.filter((e: any) => e.status === 'Active'),
    [employees]
  );

  const employmentTypeData = useMemo(() => {
    const types: Record<string, number> = {};
    activeEmployees.forEach((emp: any) => {
      const t = emp.employment_type || 'Unknown';
      types[t] = (types[t] || 0) + 1;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [activeEmployees]);

  const clockedInIds = useMemo(() => {
    const ids = new Set<number>();
    attendance.forEach((a: any) => {
      if (a.clock_in_time && a.employee) ids.add(Number(a.employee));
    });
    return ids;
  }, [attendance]);

  const presentToday = activeEmployees.filter((e: any) => clockedInIds.has(Number(e.id))).length;
  const absentToday = Math.max(0, activeEmployees.length - presentToday);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="p-4 lg:p-6 lg:ml-64 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">HR Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Welcome back, {employee?.firstname}! Same overview style as admin; admin accounts and admin-only activity are hidden from lists.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Active employees</p>
            <p className="text-3xl font-bold text-primary mt-2">{activeEmployees.length}</p>
          </Card>
          <Card>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Present today</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{presentToday}</p>
          </Card>
          <Card>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Absent today</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{absentToday}</p>
            <p className="text-xs text-gray-500 mt-1">No clock-in counts as absent</p>
          </Card>
          <Card>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Employment types</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{employmentTypeData.length}</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-4">
            <p className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-4">Employment Type</p>
            {employmentTypeData.length > 0 ? (
              <div className="space-y-4">
                {employmentTypeData.map((entry) => {
                  const max = Math.max(...employmentTypeData.map((d) => d.value), 1);
                  const pct = Math.round((entry.value / max) * 100);
                  return (
                    <div key={entry.name} className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-800 dark:text-gray-200">{entry.name}</span>
                        <span className="text-gray-600 dark:text-gray-400 tabular-nums">
                          {entry.value} <span className="text-gray-400">({pct}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            backgroundColor: EMPLOYMENT_BAR_COLORS[entry.name] || '#3B82F6',
                            width: `${pct}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No employment type data</p>
            )}
          </Card>

          <Card className="p-4">
            <p className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-4">Recent activity</p>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {activityLogs.length === 0 ? (
                <p className="text-sm text-gray-500">No recent activity</p>
              ) : (
                activityLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="flex justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-2 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {log.action?.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{log.details}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                      {log.created_at
                        ? formatDistanceToNow(new Date(log.created_at), { addSuffix: true })
                        : ''}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <Card>
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Employees (HR scope)</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Position</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp: any) => (
                  <tr key={emp.id} className="border-b dark:border-gray-700">
                    <td className="px-4 py-3 text-sm">{emp.full_name}</td>
                    <td className="px-4 py-3 text-sm">{emp.position}</td>
                    <td className="px-4 py-3 text-sm">{emp.role}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={emp.status === 'Active' ? 'success' : 'warning'}>{emp.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
