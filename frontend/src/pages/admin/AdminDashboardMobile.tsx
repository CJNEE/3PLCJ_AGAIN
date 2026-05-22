import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGetEmployees, useGetHubs, useGetAttendance, useGetSecurityAlerts, useGetActivityLogs } from '@/hooks/useQueries';
import { Card, Badge, EmptyState, LoadingSpinner, ErrorMessage } from '@/components/common';
import { Sidebar } from '@/components/Sidebar'; // for nav items if needed
import { MobileHeader } from '@/components/MobileHeader';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { normalizeApiResponse } from '@/utils/apiResponseHandler';

// Color mapping for status (same as desktop)
const STATUS_COLORS: Record<string, string> = {
  Active: '#10B981',
  AWOL: '#F59E0B',
  Blacklist: '#EF4444',
  Resign: '#3B82F6',
};

export const AdminDashboardMobile = () => {
  const navigate = useNavigate();
  const { employee } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data queries – reuse the same hooks as desktop
  const employeesQuery = useGetEmployees({ hub_id: null });
  const hubsQuery = useGetHubs();
  const activityLogsQuery = useGetActivityLogs({ limit: 5 });

  const isLoading = employeesQuery.isLoading || hubsQuery.isLoading;

  // Process data – same logic as desktop
  const allEmployees = normalizeApiResponse(employeesQuery.data);
  const totalEmployees = allEmployees.length;
  const totalHubs = hubsQuery.data?.length || 0;

  const statusData = React.useMemo(() => {
    const statuses: Record<string, number> = {};
    allEmployees.forEach((emp: any) => {
      const status = emp.status || 'Active';
      statuses[status] = (statuses[status] || 0) + 1;
    });
    return Object.entries(statuses).map(([name, value]) => ({ name, value }));
  }, [allEmployees]);

  return (
    <>
      {/* Mobile only wrapper – hide on lg+ */}
      <div className="lg:hidden flex flex-col min-h-screen bg-[#111827] text-white">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Hero stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="flex flex-col items-center p-4 bg-[#0B1220] rounded-2xl shadow-lg">
              <p className="text-xs uppercase text-gray-400">Total Employees</p>
              <p className="text-4xl font-bold text-red-600 mt-2">{totalEmployees}</p>
            </Card>
            <Card className="flex flex-col items-center p-4 bg-[#0B1220] rounded-2xl shadow-lg">
              <p className="text-xs uppercase text-gray-400">Total Hubs</p>
              <p className="text-4xl font-bold text-red-600 mt-2">{totalHubs}</p>
            </Card>
          </div>

          {/* Employee Status Pie Chart */}
          <Card className="p-4 bg-[#0B1220] rounded-2xl shadow-lg">
            <h2 className="text-sm font-medium text-gray-300 mb-2">Employee Status</h2>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} label>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#3B82F6'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center">No status data</p>
            )}
          </Card>

          {/* Recent Activity Logs */}
          <Card className="p-4 bg-[#0B1220] rounded-2xl shadow-lg">
            <h2 className="text-sm font-medium text-gray-300 mb-2">Recent Activity</h2>
            {activityLogsQuery.isLoading ? (
              <LoadingSpinner />
            ) : activityLogsQuery.data && activityLogsQuery.data.length > 0 ? (
              <ul className="space-y-2 overflow-y-auto max-h-48">
                {activityLogsQuery.data.map((log: any, idx: number) => (
                  <li key={idx} className="text-xs text-gray-200">
                    <span className="font-medium">{log.action}</span> – {log.description}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No activity logs" />
            )}
          </Card>
        </main>
        <MobileBottomNav />
      </div>
    </>
  );
};
